import { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  GitMerge, 
  CheckCircle, 
  Search, 
  PlusCircle, 
  Flame, 
  Droplets,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useDemoData } from '../../context/DemoDataContext';
import { useNavigate } from 'react-router';

export const ComplaintsPage = () => {
  const navigate = useNavigate();
  const { complaints, lots, packages, addComplaint, resolveComplaint, quarantineLot } = useDemoData();

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    complaints[0]?.id || null
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [impactScope, setImpactScope] = useState<any>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Form State
  const [buyerName, setBuyerName] = useState('Mitra Pembeli (Agregator)');
  const [relatedLotCode, setRelatedLotCode] = useState(lots[0]?.lotCode || 'GULA-KRS-2026-03');
  const [issueType, setIssueType] = useState<'Kadar Air Tinggi' | 'Gumpalan/Caking' | 'Kemasan Rusak' | 'Aroma Asam'>('Kadar Air Tinggi');
  const [severity, setSeverity] = useState<'TINGGI' | 'SEDANG' | 'RENDAH'>('TINGGI');
  const [description, setDescription] = useState('Pemeriksaan laboratorium pre-shipment menemukan kadar air di atas 2.4%, berisiko caking/menggumpal.');

  const activeCase = complaints.find((c) => c.id === selectedCaseId) || complaints[0];

  const handleRunAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setImpactScope({
        backwardFarmers: [
          'Pak Slamet Riyadi (Kelompok Tani Nira Lestari - Somagede)',
          'Pak Sugeng Wahyudi (Kelompok Tani Nira Makmur - Kulon Progo)',
        ],
        affectedLots: [activeCase.relatedLotCode],
        affectedPackages: ['PKG-2026-0001', 'PKG-2026-0002'],
        affectedBuyers: ['PT Java Agro Organics (Rotterdam)', 'CV Nusantara Spices (Surabaya)'],
        recommendedAction: 'Lakukan penahanan pengiriman (containment) untuk seluruh pouch pada batch ini dan lakukan uji kadar air ulang.',
      });
      setAnalyzing(false);
    }, 800);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newComp = addComplaint({
      source: 'BUYER',
      buyerName,
      relatedLotCode,
      issueType,
      severity,
      description,
    });
    setSelectedCaseId(newComp.id);
    setShowNewModal(false);
  };

  const handleQuarantineAffectedLot = () => {
    if (!activeCase) return;
    const target = lots.find(l => l.lotCode === activeCase.relatedLotCode);
    if (target) {
      quarantineLot(target.id, `Karantina darurat terkait kasus komplain ${activeCase.caseCode}: ${activeCase.description}`);
      alert(`Lot ${target.lotCode} telah resmi dipindahkan ke ruang KARANTINA.`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            Keluhan Pembeli & Analisis Dampak Penarikan (Recall)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Skenario investigasi penarikan produk (PRD §24 & §81): Hubungkan keluhan mitra pembeli dengan akar masalah di pabrik dan kelompok petani penderes.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <PlusCircle size={15} />
          Catat Keluhan Pembeli Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Kasus Komplain */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Daftar Keluhan ({complaints.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {complaints.map((c) => {
              const isSelected = activeCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    setImpactScope(null);
                  }}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'border-red-500 bg-red-50/50 ring-1 ring-red-400'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-xs text-foreground">{c.caseCode}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {c.status === 'RESOLVED' ? 'SELESAI' : 'BUTUH TINDAKAN'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-foreground mt-1 line-clamp-1">{c.buyerName}</p>
                  <p className="text-[11px] font-mono text-primary mt-0.5">Lot Terkait: {c.relatedLotCode}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{c.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Investigasi & Analisis Dampak */}
        <div className="md:col-span-2 space-y-5">
          {activeCase ? (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-mono text-foreground">{activeCase.caseCode}</h2>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                      Tingkat Keparahan: {activeCase.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pelapor: <strong>{activeCase.buyerName}</strong> · Tanggal: {activeCase.reportedDate}
                  </p>
                </div>

                {activeCase.status !== 'RESOLVED' ? (
                  <button
                    onClick={() => resolveComplaint(activeCase.id, 'Kasus diselesaikan.')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Tandai Kasus Selesai
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1">
                    <CheckCircle size={14} /> Selesai Diinvestigasi
                  </span>
                )}
              </div>

              {/* Rincian Keluhan */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                  <span className="text-muted-foreground">Jenis Masalah Mutu:</span>
                  <p className="font-bold text-sm text-foreground">{activeCase.issueType}</p>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                  <span className="text-muted-foreground">Lot Terkait:</span>
                  <p className="font-bold text-sm font-mono text-primary">{activeCase.relatedLotCode}</p>
                </div>

                <div className="col-span-2 p-3 bg-muted/20 border border-border rounded-lg space-y-1">
                  <span className="text-muted-foreground">Uraian Masalah dari Pembeli:</span>
                  <p className="text-foreground leading-relaxed">{activeCase.description}</p>
                </div>
              </div>

              {/* Tombol Analisis Dampak Penarikan */}
              <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitMerge className="text-red-600" size={18} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-red-950">
                      Mesin Analisis Dampak Penarikan (Impact Analysis Engine)
                    </h3>
                  </div>
                  <button
                    onClick={handleRunAnalysis}
                    disabled={analyzing}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {analyzing ? 'Menghitung Silsilah…' : 'Jalankan Analisis Dampak Otomatis'}
                  </button>
                </div>

                {impactScope && (
                  <div className="pt-3 border-t border-red-200 space-y-3 text-xs animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg border border-red-200 space-y-1.5">
                        <span className="font-bold text-red-950 flex items-center gap-1.5">
                          <Droplets size={14} className="text-blue-600" />
                          Akar Nira Mentah (Penelusuran Mundur):
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
                          {impactScope.backwardFarmers.map((f: string, idx: number) => (
                            <li key={idx} className="font-medium text-foreground">{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-red-200 space-y-1.5">
                        <span className="font-bold text-red-950 flex items-center gap-1.5">
                          <Package size={14} className="text-emerald-600" />
                          Kemasan Terdampak (Penelusuran Maju):
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {impactScope.affectedPackages.map((p: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-muted rounded font-mono text-[11px] text-foreground">
                              {p}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Estimasi 60 unit pouch siap tahan di gudang.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 space-y-2">
                      <span className="font-bold">Rekomendasi Tindakan Cepat (Containment):</span>
                      <p className="text-[11px]">{impactScope.recommendedAction}</p>
                      <button
                        onClick={handleQuarantineAffectedLot}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-md cursor-pointer"
                      >
                        Karantina Lot {activeCase.relatedLotCode} Sekarang
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-12 text-center text-muted-foreground text-xs">
              Pilih keluhan di sebelah kiri untuk melihat proses investigasi.
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Keluhan Baru */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Registrasi Keluhan Mitra Pembeli / Komplain B2B
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">Nama Mitra Pembeli / Agregator *</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs bg-background"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-foreground">Lot Terkait *</label>
                  <select
                    value={relatedLotCode}
                    onChange={(e) => setRelatedLotCode(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg text-xs bg-background"
                    required
                  >
                    {lots.filter(l => l.type === 'PROCESSED').map(l => (
                      <option key={l.id} value={l.lotCode}>{l.lotCode} — {l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-foreground">Tingkat Keparahan *</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full p-2 border border-border rounded-lg text-xs bg-background"
                  >
                    <option value="TINGGI">TINGGI (Potensi Penarikan)</option>
                    <option value="SEDANG">SEDANG (Uji Lab Ulang)</option>
                    <option value="RENDAH">RENDAH (Koreksi Kemasan)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">Jenis Masalah Mutu *</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as any)}
                  className="w-full p-2 border border-border rounded-lg text-xs bg-background"
                >
                  <option value="Kadar Air Tinggi">Kadar Air Tinggi (&gt; 2.0%)</option>
                  <option value="Gumpalan/Caking">Gumpalan/Caking di Pouch</option>
                  <option value="Kemasan Rusak">Seal Kemasan Rusak / Bocor</option>
                  <option value="Aroma Asam">Aroma Asam (Fermentasi Nira)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">Deskripsi & Temuan Pembeli</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs bg-background"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
                >
                  Simpan & Buka Investigasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
