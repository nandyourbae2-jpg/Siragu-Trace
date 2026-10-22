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

const DEMO_USERS: Record<string, { passwords: string[]; user: AuthUser }> = {
  'owner@siragu.demo': {
    passwords: ['demo1234', 'Siragu2026!'],
    user: {
      id: 'user-owner-001',
      email: 'owner@siragu.demo',
      name: 'Bambang Sugeng (Pemilik)',
      role: 'owner',
      organizationId: ORG_A.id,
      organizationName: 'Koperasi Nira Lestari Banyumas',
      initials: 'BS',
    },
  },
  'owner@siragu.id': {
    passwords: ['demo1234', 'Siragu2026!'],
    user: {
      id: 'user-owner-001',
      email: 'owner@siragu.id',
      name: 'Bambang Sugeng (Pemilik)',
      role: 'owner',
      organizationId: ORG_A.id,
      organizationName: 'Koperasi Nira Lestari Banyumas',
      initials: 'BS',
    },
  },
  'qa@siragu.demo': {
    passwords: ['demo1234', 'Siragu2026!'],
    user: {
      id: 'user-qa-001',
      email: 'qa@siragu.demo',
      name: 'Dewi Sartika (Kepala Jaminan Mutu)',
      role: 'qa',
      organizationId: ORG_A.id,
      organizationName: 'Koperasi Nira Lestari Banyumas',
      initials: 'DS',
    },
  },
  'qa@siragu.id': {
    passwords: ['demo1234', 'Siragu2026!'],
    user: {
      id: 'user-qa-001',
      email: 'qa@siragu.id',
      name: 'Dewi Sartika (Kepala Jaminan Mutu)',
      role: 'qa',
      organizationId: ORG_A.id,
      organizationName: 'Koperasi Nira Lestari Banyumas',
      initials: 'DS',
    },
  },
  'operator@siragu.demo': {
    passwords: ['demo1234', 'Siragu2026!'],
    user: {
      id: 'user-operator-001',
      email: 'operator@siragu.demo',
      name: 'Siti Rahma (Operator Pabrik)',
      role: 'operator',
      organizationId: ORG_A.id,
      organizationName: 'Koperasi Nira Lestari Banyumas',
      initials: 'SR',
    },
  },
  'operator@siragu.id': {
    passwords: ['demo1234', 'Siragu2026!'],
    user: {
      id: 'user-operator-001',
      email: 'operator@siragu.id',
      name: 'Siti Rahma (Operator Pabrik)',
      role: 'operator',
      organizationId: ORG_A.id,
      organizationName: 'Koperasi Nira Lestari Banyumas',
      initials: 'SR',
    },
  },
  'buyer@siragu.demo': {
    passwords: ['demo1234', 'Siragu2026!'],
    user: {
      id: 'user-buyer-001',
      email: 'buyer@siragu.demo',
      name: 'Hendro Wicaksono (PT Megah Rasa Pangan)',
      role: 'buyer',
      organizationId: ORG_B.id,
      organizationName: 'PT Megah Rasa Pangan',
      initials: 'HW',
    },
  },
  'buyer@siragu.id': {
    passwords: ['demo1234', 'Siragu2026!'],
    user: {
      id: 'user-buyer-001',
      email: 'buyer@siragu.id',
      name: 'Hendro Wicaksono (PT Megah Rasa Pangan)',
      role: 'buyer',
      organizationId: ORG_B.id,
      organizationName: 'PT Megah Rasa Pangan',
      initials: 'HW',
    },
  },
};

// ── Session Storage Key ───────────────────────────────────────────────────────

const SESSION_KEY = 'siragu_trace_session';
const LOGGED_OUT_KEY = 'siragu_explicitly_logged_out';

// ── Mock Adapter Implementation ───────────────────────────────────────────────

export const mockAuthAdapter: AuthAdapter = {
  async login(email: string, password: string): Promise<AuthSession> {
    const normEmail = email.trim().toLowerCase();
    const entry = DEMO_USERS[normEmail];

    if (!entry) {
      throw new Error('Email demo tidak terdaftar. Gunakan salah satu email demo yang tersedia.');
    }

    const isMatch = entry.passwords.includes(password) || password === 'demo1234' || password === 'Siragu2026!';
    if (!isMatch) {
      throw new Error('Kata sandi salah. Gunakan kata sandi demo: demo1234');
    }

    const session: AuthSession = {
      user: entry.user,
      issuedAt: new Date().toISOString(),
    };

    sessionStorage.removeItem(LOGGED_OUT_KEY);
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
