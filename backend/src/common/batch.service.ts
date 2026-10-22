import { Injectable } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { formatBatchNumber, jakartaDay } from './batch-number.js';

type Db = PrismaClient | Prisma.TransactionClient;

@Injectable()
export class BatchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Allocates the next batch number for the org's current Jakarta day.
   * A single INSERT … ON CONFLICT DO UPDATE … RETURNING is atomic, so concurrent
   * callers can never receive the same sequence number.
   */
  async next(organizationId: string, db: Db = this.prisma, at: Date = new Date()): Promise<string> {
    const day = jakartaDay(at);
    const rows = await db.$queryRaw<{ last: number }[]>`
      INSERT INTO "BatchSequence" ("organizationId", "day", "last")
      VALUES (${organizationId}, ${day}, 1)
      ON CONFLICT ("organizationId", "day")
      DO UPDATE SET "last" = "BatchSequence"."last" + 1
      RETURNING "last"`;
    return formatBatchNumber(day, rows[0].last);
  }

  /** Serialises work per key within a transaction (e.g. per-lot packaging counters). */
  async lock(tx: Prisma.TransactionClient, key: string): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }
}
