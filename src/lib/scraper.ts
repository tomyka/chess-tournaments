import * as cheerio from "cheerio";
import { parseTimeControl } from "./scraper-utils";
import type { ScrapedTournament } from "@/types/tournament";

const BASE_URL = "https://chess-results.com";

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
  // Try the federation page first (reliable, returns ~50 tournaments)
  try {
    console.log("Scraping federation page (stable source)...");
    return await scrapeFederationPageFallback();
  } catch (error) {
    console.error("Federation scraper error:", error);
    return [];
  }
}

// Fallback: Scrape from federation page if Puppeteer fails
async function scrapeFederationPageFallback(): Promise<ScrapedTournament[]> {
  const fedUrl = `${BASE_URL}/fed.aspx?lan=1&fed=LTU`;

  const response = await fetch(fedUrl, {
    headers: {
      "User-Agent": "ChessTournamentsLT/1.0 (educational project)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch federation list: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const tournaments: ScrapedTournament[] = [];

  // Rows with Lithuania tournaments
  $("table.CRs2 tr.LTU").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const link = $(cells[1]).find("a");
    if (!link.length) return;

    const name = link.text().trim();
    const href = link.attr("href");
    if (!name || !href) return;

    const idMatch = href.match(/tnr(\d+)/);
    if (!idMatch) return;

    const chessResultsId = `tnr${idMatch[1]}`;
    const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;

    const tcText = $(cells[2]).find("small").first().text().trim();
    const timeControl = parseTimeControl(tcText) as "STANDARD" | "RAPID" | "BLITZ" | "UNKNOWN";

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
      status: status as "NOT_STARTED" | "IN_PROGRESS" | "FINISHED",
      url,
    });
  });

  return tournaments;
}

export async function scrapeTournamentDetails(
  url: string
): Promise<Partial<ScrapedTournament>> {
  const detailUrl = url.includes("turdet=")
    ? url
    : `${url}${url.includes("?") ? "&" : "?"}turdet=YES`;

  const response = await fetch(detailUrl, {
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

  // Details table uses plain <td class="CR"> rows with label/value pairs
  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;

    const label = $(cells[0]).text().trim().toLowerCase();
    const value = $(cells[1]).text().trim();

    if (label === "date") {
      // Format: "2026/04/25" or "2026/04/25 .. 2026/04/27"
      const dateMatches = value.match(/(\d{4}\/\d{2}\/\d{2})/g);
      if (dateMatches) {
        const d = new Date(dateMatches[0].replace(/\//g, "-"));
        if (!isNaN(d.getTime())) details.startDate = d;
        if (dateMatches.length > 1) {
          const e = new Date(dateMatches[1].replace(/\//g, "-"));
          if (!isNaN(e.getTime())) details.endDate = e;
        }
      }
    }
    if (label.includes("chief arbiter")) details.chiefArbiter = value;
    if (label.includes("organizer")) details.organizer = value.split(",")[0].trim();
    if (label.includes("number of rounds"))
      details.roundCount = parseInt(value) || undefined;
  });

  return details;
}
