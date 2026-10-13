// version: 1 | created: 2026-10-13T18:16Z | project: credit-dashboard-sut | type: source | language: en-GB
// The open-redirect guard (UI specification 6.6). A return address is followed only if it is a path on this site; anything
// else, including a protocol-relative `//host` and a backslash trick, falls back to the page the customer came from.
const BASE = 'http://site.invalid';

export function safeRedirect(target: string | null | undefined, fallback: string): string {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback;
  try {
    // The URL parser drops tabs and newlines and reads `\` as `/`, so what it resolves to is what a browser would follow.
    const resolved = new URL(target, BASE);
    return resolved.origin === BASE ? resolved.pathname + resolved.search + resolved.hash : fallback;
  } catch {
    return fallback;
  }
}
