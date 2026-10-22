import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FileBadge, UploadCloud, CheckCircle2, AlertCircle, XCircle, Plus, Trash2, ExternalLink } from 'lucide-react';
import { certificatesApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function CertificatesVaultPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ORGANIC_EU',
    name: '',
    number: '',
    issuer: '',
    validUntil: '',
    verifyUrl: '',
  });

  const { data: realCerts, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => certificatesApi.list(),
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => certificatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setIsModalOpen(false);
      setFormData({ type: 'ORGANIC_EU', name: '', number: '', issuer: '', validUntil: '', verifyUrl: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => certificatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });

  const certs = realCerts || [
    { id: '1', name: 'Sertifikat Organik Standar Uni Eropa (EU)', number: 'CU-892182-EU', issuer: 'Control Union', validUntil: '2027-05-12', type: 'ORGANIC_EU', status: 'ACTIVE' },
    { id: '2', name: 'Sertifikat Pangan Organik Indonesia (SNI 6729)', number: 'LS-012-SNI-ORG-882', issuer: 'INOFICE', validUntil: '2028-01-20', type: 'ORGANIC_SNI', status: 'ACTIVE' },
    { id: '3', name: 'Sertifikat Halal BPJPH Kemenag', number: 'ID33110001892830224', issuer: 'BPJPH Kemenag RI', validUntil: '2028-11-10', type: 'HALAL', status: 'ACTIVE' },
    { id: '4', name: 'Izin Edar Sementara P-IRT (Demo Expired)', number: 'P-IRT 209330201145220', issuer: 'Dinkes Banyumas', validUntil: '2024-11-10', type: 'OTHER', status: 'EXPIRED' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.number || !formData.validUntil) return;
    createMutation.mutate({
      ...formData,
      validUntil: new Date(formData.validUntil).toISOString(),
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Izin & Sertifikat (Certificates Vault)" 
          description="Single Source of Truth untuk seluruh dokumen legalitas dan kepatuhan pangan (EU Organic, SNI, BPJPH, BPOM)." 
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1B4D3E] hover:bg-[#143B30] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus size={16} /> Tambah Sertifikat Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certs.map((cert: any) => {
          const isExpired = cert.status === 'EXPIRED' || new Date(cert.validUntil) < new Date();
          const isExpiring = cert.status === 'EXPIRING';

          return (
            <div 
              key={cert.id} 
              className={`p-5 rounded-2xl border flex flex-col justify-between transition shadow-sm bg-white ${
                isExpired ? 'border-red-200 bg-red-50/20' : isExpiring ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${isExpired ? 'bg-red-100 text-red-700' : isExpiring ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    <FileBadge size={22} />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isExpired ? 'bg-red-100 text-red-800' : isExpiring ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isExpired ? (
                      <><XCircle size={12} /> Kedaluwarsa</>
                    ) : isExpiring ? (
                      <><AlertCircle size={12} /> Segera Berakhir</>
                    ) : (
                      <><CheckCircle2 size={12} /> Aktif (Valid)</>
                    )}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{cert.name}</h3>
                <p className="text-xs font-mono font-medium text-slate-500 mt-1">{cert.number}</p>
                {cert.issuer && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{cert.issuer}</p>
                )}
              </div>
              
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Berlaku s/d</span>
                  <span className={`font-mono font-bold ${isExpired ? 'text-red-700' : 'text-slate-700'}`}>
                    {String(cert.validUntil).slice(0, 10)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {cert.verifyUrl && (
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> Cek
                    </a>
                  )}
                  {realCerts && (
                    <button
                      onClick={() => deleteMutation.mutate(cert.id)}
                      className="text-slate-400 hover:text-red-600 transition p-1"
                      title="Hapus Sertifikat"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Sertifikat */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Tambah Dokumen Sertifikat</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Sertifikat</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50"
                >
                  <option value="ORGANIC_EU">EU Organic</option>
                  <option value="ORGANIC_USDA">USDA NOP Organic</option>
                  <option value="ORGANIC_SNI">SNI Pangan Organik</option>
                  <option value="HALAL">Halal BPJPH</option>
                  <option value="HACCP">HACCP / ISO 22000</option>
                  <option value="FAIR_TRADE">Fair Trade</option>
                  <option value="OTHER">Lainnya / Izin Edar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Sertifikat</label>
                <input
                  type="text"
                  placeholder="Contoh: Sertifikat Organik Standar Uni Eropa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Registrasi / SK</label>
                  <input
                    type="text"
                    placeholder="CU-892182-EU"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lembaga Penerbit</label>
                  <input
                    type="text"
                    placeholder="Control Union"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Berlaku Sampai Tanggal</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
                >
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Sertifikat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
