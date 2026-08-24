import { expect, test } from '@playwright/test';

import { ADMIN, SELLER, signIn } from './fixtures';

test.describe('seller and admin surfaces', () => {
  test('a seller sees their dashboard, listings, and inventory', async ({ page }) => {
    await signIn(page, SELLER);

    await page.goto('/seller');
    await expect(page.getByText('Efirdagi e’lonlar')).toBeVisible();
    await expect(page.getByText('Bajarish kerak')).toBeVisible();

    await page.goto('/seller/listings');
    await expect(page.getByRole('heading', { name: 'E’lonlar' })).toBeVisible();

    await page.goto('/seller/inventory');
    await expect(page.getByRole('heading', { name: 'Ombor' })).toBeVisible();
  });

  test('a seller can create a draft listing', async ({ page }) => {
    await signIn(page, SELLER);
    await page.goto('/seller/listings/new');

    await page.getByLabel('Mahsulot nomi').fill('E2E sinov termometri');
    await page.getByLabel('SKU').fill(`E2E-${Date.now()}`);
    await page.getByLabel(/^Narx \(/).fill('250000');
    await page.getByLabel('Qoldiq').fill('5');
    await page.getByRole('button', { name: 'E’lon yaratish' }).click();

    await expect(page).toHaveURL(/\/seller\/listings\//);
  });

  test('a seller cannot reach the admin panel', async ({ page }) => {
    await signIn(page, SELLER);
    await page.goto('/admin');
    // The role gate redirects rather than rendering an admin surface.
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test('an admin can reach every oversight queue', async ({ page }) => {
    await signIn(page, ADMIN);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Umumiy ko’rinish' })).toBeVisible();
    await expect(page.getByText('Qaror kutmoqda')).toBeVisible();

    await page.goto('/admin/sellers?status=pending');
    await expect(page.getByRole('heading', { name: 'Sotuvchilar' })).toBeVisible();

    await page.goto('/admin/prescriptions');
    await expect(page.getByRole('heading', { name: 'Retsept tekshiruvi' })).toBeVisible();

    await page.goto('/admin/audit');
    await expect(page.getByRole('heading', { name: 'Audit jurnali' })).toBeVisible();
  });
});
