// version: 1 | created: 2026-10-16T14:00Z | project: credit-dashboard-sut | type: source | language: en-GB
// Latest-request-wins (CDS-38 C-03). `begin()` starts a request and returns a function that says whether it is still the current
// one; an answer is used only if it is. A newer request, or leaving the page, makes every earlier one stale, so a slow answer to
// an old filter, year or range can never replace what the customer asked for last.
import { useCallback, useEffect, useRef } from 'react';

export function useLatest() {
  const counter = useRef(0);
  useEffect(
    () => () => {
      counter.current += 1; // the page was left: nothing in flight is current any more
    },
    [],
  );
  return useCallback(() => {
    const mine = ++counter.current;
    return () => mine === counter.current;
  }, []);
}
