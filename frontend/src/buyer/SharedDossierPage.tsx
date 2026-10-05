import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { 
  CheckCircle2, 
  MapPin, 
  Leaf, 
  ShieldCheck, 
  Thermometer, 
  Upload,
  FileText,
  Building2,
  Package
} from 'lucide-react';
import { useDemoData } from '../context/DemoDataContext';

export function SharedDossierPage() {
  const { token } = useParams();
  const { packages, lots, farmers } = useDemoData();
  
  // Ambil beberapa paket yang dikirimkan dalam order ini (simulasi)
  const dispatchedPackages = packages.slice(0, 3);
  
  // Find raw materials info
  const procLotId = dispatchedPackages[0]?.lotId;
  const procLot = lots.find(l => l.id === procLotId);
  const rawLotId = procLot?.inputLotIds?.[0];
  const rawLot = lots.find(l => l.id === rawLotId);
  const farmer = farmers.find(f => f.id === rawLot?.farmerId) || farmers[0];

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 pt-12 pb-24 px-6 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 text-white/10">
          <Building2 size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase opacity-90">B2B Shared Dossier</span>
          </div>
          <h1 className="text-3xl font-black leading-tight mb-2">Dokumen Pesanan Anda</h1>
          <p className="text-blue-100 text-lg flex items-center gap-2">Token Akses: <span className="font-mono bg-black/20 px-2 py-0.5 rounded text-sm">{token}</span></p>
        </div>
      </div>

      {/* Floating Info Card */}
      <div className="px-6 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-slate-100">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Package className="text-blue-600" size={20} /> Daftar Muatan Kemasan
          </h2>
          <div className="space-y-3">
            {dispatchedPackages.map(pkg => (
              <div key={pkg.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="font-mono font-bold text-slate-700">{pkg.serialNumber}</div>
                  <div className="text-xs text-slate-500">Lot: {pkg.lotCode}</div>
                </div>
                <div className="font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                  {pkg.packageSize}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6">
        
        {/* Asal Usul (Traceability) */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <MapPin className="text-emerald-600" size={20} /> Asal Usul Komoditas
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

        {/* Upload Dokumen Pembeli */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={20} /> Rekam Dokumen Bisnis
          </h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Sebagai mitra pembeli, Anda dapat mengunggah dokumen terkait pesanan ini (contoh: <strong>Invoice, Bukti Bayar, atau Tanda Terima Surat Jalan</strong>) ke dalam ekosistem SIRAGU untuk mempercepat proses administratif.
            </p>

            <div className="space-y-3">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <FileText className="text-indigo-600" size={20} />
                  <span className="text-sm font-bold text-indigo-900 truncate flex-1">{file}</span>
                  <CheckCircle2 className="text-emerald-500" size={18} />
                </div>
              ))}
              
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-indigo-50 transition-colors group">
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-110 transition-transform">
                  {isUploading ? <Thermometer className="animate-spin" size={20} /> : <Upload size={20} />}
                </div>
                <span className="text-sm font-bold text-slate-600">{isUploading ? 'Mengunggah...' : 'Pilih File Dokumen Anda'}</span>
                <span className="text-xs text-slate-400 mt-1">PDF, JPG, atau PNG (Maks 5MB)</span>
                <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept=".pdf,.png,.jpg,.jpeg" />
              </label>
            </div>
          </div>
        </section>

      </div>
      
      {/* Footer Nav */}
      <div className="mt-12 text-center text-slate-400 text-sm font-medium pb-8 flex flex-col items-center gap-2">
        <ShieldCheck size={16} />
        Aman & Terenkripsi oleh SIRAGU Trace
      </div>
    </div>
  );
}
