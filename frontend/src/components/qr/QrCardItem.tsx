import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Download, 
  Tag, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Leaf, 
  Truck, 
  FlaskConical, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { downloadQrCodePng, downloadPrintableLabelPng, type QrBadgeOptions } from '@/lib/qrExport';

export interface QrItemProps {
  id: string;
  title: string;
  code: string;
  category: string;
  url: string;
  badgeType: 'consumer' | 'b2b' | 'stimulus_high' | 'stimulus_low';
  summary: string;
  details: {
    section: string;
    points: string[];
  }[];
  printableMeta: string[];
}

export function QrCardItem({ item }: { item: QrItemProps }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [downloadingBadge, setDownloadingBadge] = useState(false);
  const [downloadingPure, setDownloadingPure] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCanvas = (): HTMLCanvasElement | null => {
    if (canvasRef.current) return canvasRef.current;
    return document.getElementById(`qr-canvas-${item.id}`) as HTMLCanvasElement | null;
  };

  const handleDownloadPureQr = async () => {
    setDownloadingPure(true);
    const canvas = getCanvas();
    await downloadQrCodePng(canvas, `SIRAGU_${item.id}_QR`);
    setTimeout(() => setDownloadingPure(false), 1500);
  };

  const handleDownloadPrintableLabel = async () => {
    setDownloadingBadge(true);
    const canvas = getCanvas();
    const badgeOptions: QrBadgeOptions = {
      url: item.url,
      codeTitle: item.code,
      badgeLabel: item.title,
      category: item.category,
      metadata: item.printableMeta,
      filename: `SIRAGU_${item.id}`,
    };
    await downloadPrintableLabelPng(canvas, badgeOptions);
    setTimeout(() => setDownloadingBadge(false), 1500);
  };

  const getHeaderIcon = () => {
    switch (item.badgeType) {
      case 'consumer':
        return <Leaf className="text-emerald-500" size={20} />;
      case 'b2b':
        return <Truck className="text-blue-500" size={20} />;
      case 'stimulus_high':
        return <Sparkles className="text-purple-500" size={20} />;
      case 'stimulus_low':
        return <FlaskConical className="text-amber-500" size={20} />;
    }
  };

  const getBadgeStyle = () => {
    switch (item.badgeType) {
      case 'consumer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'b2b':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'stimulus_high':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'stimulus_low':
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
      {/* Top Banner */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getBadgeStyle()} inline-flex items-center gap-1.5`}>
            {getHeaderIcon()}
            {item.category}
          </span>
          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {item.code}
          </span>
        </div>
        <h3 className="text-lg font-black text-slate-900 leading-tight mt-1">{item.title}</h3>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.summary}</p>
      </div>

      {/* Middle: QR Preview & Download Options */}
      <div className="p-6 bg-slate-50/60 flex flex-col md:flex-row items-center gap-6 border-b border-slate-100">
        {/* Visual QR Canvas Box */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex-shrink-0 text-center">
          <QRCodeCanvas
            ref={canvasRef}
            id={`qr-canvas-${item.id}`}
            value={item.url}
            size={168}
            level="M"
            marginSize={2}
          />
          <span className="text-[10px] text-slate-400 font-medium block mt-2">
            Scan via Kamera HP
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex-1 w-full space-y-2.5">
          <button
            onClick={handleDownloadPrintableLabel}
            disabled={downloadingBadge}
            className="w-full py-2.5 px-4 bg-[#1B4D3E] hover:bg-[#143B30] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-75"
            title="Download stiker siap cetak lengkap dengan logo, bingkai, dan data batch"
          >
            {downloadingBadge ? <Check size={15} className="text-emerald-300" /> : <Tag size={15} />}
            {downloadingBadge ? '✓ Berhasil Diunduh!' : 'Unduh Label Siap Cetak (Stiker Badge)'}
          </button>

          <button
            onClick={handleDownloadPureQr}
            disabled={downloadingPure}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-75"
            title="Download QR code PNG beresolusi tinggi (800x800)"
          >
            {downloadingPure ? <Check size={15} className="text-emerald-600" /> : <Download size={15} className="text-emerald-600" />}
            {downloadingPure ? '✓ Berhasil Diunduh!' : 'Unduh QR Saja (PNG High-Res)'}
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleCopyLink}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copied ? 'Tersalin!' : 'Salin URL'}
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 text-center cursor-pointer"
            >
              <ExternalLink size={13} />
              Buka Halaman
            </a>
          </div>
        </div>
      </div>

      {/* Accordion: What is inside this QR code */}
      <div className="p-5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-emerald-800 transition cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            Rincian Isi Lengkap di Dalam QR Ini:
          </span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="mt-3.5 space-y-3 pt-3 border-t border-slate-100 text-[11px]">
            {item.details.map((sec, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900 mb-1">{sec.section}</p>
                <ul className="space-y-1 text-slate-600">
                  {sec.points.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-1.5 leading-snug">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
