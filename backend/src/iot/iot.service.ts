import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { summarize, isPlausibleReading, simulateReadings, DEFAULT_SPEC, Scenario } from './temp-scoring.js';
import { TempStatus } from '@prisma/client';

@Injectable()
export class IotService {
  constructor(private readonly prisma: PrismaService) {}

  async getSensors(orgId: string) {
    return this.prisma.sensor.findMany({
      where: { organizationId: orgId },
      include: {
        location: { select: { name: true, type: true } },
        gateway: { select: { deviceCode: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getSensorReadings(orgId: string, sensorId: string, hours: number = 24) {
    const sensor = await this.prisma.sensor.findFirst({
      where: { id: sensorId, organizationId: orgId },
    });
    if (!sensor) throw new NotFoundException('Sensor not found');

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.prisma.sensorReading.findMany({
      where: {
        sensorId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Ingest temperature & humidity readings from logger devices.
   */
  async ingestReadings(
    orgId: string,
    data: {
      deviceId: string;
      boxId?: string;
      readings: Array<{ ts: string | Date; tempC: number; rhPct?: number; battery?: number }>;
    },
  ) {
    let device = await this.prisma.iotDevice.findFirst({
      where: { id: data.deviceId, organizationId: orgId },
    });

    if (!device) {
      device = await this.prisma.iotDevice.findFirst({
        where: { deviceCode: data.deviceId, organizationId: orgId },
      });
    }

    if (!device) {
      // Auto-register demo/test logger device if not found
      device = await this.prisma.iotDevice.create({
        data: {
          organizationId: orgId,
          deviceCode: data.deviceId,
          tokenHash: `token_${data.deviceId}`,
          battery: data.readings[data.readings.length - 1]?.battery ?? 95,
          lastSeenAt: new Date(),
          isDemo: true,
        },
      });
    }

    const validReadings = data.readings.filter((r) =>
      isPlausibleReading({ tempC: r.tempC, rhPct: r.rhPct }),
    );

    if (validReadings.length === 0) {
      throw new BadRequestException('No plausible readings provided.');
    }

    // Upsert readings idempotently
    for (const r of validReadings) {
      const ts = new Date(r.ts);
      await this.prisma.tempReading.upsert({
        where: {
          deviceId_ts: {
            deviceId: device.id,
            ts,
          },
        },
        update: {
          tempC: r.tempC,
          rhPct: r.rhPct,
          battery: r.battery,
          boxId: data.boxId,
        },
        create: {
          deviceId: device.id,
          boxId: data.boxId,
          ts,
          tempC: r.tempC,
          rhPct: r.rhPct,
          battery: r.battery,
        },
      });
    }

    // If boxId is provided, recompute summary
    if (data.boxId) {
      await this.recalculateBoxSummary(data.boxId, orgId);
    }

    return {
      success: true,
      ingested: validReadings.length,
      deviceId: device.id,
    };
  }

  /**
   * Recalculates and caches rollups in TempSummary, raising alerts if thresholds exceeded.
   */
  async recalculateBoxSummary(boxId: string, orgId: string) {
    const readings = await this.prisma.tempReading.findMany({
      where: { boxId },
      orderBy: { ts: 'asc' },
    });

    if (readings.length === 0) return;

    const summary = summarize(
      readings.map((r) => ({
        ts: r.ts,
        tempC: Number(r.tempC),
        rhPct: r.rhPct ? Number(r.rhPct) : null,
      })),
      DEFAULT_SPEC,
    );

    const prismaStatus =
      summary.status === 'DEVIATION'
        ? TempStatus.DEVIATION
        : summary.status === 'WARNING'
          ? TempStatus.WARNING
          : TempStatus.OK;

    await this.prisma.tempSummary.upsert({
      where: { boxId },
      update: {
        status: prismaStatus,
        count: summary.count,
        minC: summary.minC,
        avgC: summary.avgC,
        maxC: summary.maxC,
        warningCount: summary.warningCount,
        deviationCount: summary.deviationCount,
        deviationMinutes: summary.deviationMinutes,
        belowRangeCount: summary.belowRangeCount,
        maxRhPct: summary.maxRhPct,
        rhExceedCount: summary.rhExceedCount,
        firstTs: summary.firstTs,
        lastTs: summary.lastTs,
        computedAt: new Date(),
      },
      create: {
        boxId,
        status: prismaStatus,
        count: summary.count,
        minC: summary.minC,
        avgC: summary.avgC,
        maxC: summary.maxC,
        warningCount: summary.warningCount,
        deviationCount: summary.deviationCount,
        deviationMinutes: summary.deviationMinutes,
        belowRangeCount: summary.belowRangeCount,
        maxRhPct: summary.maxRhPct,
        rhExceedCount: summary.rhExceedCount,
        firstTs: summary.firstTs,
        lastTs: summary.lastTs,
      },
    });

    // Check alerts
    if (summary.status === 'DEVIATION') {
      await this.prisma.alert.upsert({
        where: {
          organizationId_dedupeKey: {
            organizationId: orgId,
            dedupeKey: `DEV_${boxId}`,
          },
        },
        update: {
          message: `Suhu box melampaui batas kritis 27°C (Maks: ${summary.maxC}°C, Deviasi: ${summary.deviationMinutes} menit)`,
          status: 'OPEN',
        },
        create: {
          organizationId: orgId,
          boxId,
          type: 'TEMP_DEVIATION',
          severity: 'CRITICAL',
          message: `Suhu box melampaui batas kritis 27°C (Maks: ${summary.maxC}°C, Deviasi: ${summary.deviationMinutes} menit)`,
          dedupeKey: `DEV_${boxId}`,
        },
      });
    }

    if (summary.rhExceedCount > 0) {
      await this.prisma.alert.upsert({
        where: {
          organizationId_dedupeKey: {
            organizationId: orgId,
            dedupeKey: `RH_${boxId}`,
          },
        },
        update: {
          message: `Kelembaban udara melampaui batas aman 65% RH (Maks: ${summary.maxRhPct}% RH) - risiko caking/menggumpal`,
          status: 'OPEN',
        },
        create: {
          organizationId: orgId,
          boxId,
          type: 'RH_EXCEEDED',
          severity: 'WARNING',
          message: `Kelembaban udara melampaui batas aman 65% RH (Maks: ${summary.maxRhPct}% RH) - risiko caking/menggumpal`,
          dedupeKey: `RH_${boxId}`,
        },
      });
    }
  }

  /**
   * Import CSV logger files.
   * Format: Timestamp, Temperature, Humidity
   */
  async importCsv(
    orgId: string,
    boxId: string,
    csvContent: string,
    deviceId?: string,
  ) {
    const lines = csvContent.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) throw new BadRequestException('CSV file is empty or missing data lines.');

    const readings: Array<{ ts: Date; tempC: number; rhPct?: number }> = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const ts = new Date(parts[0]);
        const tempC = parseFloat(parts[1]);
        const rhPct = parts[2] ? parseFloat(parts[2]) : undefined;
        if (!isNaN(ts.getTime()) && !isNaN(tempC)) {
          readings.push({ ts, tempC, rhPct });
        }
      }
    }

    const box = await this.prisma.box.findFirst({
      where: { id: boxId, organizationId: orgId },
    });
    if (!box) throw new NotFoundException('Box not found.');

    const devId = deviceId || box.deviceId || 'LOGGER-CSV-IMPORT';

    return this.ingestReadings(orgId, {
      deviceId: devId,
      boxId: box.id,
      readings,
    });
  }

  /**
   * Simulates a test/demo scenario for a box.
   */
  async simulateScenario(
    orgId: string,
    boxId: string,
    scenario: Scenario,
    durationHours: number = 16,
  ) {
    const box = await this.prisma.box.findFirst({
      where: { id: boxId, organizationId: orgId },
      include: { device: true },
    });
    if (!box) throw new NotFoundException('Box not found.');

    const deviceId = box.deviceId || (await this.getOrCreateDefaultDevice(orgId)).id;

    const points = Math.round((durationHours * 60) / 5);
    const simulated = simulateReadings({
      scenario,
      start: new Date(Date.now() - durationHours * 3600 * 1000),
      points,
      intervalMinutes: 5,
      seed: scenario === 'normal' ? 101 : scenario === 'warning' ? 202 : 303,
    });

    // Clean old simulated readings for this box
    await this.prisma.tempReading.deleteMany({ where: { boxId: box.id } });

    await this.prisma.tempReading.createMany({
      data: simulated.map((r) => ({
        deviceId,
        boxId: box.id,
        ts: r.ts,
        tempC: r.tempC,
        rhPct: r.rhPct,
        battery: 95,
      })),
    });

    await this.recalculateBoxSummary(box.id, orgId);

    return {
      success: true,
      boxId: box.id,
      scenario,
      readingsGenerated: simulated.length,
    };
  }

  private async getOrCreateDefaultDevice(orgId: string) {
    let dev = await this.prisma.iotDevice.findFirst({ where: { organizationId: orgId } });
    if (!dev) {
      dev = await this.prisma.iotDevice.create({
        data: {
          organizationId: orgId,
          deviceCode: 'DEFAULT-SIMULATOR',
          tokenHash: 'token_default_sim',
          isDemo: true,
        },
      });
    }
    return dev;
  }

  async getBoxReadings(orgId: string, boxId: string) {
    const box = await this.prisma.box.findFirst({
      where: { id: boxId, organizationId: orgId },
      include: {
        summary: true,
        readings: {
          orderBy: { ts: 'asc' },
        },
      },
    });
    if (!box) throw new NotFoundException('Box not found');
    return box;
  }

  async getAlerts(orgId: string) {
    return this.prisma.alert.findMany({
      where: { organizationId: orgId },
      include: { box: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
