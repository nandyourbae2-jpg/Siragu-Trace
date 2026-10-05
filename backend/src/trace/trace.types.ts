/**
 * Traceability Engine types — SIRAGU Trace (§22–23, §77).
 *
 * These are the response contracts for GET /lots/:id/trace.
 * The graph visualization maps these directly to ReactFlow nodes and edges.
 */

import type { LotStatus, LotType, RelationType, ProcessEventType, MassBalanceStatus } from '@prisma/client';

// ── Lot node in the trace graph ──────────────────────────────────────────────

export interface LotTraceNode {
  id: string;
  lotCode: string;
  lotType: LotType;
  productName: string;
  quantity: number;
  unit: string;
  status: LotStatus;
  supplierId: string | null;
  supplierName: string | null;
  siteId: string | null;
  siteName: string | null;
  locationId: string | null;
  locationName: string | null;
  createdAt: string;
  evidenceUrls: string[];
  /** Hop distance from root. Negative = upstream, 0 = root, positive = downstream. */
  depth: number;
  /** Whether more upstream ancestors exist (not yet loaded). */
  hasMoreUpstream: boolean;
  /** Whether more downstream descendants exist (not yet loaded). */
  hasMoreDownstream: boolean;
}

// ── Lineage edge ─────────────────────────────────────────────────────────────

export interface TraceEdge {
  id: string;
  sourceLotId: string;
  targetLotId: string;
  relationType: RelationType;
  quantity: number;
  unit: string;
  eventId: string | null;
}

// ── Process event summary in the trace ───────────────────────────────────────

export interface ProcessEventSummary {
  id: string;
  eventCode: string;
  eventType: ProcessEventType;
  customEventName: string | null;
  massBalanceStatus: MassBalanceStatus;
  massBalanceDiff: number | null;
  startAt: string;
  endAt: string | null;
  inputLotIds: string[];
  outputLotIds: string[];
  notes: string | null;
}

// ── Complete trace response (§77) ────────────────────────────────────────────

export interface TraceResponse {
  root: LotTraceNode;
  /** Nodes upstream (backward) from root. */
  upstream: LotTraceNode[];
  /** Nodes downstream (forward) from root. */
  downstream: LotTraceNode[];
  /** All lineage edges in the loaded graph. */
  edges: TraceEdge[];
  /** Process events connecting the lots in this trace. */
  events: ProcessEventSummary[];
  /** Phase 5 placeholders. */
  packages: unknown[];
  shipments: unknown[];
  buyers: unknown[];
  meta: {
    direction: 'backward' | 'forward' | 'both';
    depth: number;
    totalNodes: number;
    /** 0–1 completeness score: ratio of lots with supplier + evidence. */
    traceabilityCompleteness: number;
  };
}
