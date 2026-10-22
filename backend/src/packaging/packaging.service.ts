import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { generateToken } from '../common/crockford.js';
import { toLotUnit } from '../common/weights.js';
import { PackageStatus, QrStatus, LotStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class PackagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Creates packaging units for a lot.
   * Hard Rule: Lot MUST be RELEASED. Total packaged weight cannot exceed lot quantity.
   */
  async createPackages(orgId: string, lotId: string, quantity: number, packageSize: number, unit: string, actorId?: string) {
    if (quantity <= 0 || packageSize <= 0) {
      throw new BadRequestException('Jumlah kemasan dan ukuran kemasan harus lebih dari 0.');
    }

    const lot = await this.prisma.lot.findFirst({
      where: { id: lotId, organizationId: orgId, deletedAt: null },
      include: {
        packages: true,
      },
    });

    if (!lot) throw new NotFoundException('Lot not found');
    
    // Non-negotiable rule: lot must be RELEASED
    if (lot.status !== LotStatus.RELEASED) {
      throw new BadRequestException(
        `Lot ${lot.lotCode} belum berstatus RELEASED (status saat ini: ${lot.status}). Lot hanya boleh dikemas jika sudah disetujui QA.`,
      );
    }

    // Mass balance check on lot packaging capacity
    const lotUnit = lot.unit;
    const existingPackagedWeight = lot.packages.reduce((sum, p) => {
      try {
        const converted = toLotUnit(p.packageSize, p.unit, lotUnit);
        return sum + converted * p.quantity;
      } catch {
        return sum + p.packageSize * p.quantity;
      }
    }, 0);

    const newPackagedWeight = toLotUnit(packageSize, unit, lotUnit) * quantity;
    const totalPackagedWeight = existingPackagedWeight + newPackagedWeight;
    const lotQuantity = Number(lot.quantity);

    if (totalPackagedWeight > lotQuantity + 0.001) {
      throw new BadRequestException(
        `Total berat kemasan (${totalPackagedWeight.toFixed(2)} ${lotUnit}) melebihi kuantitas lot (${lotQuantity.toFixed(2)} ${lotUnit}). Tersisa kapasitas: ${Math.max(0, lotQuantity - existingPackagedWeight).toFixed(2)} ${lotUnit}.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the package definition
      const existingPkgCount = await tx.package.count({ where: { lotId } });
      const pkgCode = `PKG-${lot.batchNumber || lot.lotCode}-${String(existingPkgCount + 1).padStart(2, '0')}`;

      const pkg = await tx.package.create({
        data: {
          organizationId: orgId,
          lotId,
          packageCode: pkgCode,
          packageSize,
          quantity,
          unit,
          status: PackageStatus.CREATED,
        },
      });

      // 2. Count existing serials for human-readable sequential numbering
      const readableBatch = lot.batchNumber
        ? lot.batchNumber
        : `${lot.lotCode}-${lot.id.slice(0, 4).toUpperCase()}`;

      const totalSerialsCount = await tx.qrSerial.count({
        where: { humanSerial: { startsWith: `SGU-${readableBatch}` } },
      });

      // 3. Generate QR Serials with Crockford Base32 token and human serial
      const serials = Array.from({ length: quantity }).map((_, idx) => {
        const seqNumber = totalSerialsCount + idx + 1;
        const humanSerial = `SGU-${readableBatch}-${String(seqNumber).padStart(4, '0')}`;
        const token = generateToken(10); // Crockford base32 crypto random
        const serial = `QR-${randomBytes(8).toString('hex').toUpperCase()}`;

        return {
          packageId: pkg.id,
          serial,
          token,
          humanSerial,
          status: QrStatus.ACTIVE, // immediately ready for scanning/verification
        };
      });

      await tx.qrSerial.createMany({ data: serials });

      // Audit log
      await this.auditService.log(
        {
          organizationId: orgId,
          actorId,
          action: 'PACKAGES_CREATED',
          entity: 'Package',
          entityId: pkg.id,
          lotId: lot.id,
          newValue: {
            packageCode: pkg.packageCode,
            quantity,
            packageSize,
            unit,
            totalPackagedWeight,
          },
        },
        tx,
      );

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
