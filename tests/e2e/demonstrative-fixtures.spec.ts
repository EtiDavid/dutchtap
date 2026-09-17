import { expect, test } from "@playwright/test";
import { answerDemonstrativeQuestionCorrectly } from "./helpers";

const DEMONSTRATIVES = ["deze", "dit", "die", "dat"];

test.describe("Demonstrative fixtures", () => {
  test("all four demonstratives (deze/dit/die/dat) are producible and correctly graded across real questions", async ({ page }) => {
    await page.goto("/game/demonstrative");

    const seen = new Set<string>();
    // 40 rounds gives near-certainty of hitting all 4 demonstratives across
    // random noun/distance combinations, since the engine explores widely
    // across a 258-noun bank before any concept nears mastery.
    for (let i = 0; i < 40 && seen.size < 4; i++) {
      const { correct } = await answerDemonstrativeQuestionCorrectly(page);
      seen.add(correct);

      const correctButton = page.locator("button", { hasText: new RegExp(`^${correct}$`, "i") }).first();
      await expect(correctButton).toHaveAttribute("aria-pressed", "true");
      // Wrong-only classes never applied to the button we clicked when we clicked the right one.
      const classAttr = (await correctButton.getAttribute("class")) ?? "";
      expect(classAttr).toContain("bg-success");

      await page.waitForTimeout(500);
    }

    for (const d of DEMONSTRATIVES) {
      expect(seen.has(d), `expected to see "${d}" appear as a correct answer across the session`).toBe(true);
    }
  });
});
