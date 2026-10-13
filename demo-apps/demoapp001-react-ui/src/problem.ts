// version: 1 | created: 2026-10-13T20:30Z | project: credit-dashboard-sut | type: source | language: en-GB
// The text of a problem response (RFC 9457) as the service wrote it: its `detail`, else its `title`, else our own words.
export function problemText(problem: unknown, fallback: string): string {
  const body = problem as { detail?: string; title?: string } | undefined;
  return body?.detail ?? body?.title ?? fallback;
}
