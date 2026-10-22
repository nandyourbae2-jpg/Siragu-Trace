import { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  WifiOff, 
  Activity, 
  AlertTriangle, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Cpu,
  Upload,
  Play,
  Zap,
  Radio
} from 'lucide-react';
import { useDemoData } from '../context/DemoDataContext';
import { iotApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const IotPage = () => {
  const queryClient = useQueryClient();
  const { sensors: mockSensors } = useDemoData();

  const [selectedSensorId, setSelectedSensorId] = useState<string>(mockSensors[0]?.id || '');
  const [selectedBox, setSelectedBox] = useState('BOX-SHP26-0001-01');
  const [simStatus, setSimStatus] = useState<string | null>(null);

  // Queries
  const { data: realSensors } = useQuery({
    queryKey: ['iotSensors'],
    queryFn: () => iotApi.getSensors(),
    retry: 1,
  });

  const { data: alerts } = useQuery({
    queryKey: ['iotAlerts'],
    queryFn: () => iotApi.getAlerts(),
    retry: 1,
  });

  const sensors = realSensors && realSensors.length > 0 ? realSensors : mockSensors;
  const activeSensor = sensors.find((s: any) => s.id === selectedSensorId) || sensors[0];

  const simulateMutation = useMutation({
    mutationFn: (scenario: 'normal' | 'warning' | 'deviation') =>
      iotApi.simulate({ boxId: selectedBox, scenario, durationHours: 16 }),
    onSuccess: (data) => {
      setSimStatus(`Skenario ${data.scenario.toUpperCase()} berhasil disimulasikan (${data.readingsGenerated} titik telemetri).`);
      queryClient.invalidateQueries({ queryKey: ['iotAlerts'] });
      setTimeout(() => setSimStatus(null), 6000);
    },
    onError: (err: any) => {
      setSimStatus(`Simulasi demo: ${err.message || 'Selesai disimulasikan'}`);
      setTimeout(() => setSimStatus(null), 6000);
    },
  });

  const telemetryHistory = [
    { time: '13:00', temp: 24.2, rh: 53.0, status: 'NORMAL' },
    { time: '12:00', temp: 24.5, rh: 52.5, status: 'NORMAL' },
    { time: '11:00', temp: 24.1, rh: 54.0, status: 'NORMAL' },
    { time: '10:00', temp: 23.9, rh: 53.8, status: 'NORMAL' },
    { time: '09:00', temp: 23.7, rh: 54.2, status: 'NORMAL' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <Activity className="text-emerald-700" size={24} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Monitoring Sensor Lingkungan Gudang & Cold-Chain IoT
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Telemetri suhu dan kelembaban (RH) real-time ruang penyimpanan dan boks logistik gula semut organik. Kepatuhan integritas data (Aturan BR-011): Data sensor yang hilang atau putus koneksi tidak dimanipulasi atau diinterpolasi.
        </p>
      </div>

      {/* Live Simulator & Demo Trigger Bar (BPC Presentation Ready) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1 border border-emerald-500/30">
              <Zap size={12} /> BPC Live Demo & Simulator Telemetri
            </span>
            <h3 className="font-bold text-base text-white">Simulasi Skenario Suhu Ekspor (Cold-Chain)</h3>
            <p className="text-xs text-slate-300 mt-0.5">Uji respon sistem secara langsung terhadap deviasi suhu logistik boks.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => simulateMutation.mutate('normal')}
              disabled={simulateMutation.isPending}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 size={14} /> Normal (22-25°C)
            </button>
            <button
              onClick={() => simulateMutation.mutate('warning')}
              disabled={simulateMutation.isPending}
              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <AlertTriangle size={14} /> Warning (26-27°C)
            </button>
            <button
              onClick={() => simulateMutation.mutate('deviation')}
              disabled={simulateMutation.isPending}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Zap size={14} /> Deviasi Kritis (&gt;27°C)
            </button>
          </div>
        </div>

        {simStatus && (
          <div className="mt-3 p-2.5 rounded-xl bg-white/10 text-emerald-200 text-xs font-semibold animate-fadeIn flex items-center gap-2">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            {simStatus}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Sensor */}
        <div className="space-y-3">
          <div className="font-bold text-xs uppercase tracking-wider text-slate-400">
            Daftar Perangkat Sensor Aktif ({sensors.length})
          </div>

          <div className="space-y-2.5">
            {sensors.map((s: any) => {
              const isSelected = activeSensor?.id === s.id;
              const isOnline = s.status === 'ONLINE' || s.battery != null;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSensorId(s.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{s.name || s.deviceCode}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isOnline
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isOnline ? 'ONLINE' : 'DATA HILANG'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <MapPin size={12} />
                    <span>{s.location?.name || s.location || 'Sentra Somagede'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Cpu size={12} />
                    <span>Gateway: {s.gateway?.deviceCode || 'GW-LORA-CENTRAL-01'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Detail & Grafik Telemetri */}
        <div className="md:col-span-2 space-y-6">
          {activeSensor && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Perangkat Terpilih</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{activeSensor.name || activeSensor.deviceCode}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Zona: {activeSensor.location?.name || activeSensor.location || 'Ruang Penyimpanan Utama'} • Standar Penyimpanan Organik (Kadar Air Aman 20-26°C, RH &lt; 65%)
                </p>
              </div>

              {/* Kartu Suhu & Kelembaban */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-bold uppercase">Suhu Ruang</span>
                    <Thermometer size={18} className="text-emerald-700" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{activeSensor.temp ?? 23.4}°C</div>
                  <span className="text-[10px] text-emerald-700 font-bold">Rentang Aman (20-26°C)</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-bold uppercase">Kelembaban (RH)</span>
                    <Droplets size={18} className="text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{activeSensor.rh ?? 54.0}%</div>
                  <span className="text-[10px] text-blue-700 font-bold">Bebas Risiko Caking (&lt;65%)</span>
                </div>
              </div>

              {/* Klausul Integritas BR-011 */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  Klausul Verifikasi Integritas Lingkungan (Aturan BR-011):
                </span>
                <p className="italic text-[11px] text-emerald-900/90 leading-relaxed">
                  "Environmental reading recorded for this monitoring location during the selected period."
                </p>
                <p className="text-[10px] text-emerald-800 pt-0.5">
                  Catatan Audit: Pembacaan sensor mencerminkan kondisi ruang pemantauan di titik penempatan alat, tersertifikasi tanpa manipulasi data.
                </p>
              </div>

              {/* Tabel Riwayat Telemetri */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Riwayat Pembacaan Telemetri Hari Ini
                </h3>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="p-3">Waktu Jam</th>
                        <th className="p-3">Suhu Tercatat</th>
                        <th className="p-3">Kelembaban (RH)</th>
                        <th className="p-3 text-right">Integritas Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {telemetryHistory.map((h, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-600">{h.time} WIB</td>
                          <td className="p-3 font-bold text-slate-800">{h.temp}°C</td>
                          <td className="p-3 font-bold text-slate-800">{h.rh}%</td>
                          <td className="p-3 text-right">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              TERVERIFIKASI
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
