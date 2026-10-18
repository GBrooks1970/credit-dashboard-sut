// version: 1 | created: 2026-10-13T10:45Z | project: credit-dashboard-sut | type: source | language: en-GB
// Formatting (UI specification section 4.2, locale en-GB). Money arrives as integer minor units (DR-004) and is never
// converted through floating point except for display.
import { TEST_BUILD, flagOn } from './flags.tsx';

const pounds = (fractionDigits: 0 | 2) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });

const wholePounds = pounds(0);
const poundsAndPence = pounds(2);

/**
 * A negative amount reads as the amount without a sign, then 'in credit' (DR-018). Summary figures show no pence
 * (`£53,024`); detail figures show pence (`£4,236.00`).
 */
export function formatMoney(amountMinor: number, options: { pence: boolean }): string {
  // The `currency-format` bug flag (test build only; UI specification 8): money shown as the raw count of pence, `53024`.
  if (TEST_BUILD && flagOn('currency-format')) return String(amountMinor);
  const formatter = options.pence ? poundsAndPence : wholePounds;
  const text = formatter.format(Math.abs(amountMinor) / 100);
  // The `negative-balance` bug flag (test build only; UI specification 8): an account in credit reads as an amount owed.
  return amountMinor < 0 && !(TEST_BUILD && flagOn('negative-balance')) ? `${text} in credit` : text;
}

/** A whole percentage: `54%`. Above 100 the page adds an 'Over limit' label (DR-013). */
export function formatPercent(value: number): string {
  return `${value}%`;
}

const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** `2026-08-12` as `12 August 2026`. */
export function formatDate(isoDate: string): string {
  return longDate.format(new Date(`${isoDate}T00:00:00Z`));
}

/** `2024-03` as `March 2024`. */
export function formatMonth(month: string): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  // The contract's pattern admits 2026-13 and 2026-00, which are not months; format() throws on them and blanked the whole page
  // (CDS-38 R2-C-05). The raw text is shown instead, as the history chart already does.
  if (Number.isNaN(date.getTime())) return month;
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

/** `1 topic`, `2 topics`. */
export function plural(count: number, one: string, many: string): string {
  // The `plural` bug flag recreates '1 topics' and 'Updates in 1 days' (UI specification 8).
  return `${count} ${count === 1 && !flagOn('plural') ? one : many}`;
}
