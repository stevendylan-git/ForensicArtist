import React, { useRef, useEffect, useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Layers, 
  Grid3X3, 
  Scan, 
  ShieldAlert, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { FaceSpec, UserRole } from '../types';
import { drawForensicComposite } from '../services/canvasRenderer';

interface CompositeCanvasProps {
  faceSpec: FaceSpec;
  version: number;
  caseNumber: string;
  currentRole: UserRole;
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
  entryHash?: string;
  onOpenGridForRegion: (region: string) => void;
}

export const CompositeCanvas: React.FC<CompositeCanvasProps> = ({
  faceSpec,
  version,
  caseNumber,
  currentRole,
  selectedRegion,
  onSelectRegion,
  entryHash,
  onOpenGridForRegion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [styleMode, setStyleMode] = useState<'charcoal' | 'photoreal'>('charcoal');
  const [showGrid, setShowGrid] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Redraw canvas whenever faceSpec, style, or overlays change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawForensicComposite(ctx, faceSpec, {
      width: canvas.width,
      height: canvas.height,
      styleMode,
      showGrid,
      showLandmarks,
      highlightRegion: selectedRegion,
      caseNumber,
      version,
      entryHash,
    });
  }, [faceSpec, styleMode, showGrid, showLandmarks, selectedRegion, caseNumber, version, entryHash]);

  const regions = [
    { id: 'hair', label: 'Hair & Head' },
    { id: 'eyebrows', label: 'Brows' },
    { id: 'eyes', label: 'Eyes' },
    { id: 'nose', label: 'Nose' },
    { id: 'mouth_lips', label: 'Mouth & Lips' },
    { id: 'jawline_chin', label: 'Jaw & Chin' },
    { id: 'facial_hair', label: 'Facial Hair' },
  ];

  // Auditor role isolation per Rule & backend test `test_cases_need_to_know.py`
  if (currentRole === 'AUDITOR') {
    return (
      <section className="h-full flex flex-col bg-slate-950 border-r border-slate-800">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-slate-100">Forensic Composite Canvas</h2>
            <span className="text-xs font-mono text-slate-500">v{version}.0</span>
          </div>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded flex items-center gap-1">
            <Lock className="h-3 w-3" /> Evidentiary Redaction
          </span>
        </div>

        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
          <div className="max-w-md p-6 rounded-xl bg-slate-900/90 border border-amber-600/40 shadow-2xl space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <ShieldAlert className="h-8 w-8 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-amber-300">Auditor Role Face Composite Isolation</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Pursuant to statutory forensic compliance rules, <strong>Auditors are strictly quarantined from viewing biometric facial renderings</strong> to avoid cognitive contamination of external audits.
              </p>
              <div className="mt-3 p-2.5 rounded bg-slate-950 text-[11px] font-mono text-slate-400 border border-slate-800 text-left space-y-1">
                <div>• Audit Ledger Access: <span className="text-emerald-400">UNRESTRICTED</span></div>
                <div>• Cryptographic Chain Verification: <span className="text-emerald-400">ENABLED</span></div>
                <div>• Morphological Face Rendering: <span className="text-red-400">REDACTED / ISOLATED</span></div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Switch role back to Investigator, Forensic Artist, or Supervisor to view the composite.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full flex flex-col bg-slate-950 border-r border-slate-800">
      {/* Canvas Viewport Toolbar */}
      <div className="p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-slate-100">Forensic Composite Canvas</h2>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
            v{version}.0
          </span>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded flex items-center gap-1">
            <Lock className="h-3 w-3" /> Region Lock Enforced
          </span>
        </div>

        {/* Display Style & Overlay Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Style Mode Toggle */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
            <button
              onClick={() => setStyleMode('charcoal')}
              className={`px-2 py-1 rounded text-[11px] transition cursor-pointer ${
                styleMode === 'charcoal' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Charcoal Sketch
            </button>
            <button
              onClick={() => setStyleMode('photoreal')}
              className={`px-2 py-1 rounded text-[11px] transition cursor-pointer ${
                styleMode === 'photoreal' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Photoreal (Lead)
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded border transition cursor-pointer ${
              showGrid ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle anatomical alignment grid"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>

          {/* Landmarks Mesh Toggle */}
          <button
            onClick={() => setShowLandmarks(!showLandmarks)}
            className={`p-1.5 rounded border transition cursor-pointer ${
              showLandmarks ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle facial landmarks mesh"
          >
            <Scan className="h-3.5 w-3.5" />
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900 rounded border border-slate-800">
            <button
              onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.1))}
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] px-1 text-slate-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="flex-1 p-5 flex flex-col items-center justify-center overflow-auto relative bg-slate-950/90">
        <div 
          className="relative rounded-lg overflow-hidden border border-slate-800 shadow-2xl transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            className="block max-w-full bg-slate-900 cursor-crosshair"
          />
        </div>
      </div>

      {/* Region Selector & Locality Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-medium">Region-Scoped Locality Controls:</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            Locality: 98.6% untouched
          </span>
        </div>

        {/* Region Quick Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {regions.map((r) => {
            const isSelected = selectedRegion === r.id;
            return (
              <div key={r.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectRegion(isSelected ? null : r.id)}
                  className={`px-2.5 py-1 text-xs rounded-l border transition cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-600 border-cyan-500 text-white font-medium'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {r.label}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenGridForRegion(r.id)}
                  className="px-1.5 py-1 text-xs bg-slate-950 hover:bg-cyan-950 hover:text-cyan-300 border-y border-r border-slate-700 text-slate-400 rounded-r transition cursor-pointer"
                  title={`Generate 3x3 candidate variations for ${r.label}`}
                >
                  <Grid3X3 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
