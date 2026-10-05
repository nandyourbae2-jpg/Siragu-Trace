import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateInspectionDto } from './dto/create-inspection.dto.js';
import { QualityStatus } from '@prisma/client';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, actorId: string, dto: CreateInspectionDto) {
    const lot = await this.prisma.lot.findFirst({
      where: { id: dto.lotId, organizationId: orgId, deletedAt: null },
    });
    if (!lot) throw new NotFoundException(`Lot "${dto.lotId}" not found.`);

    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.inspection.create({
        data: {
          organizationId: orgId,
          lotId: dto.lotId,
          sampleId: dto.sampleId,
          testMethod: dto.testMethod,
          result: dto.result,
          specificationReference: dto.specificationReference,
          inspectorId: actorId,
          notes: dto.notes,
          status: dto.status ?? QualityStatus.PENDING,
        },
      });

      // Append lot event for the inspection creation
      await tx.lotEvent.create({
        data: {
          lotId: dto.lotId,
          actorId,
          eventType: 'INSPECTION_ADDED',
          payload: { inspectionId: inspection.id, testMethod: dto.testMethod, status: inspection.status },
        },
      });

      return inspection;
    });
  }

  async updateStatus(orgId: string, inspectionId: string, actorId: string, status: QualityStatus) {
    const inspection = await this.prisma.inspection.findFirst({
      where: { id: inspectionId, organizationId: orgId },
    });
    if (!inspection) throw new NotFoundException(`Inspection "${inspectionId}" not found.`);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inspection.update({
        where: { id: inspectionId },
        data: { status },
      });

      await tx.lotEvent.create({
        data: {
          lotId: updated.lotId,
          actorId,
          eventType: 'INSPECTION_STATUS_CHANGED',
          payload: { inspectionId: updated.id, from: inspection.status, to: status },
        },
      });

      return updated;
    });
  }

  async findPending(orgId: string) {
    return this.prisma.inspection.findMany({
      where: { organizationId: orgId, status: QualityStatus.PENDING },
      include: {
        lot: { select: { lotCode: true, productName: true } },
        inspector: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
