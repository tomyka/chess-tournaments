import { chromium, Browser, Page } from "playwright";

let browserInstance: Browser | null = null;
let lastActivityTime = 0;
const BROWSER_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Get or create a persistent browser instance.
 * The browser will auto-close after 5 minutes of inactivity.
 */
export async function getBrowser(): Promise<Browser> {
  const now = Date.now();

  // If browser exists and hasn't been idle too long, reuse it
  if (browserInstance) {
    if (now - lastActivityTime < BROWSER_IDLE_TIMEOUT) {
      lastActivityTime = now;
      return browserInstance;
    }

    // Browser has been idle too long, close it
    console.log("Closing idle browser instance");
    await browserInstance.close().catch(() => {
      // Ignore errors during cleanup
    });
    browserInstance = null;
  }

  // Launch new browser
  console.log("Launching new browser instance");
  browserInstance = await chromium.launch({
    headless: true,
  });

  lastActivityTime = now;
  return browserInstance;
}

/**
 * Close the browser and cleanup resources
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (error) {
      console.error("Error closing browser:", error);
    }
    browserInstance = null;
  }
}

/**
 * Update last activity time (called by scraper to keep browser alive)
 */
export function updateActivityTime(): void {
  lastActivityTime = Date.now();
}
