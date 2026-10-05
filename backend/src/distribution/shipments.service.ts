import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShipmentStatus, LotStatus } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createShipment(orgId: string, actorId: string, buyerId: string, lotId: string, quantity: number, unit: string) {
    const lot = await this.prisma.lot.findFirst({
      where: { id: lotId, organizationId: orgId },
    });

    if (!lot) throw new NotFoundException('Lot not found');
    
    // Distribution rule: Can only ship RELEASED lots
    if (lot.status !== LotStatus.RELEASED) {
      throw new BadRequestException('Only RELEASED lots can be shipped.');
    }

    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          organizationId: orgId,
          shipmentCode: `SHP-${Date.now().toString().slice(-4)}`,
          buyerId,
          shipmentDate: new Date(),
          createdById: actorId,
          status: ShipmentStatus.PLANNED,
        }
      });

      await tx.shipmentLine.create({
        data: {
          shipmentId: shipment.id,
          lotId,
          quantity,
          unit,
        }
      });

      return shipment;
    });
  }

  async getBuyerShipments(orgId: string, buyerId: string) {
    return this.prisma.shipment.findMany({
      where: { organizationId: orgId, buyerId },
      include: {
        lines: { include: { lot: { select: { lotCode: true, productName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
