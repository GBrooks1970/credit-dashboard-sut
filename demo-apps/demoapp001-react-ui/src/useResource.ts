// version: 1 | created: 2026-10-13T13:50Z | project: credit-dashboard-sut | type: source | language: en-GB
// Loads one resource into the four states of UI specification 4.3. `load` returns the data, or null when the call did not
// succeed (the typed client reports an error as data-less, not as an exception); a thrown error is the same.
import { useCallback, useEffect, useState } from 'react';
import type { SectionStateName } from './components/SectionState.tsx';
import { useLatest } from './useLatest.ts';

export function useResource<T>(load: () => Promise<T | null | undefined>, deps: readonly unknown[], isEmpty: (data: T) => boolean = () => false) {
  const [state, setState] = useState<SectionStateName>('loading');
  const [data, setData] = useState<T | null>(null);
  const begin = useLatest();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    const current = begin();
    setState('loading');
    try {
      const result = await load();
      if (!current()) return; // a newer request was made, or the page was left: this answer is stale (CDS-38 C-03)
      if (result == null) {
        setState('error');
        return;
      }
      setData(result);
      setState(isEmpty(result) ? 'empty' : 'populated');
    } catch {
      if (current()) setState('error');
    }
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, data, reload };
}
