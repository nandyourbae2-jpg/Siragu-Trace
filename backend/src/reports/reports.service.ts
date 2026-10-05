import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ExportJobStatus, Prisma } from '@prisma/client';

export interface ReportFilterDto {
  reportType: 'TRACEABILITY' | 'MASS_BALANCE' | 'COMPLAINT' | 'ENVIRONMENTAL';
  format: 'CSV' | 'PDF';
  dateFrom?: string;
  dateTo?: string;
  siteId?: string;
  lotId?: string;
  supplierId?: string;
  buyerId?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * PRD §63: Enqueues an async export job instead of blocking the UI.
   * Returns the job ID for the client to poll.
   */
  async requestExport(orgId: string, actorId: string, filters: ReportFilterDto) {
    const job = await this.prisma.exportJob.create({
      data: {
        organizationId: orgId,
        requestedById: actorId,
        reportType: filters.reportType,
        format: filters.format,
        filters: filters as unknown as Prisma.InputJsonValue,
        status: ExportJobStatus.PENDING,
      },
    });

    // Fire off async background generation without awaiting it
    this.processAsyncExport(job.id).catch(console.error);

    return job;
  }

  async getJobStatus(orgId: string, jobId: string) {
    const job = await this.prisma.exportJob.findFirst({
      where: { id: jobId, organizationId: orgId },
    });
    if (!job) throw new NotFoundException('Export job not found');
    return job;
  }

  async getRecentJobs(orgId: string, actorId: string) {
    return this.prisma.exportJob.findMany({
      where: { organizationId: orgId, requestedById: actorId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Mock implementation of the async background worker.
   */
  private async processAsyncExport(jobId: string) {
    // 1. Simulate delay for large dataset extraction
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // 2. Mark as completed with a mock URL
    await this.prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: ExportJobStatus.COMPLETED,
        fileUrl: `https://mock-storage.siragu.local/exports/${jobId}.pdf`,
        completedAt: new Date(),
      }
    });
  }
}
