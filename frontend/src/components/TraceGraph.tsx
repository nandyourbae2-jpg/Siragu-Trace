import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Droplets, Flame, Package, UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';
import { useDemoData } from '../context/DemoDataContext';

// Custom Node Komprehensif
const TraceNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 shadow-md rounded-xl bg-surface border-2 border-border min-w-[240px] text-xs">
      <Handle type="target" position={Position.Top} className="w-12 !bg-primary" />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 font-bold">
          {data.category === 'NIRA' && <Droplets size={16} className="text-blue-500" />}
          {data.category === 'KRISTAL' && <Flame size={16} className="text-amber-500" />}
          {data.category === 'KEMASAN' && <Package size={16} className="text-emerald-500" />}
          <span className="text-[10px] text-muted-foreground uppercase">{data.stage}</span>
        </div>
        <span
          className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
            data.status === 'RELEASED' || data.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800'
              : data.status === 'QUARANTINED'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {data.status}
        </span>
      </div>

      <div className="font-mono font-bold text-sm text-foreground">{data.code}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{data.subtitle}</div>

      <div className="mt-2.5 pt-2 border-t border-border flex justify-between text-[11px] font-semibold">
        <span className="text-foreground">{data.amount}</span>
        <span className="text-muted-foreground">{data.extra}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-12 !bg-primary" />
    </div>
  );
};

const nodeTypes = { traceNode: TraceNode };

export const TraceGraph: React.FC<{ selectedQuery?: string; traceDirection?: 'BACKWARD' | 'FORWARD' }> = ({ selectedQuery, traceDirection = 'BACKWARD' }) => {
  const { lots, packages, farmers } = useDemoData();

  // Susun graf silsilah terpadu
  const { nodes, edges } = useMemo(() => {
    let rawLots = lots.filter((l) => l.type === 'RAW_ORGANIC');
    let procLots = lots.filter((l) => l.type === 'PROCESSED');
    let pkgs = packages;

    if (selectedQuery) {
      const q = selectedQuery.trim().toLowerCase();
      const targetRaw = rawLots.find(l => l.lotCode.toLowerCase() === q);
      const targetProc = procLots.find(l => l.lotCode.toLowerCase() === q);
      const targetPkg = pkgs.find(p => p.serialNumber.toLowerCase() === q || p.lotCode.toLowerCase() === q);

      if (traceDirection === 'BACKWARD') {
        if (targetPkg) {
           pkgs = [targetPkg];
           procLots = procLots.filter(l => l.id === targetPkg.lotId);
           rawLots = rawLots.filter(r => procLots.some(p => p.inputLotIds?.includes(r.id)));
        } else if (targetProc) {
           pkgs = [];
           procLots = [targetProc];
           rawLots = rawLots.filter(r => targetProc.inputLotIds?.includes(r.id));
        } else if (targetRaw) {
           pkgs = [];
           procLots = [];
           rawLots = [targetRaw];
        }
      } else { // FORWARD
        if (targetRaw) {
           rawLots = [targetRaw];
           procLots = procLots.filter(p => p.inputLotIds?.includes(targetRaw.id));
           pkgs = pkgs.filter(p => procLots.some(proc => proc.id === p.lotId));
        } else if (targetProc) {
           rawLots = [];
           procLots = [targetProc];
           pkgs = pkgs.filter(p => p.lotId === targetProc.id);
        } else if (targetPkg) {
           rawLots = [];
           procLots = [];
           pkgs = [targetPkg];
        }
      }
    }

    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    // Level 1: Petani & Nira Mentah (y: 40)
    rawLots.forEach((nira, idx) => {
      const farmer = farmers.find((f) => f.id === nira.farmerId);
      generatedNodes.push({
        id: `node-${nira.id}`,
        type: 'traceNode',
        position: { x: 40 + idx * 280, y: 40 },
        width: 260,
        height: 130,
        data: {
          category: 'NIRA',
          stage: nira.lotCode.startsWith('SPL') ? 'Gula Semut Pemasok' : 'Bahan Baku Nira',
          code: nira.lotCode,
          subtitle: `Petani/Pemasok: ${nira.farmerName}`,
          amount: `${nira.quantity} ${nira.unit}`,
          extra: nira.notes || 'Siap Proses',
          status: nira.status,
        },
      });
    });

    // Level 2: Olahan Kristalisasi (y: 220)
    procLots.forEach((proc, idx) => {
      generatedNodes.push({
        id: `node-${proc.id}`,
        type: 'traceNode',
        position: { x: 120 + idx * 340, y: 240 },
        width: 260,
        height: 130,
        data: {
          category: 'KRISTAL',
          stage: 'Pemasakan & Kristal',
          code: proc.lotCode,
          subtitle: proc.name,
          amount: `${proc.quantity} Kg`,
          extra: `Kadar Air: ${proc.moistureContent}%`,
          status: proc.status,
        },
      });

      // Hubungkan nira ke olahan
      if (proc.inputLotIds) {
        proc.inputLotIds.forEach((inpId) => {
          generatedEdges.push({
            id: `edge-${inpId}-${proc.id}`,
            source: `node-${inpId}`,
            target: `node-${proc.id}`,
            animated: true,
            label: 'Diproses / Dimasak',
            style: { stroke: '#0075DE', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#0075DE' },
          });
        });
      }
    });

    // Level 3: Kemasan Pouch & Barcode QR (y: 440)
    pkgs.forEach((pkg, idx) => {
      generatedNodes.push({
        id: `node-${pkg.id}`,
        type: 'traceNode',
        position: { x: 140 + idx * 300, y: 440 },
        width: 260,
        height: 130,
        data: {
          category: 'KEMASAN',
          stage: 'Kemasan Jadi (QR Pouch)',
          code: pkg.serialNumber,
          subtitle: pkg.packageSize,
          amount: `${pkg.quantity} unit`,
          extra: pkg.packageCode,
          status: pkg.qrStatus,
        },
      });

      // Hubungkan olahan ke kemasan
      generatedEdges.push({
        id: `edge-${pkg.lotId}-${pkg.id}`,
        source: `node-${pkg.lotId}`,
        target: `node-${pkg.id}`,
        animated: true,
        label: 'Dikemas & QR',
        style: { stroke: '#10B981', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' },
      });
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [lots, packages, farmers, selectedQuery, traceDirection]);

  return (
    <div className="w-full h-[480px] bg-muted/20 border border-border rounded-xl overflow-hidden relative shadow-inner">
      <div className="absolute top-3 left-3 z-10 bg-surface/90 backdrop-blur-xs border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground shadow-xs">
        Diagram Silsilah Multi-Tingkat (Bahan Baku → Kristalisasi → Serial QR)
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={true}
        nodesConnectable={false}
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.category === 'NIRA') return '#3b82f6'; // blue-500
            if (n.data?.category === 'KRISTAL') return '#f59e0b'; // amber-500
            if (n.data?.category === 'KEMASAN') return '#10b981'; // emerald-500
            return '#e2e8f0';
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};
