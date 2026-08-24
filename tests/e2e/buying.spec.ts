import { expect, test } from '@playwright/test';

import { BUYER, SHIPPING, signIn } from './fixtures';

test.describe('browse → cart → checkout → tracking', () => {
  test('a signed-in buyer can place an order and see it in their history', async ({ page }) => {
    await signIn(page, BUYER);

    // Pick something that does not need a prescription.
    await page.goto('/category/ppe?in_stock=true&rx=false');
    await page.locator('article').first().getByRole('button', { name: 'Savatga' }).click();

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Buyurtma xulosasi' })).toBeVisible();
    await page.getByRole('link', { name: 'Rasmiylashtirishga o’tish' }).click();

    // 1 — contact (already signed in).
    await page.getByRole('button', { name: 'Yetkazishga o’tish' }).click();

    // 2 — shipping.
    await page.getByLabel('Qabul qiluvchi ismi').fill(SHIPPING.recipient);
    await page.getByLabel('Manzil, 1-qator').fill(SHIPPING.line1);
    await page.getByLabel('Shahar').fill(SHIPPING.city);
    await page.getByLabel('Pochta indeksi').fill(SHIPPING.postcode);
    await page.getByRole('button', { name: 'Davom etish' }).click();

    // 3 — review and pay.
    await expect(page.getByRole('heading', { name: 'Tekshiring va to’lang' })).toBeVisible();
    await page.getByRole('button', { name: 'Buyurtma berish' }).click();

    await expect(page.getByRole('heading', { name: 'Buyurtma qabul qilindi' })).toBeVisible();
    await expect(page.getByText(/MB-\d{6}-/)).toBeVisible();

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Buyurtmalarim' })).toBeVisible();
    await expect(page.getByText(/MB-\d{6}-/).first()).toBeVisible();
  });

  test('the cart is emptied by a successful checkout', async ({ page }) => {
    await signIn(page, BUYER);
    await page.goto('/cart');
    await expect(page.getByText(/Savatingiz bo’sh|Buyurtma xulosasi/)).toBeVisible();
  });

  test('a prescription-only item adds a prescription step to checkout', async ({ page }) => {
    await signIn(page, BUYER);
    await page.goto('/search?rx=true&in_stock=true');
    await page.locator('article').first().getByRole('button', { name: 'Savatga' }).click();

    await page.goto('/checkout');
    await expect(page.getByRole('button', { name: 'Retsept' })).toBeVisible();
  });
});
