import { useState } from 'react';
import { 
  ClipboardCheck, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  PlusCircle, 
  TestTube, 
  ShieldCheck,
  XCircle,
  FileDown
} from 'lucide-react';
import { useDemoData } from '../../context/DemoDataContext';

export const QAInspectionsPage = () => {
  const { lots, inspections, submitReleaseDecision } = useDemoData();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [lotCode, setLotCode] = useState(lots.find(l => l.type === 'PROCESSED')?.lotCode || '');
  const [moisture, setMoisture] = useState('1.8');
  const [sucrose, setSucrose] = useState('84.5');
  const [ash, setAsh] = useState('1.5');
  const [color, setColor] = useState('Coklat Muda Keemasan Bersih');
  const [aroma, setAroma] = useState('Khas Nira Segar Karamel Alami');
  const [notes, setNotes] = useState('Uji laboratorium internal memenuhi seluruh parameter SNI 01-3743-1995.');

  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const moistureNum = parseFloat(moisture) || 0;
    const sucroseNum = parseFloat(sucrose) || 0;
    const ashNum = parseFloat(ash) || 0;

    const targetLot = lots.find(l => l.lotCode === lotCode);
    const isPassed = moistureNum <= 2.0 && sucroseNum >= 80.0;

    submitReleaseDecision({
      lotId: targetLot?.id || 'lot-unknown',
      inspectorName: 'Kavitha Nair (Lead QA & QC Specialist)',
      moisture: moistureNum,
      sucrose: sucroseNum,
      ashContent: ashNum,
      organolepticColor: color,
      organolepticAroma: aroma,
      microbialTest: 'PASSED',
      notes,
    });

    setShowAddModal(false);
  };

  const pendingLots = lots.filter(l => l.type === 'PROCESSED' && l.status === 'PENDING_RELEASE');

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardCheck className="text-primary" size={24} />
            Inspeksi Kualitas & Uji Mutu Laboratorium (QA/QC)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pencatatan pengujian kimia, fisik, dan mikrobiologi gula semut sesuai Standar Nasional Indonesia (SNI 01-3743-1995).
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-lg shadow-xs hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle size={16} />
          Catat Hasil Uji Laboratorium
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-2 font-bold text-xs transition-colors cursor-pointer ${
            activeTab === 'pending'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Menunggu Verifikasi Pengujian ({pendingLots.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-2 font-bold text-xs transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Riwayat Sertifikat Uji Lab ({inspections.length})
        </button>
      </div>

      {/* Tab: Menunggu Verifikasi */}
      {activeTab === 'pending' && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Kode Lot</th>
                <th className="p-3.5">Nama Produk</th>
                <th className="p-3.5">Metode Uji Wajib</th>
                <th className="p-3.5">Waktu Registrasi</th>
                <th className="p-3.5">Status Pengujian</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {pendingLots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Semua lot hasil olahan telah selesai diuji laboratorium.
                  </td>
                </tr>
              ) : (
                pendingLots.map(item => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="p-3.5 font-mono font-bold text-foreground">{item.lotCode}</td>
                    <td className="p-3.5 font-medium text-foreground">{item.name}</td>
                    <td className="p-3.5 text-muted-foreground">SNI Uji Kadar Air, Sukrosa & Abu</td>
                    <td className="p-3.5 text-muted-foreground">{item.createdAt}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        PENDING
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setLotCode(item.lotCode);
                          setShowAddModal(true);
                        }}
                        className="px-3 py-1 bg-primary text-primary-foreground font-semibold rounded-md text-[11px] hover:bg-primary/90 cursor-pointer"
                      >
                        Input Hasil Uji
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Riwayat Sertifikat Uji Lab */}
      {activeTab === 'history' && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Kode Lot</th>
                <th className="p-3.5">Analis Mutu</th>
                <th className="p-3.5">Kadar Air (Maks 2.0%)</th>
                <th className="p-3.5">Sukrosa (Min 80%)</th>
                <th className="p-3.5">Uji Organoleptik</th>
                <th className="p-3.5">Hasil Keputusan</th>
                <th className="p-3.5 text-right">Sertifikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {inspections.map(item => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="p-3.5 font-mono font-bold text-foreground">{item.lotCode}</td>
                  <td className="p-3.5 text-foreground">{item.inspectorName}</td>
                  <td className="p-3.5 font-semibold">
                    <span className={item.moisture > 2.0 ? 'text-red-600 font-bold' : 'text-emerald-700'}>
                      {item.moisture}%
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-foreground">{item.sucrose}%</td>
                  <td className="p-3.5 text-muted-foreground">{item.organolepticColor}</td>
                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'PASSED' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {item.status === 'PASSED' ? 'Lulus SNI' : 'Gagal / Karantina'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => alert(`Simulasi: Mengunduh Sertifikat Analisis (COA) resmi untuk ${item.lotCode} (Format PDF)`)}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer"
                    >
                      <FileDown size={14} />
                      Unduh COA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Input Hasil Uji */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <TestTube size={18} className="text-primary" />
              Catat Hasil Analisis Laboratorium Baru
            </h3>

            <form onSubmit={handleAddInspection} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">Pilih Kode Lot Olahan *</label>
                <select
                  value={lotCode}
                  onChange={(e) => setLotCode(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs bg-background"
                  required
                >
                  {lots.filter(l => l.type === 'PROCESSED').map(l => (
                    <option key={l.id} value={l.lotCode}>{l.lotCode} — {l.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">Kadar Air (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moisture}
                    onChange={(e) => setMoisture(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg text-xs bg-background font-bold"
                    placeholder="< 2.0"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground">Maks 2.0%</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">Sukrosa (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sucrose}
                    onChange={(e) => setSucrose(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg text-xs bg-background font-bold"
                    placeholder="> 80%"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground">Min 80%</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">Kadar Abu (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ash}
                    onChange={(e) => setAsh(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg text-xs bg-background font-bold"
                    placeholder="< 2.0"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground">Maks 2.0%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">Warna Organoleptik</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">Catatan Analis</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg text-xs bg-background"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90"
                >
                  Simpan Hasil Uji Mutu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
