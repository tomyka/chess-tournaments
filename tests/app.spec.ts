import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders the hero section with correct title", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Chess Tournaments"
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "in Lithuania"
    );
  });

  test("has a link to browse tournaments", async ({ page }) => {
    await page.goto("/");

    const browseLink = page.getByRole("link", { name: /browse tournaments/i });
    await expect(browseLink).toBeVisible();
    await browseLink.click();

    await expect(page).toHaveURL("/tournaments");
  });

  test("displays feature cards", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("FIDE Registered")).toBeVisible();
    await expect(page.getByText("Live Updates")).toBeVisible();
    await expect(page.getByText("All Time Controls")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("header shows site name and navigation links", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Chess Tournaments LT")).toBeVisible();
    await expect(page.getByRole("link", { name: "Tournaments" })).toBeVisible();
  });

  test("footer credits chess-results.com", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("chess-results.com")).toBeVisible();
  });
});

test.describe("Tournaments page", () => {
  test("renders the tournament list page with filters", async ({ page }) => {
    await page.goto("/tournaments");

    await expect(
      page.getByRole("heading", { name: "Tournaments" })
    ).toBeVisible();

    // Filter chips should be visible
    await expect(page.getByText("Time Control")).toBeVisible();
    await expect(page.getByText("Status")).toBeVisible();

    // Search input
    await expect(
      page.getByPlaceholder(/search tournaments/i)
    ).toBeVisible();
  });

  test("filter chips are clickable", async ({ page }) => {
    await page.goto("/tournaments");

    // Click a time control filter
    const rapidBadge = page.locator('[class*="cursor-pointer"]', {
      hasText: "Rapid",
    });
    await rapidBadge.first().click();

    // Click a status filter
    const upcomingBadge = page.locator('[class*="cursor-pointer"]', {
      hasText: "Upcoming",
    });
    await upcomingBadge.first().click();
  });
});
