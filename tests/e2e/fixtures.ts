import { expect, type Page } from '@playwright/test';

/**
 * Credentials created by `python -m app.scripts.seed`. Dev-only placeholders —
 * nothing here is a secret (CLAUDE.md non-negotiable #10).
 */
export const SEED_PASSWORD = 'MedBaza-dev-2026';
export const BUYER = 'buyer@medbaza.example';
export const SELLER = 'seller1@medbaza.example';
export const ADMIN = 'admin@medbaza.example';

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Elektron pochta').fill(email);
  await page.getByLabel('Parol').fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Kirish' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export const SHIPPING = {
  recipient: 'Rosa Lindqvist',
  line1: 'Amir Temur shoh ko’chasi, 118',
  city: 'Toshkent',
  postcode: '100084',
};
