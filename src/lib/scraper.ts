import * as cheerio from "cheerio";
import { parseTimeControl } from "./scraper-utils";
import type { ScrapedTournament } from "@/types/tournament";
import { getBrowser, updateActivityTime, closeBrowser } from "./browser-manager";

const BASE_URL = "https://chess-results.com";
const SEARCH_URL = "https://s3.chess-results.com/turniersuche.aspx?SNode=S0";

/**
 * Fetch tournament details including player count and other info
 */
async function fetchTournamentDetails(url: string): Promise<{ playerCount?: number; date?: Date }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ChessTournamentsLT/1.0 (educational project)",
      },
    });
    
    if (!response.ok) return {};
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const result: { playerCount?: number; date?: Date } = {};
    
    // Look for date pattern YYYY/MM/DD
    const datePattern = /(\d{4})\/(\d{2})\/(\d{2})/;
    let dateMatch: RegExpMatchArray | null = null;
    $("td, div").each((_, elem) => {
      const text = $(elem).text();
      const match = text.match(datePattern);
      if (match && !dateMatch) {
        dateMatch = match;
      }
    });
    
    if (dateMatch) {
      const date = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
      if (!isNaN(date.getTime())) {
        result.date = date;
      }
    }
    
    // Count players by counting rows with class="CRg1" or "CRg2" (alternating row colors in standings table)
    // This includes all participants regardless of federation
    const playerRows = cheerio.load(html)('tr.CRg1, tr.CRg2');
    if (playerRows.length > 0) {
      result.playerCount = playerRows.length;
    }
    
    return result;
  } catch (error) {
    console.error(`Failed to fetch details for ${url}:`, error);
    return {};
  }
}

/**
 * Fetch the tournament date from its details page
 * Looks for pattern: "Date" label followed by "YYYY/MM/DD" format
 */
async function fetchTournamentDate(url: string): Promise<Date | undefined> {
  const { date } = await fetchTournamentDetails(url);
  return date;
}

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
  // The search page requires proper ASP.NET session/ViewState which cannot be reliably replicated
  // Even with persistent Playwright browser, the server silently fails to process form submissions
  // Falls back to federation page which is stable and reliable
  try {
    console.log("Scraping federation page (stable source)...");
    return await scrapeFederationPageFallback();
  } catch (error) {
    console.error("Federation scraper error:", error);
    return [];
  }
}

/**
 * Scrape the search page using a persistent browser session.
 * This approach maintains browser state across calls, allowing proper form interaction.
 */
