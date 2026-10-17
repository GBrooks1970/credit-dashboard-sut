import { formatDate, formatMoney, formatMonth, formatPercent, plural } from './format.ts';

describe('formatMoney (UI specification 4.2)', () => {
  it('shows no pence on summary figures', () => {
    expect(formatMoney(5302400, { pence: false })).toBe('£53,024');
  });
  it('shows pence on detail figures', () => {
    expect(formatMoney(423600, { pence: true })).toBe('£4,236.00');
  });
  it('reads a negative amount as the amount, then in credit (DR-018)', () => {
    expect(formatMoney(-4400, { pence: false })).toBe('£44 in credit');
    expect(formatMoney(-4400, { pence: true })).toBe('£44.00 in credit');
  });
  it('shows zero as a plain amount', () => {
    expect(formatMoney(0, { pence: true })).toBe('£0.00');
  });
});

describe('the other formats', () => {
  it('a percentage is a whole number with a sign', () => {
    expect(formatPercent(54)).toBe('54%');
    expect(formatPercent(115)).toBe('115%');
  });
  it('a date is long form in en-GB', () => {
    expect(formatDate('2026-08-12')).toBe('12 August 2026');
    expect(formatDate('2026-10-03')).toBe('3 October 2026');
  });
  it('a count has the right noun', () => {
    expect(plural(1, 'topic', 'topics')).toBe('1 topic');
    expect(plural(2, 'topic', 'topics')).toBe('2 topics');
    expect(plural(0, 'day', 'days')).toBe('0 days');
  });
});

describe('formatMonth (CDS-38 R2-C-05)', () => {
  it('words a month', () => {
    expect(formatMonth('2024-03')).toBe('March 2024');
  });
  it('shows a month that is not one as it was sent, instead of throwing', () => {
    // The contract's pattern admits both.
    expect(formatMonth('2026-13')).toBe('2026-13');
    expect(formatMonth('2026-00')).toBe('2026-00');
  });
});
