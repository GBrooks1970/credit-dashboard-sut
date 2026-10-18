// version: 2 | created: 2026-10-16T14:00Z | project: credit-dashboard-sut | type: source | language: en-GB
// The open-redirect guard (UI specification 6.6). A return address is followed only if it is a path on this site; anything
// else, including a protocol-relative `//host`, a backslash trick and dot segments that collapse to `//host`, falls back to the
// page the customer came from. What is judged is the address the URL parser resolves, because that is what a browser would
// follow (CDS-38 C-01): the input can look harmless (`/..//evil.example`) and resolve to `//evil.example`.
import { TEST_BUILD, flagOn } from './flags.tsx';

const BASE = 'http://site.invalid';

export function safeRedirect(target: string | null | undefined, fallback: string): string {
  // The `open-redirect` bug flag (test build only; UI specification 8): the guard is removed and any return address is followed.
  if (TEST_BUILD && flagOn('open-redirect')) return target || fallback;
  if (!target || !target.startsWith('/')) return fallback;
  try {
    // The URL parser drops tabs and newlines, reads `\` as `/` and removes dot segments.
    const resolved = new URL(target, BASE);
    if (resolved.origin !== BASE) return fallback;
    const path = resolved.pathname + resolved.search + resolved.hash;
    // One leading slash, then a character that is neither `/` nor `\`: otherwise a router or browser may read it as another host.
    return /^\/(?![/\\])/.test(path) ? path : fallback;
  } catch {
    return fallback;
  }
}
