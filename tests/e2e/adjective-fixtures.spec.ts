import { expect, test } from "@playwright/test";
import { answerAdjectiveQuestionCorrectly } from "./helpers";

test.describe("Adjective fixtures", () => {
  test("een mooi huis / het mooie huis / een rode tas style questions grade correctly across real questions", async ({ page }) => {
    await page.goto("/game/adjective");

    let sawBaseForm = false;
    let sawEForm = false;

    for (let i = 0; i < 25; i++) {
      const { noun, adjective, correct } = await answerAdjectiveQuestionCorrectly(page);
      if (correct === adjective.base) sawBaseForm = true;
      if (correct === adjective.eForm) sawEForm = true;

      const correctButton = page.locator("button", { hasText: new RegExp(`^${correct}$`, "i") }).first();
      await expect(correctButton).toHaveAttribute("aria-pressed", "true");
      const classAttr = (await correctButton.getAttribute("class")) ?? "";
      expect(classAttr, `noun=${noun.id} adjective=${adjective.id} correct=${correct}`).toContain("bg-success");

      await page.waitForTimeout(500);
    }

    // Across enough real indefinite/definite/possessive combinations we
    // should see both the base form (indefinite + het-word) and the -e
    // form (everything else) actually graded correct at least once each.
    expect(sawBaseForm).toBe(true);
    expect(sawEForm).toBe(true);
  });
});
