import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeTournamentList } from "@/lib/scraper";

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
        },
      });
      updated++;
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
        .catch(() => {}); // don't mask original error
    }

    return NextResponse.json(
      { error: "Scrape failed", message },
      { status: 500 }
    );
  }
}

