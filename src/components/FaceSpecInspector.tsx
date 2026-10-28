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
  onCloseDrawer?: () => void;
}

export const FaceSpecInspector: React.FC<FaceSpecInspectorProps> = ({
  faceSpec,
  onToggleLock,
  selectedRegion,
  onSelectRegion,
  currentRole,
  onAdminDirectEdit,
  onCloseDrawer,
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
    <section className="h-full flex flex-col bg-[#FAF8F5]">
      {/* Inspector Header */}
      <div className="p-3.5 border-b border-[#E6DFD5] flex items-center justify-between bg-[#F6F1EA]">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#8C6D46]" />
          <h2 className="font-semibold text-sm text-stone-900">FaceSpec Feature Inspector</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-[#6B4E2E] bg-white border border-[#D5C6B4] px-2 py-0.5 rounded-md shadow-2xs">
            {totalStated}/21 Stated
          </span>
          <span className="text-[#8C6D46] bg-[#EFE8DE] border border-[#D5C6B4] px-2 py-0.5 rounded-md">
            {totalLocked} Locked
          </span>
          {onCloseDrawer && (
            <button
              onClick={onCloseDrawer}
              className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-[#EAE1D2] transition cursor-pointer ml-1"
              title="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Admin Mode Privilege Banner */}
      {isAdmin ? (
        <div className="px-3.5 py-2.5 bg-[#F2EAE1] border-b border-[#D8CABE] text-xs text-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#8C6D46] shrink-0" />
            <span className="leading-tight">
              <strong className="text-[#6B4E2E]">Admin Mode Active:</strong> Direct edit override & unrestricted attribute locking enabled.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8C6D46] text-white uppercase font-semibold">
            Admin
          </span>
        </div>
      ) : (
        /* Evidentiary Notice Banner */
        <div className="px-3.5 py-2 bg-[#F6F1EA]/80 border-b border-[#E6DFD5] text-xs text-stone-600 flex items-start gap-2">
          <Shield className="h-4 w-4 text-[#8C6D46] shrink-0 mt-0.5" />
          <span className="leading-relaxed text-[11px]">
            <strong className="text-stone-800">Rule 3 Invariant:</strong> The structured JSON is the primary evidentiary record. Unstated attributes remain <code className="text-[#8C6D46] font-mono">unknown</code>.
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
              className={`p-2.5 rounded-xl border text-xs transition cursor-pointer shadow-2xs ${
                isSelected
                  ? 'bg-[#F4EFE6] border-[#8C6D46] ring-1 ring-[#8C6D46]'
                  : isStated
                  ? 'bg-white border-[#E2D8CC] hover:border-[#D0C2AF]'
                  : 'bg-[#F7F4EE]/60 border-[#E8DFD3] opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-800 flex items-center gap-1.5">
                  {item.path === 'facial_symmetry' ? (
                    <Scale className="h-3.5 w-3.5 text-[#8C6D46] shrink-0" />
                  ) : isStated ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#8C6D46] shrink-0" />
                  ) : (
                    <HelpCircle className="h-3.5 w-3.5 text-stone-400 shrink-0" />
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
                      className={`p-1 rounded-md transition cursor-pointer ${
                        isCurrentlyEditing
                          ? 'bg-[#8C6D46] text-white'
                          : 'bg-[#EFE8DE] hover:bg-[#8C6D46] text-stone-600 hover:text-white'
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
                    className={`p-1 rounded-md transition cursor-pointer ${
                      isLocked
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'text-stone-400 hover:text-stone-700 hover:bg-[#EFE8DE]'
                    }`}
                    title={isLocked ? 'Feature locked: Immune from cognitive interview edits' : 'Click to lock feature'}
                  >
                    {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* Inline Admin Direct Modification Form */}
              {isCurrentlyEditing ? (
                <div
                  className="mt-2.5 p-2.5 rounded-lg bg-[#FAF6EE] border border-[#D5C6B4] space-y-2 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#6B4E2E]">
                      Admin Override: {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingPath(null)}
                      className="text-stone-400 hover:text-stone-700 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Preset quick suggestions if available */}
                  {presets && presets.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] text-stone-500 font-mono">Suggested values:</div>
                      <div className="flex flex-wrap gap-1">
                        {presets.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditValue(p)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                              editValue === p
                                ? 'bg-[#8C6D46] text-white font-semibold'
                                : 'bg-white hover:bg-[#EFE8DE] text-stone-700 border border-[#D8CABE]'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Enter attribute value..."
                      className="flex-1 bg-white border border-[#D8CABE] rounded px-2 py-1 text-xs text-stone-900 focus:outline-none focus:border-[#8C6D46]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(item.path);
                        if (e.key === 'Escape') setEditingPath(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(item.path)}
                      className="px-2.5 py-1 bg-[#8C6D46] hover:bg-[#785C3A] text-white rounded text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                      <span>Apply</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Attribute Value Display */
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className={`font-mono ${isStated ? 'text-stone-900 font-medium' : 'text-stone-400 italic'}`}>
                    {item.attr.value}
                  </span>
                  {isStated && (
                    <span className="text-[10px] font-mono text-[#8C6D46] bg-[#F2EAE1] px-1.5 py-0.2 rounded border border-[#D8CABE]">
                      {Math.round((item.attr.confidence || 0.8) * 100)}% Conf
                    </span>
                  )}
                </div>
              )}

              {/* Verbatim quote snippet if recorded from witness utterance */}
              {!isCurrentlyEditing && item.attr.verbatim && (
                <div className="mt-1.5 pt-1.5 border-t border-[#EFE7DC] text-[10px] text-stone-500 italic flex items-center gap-1 font-sans">
                  <Quote className="h-2.5 w-2.5 text-[#8C6D46] shrink-0" />
                  <span className="truncate">"{item.attr.verbatim}"</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
