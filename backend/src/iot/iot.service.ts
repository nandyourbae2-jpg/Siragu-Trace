import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class IotService {
  constructor(private readonly prisma: PrismaService) {}

  async getSensors(orgId: string) {
    return this.prisma.sensor.findMany({
      where: { organizationId: orgId },
      include: {
        location: { select: { name: true, type: true } },
        gateway: { select: { deviceCode: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getSensorReadings(orgId: string, sensorId: string, hours: number = 24) {
    const sensor = await this.prisma.sensor.findFirst({
      where: { id: sensorId, organizationId: orgId }
    });
    if (!sensor) throw new NotFoundException('Sensor not found');

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // BR-011: Missing data MUST be preserved and returned as MISSING.
    // It should NEVER be interpolated on the backend.
    return this.prisma.sensorReading.findMany({
      where: { 
        sensorId,
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'asc' }
    });
  }
}
