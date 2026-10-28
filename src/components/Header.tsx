import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Sparkles, 
  UserCheck, 
  FolderLock,
  History,
  Grid3X3,
  Download
} from 'lucide-react';
import { UserRole, ForensicCase, AuditVerificationResult } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeCase: ForensicCase;
  auditResult: AuditVerificationResult | null;
  totalAuditEntries: number;
  onOpenAuditModal: () => void;
  onOpenCaseModal: () => void;
  onOpenTimelineModal: () => void;
  onOpenGridModal: () => void;
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeCase,
  auditResult,
  totalAuditEntries,
  onOpenAuditModal,
  onOpenCaseModal,
  onOpenTimelineModal,
  onOpenGridModal,
  onOpenExportModal,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-5 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
      {/* Brand & App Info */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold tracking-tight text-white text-base">Forensic Face Composite Studio</h1>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">PS-01</span>
          </div>
          <p className="text-xs text-slate-400">Cognitive Elicitation & Evidentiary Composite System</p>
        </div>
      </div>

      {/* Case & Action Bar */}
      <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
        {/* Active Case Selector */}
        <button
          onClick={onOpenCaseModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition cursor-pointer"
          title="Switch or view forensic case details"
        >
          <FolderLock className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-slate-400">Case:</span>
          <span className="font-semibold text-white">{activeCase.caseNumber}</span>
        </button>

        {/* Timeline Button */}
        <button
          onClick={onOpenTimelineModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition cursor-pointer"
          title="Version history, compare, undo, redo"
        >
          <History className="h-3.5 w-3.5 text-cyan-400" />
          <span>Timeline</span>
        </button>

        {/* 3x3 Candidate Grid Button */}
        <button
          onClick={onOpenGridModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition cursor-pointer"
          title="Generate 3x3 candidate variations of features"
        >
          <Grid3X3 className="h-3.5 w-3.5 text-purple-400" />
          <span>Recognition Grid</span>
        </button>

        {/* Export Docket Button */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition cursor-pointer"
          title="Export forensic docket as PNG or PDF"
        >
          <Download className="h-3.5 w-3.5 text-emerald-400" />
          <span>Export Docket</span>
        </button>

        {/* RBAC Role Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800">
          <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-slate-400">Role:</span>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer pr-1"
          >
            <option value="INVESTIGATOR" className="bg-slate-900 text-slate-200">Investigator</option>
            <option value="FORENSIC_ARTIST" className="bg-slate-900 text-slate-200">Forensic Artist</option>
            <option value="SUPERVISOR" className="bg-slate-900 text-slate-200">Supervisor</option>
            <option value="ADMIN" className="bg-slate-900 text-slate-200">Admin</option>
            <option value="AUDITOR" className="bg-slate-900 text-amber-300">Auditor</option>
          </select>
        </div>

        {/* Audit Ledger Status Button */}
        <button
          onClick={onOpenAuditModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-800/70 transition cursor-pointer"
          title="View and verify cryptographically chained SHA-256 audit ledger"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span>Audit Ledger</span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-900/80 text-[10px] text-cyan-200 border border-cyan-700">
            {totalAuditEntries}
          </span>
          {auditResult?.isValid ? (
            <span className="h-2 w-2 rounded-full bg-emerald-400" title="Cryptographic chain valid" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" title="Chain verification warning" />
          )}
        </button>
      </div>
    </header>
  );
};
