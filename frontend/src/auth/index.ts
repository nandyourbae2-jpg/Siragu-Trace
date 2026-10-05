/**
 * Public re-exports for the auth module.
 * Import from '@/auth' (never from deep paths) to keep coupling shallow.
 */
export { AuthProvider, useAuth } from './authContext';
export { mockAuthAdapter, filterByOrg, MOCK_ORGANIZATIONS } from './mockAuthAdapter';
export type { AuthUser, AuthSession, AuthAdapter, Role } from './types';
export { ROLES } from './types';
