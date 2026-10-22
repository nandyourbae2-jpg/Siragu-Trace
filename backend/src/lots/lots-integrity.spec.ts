import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient, LotStatus, Role, PackageStatus } from '@prisma/client';
import { LotsService } from './lots.service.js';
import { PackagingService } from '../packaging/packaging.service.js';
import { BatchService } from '../common/batch.service.js';
import { AuditService } from '../common/audit.service.js';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

const prisma = new PrismaClient();

describe('WS1: Business Rules & Tenant Isolation Integrity Tests', () => {
  let lotsService: LotsService;
  let packagingService: PackagingService;
  let auditService: AuditService;
  let batchService: BatchService;

  let tenantAOrgId: string;
  let tenantBOrgId: string;
  let userAId: string;
  let userBId: string;

  beforeEach(async () => {
    auditService = new AuditService(prisma as any);
    batchService = new BatchService(prisma as any);
    lotsService = new LotsService(prisma as any, batchService, auditService);
    packagingService = new PackagingService(prisma as any, auditService);

    // Setup 2 isolated tenants
    const orgA = await prisma.organization.create({
      data: { name: 'Tenant A Test Org' },
    });
    tenantAOrgId = orgA.id;

    const orgB = await prisma.organization.create({
      data: { name: 'Tenant B Test Org' },
    });
    tenantBOrgId = orgB.id;

    const userA = await prisma.user.create({
      data: {
        organizationId: tenantAOrgId,
        name: 'User A',
        email: `usera-${Date.now()}@test.com`,
        role: Role.OPERATOR,
        passwordHash: 'dummy',
      },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        organizationId: tenantBOrgId,
        name: 'User B',
        email: `userb-${Date.now()}@test.com`,
        role: Role.OPERATOR,
        passwordHash: 'dummy',
      },
    });
    userBId = userB.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('RULE 1: netto = bruto - tara is strictly computed and validated on server', async () => {
    // Valid calculation: 100 - 10 = 90
    const lot = await lotsService.create(tenantAOrgId, userAId, {
      lotCode: `LOT-TEST-${Date.now()}`,
      productName: 'Nira Test',
      grossWeight: 100,
      tareWeight: 10,
      unit: 'kg',
    });
    expect(Number(lot.quantity)).toBe(90);

    // Invalid calculation: mismatch declared quantity vs gross-tare
    await expect(
      lotsService.create(tenantAOrgId, userAId, {
        lotCode: `LOT-ERR-${Date.now()}`,
        productName: 'Nira Error',
        quantity: 95, // Mismatch with 100-10 = 90
        grossWeight: 100,
        tareWeight: 10,
        unit: 'kg',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('RULE 2: RELEASED lots are locked against direct un-audited modification or deletion', async () => {
    const lot = await lotsService.create(tenantAOrgId, userAId, {
      lotCode: `LOT-REL-${Date.now()}`,
      productName: 'Gula Semut Released',
      grossWeight: 50,
      tareWeight: 5,
      unit: 'kg',
      status: LotStatus.RELEASED,
    });

    // Attempting update without proper reason note fails
    await expect(
      lotsService.update(tenantAOrgId, userAId, lot.id, {
        productName: 'Gula Modifikasi Ilegal',
      }),
    ).rejects.toThrow(BadRequestException);

    // Attempting soft delete fails
    await expect(lotsService.softDelete(tenantAOrgId, userAId, lot.id)).rejects.toThrow(BadRequestException);

    // Update WITH valid audit note succeeds and logs audit
    const updated = await lotsService.update(tenantAOrgId, userAId, lot.id, {
      note: 'Koreksi administratif nama produk sesuai label BPOM',
      description: 'Koreksi terverifikasi',
    });
    expect(updated.description).toBe('Koreksi terverifikasi');

    const auditEntry = await prisma.auditLog.findFirst({
      where: { entityId: lot.id, action: 'LOT_CORRECTION_RELEASED' },
    });
    expect(auditEntry).toBeDefined();
    expect(auditEntry?.reason).toContain('Koreksi administratif');
  });

  it('RULE 3: Packaging enforces RELEASED status and mass balance (total packaged <= lot quantity)', async () => {
    // 1. DRAFT lot cannot be packaged
    const draftLot = await lotsService.create(tenantAOrgId, userAId, {
      lotCode: `LOT-DRAFT-${Date.now()}`,
      productName: 'Gula Draft',
      quantity: 100,
      unit: 'kg',
      status: LotStatus.DRAFT,
    });

    await expect(
      packagingService.createPackages(tenantAOrgId, draftLot.id, 10, 1, 'kg', userAId),
    ).rejects.toThrow(BadRequestException);

    // 2. RELEASED lot can be packaged within capacity
    const releasedLot = await lotsService.create(tenantAOrgId, userAId, {
      lotCode: `LOT-CAP-${Date.now()}`,
      productName: 'Gula Kapasitas 10kg',
      quantity: 10,
      unit: 'kg',
      status: LotStatus.RELEASED,
    });

    // Package 20 pouches of 250g (0.25kg) = 5kg total <= 10kg
    const pkg1 = await packagingService.createPackages(tenantAOrgId, releasedLot.id, 20, 0.25, 'kg', userAId);
    expect(pkg1.packageCode).toContain('PKG-');

    const qrCount = await prisma.qrSerial.count({ where: { packageId: pkg1.id } });
    expect(qrCount).toBe(20);

    // Attempting to package another 30 units of 250g (7.5kg) -> 5 + 7.5 = 12.5kg > 10kg -> FAILS!
    await expect(
      packagingService.createPackages(tenantAOrgId, releasedLot.id, 30, 0.25, 'kg', userAId),
    ).rejects.toThrow(BadRequestException);
  });

  it('RULE 4: Multi-tenant isolation - Tenant B cannot read or modify Tenant A lots', async () => {
    const lotA = await lotsService.create(tenantAOrgId, userAId, {
      lotCode: `LOT-ISOLATION-${Date.now()}`,
      productName: 'Organik A',
      quantity: 100,
      unit: 'kg',
    });

    // Tenant B attempts to read Lot A
    await expect(lotsService.findOne(tenantBOrgId, lotA.id)).rejects.toThrow();

    // Tenant B attempts to update Lot A
    await expect(
      lotsService.update(tenantBOrgId, userBId, lotA.id, {
        productName: 'Hacked by Tenant B',
      }),
    ).rejects.toThrow();
  });
});
