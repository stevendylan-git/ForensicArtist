import React, { useState } from 'react';
import { 
  FolderLock, 
  X, 
  Plus, 
  Check, 
  Shield, 
  Calendar, 
  User, 
  FileCheck
} from 'lucide-react';
import { ForensicCase } from '../types';

interface CaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: ForensicCase[];
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  onCreateCase: (newCase: Omit<ForensicCase, 'id' | 'createdAt'>) => void;
}

export const CaseManagerModal: React.FC<CaseManagerModalProps> = ({
  isOpen,
  onClose,
  cases,
  activeCaseId,
  onSelectCase,
  onCreateCase,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [caseNumber, setCaseNumber] = useState(`CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [offense, setOffense] = useState('');
  const [witnessPseudonym, setWitnessPseudonym] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim() || !title.trim()) return;

    onCreateCase({
      caseNumber: caseNumber.trim(),
      title: title.trim(),
      offense: offense.trim() || 'Unspecified Incident',
      status: 'OPEN',
      incidentDate: new Date().toISOString().slice(0, 10),
      assignedUsers: ['user-investigator-01', 'user-artist-01'],
      witnessPseudonym: witnessPseudonym.trim() || 'Witness-Alpha',
      notes: notes.trim(),
    });

    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FolderLock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-white">Forensic Case Docket Management</h2>
              <p className="text-xs text-slate-400">
                Need-to-know access controls & active case dossiers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Case</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto bg-slate-950 flex-1 space-y-4">
          {isCreating ? (
            /* Create New Case Form */
            <form onSubmit={handleCreateSubmit} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
              <h3 className="font-semibold text-sm text-cyan-400 mb-2">Initiate New Forensic Composite Case</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Case Number (Identifier)</label>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Offense Classification</label>
                  <input
                    type="text"
                    value={offense}
                    onChange={(e) => setOffense(e.target.value)}
                    placeholder="e.g. Armed Robbery, Assault, Burglary"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Case Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Downtown Metro Commercial Robbery Suspect"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Witness Pseudonym (Protected Identity)</label>
                <input
                  type="text"
                  value={witnessPseudonym}
                  onChange={(e) => setWitnessPseudonym(e.target.value)}
                  placeholder="e.g. Witness-Echo (Anonymized)"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Investigative Notes / Brief</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Initial context notes, incident lighting conditions, witness viewing distance..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition cursor-pointer"
                >
                  Create & Open Case
                </button>
              </div>
            </form>
          ) : (
            /* Case List */
            <div className="space-y-3">
              {cases.map((c) => {
                const isActive = c.id === activeCaseId;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCase(c.id);
                      onClose();
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-950/20 border-amber-500/70 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-amber-300">
                          {c.caseNumber}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {c.title}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300">
                            Active Case
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                        <span>Offense: <strong className="text-slate-300">{c.offense}</strong></span>
                        <span>•</span>
                        <span>Witness: <strong className="text-slate-300">{c.witnessPseudonym}</strong></span>
                        <span>•</span>
                        <span>Date: {c.incidentDate}</span>
                      </div>

                      {c.notes && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-sans">
                          {c.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isActive ? 'Current Dossier' : 'Switch to Case'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Need-to-Know Authorization Enforced (Only assigned investigators & artists can access composites)
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
