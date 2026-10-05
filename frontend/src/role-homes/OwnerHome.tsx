import { useState } from 'react';
import { 
  Users, 
  Package, 
  TrendingUp, 
  RefreshCw,
  ArrowRight,
  ClipboardCheck,
  Scale,
  Factory
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useDemoData } from '../context/DemoDataContext';
import { PageHeader } from '@/components/layout/PageHeader';

export const OwnerHome = () => {
  const navigate = useNavigate();
  const { lots, packages, resetDemoData } = useDemoData();
  const [searchQuery, setSearchQuery] = useState('');

  // Perhitungan metrik efisiensi
  const rawLots = lots.filter(l => l.type === 'RAW_ORGANIC');
  const processedLots = lots.filter(l => l.type === 'PROCESSED');
  const totalKemasan = packages.reduce((acc, p) => acc + p.quantity, 0);
  
  // Hitung rata-rata susut (Yield/Susut dari lot olahan)
  const averageSusut = processedLots.length > 0 
    ? (processedLots.reduce((acc, l) => acc + (l.yieldPercentage || 0), 0) / processedLots.length).toFixed(1)
    : '0';

  const kpis = [
    { 
      label: 'Stok Bahan Baku (Nira/Gula Mentah)', 
      value: rawLots.length, 
      sub: 'Lot belum diolah', 
      icon: Scale, 
      color: 'text-blue-600 bg-blue-50', 
      route: '/app/lots' 
    },
    { 
      label: 'Gula Oven Siap Kemas', 
      value: processedLots.length, 
      sub: `Rata-rata Susut: ${averageSusut}%`, 
      icon: Factory, 
      color: 'text-indigo-600 bg-indigo-50', 
      route: '/app/lots' 
    },
    { 
      label: 'Total Kemasan Jadi', 
      value: totalKemasan, 
      sub: `${packages.length} Sesi Pengemasan`, 
      icon: Package, 
      color: 'text-emerald-600 bg-emerald-50', 
      route: '/app/operations/packaging' 
    },
    { 
      label: 'Mitra Pembeli Aktif', 
      value: 3, 
      sub: 'Akses Dossier Aktif', 
      icon: Users, 
      color: 'text-amber-600 bg-amber-50', 
      route: '/app/buyers' 
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <PageHeader 
            title="Beranda Efisiensi Bisnis" 
            description="Pantau langsung performa produksi, angka susut, dan kelola hubungan mitra B2B Anda." 
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto mt-[-1rem]">
          <button 
            type="button"
            onClick={resetDemoData}
            title="Reset Data Demo"
            className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold cursor-pointer"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Reset Data Uji Coba</span>
          </button>
        </div>
      </div>

      {/* 1. Indikator Kunci (KPI Interaktif) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              onClick={() => navigate(kpi.route)}
              className="bg-white p-6 border-2 border-slate-200 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${kpi.color} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-sm font-bold text-slate-500">{kpi.label}</h3>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-black text-slate-800">{kpi.value}</span>
                <p className="text-sm font-medium text-slate-500 mt-1">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Menu Pintasan Utama Khusus Owner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* CRM Pembeli */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute -right-8 -top-8 text-blue-500 opacity-20">
            <Users size={160} />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-2">Portal CRM Pembeli (B2B)</h2>
            <p className="text-blue-100 mb-6 max-w-sm">Buat dan kirimkan tautan rahasia ke mitra pembeli Anda untuk mengakses riwayat kualitas pesanan tanpa perlu login.</p>
            <button 
              onClick={() => navigate('/app/buyers')}
              className="px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-md w-max"
            >
              Kelola Akses Pembeli
            </button>
          </div>
        </div>

        {/* Cek Rapor Pemasok */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <ClipboardCheck size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">Rapor Petani/Pemasok</h2>
            <p className="text-slate-500 mb-6 max-w-sm">Pantau statistik susut bahan dari masing-masing pemasok untuk memastikan efisiensi bahan baku (Tahap Pengembangan).</p>
            <button 
              onClick={() => navigate('/app/reports/suppliers')}
              className="text-emerald-600 font-bold flex items-center gap-2 hover:text-emerald-700"
            >
              Lihat Analitik Susut <ArrowRight size={18} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
