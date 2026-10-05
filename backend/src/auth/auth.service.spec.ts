/**
 * Unit tests — AuthService
 *
 * Uses a mock PrismaService and mock JwtService so no DB connection needed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from './auth.types.js';
import bcrypt from 'bcrypt';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePrisma() {
  return {
    user: { findUnique: vi.fn() },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };
}

function makeJwt() {
  return { sign: vi.fn().mockReturnValue('mock.jwt.token') };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;

  const passwordHash = bcrypt.hashSync('demo1234', 1); // fast for tests

  const mockUser = {
    id: 'user-owner-001',
    email: 'owner@siragu.demo',
    name: 'Arjun Rajan',
    role: Role.OWNER,
    organizationId: 'org-alpha-001',
    passwordHash,
    isActive: true,
    organization: { id: 'org-alpha-001', name: 'Siragu Farms Alpha' },
  };

  beforeEach(async () => {
    prisma = makePrisma();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: makeJwt() },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  // ── validateUser ───────────────────────────────────────────────────────────

  describe('validateUser()', () => {
    it('returns AuthenticatedUser on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('owner@siragu.demo', 'demo1234');

      expect(result.id).toBe('user-owner-001');
      expect(result.role).toBe(Role.OWNER);
      expect(result.organizationId).toBe('org-alpha-001');
    });

    it('throws UnauthorizedException on wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.validateUser('owner@siragu.demo', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateUser('unknown@siragu.demo', 'demo1234'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.validateUser('owner@siragu.demo', 'demo1234'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('returns access_token, refresh_token, and user', async () => {
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        id: 'user-owner-001',
        email: 'owner@siragu.demo',
        name: 'Arjun Rajan',
        role: Role.OWNER,
        organizationId: 'org-alpha-001',
        organizationName: 'Siragu Farms Alpha',
      });

      expect(result.access_token).toBe('mock.jwt.token');
      expect(result.refresh_token).toBeTruthy();
      expect(result.user.email).toBe('owner@siragu.demo');
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('revokes the refresh token', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('some-raw-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
