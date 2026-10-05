/**
 * DemoDataContext — penyimpanan state demo SIRAGU Trace.
 *
 * - Seluruh data operasional dipersist ke localStorage sehingga demo terasa
 *   "nyata" (data tetap ada setelah refresh) dan tersinkron antar tab
 *   (mis. pembeli mengunggah dokumen di tab Dossier → langsung terlihat di CRM).
 * - Sensor IoT disimulasikan secara live (tidak dipersist).
 * - Setiap aksi membaca state terbaru melalui ref sehingga aman dipanggil
 *   berturut-turut dan dapat mengembalikan entitas yang baru dibuat.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Buyer,
  BuyerDocument,
  Certificate,
  ComplaintIssue,
  ComplaintRecord,
  ComplaintSeverity,
  DemoState,
  Farmer,
  LotItem,
  PackagingUnit,
  PackageSizeOption,
  QAInspection,
  SensorDevice,
  Shipment,
} from '../lib/demoData';
import { createInitialSensors, createInitialState, INITIAL_FARMERS, QA_LIMITS } from '../lib/demoData';
import { nowStamp } from '../lib/format';

// ── Tipe Aksi ────────────────────────────────────────────────────────────────

export interface ReleaseDecisionInput {
  lotId: string;
  inspectorName: string;
  moisture: number;
  sucrose: number;
  ashContent: number;
  organolepticColor: string;
  organolepticAroma: string;
  microbialTest: 'PASSED' | 'FAILED';
  notes: string;
}

interface DemoDataContextType extends DemoState {
  farmers: Farmer[];
  sensors: SensorDevice[];

  // Turunan
  getLotRemainingKg: (lotId: string) => number;

  // Operasional
  addReceivingLot: (data: { farmerId: string; grossKg: number; tareKg: number; notes?: string; createdBy: string }) => LotItem;
  addProcessingBatch: (data: { inputLotIds: string[]; outputQuantityKg: number; notes?: string; createdBy: string }) => LotItem;
  submitReleaseDecision: (data: ReleaseDecisionInput) => { inspection: QAInspection; released: boolean };
  quarantineLot: (lotId: string, reason: string) => void;
  requestRetest: (lotId: string) => void;
  createPackagingRun: (data: { lotId: string; size: PackageSizeOption; quantity: number; packedBy: string }) => PackagingUnit;
  createShipment: (data: { buyerId: string; vehiclePlate: string; driverName: string; packageIds: string[]; createdBy: string }) => Shipment;
  markShipmentDelivered: (shipmentId: string) => void;

  // Komplain
  addComplaint: (data: {
    source: 'BUYER' | 'CONSUMER';
    buyerName: string;
    contact?: string;
    relatedLotCode: string;
    relatedPackageSerial?: string;
    issueType: ComplaintIssue;
    description: string;
    severity: ComplaintSeverity;
  }) => ComplaintRecord;
  containComplaint: (complaintId: string) => { lotCode: string; packagesHeld: number } | null;
  resolveComplaint: (complaintId: string, resolutionNote: string) => void;

  // CRM & dokumen
  addBuyer: (data: Omit<Buyer, 'id' | 'accessToken' | 'createdAt'>) => Buyer;
  addBuyerDocument: (data: Omit<BuyerDocument, 'id' | 'uploadedAt'>) => BuyerDocument;
  addCertificate: (data: Omit<Certificate, 'id'>) => Certificate;
  removeCertificate: (id: string) => void;

  // IoT
  pingSensor: (sensorId: string) => void;

  resetDemoData: () => void;
}

const STORAGE_KEY = 'siragu_trace_demo_state_v4';

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

// ── Util ─────────────────────────────────────────────────────────────────────

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoState>;
      const fresh = createInitialState();
      // Pastikan semua slice ada (kompatibel jika struktur bertambah).
      return {
        lots: parsed.lots ?? fresh.lots,
        packages: parsed.packages ?? fresh.packages,
        inspections: parsed.inspections ?? fresh.inspections,
        complaints: parsed.complaints ?? fresh.complaints,
        buyers: parsed.buyers ?? fresh.buyers,
        shipments: parsed.shipments ?? fresh.shipments,
        certificates: parsed.certificates ?? fresh.certificates,
        documents: parsed.documents ?? fresh.documents,
      };
    }
  } catch (err) {
    console.warn('State demo rusak, memuat ulang data awal.', err);
  }
  return createInitialState();
}

/** Nomor urut berikutnya berdasarkan angka terbesar di akhir kode. */
function nextSeq(codes: string[]): number {
  const nums = codes.map((c) => Number(c.match(/(\d+)$/)?.[1] ?? 0));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const randomToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const round = (n: number, d = 1) => Number(n.toFixed(d));

const clockNow = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// ── Provider ─────────────────────────────────────────────────────────────────

export const DemoDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DemoState>(loadState);
  const stateRef = useRef(state);
  const [sensors, setSensors] = useState<SensorDevice[]>(createInitialSensors);

  const commit = useCallback((updater: (prev: DemoState) => DemoState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage penuh / mode privat — abaikan */
    }
  }, []);

  // Simpan state awal sekali agar tab lain (mis. dossier) membaca data yang sama.
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
    }
  }, []);

  // Sinkronisasi antar tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = loadState();
      stateRef.current = next;
      setState(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Simulasi telemetri sensor live (setiap 5 detik).
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSensors((prev) =>
        prev.map((s) => {
          if (s.status !== 'ONLINE' || s.temperature === null || s.humidity === null) return s;
          const temperature = round(s.temperature + (Math.random() - 0.5) * 0.3);
          const humidity = round(Math.min(80, Math.max(35, s.humidity + (Math.random() - 0.5) * 0.8)));
          const time = clockNow();
          const history =
            s.history[0]?.time === time
              ? [{ time, temperature, humidity }, ...s.history.slice(1)]
              : [{ time, temperature, humidity }, ...s.history].slice(0, 12);
          return { ...s, temperature, humidity, lastSeen: 'baru saja', history };
        }),
      );
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  // ── Turunan ───────────────────────────────────────────────────────────────

  const getLotRemainingKg = useCallback(
    (lotId: string) => {
      const lot = state.lots.find((l) => l.id === lotId);
      if (!lot) return 0;
      const used = state.packages.filter((p) => p.lotId === lotId).reduce((a, p) => a + p.totalKg, 0);
      return round(Math.max(0, lot.quantity - used), 2);
    },
    [state.lots, state.packages],
  );

  // ── Aksi Operasional ──────────────────────────────────────────────────────

  const addReceivingLot: DemoDataContextType['addReceivingLot'] = (data) => {
    const prev = stateRef.current;
    const farmer = INITIAL_FARMERS.find((f) => f.id === data.farmerId);
    const seq = nextSeq(prev.lots.filter((l) => l.type === 'RAW_ORGANIC').map((l) => l.lotCode));
    const newLot: LotItem = {
      id: uid('lot-raw'),
      lotCode: `SPL-2026-${String(seq).padStart(3, '0')}`,
      type: 'RAW_ORGANIC',
      name: 'Gula Semut Mentah Organik',
      quantity: round(data.grossKg - data.tareKg, 2),
      unit: 'kg',
      status: 'RECEIVED',
      createdAt: nowStamp(),
      createdBy: data.createdBy,
      farmerId: data.farmerId,
      farmerName: farmer?.name ?? 'Petani / Pemasok',
      grossKg: data.grossKg,
      tareKg: data.tareKg,
      notes: data.notes || 'Diterima di gudang bahan baku.',
    };
    commit((s) => ({ ...s, lots: [newLot, ...s.lots] }));
    return newLot;
  };

  const addProcessingBatch: DemoDataContextType['addProcessingBatch'] = (data) => {
    const prev = stateRef.current;
    const seq = nextSeq(prev.lots.filter((l) => l.type === 'PROCESSED').map((l) => l.lotCode));
    const inputs = prev.lots.filter((l) => data.inputLotIds.includes(l.id));
    const inputKg = round(inputs.reduce((a, l) => a + l.quantity, 0), 2);
    const shrink = inputKg > 0 ? ((inputKg - data.outputQuantityKg) / inputKg) * 100 : 0;
    const newLot: LotItem = {
      id: uid('lot-proc'),
      lotCode: `GSO-2026-${String(seq).padStart(3, '0')}`,
      type: 'PROCESSED',
      name: 'Gula Semut Organik (Setelah Oven)',
      quantity: data.outputQuantityKg,
      unit: 'kg',
      status: 'PENDING_RELEASE',
      createdAt: nowStamp(),
      createdBy: data.createdBy,
      inputLotIds: data.inputLotIds,
      inputQuantityKg: inputKg,
      yieldPercentage: round(100 - shrink),
      shrinkagePercentage: round(shrink),
      notes: data.notes || `${inputKg} kg masuk → ${data.outputQuantityKg} kg keluar. Susut ${round(shrink)}%.`,
    };
    commit((s) => ({
      ...s,
      lots: [
        newLot,
        ...s.lots.map((l) => (data.inputLotIds.includes(l.id) ? { ...l, status: 'PROCESSED' as const } : l)),
      ],
    }));
    return newLot;
  };

  const submitReleaseDecision: DemoDataContextType['submitReleaseDecision'] = (data) => {
    const prev = stateRef.current;
    const lot = prev.lots.find((l) => l.id === data.lotId);
    const passed =
      data.moisture <= QA_LIMITS.maxMoisture &&
      data.sucrose >= QA_LIMITS.minSucrose &&
      data.ashContent <= QA_LIMITS.maxAsh &&
      data.microbialTest === 'PASSED';
    const stamp = nowStamp();
    const inspection: QAInspection = {
      id: uid('insp'),
      lotId: data.lotId,
      lotCode: lot?.lotCode ?? '-',
      inspectorName: data.inspectorName,
      testDate: stamp,
      moisture: data.moisture,
      sucrose: data.sucrose,
      ashContent: data.ashContent,
      organolepticColor: data.organolepticColor,
      organolepticAroma: data.organolepticAroma,
      microbialTest: data.microbialTest,
      status: passed ? 'PASSED' : 'FAILED',
      notes: data.notes,
    };
    const failedReasons = [
      data.moisture > QA_LIMITS.maxMoisture && `kadar air ${data.moisture}% (maks ${QA_LIMITS.maxMoisture}%)`,
      data.sucrose < QA_LIMITS.minSucrose && `sukrosa ${data.sucrose}% (min ${QA_LIMITS.minSucrose}%)`,
      data.ashContent > QA_LIMITS.maxAsh && `kadar abu ${data.ashContent}% (maks ${QA_LIMITS.maxAsh}%)`,
      data.microbialTest === 'FAILED' && 'uji mikrobiologi gagal',
    ].filter(Boolean);

    commit((s) => ({
      ...s,
      inspections: [inspection, ...s.inspections],
      lots: s.lots.map((l) =>
        l.id === data.lotId
          ? {
              ...l,
              moistureContent: data.moisture,
              sucroseContent: data.sucrose,
              ...(passed
                ? { status: 'RELEASED' as const, releaseApprovedBy: data.inspectorName, releaseApprovedAt: stamp, quarantineReason: undefined }
                : { status: 'QUARANTINED' as const, quarantineReason: `Gagal uji mutu: ${failedReasons.join(', ')}.` }),
            }
          : l,
      ),
    }));
    return { inspection, released: passed };
  };

  const quarantineLot = (lotId: string, reason: string) => {
    commit((s) => ({
      ...s,
      lots: s.lots.map((l) => (l.id === lotId ? { ...l, status: 'QUARANTINED', quarantineReason: reason } : l)),
    }));
  };

  const requestRetest = (lotId: string) => {
    commit((s) => ({
      ...s,
      lots: s.lots.map((l) =>
        l.id === lotId ? { ...l, status: 'PENDING_RELEASE', notes: `${l.notes ?? ''} · Diajukan uji ulang ${nowStamp()}.`.trim() } : l,
      ),
    }));
  };

  const createPackagingRun: DemoDataContextType['createPackagingRun'] = (data) => {
    const prev = stateRef.current;
    const lot = prev.lots.find((l) => l.id === data.lotId);
    const seq = nextSeq(prev.packages.map((p) => p.serialNumber));
    const pkg: PackagingUnit = {
      id: uid('pkg'),
      packageCode: `PACK-${String(seq).padStart(3, '0')}`,
      lotId: data.lotId,
      lotCode: lot?.lotCode ?? '-',
      packageSize: data.size.label,
      unitWeightKg: data.size.kg,
      unitName: data.size.unitName,
      quantity: data.quantity,
      totalKg: round(data.size.kg * data.quantity, 2),
      serialNumber: `PKG-2026-${String(seq).padStart(4, '0')}`,
      qrStatus: 'ACTIVE',
      status: 'IN_STOCK',
      packedAt: nowStamp(),
      packedBy: data.packedBy,
    };
    commit((s) => ({ ...s, packages: [pkg, ...s.packages] }));
    return pkg;
  };

  const createShipment: DemoDataContextType['createShipment'] = (data) => {
    const prev = stateRef.current;
    const buyer = prev.buyers.find((b) => b.id === data.buyerId);
    const seq = nextSeq(prev.shipments.map((s) => s.shipmentCode));
    const pkgs = prev.packages.filter((p) => data.packageIds.includes(p.id));
    const shipment: Shipment = {
      id: uid('shp'),
      shipmentCode: `SJ-2026-${String(seq).padStart(3, '0')}`,
      buyerId: data.buyerId,
      buyerName: buyer?.name ?? '-',
      vehiclePlate: data.vehiclePlate.toUpperCase(),
      driverName: data.driverName,
      packageIds: data.packageIds,
      totalKg: round(pkgs.reduce((a, p) => a + p.totalKg, 0), 2),
      shippedAt: nowStamp(),
      createdBy: data.createdBy,
      status: 'IN_TRANSIT',
    };
    commit((s) => ({
      ...s,
      shipments: [shipment, ...s.shipments],
      packages: s.packages.map((p) =>
        data.packageIds.includes(p.id) ? { ...p, status: 'SHIPPED', shipmentId: shipment.id } : p,
      ),
    }));
    return shipment;
  };

  const markShipmentDelivered = (shipmentId: string) => {
    commit((s) => ({
      ...s,
      shipments: s.shipments.map((sh) =>
        sh.id === shipmentId ? { ...sh, status: 'DELIVERED', deliveredAt: nowStamp() } : sh,
      ),
    }));
  };

  // ── Komplain ──────────────────────────────────────────────────────────────

  const addComplaint: DemoDataContextType['addComplaint'] = (data) => {
    const prev = stateRef.current;
    const seq = nextSeq(prev.complaints.map((c) => c.caseCode));
    const comp: ComplaintRecord = {
      id: uid('comp'),
      caseCode: `KMP-2026-${String(seq).padStart(3, '0')}`,
      source: data.source,
      buyerName: data.buyerName,
      contact: data.contact,
      relatedLotCode: data.relatedLotCode,
      relatedPackageSerial: data.relatedPackageSerial,
      reportedDate: nowStamp(),
      issueType: data.issueType,
      description: data.description,
      status: 'OPEN',
      severity: data.severity,
      assignedTo: 'Arjun Rajan (Pemilik)',
    };
    commit((s) => ({ ...s, complaints: [comp, ...s.complaints] }));
    return comp;
  };

  const containComplaint: DemoDataContextType['containComplaint'] = (complaintId) => {
    const prev = stateRef.current;
    const comp = prev.complaints.find((c) => c.id === complaintId);
    if (!comp) return null;
    const lot = prev.lots.find((l) => l.lotCode === comp.relatedLotCode);
    if (!lot) return null;
    const heldIds = prev.packages.filter((p) => p.lotId === lot.id && p.status === 'IN_STOCK').map((p) => p.id);
    const action = `Lot ${lot.lotCode} dikarantina; ${heldIds.length} batch kemasan di gudang ditahan (ON HOLD). Pembeli terdampak diberi notifikasi.`;
    commit((s) => ({
      ...s,
      lots: s.lots.map((l) =>
        l.id === lot.id ? { ...l, status: 'QUARANTINED', quarantineReason: `Karantina terkait komplain ${comp.caseCode}: ${comp.issueType}.` } : l,
      ),
      packages: s.packages.map((p) => (heldIds.includes(p.id) ? { ...p, status: 'ON_HOLD' } : p)),
      complaints: s.complaints.map((c) =>
        c.id === complaintId ? { ...c, status: 'CONTAINED', containmentAction: action } : c,
      ),
    }));
    return { lotCode: lot.lotCode, packagesHeld: heldIds.length };
  };

  const resolveComplaint = (complaintId: string, resolutionNote: string) => {
    commit((s) => ({
      ...s,
      complaints: s.complaints.map((c) =>
        c.id === complaintId ? { ...c, status: 'RESOLVED', resolvedAt: nowStamp(), resolutionNote } : c,
      ),
    }));
  };

  // ── CRM, Dokumen, Sertifikat ──────────────────────────────────────────────

  const addBuyer: DemoDataContextType['addBuyer'] = (data) => {
    const initials = data.name
      .replace(/^(PT|CV|UD|Toko)\s+/i, '')
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();
    const buyer: Buyer = {
      ...data,
      id: uid('buyer'),
      accessToken: `${initials || 'B2B'}-${randomToken()}`,
      createdAt: nowStamp(),
    };
    commit((s) => ({ ...s, buyers: [...s.buyers, buyer] }));
    return buyer;
  };

  const addBuyerDocument: DemoDataContextType['addBuyerDocument'] = (data) => {
    const doc: BuyerDocument = { ...data, id: uid('doc'), uploadedAt: nowStamp() };
    commit((s) => ({ ...s, documents: [doc, ...s.documents] }));
    return doc;
  };

  const addCertificate: DemoDataContextType['addCertificate'] = (data) => {
    const cert: Certificate = { ...data, id: uid('cert') };
    commit((s) => ({ ...s, certificates: [...s.certificates, cert] }));
    return cert;
  };

  const removeCertificate = (id: string) => {
    commit((s) => ({ ...s, certificates: s.certificates.filter((c) => c.id !== id) }));
  };

  // ── IoT ───────────────────────────────────────────────────────────────────

  const pingSensor = (sensorId: string) => {
    setSensors((prev) => prev.map((s) => (s.id === sensorId ? { ...s, status: 'CONNECTING' } : s)));
    window.setTimeout(() => {
      setSensors((prev) =>
        prev.map((s) => {
          if (s.id !== sensorId) return s;
          const temperature = 31.2;
          const humidity = 38.5;
          return {
            ...s,
            status: 'ONLINE',
            temperature,
            humidity,
            lastSeen: 'baru saja',
            history: [{ time: clockNow(), temperature, humidity }, ...s.history].slice(0, 12),
          };
        }),
      );
    }, 2200);
  };

  const resetDemoData = () => {
    const fresh = createInitialState();
    commit(() => fresh);
    setSensors(createInitialSensors());
  };

  const value = useMemo<DemoDataContextType>(
    () => ({
      ...state,
      farmers: INITIAL_FARMERS,
      sensors,
      getLotRemainingKg,
      addReceivingLot,
      addProcessingBatch,
      submitReleaseDecision,
      quarantineLot,
      requestRetest,
      createPackagingRun,
      createShipment,
      markShipmentDelivered,
      addComplaint,
      containComplaint,
      resolveComplaint,
      addBuyer,
      addBuyerDocument,
      addCertificate,
      removeCertificate,
      pingSensor,
      resetDemoData,
    }),
    // Aksi membaca stateRef sehingga cukup bergantung pada state & sensors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, sensors, getLotRemainingKg],
  );

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDemoData = () => {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData harus digunakan di dalam DemoDataProvider');
  }
  return context;
};
