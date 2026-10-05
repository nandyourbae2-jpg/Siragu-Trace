import React, { useState } from 'react';
import { useSearchParams } from 'react-router';
import { TraceGraph } from '../components/TraceGraph';
import { useDemoData } from '../context/DemoDataContext';
import { 
  Search, 
  ArrowLeftRight, 
  ShieldCheck, 
  Calculator, 
  Calendar, 
  User, 
  FileCheck,
  CheckCircle2,
  ExternalLink,
  Layers
} from 'lucide-react';

export const TracePage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || 'PKG-P1-0001';

  const [query, setQuery] = useState(initialQuery);
  const [activeTraceCode, setActiveTraceCode] = useState(initialQuery);
  const [traceDirection, setTraceDirection] = useState<'BACKWARD' | 'FORWARD'>('BACKWARD');

  const { lots, packages, farmers } = useDemoData();

  const handleTrace = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setActiveTraceCode(query.trim());
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {/* Header & Quick Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Search className="text-primary" size={24} />
            Mesin Ketertelusuran Silsilah (Trace Engine)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Penelusuran pohon silsilah rantai pasok gula semut: Dari kemasan retail di tangan konsumen hingga penderes nira kelapa di kebun.
          </p>
        </div>

        <form onSubmit={handleTrace} className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kode Lot / Serial QR..." 
            className="px-3.5 py-2 border border-border rounded-lg text-xs bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-60 shadow-xs"
          />
          <button 
            type="submit" 
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Telusuri
          </button>
        </form>
      </div>

      {/* Kontrol Arah Penelusuran */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3.5 border border-border rounded-xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Target Penelusuran:</span>
          <span className="font-mono font-bold text-foreground px-2.5 py-1 bg-muted rounded-md">
            {activeTraceCode}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Metode Penelusuran:</span>
          <div className="flex rounded-lg border border-border p-0.5 bg-background">
            <button
              onClick={() => setTraceDirection('BACKWARD')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                traceDirection === 'BACKWARD'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Penelusuran Mundur (Backward)
            </button>
            <button
              onClick={() => setTraceDirection('FORWARD')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                traceDirection === 'FORWARD'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Penelusuran Maju (Forward)
            </button>
          </div>
        </div>
      </div>

      {/* Pohon Silsilah Visual Interaktif */}
      <TraceGraph selectedQuery={activeTraceCode} traceDirection={traceDirection} />

      {/* Rincian Audit Skenario 4 Jam */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Neraca Massa Batch */}
        <div className="bg-surface p-5 rounded-xl border border-border shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Validasi Neraca Massa</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Input Nira Kelapa (Total)</span>
              <strong className="text-foreground">1.150 Liter</strong>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Output Gula Kristal Mesh 18</span>
              <strong className="text-foreground">155 Kg</strong>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Kadar Air Uji Oven</span>
              <strong className="text-emerald-700">1.7% (Lulus SNI)</strong>
            </div>
            <div className="pt-2 border-t border-border flex justify-between font-bold text-emerald-800 text-xs">
              <span>Rendemen Efektif</span>
              <span>13.5% (Seimbang)</span>
            </div>
          </div>
        </div>

        {/* Rantai Integritas Petani Asal */}
        <div className="bg-surface p-5 rounded-xl border border-border shadow-xs col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-foreground">
                Integritas Petani Penderes & Sertifikasi Organik
              </h3>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              100% Terverifikasi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-2.5 rounded-l-md">Petani Penderes</th>
                  <th className="p-2.5">Kelompok Tani & Desa</th>
                  <th className="p-2.5">No. Sertifikat Organik</th>
                  <th className="p-2.5 rounded-r-md">Status Uji</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr className="hover:bg-muted/30">
                  <td className="p-2.5 font-bold text-foreground">Pak Slamet Riyadi</td>
                  <td className="p-2.5 text-muted-foreground">Kelompok Tani Nira Lestari (Somagede, Banyumas)</td>
                  <td className="p-2.5 font-mono text-emerald-800">CU-ID-ORG-849201</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      Lolos SNI & EU
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="p-2.5 font-bold text-foreground">Pak Sugeng Wahyudi</td>
                  <td className="p-2.5 text-muted-foreground">Kelompok Tani Nira Makmur (Kokap, Kulon Progo)</td>
                  <td className="p-2.5 font-mono text-emerald-800">CU-ID-ORG-849202</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      Lolos SNI & EU
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
