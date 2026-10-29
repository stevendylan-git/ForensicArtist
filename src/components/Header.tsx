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
  Download,
  SlidersHorizontal,
  FileCheck,
  Scissors,
  Layers
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
  onToggleFeatureDrawer?: () => void;
  isFeatureDrawerOpen?: boolean;
  statedCount?: number;
  activeTab?: 'studio' | 'surgical' | 'neural';
  onTabChange?: (tab: 'studio' | 'surgical' | 'neural') => void;
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
  onToggleFeatureDrawer,
  isFeatureDrawerOpen = false,
  statedCount = 0,
  activeTab = 'studio',
  onTabChange,
}) => {
  return (
    <header className="border-b border-[#E6DFD5] bg-[#FAF8F5]/95 backdrop-blur-md px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs">
      {/* Brand & App Info */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-[#EFE8DE] border border-[#D8CABE] flex items-center justify-center text-[#8C6D46] shadow-2xs">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold tracking-tight text-stone-900 text-sm sm:text-base">
              Forensic Face Composite Studio
            </h1>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#EFE8DE] text-[#6B4E2E] border border-[#D8CABE]">
              EVIDENTIARY
            </span>
          </div>
          <p className="text-xs text-stone-500 hidden sm:block">
            Cognitive Elicitation & Biometric Reconstruction
          </p>
        </div>
      </div>

      {/* Primary Workspace Navigation Tabs */}
      {onTabChange && (
        <div className="flex items-center bg-[#EFE8DE] p-1 rounded-xl border border-[#D8CABE] shadow-2xs">
          <button
            type="button"
            onClick={() => onTabChange('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-white text-[#6B4E2E] shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-[#8C6D46]" />
            <span>Composite Studio</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('surgical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'surgical'
                ? 'bg-white text-red-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Scissors className="h-3.5 w-3.5 text-red-600" />
            <span>Surgical Alterations</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
              FUGITIVE
            </span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('neural')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'neural'
                ? 'bg-white text-[#6B4E2E] shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#8C6D46]" />
            <span>AI Sketch Generator</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
              FS2K
            </span>
          </button>
        </div>
      )}

      {/* Case & Action Bar with Varied Button Sizes */}
      <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
        {/* Active Case Selector - Medium Button */}
        <button
          onClick={onOpenCaseModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F5EFE6] text-stone-800 border border-[#D5C6B4] transition cursor-pointer shadow-2xs"
          title="Switch or view forensic case details"
        >
          <FolderLock className="h-3.5 w-3.5 text-[#8C6D46]" />
          <span className="text-stone-500">Case:</span>
          <span className="font-semibold text-stone-900">{activeCase.caseNumber}</span>
        </button>

        {/* Timeline Button - Medium Button */}
        <button
          onClick={onOpenTimelineModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F5EFE6] text-stone-700 border border-[#D5C6B4] transition cursor-pointer shadow-2xs"
          title="Version history, compare, undo, redo"
        >
          <History className="h-3.5 w-3.5 text-[#8C6D46]" />
          <span>Timeline</span>
        </button>

        {/* 3x3 Candidate Grid Button - Medium Button */}
        <button
          onClick={onOpenGridModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F5EFE6] text-stone-700 border border-[#D5C6B4] transition cursor-pointer shadow-2xs"
          title="Generate 3x3 candidate variations of features"
        >
          <Grid3X3 className="h-3.5 w-3.5 text-[#8C6D46]" />
          <span>Recognition Grid</span>
        </button>

        {/* Audit Ledger Status Button - Small Compact Pill */}
        <button
          onClick={onOpenAuditModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F5EFE6] hover:bg-[#EFE7DC] text-[#6B4E2E] border border-[#D8CABE] transition cursor-pointer shadow-2xs"
          title="View and verify cryptographically chained SHA-256 audit ledger"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-[#8C6D46]" />
          <span className="text-[11px]">Ledger</span>
          <span className="px-1.5 py-0.2 rounded bg-white text-[10px] text-[#6B4E2E] border border-[#D5C6B4]">
            {totalAuditEntries}
          </span>
          {auditResult?.isValid ? (
            <span className="h-2 w-2 rounded-full bg-emerald-600" title="Cryptographic chain valid" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" title="Chain verification warning" />
          )}
        </button>

        {/* RBAC Role Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#D5C6B4] shadow-2xs">
          <UserCheck className="h-3.5 w-3.5 text-[#8C6D46]" />
          <span className="text-stone-500 text-[11px]">Role:</span>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="bg-transparent text-stone-800 font-semibold focus:outline-none cursor-pointer pr-1 text-[11px]"
          >
            <option value="INVESTIGATOR" className="bg-white text-stone-800">Investigator</option>
            <option value="FORENSIC_ARTIST" className="bg-white text-stone-800">Forensic Artist</option>
            <option value="SUPERVISOR" className="bg-white text-stone-800">Supervisor</option>
            <option value="ADMIN" className="bg-white text-stone-800">Admin</option>
            <option value="AUDITOR" className="bg-white text-stone-800">Auditor</option>
          </select>
        </div>

        {/* Features Side Drawer Toggle Button - Distinctive Highlight Button */}
        {onToggleFeatureDrawer && (
          <button
            onClick={onToggleFeatureDrawer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer shadow-2xs ${
              isFeatureDrawerOpen
                ? 'bg-[#8C6D46] border-[#785C3A] text-white'
                : 'bg-[#F2ECE1] hover:bg-[#EAE1D2] border-[#D4C5B3] text-[#5C452D]'
            }`}
            title="Expand / collapse rightmost FaceSpec facial features inspector drawer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Features</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              isFeatureDrawerOpen
                ? 'bg-white/20 text-white'
                : 'bg-white text-[#6B4E2E] border border-[#D5C6B4]'
            }`}>
              {statedCount}
            </span>
          </button>
        )}

        {/* Export Docket Button - Prominent CTA */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8C6D46] hover:bg-[#785C3A] text-white font-medium transition cursor-pointer shadow-2xs"
          title="Export forensic docket as PNG or PDF"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
