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
      { key: 'eyes_shape', name: 'Eyes Shape', getVal: s => s.eyes.shape.value },
      { key: 'eyes_color', name: 'Eyes Color', getVal: s => s.eyes.color.value },
      { key: 'nose_width', name: 'Nose Width', getVal: s => s.nose.width.value },
      { key: 'nose_bridge', name: 'Nose Bridge', getVal: s => s.nose.bridge.value },
      { key: 'mouth_lips', name: 'Mouth / Lips', getVal: s => s.mouth_lips.value },
      { key: 'jawline_chin', name: 'Jawline & Chin', getVal: s => s.jawline_chin.value },
      { key: 'facial_hair', name: 'Facial Hair', getVal: s => s.facial_hair.value },
      { key: 'marks', name: 'Distinguishing Marks', getVal: s => s.distinguishing_marks.type.value },
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

  const diffItems = compareMode ? computeDiff(verA.faceSpec, verB.faceSpec) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-white">Composite Version Timeline & Morphological Audit</h2>
              <p className="text-xs text-slate-400">
                Evidentiary timeline with non-destructive versioning, locality scores, and diff analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo / Redo controls */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition cursor-pointer flex items-center gap-1 text-xs"
              title="Undo last edit (Revert to V - 1)"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Undo</span>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition cursor-pointer flex items-center gap-1 text-xs"
              title="Redo previous reverted edit"
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span>Redo</span>
            </button>

            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                compareMode
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>{compareMode ? 'Exit Compare' : 'Compare Versions'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content View: Side-by-Side Compare Mode OR Timeline List */}
        {compareMode ? (
          <div className="flex-1 p-5 overflow-y-auto bg-slate-950 space-y-5">
            {/* Compare Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-semibold">Version A:</span>
                <select
                  value={verAIndex}
                  onChange={(e) => setVerAIndex(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded"
                >
                  {versions.map((v, i) => (
                    <option key={v.id} value={i}>
                      v{v.version}.0 - {v.triggeringCall}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-purple-400 font-semibold">Version B:</span>
                <select
                  value={verBIndex}
                  onChange={(e) => setVerBIndex(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded"
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
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 text-xs font-mono">
                  <span className="text-cyan-400 font-bold">Version {verA.version}.0 (Baseline)</span>
                  <span className="text-slate-400 text-[11px]">{verA.timestamp}</span>
                </div>
                <div className="w-64 h-64 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden shadow-lg">
                  <canvas
                    ref={(canvas) => {
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          drawForensicComposite(ctx, verA.faceSpec, {
                            width: canvas.width,
                            height: canvas.height,
                            styleMode: 'charcoal',
                            caseNumber,
                            version: verA.version,
                          });
                        }
                      }
                    }}
                    width={256}
                    height={256}
                    className="w-full h-full block"
                  />
                </div>
              </div>

              {/* Version B View */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 text-xs font-mono">
                  <span className="text-purple-400 font-bold">Version {verB.version}.0 (Comparison)</span>
                  <span className="text-slate-400 text-[11px]">{verB.timestamp}</span>
                </div>
                <div className="w-64 h-64 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden shadow-lg">
                  <canvas
                    ref={(canvas) => {
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          drawForensicComposite(ctx, verB.faceSpec, {
                            width: canvas.width,
                            height: canvas.height,
                            styleMode: 'charcoal',
                            caseNumber,
                            version: verB.version,
                          });
                        }
                      }
                    }}
                    width={256}
                    height={256}
                    className="w-full h-full block"
                  />
                </div>
              </div>
            </div>

            {/* Morphological Differences Table */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-cyan-400" />
                Morphological Differences (v{verA.version} vs v{verB.version})
              </h3>
              {diffItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No morphological differences detected between these two versions.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 px-3">Feature Region</th>
                        <th className="py-2 px-3 text-cyan-400">Version {verA.version} State</th>
                        <th className="py-2 px-3 text-purple-400">Version {verB.version} State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {diffItems.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-semibold text-slate-300 font-sans">{d.feature}</td>
                          <td className="py-2 px-3 text-cyan-300 capitalize">{d.valA}</td>
                          <td className="py-2 px-3 text-purple-300 capitalize">{d.valB}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Standard Chronological Version Timeline */
          <div className="flex-1 p-5 overflow-y-auto bg-slate-950 space-y-3">
            {versions.map((ver, idx) => {
              const isCurrent = idx === currentVersionIndex;
              return (
                <div
                  key={ver.id}
                  className={`p-4 rounded-xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-cyan-950/20 border-cyan-500/70 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Thumbnail & Version Meta */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                      <canvas
                        ref={(canvas) => {
                          if (canvas) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              drawForensicComposite(ctx, ver.faceSpec, {
                                width: canvas.width,
                                height: canvas.height,
                                styleMode: 'charcoal',
                                caseNumber,
                                version: ver.version,
                              });
                            }
                          }
                        }}
                        width={64}
                        height={64}
                        className="w-full h-full block"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          v{ver.version}.0
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                            Active Head
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {ver.triggeringCall}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {ver.timestamp}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400">
                          Locality: {ver.localityScore}% unchanged
                        </span>
                      </div>

                      {ver.diffSummary && (
                        <p className="text-xs text-slate-300 mt-1 font-sans">
                          {ver.diffSummary}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isCurrent && (
                      <button
                        onClick={() => onRevertToVersion(ver.version)}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Revert to this Version</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Every timeline modification and revert is cryptographically hashed in the audit ledger.</span>
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
