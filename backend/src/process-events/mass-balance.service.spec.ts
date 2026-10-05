import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { MassBalanceService } from './mass-balance.service.js';

describe('MassBalanceService', () => {
  let service: MassBalanceService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MassBalanceService],
    }).compile();
    service = module.get(MassBalanceService);
  });

  it('is BALANCED for exact match', () => {
    const res = service.compute({
      totalInput: 100,
      totalOutput: 90,
      totalWaste: 5,
      totalRemaining: 5,
    });
    expect(res.status).toBe('BALANCED');
    expect(res.diff).toBe(0);
    expect(res.isValid).toBe(true);
  });

  it('is BALANCED for diff <= 0.5%', () => {
    const res = service.compute({
      totalInput: 100,
      totalOutput: 99.6,
      totalWaste: 0,
      totalRemaining: 0,
    }); // diff = 0.4, diffPct = 0.4%
    expect(res.status).toBe('BALANCED');
  });

  it('is WARNING for diff > 0.5% and <= 5%', () => {
    const res = service.compute({
      totalInput: 100,
      totalOutput: 96,
      totalWaste: 0,
      totalRemaining: 0,
    }); // diff = 4, diffPct = 4%
    expect(res.status).toBe('WARNING');
    expect(res.isValid).toBe(true); // Valid, but requires note
  });

  it('is BLOCKED for diff > 5%', () => {
    const res = service.compute({
      totalInput: 100,
      totalOutput: 90,
      totalWaste: 0,
      totalRemaining: 0,
    }); // diff = 10, diffPct = 10%
    expect(res.status).toBe('BLOCKED');
    expect(res.isValid).toBe(false);
  });
});
