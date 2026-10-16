import { act, renderHook, waitFor } from '@testing-library/react';
import { useResource } from './useResource.ts';

// CDS-38 C-03: an answer that arrives after a newer request was made, or after the page was left, must not replace what is current.

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe('useResource and late answers', () => {
  it('ignores the answer to an earlier request that arrives after the answer to a later one', async () => {
    const answers = { a: deferred<string>(), b: deferred<string>() };
    const { result, rerender } = renderHook(({ key }: { key: 'a' | 'b' }) => useResource(() => answers[key].promise, [key]), { initialProps: { key: 'a' } });
    expect(result.current.state).toBe('loading');
    rerender({ key: 'b' });
    await act(async () => answers.b.resolve('answer to b'));
    await waitFor(() => expect(result.current.data).toBe('answer to b'));
    await act(async () => answers.a.resolve('late answer to a'));
    expect(result.current.data).toBe('answer to b');
    expect(result.current.state).toBe('populated');
  });

  it('ignores a late failure of an earlier request', async () => {
    const first = deferred<string | null>();
    const second = deferred<string | null>();
    const { result, rerender } = renderHook(({ n }: { n: number }) => useResource(() => (n === 1 ? first.promise : second.promise), [n]), { initialProps: { n: 1 } });
    rerender({ n: 2 });
    await act(async () => second.resolve('fine'));
    await waitFor(() => expect(result.current.state).toBe('populated'));
    await act(async () => first.resolve(null)); // the earlier call failed, late
    expect(result.current.state).toBe('populated');
    expect(result.current.data).toBe('fine');
  });

  it('does not set state after the page was left', async () => {
    const late = deferred<string>();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useResource(() => late.promise, []));
    unmount();
    await act(async () => late.resolve('too late'));
    expect(result.current.data).toBeNull();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
