/**
 * Role-Based Access Control (RBAC) for SIRAGU Trace.
 *
 * DESIGN PRINCIPLES:
 * 1. All permission logic lives here — components never hardcode role checks.
 * 2. Permissions are additive: each role lists exactly what it CAN do.
 * 3. To add a new permission: add it to `Permission`, then to each role map
 *    entry that should have it. Components/routes just call `can(user, 'some-perm')`.
 */

import type { Role } from '@/auth/types';

// ── Permission Enum ───────────────────────────────────────────────────────────

export type Permission =
  | 'view:dashboard'
  | 'view:lots'
  | 'view:trace'
  | 'create:lot'
  | 'edit:lot'
  | 'delete:lot'
  | 'trigger:release'
  | 'view:iot'
  | 'view:reports'
  | 'manage:buyers'
  | 'manage:certificates'
  | 'manage:inspections'
  | 'view:receiving'
  | 'view:packaging'
  | 'view:distribution';

// ── Permission Map ────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  owner: new Set<Permission>([
    'view:dashboard',
    'view:lots',
    'view:trace',
    'create:lot',
    'edit:lot',
    'delete:lot',
    'trigger:release',
    'view:iot',
    'view:reports',
    'manage:buyers',
    'manage:certificates',
    'manage:inspections',
  ]),

  operator: new Set<Permission>([
    'view:dashboard',
    'view:lots',
    'create:lot',
    'edit:lot',
    'view:receiving',
    'view:packaging',
    'view:distribution',
  ]),
};

// ── Core Permission Check ─────────────────────────────────────────────────────

/**
 * Returns true if the given role has the requested permission.
 * Use `usePermission()` in components instead of calling this directly.
 */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Returns true if the given role has ALL of the requested permissions.
 */
export function canAll(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

/**
 * Returns true if the given role has AT LEAST ONE of the requested permissions.
 */
export function canAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

// ── Navigation Definition ─────────────────────────────────────────────────────
// Each nav item declares the permission required to see it.
// AppShell reads this list and filters by the current user's role.

import {
  Home,
  Package,
  Search,
  ClipboardCheck,
  Settings,
  ShieldAlert,
  Users,
  Box,
  FileBadge,
  Activity,
  Truck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** If true, end-match the path (active only on exact match). */
  end?: boolean;
}

export const ROLE_NAV_ITEMS: Record<Role, NavItem[]> = {
  owner: [
    { label: 'Beranda Efisiensi', to: '/app/dashboard', icon: Home, end: true },
    { label: 'Mitra Pembeli', to: '/app/buyers', icon: Users },
    { label: 'Persetujuan Mutu', to: '/app/operations/release', icon: ShieldAlert },
    { label: 'Kondisi Gudang', to: '/app/inventory/inspections', icon: Box },
    { label: 'Izin & Sertifikat', to: '/app/settings/certificates', icon: FileBadge },
    { label: 'Sensor & Layanan', to: '/app/iot', icon: Activity },
    { label: 'Rapor Pemasok', to: '/app/reports/suppliers', icon: ClipboardCheck },
    { label: 'Ketertelusuran', to: '/app/trace', icon: Search },
  ],
  operator: [
    { label: 'Papan Tugas', to: '/app/dashboard', icon: Home, end: true },
    { label: 'Terima Bahan Baku', to: '/app/operations/receiving', icon: ClipboardCheck },
    { label: 'Olah & Susut', to: '/app/lots', icon: Package },
    { label: 'Siapkan Kemasan', to: '/app/operations/packaging', icon: Box },
    { label: 'Catat Pengiriman', to: '/app/distribution', icon: Truck },
  ],
};

// ── Route Permission Map ──────────────────────────────────────────────────────
// Maps each protected route path to its required permission.
// ProtectedRoute reads this to decide whether to render or redirect to /403.

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/app/dashboard': 'view:dashboard',
  '/app/lots': 'view:lots',
  '/app/trace': 'view:trace',
  '/app/operations/receiving': 'view:receiving',
  '/app/operations/release': 'trigger:release',
  '/app/operations/packaging': 'view:packaging',
  '/app/distribution': 'view:distribution',
  '/app/buyers': 'manage:buyers',
  '/app/inventory/inspections': 'manage:inspections',
  '/app/settings/certificates': 'manage:certificates',
  '/app/iot': 'view:iot',
  '/app/reports/suppliers': 'view:reports',
};
