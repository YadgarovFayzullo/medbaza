import { expect, test } from '@playwright/test';

test.describe('storefront', () => {
  test('the homepage shows the hero, category tiles, and product rails', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2, name: 'Chegirmalar' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Ommabop' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Himoya vositalari/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tartibga solish ma’lumotlari' })).toBeVisible();
  });

  test('the catalog menu opens departments and sub-categories', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Katalog' }).click();
    const menu = page.locator('#catalog-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Diagnostika' }).first()).toBeVisible();
  });

  test('search autocomplete suggests products and navigates', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: /qidirish/i }).fill('termometr');
    const suggestions = page.getByRole('listbox');
    await expect(suggestions).toBeVisible();
    await suggestions.getByRole('option').first().click();
    await expect(page).not.toHaveURL('/');
  });

  test('a category listing filters by certification, stock, and discount', async ({ page }) => {
    await page.goto('/category/ppe');
    await expect(page.getByRole('heading', { name: 'Himoya vositalari' })).toBeVisible();

    await page.getByLabel('CE').check();
    await expect(page).toHaveURL(/certification=CE/);

    await page.getByLabel('Faqat mavjudlari').check();
    await expect(page).toHaveURL(/in_stock=true/);

    await page.getByLabel('Chegirmadagilar').check();
    await expect(page).toHaveURL(/on_sale=true/);
  });

  test('a product page shows certifications, specs, and a working quantity control', async ({
    page,
  }) => {
    await page.goto('/category/ppe');
    await page.locator('article h3 a').first().click();

    await expect(page.getByRole('heading', { name: 'Xususiyatlar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Savatga qo’shish' })).toBeVisible();

    await page.getByRole('button', { name: 'Miqdorni oshirish' }).click();
    await expect(page.getByLabel('Miqdor', { exact: true })).toHaveValue('2');
  });

  test('a card can be saved and shows up on the saved page', async ({ page }) => {
    await page.goto('/search');
    const firstCard = page.locator('article').first();
    const name = await firstCard.locator('h3 a').innerText();
    await firstCard.getByRole('button', { name: /saqlash/i }).click();

    await page.goto('/saved');
    await expect(page.getByText(name)).toBeVisible();
  });
});
