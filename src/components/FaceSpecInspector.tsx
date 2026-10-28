import React from 'react';
import { 
  FileText, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  HelpCircle, 
  Shield, 
  Quote,
  Sparkles
} from 'lucide-react';
import { FaceSpec, FeatureAttribute } from '../types';

interface FaceSpecInspectorProps {
  faceSpec: FaceSpec;
  onToggleLock: (fieldPath: string) => void;
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
}

export const FaceSpecInspector: React.FC<FaceSpecInspectorProps> = ({
  faceSpec,
  onToggleLock,
  selectedRegion,
  onSelectRegion,
}) => {
  // Flatten feature attributes into a display list
  const attributes: Array<{
    path: string;
    label: string;
    category: string;
    attr: FeatureAttribute;
  }> = [
    { path: 'gender_presentation', label: 'Gender / Sex', category: 'General', attr: faceSpec.gender_presentation },
    { path: 'approximate_age', label: 'Approximate Age', category: 'General', attr: faceSpec.approximate_age },
    { path: 'face_shape', label: 'Face Shape / Contour', category: 'Structure', attr: faceSpec.face_shape },
    { path: 'skin_tone_complexion', label: 'Skin Tone / Complexion', category: 'Structure', attr: faceSpec.skin_tone_complexion },
    { path: 'hair.style', label: 'Hair Style', category: 'Hair', attr: faceSpec.hair.style },
    { path: 'hair.color', label: 'Hair Color', category: 'Hair', attr: faceSpec.hair.color },
    { path: 'hair.length', label: 'Hair Length', category: 'Hair', attr: faceSpec.hair.length },
    { path: 'eyebrows', label: 'Eyebrows', category: 'Eyes', attr: faceSpec.eyebrows },
    { path: 'eyes.shape', label: 'Eye Shape', category: 'Eyes', attr: faceSpec.eyes.shape },
    { path: 'eyes.color', label: 'Eye Color', category: 'Eyes', attr: faceSpec.eyes.color },
    { path: 'eyes.spacing', label: 'Eye Spacing', category: 'Eyes', attr: faceSpec.eyes.spacing },
    { path: 'nose.width', label: 'Nose Width', category: 'Nose', attr: faceSpec.nose.width },
    { path: 'nose.bridge', label: 'Nose Bridge', category: 'Nose', attr: faceSpec.nose.bridge },
    { path: 'nose.tip', label: 'Nose Tip', category: 'Nose', attr: faceSpec.nose.tip },
    { path: 'mouth_lips', label: 'Mouth & Lips', category: 'Mouth', attr: faceSpec.mouth_lips },
    { path: 'jawline_chin', label: 'Jawline & Chin', category: 'Structure', attr: faceSpec.jawline_chin },
    { path: 'facial_hair', label: 'Facial Hair', category: 'Hair', attr: faceSpec.facial_hair },
    { path: 'distinguishing_marks.type', label: 'Distinguishing Marks', category: 'Marks', attr: faceSpec.distinguishing_marks.type },
    { path: 'accessories', label: 'Accessories', category: 'Accessories', attr: faceSpec.accessories },
    { path: 'expression', label: 'Expression', category: 'General', attr: faceSpec.expression },
  ];

  const totalStated = attributes.filter(a => a.attr.stated).length;
  const totalLocked = attributes.filter(a => a.attr.locked).length;

  return (
    <section className="h-full flex flex-col bg-slate-900/40">
      {/* Inspector Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-cyan-400" />
          <h2 className="font-semibold text-sm text-slate-100">FaceSpec Source of Truth</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
            {totalStated}/20 Stated
          </span>
          <span className="text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
            {totalLocked} Locked
          </span>
        </div>
      </div>

      {/* Evidentiary Notice Banner */}
      <div className="px-3.5 py-2.5 bg-slate-950/50 border-b border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
        <Shield className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong className="text-slate-300">Rule 3 Invariant:</strong> The structured JSON is the primary evidentiary record. Unstated attributes are strictly preserved as <code className="text-cyan-400 font-mono">unknown</code>.
        </span>
      </div>

      {/* Feature Attributes List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {attributes.map((item) => {
          const isStated = item.attr.stated;
          const isLocked = item.attr.locked;
          const isSelected = selectedRegion && item.path.startsWith(selectedRegion);

          return (
            <div
              key={item.path}
              onClick={() => onSelectRegion(isSelected ? null : item.path.split('.')[0])}
              className={`p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/50 border-cyan-500 shadow-sm'
                  : isStated
                  ? 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-900/30 border-slate-800/80 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  {isStated ? (
                    <CheckCircle2 className="h-3 w-3 text-cyan-400 shrink-0" />
                  ) : (
                    <HelpCircle className="h-3 w-3 text-slate-600 shrink-0" />
                  )}
                  {item.label}
                </span>

                <div className="flex items-center gap-2">
                  {/* Lock Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(item.path);
                    }}
                    className={`p-1 rounded transition cursor-pointer ${
                      isLocked
                        ? 'bg-amber-950 border border-amber-700 text-amber-300'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title={isLocked ? 'Locked against edits. Click to unlock.' : 'Click to lock region against subsequent modifications.'}
                  >
                    {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* Value and Confidence */}
              <div className="mt-1.5 flex items-center justify-between">
                <span className={`font-mono text-xs ${isStated ? 'text-white font-medium capitalize' : 'text-slate-500 italic'}`}>
                  {item.attr.value}
                </span>

                {isStated && (
                  <span className="text-[10px] font-mono text-cyan-400">
                    {Math.round(item.attr.confidence * 100)}% conf
                  </span>
                )}
              </div>

              {/* Confidence Progress Bar */}
              {isStated && (
                <div className="mt-1 h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${item.attr.confidence * 100}%` }}
                  />
                </div>
              )}

              {/* Verbatim Witness Phrasing */}
              {item.attr.verbatim && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 flex items-start gap-1 text-[11px] text-slate-400 italic">
                  <Quote className="h-2.5 w-2.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>"{item.attr.verbatim}"</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
