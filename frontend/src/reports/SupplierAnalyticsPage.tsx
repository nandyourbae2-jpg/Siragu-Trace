import { PageHeader } from '@/components/layout/PageHeader';
import { useDemoData } from '../context/DemoDataContext';
import { ClipboardCheck, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

export function SupplierAnalyticsPage() {
  const { farmers, lots } = useDemoData();

  // Hitung agregat simpel per petani (Mocked Logic)
  // Di dunia nyata, relasi antara bahan mentah (RAW) -> proses olahan (PROCESSED) ditelusuri lewat inputLotIds.
  // Untuk demo, kita beri angka statis yang mendekati logika, ditambah indikator.
  
  const reportData = farmers.map(farmer => {
    // Cari semua bahan mentah dari petani ini
    const rawLots = lots.filter(l => l.farmerId === farmer.id && l.type === 'RAW_ORGANIC');
    const totalSetor = rawLots.reduce((acc, curr) => acc + curr.quantity, 0);

    // Simulasi Persentase Susut (antara 5% - 15%)
    // Jika Bpk. Bejo, kita set susutnya agak tinggi untuk demo
    const baseSusut = farmer.name.includes('Bejo') ? 14.5 : (farmer.name.includes('Siti') ? 7.2 : 9.8);
    
    return {
      ...farmer,
      totalSetor,
      avgSusut: baseSusut,
      status: baseSusut > 10 ? 'BURUK' : (baseSusut < 8 ? 'SANGAT BAIK' : 'NORMAL')
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Buku Rapor Rantai Pasok" 
        description="Pantau kualitas bahan baku dari masing-masing petani berdasarkan tingkat susut selama pengolahan oven." 
      />

      {/* Rangkuman Rapor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="text-emerald-600" />
            <h3 className="font-bold text-emerald-800">Pemasok Terbaik</h3>
          </div>
          <p className="text-3xl font-black text-emerald-700">Ibu Siti</p>
          <p className="text-sm font-medium text-emerald-600 mt-1">Rata-rata Susut 7.2%</p>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-red-600" />
            <h3 className="font-bold text-red-800">Perlu Dievaluasi</h3>
          </div>
          <p className="text-3xl font-black text-red-700">Bpk. Bejo</p>
          <p className="text-sm font-medium text-red-600 mt-1">Rata-rata Susut 14.5%</p>
        </div>

        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="text-slate-600" />
            <h3 className="font-bold text-slate-800">Rata-rata Global</h3>
          </div>
          <p className="text-3xl font-black text-slate-700">10.5%</p>
          <p className="text-sm font-medium text-slate-500 mt-1">Batas Wajar Industri: 10%</p>
        </div>
      </div>

      {/* Tabel Detail Rapor */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="text-slate-500" size={20} />
            <h2 className="font-bold text-slate-800">Tabel Rapor Petani / Pemasok</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-wider font-bold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Petani</th>
                <th className="px-6 py-4">Total Setoran Bahan</th>
                <th className="px-6 py-4">Rata-rata Susut (Setelah Oven)</th>
                <th className="px-6 py-4">Kesimpulan Kualitas</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((data) => (
                <tr key={data.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-base">{data.name}</div>
                    <div className="text-xs text-slate-500">{data.group}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-700 text-lg">{data.totalSetor}</span>
                    <span className="text-xs font-bold text-slate-400 ml-1">kg</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-black text-xl ${
                      data.status === 'BURUK' ? 'text-red-600' : (data.status === 'SANGAT BAIK' ? 'text-emerald-600' : 'text-amber-500')
                    }`}>
                      {data.avgSusut}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {data.status === 'BURUK' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                        <AlertTriangle size={14} /> Kualitas Rendah (Air Tinggi)
                      </span>
                    )}
                    {data.status === 'SANGAT BAIK' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                        Kualitas Prima
                      </span>
                    )}
                    {data.status === 'NORMAL' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                        Standar Normal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 font-bold hover:text-blue-800 transition-colors cursor-pointer text-xs">
                      Detail Pengiriman
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
