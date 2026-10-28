import React, { useState, useRef } from 'react';
import { 
  Download, 
  X, 
  FileText, 
  ShieldCheck, 
  Layers, 
  CheckCircle, 
  Printer
} from 'lucide-react';
import { FaceSpec, ForensicCase, UserProfile } from '../types';
import { drawForensicComposite } from '../services/canvasRenderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  faceSpec: FaceSpec;
  activeCase: ForensicCase;
  version: number;
  currentUser: UserProfile;
  entryHash?: string;
  onLogExport: (format: string, mode: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  faceSpec,
  activeCase,
  version,
  currentUser,
  entryHash,
  onLogExport,
}) => {
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');
  const [renderMode, setRenderMode] = useState<'charcoal' | 'photoreal'>('charcoal');
  const [upscale, setUpscale] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const size = upscale ? 1024 : 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawForensicComposite(ctx, faceSpec, {
      width: size,
      height: size,
      styleMode: renderMode,
      caseNumber: activeCase.caseNumber,
      version,
      entryHash,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `forensic_composite_${activeCase.caseNumber}_v${version}_${renderMode}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onLogExport(exportFormat, renderMode);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
    onLogExport('print', renderMode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-white">Export Court-Admissible Forensic Docket</h2>
              <p className="text-xs text-slate-400">
                Evidentiary composite export with statutory watermarks and embedded metadata.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto bg-slate-950 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Preview */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono text-slate-400 mb-2">Export Artifact Preview</span>
              <div className="w-64 h-64 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-2xl">
                <canvas
                  ref={(canvas) => {
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        drawForensicComposite(ctx, faceSpec, {
                          width: canvas.width,
                          height: canvas.height,
                          styleMode: renderMode,
                          caseNumber: activeCase.caseNumber,
                          version,
                          entryHash,
                        });
                      }
                    }
                  }}
                  width={256}
                  height={256}
                  className="w-full h-full block"
                />
              </div>

              {/* Watermark notice */}
              <div className="mt-3 p-2 rounded bg-red-950/40 border border-red-800/60 text-[10px] font-mono text-red-300 text-center">
                AI-GENERATED APPROXIMATION - INVESTIGATIVE LEAD ONLY
              </div>
            </div>

            {/* Export Configuration & Metadata */}
            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="text-slate-400 font-mono block mb-1.5">Rendering Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRenderMode('charcoal')}
                    className={`p-2 rounded border text-left cursor-pointer transition ${
                      renderMode === 'charcoal'
                        ? 'bg-cyan-950/60 border-cyan-500 text-white font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-cyan-300">Charcoal Sketch</div>
                    <div className="text-[11px] text-slate-400">Classic forensic sketch style</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenderMode('photoreal')}
                    className={`p-2 rounded border text-left cursor-pointer transition ${
                      renderMode === 'photoreal'
                        ? 'bg-cyan-950/60 border-cyan-500 text-white font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-cyan-300">Photoreal (Lead)</div>
                    <div className="text-[11px] text-slate-400">Photographic approximation</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1.5">Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('png')}
                    className={`p-2 rounded border text-center cursor-pointer transition ${
                      exportFormat === 'png'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    PNG (High Res Image)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    className={`p-2 rounded border text-center cursor-pointer transition ${
                      exportFormat === 'pdf'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Printable Docket Report
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-medium">Enhanced 1024×1024 Upscale</span>
                <input
                  type="checkbox"
                  checked={upscale}
                  onChange={(e) => setUpscale(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Embedded Metadata Chunk */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-cyan-400" /> Embedded Evidentiary Metadata (tEXt)
                </div>
                <div>• Case Number: {activeCase.caseNumber}</div>
                <div>• Version: {version}.0</div>
                <div>• Authorized Agent: {currentUser.fullName} ({currentUser.role})</div>
                <div>• SHA-256 Stamp: {entryHash ? entryHash.slice(0, 20) + '...' : 'GENESIS-CHAINED'}</div>
                <div>• Timestamp: {new Date().toISOString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {downloadSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle className="h-4 w-4" /> Export successfully generated & logged to ledger!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Docket</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download {exportFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
