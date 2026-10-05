/**
 * Demo Data & Tipe Domain — SIRAGU Trace (Bahasa Indonesia).
 *
 * Menyediakan data awal realistis untuk rantai pasok gula semut organik:
 * Petani Penderes → Bahan Baku → Pengolahan Oven → Release Gate (QA) →
 * Pengemasan QR → Pengiriman B2B → Dossier Pembeli / Scan Konsumen.
 *
 * Seluruh relasi (lot ↔ petani ↔ kemasan ↔ pengiriman ↔ komplain) saling
 * konsisten sehingga mesin ketertelusuran dapat menelusuri maju & mundur.
 * Tanggal dibuat relatif terhadap "hari ini" agar demo selalu terasa segar.
 */

import { dateFromNow, stampDaysAgo } from './format';

// ── Tipe Domain ──────────────────────────────────────────────────────────────

export interface Farmer {
  id: string;
  code: string;
  name: string;
  group: string;
  village: string;
  regency: string;
  treesCount: number;
  organicCertNo: string;
}

export type LotStatus =
  | 'RECEIVED' // bahan baku diterima, siap diolah
  | 'PROCESSED' // bahan baku sudah dipakai dalam batch olahan
  | 'PENDING_RELEASE' // lot olahan menunggu uji mutu & persetujuan rilis
  | 'RELEASED' // lot olahan lolos QA, boleh dikemas
  | 'QUARANTINED'; // lot ditahan (gagal QA / komplain)

export interface LotItem {
  id: string;
  lotCode: string;
  type: 'RAW_ORGANIC' | 'PROCESSED';
  name: string;
  quantity: number; // kg
  unit: 'kg';
  status: LotStatus;
  createdAt: string;
  createdBy?: string;
  // Bahan baku
  farmerId?: string;
  farmerName?: string;
  grossKg?: number;
  tareKg?: number;
  // Lot olahan
  inputLotIds?: string[];
  inputQuantityKg?: number;
  yieldPercentage?: number; // rendemen (%) = output / input
  shrinkagePercentage?: number; // susut (%) = (input - output) / input
  moistureContent?: number; // kadar air (%) dari uji QA
  sucroseContent?: number; // sukrosa (%) dari uji QA
  notes?: string;
  releaseApprovedBy?: string;
  releaseApprovedAt?: string;
  quarantineReason?: string;
}

export interface PackageSizeOption {
  label: string;
  kg: number;
  unitName: string;
}

export const PACKAGE_SIZES: PackageSizeOption[] = [
  { label: 'Pouch 250 g', kg: 0.25, unitName: 'pouch' },
  { label: 'Pouch 500 g', kg: 0.5, unitName: 'pouch' },
  { label: 'Pouch 1 kg', kg: 1, unitName: 'pouch' },
  { label: 'Karung 5 kg', kg: 5, unitName: 'karung' },
  { label: 'Karung 25 kg', kg: 25, unitName: 'karung' },
];

export interface PackagingUnit {
  id: string;
  packageCode: string;
  lotId: string;
  lotCode: string;
  packageSize: string; // label, mis. "Pouch 250 g"
  unitWeightKg: number;
  unitName: string;
  quantity: number; // jumlah unit
  totalKg: number;
  serialNumber: string;
  qrStatus: 'ACTIVE' | 'VOID';
  status: 'IN_STOCK' | 'SHIPPED' | 'ON_HOLD';
  shipmentId?: string;
  packedAt: string;
  packedBy: string;
}

export interface QAInspection {
  id: string;
  lotCode: string;
  lotId: string;
  inspectorName: string;
  testDate: string;
  moisture: number; // Kadar air (%) - maks 2.0%
  sucrose: number; // Sukrosa (%) - min 80%
  ashContent: number; // Kadar abu (%) - maks 2.0%
  organolepticColor: string;
  organolepticAroma: string;
  microbialTest: 'PASSED' | 'FAILED';
  status: 'PASSED' | 'FAILED';
  notes: string;
}

