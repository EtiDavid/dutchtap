import { test, expect } from "@playwright/test";

test("sentence pages show corrected meanings and precise grammatical subjects", async ({ page }) => {
  await page.goto("/sentences/transport-07?lang=nl");
  await expect(page.getByText("My train is delayed by ten minutes.", { exact: true }).first()).toBeVisible();
  await page.goto("/sentences/conversation-56?lang=nl");
  const notes = page.getByTestId("grammar-notes");
  if (!(await notes.evaluate((element) => (element as HTMLDetailsElement).open)))
    await notes.locator("summary").click();
  await expect(notes.getByText(/Wie is itself the subject/).first()).toBeVisible();
  await expect(notes.getByTestId("breakdown-pattern")).toContainText("subject (question word)");
  await page.goto("/sentences/food-11?lang=nl");
  const bagNotes = page.getByTestId("grammar-notes");
  if (!(await bagNotes.evaluate((element) => (element as HTMLDetailsElement).open)))
    await bagNotes.locator("summary").click();
  await expect(bagNotes.getByRole("list", { name: "This sentence, part by part" }).getByRole("listitem")).toHaveCount(3);
  await expect(bagNotes.getByText(/complete subject is de zak met eten/).first()).toBeVisible();
});
