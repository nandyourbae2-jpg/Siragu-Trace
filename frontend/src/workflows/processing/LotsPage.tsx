import { useState } from 'react';
import { useDemoData } from '../../context/DemoDataContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Factory, Calculator, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Lots() {
  const navigate = useNavigate();
  const { lots, addProcessingBatch } = useDemoData();
  
  const rawLots = lots.filter((l) => l.type === 'RAW_ORGANIC' && l.status === 'RECEIVED');
  const processedLots = lots.filter((l) => l.type === 'PROCESSED');

  const [selectedLots, setSelectedLots] = useState<string[]>([]);
  const [outputKg, setOutputKg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Kalkulator Susut
  const selectedRaw = rawLots.filter(l => selectedLots.includes(l.id));
  const totalInputKg = selectedRaw.reduce((acc, curr) => acc + curr.quantity, 0);
  const outKg = parseFloat(outputKg) || 0;
  
  const susutKg = totalInputKg - outKg;
  const susutPct = totalInputKg > 0 ? (susutKg / totalInputKg) * 100 : 0;

  const toggleLot = (id: string) => {
    setSelectedLots(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLots.length === 0 || outKg <= 0) return;

    addProcessingBatch({
      inputLotIds: selectedLots,
      outputQuantityKg: outKg,
      createdBy: 'Operator Produksi'
    });

    setSelectedLots([]);
    setOutputKg('');
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Olah & Hitung Susut" 
        description="Campur bahan mentah, olah di oven, dan catat hasil akhir untuk menghitung susut secara otomatis." 
      />

      {isSubmitted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 animate-fadeIn">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold">Proses Berhasil Dicatat!</h4>
            <p className="text-sm mt-1">Lot Gula Semut hasil oven siap untuk dikemas.</p>
          </div>
        </div>
      )}

      {/* Kalkulator Susut */}
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-indigo-100">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Calculator size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Kalkulator Susut / Olah</h2>
            <p className="text-sm text-slate-500">Pilih bahan baku dan masukkan berat akhir setelah di oven.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Kiri: Pilih Bahan */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">1. Pilih Bahan Baku yang Diolah</label>
              <div className="max-h-48 overflow-y-auto border-2 border-slate-200 rounded-xl bg-slate-50 p-2 space-y-2">
                {rawLots.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Tidak ada bahan baku siap olah.</p>
                ) : (
                  rawLots.map(lot => (
                    <label key={lot.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedLots.includes(lot.id)}
                        onChange={() => toggleLot(lot.id)}
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 text-sm">{lot.lotCode}</div>
                        <div className="text-xs text-slate-500">{lot.farmerName}</div>
                      </div>
                      <div className="font-black text-indigo-700">{lot.quantity} kg</div>
                    </label>
                  ))
                )}
              </div>
              <div className="text-sm font-bold text-slate-700 flex justify-between bg-slate-100 p-3 rounded-lg">
                <span>Total Berat Masuk:</span>
                <span className="text-indigo-700">{totalInputKg.toFixed(1)} kg</span>
              </div>
            </div>

            {/* Kanan: Hasil & Susut */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">2. Berat Keluar (Setelah Oven)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={outputKg}
                    onChange={(e) => setOutputKg(e.target.value)}
                    className="w-full p-4 pr-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-black text-2xl"
                    placeholder="0"
                    required
                  />
                  <span className="absolute right-4 top-4 text-lg font-bold text-slate-400">kg</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <label className="block text-sm font-bold text-indigo-800 mb-2">3. Kalkulasi Susut</label>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-indigo-600 font-medium">Susut Berat: {Math.max(0, susutKg).toFixed(1)} kg</div>
                    <div className="font-black text-4xl text-indigo-700">
                      {Math.max(0, susutPct).toFixed(1)}%
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={selectedLots.length === 0 || outKg <= 0 || outKg > totalInputKg}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Simpan Proses
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>

      {/* Histori Proses */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <Factory className="text-slate-500" size={20} />
          <h2 className="font-bold text-slate-800">Histori Gula Oven ({processedLots.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-wider font-bold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Kode Lot Olahan</th>
                <th className="px-6 py-4">Berat Jadi</th>
                <th className="px-6 py-4">Persentase Susut</th>
                <th className="px-6 py-4">Waktu Olah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedLots.map((lot) => (
                <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 text-xs">
                      {lot.lotCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-900 text-lg">{lot.quantity} <span className="text-sm font-bold text-slate-500">kg</span></span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${lot.yieldPercentage! > 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {lot.yieldPercentage}%
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{lot.yieldPercentage! > 10 ? 'Susut Tinggi' : 'Susut Normal'}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">
                    {lot.createdAt}
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
