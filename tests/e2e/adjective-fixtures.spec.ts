import { expect, test } from "@playwright/test";
import { answerAdjectiveQuestionCorrectly, clickContinue } from "./helpers";

test.describe("Adjective fixtures", () => {
  test("een mooi huis / het mooie huis / een rode tas style questions grade correctly across real questions", async ({ page }) => {
    await page.goto("/game/adjective");

    let sawBaseForm = false;
    let sawEForm = false;

    // Base form only appears for indefinite + het-word (~10% of draws given
    // the bank's ~32% het-word share and 3 determiner types), so 25
    // iterations left a ~6% chance of never hitting it — a genuinely flaky
    // assertion, not a bug, caught by this test itself failing on a clean
    // run. 60 iterations brings that under 0.2%.
    for (let i = 0; i < 60; i++) {
      const { noun, adjective, correct } = await answerAdjectiveQuestionCorrectly(page);
      if (correct === adjective.base) sawBaseForm = true;
      if (correct === adjective.eForm) sawEForm = true;

      const correctButton = page.locator("button", { hasText: new RegExp(`^${correct}$`, "i") }).first();
      await expect(correctButton).toHaveAttribute("aria-pressed", "true");
      const classAttr = (await correctButton.getAttribute("class")) ?? "";
      expect(classAttr, `noun=${noun.id} adjective=${adjective.id} correct=${correct}`).toContain("bg-success");
      await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();

      await clickContinue(page);
    }

    // Across enough real indefinite/definite/possessive combinations we
    // should see both the base form (indefinite + het-word) and the -e
    // form (everything else) actually graded correct at least once each.
    expect(sawBaseForm).toBe(true);
    expect(sawEForm).toBe(true);
  });
});
