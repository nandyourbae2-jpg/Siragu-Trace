/**
 * RBAC React hooks for SIRAGU Trace.
 *
 * These hooks are the ONLY way components should check permissions.
 * They combine `useAuth()` with the core `can()` function so components
 * remain decoupled from both auth state and role logic.
 */

import { useAuth } from '@/auth';
import { can, canAll, canAny, type Permission } from './permissions';

/**
 * Returns whether the current user has the given permission.
 * Returns `false` when the user is not authenticated.
 *
 * @example
 *   const canCreate = usePermission('create:lot');
 *   if (!canCreate) return null;
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return can(user.role, permission);
}

/**
 * Returns whether the current user has ALL of the given permissions.
 */
export function usePermissionAll(permissions: Permission[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return canAll(user.role, permissions);
}

/**
 * Returns whether the current user has ANY of the given permissions.
 */
export function usePermissionAny(permissions: Permission[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return canAny(user.role, permissions);
}
