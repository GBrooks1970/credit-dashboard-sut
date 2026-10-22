// version: 1 | created: 2026-10-22T16:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Whether the failure text the registry records for a catcher is too generic to tell a flag's defect from a broken page (CDS-48, review finding A-02).
// The proof accepts a catcher's failure as "for the stated reason" when its output holds this text, so the text is what makes the claim true.
// A pure function, so the rule is a unit test (failswith.test.mjs); schema-check.mjs applies it to every catcher.

/** Words of any assertion failure: they say a check failed, not why. */
const BARE = new Set(['expected', 'assertionerror', 'error', 'failed', 'failure', 'timeout', 'timeout of', 'received', 'undefined', 'null']);

/** The reason a recorded failure text is too generic, or null when it is specific enough. */
export function whyTooGeneric(text, kind) {
  const trimmed = String(text ?? '').trim();
  if (trimmed.length === 0) return 'it is empty';
  if (BARE.has(trimmed.toLowerCase())) return `'${trimmed}' is the first word of any assertion failure`;
  // A wait for an element to be present ends in this message whatever broke: a broken button, a broken page or a slow service.
  if (/^timeout of \d+s has expired while waiting for <<[^>]+>>\.isPresent\(\) to equal true$/i.test(trimmed)) {
    return 'it is a presence timeout, which a broken page, button or slow service prints as well (assert where the browser ended up, or what it showed)';
  }
  // An image name is what Playwright prints for any pixel difference. That is a page-changed catch, which the proof counts separately.
  if (kind !== 'visual-check' && /^[\w.-]+-actual\.png$/.test(trimmed)) return 'an image name is printed for any change to the page, so it names no reason';
  return null;
}
