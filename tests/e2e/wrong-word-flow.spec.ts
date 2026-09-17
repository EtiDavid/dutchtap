import { expect, test } from "@playwright/test";
import { answerArticleQuestionWrong } from "./helpers";

test.describe("Wrong-word flow", () => {
  test("a missed word shows the correction and gets scheduled to return within 2-5 questions", async ({ page }) => {
    await page.goto("/game/article");
    const { noun, correct, wrong } = await answerArticleQuestionWrong(page);

    // Wrong-answer feedback: the tapped (wrong) button turns error-state,
    // the correct one is revealed, and the full correct phrase/explanation shows.
    const wrongButton = page.locator("button", { hasText: new RegExp(`^${wrong}$`, "i") }).first();
    const correctButton = page.locator("button", { hasText: new RegExp(`^${correct}$`, "i") }).first();
    await expect(wrongButton).toHaveAttribute("aria-pressed", "true");
    await expect(correctButton).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText(new RegExp(`${correct} ${noun.singular}`, "i")).first()).toBeVisible();

    // Wrong answers must NOT auto-advance — the learner needs time to read
    // the correction. A "Okay, got it" button waits for a deliberate tap.
    const continueButton = page.getByRole("button", { name: "Okay, got it" });
    await expect(continueButton).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(page.getByText("DE OF HET")).toBeVisible(); // still the same question, not advanced
    await expect(wrongButton).toHaveAttribute("aria-pressed", "true"); // feedback still showing

    await continueButton.click();
    await expect(continueButton).not.toBeVisible();

    // The underlying repetition engine must have scheduled this concept to
    // return within a 2-5 question window (spec section 17), not immediately
    // and not "eventually whenever". We assert the contract directly against
    // persisted state rather than clicking through N more questions hoping to
    // observe it live (which would make this test flaky by nature).
    const state = await page.evaluate(() => {
      const raw = localStorage.getItem("dutchtap:guest-progress");
      return raw ? JSON.parse(raw) : null;
    });
    expect(state).not.toBeNull();
    const record = state.progressByKey[`article:${noun.id}`];
    expect(record).toBeDefined();
    expect(record.wrong).toBe(1);
    expect(record.scheduledReturnAtQuestion).not.toBeNull();
    // Question index was 0 when the wrong answer was recorded.
    expect(record.scheduledReturnAtQuestion).toBeGreaterThanOrEqual(2);
    expect(record.scheduledReturnAtQuestion).toBeLessThanOrEqual(5);
  });
});
