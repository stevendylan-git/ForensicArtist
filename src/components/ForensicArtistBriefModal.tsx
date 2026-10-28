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
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#D5C6B4] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#E6DFD5] flex items-center justify-between bg-[#F6F1EA]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#EFE8DE] border border-[#D8CABE] flex items-center justify-center text-[#8C6D46]">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-stone-900">Forensic Artist Evidentiary Briefing Docket</h2>
              <p className="text-xs text-stone-600">
                Detailed morphological narrative generated for submission to a certified forensic artist.
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

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Metadata & Symmetry HUD Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white border border-[#E2D8CC] space-y-1 font-mono text-[11px] shadow-2xs">
              <div className="text-stone-800 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#8C6D46]" /> Case Dossier Reference
              </div>
              <div className="text-stone-600">• Docket: <span className="text-stone-900 font-medium">{activeCase.caseNumber}</span></div>
              <div className="text-stone-600">• Version: <span className="text-stone-900 font-medium">v{version}.0</span></div>
              <div className="text-stone-600">• Witness ID: <span className="text-stone-900 font-medium">{activeCase.witnessPseudonym}</span></div>
              <div className="text-stone-600">• Prepared By: <span className="text-stone-900 font-medium">{currentUser.fullName} ({currentUser.role})</span></div>
            </div>

            <div className="p-3 rounded-xl bg-[#F6F1EA] border border-[#DFD3C4] space-y-1.5 font-mono text-[11px] shadow-2xs">
              <div className="text-[#6B4E2E] font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-[#8C6D46]" /> AI Facial Symmetry Index
                </span>
                <span className="text-emerald-800 font-bold text-xs">{symmetry.percentageText}</span>
              </div>
              <div className="text-stone-700 text-[10px]">{symmetry.classification}</div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-600 pt-1 border-t border-[#DFD3C4]">
                <div>Ocular: <span className="text-[#8C6D46] font-medium">{symmetry.ocularBalance}%</span></div>
                <div>Nasal: <span className="text-[#8C6D46] font-medium">{symmetry.nasalBalance}%</span></div>
                <div>Labial: <span className="text-[#8C6D46] font-medium">{symmetry.labialBalance}%</span></div>
                <div>Mandibular: <span className="text-[#8C6D46] font-medium">{symmetry.mandibularBalance}%</span></div>
              </div>
            </div>
          </div>

          {/* Narrative Paragraph Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#8C6D46]" />
                <span>Court-Admissible Detailed Morphological Narrative</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-[#8C6D46] hover:bg-[#785C3A] text-white font-mono text-[11px] flex items-center gap-1 transition shadow-2xs cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-white" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Paragraph'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#D5C6B4] text-stone-800 text-xs leading-relaxed font-sans shadow-sm selection:bg-[#8C6D46] selection:text-white">
              <p className="whitespace-pre-line text-justify font-normal leading-6">
                {narrativeText}
              </p>
            </div>
          </div>

          {/* Statutory Evidentiary Notice */}
          <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#E2D6C5] text-[11px] text-stone-700 flex items-start gap-2">
            <span className="font-semibold uppercase tracking-wider text-[#8C6D46] shrink-0">Statutory Notice:</span>
            <span>
              This detailed narrative represents a cognitive elicitation briefing document compiled in adherence to Rule 7 anti-leading standards. Intended solely for certified law enforcement forensic artists and authorized investigative leads.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E6DFD5] bg-[#F6F1EA] flex items-center justify-between">
          <div className="text-xs text-stone-600 font-mono">
            {copied ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Paragraph copied to clipboard ready for email/docket
              </span>
            ) : (
              'Ready for immediate transfer to certified forensic artist.'
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTxt}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EFE8DE] text-stone-800 border border-[#D5C6B4] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-[#8C6D46]" />
              <span>Download .TXT Brief</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#8C6D46] hover:bg-[#785C3A] text-white text-xs font-medium transition cursor-pointer shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
