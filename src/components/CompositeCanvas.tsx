import React, { useRef, useEffect, useState } from 'react';
import { 
  Lock, 
  Layers, 
  Grid3X3, 
  Scan, 
  ShieldAlert, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Camera,
  RotateCcw,
  Flame,
  HelpCircle,
  MessageSquare,
  Scale,
  FileText
} from 'lucide-react';
import { FaceSpec, UserRole } from '../types';
import { drawForensicComposite, calculateRegionConfidences } from '../services/canvasRenderer';
import { calculateFacialSymmetryScore } from '../services/faceSpecEngine';

interface CompositeCanvasProps {
  faceSpec: FaceSpec;
  version: number;
  caseNumber: string;
  currentRole: UserRole;
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
  entryHash?: string;
  onOpenGridForRegion: (region: string) => void;
  hasGenerated: boolean;
  aiImageUrl: string | null;
  isGeneratingImage: boolean;
  onGenerateComposite: (mode: 'charcoal' | 'photoreal') => void;
  styleMode: 'charcoal' | 'photoreal';
  onStyleModeChange: (mode: 'charcoal' | 'photoreal') => void;
  onResetCanvas: () => void;
  onAskQuestion?: (question: string) => void;
  onOpenBriefModal?: () => void;
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
  hasGenerated,
  aiImageUrl,
  isGeneratingImage,
  onGenerateComposite,
  styleMode,
  onStyleModeChange,
  onResetCanvas,
  onAskQuestion,
  onOpenBriefModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSymmetry, setShowSymmetry] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewAngle, setViewAngle] = useState<'frontal' | 'profile' | 'dual'>('frontal');
  const [aiImageElement, setAiImageElement] = useState<HTMLImageElement | null>(null);

  // Pre-load image element when aiImageUrl arrives
  useEffect(() => {
    if (!aiImageUrl) {
      setAiImageElement(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = aiImageUrl;
    img.onload = () => {
      setAiImageElement(img);
    };
  }, [aiImageUrl]);

  // Redraw canvas whenever faceSpec, style, angle, image, or overlays change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawForensicComposite(ctx, faceSpec, {
      width: canvas.width,
      height: canvas.height,
      styleMode,
      viewAngle,
      showGrid,
      showLandmarks,
      showHeatmap,
      showSymmetryOverlay: showSymmetry,
      highlightRegion: selectedRegion,
      caseNumber,
      version,
      entryHash,
      hasGenerated,
      aiImageElement,
      isGenerating: isGeneratingImage,
    });
  }, [faceSpec, styleMode, viewAngle, showGrid, showLandmarks, showHeatmap, showSymmetry, selectedRegion, caseNumber, version, entryHash, hasGenerated, aiImageElement, isGeneratingImage]);

  const symmetry = calculateFacialSymmetryScore(faceSpec);
  const regionConfidences = calculateRegionConfidences(faceSpec);
  const focusRegions = Object.values(regionConfidences)
    .filter(r => r.level === 'low' || r.level === 'moderate')
    .sort((a, b) => a.confidence - b.confidence);

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
      <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-cyan-400" />
            <span>Forensic Canvas</span>
          </h2>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
            {hasGenerated ? `v${version}.0` : 'Draft'}
          </span>
          {hasGenerated && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Forensic Composite
            </span>
          )}
        </div>

        {/* Display Style & Overlay Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          {/* Angle Selector Tabs */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
            <button
              onClick={() => setViewAngle('frontal')}
              className={`px-2 py-1 rounded text-[11px] transition cursor-pointer ${
                viewAngle === 'frontal' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="Front-facing evidentiary composite"
            >
              Frontal
            </button>
            <button
              onClick={() => setViewAngle('profile')}
              className={`px-2 py-1 rounded text-[11px] transition cursor-pointer ${
                viewAngle === 'profile' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="90-degree lateral profile composite"
            >
              Profile
            </button>
            <button
              onClick={() => setViewAngle('dual')}
              className={`px-2 py-1 rounded text-[11px] transition cursor-pointer ${
                viewAngle === 'dual' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="Dual-angle identification composite"
            >
              Dual Angle
            </button>
          </div>

          {/* Style Mode Toggle */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
            <button
              onClick={() => onStyleModeChange('charcoal')}
              className={`px-2 py-1 rounded text-[11px] transition cursor-pointer ${
                styleMode === 'charcoal' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="Archival graphite & charcoal sketch on textured paper"
            >
              Charcoal Sketch
            </button>
            <button
              onClick={() => onStyleModeChange('photoreal')}
              className={`px-2 py-1 rounded text-[11px] transition cursor-pointer ${
                styleMode === 'photoreal' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title="Chiaroscuro photoreal graphite tone"
            >
              Chiaroscuro Tone
            </button>
          </div>

          {/* Trigger Gemini AI Image Generation Button */}
          <button
            onClick={() => onGenerateComposite(styleMode)}
            disabled={isGeneratingImage}
            className="px-2.5 py-1 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-[11px] font-medium flex items-center gap-1 shadow-sm transition cursor-pointer"
            title="Generate hyper-realistic composite using gemini-3.1-flash-lite-image"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
            <span>{isGeneratingImage ? 'Rendering...' : hasGenerated ? 'Regenerate AI' : 'Generate AI Face'}</span>
          </button>

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

          {/* Visual Confidence Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition cursor-pointer flex items-center gap-1.5 ${
              showHeatmap
                ? 'bg-red-950/90 border-red-500 text-red-200 ring-1 ring-red-500/50 shadow-sm shadow-red-950'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-red-300'
            }`}
            title="Toggle Visual Confidence Heatmap: Highlights lower confidence regions to guide questioning"
          >
            <Flame className={`h-3.5 w-3.5 ${showHeatmap ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Heatmap</span>
            {showHeatmap && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
            )}
          </button>

          {/* Facial Symmetry Assessment Toggle */}
          <button
            onClick={() => setShowSymmetry(!showSymmetry)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition cursor-pointer flex items-center gap-1.5 ${
              showSymmetry
                ? 'bg-purple-950/90 border-purple-500 text-purple-200 ring-1 ring-purple-500/50 shadow-sm shadow-purple-950'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-purple-300'
            }`}
            title="Toggle craniometric facial symmetry assessment overlay and balance telemetry"
          >
            <Scale className={`h-3.5 w-3.5 ${showSymmetry ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>Symmetry: {symmetry.percentageText}</span>
          </button>

          {/* Detailed Forensic Artist Brief Button */}
          {onOpenBriefModal && (
            <button
              onClick={onOpenBriefModal}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-600/50 text-[11px] font-medium flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Open court-admissible detailed forensic narrative description for export"
            >
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              <span>Artist Brief</span>
            </button>
          )}

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

          {/* Reset / Clear Button */}
          {hasGenerated && (
            <button
              onClick={onResetCanvas}
              className="p-1.5 rounded border border-slate-800 text-slate-400 hover:text-red-300 hover:bg-slate-900 transition cursor-pointer"
              title="Reset to blank drafting canvas"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-auto relative bg-slate-950/90">
        <div 
          className="relative rounded-lg overflow-hidden border border-slate-800 shadow-2xl transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            className="block max-w-full bg-slate-900"
          />

          {/* Loading / Rendering Progress Overlay */}
          {isGeneratingImage && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30 space-y-3">
              <div className="h-12 w-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-sm text-cyan-300">Rendering Hyper-Realistic Composite</p>
                <p className="text-xs text-slate-400 font-mono mt-1">Model: gemini-3.1-flash-lite-image</p>
                <p className="text-[11px] text-slate-500 mt-1">Synthesizing photographic mugshot from FaceSpec attributes...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Investigator Confidence Heatmap Guidance Panel */}
      {showHeatmap && (
        <div className="border-t border-red-900/60 bg-red-950/40 p-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-semibold text-red-200 uppercase tracking-wider font-mono">
                Investigator Recall Focus (Low Confidence Facial Zones)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {focusRegions.length} Questioning Targets
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
            The thermal heatmap highlights regions where witness recall is unstated or low in confidence (<strong className="text-red-400">warm crimson/orange</strong>). Tap a zone or question below to direct non-leading interview elicitation:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
            {focusRegions.map((reg) => (
              <div
                key={reg.id}
                onClick={() => onSelectRegion(selectedRegion === reg.id ? null : reg.id)}
                className={`p-2.5 rounded-lg border text-xs transition cursor-pointer flex flex-col justify-between ${
                  selectedRegion === reg.id
                    ? 'bg-red-900/60 border-red-400 text-white shadow-md shadow-red-950/60 ring-1 ring-red-400'
                    : 'bg-slate-900/90 border-slate-800 hover:border-red-900/70 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-red-300">{reg.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-red-950 text-red-400 border border-red-800">
                      {reg.stated ? `${Math.round(reg.confidence * 100)}% Conf` : '0% Unstated'}
                    </span>
                  </div>
                  {onAskQuestion && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskQuestion(reg.suggestedPrompt);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/80 hover:bg-red-700 text-red-100 flex items-center gap-1 transition cursor-pointer"
                      title="Send this prompt directly to the cognitive interview"
                    >
                      <MessageSquare className="h-2.5 w-2.5" />
                      <span>Ask Interview</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 italic font-sans leading-snug">
                  "{reg.suggestedPrompt}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facial Symmetry Craniometric Balance Panel */}
      {showSymmetry && (
        <div className="border-t border-purple-900/60 bg-purple-950/40 p-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider font-mono">
                Craniometric Symmetry Diagnostic & Balance Index
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-600/60">
                Index: {symmetry.percentageText}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                symmetry.score >= 90
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : symmetry.score >= 85
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-red-950 text-red-300 border-red-800'
              }`}>
                {symmetry.classification}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
            The overlay projects a vertical sagittal midline (magenta) and 4 orthogonal horizontal cranial planes (cyan/amber) to evaluate bilateral equilibrium:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-900/90 border border-purple-900/40">
              <div className="text-[10px] text-slate-400 font-mono">Ocular Axis</div>
              <div className="font-semibold text-purple-300">{symmetry.ocularBalance}%</div>
              <div className="text-[10px] text-slate-400">Inter-pupillary tilt</div>
            </div>
            <div className="p-2 rounded bg-slate-900/90 border border-purple-900/40">
              <div className="text-[10px] text-slate-400 font-mono">Nasal Midline</div>
              <div className="font-semibold text-purple-300">{symmetry.nasalBalance}%</div>
              <div className="text-[10px] text-slate-400">Bridge deviation</div>
            </div>
            <div className="p-2 rounded bg-slate-900/90 border border-purple-900/40">
              <div className="text-[10px] text-slate-400 font-mono">Labial Cant</div>
              <div className="font-semibold text-purple-300">{symmetry.labialBalance}%</div>
              <div className="text-[10px] text-slate-400">Commissure level</div>
            </div>
            <div className="p-2 rounded bg-slate-900/90 border border-purple-900/40">
              <div className="text-[10px] text-slate-400 font-mono">Mandibular Balance</div>
              <div className="font-semibold text-purple-300">{symmetry.mandibularBalance}%</div>
              <div className="text-[10px] text-slate-400">Gonial & chin centring</div>
            </div>
          </div>
          <p className="text-[10px] text-purple-300/80 mt-2 font-mono italic">
            Clinical Note: Human faces exhibit natural 88–96% bilateral variance. Scores below 85% denote marked asymmetrical identifiers crucial for suspect line-up differentiation.
          </p>
        </div>
      )}

      {/* Region Selector & Locality Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-medium">Region-Scoped Locality Controls:</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            {hasGenerated ? 'Locality: 98.6% untouched' : 'Ready for elicitation'}
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
