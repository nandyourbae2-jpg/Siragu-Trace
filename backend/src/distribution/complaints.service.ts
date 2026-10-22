import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TraceService } from '../trace/trace.service.js';
import type { LotTraceNode, TraceResponse } from '../trace/trace.types.js';
import { ComplaintStatus, Prisma } from '@prisma/client';

export interface CreateComplaintDto {
  reportedBy: string;
  reason: string;
  description: string;
  relatedLotId?: string;
  relatedPackageId?: string;
}

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly traceSvc: TraceService,
  ) {}

  async createComplaint(orgId: string, actorId: string, dto: CreateComplaintDto) {
    if (!dto.relatedLotId && !dto.relatedPackageId) {
      throw new BadRequestException('A complaint must be linked to at least a Lot or a Package.');
    }

    return this.prisma.complaint.create({
      data: {
        organizationId: orgId,
        caseCode: `CC-${Date.now().toString().slice(-6)}`,
        reportedBy: dto.reportedBy,
        reason: dto.reason,
        description: dto.description,
        relatedLotId: dto.relatedLotId,
        relatedPackageId: dto.relatedPackageId,
        responsibleUserId: actorId, // MVP assigns to creator
        status: ComplaintStatus.OPEN,
      },
    });
  }

  /**
   * Complaint Investigation & Impact Analysis (§24.2, §81)
   * Runs both Backward (to find root cause) and Forward traces (to find exposed impact)
   * and compiles a comprehensive Impact Scope document.
   */
  async runImpactAnalysis(orgId: string, complaintId: string) {
    const complaint = await this.prisma.complaint.findFirst({
      where: { id: complaintId, organizationId: orgId },
      include: { relatedLot: true, relatedPackage: true },
    });

    if (!complaint) throw new NotFoundException('Complaint not found.');

    const targetLotId = complaint.relatedLotId || complaint.relatedPackage?.lotId;
    if (!targetLotId) {
      throw new BadRequestException('No Lot associated with this complaint to trace.');
    }

    // 1. Backward Trace (Root Cause Analysis - find Suppliers)
    const backwardGraph = await this.traceSvc.trace(orgId, targetLotId, 'backward', 10);
    const backwardNodes = this.collectNodes(backwardGraph, 'upstream');
    const relatedSuppliers = this.extractSuppliers(backwardNodes);

    // 2. Forward Trace (Exposure Analysis - find Buyers, Shipments, Packages)
    const forwardGraph = await this.traceSvc.trace(orgId, targetLotId, 'forward', 10);
    const affectedLots = this.collectNodes(forwardGraph, 'downstream').map((n) => n.id);

    // Find affected packages & shipments from the affected lots
    const affectedPackages = await this.prisma.package.findMany({
      where: { lotId: { in: affectedLots } },
      select: { id: true, packageCode: true, status: true }
    });

    const affectedShipmentLines = await this.prisma.shipmentLine.findMany({
      where: { lotId: { in: affectedLots } },
      include: {
        shipment: { include: { buyer: { select: { id: true, name: true } } } }
      }
    });

    const affectedBuyers = new Set<string>();
    const affectedShipments = new Set<string>();
    affectedShipmentLines.forEach(line => {
      affectedShipments.add(line.shipment.shipmentCode);
      affectedBuyers.add(line.shipment.buyer.name);
    });

    const impactScope = {
      generatedAt: new Date().toISOString(),
      backwardTraceLots: backwardNodes.map((n) => n.id),
      relatedSuppliers: Array.from(relatedSuppliers),
      forwardTraceLots: affectedLots,
      affectedPackages: affectedPackages.map(p => p.packageCode),
      affectedShipments: Array.from(affectedShipments),
      affectedBuyers: Array.from(affectedBuyers),
    };

    // Save the impact scope snapshot to the Complaint record
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        impactScope: impactScope as unknown as Prisma.InputJsonValue,
        status: ComplaintStatus.INVESTIGATING,
      },
    });

    return impactScope;
  }

  /**
   * Action resolution explicitly requires a human to input the decision (BR-010).
   * System never auto-recalls.
   */
  async recordAction(orgId: string, complaintId: string, actorId: string, actionDecision: string) {
    const complaint = await this.prisma.complaint.findFirst({
      where: { id: complaintId, organizationId: orgId },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id: complaintId },
        data: {
          status: ComplaintStatus.ACTION_REQUIRED,
        },
      });

      // Log the human decision in Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          actorId,
          action: 'COMPLAINT_ACTION_RECORDED',
          entity: 'Complaint',
          entityId: complaintId,
          reason: actionDecision,
        },
      });

      return updated;
    });
  }

  /** Root lot plus the nodes on one side of the trace (the root is always in scope). */
  private collectNodes(graph: TraceResponse, side: 'upstream' | 'downstream'): LotTraceNode[] {
    return [graph.root, ...graph[side]];
  }

  // Helper to extract unique supplier IDs from trace nodes
  private extractSuppliers(nodes: LotTraceNode[]): Set<string> {
    const suppliers = new Set<string>();
    for (const node of nodes) {
      if (node.supplierId) suppliers.add(node.supplierId);
    }
    return suppliers;
  }
}
