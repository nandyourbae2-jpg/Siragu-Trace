import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Users, Send, Copy, CheckCircle2, UserPlus, Phone, Link as LinkIcon, Building2 } from 'lucide-react';
import { useDemoData } from '../context/DemoDataContext';

// Data statis untuk demo CRM Pembeli
const DEMO_BUYERS = [
  { id: 'b1', name: 'PT Nusantara Gula Makmur', pic: 'Bpk. Ahmad', phone: '6281234567890', type: 'Distributor Nasional' },
  { id: 'b2', name: 'CV Rasa Lokal Ekspor', pic: 'Ibu Sarah', phone: '6289876543210', type: 'Eksportir' },
  { id: 'b3', name: 'Toko Bahan Kue Jaya', pic: 'Ko Awie', phone: '6285551112222', type: 'Grosir Retail' },
];

export function BuyerAccessPage() {
  const { packages } = useDemoData();
  const [buyers, setBuyers] = useState(DEMO_BUYERS);
  const [selectedBuyer, setSelectedBuyer] = useState(DEMO_BUYERS[0]);
  const [copiedLink, setCopiedLink] = useState('');

  // Simulasi pesanan yang dikirim ke pembeli ini (berdasarkan paket yang ada)
  // Untuk demo, kita ambil 3 paket teratas dan anggap itu dikirim ke pembeli yang dipilih.
  const dispatchedPackages = packages.slice(0, 3);

  const generateMagicLink = (buyerId: string) => {
    // Simulasi pembuatan token URL rahasia
    return `https://siragu.demo/shared-dossier/B2B-${buyerId.toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(''), 3000);
  };

  const handleSendWA = (phone: string, link: string, buyerName: string) => {
    const message = `Halo tim ${buyerName},\n\nBerikut adalah tautan Dossier Pesanan Gula Semut Organik Anda dari SIRAGU. Anda dapat memantau status, mengunduh Sertifikat Organik (COA), dan mengupload Invoice melalui tautan rahasia berikut:\n\n${link}\n\nTerima kasih.`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Mitra Pembeli (B2B CRM)" 
        description="Kelola daftar pelanggan B2B Anda, pantau pengiriman mereka, dan bagikan tautan Dossier (Magic Link) via WhatsApp tanpa perlu membuatkan mereka akun login." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kiri: Daftar Mitra */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              Buku Kontak Mitra
            </h3>
            <button className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer" title="Tambah Mitra Baru">
              <UserPlus size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {buyers.map(buyer => (
              <button
                key={buyer.id}
                onClick={() => setSelectedBuyer(buyer)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedBuyer.id === buyer.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-100 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-bold text-slate-800">{buyer.name}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <Building2 size={12} /> {buyer.type}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <Phone size={12} /> {buyer.pic}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Kanan: Detail & Akses Dossier */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Panel Profil & Generate Link */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-800">{selectedBuyer.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{selectedBuyer.type}</span>
                  <span className="text-sm text-slate-500 flex items-center gap-1.5"><Phone size={14} /> +{selectedBuyer.phone}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <LinkIcon size={18} />
                Akses Dossier Pesanan Aktif
              </h4>
              <p className="text-sm text-blue-700 mb-4">
                Klik tombol di bawah ini untuk membuat tautan unik yang berisi seluruh riwayat kualitas, sertifikat organik, dan informasi pengiriman khusus untuk <strong>{selectedBuyer.name}</strong>.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => handleSendWA(selectedBuyer.phone, generateMagicLink(selectedBuyer.id), selectedBuyer.name)}
                  className="w-full sm:w-auto px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Send size={18} />
                  Kirim via WhatsApp
                </button>
                
                <button
                  onClick={() => handleCopyLink(generateMagicLink(selectedBuyer.id))}
                  className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  {copiedLink ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  {copiedLink ? 'Tersalin!' : 'Salin Tautan'}
                </button>
              </div>
            </div>
          </div>

          {/* Panel Pesanan Terkirim */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Riwayat Pengiriman (Termuat dalam Dossier)</h3>
            
            {dispatchedPackages.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                Belum ada pengiriman yang ditautkan ke pembeli ini.
              </div>
            ) : (
              <div className="space-y-3">
                {dispatchedPackages.map((pkg, idx) => (
                  <div key={idx} className="p-4 border border-slate-100 bg-slate-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-mono font-bold text-blue-700">{pkg.serialNumber}</div>
                      <div className="text-sm text-slate-600 mt-1">Lot Gula: {pkg.lotCode}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-800">{pkg.quantity} {pkg.packageSize}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">{pkg.packedAt}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
