// version: 2 | created: 2026-10-22T16:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Whether the failure text the registry records for a catcher is too generic to tell a flag's defect from a broken page (CDS-48, review finding A-02).
// The proof accepts a catcher's failure as "for the stated reason" when its output holds this text, so the text is what makes the claim true.
// A pure function, so the rule is a unit test (failswith.test.mjs); schema-check.mjs applies it to every catcher.

/** Words of any assertion failure: they say a check failed, not why. */
const BARE = new Set(['expected', 'assertionerror', 'error', 'failed', 'failure', 'timeout', 'timeout of', 'received', 'undefined', 'null']);

/** The words that begin or fill any failure message, with a number: a text made of these alone says a check failed, not why (CDS-48 C-03). */
const GENERIC_WORDS = new Set([
  'expected', 'assertionerror', 'logicerror', 'error', 'failed', 'failure', 'timeout', 'of', 'has', 'expired', 'received',
  'to', 'equal', 'be', 'but', 'got', 'true', 'false', 'while', 'waiting', 'for',
]);

/** The reason a recorded failure text is too generic, or null when it is specific enough. */
export function whyTooGeneric(text, kind) {
  const trimmed = String(text ?? '').trim();
  if (trimmed.length === 0) return 'it is empty';
  if (BARE.has(trimmed.toLowerCase())) return `'${trimmed}' is the first word of any assertion failure`;
  // A wait for an element to be present ends in this message whatever broke: a broken button, a broken page or a slow service. Anywhere in the
  // text, with or without its end: the matcher is a substring test, so a prefixed or shortened text matches the same output (CDS-48 C-03).
  if (/timeout of \d+s has expired while waiting for|\.ispresent\(\) to equal true/i.test(trimmed)) {
    return 'it is a presence timeout, which a broken page, button or slow service prints as well (assert where the browser ended up, or what it showed)';
  }
  const words = trimmed.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const isNumber = (word) => /^\d+s?$/.test(word);
  if (words.some((word) => GENERIC_WORDS.has(word)) && words.every((word) => GENERIC_WORDS.has(word) || isNumber(word))) {
    return 'it is made of the words of any failure message and a number, which say a check failed and not why';
  }
  // An image name is what Playwright prints for any pixel difference. That is a page-changed catch, which the proof counts separately.
  if (kind !== 'visual-check' && /^[\w.-]+-actual\.png$/.test(trimmed)) return 'an image name is printed for any change to the page, so it names no reason';
  return null;
}
