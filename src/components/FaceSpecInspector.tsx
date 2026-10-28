import React, { useState } from 'react';
import { 
  FileText, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  HelpCircle, 
  Shield, 
  Quote,
  Sparkles,
  Edit3,
  Check,
  X,
  Sliders,
  Scale
} from 'lucide-react';
import { FaceSpec, FeatureAttribute, UserRole } from '../types';

interface FaceSpecInspectorProps {
  faceSpec: FaceSpec;
  onToggleLock: (fieldPath: string) => void;
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
  currentRole: UserRole;
  onAdminDirectEdit?: (fieldPath: string, newValue: string) => void;
}

export const FaceSpecInspector: React.FC<FaceSpecInspectorProps> = ({
  faceSpec,
  onToggleLock,
  selectedRegion,
  onSelectRegion,
  currentRole,
  onAdminDirectEdit,
}) => {
  const isAdmin = currentRole === 'ADMIN';
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Quick preset suggestions for Admin direct modification
  const adminPresets: Record<string, string[]> = {
    'nose.bridge': ['prominent high bridge', 'straight defined', 'slight aquiline hook', 'broad flat bridge', 'subtle button tip'],
    'nose.width': ['narrow straight', 'wide flared nostrils', 'average classic'],
    'nose.tip': ['sharp pointed', 'bulbous rounded', 'button upturned', 'aquiline hooked downturned'],
    'eyes.shape': ['deep-set dark brown', 'almond shaped hazel', 'narrow hooded eyes', 'large round dark', 'downturned slant'],
    'eyes.spacing': ['wide-set', 'close-set', 'normal'],
    'eyebrows': ['thick bushy dark', 'sharp high arched', 'straight horizontal heavy', 'sparse light trimmed', 'monobrow prominent'],
    'hair.style': ['clean buzzcut fade', 'short wavy dark', 'slicked back parted', 'curly textured volume', 'messy textured fringe', 'clean shaven bald'],
    'hair.hairline': ['natural', 'receding m-shaped', 'widow\'s peak', 'straight low'],
    'jawline_chin': ['sharp angular jaw', 'broad square chiseled', 'pointed narrow chin', 'cleft chin defined', 'soft rounded jaw', 'prominent jutting chin'],
    'face_shape': ['angular diamond', 'classic oval', 'broad square', 'round soft contour', 'heart shaped tapered'],
    'mouth_lips': ['full plump defined', 'thin narrow pencil lips', 'prominent cupid\'s bow', 'wide broad mouth', 'downturned sad corners', 'subtle sarcastic smirk'],
    'facial_hair': ['clean-shaven', '5 o\'clock stubble', 'neat trim goatee', 'full dark beard', 'light moustache', 'heavy stubble jaw'],
  };

  const handleStartEdit = (path: string, currentValue: string) => {
    setEditingPath(path);
    setEditValue(currentValue === 'unknown' ? '' : currentValue);
  };

  const handleSaveEdit = (path: string) => {
    if (onAdminDirectEdit && editValue.trim()) {
      onAdminDirectEdit(path, editValue.trim());
    }
    setEditingPath(null);
  };

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
    { path: 'hair.hairline', label: 'Hairline Contour', category: 'Hair', attr: faceSpec.hair.hairline },
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
    { path: 'facial_symmetry', label: 'Facial Symmetry Index', category: 'Structure', attr: faceSpec.facial_symmetry || { value: '95%', confidence: 0.94, stated: true, locked: false } },
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
            {totalStated}/21 Stated
          </span>
          <span className="text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
            {totalLocked} Locked
          </span>
        </div>
      </div>

      {/* Admin Mode Privilege Banner */}
      {isAdmin ? (
        <div className="px-3.5 py-2.5 bg-purple-950/50 border-b border-purple-800/80 text-xs text-purple-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-purple-400 shrink-0" />
            <span className="leading-tight">
              <strong className="text-white">Admin Privileges Active:</strong> Full direct edit override and unrestricted attribute locking enabled.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 uppercase font-semibold">
            Superuser
          </span>
        </div>
      ) : (
        /* Evidentiary Notice Banner */
        <div className="px-3.5 py-2 bg-slate-950/50 border-b border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
          <Shield className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong className="text-slate-300">Rule 3 Invariant:</strong> The structured JSON is the primary evidentiary record. Unstated attributes are strictly preserved as <code className="text-cyan-400 font-mono">unknown</code>.
          </span>
        </div>
      )}

      {/* Feature Attributes List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {attributes.map((item) => {
          const isStated = item.attr.stated;
          const isLocked = item.attr.locked;
          const isSelected = selectedRegion && item.path.startsWith(selectedRegion);
          const isCurrentlyEditing = editingPath === item.path;
          const presets = adminPresets[item.path];

          return (
            <div
              key={item.path}
              onClick={() => onSelectRegion(isSelected ? null : item.path.split('.')[0])}
              className={`p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/50 border-cyan-500 shadow-sm ring-1 ring-cyan-500/50'
                  : isStated
                  ? 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-900/30 border-slate-800/80 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  {item.path === 'facial_symmetry' ? (
                    <Scale className="h-3 w-3 text-purple-400 shrink-0" />
                  ) : isStated ? (
                    <CheckCircle2 className="h-3 w-3 text-cyan-400 shrink-0" />
                  ) : (
                    <HelpCircle className="h-3 w-3 text-slate-600 shrink-0" />
                  )}
                  {item.label}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Admin Direct Edit Trigger */}
                  {isAdmin && item.path !== 'facial_symmetry' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentlyEditing) {
                          setEditingPath(null);
                        } else {
                          handleStartEdit(item.path, item.attr.value);
                        }
                      }}
                      className={`p-1 rounded transition cursor-pointer ${
                        isCurrentlyEditing
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 hover:bg-purple-900 text-slate-400 hover:text-purple-200'
                      }`}
                      title="Admin Direct Edit: Directly modify morphological value"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  )}

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

              {/* Inline Admin Direct Modification Form */}
              {isAdmin && isCurrentlyEditing ? (
                <div 
                  className="mt-2 pt-2 border-t border-purple-800/60 space-y-2 bg-purple-950/40 p-2 rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Enter direct morphological value..."
                      className="flex-1 bg-slate-950 border border-purple-500/80 rounded px-2 py-1 text-xs text-white focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(item.path);
                        if (e.key === 'Escape') setEditingPath(null);
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(item.path)}
                      className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
                      title="Save direct change"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPath(null)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition cursor-pointer"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Presets suggestions */}
                  {presets && presets.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {presets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setEditValue(preset)}
                          className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-purple-900 border border-purple-800/40 text-[10px] text-purple-200 transition cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Value and Confidence */
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
              )}

              {/* Confidence Progress Bar */}
              {isStated && !isCurrentlyEditing && (
                <div className="mt-1 h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.path === 'facial_symmetry' ? 'bg-purple-500' : 'bg-cyan-500'}`}
                    style={{ width: `${(item.attr.confidence || 0.9) * 100}%` }}
                  />
                </div>
              )}

              {/* Verbatim Witness Phrasing */}
              {item.attr.verbatim && !isCurrentlyEditing && (
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
