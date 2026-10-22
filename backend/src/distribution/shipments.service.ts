import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { generateToken } from '../common/crockford.js';
import { ShipmentStatus, LotStatus } from '@prisma/client';

export interface CreateShipmentDto {
  buyerId: string;
  lotId: string;
  quantity: number;
  unit: string;
  distributorName?: string;
  legs?: Array<{ fromName: string; toName: string; departAt?: Date | string; arriveAt?: Date | string }>;
  boxCount?: number;
}

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createShipment(
    orgId: string,
    actorId: string,
    buyerId: string,
    lotId: string,
    quantity: number,
    unit: string,
    distributorName?: string,
    legs?: Array<{ fromName: string; toName: string; departAt?: Date | string; arriveAt?: Date | string }>,
    boxCount: number = 1,
  ) {
    const lot = await this.prisma.lot.findFirst({
      where: { id: lotId, organizationId: orgId, deletedAt: null },
    });

    if (!lot) throw new NotFoundException('Lot not found');
    
    // Distribution rule: Can only ship RELEASED lots
    if (lot.status !== LotStatus.RELEASED) {
      throw new BadRequestException('Hanya lot berstatus RELEASED yang dapat dikirimkan (distribusi).');
    }

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.shipment.count({ where: { organizationId: orgId } });
      const year = new Date().getFullYear().toString().slice(-2);
      const shipmentCode = `SHP${year}-${String(count + 1).padStart(4, '0')}`;

      const shipment = await tx.shipment.create({
        data: {
          organizationId: orgId,
          shipmentCode,
          buyerId,
          distributorName: distributorName ?? 'PT Agriswara Logistik Nusantara',
          shipmentDate: new Date(),
          createdById: actorId,
          status: ShipmentStatus.PLANNED,
        },
      });

      await tx.shipmentLine.create({
        data: {
          shipmentId: shipment.id,
          lotId,
          quantity,
          unit,
        },
      });

      // Create Route Legs
      const defaultLegs = legs && legs.length > 0 ? legs : [
        { fromName: 'Pabrik Pengolahan Purwokerto', toName: 'Hub Logistik Distribusi Jakarta', departAt: new Date(), arriveAt: new Date(Date.now() + 18 * 3600 * 1000) }
      ];

      for (let i = 0; i < defaultLegs.length; i++) {
        const leg = defaultLegs[i];
        await tx.shipmentLeg.create({
          data: {
            shipmentId: shipment.id,
            seq: i + 1,
            fromName: leg.fromName,
            toName: leg.toName,
            departAt: leg.departAt ? new Date(leg.departAt) : null,
            arriveAt: leg.arriveAt ? new Date(leg.arriveAt) : null,
          },
        });
      }

      // Create Box(es) with unguessable tokens for B2B Shipment Passport / IoT tracking
      const actualBoxCount = Math.max(1, boxCount);
      for (let b = 1; b <= actualBoxCount; b++) {
        const boxCode = `BOX-${shipmentCode}-${String(b).padStart(2, '0')}`;
        const token = generateToken(10);
        await tx.box.create({
          data: {
            organizationId: orgId,
            shipmentId: shipment.id,
            boxCode,
            token,
          },
        });
      }

      // Create share link for buyer magic link
      const dossierToken = generateToken(12);
      await tx.shareLink.create({
        data: {
          organizationId: orgId,
          shipmentId: shipment.id,
          buyerId,
          token: dossierToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
        },
      });

      await this.auditService.log(
        {
          organizationId: orgId,
          actorId,
          action: 'SHIPMENT_CREATED',
          entity: 'Shipment',
          entityId: shipment.id,
          lotId,
          newValue: { shipmentCode, buyerId, quantity, unit },
        },
        tx,
      );

      return shipment;
    });
  }

  async findAll(orgId: string) {
    return this.prisma.shipment.findMany({
      where: { organizationId: orgId },
      include: {
        buyer: { select: { id: true, name: true, code: true } },
        lines: { include: { lot: { select: { id: true, lotCode: true, productName: true, batchNumber: true } } } },
        boxes: { include: { summary: true } },
        legs: { orderBy: { seq: 'asc' } },
        shareLinks: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, organizationId: orgId },
      include: {
        buyer: true,
        lines: { include: { lot: true } },
        boxes: {
          include: {
            summary: true,
            readings: { take: 100, orderBy: { ts: 'desc' } },
          },
        },
        legs: { orderBy: { seq: 'asc' } },
        shareLinks: true,
      },
    });

    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async getBuyerShipments(orgId: string, buyerId: string) {
    return this.prisma.shipment.findMany({
      where: { organizationId: orgId, buyerId },
      include: {
        lines: { include: { lot: { select: { lotCode: true, productName: true, batchNumber: true } } } },
        boxes: { include: { summary: true } },
        legs: { orderBy: { seq: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