export type ComplaintIssue = 'Kadar Air Tinggi' | 'Gumpalan/Caking' | 'Kemasan Rusak' | 'Aroma Asam';
export type ComplaintSeverity = 'TINGGI' | 'SEDANG' | 'RENDAH';

export interface ComplaintRecord {
  id: string;
  caseCode: string;
  source: 'BUYER' | 'CONSUMER';
  buyerName: string;
  contact?: string;
  relatedLotCode: string;
  relatedPackageSerial?: string;
  reportedDate: string;
  issueType: ComplaintIssue;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  severity: ComplaintSeverity;
  containmentAction?: string;
  assignedTo: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface SensorReading {
  time: string; // HH:mm
  temperature: number | null;
  humidity: number | null;
}

export interface SensorDevice {
  id: string;
  deviceCode: string;
  location: string;
  roomName: string;
  zone: 'GUDANG_PRODUK' | 'GUDANG_BAHAN' | 'PRODUKSI';
  temperature: number | null;
  humidity: number | null;
  lastSeen: string;
  status: 'ONLINE' | 'OFFLINE' | 'CONNECTING';
  history: SensorReading[];
}

export interface Buyer {
  id: string;
  name: string;
  pic: string;
  phone: string; // format internasional tanpa '+', mis. 6281234567890
  email?: string;
  type: string;
  city: string;
  accessToken: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  shipmentCode: string;
  buyerId: string;
  buyerName: string;
  vehiclePlate: string;
  driverName: string;
  packageIds: string[];
  totalKg: number;
  shippedAt: string;
  createdBy: string;
  status: 'IN_TRANSIT' | 'DELIVERED';
  deliveredAt?: string;
}

export interface Certificate {
  id: string;
  name: string;
  number: string;
  issuer: string;
  issuedAt: string; // YYYY-MM-DD
  expiresAt: string; // YYYY-MM-DD
  fileName: string;
}

export interface BuyerDocument {
  id: string;
  buyerId: string;
  docType: string;
  fileName: string;
  sizeKb: number;
  uploadedAt: string;
}

// ── Aturan Mutu (SNI 01-3743-1995 & standar pembeli) ─────────────────────────

export const QA_LIMITS = {
  maxMoisture: 2.0,
  minSucrose: 80,
  maxAsh: 2.0,
} as const;

export const SENSOR_LIMITS = {
  minTemp: 20,
  maxTemp: 28,
  maxHumidity: 60,
  criticalHumidity: 65,
} as const;

// ── Data Master Petani ───────────────────────────────────────────────────────

export const INITIAL_FARMERS: Farmer[] = [
  {
    id: 'FARMER-01',
    code: 'PETANI-SMG-01',
    name: 'Pak Slamet Riyadi',
    group: 'Kelompok Tani Nira Lestari',
    village: 'Somagede',
    regency: 'Banyumas',
    treesCount: 35,
    organicCertNo: 'CU-ID-ORG-849201',
  },
  {
    id: 'FARMER-02',
    code: 'PETANI-KKP-02',
    name: 'Pak Sugeng Wahyudi',
    group: 'Kelompok Tani Nira Makmur',
    village: 'Hargorejo',
    regency: 'Kulon Progo',
    treesCount: 42,
    organicCertNo: 'CU-ID-ORG-849202',
  },
  {
    id: 'FARMER-03',
    code: 'PETANI-SRG-03',
    name: 'Ibu Maryati',
    group: 'Koperasi Nira Sejahtera',
    village: 'Serang',
    regency: 'Purbalingga',
    treesCount: 28,
    organicCertNo: 'CU-ID-ORG-849203',
  },
  {
    id: 'FARMER-04',
    code: 'PETANI-KRP-04',
    name: 'Pak Bambang Sutrisno',
    group: 'Kelompok Tani Sumber Manis',
    village: 'Karangpucung',
    regency: 'Cilacap',
    treesCount: 30,
    organicCertNo: 'CU-ID-ORG-849204',
  },
];

// ── State awal (dibuat sebagai fungsi agar tanggal relatif selalu segar) ─────

export interface DemoState {
  lots: LotItem[];
  packages: PackagingUnit[];
  inspections: QAInspection[];
  complaints: ComplaintRecord[];
  buyers: Buyer[];
  shipments: Shipment[];
  certificates: Certificate[];
  documents: BuyerDocument[];
}

const rawLot = (
  id: string,
  code: string,
  farmer: Farmer,
  gross: number,
  tare: number,
  status: LotStatus,
  createdAt: string,
  notes: string,
): LotItem => ({
  id,
  lotCode: code,
  type: 'RAW_ORGANIC',
  name: 'Gula Semut Mentah Organik',
  quantity: Number((gross - tare).toFixed(2)),
  unit: 'kg',
  status,
  createdAt,
  createdBy: 'Priya Kumar (Operator)',
  farmerId: farmer.id,
  farmerName: farmer.name,
  grossKg: gross,
  tareKg: tare,
  notes,
});

export function createInitialState(): DemoState {
  const [f1, f2, f3, f4] = INITIAL_FARMERS;

  const lots: LotItem[] = [
    // ── Bahan baku baru (siap diolah) ──
    rawLot('lot-raw-008', 'SPL-2026-008', f2, 40, 1.5, 'RECEIVED', stampDaysAgo(0, '09:40'),
      'Fisik: Kuning Kecoklatan · Aroma: Khas Karamel · Kadar Air: Normal (Sedang)'),
    rawLot('lot-raw-007', 'SPL-2026-007', f3, 46.5, 1.5, 'RECEIVED', stampDaysAgo(0, '08:15'),
      'Fisik: Kuning Kecoklatan · Aroma: Khas Karamel · Kadar Air: Sangat Kering (Garing)'),
    rawLot('lot-raw-006', 'SPL-2026-006', f4, 31.5, 1.5, 'RECEIVED', stampDaysAgo(1, '10:05'),
      'Fisik: Coklat Gelap · Aroma: Khas Karamel · Kadar Air: Tinggi (Basah/Menggumpal)'),

    // ── Lot olahan menunggu persetujuan mutu ──
    {
      id: 'lot-proc-003',
      lotCode: 'GSO-2026-003',
      type: 'PROCESSED',
      name: 'Gula Semut Organik (Setelah Oven)',
      quantity: 32,
      unit: 'kg',
      status: 'PENDING_RELEASE',
      createdAt: stampDaysAgo(1, '14:30'),
      createdBy: 'Priya Kumar (Operator)',
      inputLotIds: ['lot-raw-005'],
      inputQuantityKg: 35,
      yieldPercentage: 91.4,
      shrinkagePercentage: 8.6,
      notes: 'Oven rotary 3 jam, suhu 60°C. Menunggu uji kadar air.',
    },
    rawLot('lot-raw-005', 'SPL-2026-005', f1, 36.5, 1.5, 'PROCESSED', stampDaysAgo(2, '08:30'),
      'Fisik: Kuning Kecoklatan · Aroma: Khas Karamel · Kadar Air: Normal (Sedang)'),

    // ── Lot olahan gagal QA (dikarantina) ──
    {
      id: 'lot-proc-002',
      lotCode: 'GSO-2026-002',
      type: 'PROCESSED',
      name: 'Gula Semut Organik (Setelah Oven)',
      quantity: 81,
      unit: 'kg',
      status: 'QUARANTINED',
      createdAt: stampDaysAgo(5, '13:00'),
      createdBy: 'Priya Kumar (Operator)',
      inputLotIds: ['lot-raw-003', 'lot-raw-004'],
      inputQuantityKg: 95,
      yieldPercentage: 85.3,
      shrinkagePercentage: 14.7,
      moistureContent: 2.6,
      sucroseContent: 79.4,
      notes: 'Bahan baku masuk dalam kondisi lembap, oven harus diulang.',
      quarantineReason: 'Gagal uji mutu: kadar air 2.6% (maks 2.0%) & sukrosa 79.4% (min 80%).',
    },
    rawLot('lot-raw-004', 'SPL-2026-004', f4, 41.5, 1.5, 'PROCESSED', stampDaysAgo(6, '09:20'),
      'Fisik: Coklat Gelap · Aroma: Agak Asam / Fermentasi · Kadar Air: Tinggi (Basah/Menggumpal)'),
    rawLot('lot-raw-003', 'SPL-2026-003', f3, 56.5, 1.5, 'PROCESSED', stampDaysAgo(6, '08:10'),
      'Fisik: Coklat Kemerahan · Aroma: Khas Karamel · Kadar Air: Tinggi (Basah/Menggumpal)'),

    // ── Lot olahan lolos QA (sudah dirilis & sebagian dikemas) ──
    {
      id: 'lot-proc-001',
      lotCode: 'GSO-2026-001',
      type: 'PROCESSED',
      name: 'Gula Semut Organik (Setelah Oven)',
      quantity: 100,
      unit: 'kg',
      status: 'RELEASED',
      createdAt: stampDaysAgo(8, '13:30'),
      createdBy: 'Priya Kumar (Operator)',
      inputLotIds: ['lot-raw-001', 'lot-raw-002'],
      inputQuantityKg: 110,
      yieldPercentage: 90.9,
      shrinkagePercentage: 9.1,
      moistureContent: 1.7,
      sucroseContent: 85.2,
      notes: '110 kg masuk → 100 kg keluar. Susut 10 kg tercatat (pengeringan oven).',
      releaseApprovedBy: 'Arjun Rajan (Pemilik)',
      releaseApprovedAt: stampDaysAgo(8, '16:00'),
    },
    rawLot('lot-raw-002', 'SPL-2026-002', f2, 49.5, 1.5, 'PROCESSED', stampDaysAgo(9, '09:00'),
      'Fisik: Kuning Kecoklatan · Aroma: Khas Karamel · Kadar Air: Normal (Sedang)'),
    rawLot('lot-raw-001', 'SPL-2026-001', f1, 63.5, 1.5, 'PROCESSED', stampDaysAgo(9, '08:00'),
      'Fisik: Kuning Kecoklatan · Aroma: Khas Karamel · Kadar Air: Sangat Kering (Garing)'),
  ];

  const packages: PackagingUnit[] = [
    {
      id: 'pkg-003',
      packageCode: 'PACK-003',
      lotId: 'lot-proc-001',
      lotCode: 'GSO-2026-001',
      packageSize: 'Karung 5 kg',
      unitWeightKg: 5,
      unitName: 'karung',
      quantity: 4,
      totalKg: 20,
      serialNumber: 'PKG-2026-0003',
      qrStatus: 'ACTIVE',
      status: 'IN_STOCK',
      packedAt: stampDaysAgo(6, '10:30'),
      packedBy: 'Priya Kumar (Operator)',
    },
    {
      id: 'pkg-002',
      packageCode: 'PACK-002',
      lotId: 'lot-proc-001',
      lotCode: 'GSO-2026-001',
      packageSize: 'Pouch 1 kg',
      unitWeightKg: 1,
      unitName: 'pouch',
      quantity: 20,
      totalKg: 20,
      serialNumber: 'PKG-2026-0002',
      qrStatus: 'ACTIVE',
      status: 'SHIPPED',
      shipmentId: 'shp-001',
      packedAt: stampDaysAgo(7, '14:00'),
      packedBy: 'Priya Kumar (Operator)',
    },
    {
      id: 'pkg-001',
      packageCode: 'PACK-001',
      lotId: 'lot-proc-001',
      lotCode: 'GSO-2026-001',
      packageSize: 'Pouch 250 g',
      unitWeightKg: 0.25,
      unitName: 'pouch',
      quantity: 120,
      totalKg: 30,
      serialNumber: 'PKG-2026-0001',
      qrStatus: 'ACTIVE',
      status: 'SHIPPED',
      shipmentId: 'shp-001',
      packedAt: stampDaysAgo(7, '10:00'),
      packedBy: 'Priya Kumar (Operator)',
    },
  ];

  const buyers: Buyer[] = [
    {
      id: 'buyer-01',
      name: 'PT Nusantara Gula Makmur',
      pic: 'Bpk. Ahmad Fauzi',
      phone: '6281234567890',
      email: 'procurement@nusantaragula.co.id',
      type: 'Distributor Nasional',
      city: 'Jakarta',
      accessToken: 'NGM-7F3K2Q',
      createdAt: stampDaysAgo(30, '10:00'),
    },
    {
      id: 'buyer-02',
      name: 'CV Rasa Lokal Ekspor',
      pic: 'Ibu Sarah Wijaya',
      phone: '6289876543210',
      email: 'sarah@rasalokal.id',
      type: 'Eksportir',
      city: 'Surabaya',
      accessToken: 'RLE-9M4P1X',
      createdAt: stampDaysAgo(25, '10:00'),
    },
    {
      id: 'buyer-03',
      name: 'Toko Bahan Kue Jaya',
      pic: 'Ko Awie',
      phone: '6285551112222',
      type: 'Grosir Retail',
      city: 'Purwokerto',
      accessToken: 'TBJ-2H8D5W',
      createdAt: stampDaysAgo(20, '10:00'),
    },
  ];

  const shipments: Shipment[] = [
    {
      id: 'shp-001',
      shipmentCode: 'SJ-2026-001',
      buyerId: 'buyer-01',
      buyerName: 'PT Nusantara Gula Makmur',
      vehiclePlate: 'R 1234 AB',
      driverName: 'Pak Darto',
      packageIds: ['pkg-001', 'pkg-002'],
      totalKg: 50,
      shippedAt: stampDaysAgo(6, '15:00'),
      createdBy: 'Priya Kumar (Operator)',
      status: 'DELIVERED',
      deliveredAt: stampDaysAgo(5, '11:00'),
    },
  ];

  const inspections: QAInspection[] = [
    {
      id: 'insp-002',
      lotCode: 'GSO-2026-002',
      lotId: 'lot-proc-002',
      inspectorName: 'Arjun Rajan (Pemilik)',
      testDate: stampDaysAgo(5, '15:30'),
      moisture: 2.6,
      sucrose: 79.4,
      ashContent: 1.9,
      organolepticColor: 'Coklat Tua Agak Gelap',
      organolepticAroma: 'Sedikit Asam',
      microbialTest: 'PASSED',
      status: 'FAILED',
      notes: 'Kadar air dan sukrosa tidak memenuhi syarat. Lot ditahan untuk pengeringan ulang.',
    },
    {
      id: 'insp-001',
      lotCode: 'GSO-2026-001',
      lotId: 'lot-proc-001',
      inspectorName: 'Arjun Rajan (Pemilik)',
      testDate: stampDaysAgo(8, '15:45'),
      moisture: 1.7,
      sucrose: 85.2,
      ashContent: 1.6,
      organolepticColor: 'Coklat Muda Keemasan',
      organolepticAroma: 'Khas Karamel Nira',
      microbialTest: 'PASSED',
      status: 'PASSED',
      notes: 'Memenuhi seluruh parameter SNI 01-3743-1995 dan standar mutu pembeli.',
    },
  ];

  const complaints: ComplaintRecord[] = [
    {
      id: 'comp-001',
      caseCode: 'KMP-2026-001',
      source: 'BUYER',
      buyerName: 'PT Nusantara Gula Makmur',
      contact: 'Bpk. Ahmad Fauzi',
      relatedLotCode: 'GSO-2026-001',
      relatedPackageSerial: 'PKG-2026-0001',
      reportedDate: stampDaysAgo(2, '11:20'),
      issueType: 'Gumpalan/Caking',
      description:
        'Beberapa pouch 250 g ditemukan menggumpal halus di bagian dasar setelah 4 hari di gudang distributor.',
      status: 'INVESTIGATING',
      severity: 'SEDANG',
      assignedTo: 'Arjun Rajan (Pemilik)',
    },
  ];

  const certificates: Certificate[] = [
    {
      id: 'cert-01',
      name: 'Sertifikat Organik (EU Organic)',
      number: 'EU-ORG-ID-2025-0119',
      issuer: 'Control Union Certifications',
      issuedAt: dateFromNow(-320),
      expiresAt: dateFromNow(410),
      fileName: 'sertifikat-organik-eu.pdf',
    },
    {
      id: 'cert-02',
      name: 'Sertifikat SNI Gula Palma',
      number: 'SNI-01-3743-882',
      issuer: 'Badan Standardisasi Nasional',
      issuedAt: dateFromNow(-200),
      expiresAt: dateFromNow(890),
      fileName: 'sertifikat-sni.pdf',
    },
    {
      id: 'cert-03',
      name: 'Sertifikat Halal',
      number: 'ID33110000992',
      issuer: 'BPJPH Kementerian Agama',
      issuedAt: dateFromNow(-1420),
      expiresAt: dateFromNow(38),
      fileName: 'sertifikat-halal.pdf',
    },
    {
      id: 'cert-04',
      name: 'Izin PIRT',
      number: 'P-IRT 2063302010123-26',
      issuer: 'Dinas Kesehatan Kab. Banyumas',
      issuedAt: dateFromNow(-1830),
      expiresAt: dateFromNow(-12),
      fileName: 'izin-pirt.pdf',
    },
  ];

  const documents: BuyerDocument[] = [
    {
      id: 'doc-001',
      buyerId: 'buyer-01',
      docType: 'Tanda Terima Barang',
      fileName: 'tanda-terima-SJ-2026-001.pdf',
      sizeKb: 182,
      uploadedAt: stampDaysAgo(5, '11:30'),
    },
  ];

  return { lots, packages, inspections, complaints, buyers, shipments, certificates, documents };
}

// ── Sensor IoT (simulasi live, tidak dipersist) ──────────────────────────────

const buildHistory = (baseT: number, baseH: number): SensorReading[] => {
  const now = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000);
    const wave = Math.sin(i / 1.6);
    return {
      time: `${String(d.getHours()).padStart(2, '0')}:00`,
      temperature: Number((baseT + wave * 0.6).toFixed(1)),
      humidity: Number((baseH + wave * 1.4).toFixed(1)),
    };
  });
};

