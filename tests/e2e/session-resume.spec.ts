import { expect, test } from "@playwright/test";
import { answerArticleQuestionCorrectly } from "./helpers";

test.describe("Session resume across refresh", () => {
  test("in-progress score and current question survive a page refresh", async ({ page }) => {
    await page.goto("/game/article");
    await answerArticleQuestionCorrectly(page); // auto-advances to a new question
    await page.waitForTimeout(600);

    const wordBefore = (await page.locator("p.text-4xl").first().textContent())?.trim();
    const scoreBefore = await page.getByText(/Score \d+/).textContent();
    expect(scoreBefore).toBe("Score 1");

    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector("text=DE OF HET");

    const wordAfter = (await page.locator("p.text-4xl").first().textContent())?.trim();
    const scoreAfter = await page.getByText(/Score \d+/).textContent();

    expect(wordAfter).toBe(wordBefore);
    expect(scoreAfter).toBe(scoreBefore);
  });

  test("exiting the game screen clears the resumable session", async ({ page }) => {
    await page.goto("/game/article");
    await answerArticleQuestionCorrectly(page);
    await page.waitForTimeout(600);

    const before = await page.evaluate(() => sessionStorage.getItem("dutchtap:session:article"));
    expect(before).not.toBeNull();

    await page.locator('button[aria-label="Exit to home"]').click();

    const after = await page.evaluate(() => sessionStorage.getItem("dutchtap:session:article"));
    expect(after).toBeNull();
  });
});
