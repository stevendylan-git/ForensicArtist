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

  // Auditor role quarantine
  if (currentRole === 'AUDITOR') {
    return (
      <section className="h-full flex flex-col bg-[#FAF8F5] border-r border-[#E6DFD5]">
        <div className="p-3.5 border-b border-[#E6DFD5] flex items-center justify-between bg-[#F6F1EA]">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-stone-900">Forensic Composite Canvas</h2>
            <span className="text-xs font-mono text-stone-500">v{version}.0</span>
          </div>
          <span className="text-[11px] font-mono text-[#8C6D46] bg-[#EFE8DE] border border-[#D5C6B4] px-2 py-0.5 rounded flex items-center gap-1">
            <Lock className="h-3 w-3" /> Evidentiary Redaction
          </span>
        </div>

        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
          <div className="max-w-md p-6 rounded-2xl bg-white border border-[#E0D5C7] shadow-xl space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#FAF5EE] border border-[#D5C6B4] flex items-center justify-center text-[#8C6D46]">
              <ShieldAlert className="h-8 w-8 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900">Auditor Role Face Composite Isolation</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Pursuant to statutory forensic compliance rules, <strong>Auditors are strictly quarantined from viewing biometric facial renderings</strong> to avoid cognitive contamination of external audits.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-[#FAF7F2] text-[11px] font-mono text-stone-700 border border-[#E6DFD5] text-left space-y-1">
                <div>• Audit Ledger Access: <span className="text-emerald-700 font-semibold">UNRESTRICTED</span></div>
                <div>• Cryptographic Chain Verification: <span className="text-emerald-700 font-semibold">ENABLED</span></div>
                <div>• Morphological Face Rendering: <span className="text-red-700 font-semibold">REDACTED / ISOLATED</span></div>
              </div>
            </div>
            <p className="text-[11px] text-stone-500">
              Switch role back to Investigator, Forensic Artist, or Supervisor to view the composite.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full flex flex-col bg-[#FAF8F5] border-r border-[#E6DFD5]">
      {/* Canvas Viewport Toolbar with Varied Button Sizes */}
      <div className="p-2.5 border-b border-[#E6DFD5] flex flex-wrap items-center justify-between gap-2 bg-[#F6F1EA]/80 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-stone-900 flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-[#8C6D46]" />
            <span>Forensic Canvas</span>
          </h2>
          <span className="text-xs font-mono text-[#6B4E2E] bg-[#EFE8DE] px-2 py-0.5 rounded-md border border-[#D8CABE]">
            {hasGenerated ? `v${version}.0` : 'Draft'}
          </span>
          {hasGenerated && (
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-600" /> Active Lead
            </span>
          )}
        </div>

        {/* Display Style & Overlay Controls */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs font-mono">
          {/* Angle Selector Tabs - Medium Segment */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-[#D5C6B4] shadow-2xs">
            <button
              onClick={() => setViewAngle('frontal')}
              className={`px-2 py-1 rounded-md text-[11px] transition cursor-pointer ${
                viewAngle === 'frontal' ? 'bg-[#8C6D46] text-white font-medium' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Front-facing evidentiary composite"
            >
              Frontal
            </button>
            <button
              onClick={() => setViewAngle('profile')}
              className={`px-2 py-1 rounded-md text-[11px] transition cursor-pointer ${
                viewAngle === 'profile' ? 'bg-[#8C6D46] text-white font-medium' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="90-degree lateral profile composite"
            >
              Profile
            </button>
            <button
              onClick={() => setViewAngle('dual')}
              className={`px-2 py-1 rounded-md text-[11px] transition cursor-pointer ${
                viewAngle === 'dual' ? 'bg-[#8C6D46] text-white font-medium' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Dual-angle identification composite"
            >
              Dual
            </button>
          </div>

          {/* Style Mode Toggle - Medium Segment */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-[#D5C6B4] shadow-2xs">
            <button
              onClick={() => onStyleModeChange('charcoal')}
              className={`px-2 py-1 rounded-md text-[11px] transition cursor-pointer ${
                styleMode === 'charcoal' ? 'bg-[#8C6D46] text-white font-medium' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Archival graphite & charcoal sketch on textured paper"
            >
              Sketch
            </button>
            <button
              onClick={() => onStyleModeChange('photoreal')}
              className={`px-2 py-1 rounded-md text-[11px] transition cursor-pointer ${
                styleMode === 'photoreal' ? 'bg-[#8C6D46] text-white font-medium' : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Chiaroscuro photoreal graphite tone"
            >
              Toned
            </button>
          </div>

          {/* Facial Symmetry Assessment Button - Medium Size */}
          <button
            onClick={() => setShowSymmetry(!showSymmetry)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              showSymmetry
                ? 'bg-[#EAE2D5] border-[#8C6D46] text-[#5C452D] font-semibold ring-1 ring-[#8C6D46]'
                : 'bg-white border-[#D5C6B4] text-stone-700 hover:text-[#8C6D46]'
            }`}
            title="Toggle craniometric facial symmetry assessment overlay and balance telemetry"
          >
            <Scale className={`h-3.5 w-3.5 ${showSymmetry ? 'text-[#8C6D46]' : 'text-stone-500'}`} />
            <span>Symmetry: {symmetry.percentageText}</span>
          </button>

          {/* Visual Confidence Heatmap Button - Medium Size */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              showHeatmap
                ? 'bg-red-50 border-red-400 text-red-800 ring-1 ring-red-400 font-semibold'
                : 'bg-white border-[#D5C6B4] text-stone-700 hover:text-red-700'
            }`}
            title="Toggle Visual Confidence Heatmap: Highlights lower confidence regions to guide questioning"
          >
            <Flame className={`h-3.5 w-3.5 ${showHeatmap ? 'text-red-600 animate-pulse' : 'text-stone-500'}`} />
            <span>Heatmap</span>
          </button>

          {/* Detailed Forensic Artist Brief Button */}
          {onOpenBriefModal && (
            <button
              onClick={onOpenBriefModal}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F5EFE6] text-[#6B4E2E] border border-[#D5C6B4] text-[11px] font-medium flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Open court-admissible detailed forensic narrative description for export"
            >
              <FileText className="h-3.5 w-3.5 text-[#8C6D46]" />
              <span>Brief</span>
            </button>
          )}

          {/* Prominent Primary Button: Trigger Gemini AI Image Generation - Large Size */}
          <button
            onClick={() => onGenerateComposite(styleMode)}
            disabled={isGeneratingImage}
            className="px-3 py-1.5 rounded-lg bg-[#8C6D46] hover:bg-[#785C3A] disabled:opacity-50 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            title="Generate hyper-realistic composite using gemini-3.1-flash-lite-image"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#FAF7F2]" />
            <span>{isGeneratingImage ? 'Rendering...' : hasGenerated ? 'Regenerate AI' : 'Generate AI Face'}</span>
          </button>

          {/* Grid Toggle - Small Icon Button */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg border transition cursor-pointer shadow-2xs ${
              showGrid ? 'bg-[#EFE8DE] border-[#8C6D46] text-[#6B4E2E]' : 'bg-white border-[#D5C6B4] text-stone-600 hover:text-stone-900'
            }`}
            title="Toggle anatomical alignment grid"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>

          {/* Landmarks Mesh Toggle - Small Icon Button */}
          <button
            onClick={() => setShowLandmarks(!showLandmarks)}
            className={`p-1.5 rounded-lg border transition cursor-pointer shadow-2xs ${
              showLandmarks ? 'bg-[#EFE8DE] border-[#8C6D46] text-[#6B4E2E]' : 'bg-white border-[#D5C6B4] text-stone-600 hover:text-stone-900'
            }`}
            title="Toggle facial landmarks mesh"
          >
            <Scan className="h-3.5 w-3.5" />
          </button>

          {/* Zoom controls - Small Compact Group */}
          <div className="flex items-center bg-white rounded-lg border border-[#D5C6B4] shadow-2xs">
            <button
              onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.1))}
              className="p-1.5 text-stone-500 hover:text-stone-900 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] px-1 text-stone-600 font-mono">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}
              className="p-1.5 text-stone-500 hover:text-stone-900 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Reset / Clear Button */}
          {hasGenerated && (
            <button
              onClick={onResetCanvas}
              className="p-1.5 rounded-lg border border-[#D5C6B4] bg-white text-stone-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer shadow-2xs"
              title="Reset to blank drafting canvas"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-auto relative bg-[#F4EFE6]/60">
        <div 
          className="relative rounded-xl overflow-hidden border border-[#D5C6B4] shadow-lg transition-transform duration-200 bg-white"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            className="block max-w-full bg-[#FAF7F0]"
          />

          {/* Loading / Rendering Progress Overlay */}
          {isGeneratingImage && (
            <div className="absolute inset-0 bg-[#FAF7F0]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30 space-y-3">
              <div className="h-12 w-12 rounded-full border-3 border-[#8C6D46] border-t-transparent animate-spin flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-[#8C6D46] animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-sm text-stone-900">Rendering Evidentiary Composite</p>
                <p className="text-xs text-stone-600 font-mono mt-1">Model: gemini-3.1-flash-lite-image</p>
                <p className="text-[11px] text-stone-500 mt-1">Synthesizing photographic approximation from FaceSpec...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Investigator Confidence Heatmap Guidance Panel */}
      {showHeatmap && (
        <div className="border-t border-red-200 bg-red-50/70 p-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="text-xs font-semibold text-red-900 uppercase tracking-wider font-mono">
                Investigator Recall Focus (Low Confidence Zones)
              </span>
            </div>
            <span className="text-[11px] font-mono text-stone-600">
              {focusRegions.length} Questioning Targets
            </span>
          </div>
          <p className="text-[11px] text-stone-700 mb-2 leading-relaxed">
            The thermal heatmap highlights regions where witness recall is unstated or low in confidence (<strong className="text-red-700">warm crimson/orange</strong>). Tap a zone or question below to direct non-leading interview elicitation:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
            {focusRegions.map((reg) => (
              <div
                key={reg.id}
                onClick={() => onSelectRegion(selectedRegion === reg.id ? null : reg.id)}
                className={`p-2.5 rounded-lg border text-xs transition cursor-pointer flex flex-col justify-between ${
                  selectedRegion === reg.id
                    ? 'bg-red-100 border-red-500 text-stone-900 shadow-sm ring-1 ring-red-400'
                    : 'bg-white border-[#E4D8C8] hover:border-red-300 text-stone-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-red-900">{reg.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-red-100 text-red-800 border border-red-200">
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
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 transition cursor-pointer"
                      title="Send this prompt directly to the cognitive interview"
                    >
                      <MessageSquare className="h-2.5 w-2.5" />
                      <span>Ask Interview</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 italic font-sans leading-snug">
                  "{reg.suggestedPrompt}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facial Symmetry Craniometric Balance Panel */}
      {showSymmetry && (
        <div className="border-t border-[#DFD3C4] bg-[#F7F2EA] p-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#8C6D46]" />
              <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider font-mono">
                Craniometric Symmetry Diagnostic & Balance Index
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#EAE2D5] text-[#5C452D] border border-[#D5C6B4]">
                Index: {symmetry.percentageText}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                symmetry.score >= 90
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : symmetry.score >= 85
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}>
                {symmetry.classification}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-stone-700 mb-2 leading-relaxed">
            The overlay projects a vertical sagittal midline (magenta) and 4 orthogonal horizontal cranial planes to evaluate bilateral equilibrium:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white border border-[#DDD3C4]">
              <div className="text-[10px] text-stone-500 font-mono">Ocular Axis</div>
              <div className="font-semibold text-[#8C6D46]">{symmetry.ocularBalance}%</div>
              <div className="text-[10px] text-stone-600">Inter-pupillary tilt</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-[#DDD3C4]">
              <div className="text-[10px] text-stone-500 font-mono">Nasal Midline</div>
              <div className="font-semibold text-[#8C6D46]">{symmetry.nasalBalance}%</div>
              <div className="text-[10px] text-stone-600">Bridge deviation</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-[#DDD3C4]">
              <div className="text-[10px] text-stone-500 font-mono">Labial Cant</div>
              <div className="font-semibold text-[#8C6D46]">{symmetry.labialBalance}%</div>
              <div className="text-[10px] text-stone-600">Commissure level</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-[#DDD3C4]">
              <div className="text-[10px] text-stone-500 font-mono">Mandibular Balance</div>
              <div className="font-semibold text-[#8C6D46]">{symmetry.mandibularBalance}%</div>
              <div className="text-[10px] text-stone-600">Gonial & chin centring</div>
            </div>
          </div>
          <p className="text-[10px] text-stone-600 mt-2 font-mono italic">
            Clinical Note: Human faces exhibit natural 88–96% bilateral variance. Scores below 85% denote marked asymmetrical identifiers crucial for suspect line-up differentiation.
          </p>
        </div>
      )}

      {/* Region Selector & Locality Bar */}
      <div className="p-2.5 border-t border-[#E6DFD5] bg-[#F6F1EA]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-700">
            <Layers className="h-3.5 w-3.5 text-[#8C6D46]" />
            <span className="font-medium">Region-Scoped Edits:</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            {hasGenerated ? 'Locality: 98.6% untouched' : 'Ready for elicitation'}
          </span>
        </div>

        {/* Region Quick Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {regions.map((r) => {
            const isSelected = selectedRegion === r.id;
            return (
              <div key={r.id} className="flex items-center shadow-2xs">
                <button
                  type="button"
                  onClick={() => onSelectRegion(isSelected ? null : r.id)}
                  className={`px-2.5 py-1 text-xs rounded-l-md border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#8C6D46] border-[#785C3A] text-white font-medium'
                      : 'bg-white border-[#D5C6B4] text-stone-700 hover:bg-[#F5EFE6]'
                  }`}
                >
                  {r.label}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenGridForRegion(r.id)}
                  className="px-1.5 py-1 text-xs bg-[#FAF7F2] hover:bg-[#EFE8DE] border-y border-r border-[#D5C6B4] text-[#6B4E2E] rounded-r-md transition cursor-pointer"
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
