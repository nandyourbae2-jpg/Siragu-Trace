import { useNavigate } from 'react-router';
import { Package, Zap, ClipboardCheck, Truck, ArrowRight, Scale, Factory, QrCode } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

export const OperatorHome = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Papan Tugas Harian" 
        description="Fokus, teliti, dan pastikan setiap timbangan tercatat dengan benar." 
      />

      {/* Quick Stats (Ringkasan Shift) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-blue-50/50 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-medium text-blue-600 mb-1">Bahan Masuk Hari Ini</span>
          <span className="text-3xl font-black text-blue-700">145 <span className="text-lg font-bold">kg</span></span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-indigo-50/50 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-medium text-indigo-600 mb-1">Sedang Diolah</span>
          <span className="text-3xl font-black text-indigo-700">2 <span className="text-lg font-bold">Lot</span></span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-emerald-50/50 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-medium text-emerald-600 mb-1">Selesai Dikemas</span>
          <span className="text-3xl font-black text-emerald-700">240 <span className="text-lg font-bold">Pouch</span></span>
        </div>
      </div>

      {/* Main Action Buttons (Big and Easy to Tap) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <button 
          onClick={() => navigate('/app/operations/receiving')}
          className="p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all text-left flex items-start gap-5 group cursor-pointer active:scale-95"
        >
          <div className="p-4 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Scale size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Terima Bahan Baku</h3>
            <p className="text-sm text-slate-500 mt-1">Timbang pasokan gula mentah/nira, catat bruto & tara.</p>
          </div>
          <div className="self-center bg-slate-100 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
            <ArrowRight className="text-slate-400 group-hover:text-blue-600 transition-colors" size={20} />
          </div>
        </button>

        <button 
          onClick={() => navigate('/app/lots')}
          className="p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-indigo-500 hover:shadow-lg transition-all text-left flex items-start gap-5 group cursor-pointer active:scale-95"
        >
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Factory size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">Olah & Hitung Susut</h3>
            <p className="text-sm text-slate-500 mt-1">Campur bahan, masak, dan gunakan kalkulator susut otomatis.</p>
          </div>
          <div className="self-center bg-slate-100 p-2 rounded-full group-hover:bg-indigo-100 transition-colors">
            <ArrowRight className="text-slate-400 group-hover:text-indigo-600 transition-colors" size={20} />
          </div>
        </button>

        <button 
          onClick={() => navigate('/app/operations/packaging')}
          className="p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-emerald-500 hover:shadow-lg transition-all text-left flex items-start gap-5 group cursor-pointer active:scale-95"
        >
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <QrCode size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">Siapkan Kemasan</h3>
            <p className="text-sm text-slate-500 mt-1">Pecah lot gula jadi ke pouch/karung, cetak stiker label QR.</p>
          </div>
          <div className="self-center bg-slate-100 p-2 rounded-full group-hover:bg-emerald-100 transition-colors">
            <ArrowRight className="text-slate-400 group-hover:text-emerald-600 transition-colors" size={20} />
          </div>
        </button>

        <button 
          onClick={() => navigate('/app/distribution')}
          className="p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-amber-500 hover:shadow-lg transition-all text-left flex items-start gap-5 group cursor-pointer active:scale-95"
        >
          <div className="p-4 bg-amber-100 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Truck size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 group-hover:text-amber-700 transition-colors">Catat Pengiriman Fisik</h3>
            <p className="text-sm text-slate-500 mt-1">Catat pemuatan barang ke truk ekspedisi untuk pembeli.</p>
          </div>
          <div className="self-center bg-slate-100 p-2 rounded-full group-hover:bg-amber-100 transition-colors">
            <ArrowRight className="text-slate-400 group-hover:text-amber-600 transition-colors" size={20} />
          </div>
        </button>

      </div>
    </div>
  );
};
