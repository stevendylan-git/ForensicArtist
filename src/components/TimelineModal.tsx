import React, { useState } from 'react';
import { 
  History, 
  X, 
  RotateCcw, 
  ArrowLeftRight, 
  GitCompare, 
  ShieldCheck,
  Undo2,
  Redo2,
  Calendar,
  Layers
} from 'lucide-react';
import { CompositeVersion, FaceSpec } from '../types';
import { drawForensicComposite } from '../services/canvasRenderer';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: CompositeVersion[];
  currentVersionIndex: number;
  onRevertToVersion: (versionNum: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  caseNumber: string;
}

export const TimelineModal: React.FC<TimelineModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersionIndex,
  onRevertToVersion,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  caseNumber,
}) => {
  const [compareMode, setCompareMode] = useState(false);
  const [verAIndex, setVerAIndex] = useState(0);
  const [verBIndex, setVerBIndex] = useState(Math.max(0, versions.length - 1));

  if (!isOpen) return null;

  const verA = versions[verAIndex] || versions[0];
  const verB = versions[verBIndex] || versions[versions.length - 1];

  // Morphological diff helper
  const computeDiff = (specA: FaceSpec, specB: FaceSpec) => {
    const changes: Array<{ feature: string; valA: string; valB: string }> = [];
    const fields: Array<{ key: string; name: string; getVal: (s: FaceSpec) => string }> = [
      { key: 'face_shape', name: 'Face Shape', getVal: s => s.face_shape.value },
      { key: 'skin_tone', name: 'Skin Tone', getVal: s => s.skin_tone_complexion.value },
      { key: 'age', name: 'Approximate Age', getVal: s => s.approximate_age.value },
      { key: 'hair_style', name: 'Hair Style', getVal: s => s.hair.style.value },
      { key: 'hair_color', name: 'Hair Color', getVal: s => s.hair.color.value },
      { key: 'eyebrows', name: 'Eyebrows', getVal: s => s.eyebrows.value },
      { key: 'eyes_shape', name: 'Eye Shape', getVal: s => s.eyes.shape.value },
      { key: 'eyes_color', name: 'Eye Color', getVal: s => s.eyes.color.value },
      { key: 'nose_bridge', name: 'Nose Bridge', getVal: s => s.nose.bridge.value },
      { key: 'nose_width', name: 'Nose Width', getVal: s => s.nose.width.value },
      { key: 'mouth_lips', name: 'Mouth & Lips', getVal: s => s.mouth_lips.value },
      { key: 'jawline_chin', name: 'Jaw & Chin', getVal: s => s.jawline_chin.value },
      { key: 'facial_hair', name: 'Facial Hair', getVal: s => s.facial_hair.value },
      { key: 'distinguishing_marks', name: 'Marks', getVal: s => s.distinguishing_marks.type.value },
      { key: 'accessories', name: 'Accessories', getVal: s => s.accessories.value },
    ];

    for (const f of fields) {
      const vA = f.getVal(specA);
      const vB = f.getVal(specB);
      if (vA !== vB) {
        changes.push({ feature: f.name, valA: vA, valB: vB });
      }
    }
    return changes;
  };

  const diffList = computeDiff(verA.faceSpec, verB.faceSpec);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#D5C6B4] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E6DFD5] flex items-center justify-between bg-[#F6F1EA]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#EFE8DE] border border-[#D8CABE] flex items-center justify-center text-[#8C6D46]">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-stone-900">Composite Evolution Timeline & Comparative Diff</h2>
              <p className="text-xs text-stone-600">
                Statutory audit trail of witness elicitation iterations and morphological progression.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Undo / Redo controls */}
            <div className="flex items-center bg-white rounded-lg border border-[#D5C6B4] p-0.5 shadow-2xs">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-40 transition cursor-pointer"
                title="Undo previous modification"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-40 transition cursor-pointer"
                title="Redo modification"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                compareMode
                  ? 'bg-[#8C6D46] border-[#785C3A] text-white'
                  : 'bg-white border-[#D5C6B4] text-stone-700 hover:bg-[#F5EFE6]'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>{compareMode ? 'Exit Compare' : 'Compare Versions'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-[#EAE1D2] transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content View: Side-by-Side Compare Mode OR Timeline List */}
        {compareMode ? (
          <div className="flex-1 p-5 overflow-y-auto bg-[#FDFBF7] space-y-5">
            {/* Compare Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-xl border border-[#D5C6B4] flex items-center justify-between shadow-2xs">
                <span className="text-xs font-mono text-[#8C6D46] font-semibold">Version A:</span>
                <select
                  value={verAIndex}
                  onChange={(e) => setVerAIndex(Number(e.target.value))}
                  className="bg-[#FAF8F5] border border-[#D5C6B4] text-stone-800 text-xs px-2.5 py-1 rounded-md"
                >
                  {versions.map((v, i) => (
                    <option key={v.id} value={i}>
                      v{v.version}.0 - {v.triggeringCall}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#D5C6B4] flex items-center justify-between shadow-2xs">
                <span className="text-xs font-mono text-[#6B4E2E] font-semibold">Version B:</span>
                <select
                  value={verBIndex}
                  onChange={(e) => setVerBIndex(Number(e.target.value))}
                  className="bg-[#FAF8F5] border border-[#D5C6B4] text-stone-800 text-xs px-2.5 py-1 rounded-md"
                >
                  {versions.map((v, i) => (
                    <option key={v.id} value={i}>
                      v{v.version}.0 - {v.triggeringCall}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-Side Visual Canvas Views */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Version A View */}
              <div className="p-4 rounded-xl bg-white border border-[#D5C6B4] flex flex-col items-center shadow-xs">
                <span className="text-xs font-mono text-stone-600 mb-2 font-medium">v{verA.version}.0 Canvas Snapshot</span>
                <div className="w-56 h-56 bg-[#FAF7F0] rounded-xl border border-[#D5C6B4] overflow-hidden shadow-inner">
                  <canvas
                    ref={(canvas) => {
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          drawForensicComposite(ctx, verA.faceSpec, {
                            width: canvas.width,
                            height: canvas.height,
                            styleMode: 'charcoal',
                            viewAngle: 'frontal',
                            caseNumber,
                            version: verA.version,
                            hasGenerated: true,
                          });
                        }
                      }
                    }}
                    width={224}
                    height={224}
                    className="w-full h-full block"
                  />
                </div>
                <p className="text-[11px] text-stone-600 mt-2 font-mono text-center truncate max-w-xs">
                  {verA.triggeringCall}
                </p>
              </div>

              {/* Version B View */}
              <div className="p-4 rounded-xl bg-white border border-[#D5C6B4] flex flex-col items-center shadow-xs">
                <span className="text-xs font-mono text-stone-600 mb-2 font-medium">v{verB.version}.0 Canvas Snapshot</span>
                <div className="w-56 h-56 bg-[#FAF7F0] rounded-xl border border-[#D5C6B4] overflow-hidden shadow-inner">
                  <canvas
                    ref={(canvas) => {
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          drawForensicComposite(ctx, verB.faceSpec, {
                            width: canvas.width,
                            height: canvas.height,
                            styleMode: 'charcoal',
                            viewAngle: 'frontal',
                            caseNumber,
                            version: verB.version,
                            hasGenerated: true,
                          });
                        }
                      }
                    }}
                    width={224}
                    height={224}
                    className="w-full h-full block"
                  />
                </div>
                <p className="text-[11px] text-stone-600 mt-2 font-mono text-center truncate max-w-xs">
                  {verB.triggeringCall}
                </p>
              </div>
            </div>

            {/* Morphological Changes Diff Table */}
            <div className="rounded-xl border border-[#D5C6B4] bg-white overflow-hidden shadow-2xs">
              <div className="p-3 bg-[#F6F1EA] border-b border-[#E6DFD5] flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-stone-900">Morphological Feature Delta (A → B)</span>
                <span className="text-stone-600">{diffList.length} Changed Features</span>
              </div>
              {diffList.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500 italic">
                  No morphological differences detected between Version {verA.version}.0 and Version {verB.version}.0.
                </div>
              ) : (
                <div className="divide-y divide-[#EFE7DC] text-xs font-mono">
                  {diffList.map((d, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between hover:bg-[#FAF8F5]">
                      <span className="font-medium text-stone-800">{d.feature}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-stone-500 bg-[#F4EFE6] px-2 py-0.5 rounded border border-[#D5C6B4]">
                          {d.valA || 'unknown'}
                        </span>
                        <ArrowLeftRight className="h-3 w-3 text-[#8C6D46]" />
                        <span className="text-[#8C6D46] font-semibold bg-[#F2ECE1] px-2 py-0.5 rounded border border-[#D5C6B4]">
                          {d.valB}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Chronological Timeline List View */
          <div className="flex-1 p-5 overflow-y-auto bg-[#FDFBF7] space-y-3">
            {versions.map((ver, idx) => {
              const isCurrent = idx === currentVersionIndex;

              return (
                <div
                  key={ver.id}
                  className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs ${
                    isCurrent
                      ? 'bg-[#F4EFE6] border-[#8C6D46] ring-1 ring-[#8C6D46]'
                      : 'bg-white border-[#D5C6B4] hover:border-[#BFB09E]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                      isCurrent
                        ? 'bg-[#8C6D46] text-white'
                        : 'bg-[#F2ECE1] text-[#6B4E2E] border border-[#D5C6B4]'
                    }`}>
                      v{ver.version}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-stone-900">{ver.triggeringCall}</h4>
                        {isCurrent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Active Lead
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5">{ver.diffSummary}</p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#8C6D46]" /> {ver.timestamp}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700">Locality: {ver.localityScore.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onRevertToVersion(ver.version);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F2ECE1] border border-[#D5C6B4] text-[#6B4E2E] text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        title="Revert composite to this state and log evidentiary event"
                      >
                        <RotateCcw className="h-3 w-3 text-[#8C6D46]" />
                        <span>Restore This Version</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
