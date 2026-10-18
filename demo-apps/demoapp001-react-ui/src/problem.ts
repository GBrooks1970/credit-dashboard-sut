// version: 2 | created: 2026-10-13T20:30Z | project: credit-dashboard-sut | type: source | language: en-GB
// The text of a problem response (RFC 9457) as the service wrote it. When the service names the field that was refused (`errors[0]`), that
// message is the useful one ("must be an email address"), so it is shown, with a capital and a full stop; else the `detail`, else the
// `title`, else our own words (CDS-38 C-26).
export function problemText(problem: unknown, fallback: string): string {
  const body = problem as { detail?: string; title?: string; errors?: { message?: string }[] } | undefined;
  const field = body?.errors?.[0]?.message?.trim();
  if (field) return `${field.charAt(0).toUpperCase()}${field.slice(1)}${/[.!?]$/.test(field) ? '' : '.'}`;
  return body?.detail ?? body?.title ?? fallback;
}
