import { describe, expect, it } from 'vitest';

import {
  currencySymbol,
  formatDate,
  formatMoney,
  formatMoneyCompact,
  fromMinor,
  toMinor,
} from '@/lib/utils/money';
import { cn } from '@/lib/utils/cn';

describe('formatMoney', () => {
  it('renders minor units as a currency amount', () => {
    expect(formatMoney(1999, 'USD', 'en-US')).toBe('$19.99');
    expect(formatMoney(0, 'USD', 'en-US')).toBe('$0.00');
  });

  it('keeps two decimals for round amounts', () => {
    expect(formatMoney(10_000, 'USD', 'en-US')).toBe('$100.00');
  });

  it('honours the currency it is given rather than assuming dollars', () => {
    expect(formatMoney(2500, 'EUR', 'de-DE')).toContain('25,00');
  });

  it('never turns a minor-unit integer into a rounding error', () => {
    // 1 cent must stay 1 cent, not 0.
    expect(formatMoney(1, 'USD', 'en-US')).toBe('$0.01');
  });

  it("quotes so'm whole, because UZS has no minor unit", () => {
    // 437000 UZS is 437 000 so'm; dividing by 100 would show 4 370, and Intl's
    // own default would append a ",00" that does not exist in the currency.
    expect(formatMoney(437_000, 'UZS', 'uz-UZ')).toBe('437\u00a0000\u00a0so\u02bbm');
  });
});

describe('toMinor / fromMinor', () => {
  it('round-trips a whole-unit currency without scaling it', () => {
    expect(toMinor(437_000, 'UZS')).toBe(437_000);
    expect(fromMinor(437_000, 'UZS')).toBe(437_000);
  });

  it('still scales a two-decimal currency', () => {
    expect(toMinor(19.99, 'USD')).toBe(1999);
    expect(fromMinor(1999, 'USD')).toBe(19.99);
  });

  it('defaults to the catalog currency when none is named', () => {
    expect(toMinor(250_000)).toBe(250_000);
  });
});

// Intl groups with U+00A0 and spells so'm with U+02BB; both are written as
// escapes here so a copy-paste cannot quietly swap in an ASCII space.
describe('currencySymbol', () => {
  it('reads the symbol out of Intl rather than a hand-kept table', () => {
    expect(currencySymbol('UZS', 'uz-UZ')).toBe('so\u02bbm');
    expect(currencySymbol('USD', 'en-US')).toBe('$');
  });
});

describe('formatMoneyCompact', () => {
  it('shortens large amounts for dashboard tiles', () => {
    expect(formatMoneyCompact(1_240_000, 'USD', 'en-US')).toBe('$12.4K');
    expect(formatMoneyCompact(124_000_000, 'UZS', 'uz-UZ')).toBe('124\u00a0mln\u00a0so\u02bbm');
  });
});

describe('formatDate', () => {
  it('formats an RFC 3339 timestamp', () => {
    expect(formatDate('2026-08-20T09:30:00Z', 'en-US')).toBe('Aug 20, 2026');
  });
});

describe('cn', () => {
  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});
