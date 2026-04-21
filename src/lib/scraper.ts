import * as cheerio from "cheerio";
import { parseTimeControl, parseStatus } from "./scraper-utils";
import type { ScrapedTournament } from "@/types/tournament";

const BASE_URL = "https://chess-results.com";
const LTU_FED_URL = `${BASE_URL}/fed.aspx?lan=1&fed=LTU`;

function parseDateFromName(name: string): { city?: string } {
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

  return { city };
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

  // The tournament table contains rows with tournament data
  $("table.CRs1 tr, table.CRs2 tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 4) return;

    const link = $(cells[1]).find("a");
    if (!link.length) return;

    const name = link.text().trim();
    const href = link.attr("href");
    if (!name || !href) return;

    // Extract chess-results ID from URL
    const idMatch = href.match(/tnr(\d+)/);
    if (!idMatch) return;

    const chessResultsId = `tnr${idMatch[1]}`;
    const url = href.startsWith("http") ? href : `${BASE_URL}/${href}`;

    // Parse time control from the status column text
    const statusText = $(cells[2]).text().trim();
    const timeControlMatch = statusText.match(/^(St|Rp|Bz)/i);
    const timeControl = timeControlMatch
      ? parseTimeControl(timeControlMatch[1])
      : "UNKNOWN";

    const lastUpdate = $(cells[3]).text().trim();
    const status = parseStatus(lastUpdate);
    const { city } = parseDateFromName(name);

    tournaments.push({
      chessResultsId,
      name,
      city,
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
