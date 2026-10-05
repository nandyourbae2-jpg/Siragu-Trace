import { useState } from 'react';
import { 
  Flame, 
  Droplets, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Calculator, 
  TrendingUp, 
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useDemoData } from '../context/DemoDataContext';

export function Actions() {
  const navigate = useNavigate();
  const { lots, addProcessingBatch } = useDemoData();

  // Ambil nira yang belum diproses atau yang siap diolah
  const availableNiraLots = lots.filter((l) => l.type === 'RAW_ORGANIC');

  const [selectedNiraIds, setSelectedNiraIds] = useState<string[]>(
    availableNiraLots.slice(0, 1).map((l) => l.id)
  );
  const [outputKg, setOutputKg] = useState('75');
  const [moisture, setMoisture] = useState('1.8');
  const [sucrose, setSucrose] = useState('84.2');
  const [notes, setNotes] = useState('Pemasakan wajan tembaga suhu 115°C, pengadukan kristalisasi manual, pengayakan mesh 18.');
  const [successCode, setSuccessCode] = useState<string | null>(null);

  // Hitung total input
  const totalInput = availableNiraLots
    .filter((l) => selectedNiraIds.includes(l.id))
    .reduce((sum, l) => sum + l.quantity, 0);

  const outputKgNum = parseFloat(outputKg) || 0;
  const moistureNum = parseFloat(moisture) || 0;
  const sucroseNum = parseFloat(sucrose) || 0;

  // Hitung Rendemen (Yield)
  const calculatedYield = totalInput > 0 ? (outputKgNum / totalInput) * 100 : 0;
  const isYieldNormal = (calculatedYield >= 11.5 && calculatedYield <= 15.5) || (calculatedYield >= 85.0 && calculatedYield <= 98.0);
  const isMoistureSNI = moistureNum <= 2.0;

  const toggleSelectLot = (id: string) => {
    if (selectedNiraIds.includes(id)) {
      if (selectedNiraIds.length > 1) {
        setSelectedNiraIds(selectedNiraIds.filter((item) => item !== id));
      }
    } else {
      setSelectedNiraIds([...selectedNiraIds, id]);
    }
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNiraIds.length === 0 || outputKgNum <= 0) return;

    const newLot = addProcessingBatch({
      inputLotIds: selectedNiraIds,
      outputQuantityKg: outputKgNum,
      notes: `${notes} (Air: ${moistureNum}%, Sukrosa: ${sucroseNum}%)`,
      createdBy: 'Operator Kristalisasi',
    });

    setSuccessCode(newLot.lotCode);
    setTimeout(() => setSuccessCode(null), 5000);
  };

  const processedLots = lots.filter((l) => l.type === 'PROCESSED');

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Flame className="text-amber-500" size={24} />
          Proses Pengolahan & Kristalisasi Gula Semut
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transformasikan nira mentah menjadi butiran gula semut kristal organik, dengan validasi neraca massa (*mass balance yield*) dan pemantauan standar mutu SNI.
        </p>
      </div>

      {successCode && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-950 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-sm">Batch Kristalisasi Berhasil Diterbitkan!</span>
              <p>
                Kode Lot Olahan: <strong className="font-mono">{successCode}</strong>. Jika kadar air &le; 2.0%, lot otomatis masuk ke <strong>Gerbang Rilis (Release Gate)</strong> untuk verifikasi persetujuan 4-mata.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/app/operations/release')}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
          >
            Buka Gerbang Rilis
          </button>
        </div>
      )}

      {/* Formulir Pemasakan & Kristalisasi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-foreground">Formulir Produksi Batch Baru</h2>

          <form onSubmit={handleProcessSubmit} className="space-y-5">
            {/* Langkah 1: Pilih Lot Nira Asal */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                1. Pilih Bahan Baku Nira Masuk (Dapat Digabung / Mixing) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableNiraLots.map((nira) => {
                  const isSelected = selectedNiraIds.includes(nira.id);
                  return (
                    <div
                      key={nira.id}
                      onClick={() => toggleSelectLot(nira.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-background hover:border-border/80'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-bold text-foreground">{nira.lotCode}</span>
                        <span className="font-bold text-primary">{nira.quantity} {nira.unit}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Petani: {nira.farmerName}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                        {nira.notes || 'Siap Proses'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground pt-1 flex justify-between">
                <span>Total Nira Digunakan:</span>
                <span className="font-bold text-foreground">{totalInput} Kg</span>
              </div>
            </div>

            {/* Langkah 2: Parameter Hasil Olahan */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                2. Hasil Akhir Gula Semut Kering (Mesh 16-18) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">
                    Berat Gula Kristal (Kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={outputKg}
                    onChange={(e) => setOutputKg(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                    placeholder="misal: 65"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">
                    Kadar Air Uji Oven (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={moisture}
                    onChange={(e) => setMoisture(e.target.value)}
                    className={`w-full p-2 border rounded-lg text-xs bg-background focus:outline-none font-bold ${
                      !isMoistureSNI ? 'border-red-500 text-red-700' : 'border-border'
                    }`}
                    placeholder="SNI: < 2.0%"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Maks SNI: 2.0%</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-foreground">
                    Kadar Sukrosa (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={sucrose}
                    onChange={(e) => setSucrose(e.target.value)}
                    className="w-full p-2 border border-border rounded-lg text-xs bg-background focus:outline-none font-bold"
                    placeholder="SNI: > 80%"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Min SNI: 80%</p>
                </div>
              </div>
            </div>

            {/* Catatan Operasional */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Catatan Proses & Operator Wajan
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Save size={16} />
              Simpan Batch & Alirkan ke Release Gate
            </button>
          </form>
        </div>

        {/* Panel Neraca Massa & Analisis Rendemen */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Neraca Massa (Mass Balance)</h3>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl space-y-3">
              <div>
                <span className="text-[11px] text-muted-foreground">Kalkulasi Rendemen:</span>
                <div className="text-2xl font-bold text-foreground mt-0.5">
                  {calculatedYield.toFixed(1)}%
                </div>
              </div>

              <div className={`p-2.5 rounded-lg text-xs font-medium ${
                isYieldNormal
                  ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-200'
                  : 'bg-amber-100/80 text-amber-900 border border-amber-200'
              }`}>
                {isYieldNormal ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                    <span>Rendemen Normal (Standar input ke output).</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <span>Peringatan: Deviasi neraca massa terdeteksi. Periksa kebocoran wajan atau kadar brix input.</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border">
                <div className="flex justify-between">
                  <span>Input Nira:</span>
                  <span className="font-semibold text-foreground">{totalInput} Kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Output Gula Kristal:</span>
                  <span className="font-semibold text-foreground">{outputKgNum} Kg</span>
                </div>
              </div>
            </div>

            {/* Aturan SNI Gatekeeper */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-950 space-y-1">
              <span className="font-bold flex items-center gap-1">
                Aturan SNI Otomatis:
              </span>
              <p className="text-[11px] leading-relaxed text-blue-900">
                Jika kadar air di atas 2.0%, sistem otomatis mengisolasi lot ke status <strong>QUARANTINED</strong> untuk pengeringan ulang dan mencegah pembuatan label kemasan QR.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Histori Batch Kristalisasi */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-foreground">Histori Batch Kristalisasi ({processedLots.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3">Kode Lot Olahan</th>
                <th className="p-3">Berat Gula (Kg)</th>
                <th className="p-3">Rendemen (%)</th>
                <th className="p-3">Kadar Air</th>
                <th className="p-3">Sukrosa</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {processedLots.map((lot) => (
                <tr key={lot.id} className="hover:bg-muted/30">
                  <td className="p-3 font-mono font-bold text-foreground">{lot.lotCode}</td>
                  <td className="p-3 font-bold text-foreground">{lot.quantity} Kg</td>
                  <td className="p-3 font-semibold text-foreground">{lot.yieldPercentage}%</td>
                  <td className="p-3">
                    <span className={`font-semibold ${lot.moistureContent && lot.moistureContent > 2.0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {lot.moistureContent}%
                    </span>
                  </td>
                  <td className="p-3">{lot.sucroseContent}%</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      lot.status === 'RELEASED' ? 'bg-emerald-100 text-emerald-800' :
                      lot.status === 'QUARANTINED' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {lot.status === 'RELEASED' ? 'Lolos Rilis' : lot.status === 'QUARANTINED' ? 'Karantina' : 'Menunggu Rilis'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => navigate(`/app/trace?q=${lot.lotCode}`)}
                      className="text-primary hover:underline font-medium flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      Silsilah
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
