import { expect, test } from '@playwright/test';
import { asGuest } from './helpers';

test.beforeEach(async ({ page }) => { await asGuest(page); });

test('a separable card shows the forms of its verb with the particle marked', async ({ page }) => {
  await page.goto('/sentences/pat-separable-25');
  const forms = page.getByTestId('separable-forms');
  await forms.waitFor({ state: 'attached' });
  if (!(await forms.isVisible())) await page.getByText('Grammar rule & similar examples').click();
  await expect(forms).toBeVisible();
  await expect(forms).toContainText('Forms of terugbellen');
  await expect(forms).toContainText('ik bel … terug');
  await expect(forms).toContainText('terug te bellen');
  await expect(forms).toContainText('dat ik terugbel');
  await expect(forms.locator('strong', { hasText: 'terug' }).first()).toBeVisible();
});

test('a zijn-verb shows ben in its perfect, and a non-separable card shows no verb table', async ({ page }) => {
  await page.goto('/sentences/pat-separable-21');
  await expect(page.getByTestId('separable-forms')).toContainText('ik ben … aangekomen');
  await page.goto('/sentences/pat-als-01');
  await expect(page.getByTestId('separable-forms')).toHaveCount(0);
});
