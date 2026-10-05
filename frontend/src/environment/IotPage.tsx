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
  Cpu
} from 'lucide-react';
import { useDemoData } from '../context/DemoDataContext';

export const IotPage = () => {
  const { sensors } = useDemoData();
  const [selectedSensorId, setSelectedSensorId] = useState<string>(sensors[0]?.id || '');

  const activeSensor = sensors.find((s) => s.id === selectedSensorId) || sensors[0];

  const telemetryHistory = [
    { time: '13:00', temp: 24.2, rh: 53.0, status: 'NORMAL' },
    { time: '12:00', temp: 24.5, rh: 52.5, status: 'NORMAL' },
    { time: '11:00', temp: 24.1, rh: 54.0, status: 'NORMAL' },
    { time: '10:00', temp: 23.9, rh: 53.8, status: 'NORMAL' },
    { time: '09:00', temp: 23.7, rh: 54.2, status: 'NORMAL' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <Activity className="text-teal-600" size={24} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Monitoring Sensor Lingkungan Gudang (IoT Telemetry)
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Telemetri suhu dan kelembaban (RH) ruang penyimpanan gula semut. Kepatuhan integritas data (Aturan BR-011): Data sensor yang hilang atau putus koneksi tidak dimanipulasi/diinterpolasi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Sensor */}
        <div className="space-y-3">
          <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Daftar Perangkat Sensor Aktif ({sensors.length})
          </div>

          <div className="space-y-2.5">
            {sensors.map((s) => {
              const isSelected = activeSensor?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSensorId(s.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-surface hover:border-border/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-mono font-bold text-sm text-foreground">{s.deviceCode}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.location}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                        s.status === 'ONLINE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {s.status === 'OFFLINE' && <WifiOff size={11} />}
                      {s.status === 'ONLINE' ? 'AKTIF ONLINE' : 'TERPUTUS / OFFLINE'}
                    </span>
                  </div>

                  <p className="text-[11px] text-foreground font-medium mb-3">{s.roomName}</p>

                  <div className="flex gap-4 pt-2 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Thermometer size={14} className="text-orange-500" />
                      {s.temperature !== null ? `${s.temperature}°C` : '--'}
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Droplets size={14} className="text-blue-500" />
                      {s.humidity !== null ? `${s.humidity}% RH` : '--'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Rincian Telemetri & Kepatuhan Aturan BR-011 */}
        <div className="md:col-span-2 space-y-5">
          {activeSensor && (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-mono text-foreground">{activeSensor.deviceCode}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                      LoRaWAN Gateway
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeSensor.roomName} — {activeSensor.location}
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-muted-foreground">Pembaruan Terakhir:</span>
                  <div className="font-semibold text-foreground">{activeSensor.lastSeen}</div>
                </div>
              </div>

              {/* Box Nilai Telemetri Live */}
              {activeSensor.status === 'ONLINE' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <Thermometer size={16} className="text-orange-500" />
                      <span>Suhu Udara Ruangan</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                      {activeSensor.temperature}°C
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">Batas ideal gudang gula semut: 20°C - 26°C</p>
                  </div>

                  <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <Droplets size={16} className="text-blue-500" />
                      <span>Kelembaban Relatif (RH)</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                      {activeSensor.humidity}%
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">Batas ideal mencegah caking: &lt; 60% RH</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-red-50/70 border border-red-200 rounded-xl space-y-2 text-xs text-red-950">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-900">
                    <WifiOff size={18} className="text-red-600" />
                    Peringatan: Sensor Tidak Terhubung / Data Hilang
                  </div>
                  <p className="leading-relaxed">
                    Sensor ini terputus sejak {activeSensor.lastSeen}. Sesuai dengan <strong>Aturan Bisnis BR-011</strong>: Sistem tidak melakukan interpolasi angka rata-rata atau rekayasa data. Riwayat tercatat resmi sebagai "DATA HILANG / TIDAK TERSEDIA".
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => alert('Simulasi: Mengirim sinyal ping restart ke LoRaWAN Gateway')}
                      className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-md font-semibold cursor-pointer"
                    >
                      Kirim Sinyal Ping Ulang Sensor
                    </button>
                  </div>
                </div>
              )}

              {/* Pernyataan Kepatuhan BR-011 (Wording Wajib) */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-900">
                  <ShieldCheck size={16} className="text-blue-600" />
                  Klausul Verifikasi Integritas Lingkungan (BR-011):
                </span>
                <p className="italic text-[11px] text-blue-900/90 leading-relaxed">
                  "Environmental reading recorded for this monitoring location during the selected period."
                </p>
                <p className="text-[10px] text-blue-800 pt-1">
                  Catatan Audit: Pembacaan sensor mencerminkan kondisi ruang pemantauan di titik penempatan alat, bukan jaminan absolut kualitas per kemasan individu.
                </p>
              </div>

              {/* Tabel Riwayat Telemetri */}
              {activeSensor.status === 'ONLINE' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Riwayat Pembacaan Telemetri Hari Ini
                  </h3>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 text-muted-foreground font-semibold">
                        <tr>
                          <th className="p-2.5">Waktu Jam</th>
                          <th className="p-2.5">Suhu Tercatat</th>
                          <th className="p-2.5">Kelembaban (RH)</th>
                          <th className="p-2.5 text-right">Integritas Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {telemetryHistory.map((h, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-2.5 font-mono text-muted-foreground">{h.time} WIB</td>
                            <td className="p-2.5 font-semibold text-foreground">{h.temp}°C</td>
                            <td className="p-2.5 font-semibold text-foreground">{h.rh}%</td>
                            <td className="p-2.5 text-right">
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
