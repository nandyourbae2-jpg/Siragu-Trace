/**
 * Trace Engine — SIRAGU Trace.
 *
 * Fungsi murni untuk menelusuri silsilah rantai pasok secara dua arah:
 *  - Mundur (backward): Kemasan → Lot Olahan → Bahan Baku → Petani
 *  - Maju  (forward)  : Petani/Bahan Baku → Lot Olahan → Kemasan → Pengiriman → Pembeli
 *
 * Dipakai oleh halaman Ketertelusuran, Analisis Dampak Komplain,
 * halaman Scan QR Konsumen, dan Dossier Pembeli.
 */

import type { Buyer, DemoState, Farmer, LotItem, PackagingUnit, Shipment } from './demoData';

export type TraceDirection = 'BACKWARD' | 'FORWARD';

export type TraceTargetKind = 'FARMER' | 'RAW' | 'PROCESSED' | 'PACKAGE' | 'SHIPMENT';

export interface TraceTarget {
  kind: TraceTargetKind;
  id: string;
  code: string;
}

export interface TraceResult {
  target: TraceTarget | null;
  farmers: Farmer[];
  rawLots: LotItem[];
  processedLots: LotItem[];
  packages: PackagingUnit[];
  shipments: Shipment[];
  buyers: Buyer[];
}

const uniq = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
};

/** Cari entitas berdasarkan kode (serial kemasan, kode lot, kode surat jalan, kode petani). */
export function resolveTarget(state: DemoState, farmers: Farmer[], query: string): TraceTarget | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const pkg = state.packages.find((p) => p.serialNumber.toLowerCase() === q);
  if (pkg) return { kind: 'PACKAGE', id: pkg.id, code: pkg.serialNumber };

  const lot = state.lots.find((l) => l.lotCode.toLowerCase() === q);
  if (lot) return { kind: lot.type === 'RAW_ORGANIC' ? 'RAW' : 'PROCESSED', id: lot.id, code: lot.lotCode };

  const shp = state.shipments.find((s) => s.shipmentCode.toLowerCase() === q);
  if (shp) return { kind: 'SHIPMENT', id: shp.id, code: shp.shipmentCode };

  const farmer = farmers.find((f) => f.code.toLowerCase() === q || f.id.toLowerCase() === q);
  if (farmer) return { kind: 'FARMER', id: farmer.id, code: farmer.code };

  return null;
}

/** Daftar seluruh kode yang dapat ditelusuri (untuk saran pencarian). */
export function listTraceableCodes(state: DemoState, farmers: Farmer[]) {
  return [
    ...state.packages.map((p) => ({ code: p.serialNumber, label: `Kemasan · ${p.packageSize}` })),
    ...state.lots
      .filter((l) => l.type === 'PROCESSED')
      .map((l) => ({ code: l.lotCode, label: 'Lot Olahan' })),
    ...state.lots
      .filter((l) => l.type === 'RAW_ORGANIC')
      .map((l) => ({ code: l.lotCode, label: `Bahan Baku · ${l.farmerName ?? ''}` })),
    ...state.shipments.map((s) => ({ code: s.shipmentCode, label: `Surat Jalan · ${s.buyerName}` })),
    ...farmers.map((f) => ({ code: f.code, label: `Petani · ${f.name}` })),
  ];
}

// ── Penelusuran dasar ────────────────────────────────────────────────────────

function backwardFromProcessed(state: DemoState, farmers: Farmer[], procs: LotItem[]) {
  const rawIds = new Set(procs.flatMap((p) => p.inputLotIds ?? []));
  const rawLots = state.lots.filter((l) => rawIds.has(l.id));
  const farmerIds = new Set(rawLots.map((r) => r.farmerId));
  return { rawLots, farmers: farmers.filter((f) => farmerIds.has(f.id)) };
}

function forwardFromProcessed(state: DemoState, procs: LotItem[]) {
  const procIds = new Set(procs.map((p) => p.id));
  const packages = state.packages.filter((p) => procIds.has(p.lotId));
  const shipmentIds = new Set(packages.map((p) => p.shipmentId).filter(Boolean) as string[]);
  const shipments = state.shipments.filter((s) => shipmentIds.has(s.id));
  const buyerIds = new Set(shipments.map((s) => s.buyerId));
  const buyers = state.buyers.filter((b) => buyerIds.has(b.id));
  return { packages, shipments, buyers };
}

