import { useState } from 'react';
import { 
  Package, 
  ShieldCheck, 
  FileText, 
  Download, 
  Truck, 
  ExternalLink,
  Lock,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useDemoData } from '../context/DemoDataContext';

export const BuyerPortal = () => {
  const navigate = useNavigate();
  const { lots } = useDemoData();
  const [activeTab, setActiveTab] = useState<'shipments' | 'quality' | 'access'>('shipments');
  const [isAccessRevoked, setIsAccessRevoked] = useState(false);

  const sharedLots = lots.filter(l => l.status === 'RELEASED');

  const shipments = [
    {
      id: 'SHP-2026-001',
      date: '2026-09-25',
      destination: 'Rotterdam Port, Belanda',
      buyer: 'PT Java Agro Organics',
      lotCode: 'GULA-KRS-2026-01',
      quantity: '150 Kg (300 Pouch)',
      status: 'DIKIRIM (DALAM PERJALANAN)',
      trackingNumber: 'MSC-ID-ROT-98210',
    },
    {
      id: 'SHP-2026-002',
      date: '2026-09-22',
      destination: 'Tanjung Perak, Surabaya',
      buyer: 'CV Nusantara Spices',
      lotCode: 'GULA-KRS-2026-01',
      quantity: '50 Kg (100 Pouch)',
      status: 'SELESAI DITERIMA',
      trackingNumber: 'LNX-SUB-20194',
    },
  ];

  const documents = [
    {
      id: 'DOC-COA-01',
      name: 'Certificate_of_Analysis_GULA-KRS-2026-01.pdf',
      type: 'Sertifikat Analisis Lab Mutu (COA)',
      issuedBy: 'Laboratorium Pengendalian Mutu Koperasi',
      date: '25 September 2026',
    },
    {
      id: 'DOC-ORG-02',
      name: 'Control_Union_Organic_Certificate_2026.pdf',
      type: 'Sertifikasi Organik Nira EU & USDA',
      issuedBy: 'Control Union Certifications',
      date: '10 Januari 2026',
    },
    {
      id: 'DOC-PHY-03',
      name: 'Phytosanitary_Certificate_Karantina_Tanjung_Priok.pdf',
      type: 'Sertifikat Standar Mutu',
      issuedBy: 'Badan Karantina Indonesia',
      date: '25 September 2026',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {/* Header Portal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Portal Pembeli & Transparansi Rantai Pasok
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Mitra Terdaftar
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Akses aman bagi importir dan distributor untuk meninjau status pengiriman, mengunduh sertifikat analisis (COA), dan memvalidasi ketertelusuran organik.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-muted px-3 py-1.5 rounded-lg border border-border">
          <Building size={14} className="text-muted-foreground" />
          <span className="font-semibold text-foreground">PT Java Agro Organics</span>
        </div>
      </div>

      {isAccessRevoked && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-950 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 font-bold">
            <Lock size={18} className="text-amber-700" />
            Tautan Akses Terbatas Telah Dicabut (BR-008). Mitra pembeli tidak dapat lagi mengakses riwayat dokumen ini.
          </div>
          <button
            onClick={() => setIsAccessRevoked(false)}
            className="px-3 py-1 bg-amber-800 text-white rounded-md text-xs font-semibold hover:bg-amber-900 cursor-pointer"
          >
            Aktifkan Akses Kembali
          </button>
        </div>
      )}

      {/* Tabs Navigasi Portal */}
      <div className="flex gap-4 border-b border-border text-xs">
        <button
          onClick={() => setActiveTab('shipments')}
          className={`pb-3 px-3 font-bold transition-colors cursor-pointer ${
            activeTab === 'shipments'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pengiriman Saya ({shipments.length})
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`pb-3 px-3 font-bold transition-colors cursor-pointer ${
            activeTab === 'quality'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Dokumen Mutu & Sertifikat ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('access')}
          className={`pb-3 px-3 font-bold transition-colors cursor-pointer ${
            activeTab === 'access'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Keamanan & Manajemen Akses
        </button>
      </div>

      {/* Tab 1: Pengiriman */}
      {activeTab === 'shipments' && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Kode Pengiriman</th>
                <th className="p-3.5">Tujuan & Pelabuhan</th>
                <th className="p-3.5">Lot Terkait</th>
                <th className="p-3.5">Jumlah Dikirim</th>
                <th className="p-3.5">No. Resi / BL</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ketertelusuran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="p-3.5 font-mono font-bold text-foreground">
                    <div className="flex items-center gap-1.5">
                      <Truck size={14} className="text-primary" />
                      {s.id}
                    </div>
                  </td>
                  <td className="p-3.5 text-foreground">{s.destination}</td>
                  <td className="p-3.5 font-mono font-semibold text-primary">{s.lotCode}</td>
                  <td className="p-3.5 font-bold text-foreground">{s.quantity}</td>
                  <td className="p-3.5 font-mono text-muted-foreground">{s.trackingNumber}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => navigate(`/app/trace?q=${s.lotCode}`)}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer"
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
      )}

      {/* Tab 2: Dokumen Mutu & COA */}
      {activeTab === 'quality' && (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-foreground">Sertifikat Resmi Terbitan Pabrik & Karantina</h2>
            <span className="text-xs text-muted-foreground">Format PDF Terotentikasi</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-border bg-background hover:border-primary/50 transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs mb-2">
                    PDF
                  </div>
                  <h3 className="font-bold text-xs text-foreground line-clamp-1">{doc.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{doc.type}</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1">Penerbit: {doc.issuedBy}</p>
                </div>

                <div className="pt-2 border-t border-border flex justify-between items-center text-xs">
                  <span className="text-[10px] text-muted-foreground">{doc.date}</span>
                  <button
                    onClick={() => alert(`Simulasi: Mengunduh ${doc.name}`)}
                    className="inline-flex items-center gap-1 text-primary font-bold hover:underline cursor-pointer"
                  >
                    <Download size={13} />
                    Unduh
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Manajemen Hak Akses (BR-008) */}
      {activeTab === 'access' && (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            Hak Akses Terbatas & Kepatuhan Keamanan (BR-008)
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Sesuai aturan bisnis BR-008, akses portal pembeli menggunakan tautan terenkripsi aman (*secure limited-link*) dan dapat dicabut sewaktu-waktu oleh pihak eksportir atau pabrik tanpa memengaruhi data produksi internal.
          </p>

          <div className="p-4 bg-muted/40 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-foreground">Status Tautan Portal Mitra:</div>
                <div className="text-muted-foreground text-[11px]">
                  Aktif sejak 25 September 2026 · Token kadaluarsa dalam 30 hari
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                isAccessRevoked ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isAccessRevoked ? 'AKSES DICABUT' : 'AKTIF & AMAN'}
              </span>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setIsAccessRevoked(!isAccessRevoked)}
                className={`px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                  isAccessRevoked
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isAccessRevoked ? 'Pulihkan Akses Pembeli' : 'Cabut Akses Tautan Ini Segera (Revoke)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
