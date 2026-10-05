import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PackageStatus, QrStatus, LotStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class PackagingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates packaging units for a lot.
   * Business rule: Lot must be eligible for packaging (usually READY or RELEASED).
   */
  async createPackages(orgId: string, lotId: string, quantity: number, packageSize: number, unit: string) {
    const lot = await this.prisma.lot.findFirst({
      where: { id: lotId, organizationId: orgId, deletedAt: null },
    });

    if (!lot) throw new NotFoundException('Lot not found');
    
    // Simplistic check for MVP
    if (lot.status !== LotStatus.RELEASED && lot.status !== LotStatus.READY) {
      throw new BadRequestException('Lot must be READY or RELEASED to be packaged.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the package definition
      const pkg = await tx.package.create({
        data: {
          organizationId: orgId,
          lotId,
          packageCode: `PKG-${lot.lotCode}-${Date.now().toString().slice(-4)}`,
          packageSize,
          quantity,
          unit,
          status: PackageStatus.CREATED,
        },
      });

      // 2. Generate QR Serials for the quantity specified
      const serials = Array.from({ length: quantity }).map(() => ({
        packageId: pkg.id,
        serial: `QR-${randomBytes(8).toString('hex').toUpperCase()}`, // Global Unique Serial
        status: QrStatus.GENERATED,
      }));

      await tx.qrSerial.createMany({ data: serials });

      return pkg;
    });
  }

  async getPackagesByLot(orgId: string, lotId: string) {
    return this.prisma.package.findMany({
      where: { organizationId: orgId, lotId },
      include: {
        _count: { select: { qrSerials: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQrSerials(orgId: string, packageId: string) {
    // Validate org access
    const pkg = await this.prisma.package.findFirst({
      where: { id: packageId, organizationId: orgId },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    return this.prisma.qrSerial.findMany({
      where: { packageId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
