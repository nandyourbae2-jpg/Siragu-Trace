import type { AuthAdapter, AuthSession, AuthUser, Role } from './types.js';
import { authApi } from '@/lib/api';
import { mockAuthAdapter } from './mockAuthAdapter';

function formatUser(raw: any): AuthUser {
  const roleStr = String(raw.role || 'operator').toLowerCase();
  const validRoles: Role[] = ['owner', 'operator', 'qa', 'manager', 'admin', 'buyer'];
  const role: Role = validRoles.includes(roleStr as Role) ? (roleStr as Role) : 'operator';
  const name = raw.name || 'Pengguna SIRAGU';

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('');

  return {
    id: raw.id || 'usr_current',
    email: raw.email || '',
    name,
    role,
    organizationId: raw.organizationId || 'org_siragu_central',
    organizationName: raw.organization?.name || raw.organizationName || 'Koperasi Nira Lestari Banyumas',
    initials: initials || 'SR',
  };
}

export const realAuthAdapter: AuthAdapter = {
  async login(email: string, password: string): Promise<AuthSession> {
    try {
      const res = await authApi.login({ email, password });
      if (res.access_token) {
        localStorage.setItem('token', res.access_token);
        const user = formatUser(res.user);
        const session: AuthSession = {
          user,
          issuedAt: new Date().toISOString(),
        };
        localStorage.setItem('siragu_session', JSON.stringify(session));
        return session;
      }
    } catch (err) {
      // If demo email or backend error in demo mode, try mock adapter as fallback
      if (email.endsWith('@siragu.demo') || email === 'owner@siragu.id') {
        try {
          return await mockAuthAdapter.login(email, password);
        } catch {
          // Re-throw original API error
        }
      }
      throw err;
    }
    throw new Error('Gagal masuk ke sistem SIRAGU Trace.');
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('siragu_session');
    await mockAuthAdapter.logout();
  },

  async restoreSession(): Promise<AuthSession | null> {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userRes = await authApi.me();
        const user = formatUser(userRes);
        const session: AuthSession = {
          user,
          issuedAt: new Date().toISOString(),
        };
        localStorage.setItem('siragu_session', JSON.stringify(session));
        return session;
      } catch {
        localStorage.removeItem('token');
      }
    }

    // Try restoring mock session if available
    return mockAuthAdapter.restoreSession();
  },
};
