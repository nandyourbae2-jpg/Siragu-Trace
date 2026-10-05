/**
 * TraceService — Lineage Engine for SIRAGU Trace (§22–23).
 *
 * Algorithm: BFS with depth limiting and cycle detection.
 * Depth param controls how many hops to load from root.
 * Initial UI load uses depth=1 (1-hop neighbor only — §63 performance).
 * User can expand node-by-node via additional requests.
 *
 * Backward trace: given lot X, find what PRODUCED X.
 *   Walk: LotRelation.targetLotId = X → get sourceLot → repeat.
 *
 * Forward trace: given lot X, find what X was used TO PRODUCE.
 *   Walk: LotRelation.sourceLotId = X → get targetLot → repeat.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  LotTraceNode, TraceEdge, ProcessEventSummary, TraceResponse,
} from './trace.types.js';

type Direction = 'backward' | 'forward' | 'both';

interface BfsItem {
  lotId: string;
  depth: number;  // negative=upstream, 0=root, positive=downstream
}

@Injectable()
export class TraceService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public entry point ────────────────────────────────────────────────────

  async trace(
    orgId: string,
    lotId: string,
    direction: Direction = 'both',
    maxDepth = 1,
  ): Promise<TraceResponse> {
    // Validate root lot exists and belongs to org
    const rootLot = await this.prisma.lot.findFirst({
      where: { id: lotId, organizationId: orgId, deletedAt: null },
      include: {
        supplier: { select: { id: true, name: true } },
        site:     { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    });
    if (!rootLot) throw new NotFoundException(`Lot "${lotId}" not found.`);

    const visitedLotIds = new Set<string>([lotId]);
    const allNodes: LotTraceNode[] = [];
    const allEdges: TraceEdge[]   = [];
    const collectedEventIds = new Set<string>();

    // BFS queue
    const queue: BfsItem[] = [{ lotId, depth: 0 }];

    while (queue.length > 0) {
      const item = queue.shift()!;

      // Load full lot data for this node
      const lot = await this.prisma.lot.findFirst({
        where: { id: item.lotId, organizationId: orgId },
        include: {
          supplier: { select: { id: true, name: true } },
          site:     { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
        },
      });
      if (!lot) continue;

      // Check upstream existence (is there a next hop?)
      const upstreamRelations = await this.prisma.lotRelation.findMany({
        where: { targetLotId: item.lotId, organizationId: orgId },
      });
      const downstreamRelations = await this.prisma.lotRelation.findMany({
        where: { sourceLotId: item.lotId, organizationId: orgId },
      });

      const hasMoreUpstream   = upstreamRelations.length > 0 && Math.abs(item.depth) >= maxDepth;
      const hasMoreDownstream = downstreamRelations.length > 0 && item.depth >= maxDepth;

      // Build the trace node
      const node: LotTraceNode = {
        id:            lot.id,
        lotCode:       lot.lotCode,
        lotType:       lot.lotType,
        productName:   lot.productName,
        quantity:      Number(lot.quantity),
        unit:          lot.unit,
        status:        lot.status,
        supplierId:    lot.supplierId,
        supplierName:  (lot as any).supplier?.name ?? null,
        siteId:        lot.siteId,
        siteName:      (lot as any).site?.name ?? null,
        locationId:    lot.locationId,
        locationName:  (lot as any).location?.name ?? null,
        createdAt:     lot.createdAt.toISOString(),
        evidenceUrls:  Array.isArray(lot.evidenceUrls) ? (lot.evidenceUrls as string[]) : [],
        depth:         item.depth,
        hasMoreUpstream,
        hasMoreDownstream,
      };
      allNodes.push(node);

      // --- Backward traversal (find sources) ---
      if ((direction === 'backward' || direction === 'both') && item.depth > -maxDepth) {
        for (const rel of upstreamRelations) {
          // Add edge
          allEdges.push({
            id:          rel.id,
            sourceLotId: rel.sourceLotId,
            targetLotId: rel.targetLotId,
            relationType: rel.relationType,
            quantity:    Number(rel.quantity),
            unit:        rel.unit,
            eventId:     rel.eventId,
          });
          if (rel.eventId) collectedEventIds.add(rel.eventId);

          // Enqueue if not visited
          if (!visitedLotIds.has(rel.sourceLotId)) {
            visitedLotIds.add(rel.sourceLotId);
            queue.push({ lotId: rel.sourceLotId, depth: item.depth - 1 });
          }
        }
      } else if (item.depth === 0 && direction !== 'forward') {
        // Always add root's upstream edges even if depth=0 for edge display
        for (const rel of upstreamRelations) {
          if (!allEdges.find(e => e.id === rel.id)) {
            allEdges.push({
              id:          rel.id,
              sourceLotId: rel.sourceLotId,
              targetLotId: rel.targetLotId,
              relationType: rel.relationType,
              quantity:    Number(rel.quantity),
              unit:        rel.unit,
              eventId:     rel.eventId,
            });
          }
        }
      }

      // --- Forward traversal (find targets) ---
      if ((direction === 'forward' || direction === 'both') && item.depth < maxDepth) {
        for (const rel of downstreamRelations) {
          if (!allEdges.find(e => e.id === rel.id)) {
            allEdges.push({
              id:          rel.id,
              sourceLotId: rel.sourceLotId,
              targetLotId: rel.targetLotId,
              relationType: rel.relationType,
              quantity:    Number(rel.quantity),
              unit:        rel.unit,
              eventId:     rel.eventId,
            });
          }
          if (rel.eventId) collectedEventIds.add(rel.eventId);

          if (!visitedLotIds.has(rel.targetLotId)) {
            visitedLotIds.add(rel.targetLotId);
            queue.push({ lotId: rel.targetLotId, depth: item.depth + 1 });
          }
        }
      }
    }

    // Load process events referenced in edges
    const events: ProcessEventSummary[] = [];
    if (collectedEventIds.size > 0) {
      const dbEvents = await this.prisma.processEvent.findMany({
        where: { id: { in: Array.from(collectedEventIds) } },
        include: {
          inputs:  { select: { lotId: true } },
          outputs: { select: { lotId: true } },
        },
      });
      for (const e of dbEvents) {
        events.push({
          id:                e.id,
          eventCode:         e.eventCode,
          eventType:         e.eventType,
          customEventName:   e.customEventName,
          massBalanceStatus: e.massBalanceStatus,
          massBalanceDiff:   e.massBalanceDiff ? Number(e.massBalanceDiff) : null,
          startAt:           e.startAt.toISOString(),
          endAt:             e.endAt?.toISOString() ?? null,
          inputLotIds:       e.inputs.map((i) => i.lotId),
          outputLotIds:      e.outputs.map((o) => o.lotId),
          notes:             e.notes,
        });
      }
    }

    // Traceability completeness: lots with supplier + at least one evidence
    const nodesWithSource = allNodes.filter(
      (n) => n.supplierId || n.lotType !== 'RECEIVED',
    ).length;
    const completeness = allNodes.length > 0 ? nodesWithSource / allNodes.length : 1;

    const root       = allNodes.find((n) => n.id === lotId)!;
    const upstream   = allNodes.filter((n) => n.depth < 0);
    const downstream = allNodes.filter((n) => n.depth > 0);

    return {
      root,
      upstream,
      downstream,
      edges:    allEdges,
      events,
      packages:  [],
      shipments: [],
      buyers:    [],
      meta: {
        direction,
        depth:      maxDepth,
        totalNodes: allNodes.length,
        traceabilityCompleteness: parseFloat(completeness.toFixed(4)),
      },
    };
  }
}
