import { PageHeader } from '@/components/layout/PageHeader';
import { Thermometer, Droplets, Box, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useDemoData } from '../context/DemoDataContext';

export function WarehouseInspectionPage() {
  const { packages } = useDemoData();
  const totalStock = packages.length * 25; // Asumsi rata-rata 25kg
  const capacity = 5000; // 5000kg kapasitas maksimal
  const percentage = Math.min(100, Math.round((totalStock / capacity) * 100));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Kondisi Gudang (Storage)" 
        description="Pantau kapasitas penyimpanan dan kondisi lingkungan untuk menjaga kualitas gula semut." 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kapasitas */}
        <div className="bg-white p-6 border-2 border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Box size={24} />
            </div>
            <h3 className="font-bold text-slate-800">Kapasitas Gudang</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-black text-slate-800">{totalStock} <span className="text-sm font-medium text-slate-500">kg</span></span>
              <span className="text-sm font-bold text-blue-600">{percentage}% Penuh</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Suhu */}
        <div className="bg-white p-6 border-2 border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <Thermometer size={24} />
            </div>
            <h3 className="font-bold text-slate-800">Suhu Udara (Live)</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-slate-800">22.5°C</span>
            <span className="mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              <ShieldCheck size={12} /> Ideal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-3">Target ideal: 20 - 25°C</p>
        </div>

        {/* Kelembaban */}
        <div className="bg-white p-6 border-2 border-red-200 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500">
            <AlertTriangle size={64} />
          </div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <Droplets size={24} />
            </div>
            <h3 className="font-bold text-slate-800">Kelembaban (RH)</h3>
          </div>
          <div className="flex items-end gap-3 relative z-10">
            <span className="text-4xl font-black text-red-600">68%</span>
            <span className="mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
              <AlertTriangle size={12} /> Agak Tinggi
            </span>
          </div>
          <p className="text-xs text-red-500 mt-3 font-medium relative z-10">Peringatan: Gula rawan menggumpal ({'>'}65%)</p>
        </div>
      </div>
      
      {/* Visualisasi Denah Sederhana */}
      <div className="bg-slate-50 border-2 border-slate-200 p-8 rounded-2xl">
        <h3 className="font-bold text-slate-800 mb-6">Peta Zona Penempatan Gula</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-32 bg-emerald-100 border-2 border-emerald-300 rounded-xl flex flex-col items-center justify-center text-emerald-800 font-bold">
            Zona A (Organik)
            <span className="text-xs font-normal mt-1">Penuh</span>
          </div>
          <div className="h-32 bg-blue-100 border-2 border-blue-300 rounded-xl flex flex-col items-center justify-center text-blue-800 font-bold">
            Zona B (Organik)
            <span className="text-xs font-normal mt-1">Terisi Sebagian</span>
          </div>
          <div className="h-32 bg-slate-200 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 font-bold">
            Zona C
            <span className="text-xs font-normal mt-1">Kosong</span>
          </div>
          <div className="h-32 bg-slate-200 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 font-bold">
            Zona D (Transit)
            <span className="text-xs font-normal mt-1">Kosong</span>
          </div>
        </div>
      </div>
    </div>
  );
}
