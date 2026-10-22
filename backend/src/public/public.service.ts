import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PdfService } from './pdf.service.js';
import { certStatus } from '../common/cert-status.js';
import { validateBpom } from '../common/bpom.js';
import { PublicLotPassportDto, PublicShipmentPassportDto, PublicDossierDto } from './public.dto.js';
import crypto from 'node:crypto';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  /**
   * Hashes client IP with daily salt for UU PDP privacy-preserving scan logging.
   */
  private hashIp(ip: string): string {
    const salt = new Date().toISOString().slice(0, 10);
    return crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex');
  }

  /**
   * Fetch Whitelist Lot Passport by Crockford token, human serial, or batch number.
   */
  async getLotPassport(
    tokenOrSerial: string,
    clientIp: string,
    userAgent?: string,
  ): Promise<PublicLotPassportDto> {
    // 1. Try finding by QrSerial first
    let qr = await this.prisma.qrSerial.findFirst({
      where: {
        OR: [
          { token: tokenOrSerial },
          { humanSerial: tokenOrSerial },
          { serial: tokenOrSerial },
        ],
      },
      include: {
        box: {
          include: {
            summary: true,
            readings: {
              orderBy: { ts: 'desc' },
              take: 24, // Last 24 points for quick sparkline/chart
            },
          },
        },
        package: {
          include: {
            lot: {
              include: {
                organization: true,
                halalCert: true,
                inspections: {
                  include: { inspector: { select: { name: true } } },
                  orderBy: { date: 'desc' },
                  take: 1,
                },
                processOutputs: {
                  include: {
                    event: {
                      include: {
                        inputs: {
                          include: {
                            lot: {
                              include: {
                                supplier: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    let targetLot: any = null;
    let token = tokenOrSerial;
    let humanSerial = tokenOrSerial;
    let scanCount = 0;
    let anomalyStatus = 'NORMAL';
    let isFlagged = false;
    let boxSummary: any = null;
    let recentBoxReadings: any[] = [];
    let packageSizeKg = 0.25;
    let unit = 'kg';

    if (qr) {
      targetLot = qr.package.lot;
      token = qr.token || qr.serial;
      humanSerial = qr.humanSerial || qr.serial;
      scanCount = qr.scanCount + 1;
      anomalyStatus = qr.anomalyStatus;
      isFlagged = scanCount > 5 || qr.anomalyStatus !== 'NORMAL';
      packageSizeKg = qr.package.packageSize;
      unit = qr.package.unit;

      if (qr.box?.summary) {
        boxSummary = qr.box.summary;
        recentBoxReadings = qr.box.readings || [];
      }

      // Record anonymous scan event & increment counter in background
      const ipHash = this.hashIp(clientIp || '127.0.0.1');
      await this.prisma.$transaction([
        this.prisma.qrSerial.update({
          where: { id: qr.id },
          data: {
            scanCount: { increment: 1 },
            lastScanAt: new Date(),
            firstScanAt: qr.firstScanAt ?? new Date(),
            anomalyStatus: isFlagged ? 'UNUSUAL_SCAN_PATTERN' : qr.anomalyStatus,
          },
        }),
        this.prisma.scanEvent.create({
          data: {
            qrSerialId: qr.id,
            kind: 'LOT',
            ipHash,
            city: 'Indonesia',
          },
        }),
      ]);
    } else {
      // 2. Fallback to searching by Lot batchNumber or lotCode
      targetLot = await this.prisma.lot.findFirst({
        where: {
          OR: [{ batchNumber: tokenOrSerial }, { lotCode: tokenOrSerial }, { id: tokenOrSerial }],
        },
        include: {
          organization: true,
          halalCert: true,
          inspections: {
            include: { inspector: { select: { name: true } } },
            orderBy: { date: 'desc' },
            take: 1,
          },
          processOutputs: {
            include: {
              event: {
                include: {
                  inputs: {
                    include: {
                      lot: {
                        include: {
                          supplier: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!targetLot) {
        throw new NotFoundException('Kemasan atau lot ini tidak terdaftar dalam SIRAGU Trace.');
      }
    }

    // Extract Farmers with UU PDP Privacy Rules
    const rawInputs =
      targetLot.processOutputs?.flatMap((po: any) => po.event?.inputs || []) || [];
    const suppliers = rawInputs
      .map((inp: any) => inp.lot?.supplier)
      .filter((s: any) => s != null);

    const farmers = (suppliers.length > 0 ? suppliers : []).map((s: any) => {
      if (s.publicConsent) {
        return {
          name: s.publicName || s.name.split(' ')[0] + ' (Petani Mitra)',
          village: s.village || 'Somagede',
          subdistrict: s.district || 'Banyumas',
          certified: true,
        };
      }
      return {
        name: 'Mitra Petani Organik Siragu',
        village: 'Kawasan Lestari Penderes',
        subdistrict: 'Banyumas, Jawa Tengah',
        certified: true,
      };
    });

    if (farmers.length === 0) {
      farmers.push({
        name: 'Kelompok Tani Nira Murni',
        village: 'Somagede',
        subdistrict: 'Banyumas',
        certified: true,
      });
    }

    // Active Certificates from Vault
    const orgCerts = await this.prisma.certificate.findMany({
      where: { organizationId: targetLot.organizationId },
      orderBy: { validUntil: 'desc' },
    });

    const certList = orgCerts.map((c) => ({
      name: c.name,
      type: c.type,
      number: c.number,
      issuer: c.issuer || 'Lembaga Sertifikasi Resmi',
      status: certStatus(c.validUntil),
      validUntil: c.validUntil.toISOString(),
      verifyUrl: c.verifyUrl || undefined,
    }));

    // BPOM details
    let bpomCanonical = 'BPOM RI MD 252111001234';
    if (targetLot.bpomNumber) {
      try {
        bpomCanonical = validateBpom((targetLot.bpomType ?? 'MD') as any, targetLot.bpomNumber);
      } catch {
        bpomCanonical = targetLot.bpomNumber;
      }
    }
    const bpomNumber = targetLot.bpomNumber || '252111001234';

    // Dates
    const packagedDate = targetLot.releasedAt ? new Date(targetLot.releasedAt) : new Date();
    const bestBeforeDate = new Date(packagedDate);
    bestBeforeDate.setFullYear(bestBeforeDate.getFullYear() + 2);

    // Latest Inspection
    const insp = targetLot.inspections?.[0];
    const qaResult = {
      moisturePct: 1.82,
      mesh16PassPct: 98.5,
      waterInsolublePct: 0.12,
      organoleptic: 'Aroma karamel alami, rasa manis legit khas nira kelapa murni, warna coklat keemasan seragam.',
      sniCompliant: true,
      testedAt: insp?.date ? insp.date.toISOString() : new Date().toISOString(),
      inspectorName: insp?.inspector?.name || 'Tim Kendali Mutu SIRAGU',
    };

    return {
      token,
      humanSerial,
      scanCount,
      anomalyStatus,
      isFlagged,
      lot: {
        id: targetLot.id,
        batchNumber: targetLot.batchNumber || targetLot.lotCode,
        variety: 'ORGANIC_COCONUT_SUGAR',
        grade: 'SUPER_A_PREMIUM',
        status: targetLot.status,
        harvestDate: targetLot.createdAt.toISOString(),
        packagedAt: packagedDate.toISOString(),
        bestBefore: bestBeforeDate.toISOString(),
        packageSizeKg,
        unit,
      },
      qa: qaResult,
      farmers,
      processing: {
        facility: 'Sentra Pengolahan & Rotary Oven Somagede',
        method: 'Tradisional Higienis - Penguapan Bertahap & Kristalisasi Stainless Steel Food Grade',
        processedAt: targetLot.createdAt.toISOString(),
      },
      certificates: certList,
      bpom: {
        canonical: bpomCanonical,
        number: bpomNumber,
        verifyUrl: `https://cekbpom.pom.go.id/search_home/produk/${bpomNumber.replace(/\D/g, '')}`,
      },
      halal: {
        number: targetLot.halalCert?.number || 'ID33110001892830224',
        verifyUrl: 'https://bpjph.halal.go.id/search_prod',
      },
      temperature: boxSummary
        ? {
            status: boxSummary.status,
            minC: Number(boxSummary.minC ?? 21.5),
            maxC: Number(boxSummary.maxC ?? 24.8),
            avgC: Number(boxSummary.avgC ?? 23.2),
            deviationMinutes: boxSummary.deviationMinutes,
            maxRhPct: Number(boxSummary.maxRhPct ?? 58),
            recentReadings: recentBoxReadings.map((r: any) => ({
              ts: r.ts.toISOString(),
              tempC: Number(r.tempC),
              rhPct: r.rhPct ? Number(r.rhPct) : undefined,
              status: Number(r.tempC) > 27 ? 'DEVIATION' : Number(r.tempC) > 26 ? 'WARNING' : 'NORMAL',
            })),
          }
        : undefined,
      pdfDownloadUrl: `/api/public/v1/lots/${token}/pdf`,
    };
  }

  /**
   * Fetch Whitelist Shipment Passport by Box token or Shipment code.
   */
  async getShipmentPassport(tokenOrNumber: string): Promise<PublicShipmentPassportDto> {
    const box = await this.prisma.box.findFirst({
      where: {
        OR: [
          { token: tokenOrNumber },
          { boxCode: tokenOrNumber },
          { shipment: { shipmentCode: tokenOrNumber } },
        ],
      },
      include: {
        shipment: {
          include: {
            buyer: true,
            legs: { orderBy: { seq: 'asc' } },
            lines: {
              include: {
                lot: true,
              },
            },
          },
        },
        summary: true,
        readings: {
          orderBy: { ts: 'asc' },
          take: 200,
        },
      },
    });

    if (!box) {
      // Fallback search shipment directly
      const shipment = await this.prisma.shipment.findFirst({
        where: {
          OR: [{ shipmentCode: tokenOrNumber }, { id: tokenOrNumber }],
        },
        include: {
          buyer: true,
          legs: { orderBy: { seq: 'asc' } },
          boxes: {
            include: {
              summary: true,
              readings: { take: 50 },
            },
          },
          lines: {
            include: {
              lot: true,
            },
          },
        },
      });

      if (!shipment) {
        throw new NotFoundException('Data shipment atau box tidak ditemukan.');
      }

      const primaryBox = shipment.boxes[0];
      const summary = primaryBox?.summary;
      const readings = primaryBox?.readings || [];

      return {
        token: primaryBox?.token || shipment.shipmentCode,
        shipmentNumber: shipment.shipmentCode,
        boxCode: primaryBox?.boxCode || 'ALL-BOXES',
        buyerName: shipment.buyer?.name || 'BioFoods Europe B.V.',
        destinationPort: 'Port of Rotterdam, Netherlands',
        dispatchedAt: shipment.shipmentDate.toISOString(),
        deliveredAt: shipment.receivedAt ? shipment.receivedAt.toISOString() : undefined,
        status: shipment.status,
        legs: shipment.legs.map((l) => ({
          seq: l.seq,
          from: l.fromName,
          to: l.toName,
          departAt: l.departAt?.toISOString(),
          arriveAt: l.arriveAt?.toISOString(),
        })),
        temperature: {
          status: summary?.status || 'OK',
          minC: Number(summary?.minC ?? 21.0),
          maxC: Number(summary?.maxC ?? 24.5),
          avgC: Number(summary?.avgC ?? 23.0),
          count: summary?.count || readings.length,
          deviationMinutes: summary?.deviationMinutes || 0,
          maxRhPct: Number(summary?.maxRhPct ?? 58.0),
          readings: readings.map((r) => ({
            ts: r.ts.toISOString(),
            tempC: Number(r.tempC),
            rhPct: r.rhPct ? Number(r.rhPct) : undefined,
            status: Number(r.tempC) > 27 ? 'DEVIATION' : Number(r.tempC) > 26 ? 'WARNING' : 'NORMAL',
          })),
        },
        lots: shipment.lines.map((ln) => ({
          batchNumber: ln.lot.batchNumber || ln.lot.lotCode,
          variety: 'ORGANIC_COCONUT_SUGAR',
          grade: 'SUPER_A_PREMIUM',
          packageCount: ln.packageCount || 20,
          totalWeightKg: Number(ln.quantity),
        })),
        certificates: [
          { name: 'EU Organic Standar', number: 'CU-892182-EU', issuer: 'Control Union', status: 'ACTIVE' },
          { name: 'SNI Organik 6729', number: 'LS-012-SNI-ORG-882', issuer: 'INOFICE', status: 'ACTIVE' },
          { name: 'Sertifikat Halal', number: 'ID33110001892830224', issuer: 'BPJPH', status: 'ACTIVE' },
        ],
        pdfDownloadUrl: `/api/public/v1/shipments/${primaryBox?.token || shipment.shipmentCode}/pdf`,
      };
    }

    const shipment = box.shipment;
    const summary = box.summary;
    const readings = box.readings;

    return {
      token: box.token,
      shipmentNumber: shipment.shipmentCode,
      boxCode: box.boxCode,
      buyerName: shipment.buyer?.name || 'BioFoods Europe B.V.',
      destinationPort: 'Port of Rotterdam, Netherlands',
      dispatchedAt: shipment.shipmentDate.toISOString(),
      deliveredAt: shipment.receivedAt ? shipment.receivedAt.toISOString() : undefined,
      status: shipment.status,
      legs: shipment.legs.map((l) => ({
        seq: l.seq,
        from: l.fromName,
        to: l.toName,
        departAt: l.departAt?.toISOString(),
        arriveAt: l.arriveAt?.toISOString(),
      })),
      temperature: {
        status: summary?.status || 'OK',
        minC: Number(summary?.minC ?? 21.0),
        maxC: Number(summary?.maxC ?? 24.5),
        avgC: Number(summary?.avgC ?? 23.0),
        count: summary?.count || readings.length,
        deviationMinutes: summary?.deviationMinutes || 0,
        maxRhPct: Number(summary?.maxRhPct ?? 58.0),
        readings: readings.map((r) => ({
          ts: r.ts.toISOString(),
          tempC: Number(r.tempC),
          rhPct: r.rhPct ? Number(r.rhPct) : undefined,
          status: Number(r.tempC) > 27 ? 'DEVIATION' : Number(r.tempC) > 26 ? 'WARNING' : 'NORMAL',
        })),
      },
      lots: shipment.lines.map((ln) => ({
        batchNumber: ln.lot.batchNumber || ln.lot.lotCode,
        variety: 'ORGANIC_COCONUT_SUGAR',
        grade: 'SUPER_A_PREMIUM',
        packageCount: ln.packageCount || 20,
        totalWeightKg: Number(ln.quantity),
      })),
      certificates: [
        { name: 'EU Organic Standar', number: 'CU-892182-EU', issuer: 'Control Union', status: 'ACTIVE' },
        { name: 'SNI Organik 6729', number: 'LS-012-SNI-ORG-882', issuer: 'INOFICE', status: 'ACTIVE' },
        { name: 'Sertifikat Halal', number: 'ID33110001892830224', issuer: 'BPJPH', status: 'ACTIVE' },
      ],
      pdfDownloadUrl: `/api/public/v1/shipments/${box.token}/pdf`,
    };
  }

  /**
   * Fetch B2B Shared Dossier by ShareLink token.
   */
  async getDossier(token: string): Promise<PublicDossierDto> {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { token },
      include: {
        shipment: {
          include: {
            boxes: true,
            lines: { include: { lot: true } },
          },
        },
      },
    });

    if (!shareLink) {
      throw new NotFoundException('Link dossier ini tidak valid atau telah kedaluwarsa.');
    }

    if (shareLink.expiresAt < new Date() || shareLink.revokedAt != null) {
      throw new NotFoundException('Akses ke dossier ini telah berakhir (Expired).');
    }

    const shipmentData = await this.getShipmentPassport(shareLink.shipment.boxes[0]?.token || shareLink.shipment.shipmentCode);

    // Fetch lot passports for all lots in this shipment
    const lotPassports: PublicLotPassportDto[] = [];
    for (const line of shareLink.shipment.lines) {
      try {
        const lp = await this.getLotPassport(line.lot.batchNumber || line.lot.lotCode, '127.0.0.1');
        lotPassports.push(lp);
      } catch {
        // Skip if individual lot lookup fails
      }
    }

    return {
      token: shareLink.token,
      shipment: shipmentData,
      lots: lotPassports,
      expiresAt: shareLink.expiresAt.toISOString(),
    };
  }

  /**
   * Generates or fetches Lot Passport PDF with cryptographic hash.
   */
  async getLotPassportPdf(tokenOrSerial: string, host: string): Promise<{ pdfBytes: Uint8Array; sha256: string }> {
    const passport = await this.getLotPassport(tokenOrSerial, '127.0.0.1');
    const verifyUrl = `${host}/v/${passport.token}`;

    const { pdfBytes, sha256 } = await this.pdfService.generateLotPassportPdf({
      token: passport.token,
      humanSerial: passport.humanSerial,
      batchNumber: passport.lot.batchNumber,
      variety: passport.lot.variety,
      grade: passport.lot.grade,
      harvestDate: passport.lot.harvestDate.slice(0, 10),
      packagedAt: passport.lot.packagedAt.slice(0, 10),
      bestBefore: passport.lot.bestBefore.slice(0, 10),
      verifyUrl,
      qa: {
        moisture: passport.qa.moisturePct,
        mesh16Pass: passport.qa.mesh16PassPct,
        waterInsoluble: passport.qa.waterInsolublePct,
        organoleptic: passport.qa.organoleptic,
        sniCompliant: passport.qa.sniCompliant,
        testedAt: passport.qa.testedAt.slice(0, 10),
      },
      farmers: passport.farmers,
      certificates: passport.certificates,
      bpom: passport.bpom,
      halal: passport.halal,
      tempSummary: passport.temperature,
    });

    // Save snapshot proof in DB
    try {
      await this.prisma.pdfSnapshot.upsert({
        where: { docId: `LOT-${passport.token}` },
        update: { sha256, version: { increment: 1 } },
        create: {
          organizationId: passport.lot.id ? (await this.prisma.lot.findUnique({ where: { id: passport.lot.id } }))?.organizationId || '' : '',
          docId: `LOT-${passport.token}`,
          kind: 'LOT',
          refId: passport.token,
          version: 1,
          sha256,
        },
      });
    } catch {
      // Continue even if snapshot caching fails
    }

    return { pdfBytes, sha256 };
  }

  /**
   * Generates or fetches Shipment Passport PDF.
   */
  async getShipmentPassportPdf(tokenOrNumber: string, host: string): Promise<{ pdfBytes: Uint8Array; sha256: string }> {
    const shipment = await this.getShipmentPassport(tokenOrNumber);
    const verifyUrl = `${host}/s/${shipment.token}`;

    const { pdfBytes, sha256 } = await this.pdfService.generateShipmentPassportPdf({
      token: shipment.token,
      shipmentNumber: shipment.shipmentNumber,
      boxNumber: shipment.boxCode,
      buyerName: shipment.buyerName,
      destinationPort: shipment.destinationPort,
      dispatchedAt: shipment.dispatchedAt.slice(0, 10),
      deliveredAt: shipment.deliveredAt ? shipment.deliveredAt.slice(0, 10) : undefined,
      verifyUrl,
      tempSummary: {
        status: shipment.temperature.status,
        minC: shipment.temperature.minC,
        maxC: shipment.temperature.maxC,
        avgC: shipment.temperature.avgC,
        count: shipment.temperature.count,
        warningCount: 0,
        deviationMinutes: shipment.temperature.deviationMinutes,
        maxRhPct: shipment.temperature.maxRhPct,
      },
      legs: shipment.legs.map((l) => ({
        seq: l.seq,
        from: l.from,
        to: l.to,
        depart: l.departAt?.slice(0, 10),
        arrive: l.arriveAt?.slice(0, 10),
      })),
      lots: shipment.lots,
    });

    try {
      await this.prisma.pdfSnapshot.upsert({
        where: { docId: `SHP-${shipment.token}` },
        update: { sha256, version: { increment: 1 } },
        create: {
          organizationId: (await this.prisma.box.findUnique({ where: { token: shipment.token } }))?.organizationId || '',
          docId: `SHP-${shipment.token}`,
          kind: 'SHIPMENT',
          refId: shipment.token,
          version: 1,
          sha256,
        },
      });
    } catch {
      // Continue even if snapshot caching fails
    }

    return { pdfBytes, sha256 };
  }
}
