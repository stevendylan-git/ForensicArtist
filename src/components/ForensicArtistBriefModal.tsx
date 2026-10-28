import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  Sparkles, 
  ShieldCheck, 
  Scale, 
  UserCheck 
} from 'lucide-react';
import { FaceSpec, ForensicCase, UserProfile } from '../types';
import { generateDetailedForensicArtistNarrative, calculateFacialSymmetryScore } from '../services/faceSpecEngine';

interface ForensicArtistBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  faceSpec: FaceSpec;
  activeCase: ForensicCase;
  version: number;
  currentUser: UserProfile;
}

export const ForensicArtistBriefModal: React.FC<ForensicArtistBriefModalProps> = ({
  isOpen,
  onClose,
  faceSpec,
  activeCase,
  version,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const narrativeText = generateDetailedForensicArtistNarrative(
    faceSpec,
    activeCase.caseNumber,
    activeCase.witnessPseudonym
  );

  const symmetry = calculateFacialSymmetryScore(faceSpec);

  const handleCopy = () => {
    navigator.clipboard.writeText(narrativeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([narrativeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forensic_artist_brief_${activeCase.caseNumber}_v${version}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-white">Forensic Artist Evidentiary Briefing Docket</h2>
              <p className="text-xs text-slate-400">
                Detailed morphological narrative generated for submission to a certified forensic artist.
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

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Metadata & Symmetry HUD Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
              <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Case Dossier Reference
              </div>
              <div className="text-slate-400">• Docket: <span className="text-white font-medium">{activeCase.caseNumber}</span></div>
              <div className="text-slate-400">• Version: <span className="text-white font-medium">v{version}.0</span></div>
              <div className="text-slate-400">• Witness ID: <span className="text-white font-medium">{activeCase.witnessPseudonym}</span></div>
              <div className="text-slate-400">• Prepared By: <span className="text-white font-medium">{currentUser.fullName} ({currentUser.role})</span></div>
            </div>

            <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/50 space-y-1.5 font-mono text-[11px]">
              <div className="text-purple-300 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-purple-400" /> AI Facial Symmetry Index
                </span>
                <span className="text-emerald-400 font-bold text-xs">{symmetry.percentageText}</span>
              </div>
              <div className="text-purple-200 text-[10px]">{symmetry.classification}</div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1 border-t border-purple-900/40">
                <div>Ocular: <span className="text-purple-300">{symmetry.ocularBalance}%</span></div>
                <div>Nasal: <span className="text-purple-300">{symmetry.nasalBalance}%</span></div>
                <div>Labial: <span className="text-purple-300">{symmetry.labialBalance}%</span></div>
                <div>Mandibular: <span className="text-purple-300">{symmetry.mandibularBalance}%</span></div>
              </div>
            </div>
          </div>

          {/* Narrative Paragraph Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Court-Admissible Detailed Morphological Narrative</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Paragraph'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed font-sans shadow-inner selection:bg-purple-500 selection:text-white">
              <p className="whitespace-pre-line text-justify font-normal leading-6">
                {narrativeText}
              </p>
            </div>
          </div>

          {/* Statutory Evidentiary Notice */}
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-[11px] text-red-200 flex items-start gap-2">
            <span className="font-semibold uppercase tracking-wider text-red-400 shrink-0">Statutory Notice:</span>
            <span>
              This detailed narrative represents a cognitive elicitation briefing document compiled in adherence to Rule 7 anti-leading standards. Intended solely for certified law enforcement forensic artists and authorized investigative leads.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            {copied ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Paragraph copied to clipboard ready for email/docket
              </span>
            ) : (
              'Ready for immediate transfer to certified forensic artist.'
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .TXT Brief</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
