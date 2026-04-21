import * as cheerio from "cheerio";
import { parseTimeControl, parseStatus } from "./scraper-utils";
import type { ScrapedTournament } from "@/types/tournament";

const BASE_URL = "https://chess-results.com";
const LTU_FED_URL = `${BASE_URL}/fed.aspx?lan=1&fed=LTU`;

function parseDateFromName(name: string): { city?: string; startDate?: Date } {
  const cityPatterns = [
    /\(([A-Za-zÀ-žĀ-ž\s]+),/,
    /(?:^|\s)(Vilnius|Kaunas|Klaipėda|Šiauliai|Panevėžys|Druskininkai|Visaginas|Alytus)/i,
  ];

  let city: string | undefined;
  for (const pattern of cityPatterns) {
    const match = name.match(pattern);
    if (match) {
      city = match[1].trim();
      break;
    }
  }

  let startDate: Date | undefined;

  // Pattern 1: full ISO date like "2026-04-23" anywhere in the name
  const isoMatch = name.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    const d = new Date(isoMatch[1]);
    if (!isNaN(d.getTime())) startDate = d;
  }

  // Pattern 2: "(City, MM-DD)" — month-day in closing paren after a comma
  if (!startDate) {
    const shortDateMatch = name.match(/,\s*(\d{2}-\d{2})\s*\)/);
    if (shortDateMatch) {
      const year = new Date().getFullYear();
      const d = new Date(`${year}-${shortDateMatch[1]}`);
      if (!isNaN(d.getTime())) startDate = d;
    }
  }

  // Pattern 3: "(MM DD-DD)" style like "(07 03-06)" where MM is month, DD-DD is day range
  if (!startDate) {
    const monthDayRangeMatch = name.match(/\((\d{2})\s+\d{2}-\d{2}\)/);
    if (monthDayRangeMatch) {
      const year = new Date().getFullYear();
      const month = monthDayRangeMatch[1];
      // Use the first day in the range
      const dayMatch = name.match(/\((\d{2})\s+(\d{2})-\d{2}\)/);
      if (dayMatch) {
        const d = new Date(`${year}-${dayMatch[1]}-${dayMatch[2]}`);
        if (!isNaN(d.getTime())) startDate = d;
      }
    }
  }

  return { city, startDate };
}

export async function scrapeTournamentList(): Promise<ScrapedTournament[]> {
  const response = await fetch(LTU_FED_URL, {
    headers: {
      "User-Agent": "ChessTournamentsLT/1.0 (educational project)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tournament list: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const tournaments: ScrapedTournament[] = [];

  // Rows are <tr class="CRg1 LTU"> / <tr class="CRg2 LTU"> inside <table class="CRs2">
  // Each row has 3 cells: [No., Name+link, TimeControl+Status]
  $("table.CRs2 tr.LTU").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const link = $(cells[1]).find("a");
    if (!link.length) return;

    const name = link.text().trim();
    const href = link.attr("href");
    if (!name || !href) return;

    // Extract chess-results ID from URL (e.g. tnr1376296)
    const idMatch = href.match(/tnr(\d+)/);
    if (!idMatch) return;

    const chessResultsId = `tnr${idMatch[1]}`;
    const url = href.startsWith("http") ? href : `${BASE_URL}/${href}`;

    // Time control is in <small>Rp</small> / <small>St</small> / <small>Bz</small>
    const tcText = $(cells[2]).find("small").first().text().trim();
    const timeControl = parseTimeControl(tcText);

    // Status is derived from the div class: p_5=not started, p_17=playing, p_18=finished
    const statusClass = $(cells[2]).find("div").first().attr("class") ?? "";
    const status = statusClass.includes("p_17")
      ? "IN_PROGRESS"
      : statusClass.includes("p_18")
      ? "FINISHED"
      : "NOT_STARTED";

    const { city, startDate } = parseDateFromName(name);

    tournaments.push({
      chessResultsId,
      name,
      city,
      startDate,
      timeControl,
      status,
      url,
    });
  });

  return tournaments;
}

export async function scrapeTournamentDetails(
  url: string
): Promise<Partial<ScrapedTournament>> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "ChessTournamentsLT/1.0 (educational project)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tournament details: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const details: Partial<ScrapedTournament> = {};

  // Extract details from the tournament info table
  $("table.CRs1 tr, table.CRs2 tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;

    const label = $(cells[0]).text().trim().toLowerCase();
    const value = $(cells[1]).text().trim();

    if (label.includes("chief arbiter")) details.chiefArbiter = value;
    if (label.includes("organizer")) details.organizer = value;
    if (label.includes("number of rounds")) details.roundCount = parseInt(value) || undefined;
    if (label.includes("number of players") || label.includes("players"))
      details.playerCount = parseInt(value) || undefined;
  });

  // Try extracting players from standing/ranking table
  details.players = [];
  $("table.CRs1 tr, table.CRs2 tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const rank = parseInt($(cells[0]).text().trim());
    if (isNaN(rank)) return;

    const nameCell = cells.length > 3 ? cells[3] : cells[1];
    const playerName = $(nameCell).text().trim();
    if (!playerName) return;

    details.players!.push({
      name: playerName,
      rank,
    });
  });

  return details;
}
