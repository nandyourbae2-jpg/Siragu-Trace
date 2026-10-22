import { useState } from 'react';
import { useDemoData } from '../../context/DemoDataContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Truck, CheckCircle2, UserCheck, QrCode, ExternalLink, Box, MapPin, Plus } from 'lucide-react';
import { distributionApi, buyersApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function DistributionPage() {
  const queryClient = useQueryClient();
  const { packages: mockPackages } = useDemoData();

  const { data: realShipments } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => distributionApi.listShipments(),
    retry: 1,
  });

  const { data: realBuyers } = useQuery({
    queryKey: ['buyers'],
    queryFn: () => buyersApi.list(),
    retry: 1,
  });

  const shipments = realShipments || [
    {
      id: 'shp-1',
      shipmentCode: 'SHP26-0001',
      buyer: { name: 'PT Megah Rasa Pangan' },
      distributorName: 'PT Agriswara Logistik Nusantara',
      shipmentDate: '2026-09-15',
      status: 'SHIPPED',
      boxes: [
        { id: 'b-1', boxCode: 'BOX-SHP26-0001-01', token: 'BOXDEMO0001' },
        { id: 'b-2', boxCode: 'BOX-SHP26-0001-02', token: 'BOXDEMO0002' },
      ],
    },
  ];

  const buyers = realBuyers || [
    { id: 'b1', name: 'PT Megah Rasa Pangan' },
    { id: 'b2', name: 'BioFoods Europe B.V.' },
    { id: 'b3', name: 'CV Rasa Lokal Ekspor' },
  ];

  const [buyerId, setBuyerId] = useState(buyers[0]?.id || '');
  const [distributorName, setDistributorName] = useState('PT Agriswara Logistik Nusantara');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: any) => distributionApi.createShipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerId) return;
    createMutation.mutate({
      buyerId,
      distributorName,
      shipmentDate: new Date().toISOString(),
      lines: [],
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <PageHeader 
        title="Distribusi & Pengiriman B2B" 
        description="Pantau boks logistik dingin, cetak surat jalan digital (B2B Dossier), dan pantau sensor telemetri perjalanan." 
      />

      {isSubmitted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 animate-fadeIn">
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold">Pengiriman Baru Berhasil Dibuat!</h4>
            <p className="text-sm mt-1">Token paspor pengiriman boks logistik telah diterbitkan secara otomatis.</p>
          </div>
        </div>
      )}

      {/* Daftar Pengiriman Aktif */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Truck className="text-emerald-700" size={18} />
            <h2 className="font-bold text-slate-800 text-sm">Daftar Pengiriman B2B & Cold-Chain ({shipments.length})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Kode Pengiriman</th>
                <th className="px-6 py-3.5">Mitra Pembeli (B2B)</th>
                <th className="px-6 py-3.5">Ekspedisi / Armada</th>
                <th className="px-6 py-3.5">Boks Logistik</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shipments.map((shp: any) => {
                const boxToken = shp.boxes?.[0]?.token || 'BOXDEMO0001';
                return (
                  <tr key={shp.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                      {shp.shipmentCode}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">
                      {shp.buyer?.name || 'Mitra B2B'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {shp.distributorName || 'Armada Logistik'}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700">
                      {shp.boxes?.length || 2} Boks Telemetri
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {shp.status || 'SHIPPED'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <a
                        href={`/s/${boxToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> Buka Paspor B2B
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Buat Pengiriman Baru */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl">
        <h3 className="font-bold text-sm text-slate-900 mb-1">Buat Rencana Pengiriman Baru</h3>
        <p className="text-xs text-slate-500 mb-4">Daftarkan pengiriman boks ke pembeli B2B atau eksportir.</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Mitra Pembeli</label>
            <select
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 font-medium"
              required
            >
              {buyers.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Penyedia Ekspedisi / Logistik</label>
            <input
              type="text"
              value={distributorName}
              onChange={(e) => setDistributorName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl"
              placeholder="PT Agriswara Logistik Nusantara"
              required
            />
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3 bg-[#1B4D3E] text-white font-bold rounded-xl hover:bg-[#143B30] transition flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Buat Surat Jalan & Tautkan Boks
          </button>
        </form>
      </div>

    </div>
  );
}
