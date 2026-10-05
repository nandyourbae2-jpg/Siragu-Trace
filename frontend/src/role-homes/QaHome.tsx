import { useNavigate } from 'react-router';
import { ShieldAlert, ClipboardCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { useDemoData } from '@/context/DemoDataContext';

export const QaHome = () => {
  const navigate = useNavigate();
  const { lots, complaints } = useDemoData();

  const pendingRelease = lots.filter(l => l.status === 'PENDING_RELEASE').length;
  const quarantinedCount = lots.filter(l => l.status === 'QUARANTINED').length;
  const openComplaints = complaints.filter(c => c.status !== 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Antrean Mutu (QA)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau status kualitas, persetujuan rilis, dan keluhan pelanggan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => navigate('/app/operations/release')}
          className="p-5 rounded-xl border border-border bg-surface hover:border-amber-500/50 hover:shadow-md transition-all text-left flex flex-col items-start gap-4 group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-lg group-hover:scale-110 transition-transform">
              <ShieldAlert size={24} />
            </div>
            <ArrowRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-1">{pendingRelease}</div>
            <h3 className="font-bold text-foreground group-hover:text-amber-600 transition-colors">Menunggu Rilis</h3>
            <p className="text-sm text-muted-foreground mt-1">Lot butuh review (4-Eye Gatekeeper).</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/app/qa')}
          className="p-5 rounded-xl border border-border bg-surface hover:border-red-500/50 hover:shadow-md transition-all text-left flex flex-col items-start gap-4 group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-3 bg-red-100 text-red-700 rounded-lg group-hover:scale-110 transition-transform">
              <ClipboardCheck size={24} />
            </div>
            <ArrowRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-1">{quarantinedCount}</div>
            <h3 className="font-bold text-foreground group-hover:text-red-600 transition-colors">Karantina</h3>
            <p className="text-sm text-muted-foreground mt-1">Lot tertahan karena isu kualitas.</p>
          </div>
        </button>

        <button 
          onClick={() => navigate('/app/complaints')}
          className="p-5 rounded-xl border border-border bg-surface hover:border-orange-500/50 hover:shadow-md transition-all text-left flex flex-col items-start gap-4 group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-3 bg-orange-100 text-orange-700 rounded-lg group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
            <ArrowRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-1">{openComplaints}</div>
            <h3 className="font-bold text-foreground group-hover:text-orange-600 transition-colors">Keluhan Aktif</h3>
            <p className="text-sm text-muted-foreground mt-1">Komplain pelanggan butuh tindak lanjut.</p>
          </div>
        </button>
      </div>
    </div>
  );
};
