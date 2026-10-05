import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ReleaseGateService } from './release-gate.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LotStateMachineService } from '../lots/lot-state-machine.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LotType } from '@prisma/client';

describe('ReleaseGateService', () => {
  let service: ReleaseGateService;
  let prismaMock: any;
  let stateMachineMock: any;

  beforeEach(async () => {
    prismaMock = {
      lot: { findFirst: vi.fn(), update: vi.fn() },
      $transaction: vi.fn((cb) => cb(prismaMock)),
      lotEvent: { create: vi.fn() },
    };

    stateMachineMock = {
      validate: vi.fn().mockReturnValue({ ok: true }),
    };

    const module = await Test.createTestingModule({
      providers: [
        ReleaseGateService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LotStateMachineService, useValue: stateMachineMock },
      ],
    }).compile();

    service = module.get(ReleaseGateService);
  });

  const baseLot = {
    id: 'lot-1',
    status: 'READY',
    lotType: LotType.RECEIVED,
    supplierId: 'sup-1',
    evidences: [{ id: 'ev-1' }],
    inspections: [{ status: 'APPROVED' }],
    asTarget: [],
    processOutputs: [],
  };

  it('allows release when all gates pass (RECEIVED lot)', async () => {
    prismaMock.lot.findFirst.mockResolvedValue(baseLot);
    
    const res = await service.checkReadiness('org-1', 'lot-1');
    expect(res.canRelease).toBe(true);
    expect(res.reasons.length).toBe(0);
  });

  it('blocks release if state machine transition is invalid', async () => {
    stateMachineMock.validate.mockReturnValue({ ok: false, reason: 'Cannot transition from BLOCKED' });
    prismaMock.lot.findFirst.mockResolvedValue(baseLot);

    const res = await service.checkReadiness('org-1', 'lot-1');
    expect(res.canRelease).toBe(false);
    expect(res.reasons[0]).toContain('Cannot transition from BLOCKED');
  });

  it('blocks release if RECEIVED lot has no supplier', async () => {
    prismaMock.lot.findFirst.mockResolvedValue({ ...baseLot, supplierId: null });

    const res = await service.checkReadiness('org-1', 'lot-1');
    expect(res.canRelease).toBe(false);
    expect(res.reasons[0]).toContain('assigned supplier');
  });

  it('blocks release if Produced lot has no input relationships', async () => {
    prismaMock.lot.findFirst.mockResolvedValue({
      ...baseLot,
      lotType: LotType.PROCESS_OUTPUT,
      asTarget: [], // No source relations
    });

    const res = await service.checkReadiness('org-1', 'lot-1');
    expect(res.canRelease).toBe(false);
    expect(res.reasons[0]).toContain('input source relationship');
  });

  it('blocks release if any inspection is HOLD', async () => {
    prismaMock.lot.findFirst.mockResolvedValue({
      ...baseLot,
      inspections: [{ status: 'APPROVED' }, { status: 'HOLD' }],
    });

    const res = await service.checkReadiness('org-1', 'lot-1');
    expect(res.canRelease).toBe(false);
    expect(res.reasons[0]).toContain('HOLD');
  });

  it('blocks release if no inspection is APPROVED', async () => {
    prismaMock.lot.findFirst.mockResolvedValue({
      ...baseLot,
      inspections: [], // 0 inspections
    });

    const res = await service.checkReadiness('org-1', 'lot-1');
    expect(res.canRelease).toBe(false);
    expect(res.reasons[0]).toContain('requires at least one APPROVED inspection');
  });

  it('blocks release if mass balance is BLOCKED on creating event', async () => {
    prismaMock.lot.findFirst.mockResolvedValue({
      ...baseLot,
      lotType: LotType.PROCESS_OUTPUT,
      asTarget: [{ id: 'rel-1' }],
      processOutputs: [{
        event: { eventCode: 'PE-1', massBalanceStatus: 'BLOCKED' }
      }],
    });

    const res = await service.checkReadiness('org-1', 'lot-1');
    expect(res.canRelease).toBe(false);
    expect(res.reasons[0]).toContain('BLOCKED mass balance');
  });

  it('executeRelease throws BadRequestException if checks fail', async () => {
    prismaMock.lot.findFirst.mockResolvedValue({ ...baseLot, evidences: [] }); // missing evidence

    await expect(service.executeRelease('org-1', 'lot-1', 'actor-1')).rejects.toThrow(BadRequestException);
    expect(prismaMock.lot.update).not.toHaveBeenCalled();
  });

  it('executeRelease updates status if checks pass', async () => {
    prismaMock.lot.findFirst.mockResolvedValue(baseLot);

    await service.executeRelease('org-1', 'lot-1', 'actor-1');

    expect(prismaMock.lot.update).toHaveBeenCalledWith({
      where: { id: 'lot-1' },
      data: expect.objectContaining({ status: 'RELEASED' }),
    });
    expect(prismaMock.lotEvent.create).toHaveBeenCalled();
  });
});
