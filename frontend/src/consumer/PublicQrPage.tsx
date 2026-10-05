import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { 
  CheckCircle2, 
  MapPin, 
  Leaf, 
  ShieldCheck, 
  Thermometer, 
  Calendar,
  Upload,
  FileText,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useDemoData } from '../context/DemoDataContext';

export function PublicQrPage() {
  const { serial } = useParams();
  const { packages, lots, farmers } = useDemoData();
  
  // Find package
  const pkg = packages.find(p => p.serialNumber === serial) || packages[0]; // fallback for demo
  
  // Find processed lot
  const procLot = lots.find(l => l.id === pkg?.lotId);
  
  // Find raw materials (in UMKM model, we might have mixed inputs, let's just grab the first for demo)
  const rawLotId = procLot?.inputLotIds?.[0];
  const rawLot = lots.find(l => l.id === rawLotId);
  const farmer = farmers.find(f => f.id === rawLot?.farmerId) || farmers[0]; // fallback

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const fileName = e.target.files[0].name;
      setTimeout(() => {
        setUploadedFiles(prev => [...prev, fileName]);
        setIsUploading(false);
      }, 1500);
    }
  };

  if (!pkg) {
    return <div className="p-8 text-center">Data QR Tidak Ditemukan.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Mobile-optimized Header */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 pt-12 pb-24 px-6 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 text-white/10">
          <Leaf size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase opacity-90">Produk Terverifikasi</span>
          </div>
          <h1 className="text-3xl font-black leading-tight mb-2">Gula Semut Organik</h1>
          <p className="text-emerald-100 text-lg">Koperasi Nira Lestari</p>
        </div>
      </div>

      {/* Floating Info Card */}
      <div className="px-6 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-900/5 border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="text-sm text-slate-500 font-medium">Serial Batch</div>
            <div className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg text-sm">{pkg.serialNumber}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Kemasan</p>
              <p className="font-black text-slate-800 text-lg">{pkg.packageSize}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Tanggal Produksi</p>
              <p className="font-black text-slate-800 text-base">{pkg.packedAt.split(' ')[0]}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6">
        
        {/* Asal Usul (Traceability) */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="text-emerald-600" size={20} /> Asal Usul Pemasok
          </h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Leaf size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{farmer.name}</h3>
                <p className="text-sm text-slate-500">{farmer.group}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={16} /> Tersertifikasi Organik (EU & SNI)
            </div>
          </div>
        </section>

        {/* Informasi Kualitas */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Thermometer className="text-amber-600" size={20} /> Parameter Pengolahan
          </h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-xs text-slate-400 font-bold">KODE LOT OVEN</p>
                <p className="font-mono font-bold text-slate-700 mt-1">{procLot?.lotCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold">SUSUT OVEN</p>
                <p className="font-black text-amber-600 text-lg mt-1">{procLot?.yieldPercentage || '10.5'}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 font-bold">KONDISI BAHAN MASUK</p>
                <p className="text-sm font-medium text-slate-700 mt-1 leading-relaxed">
                  {rawLot?.notes || 'Kondisi fisik normal, wangi khas karamel, tidak menggumpal.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Upload Dokumen Pembeli */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="text-blue-600" size={20} /> Rekam Dokumen Bisnis
          </h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Sebagai mitra pembeli, Anda dapat mengunggah dokumen terkait pesanan ini (contoh: <strong>Invoice, Bukti Bayar, atau Surat Jalan Penerimaan</strong>) untuk disimpan secara aman di dalam jejak digital SIRAGU.
            </p>

            <div className="space-y-3">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <FileText className="text-blue-600" size={20} />
                  <span className="text-sm font-bold text-blue-900 truncate flex-1">{file}</span>
                  <CheckCircle2 className="text-emerald-500" size={18} />
                </div>
              ))}
              
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-blue-50 transition-colors group">
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                  {isUploading ? <Thermometer className="animate-spin" size={20} /> : <Upload size={20} />}
                </div>
                <span className="text-sm font-bold text-slate-600">{isUploading ? 'Mengunggah...' : 'Pilih File untuk Diunggah'}</span>
                <span className="text-xs text-slate-400 mt-1">PDF, JPG, atau PNG (Maks 5MB)</span>
                <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept=".pdf,.png,.jpg,.jpeg" />
              </label>
            </div>
          </div>
        </section>

      </div>
      
      {/* Footer Nav */}
      <div className="mt-12 text-center text-slate-400 text-sm font-medium pb-8 flex flex-col items-center gap-2">
        <Leaf size={16} />
        Dipersembahkan oleh SIRAGU Trace
      </div>
    </div>
  );
}
