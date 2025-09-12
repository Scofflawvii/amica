import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "axe-playwright";

// Accessibility regression guard for opening settings & chat log overlays.

test.describe("Accessibility - overlays", () => {
  test("settings panel & chat log pass serious/critical axe scan", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#amica-sidebar");
    await injectAxe(page);

    // Open settings (first button) - relies on aria-label
    const settingsButton = page.getByRole("button", { name: /settings/i });
    if (await settingsButton.count()) {
      await settingsButton.first().click();
      await page.waitForTimeout(300); // allow animation
    }

    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: false },
      axeOptions: { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } },
      includedImpacts: ["critical", "serious"],
    });

    // Close settings by pressing Escape (if supported)
    await page.keyboard.press("Escape").catch(() => {});

    // Toggle chat log (second button). Button has aria-label 'Show chat log' or 'Hide chat log'
    const chatToggle = page.getByRole("button", {
      name: /(show|hide) chat log/i,
    });
    if (await chatToggle.count()) {
      await chatToggle.first().click();
      await page.waitForTimeout(200);
    }

    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: false },
      axeOptions: { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } },
      includedImpacts: ["critical", "serious"],
    });

    // Ensure sidebar buttons remain clickable after overlay toggles
    const allSidebarButtons = await page
      .locator("#amica-sidebar button, #amica-sidebar a")
      .count();
    expect(allSidebarButtons).toBeGreaterThan(2);
  });
});
