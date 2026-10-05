/**
 * Mock Authentication Adapter for SIRAGU Trace.
 *
 * This module satisfies the `AuthAdapter` interface using in-memory fixtures.
 * It persists the session to `sessionStorage` so it survives page navigation
 * but is cleared when the browser tab is closed (suitable for demo scenarios).
 *
 * REPLACEMENT PATH:
 *   When real NestJS + Prisma auth is ready, create `realAuthAdapter.ts` that
 *   calls the NestJS `/auth/login` endpoint, stores a JWT, and returns the same
 *   `AuthSession` shape. Then swap `ACTIVE_AUTH_ADAPTER` in `authContext.tsx`.
 *   No other files need to change.
 */

import type { AuthAdapter, AuthSession, AuthUser } from './types';

// ── Demo Organizations ────────────────────────────────────────────────────────

const ORG_A = {
  id: 'org-alpha-001',
  name: 'Siragu Farms Alpha',
};

const ORG_B = {
  id: 'org-beta-002',
  name: 'Siragu Farms Beta',
};

// ── Demo Users ────────────────────────────────────────────────────────────────

const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  'owner@siragu.demo': {
    password: 'demo1234',
    user: {
      id: 'user-owner-001',
      email: 'owner@siragu.demo',
      name: 'Arjun Rajan',
      role: 'owner',
      organizationId: ORG_A.id,
      organizationName: ORG_A.name,
      initials: 'AR',
    },
  },
  'operator@siragu.demo': {
    password: 'demo1234',
    user: {
      id: 'user-operator-001',
      email: 'operator@siragu.demo',
      name: 'Priya Kumar',
      role: 'operator',
      organizationId: ORG_A.id,
      organizationName: ORG_A.name,
      initials: 'PK',
    },
  },


};

// ── Session Storage Key ───────────────────────────────────────────────────────

const SESSION_KEY = 'siragu_trace_session';

// ── Mock Adapter Implementation ───────────────────────────────────────────────

export const mockAuthAdapter: AuthAdapter = {
  async login(email: string, password: string): Promise<AuthSession> {
    // Simulate a short network delay.
    await new Promise((r) => setTimeout(r, 400));

    const record = DEMO_USERS[email.toLowerCase().trim()];
    if (!record || record.password !== password) {
      throw new Error('Invalid email or password.');
    }

    const session: AuthSession = {
      user: record.user,
      issuedAt: new Date().toISOString(),
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async logout(): Promise<void> {
    sessionStorage.removeItem(SESSION_KEY);
  },

  async restoreSession(): Promise<AuthSession | null> {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },
};

// ── Tenant Isolation Helper ───────────────────────────────────────────────────

/**
 * Returns the mock data rows that belong to the user's organization.
 * In production this filtering happens server-side (Prisma `where` clause).
 * Here we replicate the guard on the client to test isolation behaviour.
 */
export function filterByOrg<T extends { organizationId: string }>(
  rows: T[],
  organizationId: string,
): T[] {
  return rows.filter((r) => r.organizationId === organizationId);
}

// ── Organization Fixtures (for isolation testing) ─────────────────────────────

export const MOCK_ORGANIZATIONS = { ORG_A, ORG_B } as const;
