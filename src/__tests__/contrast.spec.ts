import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  "/",
  "/pricing",
  "/knowledge",
  "/tools",
  "/templates",
  "/community",
  "/learning",
  "/sign-in",
  "/sign-up",
];

const THEMES = [
  { mode: "light", accent: "blue" },
  { mode: "light", accent: "purple" },
  { mode: "dark", accent: "blue" },
  { mode: "dark", accent: "purple" },
];

for (const route of ROUTES) {
  for (const theme of THEMES) {
    test(`${route} — ${theme.mode}+${theme.accent} — no contrast violations`, async ({ page }) => {
      await page.context().addCookies([
        { name: "atlas-theme", value: theme.mode, url: "http://localhost:3000" },
        { name: "atlas-accent", value: theme.accent, url: "http://localhost:3000" },
      ]);

      await page.goto(`http://localhost:3000${route}`);
      await page.waitForLoadState("networkidle");

      // Set theme via data attributes in case cookie-based SSR hasn't applied
      await page.evaluate(({ mode, accent }) => {
        document.documentElement.setAttribute("data-theme", mode);
        document.documentElement.setAttribute("data-accent", accent);
      }, theme);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2aa", "wcag21aa"])
        .include("body")
        .analyze();

      const contrastViolations = results.violations.filter(
        (v) => v.id === "color-contrast"
      );

      if (contrastViolations.length > 0) {
        const details = contrastViolations.flatMap((v) =>
          v.nodes.map((n) => ({
            selector: n.target.join(" "),
            html: n.html,
            impact: n.impact,
            description: v.description,
          }))
        );
        console.error(
          `Contrast violations on ${route} (${theme.mode}+${theme.accent}):\n`,
          JSON.stringify(details, null, 2)
        );
      }

      expect(contrastViolations).toEqual([]);
    });
  }
}
