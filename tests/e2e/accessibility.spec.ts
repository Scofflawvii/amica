import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "axe-playwright";

// Basic accessibility smoke test for the main page.
// Skips heavy dynamic viewer interactions; focuses on initial UI surfaces.

test.describe("Accessibility", () => {
  test("home page has no critical axe violations", async ({ page }) => {
    await page.goto("/");

    // Wait for a key UI landmark (sidebar id used by DebugPane positioning)
    await page.waitForSelector("#amica-sidebar", { timeout: 15000 });

    await injectAxe(page);

    // Run axe; limit to serious/critical impacts for fast signal
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: false },
      axeOptions: {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa"],
        },
      },
      includedImpacts: ["critical", "serious"],
    });

    // Example additional assertion: ensure main landmark present
    const hasMain = await page.locator('main, [role="main"]').first().count();
    expect(hasMain).toBeGreaterThan(0);
  });
});
