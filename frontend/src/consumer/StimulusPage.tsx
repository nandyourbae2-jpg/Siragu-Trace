import { useState } from 'react';
import { Link } from 'react-router';
import { 
  CheckCircle2, 
  MapPin, 
  Leaf, 
  ShieldCheck, 
  Thermometer, 
  Award, 
  FileText, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export function StimulusPage({ mode }: { mode: 'low' | 'high' }) {
  const isHigh = mode === 'high';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 max-w-md mx-auto shadow-2xl relative border-x border-slate-200">
      
      {/* Stimulus Indicator Banner */}
      <div className={`p-2 text-center text-xs font-bold text-white ${isHigh ? 'bg-indigo-600' : 'bg-slate-700'}`}>
        {isHigh ? 'RESEARCH STIMULUS: HIGH TRANSPARENCY & IOT' : 'RESEARCH STIMULUS: BASELINE / LOW TRANSPARENCY'}
      </div>

      {/* Header Banner */}
      <div className={`pt-8 pb-16 px-6 text-white rounded-b-[2rem] shadow-xl relative overflow-hidden ${isHigh ? 'bg-gradient-to-br from-[#1B4D3E] via-[#143B30] to-[#0D2921]' : 'bg-slate-800'}`}>
        <h1 className="text-2xl font-black">Gula Semut Organik</h1>
        <p className="text-sm opacity-90 mt-1">Koperasi Nira Lestari Banyumas</p>
      </div>

      <div className="px-5 -mt-8 relative z-20 space-y-5">
        
        {/* Lot Identity */}
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs text-slate-400 font-bold uppercase">Batch Number</span>
            <span className="font-mono font-bold text-slate-900">B26-0912-07</span>
          </div>
          <div className="pt-3 text-xs text-slate-600 space-y-1">
            <p><strong>Netto:</strong> 250g</p>
            <p><strong>Grade:</strong> Super A Premium</p>
            <p><strong>Kedaluwarsa:</strong> 14 September 2028</p>
          </div>
        </div>

        {/* High stimulus adds rich farmer stories & lab parameters */}
        {isHigh ? (
          <>
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="text-emerald-600" size={18} />
                Asal-Usul Petani Penderes (Banyumas)
              </h2>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <p className="font-bold text-slate-900">Pak Slamet Riyadi (Kelompok Nira Murni)</p>
                  <p className="text-slate-500 text-[11px]">Desa Somagede • 45 Pohon Kelapa • Lolos Sertifikasi EU Organic</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <p className="font-bold text-slate-900">Pak Sutrisno (Kelompok Makmur Berkah)</p>
                  <p className="text-slate-500 text-[11px]">Desa Kemawi • 38 Pohon Kelapa • Lolos Sertifikasi EU Organic</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={18} />
                Hasil Uji SNI 3743:2021 & Bukti Lab
              </h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Kadar Air</span>
                  <span className="font-bold text-emerald-700">1.82% (Maks 3.0%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Bagian Tak Larut Air</span>
                  <span className="font-bold text-emerald-700">0.12% (Maks 0.2%)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Keseragaman Butir Mesh 16</span>
                  <span className="font-bold text-emerald-700">98.5% Lolos</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <Thermometer className="text-emerald-600" size={18} />
                Sensor Suhu & Cold-Chain IoT
              </h2>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs flex justify-between items-center">
                <span>Rata-rata Suhu Transit: <strong>23.4°C</strong> (Aman 20-26°C)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold text-[10px]">VERIFIED</span>
              </div>
            </section>
          </>
        ) : (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-xs text-slate-500">
            <p>Informasi dasar produk: Diproduksi di Jawa Tengah, Indonesia. Menggunakan nira kelapa lokal.</p>
          </section>
        )}

        <div className="text-center pt-2">
          <Link to="/v/DEMOPASSPORT" className="text-xs text-emerald-700 font-bold hover:underline">
            Lihat Paspor Produksi Standar ➔
          </Link>
        </div>

      </div>
    </div>
  );
}
