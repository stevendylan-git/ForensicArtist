import React, { useState, useRef, useEffect } from 'react';
import { 
  Grid3X3, 
  X, 
  Check, 
  Sparkles, 
  HelpCircle, 
  Sliders, 
  Layers, 
  ArrowRight,
  ZoomIn,
  Maximize2
} from 'lucide-react';
import { FaceSpec, CandidateVariation } from '../types';
import { drawForensicComposite } from '../services/canvasRenderer';
import { applyCandidateVariationToFaceSpec } from '../services/faceSpecEngine';

interface RecognitionGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  faceSpec: FaceSpec;
  caseNumber: string;
  version: number;
  onSelectCandidate: (feature: string, value: string) => void;
  initialFeature?: string;
}

// Sub-component for individual candidate variation canvas card
interface CandidateCardProps {
  cand: CandidateVariation;
  faceSpec: FaceSpec;
  selectedFeature: string;
  caseNumber: string;
  version: number;
  focusView: boolean;
  isFocused: boolean;
  onPick: (val: string) => void;
  onBlend: (idx: number) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  cand,
  faceSpec,
  selectedFeature,
  caseNumber,
  version,
  focusView,
  isFocused,
  onPick,
  onBlend,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derive preview FaceSpec specifically for this variation candidate
  const previewSpec = applyCandidateVariationToFaceSpec(
    faceSpec,
    selectedFeature,
    cand.variationValue
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawForensicComposite(ctx, previewSpec, {
      width: canvas.width,
      height: canvas.height,
      styleMode: 'charcoal',
      viewAngle: 'frontal',
      caseNumber,
      version,
      hasGenerated: true,
      hideWatermarks: true,
      focusFeature: focusView ? selectedFeature : null,
      highlightRegion: selectedFeature,
    });
  }, [previewSpec, selectedFeature, focusView, caseNumber, version]);

  return (
    <div
      className={`rounded-xl border overflow-hidden bg-white transition flex flex-col shadow-2xs ${
        isFocused
          ? 'border-[#8C6D46] shadow-lg ring-2 ring-[#8C6D46]'
          : 'border-[#D5C6B4] hover:border-[#BFB09E]'
      }`}
    >
      {/* Candidate Header */}
      <div className="px-3 py-1.5 bg-[#F6F1EA] border-b border-[#E6DFD5] flex items-center justify-between text-xs">
        <span className="font-mono text-[#8C6D46] font-semibold flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#8C6D46] animate-pulse"></span>
          Candidate #{cand.candidateIndex}
        </span>
        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          Locality: 98.4%
        </span>
      </div>

      {/* Candidate Visual Preview Canvas */}
      <div className="p-3 bg-[#FAF7F0] flex items-center justify-center relative">
        <div className="w-48 h-48 sm:w-52 sm:h-52 bg-[#FAF7F0] rounded-xl border border-[#D5C6B4] overflow-hidden relative shadow-inner group">
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            className="w-full h-full block"
          />

          {/* Quick Hover Overlay */}
          <div className="absolute inset-0 bg-[#3E3226]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3 backdrop-blur-2xs">
            <button
              onClick={() => onPick(cand.variationValue)}
              className="px-3 py-2 rounded-lg bg-[#8C6D46] hover:bg-[#785C3A] text-white text-xs font-semibold shadow-md flex items-center gap-1 cursor-pointer transition"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Select This</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Value & Action Bar */}
      <div className="p-3 bg-[#FAF8F5] border-t border-[#E6DFD5] flex-1 flex flex-col justify-between space-y-2">
        <div>
          <span className="text-[10px] font-mono text-stone-500 uppercase block">Morphological Value</span>
          <p className="text-xs font-semibold text-stone-900 mt-0.5 leading-snug">
            "{cand.variationValue}"
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#EFE7DC]">
          <button
            type="button"
            onClick={() => onBlend(cand.candidateIndex)}
            className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#F2ECE1] border border-[#D5C6B4] text-[#6B4E2E] text-[11px] font-medium transition cursor-pointer text-center"
            title="Generate subtler variations centered around this candidate"
          >
            Blend Toward
          </button>
          <button
            type="button"
            onClick={() => onPick(cand.variationValue)}
            className="px-2 py-1.5 rounded-lg bg-[#8C6D46] hover:bg-[#785C3A] text-white text-[11px] font-medium transition cursor-pointer text-center shadow-2xs"
          >
            Pick Feature
          </button>
        </div>
      </div>
    </div>
  );
};