export function traceFrom(
  state: DemoState,
  farmers: Farmer[],
  query: string,
  direction: TraceDirection,
): TraceResult {
  const empty: TraceResult = {
    target: null,
    farmers: [],
    rawLots: [],
    processedLots: [],
    packages: [],
    shipments: [],
    buyers: [],
  };
  const target = resolveTarget(state, farmers, query);
  if (!target) return empty;

  const lotById = (id: string) => state.lots.find((l) => l.id === id);

  if (direction === 'BACKWARD') {
    switch (target.kind) {
      case 'SHIPMENT': {
        const shp = state.shipments.find((s) => s.id === target.id)!;
        const packages = state.packages.filter((p) => shp.packageIds.includes(p.id));
        const procs = uniq(packages.map((p) => lotById(p.lotId)).filter(Boolean) as LotItem[]);
        const back = backwardFromProcessed(state, farmers, procs);
        const buyers = state.buyers.filter((b) => b.id === shp.buyerId);
        return { target, ...back, processedLots: procs, packages, shipments: [shp], buyers };
      }
      case 'PACKAGE': {
        const pkg = state.packages.find((p) => p.id === target.id)!;
        const procs = [lotById(pkg.lotId)].filter(Boolean) as LotItem[];
        const back = backwardFromProcessed(state, farmers, procs);
        return { ...empty, target, ...back, processedLots: procs, packages: [pkg] };
      }
      case 'PROCESSED': {
        const procs = [lotById(target.id)!];
        const back = backwardFromProcessed(state, farmers, procs);
        return { ...empty, target, ...back, processedLots: procs };
      }
      case 'RAW': {
        const raw = lotById(target.id)!;
        return {
          ...empty,
          target,
          rawLots: [raw],
          farmers: farmers.filter((f) => f.id === raw.farmerId),
        };
      }
      case 'FARMER':
        return { ...empty, target, farmers: farmers.filter((f) => f.id === target.id) };
    }
  }

  // FORWARD
  switch (target.kind) {
    case 'FARMER': {
      const farmer = farmers.find((f) => f.id === target.id)!;
      const rawLots = state.lots.filter((l) => l.type === 'RAW_ORGANIC' && l.farmerId === farmer.id);
      const rawIds = new Set(rawLots.map((r) => r.id));
      const procs = state.lots.filter((l) => l.inputLotIds?.some((id) => rawIds.has(id)));
      return { target, farmers: [farmer], rawLots, processedLots: procs, ...forwardFromProcessed(state, procs) };
    }
    case 'RAW': {
      const raw = lotById(target.id)!;
      const procs = state.lots.filter((l) => l.inputLotIds?.includes(raw.id));
      return {
        target,
        farmers: farmers.filter((f) => f.id === raw.farmerId),
        rawLots: [raw],
        processedLots: procs,
        ...forwardFromProcessed(state, procs),
      };
    }
    case 'PROCESSED': {
      const procs = [lotById(target.id)!];
      return { ...empty, target, processedLots: procs, ...forwardFromProcessed(state, procs) };
    }
    case 'PACKAGE': {
      const pkg = state.packages.find((p) => p.id === target.id)!;
      const shipments = state.shipments.filter((s) => s.id === pkg.shipmentId);
      const buyers = state.buyers.filter((b) => shipments.some((s) => s.buyerId === b.id));
      return { ...empty, target, packages: [pkg], shipments, buyers };
    }
    case 'SHIPMENT': {
      const shp = state.shipments.find((s) => s.id === target.id)!;
      return {
        ...empty,
        target,
        shipments: [shp],
        buyers: state.buyers.filter((b) => b.id === shp.buyerId),
      };
    }
  }
}

/**
 * Analisis dampak penuh untuk sebuah lot olahan (dipakai saat komplain / recall):
 * mundur ke petani asal + maju ke seluruh kemasan, pengiriman, dan pembeli.
 */
export function computeImpact(state: DemoState, farmers: Farmer[], lotCode: string) {
  const back = traceFrom(state, farmers, lotCode, 'BACKWARD');
  const fwd = traceFrom(state, farmers, lotCode, 'FORWARD');
  const inStock = fwd.packages.filter((p) => p.status !== 'SHIPPED');
  const shipped = fwd.packages.filter((p) => p.status === 'SHIPPED');
  return {
    lot: back.processedLots[0] ?? null,
    farmers: back.farmers,
    rawLots: back.rawLots,
    packages: fwd.packages,
    packagesInStock: inStock,
    packagesShipped: shipped,
    shipments: fwd.shipments,
    buyers: fwd.buyers,
    totalKgAffected: fwd.packages.reduce((a, p) => a + p.totalKg, 0),
  };
}

/** Kumpulan lengkap asal-usul untuk sekumpulan kemasan (dossier & scan QR). */
export function originForPackages(state: DemoState, farmers: Farmer[], packages: PackagingUnit[]) {
  const procIds = new Set(packages.map((p) => p.lotId));
  const procs = state.lots.filter((l) => procIds.has(l.id));
  const { rawLots, farmers: originFarmers } = backwardFromProcessed(state, farmers, procs);
  const inspections = state.inspections.filter((i) => procIds.has(i.lotId));
  return { processedLots: procs, rawLots, farmers: originFarmers, inspections };
}
