import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeTournamentList, scrapeTournamentDetails } from "@/lib/scraper";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let logId: string | null = null;

  try {
    const log = await prisma.scrapeLog.create({ data: {} });
    logId = log.id;

    const tournaments = await scrapeTournamentList();

    let updated = 0;
    for (const t of tournaments) {
      await prisma.tournament.upsert({
        where: { chessResultsId: t.chessResultsId },
        update: {
          name: t.name,
          city: t.city,
          startDate: t.startDate ?? null,
          timeControl: t.timeControl,
          status: t.status,
          url: t.url,
          playerCount: t.playerCount ?? null,
          lastScrapedAt: new Date(),
        },
        create: {
          chessResultsId: t.chessResultsId,
          name: t.name,
          city: t.city,
          startDate: t.startDate ?? null,
          timeControl: t.timeControl,
          status: t.status,
          url: t.url,
          playerCount: t.playerCount ?? null,
        },
      });
      updated++;
    }

    // Fetch details (accurate dates, rounds, organizer) for tournaments missing startDate.
    // Capped at 15/run in batches of 5 to stay within serverless timeout.
    const needsDates = await prisma.tournament.findMany({
      where: { startDate: null },
      select: { chessResultsId: true, url: true },
      take: 15,
    });

    const BATCH_SIZE = 5;
    for (let i = 0; i < needsDates.length; i += BATCH_SIZE) {
      const batch = needsDates.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (t) => {
          try {
            const details = await scrapeTournamentDetails(t.url);
            await prisma.tournament.update({
              where: { chessResultsId: t.chessResultsId },
              data: {
                startDate: details.startDate ?? null,
                endDate: details.endDate ?? null,
                roundCount: details.roundCount ?? null,
                organizer: details.organizer ?? null,
                chiefArbiter: details.chiefArbiter ?? null,
                averageRating: details.averageRating ?? null,
              },
            });
          } catch {
            // Non-fatal: skip this tournament's details on failure
          }
        })
      );
    }

    await prisma.scrapeLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        status: "success",
        tournamentsFound: tournaments.length,
        tournamentsUpdated: updated,
      },
    });

    return NextResponse.json({
      success: true,
      found: tournaments.length,
      updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Scrape failed:", error);

    if (logId) {
      await prisma.scrapeLog
        .update({
          where: { id: logId },
          data: { finishedAt: new Date(), status: "error", message },
        })
        .catch(() => {});
    }

    return NextResponse.json(
      { error: "Scrape failed", message },
      { status: 500 }
    );
  }
}


