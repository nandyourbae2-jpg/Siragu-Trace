import { useState } from 'react';
import { 
  FileBarChart, 
  Filter, 
  Download, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileSpreadsheet,
  FileCheck,
  Calendar,
  Building2
} from 'lucide-react';
import { useDemoData } from '../context/DemoDataContext';

export const ReportsPage = () => {
  const { lots, packages, complaints, sensors } = useDemoData();

  const [activeReport, setActiveReport] = useState<
    'TRACEABILITY' | 'MASS_BALANCE' | 'COMPLAINT' | 'ENVIRONMENTAL'
  >('TRACEABILITY');
  const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [jobs, setJobs] = useState<any[]>([
    {
      id: 'job-init-01',
      reportType: 'TRACEABILITY',
      title: 'Laporan Ketertelusuran B2B Q3 2026',
      format: 'PDF',
      status: 'COMPLETED',
      createdAt: 'Hari ini, 10:15 WIB',
    },
  ]);

  const [dateRange, setDateRange] = useState('Bulan Ini (September 2026)');
  const [selectedSite, setSelectedSite] = useState('Semua Pos Timbang & Pabrik');

  const handleExport = () => {
    const reportTitles = {
      TRACEABILITY: 'Laporan Ketertelusuran Silsilah Lengkap',
      MASS_BALANCE: 'Laporan Neraca Massa & Rendemen Kristalisasi',
      COMPLAINT: 'Laporan Investigasi Keluhan & Penarikan',
      ENVIRONMENTAL: 'Laporan Telemetri Lingkungan Gudang',
    };

    const newJob = {
      id: `job-${Date.now()}`,
      reportType: activeReport,
      title: reportTitles[activeReport],
      format: exportFormat,
      status: 'PROCESSING',
      createdAt: 'Baru saja',
    };

    setJobs([newJob, ...jobs]);

    // Simulasi Background Async Job (§63)
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) => (j.id === newJob.id ? { ...j, status: 'COMPLETED' } : j))
      );
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <FileBarChart className="text-primary" size={24} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pusat Laporan & Audit Kepatuhan Regulasi
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Hasilkan laporan resmi bersertifikasi untuk keperluan inspeksi audit organik (Control Union / SNI) dan verifikasi mitra pembeli.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Kolom Kiri: Pilihan Jenis Laporan */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Pilihan Jenis Laporan
          </div>

          {[
            {
              id: 'TRACEABILITY',
              label: 'Laporan Ketertelusuran',
              desc: 'Silsilah dari petani nira hingga kemasan pouch',
            },
            {
              id: 'MASS_BALANCE',
              label: 'Laporan Neraca Massa',
              desc: 'Rendemen kristalisasi dan akurasi volume masuk vs keluar',
            },
            {
              id: 'COMPLAINT',
              label: 'Laporan Investigasi Keluhan',
              desc: 'Riwayat komplain mutu dan tindakan pencegahan (CAPA)',
            },
            {
              id: 'ENVIRONMENTAL',
              label: 'Laporan Telemetri Lingkungan',
              desc: 'Log suhu/kelembaban gudang penyimpanan dengan aturan BR-011',
            },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id as any)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                activeReport === r.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-surface text-foreground border-border hover:border-border/80'
              }`}
            >
              <div className="font-bold text-xs">{r.label}</div>
              <div
                className={`text-[11px] mt-1 line-clamp-2 ${
                  activeReport === r.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}
              >
                {r.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Kolom Kanan: Filter & Konfigurasi Ekspor Laporan */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Filter size={18} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground">Filter Parameter Laporan</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Rentang Periode Tanggal</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-lg text-xs bg-background"
                >
                  <option value="Hari Ini">Hari Ini (26 September 2026)</option>
                  <option value="7 Hari Terakhir">7 Hari Terakhir</option>
                  <option value="Bulan Ini (September 2026)">Bulan Ini (September 2026)</option>
                  <option value="Kuartal 3 (Q3 2026)">Kuartal 3 (Juli - September 2026)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Lokasi Fasilitas / Pos Timbang</label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-lg text-xs bg-background"
                >
                  <option value="Semua Pos Timbang & Pabrik">Semua Pos Timbang & Pabrik</option>
                  <option value="Pos Timbang Somagede (Banyumas)">Pos Timbang Somagede (Banyumas)</option>
                  <option value="Pos Timbang Hargorejo (Kulon Progo)">Pos Timbang Hargorejo (Kulon Progo)</option>
                  <option value="Pabrik Pengolahan Serang (Purbalingga)">Pabrik Pengolahan Serang (Purbalingga)</option>
                </select>
              </div>
            </div>

            {/* Pilihan Format Unduhan */}
            <div className="p-4 bg-muted/30 border border-border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-foreground block">Format Berkas Laporan:</span>
                <span className="text-[11px] text-muted-foreground">
                  Pilih PDF untuk laporan cetak resmi, atau CSV untuk analisis data spreadsheet.
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('PDF')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    exportFormat === 'PDF'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <FileText size={14} /> PDF Resmi
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('CSV')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    exportFormat === 'CSV'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <FileSpreadsheet size={14} /> Berkas CSV
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleExport}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download size={15} />
                Generate & Unduh Laporan Sekarang
              </button>
            </div>
          </div>

          {/* Daftar Antrean & Riwayat Unduhan (Async Job Worker) */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-foreground">Berkas Laporan Siap Unduh ({jobs.length})</h2>
              <span className="text-[11px] text-muted-foreground">Proses asinkron bebas blokir UI (§63)</span>
            </div>

            <div className="divide-y divide-border/60">
              {jobs.map((job) => (
                <div key={job.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        job.format === 'PDF'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {job.format}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{job.title}</div>
                      <div className="text-[11px] text-muted-foreground">{job.createdAt}</div>
                    </div>
                  </div>

                  <div>
                    {job.status === 'PROCESSING' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5">
                        <Clock size={12} className="animate-spin" /> Sedang Diproses…
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          alert(`Simulasi: Mengunduh ${job.title}.${job.format.toLowerCase()}`)
                        }
                        className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download size={13} /> Unduh Berkas
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
