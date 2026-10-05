/**
 * Auth types — shared across the entire backend.
 * These mirror the frontend's AuthUser shape so both sides speak the same language.
 */

export enum Role {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  OPERATOR = 'OPERATOR',
  QA = 'QA',
  BUYER = 'BUYER',
  CONSUMER = 'CONSUMER',
}

/** Shape stored inside the JWT payload (kept small — no PII beyond email). */
export interface JwtPayload {
  sub: string;           // User ID
  email: string;
  role: Role;
  organizationId: string | null;
  iat?: number;
  exp?: number;
}

/** The object attached to `request.user` after JWT validation. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
  organizationName: string | null;
}
