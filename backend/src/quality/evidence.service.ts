import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEvidenceDto } from './dto/create-evidence.dto.js';
import { VisibilityLevel } from '@prisma/client';

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, actorId: string, dto: CreateEvidenceDto) {
    if (!dto.lotId && !dto.processEventId && !dto.inspectionId) {
      throw new BadRequestException('Evidence must be linked to a Lot, Process Event, or Inspection.');
    }

    // Verify linked entity belongs to org
    if (dto.lotId) {
      const lot = await this.prisma.lot.findFirst({ where: { id: dto.lotId, organizationId: orgId } });
      if (!lot) throw new NotFoundException('Lot not found');
    }
    if (dto.processEventId) {
      const pe = await this.prisma.processEvent.findFirst({ where: { id: dto.processEventId, organizationId: orgId } });
      if (!pe) throw new NotFoundException('Process Event not found');
    }
    if (dto.inspectionId) {
      const ins = await this.prisma.inspection.findFirst({ where: { id: dto.inspectionId, organizationId: orgId } });
      if (!ins) throw new NotFoundException('Inspection not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const evidence = await tx.evidence.create({
        data: {
          organizationId: orgId,
          fileName: dto.fileName,
          documentUrl: dto.documentUrl,
          documentType: dto.documentType,
          visibility: dto.visibility ?? VisibilityLevel.INTERNAL,
          uploadedById: actorId,
          lotId: dto.lotId,
          processEventId: dto.processEventId,
          inspectionId: dto.inspectionId,
        },
      });

      // Optionally, record an audit event. If attached to a lot, append to lotEvent:
      if (dto.lotId) {
        await tx.lotEvent.create({
          data: {
            lotId: dto.lotId,
            actorId,
            eventType: 'EVIDENCE_ADDED',
            payload: { evidenceId: evidence.id, fileName: dto.fileName },
          },
        });
      }

      return evidence;
    });
  }

  async findByLot(orgId: string, lotId: string) {
    return this.prisma.evidence.findMany({
      where: { organizationId: orgId, lotId },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
