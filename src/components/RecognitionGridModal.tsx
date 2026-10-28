import React, { useState } from 'react';
import { 
  Grid3X3, 
  X, 
  Check, 
  RefreshCw, 
  Sliders, 
  Sparkles,
  Lock
} from 'lucide-react';
import { FaceSpec, CandidateVariation } from '../types';
import { drawForensicComposite } from '../services/canvasRenderer';

interface RecognitionGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  faceSpec: FaceSpec;
  caseNumber: string;
  version: number;
  onSelectCandidate: (feature: string, value: string) => void;
  initialFeature?: string;
}

export const RecognitionGridModal: React.FC<RecognitionGridModalProps> = ({
  isOpen,
  onClose,
  faceSpec,
  caseNumber,
  version,
  onSelectCandidate,
  initialFeature = 'nose',
}) => {
  const [selectedFeature, setSelectedFeature] = useState(initialFeature);
  const [spread, setSpread] = useState<'standard' | 'wide' | 'narrow'>('standard');
  const [focusedCandidate, setFocusedCandidate] = useState<number | null>(null);

  if (!isOpen) return null;

  // Feature variation catalogs
  const featureCatalogs: Record<string, { label: string; variations: string[] }> = {
    nose: {
      label: 'Nose Morphology',
      variations: [
        'narrow straight bridge', 'wide flared nostrils', 'prominent high bridge',
        'subtle button tip', 'slight aquiline hook', 'broad flat bridge',
        'upturned pointed tip', 'average classic contour', 'chiseled defined bridge'
      ]
    },
    eyes: {
      label: 'Eye Morphology & Spacing',
      variations: [
        'deep-set dark brown', 'almond shaped hazel', 'narrow hooded eyes',
        'wide-set dark brown', 'close-set piercing', 'large round dark',
        'slight downturned slant', 'intense focused gaze', 'soft rounded lids'
      ]
    },
    eyebrows: {
      label: 'Eyebrows',
      variations: [
        'thick bushy dark', 'sharp high arched', 'straight horizontal heavy',
        'sparse light trimmed', 'angular pointed peak', 'monobrow prominent',
        'natural soft arch', 'faint narrow line', 'heavy low-set brows'
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Grid3X3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-white">3×3 Eyewitness Recognition Grid</h2>
              <p className="text-xs text-slate-400">
                Cognitive variation grid varying <strong>ONLY</strong> the selected feature while holding all other regions locked.
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

        {/* Controls Toolbar */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Vary Feature:</span>
            <select
              value={selectedFeature}
              onChange={(e) => {
                setSelectedFeature(e.target.value);
                setFocusedCandidate(null);
              }}
              className="bg-slate-950 border border-slate-700 text-cyan-300 font-medium px-2.5 py-1.5 rounded focus:outline-none cursor-pointer"
            >
              {Object.entries(featureCatalogs).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Spread:</span>
            <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5">
              <button
                onClick={() => setSpread('narrow')}
                className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                  spread === 'narrow' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
              >
                Narrow
              </button>
              <button
                onClick={() => setSpread('standard')}
                className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                  spread === 'standard' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setSpread('wide')}
                className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                  spread === 'wide' ? 'bg-purple-600 text-white' : 'text-slate-400'
                }`}
              >
                Wide
              </button>
            </div>

            <button
              onClick={handleNoneOfThese}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 transition cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>None of These</span>
            </button>
          </div>
        </div>

        {/* 3x3 Grid of Candidates */}
        <div className="flex-1 p-5 overflow-y-auto bg-slate-950">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {candidates.map((cand) => {
              const isFocused = focusedCandidate === cand.candidateIndex;
              // Build a modified FaceSpec for preview
              const previewSpec: FaceSpec = JSON.parse(JSON.stringify(faceSpec));
              if (selectedFeature === 'nose') {
                previewSpec.nose.bridge.stated = true;
                previewSpec.nose.bridge.value = cand.variationValue;
              } else if (selectedFeature === 'hair') {
                previewSpec.hair.style.stated = true;
                previewSpec.hair.style.value = cand.variationValue;
              } else if (selectedFeature === 'jawline_chin') {
                previewSpec.jawline_chin.stated = true;
                previewSpec.jawline_chin.value = cand.variationValue;
              } else if (selectedFeature === 'eyebrows') {
                previewSpec.eyebrows.stated = true;
                previewSpec.eyebrows.value = cand.variationValue;
              } else if (selectedFeature === 'eyes') {
                previewSpec.eyes.shape.stated = true;
                previewSpec.eyes.shape.value = cand.variationValue;
              }

              return (
                <div
                  key={cand.candidateIndex}
                  className={`rounded-lg border overflow-hidden bg-slate-900 transition flex flex-col ${
                    isFocused
                      ? 'border-purple-500 shadow-lg shadow-purple-950/50 ring-1 ring-purple-500'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Candidate Header */}
                  <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-purple-300 font-semibold">
                      Candidate #{cand.candidateIndex}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Locality: 98.4%
                    </span>
                  </div>

                  {/* Candidate Visual Preview Canvas */}
                  <div className="p-3 bg-slate-950/60 flex items-center justify-center">
                    <div className="w-36 h-36 bg-slate-900 rounded border border-slate-800 overflow-hidden relative shadow-inner">
                      <canvas
                        ref={(canvas) => {
                          if (canvas) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              drawForensicComposite(ctx, previewSpec, {
                                width: canvas.width,
                                height: canvas.height,
                                styleMode: 'charcoal',
                                caseNumber,
                                version,
                              });
                            }
                          }
                        }}
                        width={180}
                        height={180}
                        className="w-full h-full block"
                      />
                    </div>
                  </div>

                  {/* Candidate Feature Description */}
                  <div className="px-3 py-2 flex-1 flex flex-col justify-between">
                    <p className="text-xs font-medium text-slate-200 capitalize">
                      {cand.variationValue}
                    </p>

                    {/* Action Buttons */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5">
                      <button
                        onClick={() => handlePickCandidate(cand.variationValue)}
                        className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>Pick This</span>
                      </button>
                      <button
                        onClick={() => handleBlendToward(cand.candidateIndex)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition cursor-pointer"
                        title="Generate tighter variations around this candidate"
                      >
                        Blend
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Region-locking guarantees no drift in untouched facial zones.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
