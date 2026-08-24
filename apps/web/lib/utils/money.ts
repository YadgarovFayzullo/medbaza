/**
 * Pulni matnga aylantirish faqat shu yerda — ko‘rsatish chegarasida (CLAUDE.md §5.1).
 *
 * Undan yuqoridagi hamma narsa — API, savat, buyurtma — butun son (minor units)
 * va ISO-4217 kodini olib yuradi, hech qachon float emas.
 */
const DEFAULT_LOCALE = 'uz-UZ';

/**
 * Katalog so‘mda savdo qiladi. Har bir buyurtma o‘z kodini olib yuradi; bu
 * qiymat faqat odam kiritgan raqamni butun songa aylantirish uchun kerak.
 */
export const SITE_CURRENCY = 'UZS';

/**
 * ISO-4217 minor-unit exponents. Two decimals is the common case, so only the
 * exceptions are listed — so'm is quoted whole, and `amount_minor` on a UZS row
 * *is* the so'm figure, not a hundredth of one. Mirrors `app/core/money.py`.
 */
const MINOR_UNIT_EXPONENTS: Record<string, number> = {
  UZS: 0,
  JPY: 0,
  KRW: 0,
  ISK: 0,
  VND: 0,
};
const DEFAULT_MINOR_UNIT_EXPONENT = 2;

export function minorUnitExponent(currency: string): number {
  return MINOR_UNIT_EXPONENTS[currency.toUpperCase()] ?? DEFAULT_MINOR_UNIT_EXPONENT;
}

/** Odam kiritgan butun birlikni API kutadigan butun songa aylantiradi. */
export function toMinor(amount: number, currency: string = SITE_CURRENCY): number {
  return Math.round(amount * 10 ** minorUnitExponent(currency));
}

/** `toMinor`ning teskarisi — forma maydonlarini to‘ldirish uchun. */
export function fromMinor(amountMinor: number, currency: string = SITE_CURRENCY): number {
  return amountMinor / 10 ** minorUnitExponent(currency);
}

/**
 * Valyuta belgisi ("so‘m", "$") — yorliqlar uchun.
 *
 * Intl birinchi so‘raladi, lekin sayt valyutasi qat'iy belgilangan: ICU
 * ma'lumotlarida uz-UZ bo‘lmagan muhit "UZS" degan xom kodni qaytaradi. Bu
 * yorliqlar Client Component ichida chiziladi, ya'ni server "so‘m", brauzer
 * "UZS" desa, bu hydration nomuvofiqligi bo‘lib ko‘rinadi.
 */
const PINNED_SYMBOLS: Record<string, string> = { [SITE_CURRENCY]: 'so\u02bbm' };

export function currencySymbol(currency: string, locale = DEFAULT_LOCALE): string {
  const pinned = PINNED_SYMBOLS[currency.toUpperCase()];
  if (pinned) return pinned;
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0);
  return parts.find((part) => part.type === 'currency')?.value ?? currency;
}

export function formatMoney(
  amountMinor: number,
  currency: string,
  locale = DEFAULT_LOCALE,
): string {
  const exponent = minorUnitExponent(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    // Intl bills UZS at two decimals by default; the exponent is the authority.
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(fromMinor(amountMinor, currency));
}

/** Panel plitkalari uchun qisqa shakl. */
export function formatMoneyCompact(
  amountMinor: number,
  currency: string,
  locale = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(fromMinor(amountMinor, currency));
}

export function formatDate(value: string, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));
}

export function formatDateTime(value: string, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}
