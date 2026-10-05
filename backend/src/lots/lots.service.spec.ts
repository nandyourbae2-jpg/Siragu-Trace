/**
 * Unit tests — LotsService tenant isolation
 *
 * Key test: a lot belonging to org-beta-002 CANNOT be retrieved
 * by a user from org-alpha-001 — NotFoundException is thrown.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { LotsService } from './lots.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

function makePrisma() {
  return {
    lot: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lotEvent: { create: vi.fn() },
    $transaction: vi.fn(),
  };
}

const LOT_ALPHA = {
  id: 'lot-alpha-001',
  organizationId: 'org-alpha-001',
  lotCode: 'ALPHA-2024-001',
  productName: 'Jasmine Rice',
  quantity: 500,
  unit: 'kg',
  status: 'ACTIVE',
  deletedAt: null,
  location: null,
  createdBy: null,
};

describe('LotsService', () => {
  let service: LotsService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(async () => {
    prisma = makePrisma();
    const module = await Test.createTestingModule({
      providers: [
        LotsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(LotsService);
  });

  // ── findOne — tenant isolation ─────────────────────────────────────────────

  describe('findOne()', () => {
    it('returns lot when organizationId matches', async () => {
      prisma.lot.findFirst.mockResolvedValue(LOT_ALPHA);

      const result = await service.findOne('org-alpha-001', 'lot-alpha-001');
      expect(result.id).toBe('lot-alpha-001');
    });

    it('throws NotFoundException when lot belongs to different org', async () => {
      // Prisma WHERE clause scopes by org — returns null for wrong org.
      prisma.lot.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('org-alpha-001', 'lot-beta-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for soft-deleted lots', async () => {
      prisma.lot.findFirst.mockResolvedValue(null); // deletedAt != null filtered out

      await expect(
        service.findOne('org-alpha-001', 'lot-deleted-001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── create — conflict detection ───────────────────────────────────────────

  describe('create()', () => {
    it('throws ConflictException if lotCode already exists in org', async () => {
      prisma.lot.findFirst.mockResolvedValue(LOT_ALPHA); // duplicate found

      await expect(
        service.create('org-alpha-001', 'user-001', {
          lotCode: 'ALPHA-2024-001',
          productName: 'New Product',
          quantity: 100,
          unit: 'kg',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates lot and appends LOT_CREATED event', async () => {
      prisma.lot.findFirst.mockResolvedValue(null); // no duplicate
      prisma.lot.create.mockResolvedValue({ ...LOT_ALPHA, id: 'lot-new-001' });
      prisma.lotEvent.create.mockResolvedValue({});

      const result = await service.create('org-alpha-001', 'user-001', {
        lotCode: 'ALPHA-2024-NEW',
        productName: 'New Product',
        quantity: 100,
        unit: 'kg',
      });

      expect(result.id).toBe('lot-new-001');
      expect(prisma.lotEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'LOT_CREATED' }),
        }),
      );
    });
  });

  // ── softDelete ─────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('sets deletedAt and appends LOT_DELETED event', async () => {
      prisma.lot.findFirst.mockResolvedValue(LOT_ALPHA);
      prisma.lot.update.mockResolvedValue({ ...LOT_ALPHA, deletedAt: new Date() });
      prisma.lotEvent.create.mockResolvedValue({});

      await service.softDelete('org-alpha-001', 'user-owner-001', 'lot-alpha-001');

      expect(prisma.lot.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(prisma.lotEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'LOT_DELETED' }),
        }),
      );
    });
  });
});
