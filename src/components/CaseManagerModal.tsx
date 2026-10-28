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
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#D5C6B4] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E6DFD5] flex items-center justify-between bg-[#F6F1EA]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#EFE8DE] border border-[#D8CABE] flex items-center justify-center text-[#8C6D46]">
              <FolderLock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-stone-900">Forensic Case Docket Management</h2>
              <p className="text-xs text-stone-600">
                Need-to-know access controls & active case dossiers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 rounded-lg bg-[#8C6D46] hover:bg-[#785C3A] text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Case</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-[#EAE1D2] transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto bg-[#FDFBF7] flex-1 space-y-4">
          {isCreating ? (
            /* Create New Case Form */
            <form onSubmit={handleCreateSubmit} className="p-5 rounded-xl bg-white border border-[#D5C6B4] space-y-4 text-xs shadow-sm">
              <h3 className="font-semibold text-sm text-[#8C6D46] mb-2">Initiate New Forensic Composite Case</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="text-stone-700 block mb-1 font-sans font-medium">Case Docket Number *</label>
                  <input
                    type="text"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#D5C6B4] rounded-lg px-3 py-1.5 text-stone-900 focus:outline-none focus:border-[#8C6D46]"
                    required
                  />
                </div>

                <div>
                  <label className="text-stone-700 block mb-1 font-sans font-medium">Witness Pseudonym *</label>
                  <input
                    type="text"
                    value={witnessPseudonym}
                    onChange={(e) => setWitnessPseudonym(e.target.value)}
                    placeholder="e.g. Witness-Echo"
                    className="w-full bg-[#FAF8F5] border border-[#D5C6B4] rounded-lg px-3 py-1.5 text-stone-900 focus:outline-none focus:border-[#8C6D46]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-700 block mb-1 font-medium">Incident Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Armed robbery downtown branch"
                  className="w-full bg-[#FAF8F5] border border-[#D5C6B4] rounded-lg px-3 py-1.5 text-stone-900 focus:outline-none focus:border-[#8C6D46]"
                  required
                />
              </div>

              <div>
                <label className="text-stone-700 block mb-1 font-medium">Statutory Offense Classification</label>
                <input
                  type="text"
                  value={offense}
                  onChange={(e) => setOffense(e.target.value)}
                  placeholder="e.g. Felony Robbery 1st Degree"
                  className="w-full bg-[#FAF8F5] border border-[#D5C6B4] rounded-lg px-3 py-1.5 text-stone-900 focus:outline-none focus:border-[#8C6D46]"
                />
              </div>

              <div>
                <label className="text-stone-700 block mb-1 font-medium">Preliminary Case Notes & Context</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Briefly state incident lighting, duration of observation, distance..."
                  className="w-full bg-[#FAF8F5] border border-[#D5C6B4] rounded-lg px-3 py-1.5 text-stone-900 focus:outline-none focus:border-[#8C6D46]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6DFD5]">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-[#D5C6B4] text-stone-700 hover:bg-[#F2ECE1] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#8C6D46] hover:bg-[#785C3A] text-white font-medium transition cursor-pointer shadow-2xs"
                >
                  Create & Initialize Ledger
                </button>
              </div>
            </form>
          ) : (
            /* Cases List */
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
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${
                      isActive
                        ? 'bg-[#F4EFE6] border-[#8C6D46] ring-1 ring-[#8C6D46]'
                        : 'bg-white border-[#D5C6B4] hover:border-[#BFB09E]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#8C6D46]">{c.caseNumber}</span>
                        <span className="text-xs text-stone-400">•</span>
                        <h4 className="font-semibold text-sm text-stone-900">{c.title}</h4>
                        {isActive && (
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 font-sans">{c.offense}</p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500 pt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-[#8C6D46]" /> {c.witnessPseudonym}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#8C6D46]" /> {c.incidentDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isActive ? (
                        <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-mono font-medium flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Selected
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-3 py-1 rounded-lg bg-white hover:bg-[#F2ECE1] border border-[#D5C6B4] text-[#6B4E2E] text-xs font-mono transition cursor-pointer shadow-2xs"
                        >
                          Switch Docket
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
    </div>
  );
};
