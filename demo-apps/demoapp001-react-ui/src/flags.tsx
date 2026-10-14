// version: 1 | created: 2026-10-14T09:40Z | project: credit-dashboard-sut | type: source | language: en-GB
// The bug flags in the UI (UI specification 3 and 8, decision brief 13 D1, DR-064). In a TEST BUILD (`VITE_TEST_BUILD=true`) the
// app reads `GET /__test/state` once at start, with the control key the harness put in browser storage, and a flag then changes
// what the UI does. In any other build none of this runs: no request is made, no flag is ever on, and the key is never read.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { components } from '@credit-dashboard-sut/api-client';
import { API_BASE_URL } from './api.ts';

export type BugFlag = components['schemas']['BugFlag'];

/** True only in a build made for the harness. */
export const TEST_BUILD: boolean = import.meta.env.VITE_TEST_BUILD === 'true';

/** Where the harness puts the control key before the page loads. */
export const KEY_STORAGE = 'cds.testControlKey';

/** Every flag in the contract. The check below fails the build if the contract gains a flag this list lacks. */
export const ALL_FLAGS = [
  'excluded-in-total', 'rounding-down', 'history-carry-forward', 'idor', 'problem-json-missing', 'mask-format', 'currency-float',
  'duplicate-nav', 'util-mismatch', 'currency-format', 'minor-units-label', 'placeholder-aria', 'chart-no-values', 'range-stale',
  'toggle-label', 'like-both', 'plural', 'button-href', 'double-render', 'ph-a11y', 'open-redirect', 'truncate-summary', 'negative-balance',
  'nested-button', 'decorative-alt', 'preferred-on-report', 'preferred-no-trim', 'email-stays-verified', 'pii-in-title', 'lost-edit',
] as const satisfies readonly BugFlag[];
type MissingFromList = Exclude<BugFlag, (typeof ALL_FLAGS)[number]>;
const everyFlagIsListed: [MissingFromList] extends [never] ? true : never = true;
void everyFlagIsListed;

let current: ReadonlySet<string> = new Set();

/** Whether a flag is on. Safe to call from any module, including pure formatters; always false outside a test build. */
export function flagOn(name: BugFlag): boolean {
  return TEST_BUILD && current.has(name);
}

export function controlKey(): string | null {
  try {
    return window.localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

/** Reads the flags once. A failure of any kind means no flags: a test build with no test control behaves as a normal one. */
export async function readFlags(): Promise<string[]> {
  try {
    const key = controlKey();
    const response = await fetch(`${API_BASE_URL}/__test/state`, { headers: key ? { 'x-test-control-key': key } : {} });
    if (!response.ok) return [];
    const state = (await response.json()) as { flags?: unknown };
    return Array.isArray(state.flags) ? state.flags.filter((f): f is string => typeof f === 'string') : [];
  } catch {
    return [];
  }
}

const FlagsContext = createContext<readonly string[]>([]);

/** The flags that were on when the app started (a test build); `useFlag('plural')`. */
export function useFlag(name: BugFlag): boolean {
  return useContext(FlagsContext).includes(name);
}

export function FlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<readonly string[] | null>(TEST_BUILD ? null : []);
  useEffect(() => {
    if (!TEST_BUILD) return;
    let live = true;
    void readFlags().then((read) => {
      current = new Set(read);
      if (live) setFlags(read);
    });
    return () => {
      live = false;
    };
  }, []);
  // The app waits for the flags in a test build, so no page ever renders once without them.
  if (flags === null) return null;
  return <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>;
}
