import { expect, test } from "@playwright/test";
import { answerArticleQuestionCorrectly, clickContinue } from "./helpers";

test.describe("Session resume across refresh", () => {
  test("refreshing mid-feedback (before tapping Continue) resumes the exact same state", async ({ page }) => {
    await page.goto("/game/article");
    await answerArticleQuestionCorrectly(page); // no auto-advance; still showing the "correct" feedback state

    const wordBefore = (await page.locator("p.text-4xl").first().textContent())?.trim();
    const scoreBefore = await page.getByText(/Score \d+/).textContent();
    expect(scoreBefore).toBe("Score 1");
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("text=DE OF HET");

    const wordAfter = (await page.locator("p.text-4xl").first().textContent())?.trim();
    const scoreAfter = await page.getByText(/Score \d+/).textContent();

    expect(wordAfter).toBe(wordBefore);
    expect(scoreAfter).toBe(scoreBefore);
    // Still mid-feedback after the refresh, not silently reset to idle.
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });

  test("refreshing after advancing to a new question resumes that new question, not the old one", async ({ page }) => {
    await page.goto("/game/article");
    await answerArticleQuestionCorrectly(page);
    await clickContinue(page);

    const wordAfterContinue = (await page.locator("p.text-4xl").first().textContent())?.trim();

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("text=DE OF HET");
    const wordAfterRefresh = (await page.locator("p.text-4xl").first().textContent())?.trim();

    expect(wordAfterRefresh).toBe(wordAfterContinue);
  });

  test("exiting the game screen clears the resumable session", async ({ page }) => {
    await page.goto("/game/article");
    await answerArticleQuestionCorrectly(page);

    const before = await page.evaluate(() => sessionStorage.getItem("dutchtap:session:article"));
    expect(before).not.toBeNull();

    await page.locator('button[aria-label="Exit to home"]').click();

    const after = await page.evaluate(() => sessionStorage.getItem("dutchtap:session:article"));
    expect(after).toBeNull();
  });
});
