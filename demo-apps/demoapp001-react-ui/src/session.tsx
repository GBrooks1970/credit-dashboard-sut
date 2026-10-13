// version: 1 | created: 2026-10-13T10:45Z | project: credit-dashboard-sut | type: source | language: en-GB
// The session (UI specification 6.1): the token lives in memory only, never in localStorage or sessionStorage, so a
// reload signs the customer out. The `@security` login scenario asserts exactly that.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { components } from '@credit-dashboard-sut/api-client';
import { clientFor, type CreditClient } from './api.ts';

export type User = components['schemas']['User'];

export type SignInResult = { ok: true; user: User } | { ok: false; reason: 'rejected' | 'unavailable' };

interface Session {
  /** True once a token is held. */
  signedIn: boolean;
  user: User | null;
  /** A client that sends the token; an anonymous one before sign-in. */
  client: CreditClient;
  signIn(username: string, password: string): Promise<SignInResult>;
  signOut(): void;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const client = useMemo(() => clientFor(token ?? undefined), [token]);

  const signIn = useCallback(async (username: string, password: string): Promise<SignInResult> => {
    try {
      const login = await clientFor().POST('/auth/login', { body: { username, password } });
      if (login.response.status === 401 || login.response.status === 400) return { ok: false, reason: 'rejected' };
      if (!login.data) return { ok: false, reason: 'unavailable' };
      const me = await clientFor(login.data.token).GET('/me');
      if (!me.data) return { ok: false, reason: 'unavailable' };
      setToken(login.data.token);
      setUser(me.data);
      return { ok: true, user: me.data };
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<Session>(
    () => ({ signedIn: token !== null, user, client, signIn, signOut }),
    [token, user, client, signIn, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside a SessionProvider');
  return session;
}
