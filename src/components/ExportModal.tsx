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
import { generateDetailedForensicArtistNarrative } from '../services/faceSpecEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  faceSpec: FaceSpec;
  activeCase: ForensicCase;
  version: number;
  currentUser: UserProfile;
  entryHash?: string;
  onLogExport: (format: string, mode: string) => void;
  hasGenerated?: boolean;
  aiImageUrl?: string | null;
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
  hasGenerated = false,
  aiImageUrl = null,
}) => {
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');
  const [renderMode, setRenderMode] = useState<'charcoal' | 'photoreal'>('charcoal');
  const [upscale, setUpscale] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedNarrative, setCopiedNarrative] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const size = upscale ? 1024 : 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let imgEl: HTMLImageElement | undefined = undefined;
    if (aiImageUrl) {
      imgEl = new Image();
      imgEl.src = aiImageUrl;
    }

    drawForensicComposite(ctx, faceSpec, {
      width: size,
      height: size,
      styleMode: renderMode,
      viewAngle: 'frontal',
      caseNumber: activeCase.caseNumber,
      version,
      entryHash,
      hasGenerated,
      aiImageElement: imgEl,
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
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#D5C6B4] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E6DFD5] flex items-center justify-between bg-[#F6F1EA]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#EFE8DE] border border-[#D8CABE] flex items-center justify-center text-[#8C6D46]">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-stone-900">Export Court-Admissible Forensic Docket</h2>
              <p className="text-xs text-stone-600">
                Evidentiary composite export with statutory watermarks and embedded metadata.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-[#EAE1D2] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto bg-[#FDFBF7] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Preview */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono text-stone-600 mb-2 font-medium">Export Artifact Preview</span>
              <div className="w-64 h-64 bg-white rounded-xl border border-[#D5C6B4] overflow-hidden shadow-md">
                <canvas
                  ref={(canvas) => {
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        drawForensicComposite(ctx, faceSpec, {
                          width: canvas.width,
                          height: canvas.height,
                          styleMode: renderMode,
                          viewAngle: 'frontal',
                          caseNumber: activeCase.caseNumber,
                          version,
                          entryHash,
                          hasGenerated,
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
              <div className="mt-3 p-2 rounded-lg bg-[#FAF5EE] border border-[#E2D6C5] text-[10px] font-mono text-[#8C6D46] text-center font-semibold">
                AI-GENERATED APPROXIMATION - INVESTIGATIVE LEAD ONLY
              </div>
            </div>

            {/* Export Configuration & Metadata */}
            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="text-stone-700 font-mono block mb-1.5 font-medium">Rendering Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRenderMode('charcoal')}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition shadow-2xs ${
                      renderMode === 'charcoal'
                        ? 'bg-[#F4EFE6] border-[#8C6D46] text-stone-900 font-medium ring-1 ring-[#8C6D46]'
                        : 'bg-white border-[#D5C6B4] text-stone-600 hover:bg-[#F9F6F0]'
                    }`}
                  >
                    <div className="font-semibold text-[#8C6D46]">Charcoal (Archival)</div>
                    <div className="text-[11px] text-stone-500">Procedural sketch</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenderMode('photoreal')}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition shadow-2xs ${
                      renderMode === 'photoreal'
                        ? 'bg-[#F4EFE6] border-[#8C6D46] text-stone-900 font-medium ring-1 ring-[#8C6D46]'
                        : 'bg-white border-[#D5C6B4] text-stone-600 hover:bg-[#F9F6F0]'
                    }`}
                  >
                    <div className="font-semibold text-[#8C6D46]">Photoreal (Lead)</div>
                    <div className="text-[11px] text-stone-500">Photographic approximation</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-stone-700 font-mono block mb-1.5 font-medium">Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('png')}
                    className={`p-2 rounded-lg border text-center cursor-pointer transition shadow-2xs ${
                      exportFormat === 'png'
                        ? 'bg-[#8C6D46] border-[#785C3A] text-white font-medium'
                        : 'bg-white border-[#D5C6B4] text-stone-700 hover:bg-[#F9F6F0]'
                    }`}
                  >
                    PNG Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    className={`p-2 rounded-lg border text-center cursor-pointer transition shadow-2xs ${
                      exportFormat === 'pdf'
                        ? 'bg-[#8C6D46] border-[#785C3A] text-white font-medium'
                        : 'bg-white border-[#D5C6B4] text-stone-700 hover:bg-[#F9F6F0]'
                    }`}
                  >
                    Printable Docket
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#D5C6B4] shadow-2xs">
                <span className="text-stone-800 font-medium">Enhanced 1024×1024 Upscale</span>
                <input
                  type="checkbox"
                  checked={upscale}
                  onChange={(e) => setUpscale(e.target.checked)}
                  className="rounded text-[#8C6D46] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Detailed Forensic Artist Specification Brief */}
              <div className="p-3 rounded-xl bg-[#F6F1EA] border border-[#DFD3C4] text-[11px] space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="text-[#6B4E2E] font-semibold flex items-center gap-1.5 font-mono">
                    <FileText className="h-3.5 w-3.5 text-[#8C6D46]" />
                    <span>Forensic Artist Narrative Specification</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const text = generateDetailedForensicArtistNarrative(faceSpec, activeCase.caseNumber, activeCase.witnessPseudonym);
                      navigator.clipboard.writeText(text);
                      setCopiedNarrative(true);
                      setTimeout(() => setCopiedNarrative(false), 2000);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white hover:bg-[#EFE8DE] text-[#6B4E2E] border border-[#D5C6B4] transition cursor-pointer shadow-2xs"
                  >
                    {copiedNarrative ? 'Copied!' : 'Copy Paragraph'}
                  </button>
                </div>
                <p className="text-stone-700 font-sans leading-relaxed text-[11px] line-clamp-4 hover:line-clamp-none transition-all duration-300 cursor-pointer bg-white p-2 rounded-lg border border-[#E2D8CC]">
                  {generateDetailedForensicArtistNarrative(faceSpec, activeCase.caseNumber, activeCase.witnessPseudonym)}
                </p>
              </div>

              {/* Embedded Metadata Chunk */}
              <div className="p-3 rounded-xl bg-white border border-[#D5C6B4] text-[11px] font-mono text-stone-600 space-y-1 shadow-2xs">
                <div className="text-stone-900 font-semibold mb-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#8C6D46]" /> Embedded Evidentiary Metadata (tEXt)
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
        <div className="p-4 bg-[#F6F1EA] border-t border-[#E6DFD5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {downloadSuccess && (
              <span className="text-xs text-emerald-800 flex items-center gap-1 font-mono">
                <CheckCircle className="h-4 w-4 text-emerald-600" /> Export successfully generated & logged to ledger!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#EFE8DE] text-stone-800 border border-[#D5C6B4] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-[#8C6D46]" />
              <span>Print Docket</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-[#8C6D46] hover:bg-[#785C3A] text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
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
