import { useState } from 'react';
import { QrCardItem, type QrItemProps } from './QrCardItem';
import { QrCode, Download, ExternalLink, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

export const QR_ITEMS_DATA: QrItemProps[] = [
  {
    id: 'DEMOPASSPORT',
    title: 'Paspor Konsumen Lot (Mobile-First QR)',
    code: 'SGU-B26-0912-07-0001',
    category: 'Kemasan Ritel (Pouch 250g)',
    url: typeof window !== 'undefined' ? `${window.location.origin}/v/DEMOPASSPORT` : 'https://siragu-trace.vercel.app/v/DEMOPASSPORT',
    badgeType: 'consumer',
    summary: 'QR Code kemasan ritel untuk konsumen akhir yang memverifikasi asal nira, profil kelompok tani Banyumas, sertifikasi organik, dan uji mutu SNI 3743:2021.',
    printableMeta: [
      '• Lot: B26-0912-07 | Netto: 250g Super A',
      '• Petani: Somagede Banyumas (3 Penderes)',
      '• Mutu: Kadar Air 1.82% (Lolos SNI 3743)',
      '• Legal: BPOM MD • Halal • EU Organic',
      '• Verifikasi: Asal-Usul Rantai Pasok Terbukti'
    ],
    details: [
      {
        section: '1. Identitas Batch & Kemasan',
        points: [
          'Nomor Lot: B26-0912-07 | Serial: SGU-B26-0912-07-0001',
          'Netto: 250g (Pouch Ritel Alumunium Foil)',
          'Grade Mutu: Super A Premium Butiran Kristal Emas',
          'Tanggal Olah: 12 September 2026 | Kedaluwarsa: 14 September 2028'
        ]
      },
      {
        section: '2. Asal-Usul Petani Penderes (Banyumas)',
        points: [
          'Pak Slamet Riyadi (Kelompok Nira Murni, Desa Somagede) — 45 Pohon Kelapa',
          'Pak Sutrisno (Kelompok Makmur Berkah, Desa Kemawi) — 38 Pohon Kelapa',
          'Ibu Warsinah (Kelompok Srikandi Nira, Desa Tanggeran) — 30 Pohon Kelapa'
        ]
      },
      {
        section: '3. Hasil Uji Mutu Laboratorium (SNI 3743:2021)',
        points: [
          'Kadar Air: 1.82% (Batas Maksimal SNI: 3.0%) — LOLOS',
          'Lolos Ayakan Mesh 16: 98.5% (Batas Minimal SNI: 95.0%) — LOLOS',
          'Kadar Abu: 1.4% (Batas Maksimal SNI: 2.0%) — LOLOS',
          'Cemaran Logam: Bebas Pb, Cd, dan As (Food Grade Safe)'
        ]
      },
      {
        section: '4. Legalitas & Sertifikasi Resmi',
        points: [
          'Sertifikat Halal BPJPH Kemenag RI: ID33110001892830224',
          'Sertifikat Organik SNI (INOFICE): LS-012-SNI-ORG-882',
          'Sertifikat Organik Uni Eropa: Control Union CU-892182-EU',
          'Izin Edar BPOM RI: MD 252111001234'
        ]
      },
      {
        section: '5. Telemetri Sensor Lingkungan',
        points: [
          'Suhu Penyimpanan: 22.98°C Rata-rata (Standar Gudang Kering)',
          'Kelembaban Relatif (RH): 55.4% (Mencegah gula menggumpal)'
        ]
      }
    ]
  },
  {
    id: 'BOXDEMO0001',
    title: 'Paspor Pengiriman B2B & Cold-Chain IoT',
    code: 'BOX-SHP26-0001-01',
    category: 'Master Box Ekspor & Logistik',
    url: typeof window !== 'undefined' ? `${window.location.origin}/s/BOXDEMO0001` : 'https://siragu-trace.vercel.app/s/BOXDEMO0001',
    badgeType: 'b2b',
    summary: 'QR Code master box pengiriman B2B untuk importir, distributor, dan buyer yang memverifikasi integritas suhu transit dan rantai dingin logistik.',
    printableMeta: [
      '• Surat Jalan: SHP26-0001 | Box #01',
      '• Buyer: PT Megah Rasa Pangan',
      '• Rute: Somagede -> Hub Pwt -> DC Jakarta',
      '• Sensor IoT: 23.4°C Avg • 0 Menit Deviasi',
      '• Status: Rantai Dingin & Higienitas Terjaga'
    ],
    details: [
      {
        section: '1. Dokumen Pengiriman & Pembeli',
        points: [
          'Nomor Surat Jalan: SHP26-0001',
          'Kode Master Box: BOX-SHP26-0001-01',
          'Pembeli (Buyer): PT Megah Rasa Pangan',
          'Pelabuhan/Tujuan: Pusat Distribusi Retail Jakarta Timur'
        ]
      },
      {
        section: '2. Chain of Custody (Rantai Kepemilikan Logistik)',
        points: [
          'Titik 1: Gudang Sentra Pabrik Somagede, Banyumas (Berangkat 08:00 WIB)',
          'Titik 2: Hub Logistik Distribusi Purwokerto (Tiba 10:00 WIB)',
          'Titik 3: Pusat Distribusi Retail Jakarta Timur (Transit Ekspedisi)'
        ]
      },
      {
        section: '3. Sensor IoT Transit Real-Time',
        points: [
          'Status Rantai Dingin: OK / Normal',
          'Suhu Rata-rata Transit: 23.4°C (Rentang: 22.1°C – 24.8°C)',
          'Deviasi Suhu: 0 Menit (Tidak Ada Pelanggaran Batas Suhu Kritis)',
          'Kelembaban Maksimum: 58.2% RH (Higienis dan Kering)'
        ]
      }
    ]
  },
  {
    id: 'STIMULUS_HIGH',
    title: 'Halaman Stimulus Evaluasi Riset B2B (High Transparency)',
    code: 'STIMULUS-HIGH',
    category: 'Instrumen Riset BPC (Transparansi Penuh)',
    url: typeof window !== 'undefined' ? `${window.location.origin}/stimulus/high` : 'https://siragu-trace.vercel.app/stimulus/high',
    badgeType: 'stimulus_high',
    summary: 'QR Code instrumen stimulus penelitian transparansi penuh dengan profil petani, sensor IoT live, dan verifikasi sertifikat untuk menguji kesediaan membayar pembeli.',
    printableMeta: [
      '• Model: Transparansi Rantai Pasok Penuh',
      '• Fitur: GPS Kebun • Uji Lab • IoT Sensor',
      '• Kasus: Gula Semut Banyumas Ekspor',
      '• Target: Riset Kepercayaan & Willingness-To-Pay',
      '• Status: Instrumen Evaluasi Riset BPC'
    ],
    details: [
      {
        section: '1. Fitur Transparansi Lengkap',
        points: [
          'Peta GPS & profil kelompok tani penderes Banyumas',
          'Parameter uji laboratorium fisik & kimia terperinci',
          'Verifikasi sertifikat legalitas (Halal, SNI Organik, EU Organic, BPOM)',
          'Riwayat log suhu oven kristalisasi & gudang simpan'
        ]
      },
      {
        section: '2. Penerapan dalam Riset BPC',
        points: [
          'Menguji hipotesis peningkatan kesediaan membayar (WTP) buyer',
          'Membuktikan kesiapan platform terhadap regulasi ekspor EUDR'
        ]
      }
    ]
  },
  {
    id: 'STIMULUS_LOW',
    title: 'Halaman Stimulus Evaluasi Riset B2B (Baseline / Low)',
    code: 'STIMULUS-LOW',
    category: 'Instrumen Riset BPC (Baseline Kontrol)',
    url: typeof window !== 'undefined' ? `${window.location.origin}/stimulus/low` : 'https://siragu-trace.vercel.app/stimulus/low',
    badgeType: 'stimulus_low',
    summary: 'QR Code pembanding baseline tanpa data ketertelusuran granular untuk kelompok kontrol dalam survei preferensi dan kepercayaan pembeli.',
    printableMeta: [
      '• Model: Baseline Tradisional (Kontrol)',
      '• Fitur: Label Informasi Standar',
      '• Komparasi: Tanpa Bukti Rantai Pasok Digital',
      '• Target: Pengukuran Baseline Minat Beli',
      '• Status: Instrumen Kontrol Riset BPC'
    ],
    details: [
      {
        section: '1. Karakteristik Baseline',
        points: [
          'Hanya menampilkan klaim organik umum tanpa bukti sumber nira',
          'Tanpa informasi kelompok petani penderes',
          'Tanpa telemetri sensor cold-chain IoT'
        ]
      },
      {
        section: '2. Fungsi Analisis Perbandingan',
        points: [
          'Sebagai titik acuan kontrol untuk mengukur selisih persepsi nilai pembeli',
          'Membuktikan efektivitas solusi SIRAGU Trace dibandingkan label konvensional'
        ]
      }
    ]
  }
];

export function QrKitSection() {
  const [filter, setFilter] = useState<'all' | 'consumer' | 'b2b' | 'stimulus'>('all');

  const filteredItems = QR_ITEMS_DATA.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'consumer') return item.badgeType === 'consumer';
    if (filter === 'b2b') return item.badgeType === 'b2b';
    if (filter === 'stimulus') return item.badgeType === 'stimulus_high' || item.badgeType === 'stimulus_low';
    return true;
  });

  return (
    <section id="qr-kit" className="py-20 px-6 bg-slate-100/70 border-t border-slate-200">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider mb-4 text-emerald-800">
            <QrCode size={14} className="text-emerald-700" />
            Paket Unduhan QR Resmi SIRAGU Trace
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Unduh QR Code & Stiker Sampel Siap Scan
          </h2>
          <p className="text-sm md:text-base text-slate-600 mt-4 leading-relaxed">
            Dapatkan file QR Code resolusi tinggi untuk slide presentasi BPC, atau unduh <strong>kartu stiker label siap cetak</strong> untuk ditempelkan langsung pada sampel produk gula semut organik.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Semua QR Code ({QR_ITEMS_DATA.length})
            </button>
            <button
              onClick={() => setFilter('consumer')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                filter === 'consumer'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              🌿 Paspor Konsumen (Ritel)
            </button>
            <button
              onClick={() => setFilter('b2b')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                filter === 'b2b'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              📦 Paspor Pengiriman B2B & IoT
            </button>
            <button
              onClick={() => setFilter('stimulus')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                filter === 'stimulus'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              ✨ Stimulus Riset BPC
            </button>
          </div>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredItems.map((item) => (
            <QrCardItem key={item.id} item={item} />
          ))}
        </div>

        {/* Bottom Helper Card */}
        <div className="mt-14 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-slate-900 text-base flex items-center justify-center md:justify-start gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Semua QR Code Telah Terhubung ke Domain Live Vercel
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              QR code di atas dapat langsung dipindai menggunakan kamera bawaan ponsel (iPhone / Android) tanpa aplikasi khusus. Seluruh data petani penderes, uji mutu SNI, dan sensor IoT akan ditampilkan secara instan.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href="/offline-passport.html"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <ExternalLink size={14} /> Buka Cadangan Offline
            </a>
            <a
              href="#qr-kit"
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-[#0075DE] hover:bg-blue-600 text-white text-xs font-bold transition shadow-sm"
            >
              Cetak Halaman Ini
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
