import { expect, test } from "@playwright/test";
import { answerArticleQuestionCorrectly } from "./helpers";

test.describe("Guest flow", () => {
  test("open app, play a De/Het question, score increases, and progress survives a reload", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Guest · progress saved on this device")).toBeVisible();

    await page.getByRole("link", { name: "De or Het" }).click();
    await expect(page.getByText("DE OF HET")).toBeVisible();

    await answerArticleQuestionCorrectly(page);
    await expect(page.getByText("Score 1")).toBeVisible();

    // Lifetime score persists across reload/navigation via localStorage,
    // even though the in-session score counter resets per game screen.
    await page.goto("/");
    await page.reload();
    await expect(page.getByText("1 pts")).toBeVisible();
    await expect(page.getByText(/\d+ words seen/)).toContainText("1 words seen");
  });

  test("guest can play without any account/signup", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Log in")).toBeVisible();
    await expect(page.getByRole("link", { name: "De or Het" })).toBeVisible();
  });
});
