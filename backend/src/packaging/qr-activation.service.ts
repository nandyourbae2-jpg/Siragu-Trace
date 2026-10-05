import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { QrStatus, PackageStatus } from '@prisma/client';

@Injectable()
export class QrActivationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Activates a QR Serial.
   * BR-005: QR cannot be ACTIVE if mandatory data on the server is incomplete.
   */
  async activateQr(orgId: string, actorId: string, serial: string) {
    const qr = await this.prisma.qrSerial.findUnique({
      where: { serial },
      include: { package: { include: { lot: true } } },
    });

    if (!qr) throw new NotFoundException('QR Serial not found');
    if (qr.package.organizationId !== orgId) {
      throw new NotFoundException('QR Serial not found'); // Hide existence from other tenants
    }

    if (qr.status === QrStatus.ACTIVE) {
      throw new BadRequestException('QR Serial is already active.');
    }
    if (qr.status === QrStatus.BLOCKED || qr.status === QrStatus.VOID) {
      throw new BadRequestException(`Cannot activate a ${qr.status} QR Serial.`);
    }

    // BR-005 Enforcement: Check if server data is complete.
    // E.g., The underlying Lot must have been officially released.
    if (qr.package.lot.status !== 'RELEASED') {
      throw new BadRequestException('Activation blocked (BR-005): The underlying Lot has not passed the Release Gate.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedQr = await tx.qrSerial.update({
        where: { id: qr.id },
        data: {
          status: QrStatus.ACTIVE,
          activatedAt: new Date(),
          activatedById: actorId,
        },
      });

      // Update package status to ACTIVE if it wasn't already
      if (qr.package.status !== PackageStatus.ACTIVE) {
        await tx.package.update({
          where: { id: qr.packageId },
          data: { status: PackageStatus.ACTIVE },
        });
      }

      return updatedQr;
    });
  }

  /**
   * Verifies a QR Serial for the Public Verification Page (§26-27).
   * Anonymous, no authentication required.
   */
  async verifyPublicQr(serial: string) {
    const qr = await this.prisma.qrSerial.findUnique({
      where: { serial },
      include: {
        package: {
          include: {
            lot: {
              include: {
                organization: true, // Only for producer name
                asTarget: true, // Just to check if lineage exists
                processOutputs: true,
              }
            }
          }
        }
      }
    });

    if (!qr) throw new NotFoundException('QR Serial not found');
    
    // Strict adherence to PRD: Never display "Authentic". Only "This QR links to a traceability record."
    // We only return safe, sanitized data. NO internal notes, NO user IDs.
    
    const lot = qr.package.lot;
    
    return {
      disclaimer: "This QR links to a traceability record.",
      status: qr.status,
      anomalyStatus: qr.anomalyStatus,
      productName: lot.productName,
      producerName: lot.organization.name,
      lotCode: lot.lotCode,
      packagingDate: qr.package.createdAt,
      packageSize: `${qr.package.packageSize} ${qr.package.unit}`,
      traceSummary: {
        originRecorded: lot.lotType === 'RECEIVED' || lot.asTarget.length > 0,
        processRecorded: lot.processOutputs.length > 0,
        packagingRecorded: true,
        releaseRecorded: lot.status === 'RELEASED',
      }
    };
  }
}
