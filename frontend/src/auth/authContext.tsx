/**
 * Authentication Context & Provider for SIRAGU Trace.
 *
 * Provides a single `useAuth()` hook that components can call to:
 *   - Read the current user / session
 *   - Call `login()` / `logout()`
 *   - Check `isLoading` during session restore
 *
 * The concrete adapter is injected here. To switch from mock → real auth,
 * change `ACTIVE_AUTH_ADAPTER` below — nothing else in the app changes.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type { AuthAdapter, AuthSession, AuthUser } from './types';
import { mockAuthAdapter } from './mockAuthAdapter';

// ── Active Adapter (swap this line to switch implementations) ─────────────────
const ACTIVE_AUTH_ADAPTER: AuthAdapter = mockAuthAdapter;

// ── Context Types ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** The authenticated user, or null when logged out. */
  user: AuthUser | null;
  /** The full session object, or null when logged out. */
  session: AuthSession | null;
  /** True while the initial session-restore check is running. */
  isLoading: boolean;
  /** Attempt login. Throws on bad credentials. */
  login(email: string, password: string): Promise<void>;
  /** Clear the session. */
  logout(): Promise<void>;
}

// ── Context & Hook ────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be called inside <AuthProvider>.');
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    ACTIVE_AUTH_ADAPTER.restoreSession()
      .then((restored) => {
        setSession(restored);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const newSession = await ACTIVE_AUTH_ADAPTER.login(email, password);
    setSession(newSession);
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await ACTIVE_AUTH_ADAPTER.logout();
    setSession(null);
  }, []);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
