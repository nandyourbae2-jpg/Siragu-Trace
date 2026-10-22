import { useNavigate } from 'react-router';
import { ArrowLeft, Leaf, Sparkles, Download, ShieldCheck } from 'lucide-react';
import { QrKitSection } from '@/components/qr/QrKitSection';

export function QrHubPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0075DE] flex items-center justify-center text-white">
                <Leaf size={16} />
              </div>
              <span>SIRAGU Trace — Pusat Download QR</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 transition cursor-pointer"
            >
              Masuk Portal
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Lihat Beranda
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="bg-[#1B4D3E] text-white py-12 px-6 border-b border-emerald-900 shadow-inner">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide uppercase">
            <ShieldCheck size={14} className="text-emerald-400" />
            Media Kit & Pratinjau Ketertelusuran Resmi
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Pusat Unduh QR Code & Stiker Label
          </h1>
          <p className="text-emerald-100 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Unduh file QR Code resolusi tinggi untuk bahan presentasi kompetisi BPC, proposal pilot buyer ekspor, dan pencetakan stiker sampel fisik gula semut Banyumas.
          </p>
        </div>
      </div>

      {/* QR Kit Section */}
      <QrKitSection />
    </div>
  );
}
