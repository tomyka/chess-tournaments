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
          averageRating: t.averageRating ?? null,
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
          averageRating: t.averageRating ?? null,
        },
      });
      updated++;
    }

    // Fetch details for ALL tournaments to ensure complete data
    // This should run for every tournament on every scrape
    const allTournaments = await prisma.tournament.findMany({
      select: { chessResultsId: true, url: true, name: true },
      take: 50, // Process up to 50 per run
    });

    if (allTournaments.length > 0) {
      console.log(`Fetching details for ${allTournaments.length} tournaments`);
    }

    const BATCH_SIZE = 5;
    let detailsUpdated = 0;
    
    for (let i = 0; i < allTournaments.length; i += BATCH_SIZE) {
      const batch = allTournaments.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (t) => {
          try {
            const details = await scrapeTournamentDetails(t.url);
            
            // Only update if we got new data
            if (details.playerCount || details.averageRating || details.startDate) {
              await prisma.tournament.update({
                where: { chessResultsId: t.chessResultsId },
                data: {
                  startDate: details.startDate ?? undefined,
                  endDate: details.endDate ?? undefined,
                  roundCount: details.roundCount ?? undefined,
                  organizer: details.organizer ?? undefined,
                  chiefArbiter: details.chiefArbiter ?? undefined,
                  averageRating: details.averageRating ?? undefined,
                  playerCount: details.playerCount ?? undefined,
                },
              });
              detailsUpdated++;
            }
          } catch (error) {
            console.error(`Failed to fetch details for ${t.name}:`, error);
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


