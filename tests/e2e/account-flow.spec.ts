import { expect, test } from "@playwright/test";
import { answerArticleQuestionWrong } from "./helpers";

function uniqueUsername() {
  // Must stay within the app's 20-char username limit (the register form's
  // maxLength enforces this client-side, same as the server does).
  return `e2e_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

test.describe("Account flow", () => {
  test("create account, save recovery code, merge guest progress, logout, login, progress persists", async ({ page }) => {
    const username = uniqueUsername();
    const password = "supersecret123";

    // 1. Play as guest and miss a word, so there's real guest progress to merge.
    await page.goto("/game/article");
    await answerArticleQuestionWrong(page);
    await page.waitForTimeout(1100);

    // 2. Create an account, offering to save guest progress.
    await page.goto("/account");
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await expect(page.getByText("Save my current guest progress to this account")).toBeVisible();
    await page.locator('button[type="submit"]').click();

    // 3. Recovery code is shown once; capture it and confirm before continuing.
    await page.waitForSelector("text=Save your recovery code");
    const recoveryCode = (await page.locator("p.font-mono").first().textContent())?.trim() ?? "";
    expect(recoveryCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Continue" }).click();

    // Merged guest progress shows up on the home screen.
    await expect(page.getByText(username)).toBeVisible();
    await expect(page.getByText(/Review Weak Words/)).toBeVisible();

    // 4. Logout.
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page.getByText("Guest · progress saved on this device")).toBeVisible();

    // 5. Login again.
    await page.goto("/account");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.locator('button[type="submit"]').click();

    // 6. Confirm progress persisted server-side across the logout/login cycle.
    await page.waitForURL("/");
    await expect(page.getByText(username)).toBeVisible();
    await expect(page.getByText(/Review Weak Words/)).toBeVisible();
  });

  test("recovery code resets the password when the original password is forgotten", async ({ page }) => {
    const username = uniqueUsername();
    const originalPassword = "originalpass123";
    const newPassword = "brandnewpass456";

    await page.goto("/account");
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password", { exact: true }).fill(originalPassword);
    await page.getByLabel("Confirm password").fill(originalPassword);
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector("text=Save your recovery code");
    const recoveryCode = (await page.locator("p.font-mono").first().textContent())?.trim() ?? "";
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("button", { name: "Log out" }).click();

    // Reset via recovery code.
    await page.goto("/account");
    await page.getByRole("button", { name: "Forgot" }).click();
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Recovery code").fill(recoveryCode);
    await page.getByLabel("New password").fill(newPassword);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("Password updated. You can log in now.")).toBeVisible();

    // Old password no longer works.
    await page.getByRole("button", { name: "Go to Log In" }).click();
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password", { exact: true }).fill(originalPassword);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("Invalid username or password")).toBeVisible();

    // New password works.
    await page.getByLabel("Password", { exact: true }).fill(newPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("/");
    await expect(page.getByText(username)).toBeVisible();
  });
});
