import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building2, 
  ShieldCheck, 
  Sliders, 
  RefreshCw, 
  Save, 
  CheckCircle2, 
  Database,
  Cpu
} from 'lucide-react';
import { useDemoData } from '../context/DemoDataContext';

export function Settings() {
  const { resetDemoData } = useDemoData();
  const [saved, setSaved] = useState(false);

  // State Pengaturan
  const [orgName, setOrgName] = useState('Koperasi Produsen Nira Lestari');
  const [regency, setRegency] = useState('Banyumas, Jawa Tengah');
  const [certNo, setCertNo] = useState('CU-ID-ORG-849201');
  const [maxMoisture, setMaxMoisture] = useState('2.0');
  const [minSucrose, setMinSucrose] = useState('80.0');
  const [minYield, setMinYield] = useState('11.5');
  const [maxYield, setMaxYield] = useState('15.5');
  const [maxHumidity, setMaxHumidity] = useState('60');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang (reset) seluruh data demo ke kondisi awal pabrik?')) {
      resetDemoData();
      alert('Data simulasi demo berhasil dikembalikan ke kondisi awal!');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <SettingsIcon className="text-primary" size={24} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pengaturan Sistem & Parameter Kepatuhan Mutu
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Konfigurasi profil koperasi, parameter batas uji SNI 01-3743-1995, dan manajemen data demo.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600" />
          Konfigurasi sistem berhasil disimpan dan diterapkan pada seluruh gerbang verifikasi.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Profil Koperasi / UMKM */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Profil Koperasi & Pabrik Pengolahan</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-foreground">Nama Koperasi / Perusahaan</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full p-2.5 border border-border rounded-lg bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-foreground">Wilayah / Sentra Pabrik</label>
              <input
                type="text"
                value={regency}
                onChange={(e) => setRegency(e.target.value)}
                className="w-full p-2.5 border border-border rounded-lg bg-background"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block font-semibold text-foreground">Nomor Sertifikasi Organik (Control Union / EU)</label>
              <input
                type="text"
                value={certNo}
                onChange={(e) => setCertNo(e.target.value)}
                className="w-full p-2.5 border border-border rounded-lg bg-background font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* 2. Parameter Standar Mutu SNI & Neraca Massa */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Parameter Ambang Batas Gerbang Rilis (SNI 01-3743-1995)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-foreground">Kadar Air Maksimum (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={maxMoisture}
                  onChange={(e) => setMaxMoisture(e.target.value)}
                  className="w-full p-2.5 pr-8 border border-border rounded-lg bg-background font-bold"
                  required
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">SNI: &le; 2.0%</p>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-foreground">Kadar Sukrosa Minimum (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={minSucrose}
                  onChange={(e) => setMinSucrose(e.target.value)}
                  className="w-full p-2.5 pr-8 border border-border rounded-lg bg-background font-bold"
                  required
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">SNI: &ge; 80.0%</p>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-foreground">Kelembaban Maks Gudang (RH)</label>
              <div className="relative">
                <input
                  type="number"
                  value={maxHumidity}
                  onChange={(e) => setMaxHumidity(e.target.value)}
                  className="w-full p-2.5 pr-8 border border-border rounded-lg bg-background font-bold"
                  required
                />
                <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Mencegah gula menggumpal</p>
            </div>
          </div>
        </div>

        {/* 3. Manajemen State Demo */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Manajemen Data Demo Simulasi</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Data demo disimpan pada memori browser Anda. Jika Anda ingin mengembalikan seluruh lot, pengujian, dan komplain ke kondisi awal pabrik, klik tombol reset di bawah ini.
          </p>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw size={14} />
            Reset Seluruh Data Simulasi ke Standar Awal
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Save size={15} />
            Simpan Konfigurasi Sistem
          </button>
        </div>
      </form>
    </div>
  );
}
