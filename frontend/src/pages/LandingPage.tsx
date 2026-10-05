import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowRight, 
  Link as LinkIcon, 
  Search, 
  FileText, 
  Activity, 
  ShieldCheck, 
  Map, 
  CheckCircle, 
  Leaf,
  Layers,
  Sparkles,
  Award,
  ExternalLink
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', company: '', contact: '', locations: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleDemoRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', company: '', contact: '', locations: '' });
      alert('Terima kasih! Permintaan demo pilot Anda telah diterima. Tim SIRAGU Trace akan segera menghubungi Anda.');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      
      {/* 1. Nav Bar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-blue-900 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-[#0075DE] flex items-center justify-center text-white">
              <Leaf size={18} />
            </div>
            <span>SIRAGU Trace</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#fitur" className="hover:text-blue-600 transition-colors">Fitur Unggulan</a>
            <a href="#cara-kerja" className="hover:text-blue-600 transition-colors">Cara Kerja</a>
            <a href="#harga" className="hover:text-blue-600 transition-colors">Paket Pilot</a>
            <a href="/verify/PKG-2026-0001" className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1">
              <Sparkles size={14} /> Coba Scan QR
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Masuk Akun
            </button>
            <button 
              onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })} 
              className="bg-[#0075DE] hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Minta Demo Pilot
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Band (Dark Indigo #213183) */}
      <header className="bg-[#213183] text-white pt-20 pb-28 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-6 text-blue-100">
            Platform Ketertelusuran Rantai Pasok Gula Semut
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Setiap kemasan gula semut,<br />terbukti jelas asal-usulnya.
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed font-normal">
            SIRAGU Trace menghubungkan setiap lot nira dari petani penderes, proses kristalisasi, hingga penanganan komplain pembeli ke dalam satu rantai bukti yang tidak terputus.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="w-full sm:w-auto bg-[#0075DE] hover:bg-blue-500 text-white px-8 py-3.5 rounded-full text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              Coba Aplikasi Sekarang <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => document.getElementById('masalah')?.scrollIntoView({ behavior: 'smooth' })} 
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-[#213183] px-8 py-3.5 rounded-full text-sm font-bold transition-all shadow-lg cursor-pointer"
            >
              Pelajari Cara Kerja
            </button>
          </div>
        </div>
        
        {/* Dekorasi Cahaya Latar Belakang */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] bg-blue-500 blur-[120px] rounded-full mix-blend-screen"></div>
          <div className="absolute top-[30%] -right-[10%] w-[40%] h-[100%] bg-indigo-400 blur-[100px] rounded-full mix-blend-screen"></div>
        </div>
      </header>

      {/* 3. Problem Section (Tantangan Industri Gula Semut Lokal) */}
      <section id="masalah" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Data Anda Mungkin Lengkap, <br className="hidden md:block"/>Tetapi Keterhubungannya Belum Terjamin.
            </h2>
            <p className="text-base text-gray-600 leading-relaxed">
              Ketika catatan timbang petani di buku tulis, log wajan di kertas buram, dan hasil uji laboratorium tersimpan di folder terpisah—maka saat ada komplain dari mitra pembeli, merekonstruksi kebenaran menjadi proses berhari-hari yang penuh risiko.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Sebelum SIRAGU */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-red-500 font-bold text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Sebelum SIRAGU Trace
                </div>
                <div className="space-y-3">
                  <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3 text-xs text-gray-600">
                    <FileText className="text-gray-400 shrink-0" size={18} />
                    <span>Catatan setoran nira tersebar di spreadsheet & buku pos timbang</span>
                  </div>
                  <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3 text-xs text-gray-600">
                    <FileText className="text-gray-400 shrink-0" size={18} />
                    <span>Pencampuran wajan masak tidak tercatat rasio rendemennya</span>
                  </div>
                  <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3 text-xs text-gray-600">
                    <FileText className="text-gray-400 shrink-0" size={18} />
                    <span>Sertifikat COA lab dan bukti suhu gudang terpisah di arsip</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-6 italic text-center border-t border-gray-100 pt-4">
                Pelacakan mundur saat ada komplain membutuhkan waktu berhari-hari.
              </p>
            </div>
            
            {/* Sesudah SIRAGU */}
            <div className="bg-white p-8 rounded-2xl border-2 border-blue-200 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
              <div>
                <div className="text-[#0075DE] font-bold text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0075DE]"></div> Dengan SIRAGU Trace
                </div>
                <div className="relative">
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-blue-200"></div>
                  <div className="space-y-4 relative z-10 text-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-xs">
                        1
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">Lot Nira Petani Terdaftar</span>
                        <span className="text-[11px] text-gray-500">Tercatat brix, pH, dan nomor sertifikat organik</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-xs">
                        2
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">Proses Kristalisasi & Uji SNI</span>
                        <span className="text-[11px] text-gray-500">Neraca massa otomatis dan verifikasi rilis 4-mata</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-[#0075DE] text-white rounded-full flex items-center justify-center font-bold border-2 border-white shadow-xs">
                        3
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">Kemasan Pouch & Serial QR Unik</span>
                        <span className="text-[11px] text-gray-500">Pelanggan dapat memindai silsilah instan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-blue-600 font-bold mt-6 text-center border-t border-blue-50 pt-4">
                Ketertelusuran bolak-balik (dua arah) dalam hitungan detik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Cara Kerja Rantai Bukti (Continuous Chain of Custody) */}
      <section id="cara-kerja" className="py-20 px-6 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            Alur Terintegrasi
          </div>
          <h2 className="text-3xl font-bold mb-4">Satu Rantai Ketertelusuran Utuh</h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mb-12">
            Mesin SIRAGU Trace dibangun berbasis grafik relasi. Setiap tindakan operasional pabrik mengikat bukti silsilah secara permanen.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 text-xs font-bold text-gray-700">
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl w-full md:w-auto shadow-xs">
              1. Nira Petani
            </div>
            <ArrowRight className="hidden md:block text-gray-400 shrink-0" size={16} />
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl w-full md:w-auto shadow-xs">
              2. Kristalisasi
            </div>
            <ArrowRight className="hidden md:block text-gray-400 shrink-0" size={16} />
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl w-full md:w-auto shadow-xs">
              3. Gerbang Rilis
            </div>
            <ArrowRight className="hidden md:block text-gray-400 shrink-0" size={16} />
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl w-full md:w-auto shadow-xs">
              4. Kemasan & QR
            </div>
            <ArrowRight className="hidden md:block text-gray-400 shrink-0" size={16} />
            <div className="px-4 py-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl w-full md:w-auto shadow-xs">
              5. Pengiriman B2B
            </div>
          </div>
        </div>
      </section>

      {/* 5. Fitur Unggulan */}
      <section id="fitur" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Dirancang untuk Kenyataan Operasional Lapangan</h2>
            <p className="text-sm text-gray-600">Fitur cerdas yang menjawab kebutuhan audit pembeli dan operasional koperasi.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Mesin Silsilah & Pohon Trace',
                desc: 'Visualisasi grafis interaktif React Flow menghubungkan nira mentah hingga ke tangan pembeli akhir.',
                icon: LinkIcon,
                color: 'bg-blue-100 text-blue-600',
              },
              {
                title: 'Gerbang Rilis Mutu (Release Gate)',
                desc: 'Mencegah produk dikemas jika parameter SNI (kadar air < 2%) atau relasi petani belum lengkap (BR-004).',
                icon: ShieldCheck,
                color: 'bg-emerald-100 text-emerald-600',
              },
              {
                title: 'Serialisasi Barcode QR Publik',
                desc: 'Konsumen dapat memindai kemasan untuk melihat transparansi sertifikat organik dan cerita penderes.',
                icon: Search,
                color: 'bg-purple-100 text-purple-600',
              },
              {
                title: 'Neraca Massa & Kalkulasi Rendemen',
                desc: 'Validasi otomatis rendemen kristalisasi nira ke gula semut (12% - 15%) untuk mendeteksi kebocoran produksi.',
                icon: Layers,
                color: 'bg-amber-100 text-amber-600',
              },
              {
                title: 'Telemetri Sensor Lingkungan (IoT)',
                desc: 'Pemantauan suhu & kelembaban gudang penyimpanan dengan penegakan integritas data tanpa manipulasi (BR-011).',
                icon: Activity,
                color: 'bg-teal-100 text-teal-600',
              },
              {
                title: 'Investigasi Keluhan & Dampak Recall',
                desc: 'Pemetaan radius dampak saat terjadi komplain kadar air, menelusuri lot dan kemasan terkait seketika.',
                icon: Map,
                color: 'bg-rose-100 text-rose-600',
              },
            ].map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Paket Biaya Pilot */}
      <section id="harga" className="py-20 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">Pilihan Paket Program Pilot</h2>
            <p className="text-sm text-gray-600">Model harga transparan yang disesuaikan untuk Koperasi dan UMKM pengemas gula semut.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Perangkat Keras & Setup Lapangan</h3>
                <p className="text-2xl font-extrabold text-[#0075DE] mb-6">Rp 2.500.000<span className="text-xs text-gray-500 font-normal"> / lokasi</span></p>
                <ul className="space-y-3 mb-6 text-xs text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle size={15} className="text-[#0075DE]"/> Biaya instalasi & konfigurasi satu kali</li>
                  <li className="flex items-center gap-2"><CheckCircle size={15} className="text-[#0075DE]"/> Termasuk 2 Node Sensor IoT (Suhu & RH)</li>
                  <li className="flex items-center gap-2"><CheckCircle size={15} className="text-[#0075DE]"/> 1 Gateway LoRaWAN Gudang</li>
                  <li className="flex items-center gap-2"><CheckCircle size={15} className="text-[#0075DE]"/> Pelatihan tim pos timbang & pabrik</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border-2 border-[#0075DE] shadow-md relative flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-[#0075DE] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl uppercase tracking-wider">
                Langganan SaaS
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Akses Platform SIRAGU Trace</h3>
                <p className="text-2xl font-extrabold text-[#0075DE] mb-6">Rp 500.000<span className="text-xs text-gray-500 font-normal"> / bulan</span></p>
                <ul className="space-y-3 mb-6 text-xs text-gray-600">
                  <li className="flex items-center gap-2"><CheckCircle size={15} className="text-[#0075DE]"/> Akses penuh Trace Engine & Release Gate</li>
                  <li className="flex items-center gap-2"><CheckCircle size={15} className="text-[#0075DE]"/> Pengguna tanpa batas (Multi-Role RBAC)</li>
                  <li className="flex items-center gap-2"><CheckCircle size={15} className="text-[#0075DE]"/> Akses Portal Khusus Mitra Pembeli (Buyer)</li>
                  <li className="flex items-center gap-2"><CheckCircle size={15} className="text-[#0075DE]"/> <span className="font-bold text-gray-800">Biaya QR:</span> Rp 150 per serial kemasan aktif</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Catatan Kemitraan:</strong> Biaya di atas merupakan estimasi implementasi program pilot percontohan—hubungi kami untuk penyesuaian skala koperasi Anda.
          </div>
        </div>
      </section>

      {/* 7. Formulir Permintaan Demo */}
      <section id="demo-form" className="py-20 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">Siap Mengamankan Rantai Pasok Anda?</h2>
            <p className="text-sm text-gray-600">Ajukan permohonan sesi demo pilot interaktif untuk koperasi atau pabrik Anda.</p>
          </div>
          
          <form onSubmit={handleDemoRequest} className="space-y-4 text-xs">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Nama Lengkap</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0075DE] focus:outline-none" 
                  placeholder="Budi Santoso" 
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Nama Koperasi / UMKM Pabrik</label>
                <input 
                  required 
                  type="text" 
                  value={formData.company} 
                  onChange={e => setFormData({...formData, company: e.target.value})} 
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0075DE] focus:outline-none" 
                  placeholder="Koperasi Nira Mandiri" 
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Nomor WhatsApp / Email Kontak</label>
                <input 
                  required 
                  type="text" 
                  value={formData.contact} 
                  onChange={e => setFormData({...formData, contact: e.target.value})} 
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0075DE] focus:outline-none" 
                  placeholder="0812-xxxx-xxxx" 
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Jumlah Titik Pos Timbang (Opsional)</label>
                <input 
                  type="number" 
                  value={formData.locations} 
                  onChange={e => setFormData({...formData, locations: e.target.value})} 
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0075DE] focus:outline-none" 
                  placeholder="1 atau 2 pos kebun" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#0075DE] hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm cursor-pointer mt-2"
            >
              Kirim Permohonan Demo Pilot
            </button>
          </form>
          
          <p className="text-center text-xs font-bold text-gray-400 mt-8 uppercase tracking-widest">
            Telusuri Setiap Lot · Buktikan Asal-Usul · Kepastian Mutu Gula Semut
          </p>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
            <div className="w-6 h-6 rounded bg-[#0075DE] text-white flex items-center justify-center">
              <Leaf size={14} />
            </div>
            SIRAGU Trace · Standar Ketertelusuran Gula Semut
          </div>
          <p>&copy; {new Date().getFullYear()} SIRAGU Trace. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};
