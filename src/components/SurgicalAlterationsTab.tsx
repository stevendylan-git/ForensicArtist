import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  Eye, 
  Layers, 
  SplitSquareVertical, 
  Download, 
  Info, 
  AlertTriangle, 
  SlidersHorizontal, 
  Maximize2, 
  X, 
  CheckCircle2, 
  RefreshCw,
  Scale,
  FileText,
  Scissors,
  Crosshair,
  UserCheck
} from 'lucide-react';
import { FaceSpec, ForensicCase, UserRole } from '../types';
import { 
  POPULAR_SURGICAL_PROCEDURES, 
  SurgicalProcedure, 
  renderSurgicalTransformation 
} from '../services/surgicalAlterations';
import { drawForensicComposite } from '../services/canvasRenderer';
import { generateSurgicalAlteration } from '../services/api';

interface SurgicalAlterationsTabProps {
  faceSpec: FaceSpec;
  aiImageUrl: string | null;
  hasGenerated: boolean;
  activeCase: ForensicCase;
  currentRole: UserRole;
  styleMode: 'charcoal' | 'photoreal';
  onGenerateInitialComposite?: () => void;
  onLogAuditAction?: (action: string, details: Record<string, any>) => void;
}

export const SurgicalAlterationsTab: React.FC<SurgicalAlterationsTabProps> = ({
  faceSpec,
  aiImageUrl,
  hasGenerated,
  activeCase,
  currentRole,
  styleMode,
  onGenerateInitialComposite,
  onLogAuditAction,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showIncisionGuides, setShowIncisionGuides] = useState(false);
  const [showSurgicalCalipers, setShowSurgicalCalipers] = useState(false);
  const [showSplitView, setShowSplitView] = useState(false);
  const [splitPosition, setSplitPosition] = useState<number>(0.5);
  const [inspectProcedure, setInspectProcedure] = useState<SurgicalProcedure | null>(null);
  
  // Cache of AI generated alterations by procedure id
  const [aiGeneratedImages, setAiGeneratedImages] = useState<Record<string, string>>({});
  const [generatingProcedureId, setGeneratingProcedureId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Hidden base canvas used as source
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [baseImageReady, setBaseImageReady] = useState(false);

  // Render the base composite once onto a hidden 512x512 canvas
  useEffect(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 512;
    canvas.height = 512;

    if (aiImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);
        setBaseImageReady(true);
      };
      img.src = aiImageUrl;
    } else {
      // Draw procedural sketch composite onto base canvas
      drawForensicComposite(ctx, faceSpec, {
        width: 512,
        height: 512,
        styleMode,
        caseNumber: activeCase.caseNumber,
        version: 1,
        hasGenerated: true,
      });
      setBaseImageReady(true);
    }
  }, [aiImageUrl, faceSpec, styleMode, activeCase.caseNumber]);

  const filteredProcedures = POPULAR_SURGICAL_PROCEDURES.filter((proc) => {
    if (selectedCategory === 'ALL') return true;
    return proc.category === selectedCategory;
  });

  // Handle individual AI alteration request via Gemini
  const handleGenerateAiVariant = async (proc: SurgicalProcedure) => {
    setGeneratingProcedureId(proc.id);
    setStatusNotice(`Synthesizing hyper-realistic post-operative preview for ${proc.name}...`);
    try {
      // Get base image base64
      let baseBase64 = aiImageUrl || undefined;
      if (!baseBase64 && baseCanvasRef.current) {
        baseBase64 = baseCanvasRef.current.toDataURL('image/png');
      }

      const res = await generateSurgicalAlteration({
        baseImageBase64: baseBase64,
        procedureId: proc.id,
        procedureName: proc.name,
        promptModifier: proc.promptModifier,
        styleMode,
      });

      if (res.imageUrl) {
        setAiGeneratedImages((prev) => ({
          ...prev,
          [proc.id]: res.imageUrl!,
        }));
        setStatusNotice(`Successfully generated AI variation for ${proc.name}`);
      } else {
        setStatusNotice(`Applied procedural morphological reconstruction for ${proc.name}`);
      }

      onLogAuditAction?.('SURGICAL_PROJECTION_GENERATED', {
        procedureId: proc.id,
        procedureName: proc.name,
        disruptionScore: proc.biometricDisruption,
        caseNumber: activeCase.caseNumber,
      });
    } catch (err: any) {
      console.warn('Failed to generate AI surgical variant:', err);
      setStatusNotice(`Rendered precision anatomical simulation for ${proc.name}`);
    } finally {
      setGeneratingProcedureId(null);
    }
  };

  // Export a procedure as an official Law Enforcement Bulletin (PNG)
  const handleExportBulletin = (proc: SurgicalProcedure) => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1200;
    exportCanvas.height = 700;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0F0E0D';
    ctx.fillRect(0, 0, 1200, 700);

    // Header banner
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(0, 0, 1200, 90);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(0, 87, 1200, 3);

    // Header text
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('FORENSIC INTELLIGENCE BULLETIN: FUGITIVE SURGICAL ALTERATION FORECAST', 40, 42);

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#A8A29E';
    ctx.fillText(`CASE: ${activeCase.caseNumber}  |  OFFENSE: ${activeCase.offense}  |  DATE: ${new Date().toISOString().slice(0, 10)}`, 40, 70);

    // Draw Original Baseline Portrait
    if (baseCanvasRef.current) {
      ctx.drawImage(baseCanvasRef.current, 60, 120, 420, 420);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 120, 420, 420);

      ctx.fillStyle = '#1C1917';
      ctx.fillRect(60, 545, 420, 40);
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#FAF7F2';
      ctx.fillText('BASELINE SUSPECT COMPOSITE', 140, 570);
    }

    // Draw Altered Portrait
    const alteredCanvas = document.createElement('canvas');
    alteredCanvas.width = 512;
    alteredCanvas.height = 512;
    if (baseCanvasRef.current) {
      renderSurgicalTransformation(baseCanvasRef.current, alteredCanvas, proc, {
        showIncisionGuides: true,
        showSurgicalCalipers: true,
      });
      ctx.drawImage(alteredCanvas, 520, 120, 420, 420);
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 2;
      ctx.strokeRect(520, 120, 420, 420);

      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(520, 545, 420, 40);
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#FEE2E2';
      ctx.fillText(`POST-SURGERY: ${proc.name.split('(')[0].trim().toUpperCase()}`, 540, 570);
    }

    // Right Column: Disruption metrics & Law enforcement alerts
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(960, 120, 200, 465);
    ctx.strokeStyle = '#292524';
    ctx.strokeRect(960, 120, 200, 465);

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#EAB308';
    ctx.fillText('BIOMETRIC IMPACT', 980, 150);

    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.fillStyle = proc.biometricDisruption > 85 ? '#EF4444' : '#F59E0B';
    ctx.fillText(`${proc.biometricDisruption}%`, 980, 195);

    ctx.font = '10px "Inter", sans-serif';
    ctx.fillStyle = '#D6D3D1';
    ctx.fillText('Facial Recognition Disruption', 980, 215);

    ctx.fillStyle = '#292524';
    ctx.fillRect(980, 235, 160, 1);

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText('PRIMARY NODAL SHIFT:', 980, 260);

    ctx.font = '10px "Inter", sans-serif';
    ctx.fillStyle = '#A8A29E';
    const words = proc.primaryNodalPoint.split(' ');
    ctx.fillText(words.slice(0, 3).join(' '), 980, 280);
    ctx.fillText(words.slice(3).join(' '), 980, 295);

    ctx.fillStyle = '#292524';
    ctx.fillRect(980, 315, 160, 1);

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#EF4444';
    ctx.fillText('BORDER APB ADVISORY:', 980, 340);

    ctx.font = '9px "Inter", sans-serif';
    ctx.fillStyle = '#A8A29E';
    ctx.fillText('Target columellar, pre-auricular', 980, 360);
    ctx.fillText('and submental surgical access', 980, 375);
    ctx.fillText('scars under direct light.', 980, 390);

    // Footer
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#57534E';
    ctx.fillText('EVIDENTIARY CLASSIFICATION: LAW ENFORCEMENT SENSITIVE (LES) — SHA-256 AUDIT LOGGED', 40, 680);

    // Trigger download
    const link = document.createElement('a');
    link.download = `Fugitive-Alteration-${proc.id}-${activeCase.caseNumber}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();

    setStatusNotice(`Exported Fugitive Alteration Bulletin for ${proc.name}`);
  };

  return (
    <div className="flex-1 bg-[#FDFBF7] text-stone-900 flex flex-col h-[calc(100vh-57px)] overflow-hidden">
      {/* Hidden Base Canvas for source image rendering */}
      <canvas ref={baseCanvasRef} className="hidden" />

      {/* Top Banner & Control Toolbar */}
      <div className="border-b border-[#E6DFD5] bg-[#FAF8F5] px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
              <Scissors className="h-4 w-4 text-[#8C6D46]" />
              Fugitive Facial Plastic Surgery & Alteration Matrix
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold uppercase">
              Evidentiary Appearance Forecast
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Simulates the most common cosmetic surgical procedures fugitives utilize to circumvent automated CCTV facial recognition and eyewitness identification.
          </p>
        </div>

        {/* View Controls & Toggles */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Incision Guides Toggle */}
          <button
            type="button"
            onClick={() => setShowIncisionGuides(!showIncisionGuides)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
              showIncisionGuides
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-white hover:bg-[#F5EFE6] border-[#D5C6B4] text-stone-700'
            }`}
            title="Toggle forensic surgical incision line guides"
          >
            <Scissors className="h-3.5 w-3.5 text-red-500" />
            <span>Incision Guides</span>
          </button>

          {/* Calipers & Nodal Points Toggle */}
          <button
            type="button"
            onClick={() => setShowSurgicalCalipers(!showSurgicalCalipers)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
              showSurgicalCalipers
                ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                : 'bg-white hover:bg-[#F5EFE6] border-[#D5C6B4] text-stone-700'
            }`}
            title="Toggle biometric nodal calipers and distance markers"
          >
            <Crosshair className="h-3.5 w-3.5 text-cyan-600" />
            <span>Biometric Calipers</span>
          </button>

          {/* Before / After Split Slider Toggle */}
          <button
            type="button"
            onClick={() => setShowSplitView(!showSplitView)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
              showSplitView
                ? 'bg-[#EFE7DC] border-[#8C6D46] text-[#6B4E2E]'
                : 'bg-white hover:bg-[#F5EFE6] border-[#D5C6B4] text-stone-700'
            }`}
            title="Toggle side-by-side split comparison view"
          >
            <SplitSquareVertical className="h-3.5 w-3.5 text-[#8C6D46]" />
            <span>Split View</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills & Status Banner */}
      <div className="px-6 py-2 bg-[#F6F2EA] border-b border-[#E6DFD5] flex items-center justify-between gap-4 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-stone-500 text-[11px] uppercase mr-1">Anatomical Region:</span>
          {[
            { id: 'ALL', label: `All Procedures (${POPULAR_SURGICAL_PROCEDURES.length})` },
            { id: 'MIDFACE', label: 'Midface & Rhinoplasty' },
            { id: 'UPPER_FACE', label: 'Upper Face & Eyes' },
            { id: 'LOWER_THIRD', label: 'Jawline, Chin & Lips' },
            { id: 'COMPREHENSIVE', label: 'Full Disguise Overhaul' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#8C6D46] text-white shadow-2xs'
                  : 'bg-white hover:bg-[#EFE8DE] text-stone-700 border border-[#D8CABE]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {statusNotice && (
          <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-white px-2.5 py-1 rounded border border-[#D5C6B4] animate-in fade-in">
            <Info className="h-3.5 w-3.5 text-[#8C6D46]" />
            <span>{statusNotice}</span>
            <button
              onClick={() => setStatusNotice(null)}
              className="text-stone-400 hover:text-stone-700 ml-1 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Main Grid Viewport */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Baseline Reference Suspect Card */}
          <div className="bg-white rounded-xl border-2 border-[#8C6D46] shadow-sm overflow-hidden flex flex-col">
            <div className="p-3 bg-[#FAF8F5] border-b border-[#E6DFD5] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-xs font-semibold text-stone-900">
                  BASELINE SUSPECT PORTRAIT
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EFE8DE] text-[#6B4E2E] border border-[#D8CABE]">
                DATUM: 0% Δ
              </span>
            </div>

            <div className="relative aspect-square bg-stone-900 flex items-center justify-center overflow-hidden">
              {baseImageReady ? (
                <BaselineDisplay canvasRef={baseCanvasRef} />
              ) : (
                <div className="text-center p-4 text-stone-400 text-xs">
                  <p>Rendering initial composite datum...</p>
                </div>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white border border-white/20">
                CASE: {activeCase.caseNumber}
              </div>
            </div>

            <div className="p-3.5 text-xs flex-1 flex flex-col justify-between space-y-2.5 bg-[#FDFBF7]">
              <div>
                <p className="font-semibold text-stone-900 text-xs mb-1">
                  Evidentiary Source Baseline
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Direct cognitive interview reconstruction. All subsequent plastic surgery variations test craniometric divergence from this profile.
                </p>
              </div>

              <div className="pt-2 border-t border-[#EAE2D5] flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span>Rendering Mode:</span>
                <span className="capitalize font-semibold text-stone-800">{styleMode}</span>
              </div>
            </div>
          </div>

          {/* Procedure Variation Cards */}
          {filteredProcedures.map((proc) => (
            <ProcedureCard
              key={proc.id}
              procedure={proc}
              baseCanvasRef={baseCanvasRef}
              baseImageReady={baseImageReady}
              aiImageUrl={aiGeneratedImages[proc.id]}
              isGenerating={generatingProcedureId === proc.id}
              showIncisionGuides={showIncisionGuides}
              showSurgicalCalipers={showSurgicalCalipers}
              showSplitView={showSplitView}
              splitPosition={splitPosition}
              onGenerateAi={() => handleGenerateAiVariant(proc)}
              onInspect={() => setInspectProcedure(proc)}
              onExport={() => handleExportBulletin(proc)}
            />
          ))}
        </div>
      </div>

      {/* Inspect Modal with Draggable Split Comparison */}
      {inspectProcedure && (
        <InspectModal
          procedure={inspectProcedure}
          baseCanvasRef={baseCanvasRef}
          aiImageUrl={aiGeneratedImages[inspectProcedure.id]}
          onClose={() => setInspectProcedure(null)}
          onExport={() => handleExportBulletin(inspectProcedure)}
          activeCase={activeCase}
        />
      )}
    </div>
  );
};

// Sub-component: Displays base canvas cleanly
const BaselineDisplay: React.FC<{ canvasRef: React.RefObject<HTMLCanvasElement | null> }> = ({ canvasRef }) => {
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && displayCanvasRef.current) {
      const source = canvasRef.current;
      const target = displayCanvasRef.current;
      target.width = source.width;
      target.height = source.height;
      const ctx = target.getContext('2d');
      if (ctx) {
        ctx.drawImage(source, 0, 0);
      }
    }
  }, [canvasRef]);

  return <canvas ref={displayCanvasRef} className="w-full h-full object-cover" />;
};

// Sub-component: Individual Plastic Surgery Procedure Card
interface ProcedureCardProps {
  procedure: SurgicalProcedure;
  baseCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  baseImageReady: boolean;
  aiImageUrl?: string;
  isGenerating: boolean;
  showIncisionGuides: boolean;
  showSurgicalCalipers: boolean;
  showSplitView: boolean;
  splitPosition: number;
  onGenerateAi: () => void;
  onInspect: () => void;
  onExport: () => void;
}

const ProcedureCard: React.FC<ProcedureCardProps> = ({
  procedure,
  baseCanvasRef,
  baseImageReady,
  aiImageUrl,
  isGenerating,
  showIncisionGuides,
  showSurgicalCalipers,
  showSplitView,
  splitPosition,
  onGenerateAi,
  onInspect,
  onExport,
}) => {
  const targetCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!baseImageReady || !baseCanvasRef.current || !targetCanvasRef.current) return;

    const target = targetCanvasRef.current;
    target.width = 512;
    target.height = 512;

    if (aiImageUrl) {
      // Draw AI image onto canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const ctx = target.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 512, 512);
        }
      };
      img.src = aiImageUrl;
    } else {
      // Procedural transformation
      renderSurgicalTransformation(baseCanvasRef.current, target, procedure, {
        showIncisionGuides,
        showSurgicalCalipers,
        showBeforeAfterSplit: showSplitView,
        splitPosition,
      });
    }
  }, [baseImageReady, baseCanvasRef, procedure, aiImageUrl, showIncisionGuides, showSurgicalCalipers, showSplitView, splitPosition]);

  const disruptionColor =
    procedure.biometricDisruption >= 90
      ? 'text-red-700 bg-red-50 border-red-200'
      : procedure.biometricDisruption >= 80
      ? 'text-amber-800 bg-amber-50 border-amber-200'
      : 'text-stone-700 bg-stone-100 border-stone-200';

  return (
    <div className="bg-white rounded-xl border border-[#D5C6B4] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3 bg-[#FAF8F5] border-b border-[#E6DFD5] flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-stone-900 truncate" title={procedure.name}>
          {procedure.name.split('(')[0].trim()}
        </span>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold shrink-0 ${disruptionColor}`}>
          {procedure.biometricDisruption}% Disruption
        </span>
      </div>

      {/* Visual Canvas Viewport */}
      <div className="relative aspect-square bg-stone-950 flex items-center justify-center overflow-hidden group">
        <canvas ref={targetCanvasRef} className="w-full h-full object-cover" />

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 text-white">
            <Sparkles className="h-6 w-6 text-amber-400 animate-spin" />
            <span className="text-xs font-mono text-amber-200">Synthesizing with Gemini...</span>
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
          <button
            type="button"
            onClick={onInspect}
            className="p-2 rounded-lg bg-white/90 hover:bg-white text-stone-900 shadow-md transition cursor-pointer"
            title="Inspect side-by-side with draggable split slider"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onExport}
            className="p-2 rounded-lg bg-white/90 hover:bg-white text-stone-900 shadow-md transition cursor-pointer"
            title="Export Fugitive Bulletin (PNG)"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* Badges on preview */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-stone-300 border border-white/20">
            {procedure.category}
          </span>
          {aiImageUrl && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/90 text-white font-semibold">
              AI ENHANCED
            </span>
          )}
        </div>
      </div>

      {/* Body & Forensic Analysis */}
      <div className="p-3.5 text-xs flex-1 flex flex-col justify-between space-y-3 bg-[#FDFBF7]">
        <div className="space-y-2">
          <div>
            <span className="text-[10px] font-mono uppercase text-stone-500 block">Criminal Evasion Rationale:</span>
            <p className="text-[11px] text-stone-700 leading-relaxed mt-0.5">
              {procedure.criminalEvasionRationale}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-[#F5EFE6] border border-[#DFD3C4] text-[10px] text-stone-700">
            <span className="font-semibold text-stone-900 block font-mono uppercase text-[9px] mb-0.5">
              Detective Alert (Post-Op Scars):
            </span>
            <span>{procedure.forensicDetectionNotes}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-[#EAE2D5] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onGenerateAi}
            disabled={isGenerating}
            className="flex-1 py-1.5 px-2 bg-[#8C6D46] hover:bg-[#785C3A] text-white rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Generate photo-realistic AI variation using Gemini"
          >
            <Sparkles className="h-3 w-3" />
            <span>{aiImageUrl ? 'Regenerate AI' : 'AI Synthesize'}</span>
          </button>

          <button
            type="button"
            onClick={onInspect}
            className="py-1.5 px-2 bg-white hover:bg-[#F5EFE6] border border-[#D5C6B4] text-stone-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
            title="Full detail view"
          >
            Inspect
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Inspect Modal with Interactive Split Slider
interface InspectModalProps {
  procedure: SurgicalProcedure;
  baseCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  aiImageUrl?: string;
  onClose: () => void;
  onExport: () => void;
  activeCase: ForensicCase;
}

const InspectModal: React.FC<InspectModalProps> = ({
  procedure,
  baseCanvasRef,
  aiImageUrl,
  onClose,
  onExport,
  activeCase,
}) => {
  const [splitPos, setSplitPos] = useState(0.5);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!baseCanvasRef.current || !modalCanvasRef.current) return;
    const canvas = modalCanvasRef.current;
    canvas.width = 600;
    canvas.height = 600;

    renderSurgicalTransformation(baseCanvasRef.current, canvas, procedure, {
      showIncisionGuides: true,
      showSurgicalCalipers: true,
      showBeforeAfterSplit: true,
      splitPosition: splitPos,
    });
  }, [baseCanvasRef, procedure, splitPos]);

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0.1, Math.min(0.9, (e.clientX - rect.left) / rect.width));
    setSplitPos(x);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-[#FAF8F5] rounded-2xl border border-[#D5C6B4] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E6DFD5] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm sm:text-base flex items-center gap-2">
              <Scissors className="h-4 w-4 text-[#8C6D46]" />
              {procedure.name}
            </h3>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              Medical Terminology: {procedure.medicalName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-[#F5EFE6] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Interactive Split Viewport (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-center">
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerMove={handlePointerMove}
              className="relative aspect-square w-full max-w-[480px] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 shadow-inner select-none cursor-ew-resize"
            >
              <canvas ref={modalCanvasRef} className="w-full h-full object-cover" />

              {/* Draggable Divider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-[#8C6D46] shadow-lg pointer-events-none"
                style={{ left: `${splitPos * 100}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#8C6D46] border-2 border-white flex items-center justify-center text-white shadow-md">
                  <SplitSquareVertical className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 font-mono mt-2 text-center">
              Drag left / right to compare suspect baseline vs surgical projection
            </p>
          </div>

          {/* Details & Disruption Score (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5 text-xs">
              {/* Biometric Score Card */}
              <div className="p-3.5 rounded-xl bg-white border border-[#D5C6B4] shadow-2xs">
                <span className="text-[10px] font-mono text-stone-500 uppercase block">
                  Biometric Facial Recognition Disruption:
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-mono font-bold text-red-600">
                    {procedure.biometricDisruption}%
                  </span>
                  <span className="text-xs font-semibold text-stone-700">
                    High Evidentiary Impact
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mt-2 border border-stone-200">
                  <div
                    className="h-full bg-red-600 rounded-full"
                    style={{ width: `${procedure.biometricDisruption}%` }}
                  />
                </div>
              </div>

              {/* Surgical Description */}
              <div>
                <span className="font-semibold text-stone-900 block font-mono text-[11px] uppercase">
                  Surgical Procedure Protocol:
                </span>
                <p className="text-stone-700 mt-1 leading-relaxed">
                  {procedure.description}
                </p>
              </div>

              {/* Primary Biometric Nodal Coordinate Shift */}
              <div className="p-2.5 rounded-lg bg-[#FAF5EE] border border-[#E8DFD3]">
                <span className="font-semibold text-[#6B4E2E] block font-mono text-[11px] uppercase">
                  Primary Craniometric Disruption:
                </span>
                <p className="text-stone-800 font-mono text-[11px] mt-0.5">
                  {procedure.primaryNodalPoint}
                </p>
              </div>

              {/* Evasion Rationale */}
              <div>
                <span className="font-semibold text-stone-900 block font-mono text-[11px] uppercase">
                  Criminal Evasion Rationale:
                </span>
                <p className="text-stone-700 mt-1 leading-relaxed">
                  {procedure.criminalEvasionRationale}
                </p>
              </div>

              {/* Post-Op Indicators */}
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-950">
                <span className="font-semibold block font-mono text-[11px] uppercase">
                  Law Enforcement Post-Op Indicators:
                </span>
                <p className="text-[11px] mt-0.5">
                  {procedure.forensicDetectionNotes}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E6DFD5] flex items-center gap-2">
              <button
                type="button"
                onClick={onExport}
                className="flex-1 py-2 px-3 bg-[#8C6D46] hover:bg-[#785C3A] text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="h-4 w-4" />
                <span>Export Fugitive Bulletin (PNG)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 bg-white hover:bg-[#F5EFE6] border border-[#D5C6B4] text-stone-700 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