async function scrapeSearchPageWithPersistentBrowser(): Promise<ScrapedTournament[]> {
  const browser = await getBrowser();
  updateActivityTime();

  // Create a new page context for this request
  const page = await browser.newPage();

  try {
    console.log("Navigating to search page...");
    await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500); // Let page JS execute

    // Check if we need to select country - it might already be selected from previous session
    const currentCountry = await page.inputValue("select[name*='combo_land']").catch(() => null);
    console.log("Current country selection:", currentCountry || "none");

    // Select Lithuania
    console.log("Selecting Lithuania...");
    await page.selectOption("select[name*='combo_land']", "LTU");
    await page.waitForTimeout(800); // Let postback complete

    // Set maxlines to 500 via JavaScript (more reliable than form field)
    console.log("Setting max lines to 500...");
    await page.evaluate(() => {
      const inputs = document.querySelectorAll("input[type='text']");
      for (const input of inputs) {
        const name = (input as HTMLInputElement).name || "";
        if (name.toLowerCase().includes("maxlines")) {
          (input as HTMLInputElement).value = "500";
        }
      }
    });

    // Find and click search button
    console.log("Clicking search button...");
    
    // Dismiss cookie consent dialog by clicking accept button
    try {
      console.log("Looking for cookie accept button...");
      await page.locator("button:has-text('Accept All'), button:has-text('Accept'), [id*='accept'], [data-id*='Accept']").first().click({ timeout: 5000 }).catch(() => {
        console.log("No cookie dialog found");
      });
      await page.waitForTimeout(500);
    } catch (error) {
      console.log("Cookie dialog handling skipped");
    }

    const searchButton = await page.$("input[value*='Search']") ||
                         await page.$("input[type='submit'][value*='search']") ||
                         await page.$("button[type='submit']");

    if (!searchButton) {
      throw new Error("Search button not found");
    }

    // Click search button with force to bypass overlays
    console.log("Clicking search button (forcing click)...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null),
      (searchButton as any).click({ force: true }).catch(() => searchButton.click()),
    ]);

    // Wait for results to appear
    console.log("Waiting for results to load...");
    await page.waitForTimeout(3000);
    
    // Check page content for debugging
    const currentUrl = page.url();
    console.log("Current URL after search:", currentUrl);
    
    const pageContent = await page.content();
    const resultCount = (pageContent.match(/tnr\d+/g) || []).length;
    console.log(`Found ${resultCount} tournament links in page HTML`);
    
    // Check if results table exists - look for tournament count table or any search results
    const hasResults = await page.$("table tr a[href*='tnr']").catch(() => null);
    if (!hasResults && resultCount === 0) {
      // Check if the form submitted with Lithuania selected
      const selectedCountry = await page.inputValue("select[name*='combo_land']").catch(() => "unknown");
      console.log("Selected country after search:", selectedCountry);
      throw new Error(`Results table not found after search. URL: ${currentUrl}, Selected: ${selectedCountry}`);
    }

    console.log("Results found, parsing...");

    // Get page content
    const html = await page.content();
    const $ = cheerio.load(html);
    const tournaments: ScrapedTournament[] = [];
    const seenIds = new Set<string>();

    console.log("Parsing tournament results...");

    // Find all tournament links
    $("a[href*='tnr']").each((_, elem) => {
      const link = $(elem);
      const href = link.attr("href") ?? "";
      const name = link.text().trim();

      if (!href || !name) return;

      // Extract ID
      const idMatch = href.match(/tnr(\d+)/);
      if (!idMatch) return;

      const chessResultsId = `tnr${idMatch[1]}`;

      // Skip duplicates
      if (seenIds.has(chessResultsId)) return;
      seenIds.add(chessResultsId);

      const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      // Get parent row for more info
      const row = $(elem).closest("tr");
      const rowText = row.text().toUpperCase();

      // Parse time control
      let timeControl: "STANDARD" | "RAPID" | "BLITZ" | "UNKNOWN" = "UNKNOWN";
      if (rowText.includes("ST") || rowText.includes("STANDARD")) timeControl = "STANDARD";
      else if (rowText.includes("RP") || rowText.includes("RAPID")) timeControl = "RAPID";
      else if (rowText.includes("BZ") || rowText.includes("BLITZ")) timeControl = "BLITZ";

      // Parse status
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

    console.log(`Found ${tournaments.length} tournaments from search page`);
    updateActivityTime();
    return tournaments;
  } catch (error) {
    console.error("Error during search scraping:", error);
    throw error;
  } finally {
    await page.close().catch(() => {
      // Ignore errors during page cleanup
    });
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

    // Extract time control from <small> tag, with fallback to cell text if needed
    let tcText = $(cells[2]).find("small").first().text().trim();
    if (!tcText) {
      // Fallback: try extracting from the full cell text if <small> tag is missing
      const cellText = $(cells[2]).text().trim();
      const tcMatch = cellText.match(/^(St|Rp|Bz)/i);
      tcText = tcMatch ? tcMatch[1] : "";
    }
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
      startDate, // Will be filled from details page if null
      timeControl,
      status: status as "NOT_STARTED" | "IN_PROGRESS" | "FINISHED",
      url,
    });
  });

  if (tournaments.length === 0) {
    console.warn("No tournaments found from federation page. HTML may have changed.");
  } else {
    console.log(`Successfully scraped ${tournaments.length} tournaments from federation page`);
  }

  // Fetch missing dates and player counts from tournament details pages
  console.log(`Fetching dates and player counts...`);
  let fetchedCount = 0;
  for (const tournament of tournaments) {
    const { date, playerCount } = await fetchTournamentDetails(tournament.url);
    if (date && !tournament.startDate) {
      tournament.startDate = date;
      fetchedCount++;
    }
    if (playerCount && !tournament.playerCount) {
      tournament.playerCount = playerCount;
    }
  }
  if (fetchedCount > 0) {
    console.log(`Successfully fetched ${fetchedCount} tournament dates from detail pages`);
  }

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
