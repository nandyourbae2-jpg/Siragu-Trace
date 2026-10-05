/**
 * Route Guard Components for SIRAGU Trace.
 *
 * RequireAuth   — redirects to /login if not authenticated.
 * RequirePerm   — redirects to /403 if the user lacks the required permission.
 * RequireAuth wraps RequirePerm so every protected route has both checks.
 *
 * Usage in router:
 *   <Route element={<RequireAuth />}>
 *     <Route element={<RequirePerm permission="view:lots" />}>
 *       <Route path="lots" element={<Lots />} />
 *     </Route>
 *   </Route>
 */

import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/auth';
import { usePermission, type Permission } from '@/rbac';

// ── Require Auth ──────────────────────────────────────────────────────────────

/**
 * Wraps child routes that require the user to be authenticated.
 * Stores the intended URL so after login the user lands on the right page.
 */
export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show nothing (or a skeleton) while restoring the session.
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Restoring session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Preserve the attempted URL so login can redirect back.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// ── Require Permission ────────────────────────────────────────────────────────

interface RequirePermProps {
  permission: Permission;
}

/**
 * Wraps child routes that require a specific permission.
 * Must be nested inside <RequireAuth> so `user` is always non-null here.
 */
export function RequirePerm({ permission }: RequirePermProps) {
  const allowed = usePermission(permission);

  if (!allowed) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
