import { useState } from 'react';
import { useDemoData } from '../../context/DemoDataContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { QrCode, Download, CheckCircle2, Box } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function PackagingPage() {
  const { lots, packages, createPackagingRun } = useDemoData();
  
  // Hanya lot yang sudah diproses & dirilis yang bisa dikemas
  const readyLots = lots.filter(l => l.type === 'PROCESSED' && l.status === 'RELEASED');

  const [lotId, setLotId] = useState(readyLots[0]?.id || '');
  const [packageSize, setPackageSize] = useState('25kg (Karung)');
  const [quantity, setQuantity] = useState('10');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastPrintedQR, setLastPrintedQR] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(quantity) || 0;
    if (!lotId || qtyNum <= 0) return;

    const sizeOpt = packageSize.includes('25kg')
      ? { label: 'Karung 25 kg', kg: 25, unitName: 'karung' }
      : { label: 'Pouch 5 kg', kg: 5, unitName: 'pouch' };

    const pkg = createPackagingRun({
      lotId,
      size: sizeOpt,
      quantity: qtyNum,
      packedBy: 'Operator Lapangan'
    });

    setLastPrintedQR(pkg.serialNumber);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const selectedLot = lots.find(l => l.id === lotId);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Siapkan Kemasan & Cetak Label" 
        description="Pecah lot gula hasil oven ke dalam kemasan standar (5kg/25kg) dan cetak stiker QR ketertelusuran." 
      />

      {isSubmitted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 animate-fadeIn">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold">Kemasan Berhasil Disimpan & Label Siap Dicetak!</h4>
            <p className="text-sm mt-1">Sistem menghasilkan nomor seri: <strong className="font-mono bg-emerald-100 px-1 py-0.5 rounded">{lastPrintedQR}</strong>.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-2 bg-white border-2 border-emerald-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-100">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Box size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Pemecahan Lot ke Kemasan</h2>
              <p className="text-sm text-slate-500">Pilih gula yang sudah jadi dan masukkan jumlah kemasan.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">1. Pilih Gula Semut (Lot Olahan)</label>
              <select
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                className="w-full p-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-medium"
                required
              >
                {readyLots.length === 0 && <option value="">Tidak ada lot siap kemas</option>}
                {readyLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.lotCode} — Stok: {lot.quantity} {lot.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">2. Ukuran Kemasan</label>
                <select
                  value={packageSize}
                  onChange={(e) => setPackageSize(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-medium"
                >
                  <option>5kg (Pouch Plastik)</option>
                  <option>25kg (Karung Kertas)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">3. Jumlah (Banyaknya)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-4 pr-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-black text-2xl"
                    placeholder="1"
                    required
                  />
                  <span className="absolute right-4 top-4 text-sm font-bold text-slate-400">Karung</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={!lotId || parseInt(quantity) <= 0}
                className="w-full px-8 py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-md shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <QrCode size={24} />
                Simpan & Hasilkan Label QR
              </button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Preview Cetak QR */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg text-white flex flex-col items-center justify-center border-4 border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-4 bg-emerald-500"></div>
          <h3 className="font-bold text-lg mb-6 text-slate-300">Preview Stiker Label</h3>
          
          {lastPrintedQR ? (
            <div className="bg-white p-6 rounded-xl text-center space-y-4 shadow-2xl animate-scaleIn">
              <QRCodeSVG value={`https://siragu.demo/verify/${lastPrintedQR}`} size={160} />
              <div className="text-slate-800">
                <p className="font-black text-xl tracking-widest">{lastPrintedQR}</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Tersertifikasi Organik</p>
              </div>
            </div>
          ) : (
            <div className="w-48 h-48 border-4 border-dashed border-slate-600 rounded-xl flex items-center justify-center text-slate-500">
              Menunggu Input...
            </div>
          )}

          <button 
            type="button"
            disabled={!lastPrintedQR}
            onClick={() => {
              alert(`Mengunduh Label_${lastPrintedQR}.pdf... (Simulasi)`);
            }}
            className="mt-8 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center shadow-lg shadow-emerald-900/50"
          >
            <Download size={20} />
            Unduh Label (PDF)
          </button>
        </div>
      </div>

      {/* Histori Kemasan */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <QrCode className="text-slate-500" size={20} />
          <h2 className="font-bold text-slate-800">Histori Pengemasan ({packages.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-wider font-bold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Serial QR</th>
                <th className="px-6 py-4">Sumber Lot Gula</th>
                <th className="px-6 py-4">Ukuran / Tipe</th>
                <th className="px-6 py-4">Jumlah</th>
                <th className="px-6 py-4">Waktu Kemas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-xs">
                      {pkg.serialNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{pkg.lotCode}</td>
                  <td className="px-6 py-4 font-medium text-slate-600">{pkg.packageSize}</td>
                  <td className="px-6 py-4 font-black text-slate-900">{pkg.quantity}</td>
                  <td className="px-6 py-4 font-medium text-slate-500">{pkg.packedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
