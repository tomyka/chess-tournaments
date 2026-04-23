import * as cheerio from "cheerio";
import { parseTimeControl } from "./scraper-utils";
import type { ScrapedTournament } from "@/types/tournament";

const BASE_URL = "https://s3.chess-results.com";
const SEARCH_URL = `${BASE_URL}/turniersuche.aspx?SNode=S0`;

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

// First, get the form with VIEWSTATE
async function getSearchFormData(): Promise<{
  viewstate: string;
  eventvalidation: string;
}> {
  const response = await fetch(SEARCH_URL, {
    headers: {
      "User-Agent": "ChessTournamentsLT/1.0 (educational project)",
    },
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  const viewstate =
    $('input[name="__VIEWSTATE"]').val() as string;
  const eventvalidation = $(
    'input[name="__EVENTVALIDATION"]'
  ).val() as string;

  return { viewstate, eventvalidation };
}

export async function scrapeTournamentList(): Promise<ScrapedTournament[]> {
  try {
    // Get form data first
    const { viewstate, eventvalidation } = await getSearchFormData();

    // Build form data for POST request
    const formData = new URLSearchParams();
    formData.append("__VIEWSTATE", viewstate);
    formData.append("__EVENTVALIDATION", eventvalidation);
    formData.append("ctl00$P1$combo_land", "LT"); // Lithuania
    formData.append("ctl00$P1$TextBox_maxlines", "500"); // Top 500
    formData.append("ctl00$P1$Button_search", "Search"); // Submit button

    // Make POST request to search
    const searchResponse = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "User-Agent": "ChessTournamentsLT/1.0 (educational project)",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!searchResponse.ok) {
      throw new Error(`Failed to search tournaments: ${searchResponse.status}`);
    }

    const html = await searchResponse.text();
    const $ = cheerio.load(html);
    const tournaments: ScrapedTournament[] = [];

    // Find tournament rows in the results
    // The results are typically in a table with alternating row classes
    $('table tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      // Look for links containing tournament references (tnr)
      const link = $(row).find('a[href*="tnr"]').first();
      if (!link.length) return;

      const name = link.text().trim();
      const href = link.attr('href') ?? '';
      if (!name || !href) return;

      // Extract tournament ID
      const idMatch = href.match(/tnr(\d+)/);
      if (!idMatch) return;

      const chessResultsId = `tnr${idMatch[1]}`;
      const url = href.startsWith('http') ? href : `https://chess-results.com/${href}`;

      // Try to parse time control from row
      const rowText = $(row).text().toUpperCase();
      let timeControl: "STANDARD" | "RAPID" | "BLITZ" | "UNKNOWN" = "UNKNOWN";
      if (rowText.includes("ST")) timeControl = "STANDARD";
      else if (rowText.includes("RP")) timeControl = "RAPID";
      else if (rowText.includes("BZ")) timeControl = "BLITZ";

      // Parse status from text
      let status: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED" = "NOT_STARTED";
      if (rowText.includes("FINISHED")) status = "FINISHED";
      else if (rowText.includes("IN PROGRESS")) status = "IN_PROGRESS";

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

    console.log(`Scraped ${tournaments.length} tournaments from search`);
    return tournaments;
  } catch (error) {
    console.error("Scraping error:", error);
    // Fallback to federation page if search fails
    console.log("Falling back to federation page...");
    return scrapeFederationPage();
  }
}

// Fallback: Scrape from federation page
async function scrapeFederationPage(): Promise<ScrapedTournament[]> {
  const fedUrl = "https://chess-results.com/fed.aspx?lan=1&fed=LTU";
  
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
    const url = href.startsWith("http")
      ? href
      : `https://chess-results.com${href}`;

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
