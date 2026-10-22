import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/lib/api';
import { 
  CheckCircle2, 
  Truck, 
  MapPin, 
  Thermometer, 
  Droplets, 
  ShieldCheck, 
  Download, 
  Languages, 
  FileText,
  AlertTriangle,
  Box,
  Layers
} from 'lucide-react';

export function ShipmentPassportPage() {
  const params = useParams();
  const token = params.token || 'BOXDEMO0001';
  const [lang, setLang] = useState<'id' | 'en'>('id');

  const { data: shipmentData, isLoading } = useQuery({
    queryKey: ['publicShipmentPassport', token],
    queryFn: () => publicApi.getShipmentPassport(token),
    retry: 1,
  });

  // Fallback demo data
  const s = shipmentData || {
    token: token || 'BOXDEMO0001',
    shipmentNumber: 'SHP26-0001',
    boxCode: 'BOX-SHP26-0001-01',
    buyerName: 'PT Megah Rasa Pangan',
    destinationPort: 'Pusat Distribusi Retail Jakarta Timur',
    dispatchedAt: '2026-09-15T08:00:00.000Z',
    deliveredAt: undefined,
    status: 'SHIPPED',
    legs: [
      { seq: 1, from: 'Gudang Pabrik Somagede, Banyumas', to: 'Hub Logistik Distribusi Purwokerto', departAt: '2026-09-15T08:00:00.000Z', arriveAt: '2026-09-15T10:00:00.000Z' },
      { seq: 2, from: 'Hub Logistik Distribusi Purwokerto', to: 'Pusat Distribusi Retail Jakarta Timur', departAt: '2026-09-15T11:00:00.000Z', arriveAt: undefined },
    ],
    temperature: {
      status: 'OK',
      minC: 22.1,
      maxC: 24.8,
      avgC: 23.4,
      count: 192,
      deviationMinutes: 0,
      maxRhPct: 58.2,
      readings: [
        { ts: '08:00', tempC: 22.1, rhPct: 54.0, status: 'NORMAL' },
        { ts: '10:00', tempC: 22.8, rhPct: 55.2, status: 'NORMAL' },
        { ts: '12:00', tempC: 23.9, rhPct: 56.1, status: 'NORMAL' },
        { ts: '14:00', tempC: 24.5, rhPct: 58.0, status: 'NORMAL' },
        { ts: '16:00', tempC: 23.4, rhPct: 57.5, status: 'NORMAL' },
      ],
    },
    lots: [
      { batchNumber: 'B26-0912-07', variety: 'ORGANIC_COCONUT_SUGAR', grade: 'SUPER_A_PREMIUM', packageCount: 20, totalWeightKg: 5.0 },
    ],
    certificates: [
      { name: 'EU Organic Standar', number: 'CU-892182-EU', issuer: 'Control Union', status: 'ACTIVE' },
      { name: 'SNI Organik 6729', number: 'LS-012-SNI-ORG-882', issuer: 'INOFICE', status: 'ACTIVE' },
      { name: 'Sertifikat Halal', number: 'ID33110001892830224', issuer: 'BPJPH', status: 'ACTIVE' },
    ],
    pdfDownloadUrl: `/api/public/v1/shipments/${token}/pdf`,
  };

  const isEn = lang === 'en';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Memuat Paspor Pengiriman (Cold-Chain)...</h2>
        <p className="text-sm text-slate-500 mt-1">Mengambil log sensor telemetri perjalanan</p>
      </div>
    );
  }

  const isDeviation = s.temperature.status === 'DEVIATION';
  const isWarning = s.temperature.status === 'WARNING';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 max-w-xl mx-auto shadow-2xl relative border-x border-slate-200">
      
      {/* Top Floating Language Switcher */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={() => setLang(l => (l === 'id' ? 'en' : 'id'))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold hover:bg-white/30 transition shadow-sm border border-white/20"
        >
          <Languages size={14} />
          <span>{isEn ? 'ID' : 'EN'}</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#1B4D3E] via-[#143B30] to-[#0D2921] pt-10 pb-16 px-6 text-white rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
            <Truck size={14} />
            {isEn ? 'B2B Cold-Chain Passport' : 'Paspor Logistik & Suhu B2B'}
          </span>
          <h1 className="text-2xl font-black tracking-tight leading-snug">
            {s.boxCode}
          </h1>
          <p className="text-emerald-200/90 text-sm mt-1">
            {isEn ? `Shipment #${s.shipmentNumber} • Buyer: ${s.buyerName}` : `Pengiriman #${s.shipmentNumber} • Pembeli: ${s.buyerName}`}
          </p>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-20 space-y-6">

        {/* Cold-Chain Status Card */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {isEn ? 'Cold-Chain Status' : 'Status Rantai Dingin'}
              </span>
              <span className={`text-base font-black ${isDeviation ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-700'}`}>
                {s.temperature.status}
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isDeviation ? 'bg-red-100 text-red-800' : isWarning ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {isDeviation ? 'DEVIATION DETECTED' : isWarning ? 'WARNING SPIKE' : 'SAFE (20-26°C)'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center pt-3">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block">{isEn ? 'Min Temp' : 'Min'}</span>
              <span className="font-extrabold text-slate-800 text-xs">{s.temperature.minC}°C</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block">{isEn ? 'Avg Temp' : 'Rata-rata'}</span>
              <span className="font-extrabold text-emerald-700 text-xs">{s.temperature.avgC}°C</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block">{isEn ? 'Max Temp' : 'Maks'}</span>
              <span className="font-extrabold text-slate-800 text-xs">{s.temperature.maxC}°C</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block">{isEn ? 'Max RH' : 'Kelembaban'}</span>
              <span className="font-extrabold text-slate-800 text-xs">{s.temperature.maxRhPct ?? 58}%</span>
            </div>
          </div>
        </div>

        {/* Chain of Custody (Route Legs) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="text-emerald-600" size={18} />
            {isEn ? 'Chain of Custody & Route Legs' : 'Jejak Rute & Mata Rantai Perjalanan'}
          </h2>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {s.legs.map((leg: any, idx: number) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {leg.seq}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{leg.from} ➔ {leg.to}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {leg.departAt ? `Berangkat: ${leg.departAt.slice(0, 16).replace('T', ' ')}` : 'Transit'}
                    {leg.arriveAt ? ` • Tiba: ${leg.arriveAt.slice(0, 16).replace('T', ' ')}` : ' (Dalam perjalanan)'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contents Summary */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
            <Box className="text-emerald-600" size={18} />
            {isEn ? 'Box Contents & Lots' : 'Daftar Lot & Isi Box Ini'}
          </h2>

          <div className="space-y-2">
            {s.lots.map((lt: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-900">Batch {lt.batchNumber}</p>
                  <p className="text-[11px] text-slate-500">{lt.variety.replace(/_/g, ' ')} • Grade {lt.grade}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs text-emerald-800">{lt.packageCount} Unit</span>
                  <span className="block text-[10px] text-slate-400">Total {lt.totalWeightKg} kg</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Server-side PDF Download */}
        <section className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200/80 text-center">
          <FileText className="mx-auto text-emerald-700 mb-2" size={28} />
          <h3 className="text-sm font-bold text-slate-900">
            {isEn ? 'B2B Cold-Chain Dossier (PDF)' : 'Unduh Paspor Pengiriman (PDF)'}
          </h3>
          <p className="text-xs text-slate-600 mt-1 mb-4">
            {isEn ? 'Official export documentation stamped with SHA-256 digest.' : 'Dokumen kepatuhan logistik dan sensor IoT resmi berstempel digital.'}
          </p>

          <a
            href={publicApi.getShipmentPdfUrl(s.token)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#1B4D3E] hover:bg-[#143B30] text-white text-xs font-bold transition shadow-md shadow-emerald-900/10"
          >
            <Download size={16} />
            {isEn ? 'Download Shipment Dossier' : 'Unduh Berkas Resmi (PDF)'}
          </a>
        </section>

      </div>
    </div>
  );
}
