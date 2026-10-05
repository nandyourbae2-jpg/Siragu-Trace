/**
 * Authentication types for SIRAGU Trace.
 *
 * ABSTRACTION LAYER:
 * These types form the contract between the rest of the app and the auth
 * implementation. The MockAuthAdapter (used in dev/demo) can be swapped for
 * a real NestJS + Prisma adapter without changing any consumer code.
 */

// ── Roles ─────────────────────────────────────────────────────────────────────

export const ROLES = ['owner', 'operator'] as const;
export type Role = (typeof ROLES)[number];

// ── User / Session ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Tenant isolation key — users can only see data for their own org. */
  organizationId: string;
  organizationName: string;
  /** First two characters used for the avatar badge. */
  initials: string;
}

export interface AuthSession {
  user: AuthUser;
  /** ISO-8601 timestamp of when the session was created. */
  issuedAt: string;
}

// ── Auth Adapter Interface ────────────────────────────────────────────────────

/**
 * Every auth implementation (mock, NestJS/JWT, Supabase, etc.) must satisfy
 * this interface. Components and hooks only ever depend on this interface, not
 * on a concrete implementation.
 */
export interface AuthAdapter {
  /** Attempt login. Resolves with a session or rejects on bad credentials. */
  login(email: string, password: string): Promise<AuthSession>;

  /** Clear the session and navigate the user out. */
  logout(): Promise<void>;

  /** Re-hydrate a persisted session (e.g., from localStorage). Returns null if
   *  no valid session exists. */
  restoreSession(): Promise<AuthSession | null>;
}
