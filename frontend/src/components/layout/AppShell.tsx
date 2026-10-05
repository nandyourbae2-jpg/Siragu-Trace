/**
 * AppShell — SIRAGU Trace.
 *
 * Layout shell that renders the sidebar (desktop) and bottom nav (mobile).
 * Navigation items are DRIVEN BY RBAC — the shell reads NAV_ITEMS and filters
 * them by the current user's permissions. No role names are hardcoded here.
 */

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { LogOut, ChevronDown, Building2, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth';
import { ROLE_NAV_ITEMS, can, type NavItem } from '@/rbac';
import type { LucideIcon } from 'lucide-react';

// ── Role badge colours ────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-violet-100 text-violet-700',
  operator: 'bg-blue-100 text-blue-700',
};

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  // Filter nav items based on user role
  const visibleNav: NavItem[] = user && ROLE_NAV_ITEMS[user.role]
    ? ROLE_NAV_ITEMS[user.role]
    : [];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface text-surface-foreground">
        {/* Brand */}
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <BadgeCheck size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">SIRAGU Trace</h1>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => (
            <SidebarNavItem key={item.to} item={item} />
          ))}
        </nav>

        {/* User section */}
        {user && (
          <div className="border-t border-border p-3">
            <button
              id="sidebar-profile-toggle"
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user.initials}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  'text-muted-foreground transition-transform flex-shrink-0',
                  profileOpen && 'rotate-180',
                )}
              />
            </button>

            {profileOpen && (
              <div className="mt-1 mx-1 p-3 rounded-lg bg-muted/60 space-y-3">
                {/* Role */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-semibold capitalize',
                      ROLE_BADGE[user.role] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    {user.role}
                  </span>
                </div>
                {/* Org */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 size={13} className="flex-shrink-0" />
                  <span className="truncate">{user.organizationName}</span>
                </div>
                {/* Logout */}
                <button
                  id="sidebar-logout-button"
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium"
                >
                  <LogOut size={15} />
                  Keluar
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-surface flex items-center px-4 justify-between">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <BadgeCheck size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-foreground">SIRAGU</span>
          </div>

          {/* Right cluster */}
          {user && (
            <div className="flex items-center gap-3 ml-auto">
              {/* Org chip */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
                <Building2 size={12} />
                <span className="font-medium">{user.organizationName}</span>
              </div>

              {/* Role badge */}
              <span
                className={cn(
                  'hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize',
                  ROLE_BADGE[user.role] ?? 'bg-muted text-muted-foreground',
                )}
              >
                {user.role === 'owner' ? 'Pemilik (Owner)' : 'Operator Lapangan'}
              </span>

              {/* Avatar + name */}
              <div className="flex items-center gap-2">
                <span className="hidden md:block text-sm font-medium text-foreground">
                  {user.name}
                </span>
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {user.initials}
                </div>
              </div>

              {/* Logout (topbar quick access) */}
              <button
                id="topbar-logout-button"
                type="button"
                onClick={handleLogout}
                title="Keluar"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface flex justify-around items-stretch z-50">
          {visibleNav.slice(0, 5).map((item) => (
            <MobileNavItem key={item.to} item={item} />
          ))}
        </nav>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SidebarNavItem({ item }: { item: NavItem }) {
  const Icon: LucideIcon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      <Icon size={18} className="flex-shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

function MobileNavItem({ item }: { item: NavItem }) {
  const Icon: LucideIcon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center flex-1 py-2 gap-1',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )
      }
    >
      <Icon size={22} />
      <span className="text-[10px] font-medium leading-tight">{item.label}</span>
    </NavLink>
  );
}
