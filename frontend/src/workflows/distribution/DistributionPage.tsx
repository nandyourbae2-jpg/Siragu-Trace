import { useState } from 'react';
import { useDemoData } from '../../context/DemoDataContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Truck, CheckCircle2, UserCheck, QrCode } from 'lucide-react';

export function DistributionPage() {
  const { packages } = useDemoData();
  const availablePackages = packages.filter(p => p.qrStatus === 'ACTIVE');
  
  const [buyer, setBuyer] = useState('PT Nusantara Gula Makmur');
  const [platNomor, setPlatNomor] = useState('B 1234 CD');
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleSerial = (serial: string) => {
    setSelectedSerials(prev => 
      prev.includes(serial) ? prev.filter(s => s !== serial) : [...prev, serial]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSerials.length === 0 || !buyer || !platNomor) return;

    // Simulate save
    setSelectedSerials([]);
    setPlatNomor('');
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Catat Pengiriman Fisik" 
        description="Muat kemasan gula ke truk ekspedisi, tautkan dengan profil mitra pembeli." 
      />

      {isSubmitted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 animate-fadeIn">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold">Surat Jalan (Dossier) Berhasil Dibuat!</h4>
            <p className="text-sm mt-1">Status {selectedSerials.length} kemasan telah diupdate menjadi DALAM PENGIRIMAN.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Kiri: Form Tujuan & Truk */}
        <div className="space-y-6">
          <div className="bg-white border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-100">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                <Truck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Tujuan & Ekspedisi</h2>
              </div>
            </div>

            <form id="dist-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Pilih Mitra Pembeli (B2B)</label>
                <div className="relative">
                  <UserCheck className="absolute left-4 top-4 text-slate-400" size={20} />
                  <select
                    value={buyer}
                    onChange={(e) => setBuyer(e.target.value)}
                    className="w-full p-4 pl-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-4 focus:ring-amber-100 focus:border-amber-500 font-bold text-lg"
                    required
                  >
                    <option>PT Nusantara Gula Makmur</option>
                    <option>CV Rasa Lokal Ekspor</option>
                    <option>Toko Bahan Kue Jaya</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Plat Nomor Truk / Kendaraan</label>
                <input
                  type="text"
                  value={platNomor}
                  onChange={(e) => setPlatNomor(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-4 focus:ring-amber-100 focus:border-amber-500 font-mono font-bold text-xl uppercase"
                  placeholder="AB 1234 CD"
                  required
                />
              </div>
            </form>
          </div>
        </div>

        {/* Kanan: Scan Kemasan */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <QrCode size={20} />
              </div>
              <h2 className="font-bold text-slate-800">Scan Kemasan yang Dimuat</h2>
            </div>
            <div className="text-sm font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              {selectedSerials.length} Dipilih
            </div>
          </div>

          {/* List Kemasan */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {availablePackages.map(pkg => (
              <label 
                key={pkg.id} 
                className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedSerials.includes(pkg.serialNumber) ? 'border-amber-500 bg-amber-50' : 'border-slate-100 bg-white hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                    checked={selectedSerials.includes(pkg.serialNumber)}
                    onChange={() => toggleSerial(pkg.serialNumber)}
                  />
                  <div>
                    <div className="font-mono font-bold text-slate-800">{pkg.serialNumber}</div>
                    <div className="text-xs text-slate-500">{pkg.packageSize} — Lot: {pkg.lotCode}</div>
                  </div>
                </div>
                <div className="font-black text-slate-800">{pkg.quantity}</div>
              </label>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              form="dist-form"
              type="submit"
              disabled={selectedSerials.length === 0}
              className="w-full px-8 py-4 bg-amber-500 text-white font-bold text-lg rounded-xl hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simpan & Kunci Truk Pengiriman
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
