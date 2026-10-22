import { useState } from 'react';
import { useDemoData } from '../../context/DemoDataContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { QrCode, Download, CheckCircle2, Box, ExternalLink, Printer, LayoutGrid, Tag } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { packagingApi, lotsApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function PackagingPage() {
  const queryClient = useQueryClient();
  const { lots: mockLots, packages: mockPackages, createPackagingRun } = useDemoData();

  // Try real API first
  const { data: realLots } = useQuery({
    queryKey: ['lots', 'RELEASED'],
    queryFn: () => lotsApi.list('RELEASED'),
    retry: 1,
  });

  const { data: realPackages } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packagingApi.list(),
    retry: 1,
  });

  const availableLots = realLots && realLots.length > 0 ? realLots : mockLots.filter(l => l.status === 'RELEASED');
  const packagesList = realPackages && realPackages.length > 0 ? realPackages : mockPackages;

  const [lotId, setLotId] = useState('');
  const [packageSize, setPackageSize] = useState('250g (Pouch Ritel)');
  const [quantity, setQuantity] = useState('20');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastPrintedToken, setLastPrintedToken] = useState('DEMOPASSPORT');
  const [lastPrintedSerial, setLastPrintedSerial] = useState('SGU-B26-0912-07-0001');
  const [printLayout, setPrintLayout] = useState<'thermal' | 'a4' | null>(null);

  // Set default lotId once available
  if (!lotId && availableLots.length > 0) {
    setLotId(availableLots[0].id);
  }

  const selectedLot = availableLots.find(l => l.id === lotId) || availableLots[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(quantity) || 0;
    if (!lotId || qtyNum <= 0) return;

    const sizeNum = packageSize.includes('25kg')
      ? 25.0
      : packageSize.includes('5kg')
        ? 5.0
        : 0.25;

    try {
      const res = await packagingApi.create({
        lotId,
        packageSize: sizeNum,
        quantity: qtyNum,
        unit: 'kg',
      });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setLastPrintedToken(res.token || res.qrSerials?.[0]?.token || 'DEMOPASSPORT');
      setLastPrintedSerial(res.qrSerials?.[0]?.humanSerial || `SGU-PKG-${Date.now().toString().slice(-4)}`);
    } catch {
      // Fallback to demo context
      const pkg = createPackagingRun({
        lotId,
        size: { label: packageSize, kg: sizeNum, unitName: 'pack' },
        quantity: qtyNum,
        packedBy: 'Operator Lapangan',
      });
      setLastPrintedToken(pkg.serialNumber);
      setLastPrintedSerial(pkg.serialNumber);
    }

    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://siragu-trace.vercel.app';
  const qrUrl = `${originUrl}/v/${lastPrintedToken}`;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <PageHeader 
        title="Siapkan Kemasan & Cetak Label" 
        description="Pecah lot gula olahan yang telah berstatus RELEASED ke dalam kemasan ritel atau curah, serta cetak label QR pintar." 
      />

      {isSubmitted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 animate-fadeIn">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold">Kemasan Berhasil Disimpan & Label Siap Dicetak!</h4>
            <p className="text-sm mt-1">
              Token QR Kriptografi: <strong className="font-mono bg-emerald-100 px-1 py-0.5 rounded">{lastPrintedToken}</strong> (Serial: {lastPrintedSerial}).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <Box size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pemecahan Lot ke Kemasan Standar</h2>
              <p className="text-xs text-slate-500">Pilih gula semut organik yang telah disetujui QA & rilis mutu.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Pilih Lot Gula Rilis (Status RELEASED)
              </label>
              <select
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                className="w-full p-3.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                required
              >
                {availableLots.length === 0 && <option value="">Tidak ada lot siap kemas</option>}
                {availableLots.map((lot: any) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.batchNumber || lot.lotCode} — Stok: {lot.quantity} {lot.unit} (Status: {lot.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Ukuran Kemasan
                </label>
                <select
                  value={packageSize}
                  onChange={(e) => setPackageSize(e.target.value)}
                  className="w-full p-3.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                >
                  <option>250g (Pouch Ritel)</option>
                  <option>5kg (Pouch Curah)</option>
                  <option>25kg (Karung Kertas Ekspor)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Jumlah Unit (Kemasan)
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-3.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-emerald-500 font-bold text-base"
                  placeholder="20"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!lotId || parseInt(quantity) <= 0}
              className="w-full py-4 bg-[#1B4D3E] text-white font-bold text-sm rounded-xl hover:bg-[#143B30] active:scale-98 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <QrCode size={18} />
              Simpan & Hasilkan Token QR Unik
            </button>
          </form>
        </div>

        {/* Kolom Kanan: Preview Stiker & Printable Layouts */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col items-center justify-between border border-slate-800 relative shadow-xl">
          <div className="w-full text-center">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              Pratinjau Label Resmi
            </span>
            <h3 className="font-bold text-base text-white">Stiker Label SIRAGU</h3>
          </div>
          
          <div className="my-6 bg-white p-5 rounded-2xl text-center shadow-md w-full max-w-[240px]">
            <a 
              href={`/v/${lastPrintedToken}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block hover:opacity-90 transition cursor-pointer"
            >
              <QRCodeSVG 
                value={qrUrl} 
                size={160}
                level="M"
                includeMargin={false}
              />
            </a>
            <div className="mt-3 text-slate-900">
              <p className="font-mono font-bold text-xs tracking-wider text-emerald-800">{lastPrintedSerial}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Organic Coconut Sugar</p>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] text-emerald-700 font-bold">
                <ExternalLink size={11} /> Cek Paspor Publik
              </div>
            </div>
          </div>

          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={() => setPrintLayout('thermal')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition border border-slate-700"
            >
              <Tag size={15} /> Cetak Thermal (50 x 30 mm)
            </button>
            <button
              type="button"
              onClick={() => setPrintLayout('a4')}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <LayoutGrid size={15} /> Cetak Lembar A4 (Grid 24 Stiker)
            </button>
          </div>
        </div>
      </div>

      {/* Histori Kemasan */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <QrCode className="text-emerald-700" size={18} />
            <h2 className="font-bold text-slate-800 text-sm">Histori Kemasan & QR Serial ({packagesList.length})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Serial / Token QR</th>
                <th className="px-6 py-3.5">Sumber Lot</th>
                <th className="px-6 py-3.5">Ukuran</th>
                <th className="px-6 py-3.5">Banyak Unit</th>
                <th className="px-6 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packagesList.map((pkg: any) => {
                const sNumber = pkg.serialNumber || pkg.qrSerials?.[0]?.humanSerial || pkg.packageCode;
                const tokenVal = pkg.qrSerials?.[0]?.token || sNumber;
                return (
                  <tr key={pkg.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-mono font-bold text-slate-900">
                      {sNumber}
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-700">{pkg.lot?.batchNumber || pkg.lotCode || 'Lot Olahan'}</td>
                    <td className="px-6 py-3 text-slate-600">{pkg.packageSize} {pkg.unit || 'kg'}</td>
                    <td className="px-6 py-3 font-black text-slate-800">{pkg.quantity}</td>
                    <td className="px-6 py-3">
                      <a 
                        href={`/v/${tokenVal}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> Buka Paspor
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Modal / Sheet Overlay */}
      {printLayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {printLayout === 'thermal' ? 'Format Cetak Thermal 50 x 30 mm' : 'Format Lembar Cetak A4 (Grid 24 Stiker)'}
                </h3>
                <p className="text-xs text-slate-500">Siap dicetak langsung ke printer label atau printer kantor.</p>
              </div>
              <button
                onClick={() => setPrintLayout(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Thermal Single Label Preview */}
            {printLayout === 'thermal' ? (
              <div className="p-6 bg-slate-100 rounded-xl flex justify-center">
                <div className="w-[300px] h-[180px] bg-white border border-slate-300 p-3 flex items-center justify-between rounded shadow-sm">
                  <QRCodeSVG value={qrUrl} size={110} />
                  <div className="text-right pl-3 text-slate-900">
                    <p className="text-[10px] font-black uppercase text-emerald-800">SIRAGU ORGANIC</p>
                    <p className="font-mono text-xs font-bold mt-1">{lastPrintedSerial}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Netto: 250g</p>
                    <p className="text-[9px] text-slate-500">SNI 3743:2021</p>
                    <p className="text-[8px] text-slate-400 mt-2">Scan kamera HP untuk telusur asal usul petani</p>
                  </div>
                </div>
              </div>
            ) : (
              /* A4 Grid Preview */
              <div className="p-4 bg-slate-100 rounded-xl">
                <div className="grid grid-cols-4 gap-2 bg-white p-4 border border-slate-200 rounded">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="border border-slate-200 p-2 text-center rounded flex flex-col items-center">
                      <QRCodeSVG value={qrUrl} size={60} />
                      <span className="font-mono text-[9px] font-bold text-slate-800 mt-1">{lastPrintedSerial}</span>
                      <span className="text-[7.5px] text-slate-400">SIRAGU Organic</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPrintLayout(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-600 flex items-center gap-1.5"
              >
                <Printer size={14} /> Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
