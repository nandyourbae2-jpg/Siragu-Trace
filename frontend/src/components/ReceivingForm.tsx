import React, { useState } from 'react';
import { Save, Scale, CheckCircle2 } from 'lucide-react';
import { useDemoData } from '../context/DemoDataContext';

export const ReceivingForm = () => {
  const { farmers, addReceivingLot } = useDemoData();

  const [farmerId, setFarmerId] = useState(farmers[0]?.id || '');
  const [bruto, setBruto] = useState('');
  const [tara, setTara] = useState('');
  
  const [warna, setWarna] = useState('Kuning Kecoklatan');
  const [wangi, setWangi] = useState('Khas Karamel');
  const [kadarAir, setKadarAir] = useState('Normal (Sedang)');
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdLotCode, setCreatedLotCode] = useState('');

  const brutoNum = parseFloat(bruto) || 0;
  const taraNum = parseFloat(tara) || 0;
  const netto = Math.max(0, brutoNum - taraNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId || netto <= 0) return;

    const newLot = addReceivingLot({
      farmerId,
      grossKg: brutoNum,
      tareKg: taraNum,
      createdBy: 'Petugas Timbangan',
      notes: `Fisik: ${warna} · Aroma: ${wangi} · Kadar Air: ${kadarAir}`,
    });

    setCreatedLotCode(newLot.lotCode);
    setBruto('');
    setTara('');
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <Scale size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Formulir Timbangan Bahan Baku</h2>
          <p className="text-sm text-slate-500">Pencatatan cepat pasokan gula mentah dari petani.</p>
        </div>
      </div>

      {isSubmitted && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900 animate-fadeIn">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold">Bahan Berhasil Disimpan!</h4>
            <p className="text-sm mt-1">Lot baru tercatat dengan kode: <strong className="font-mono bg-emerald-100 px-1 py-0.5 rounded">{createdLotCode}</strong>. Barang siap diolah.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Petani & Timbangan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 md:col-span-1">
            <label className="block text-sm font-bold text-slate-700">Pilih Pemasok / Petani</label>
            <select
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
              required
            >
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.group})</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Berat Kotor (Bruto)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={bruto}
                  onChange={(e) => setBruto(e.target.value)}
                  className="w-full p-3 pr-10 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-lg"
                  placeholder="0"
                  required
                />
                <span className="absolute right-3 top-3.5 text-sm font-bold text-slate-400">kg</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Berat Wadah (Tara)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={tara}
                  onChange={(e) => setTara(e.target.value)}
                  className="w-full p-3 pr-10 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-lg"
                  placeholder="0"
                  required
                />
                <span className="absolute right-3 top-3.5 text-sm font-bold text-slate-400">kg</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-blue-700">Berat Bersih (Netto)</label>
              <div className="relative">
                <input
                  type="text"
                  value={netto > 0 ? netto.toFixed(2) : '0'}
                  className="w-full p-3 pr-10 border-2 border-blue-200 rounded-xl bg-blue-50 text-blue-800 font-black text-xl"
                  disabled
                />
                <span className="absolute right-3 top-3.5 text-sm font-bold text-blue-400">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Kondisi Cepat */}
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="block text-sm font-bold text-slate-700 mb-4">Cek Kondisi Visual Awal</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={warna}
              onChange={(e) => setWarna(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm focus:border-blue-500 font-medium"
            >
              <option>Kuning Kecoklatan</option>
              <option>Coklat Gelap</option>
              <option>Coklat Kemerahan</option>
            </select>
            
            <select
              value={wangi}
              onChange={(e) => setWangi(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm focus:border-blue-500 font-medium"
            >
              <option>Khas Karamel</option>
              <option>Agak Asam / Fermentasi</option>
              <option>Gosong</option>
            </select>

            <select
              value={kadarAir}
              onChange={(e) => setKadarAir(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-700 text-sm focus:border-blue-500 font-medium"
            >
              <option>Sangat Kering (Garing)</option>
              <option>Normal (Sedang)</option>
              <option>Tinggi (Basah/Menggumpal)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={netto <= 0}
            className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={24} />
            Simpan Bahan Masuk
          </button>
        </div>
      </form>
    </div>
  );
};