export const RecognitionGridModal: React.FC<RecognitionGridModalProps> = ({
  isOpen,
  onClose,
  faceSpec,
  caseNumber,
  version,
  onSelectCandidate,
  initialFeature = 'nose',
}) => {
  const [selectedFeature, setSelectedFeature] = useState<string>(initialFeature);
  const [spread, setSpread] = useState<'narrow' | 'medium' | 'wide'>('medium');
  const [focusedCandidate, setFocusedCandidate] = useState<number | null>(null);
  const [focusView, setFocusView] = useState<boolean>(true);

  useEffect(() => {
    if (initialFeature) {
      setSelectedFeature(initialFeature);
    }
  }, [initialFeature]);

  if (!isOpen) return null;

  // Curated variation libraries per region
  const featureCatalogs: Record<string, { label: string; variations: string[] }> = {
    nose: {
      label: 'Nose (Bridge & Tip)',
      variations: [
        'narrow straight defined', 'prominent high bridge hook', 'broad flat bridge flared',
        'subtle button upturned', 'aquiline curved ridge', 'wide rounded bulbous',
        'slight crooked deviation', 'concave delicate bridge', 'strong masculine dorsal'
      ]
    },
    eyebrows: {
      label: 'Eyebrows (Arch & Density)',
      variations: [
        'thick bushy dark', 'sharp high arched', 'straight horizontal heavy',
        'sparse light trimmed', 'monobrow prominent', 'subtle curved natural',
        'downturned tapered', 'thick soft rounded', 'angled sharp brows'
      ]
    },
    eyes: {
      label: 'Eyes (Shape & Socket)',
      variations: [
        'deep-set almond dark', 'narrow hooded eyes', 'large round wide-set',
        'downturned tired eyes', 'close-set piercing eyes', 'upturned cat-like almond',
        'heavy upper eyelid crease', 'prominent orbital bone', 'subtle monolid dark'
      ]
    },
    hair: {
      label: 'Hair Style & Length',
      variations: [
        'short wavy dark', 'clean buzzcut fade', 'slicked back parted',
        'curly textured volume', 'messy textured fringe', 'receding hairline dark',
        'crew cut military', 'medium shaggy brown', 'clean shaven bald'
      ]
    },
    mouth_lips: {
      label: 'Mouth & Lips',
      variations: [
        'full plump defined', 'thin narrow pencil lips', 'prominent cupid\'s bow',
        'wide broad mouth', 'downturned sad corners', 'subtle sarcastic smirk',
        'full lower pout', 'balanced natural contour', 'heavy lower lip'
      ]
    },
    jawline_chin: {
      label: 'Jawline & Chin Contour',
      variations: [
        'sharp angular jaw', 'broad square chiseled', 'pointed narrow chin',
        'cleft chin defined', 'soft rounded jaw', 'receding subtle chin',
        'prominent jutting chin', 'oval taper jawline', 'heavy set jaw'
      ]
    },
    face_shape: {
      label: 'Overall Craniofacial Shape',
      variations: [
        'angular diamond', 'classic oval', 'broad square',
        'round soft contour', 'oblong elongated', 'heart shaped tapered',
        'narrow chiseled', 'stout wide jawed', 'balanced symmetrical'
      ]
    },
    facial_hair: {
      label: 'Facial Hair',
      variations: [
        'clean-shaven', '5 o\'clock stubble', 'neat trim goatee',
        'full dark beard', 'light moustache', 'heavy stubble jaw',
        'chin strap beard', 'horseshoe mustache', 'sparse chin whiskers'
      ]
    }
  };

  const currentCatalog = featureCatalogs[selectedFeature] || featureCatalogs.nose;

  // Generate 9 candidate variations
  const candidates: CandidateVariation[] = currentCatalog.variations.map((val, idx) => ({
    candidateIndex: idx + 1,
    variationFeature: selectedFeature,
    variationValue: val,
    imageSeed: idx * 100 + 42,
    localityScore: 98.4,
    label: val,
  }));

  const handlePickCandidate = (val: string) => {
    onSelectCandidate(selectedFeature, val);
    onClose();
  };

  const handleBlendToward = (idx: number) => {
    setFocusedCandidate(idx);
    setSpread('narrow');
  };

  const handleNoneOfThese = () => {
    setSpread('wide');
    setFocusedCandidate(null);
  };

  // Helper to extract baseline description for the selected feature
  const getBaselineText = (): string => {
    if (selectedFeature === 'nose') {
      const parts = [faceSpec.nose.bridge.value, faceSpec.nose.width.value, faceSpec.nose.tip.value]
        .filter(v => v && v !== 'unknown');
      return parts.length > 0 ? parts.join(', ') : 'Neutral / unstated';
    }
    if (selectedFeature === 'eyes') {
      const parts = [faceSpec.eyes.shape.value, faceSpec.eyes.spacing.value]
        .filter(v => v && v !== 'unknown');
      return parts.length > 0 ? parts.join(', ') : 'Neutral / unstated';
    }
    if (selectedFeature === 'eyebrows') {
      return faceSpec.eyebrows.stated ? faceSpec.eyebrows.value : 'Neutral / unstated';
    }
    if (selectedFeature === 'hair') {
      const parts = [faceSpec.hair.style.value, faceSpec.hair.length.value, faceSpec.hair.hairline.value]
        .filter(v => v && v !== 'unknown');
      return parts.length > 0 ? parts.join(', ') : 'Neutral / unstated';
    }
    if (selectedFeature === 'mouth_lips') {
      return faceSpec.mouth_lips.stated ? faceSpec.mouth_lips.value : 'Neutral / unstated';
    }
    if (selectedFeature === 'jawline_chin') {
      return faceSpec.jawline_chin.stated ? faceSpec.jawline_chin.value : 'Neutral / unstated';
    }
    if (selectedFeature === 'face_shape') {
      return faceSpec.face_shape.stated ? faceSpec.face_shape.value : 'Neutral / unstated';
    }
    if (selectedFeature === 'facial_hair') {
      return faceSpec.facial_hair.stated ? faceSpec.facial_hair.value : 'Neutral / unstated';
    }
    return 'Neutral baseline';
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#D5C6B4] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E6DFD5] flex items-center justify-between bg-[#F6F1EA]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#EFE8DE] border border-[#D8CABE] flex items-center justify-center text-[#8C6D46]">
              <Grid3X3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-stone-900">3×3 Eyewitness Recognition Grid</h2>
              <p className="text-xs text-stone-600">
                Cognitive variation grid varying <strong>ONLY</strong> the selected feature while keeping all other regions locked.
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

        {/* Controls Toolbar */}
        <div className="p-3.5 border-b border-[#E6DFD5] bg-[#F6F1EA]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="text-stone-700 font-medium">Vary Feature:</span>
            <select
              value={selectedFeature}
              onChange={(e) => {
                setSelectedFeature(e.target.value);
                setFocusedCandidate(null);
              }}
              className="bg-white border border-[#D5C6B4] text-stone-900 font-medium px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer shadow-2xs"
            >
              {Object.entries(featureCatalogs).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            {/* View Mode Toggle: Close-Up vs Full Face */}
            <div className="flex items-center bg-white rounded-lg border border-[#D5C6B4] p-0.5 ml-2 shadow-2xs">
              <button
                onClick={() => setFocusView(true)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                  focusView ? 'bg-[#8C6D46] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Zoom directly into the target facial feature"
              >
                <ZoomIn className="h-3 w-3" />
                <span>Feature Close-Up</span>
              </button>
              <button
                onClick={() => setFocusView(false)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                  !focusView ? 'bg-[#8C6D46] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="View candidate variation in full facial composite context"
              >
                <Maximize2 className="h-3 w-3" />
                <span>Full Face</span>
              </button>
            </div>
          </div>

          {/* Spread Controls & None of These */}
          <div className="flex items-center gap-2">
            <span className="text-stone-700 font-medium">Spread:</span>
            <div className="flex items-center bg-white rounded-lg border border-[#D5C6B4] p-0.5 shadow-2xs">
              <button
                onClick={() => setSpread('narrow')}
                className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
                  spread === 'narrow' ? 'bg-[#8C6D46] text-white font-medium' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Narrow
              </button>
              <button
                onClick={() => setSpread('medium')}
                className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
                  spread === 'medium' ? 'bg-[#8C6D46] text-white font-medium' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setSpread('wide')}
                className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
                  spread === 'wide' ? 'bg-[#8C6D46] text-white font-medium' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Wide
              </button>
            </div>

            <button
              onClick={handleNoneOfThese}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F2ECE1] border border-[#D5C6B4] text-[#6B4E2E] text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              None of These
            </button>
          </div>
        </div>

        {/* Informational Sub-header */}
        <div className="px-5 py-2 bg-[#F2ECE1] border-b border-[#E6DFD5] flex items-center justify-between text-xs text-stone-700 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-sans">Current Baseline:</span>
            <span className="text-stone-900 font-semibold">{getBaselineText()}</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            <span>Evidentiary Invariant: All other facial features locked</span>
          </div>
        </div>

        {/* 3x3 Grid Matrix Body */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#FDFBF7]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((cand) => (
              <CandidateCard
                key={cand.candidateIndex}
                cand={cand}
                faceSpec={faceSpec}
                selectedFeature={selectedFeature}
                caseNumber={caseNumber}
                version={version}
                focusView={focusView}
                isFocused={focusedCandidate === cand.candidateIndex}
                onPick={handlePickCandidate}
                onBlend={handleBlendToward}
              />
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#F6F1EA] border-t border-[#E6DFD5] flex items-center justify-between text-xs font-mono">
          <span className="text-stone-600">
            Click 'Pick Feature' on any candidate to update the composite version and log to the audit ledger.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-[#D5C6B4] text-stone-800 hover:bg-[#EFE8DE] transition cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
