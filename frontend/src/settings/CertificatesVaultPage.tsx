import { PageHeader } from '@/components/layout/PageHeader';
import { FileBadge, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

export function CertificatesVaultPage() {
  const certs = [
    { name: 'Sertifikat Organik (EU)', exp: '2027-05-12', status: 'valid', id: 'EU-ORG-001' },
    { name: 'Sertifikat Organik (SNI)', exp: '2028-01-20', status: 'valid', id: 'SNI-ORG-882' },
    { name: 'Sertifikat Halal', exp: '2024-11-10', status: 'warning', id: 'HALAL-ID-992' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader 
        title="Izin & Sertifikat (Vault)" 
        description="Kelola seluruh dokumen legalitas dan sertifikasi mutu untuk menjamin kepercayaan pembeli." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {certs.map(cert => (
          <div key={cert.id} className={`p-6 rounded-2xl border-2 flex flex-col justify-between h-56 transition-all hover:shadow-md ${
            cert.status === 'valid' ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className={`p-3 rounded-xl ${cert.status === 'valid' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-200 text-amber-800'}`}>
                  <FileBadge size={24} />
                </div>
                {cert.status === 'valid' ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Aktif</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full"><AlertCircle size={12}/> Segera Kedaluwarsa</span>
                )}
              </div>
              <h3 className="font-bold text-slate-800 mt-4 leading-tight">{cert.name}</h3>
              <p className="text-sm font-mono text-slate-500 mt-1">{cert.id}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100/80 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Berlaku s/d</p>
                <p className={`text-sm font-black ${cert.status === 'warning' ? 'text-amber-700' : 'text-slate-700'}`}>{cert.exp}</p>
              </div>
              <button className="text-indigo-600 font-bold text-sm hover:underline">Lihat PDF</button>
            </div>
          </div>
        ))}

        <button className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors h-56 group">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud size={24} />
          </div>
          <span className="font-bold">Unggah Sertifikat Baru</span>
        </button>
      </div>
    </div>
  );
}