export function createInitialSensors(): SensorDevice[] {
  const offlineHistory = buildHistory(31, 38).map((r, i) =>
    i < 3 ? { ...r, temperature: null, humidity: null } : r,
  );
  return [
    {
      id: 'sens-01',
      deviceCode: 'ENV-GDG-01',
      location: 'Gudang Utama Banyumas',
      roomName: 'Ruang Penyimpanan Produk Jadi',
      zone: 'GUDANG_PRODUK',
      temperature: 24.3,
      humidity: 52.8,
      lastSeen: 'baru saja',
      status: 'ONLINE',
      history: buildHistory(24.3, 52.8),
    },
    {
      id: 'sens-02',
      deviceCode: 'ENV-GDG-02',
      location: 'Gudang Utama Banyumas',
      roomName: 'Ruang Penyimpanan Bahan Baku',
      zone: 'GUDANG_BAHAN',
      temperature: 26.1,
      humidity: 63.5,
      lastSeen: 'baru saja',
      status: 'ONLINE',
      history: buildHistory(26.1, 63.5),
    },
    {
      id: 'sens-03',
      deviceCode: 'ENV-PRC-03',
      location: 'Fasilitas Pengolahan Somagede',
      roomName: 'Ruang Pengayakan & Kristalisasi',
      zone: 'PRODUKSI',
      temperature: 27.6,
      humidity: 58.4,
      lastSeen: 'baru saja',
      status: 'ONLINE',
      history: buildHistory(27.6, 58.4),
    },
    {
      id: 'sens-04',
      deviceCode: 'ENV-OVN-04',
      location: 'Fasilitas Pengolahan Somagede',
      roomName: 'Ruang Pengeringan Oven Rotary',
      zone: 'PRODUKSI',
      temperature: null,
      humidity: null,
      lastSeen: '3 jam yang lalu',
      status: 'OFFLINE',
      history: offlineHistory,
    },
  ];
}
