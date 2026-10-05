import React from 'react';
import { ReceivingForm } from '../../components/ReceivingForm';
import { useDemoData } from '../../context/DemoDataContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClipboardList } from 'lucide-react';

export const ReceivingPage = () => {
  const { lots } = useDemoData();
  const rawLots = lots.filter(l => l.type === 'RAW_ORGANIC');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader 
        title="Terima Bahan Baku" 
        description="Layar operator untuk mencatat timbangan kotor, wadah, dan menyimpan stok awal secara instan." 
      />
      
      {/* Formulir Timbang (Big UI) */}
      <ReceivingForm />

      {/* Histori Hari Ini */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <ClipboardList className="text-slate-500" size={20} />
          <h2 className="font-bold text-slate-800">Bahan Masuk Hari Ini ({rawLots.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-wider font-bold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Pemasok</th>
                <th className="px-6 py-4">Berat Bersih (Netto)</th>
                <th className="px-6 py-4">Kondisi Fisik</th>
                <th className="px-6 py-4">Kode Lot</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rawLots.map((lot) => (
                <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{lot.farmerName}</div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">{lot.createdAt}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-slate-900 text-lg">{lot.quantity} <span className="text-sm font-bold text-slate-500">kg</span></span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-slate-600 leading-relaxed max-w-[200px]">{lot.notes}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 text-xs">
                      {lot.lotCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      lot.status === 'PROCESSED' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {lot.status === 'PROCESSED' ? 'Selesai Diolah' : 'Siap Olah'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
