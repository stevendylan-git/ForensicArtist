import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  AlertTriangle,
  Bug,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { AuditEntry, AuditVerificationResult } from '../types';

interface AuditLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: AuditEntry[];
  verificationResult: AuditVerificationResult | null;
  onRunVerification: () => void;
  onSimulateTamper: (seq: number) => void;
  onRestoreChain: () => void;
}

export const AuditLedgerModal: React.FC<AuditLedgerModalProps> = ({
  isOpen,
  onClose,
  entries,
  verificationResult,
  onRunVerification,
  onSimulateTamper,
  onRestoreChain,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  if (!isOpen) return null;

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.entryHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.details && JSON.stringify(entry.details).toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = filterAction === 'ALL' || entry.action === filterAction;
    return matchesSearch && matchesAction;
  });

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'seq', 'timestamp_utc', 'user_id', 'role', 'case_id', 'action',
      'resource', 'outcome', 'details', 'prev_hash', 'entry_hash'
    ];
    const rows = entries.map((e) => [
      e.seq,
      e.timestampUtc,
      e.userId,
      e.role,
      e.caseId,
      e.action,
      e.resource,
      e.outcome,
      `"${JSON.stringify(e.details).replace(/"/g, '""')}"`,
      e.prevHash,
      e.entryHash
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `forensic_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actions = Array.from(new Set(entries.map(e => e.action)));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
              verificationResult?.isValid
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {verificationResult?.isValid ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base text-white">Cryptographic Audit Ledger (SHA-256)</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {entries.length} Blocks Chained
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Append-only, mathematically linked tamper-evident evidentiary chain.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRunVerification}
              className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Verify Chain</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className={`p-3.5 border-b text-xs flex flex-wrap items-center justify-between gap-3 ${
          verificationResult?.isValid
            ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-200'
            : 'bg-red-950/60 border-red-900/80 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {verificationResult?.isValid ? (
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span className="font-mono">
              {verificationResult?.message || 'Ready for verification.'}
            </span>
          </div>

          {/* Tamper Simulation Testing Tool */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-sans">Tamper Simulation:</span>
            {verificationResult?.isValid ? (
              <button
                onClick={() => onSimulateTamper(Math.min(2, entries.length))}
                className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-200 text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                title="Simulate 1-bit tampering with block #2 to test verification engine"
              >
                <Bug className="h-3 w-3" />
                <span>Simulate Tamper on #2</span>
              </button>
            ) : (
              <button
                onClick={onRestoreChain}
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
              >
                <span>Restore Chain</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actions, hashes, resources, or details..."
                className="w-full bg-slate-950 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Actions ({entries.length})</option>
              {actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="flex-1 overflow-auto bg-slate-950">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Seq</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">User & Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3">SHA-256 Entry Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEntries.map((e) => (
                <tr key={e.seq} className="hover:bg-slate-900/40 transition">
                  <td className="py-2 px-3 font-bold text-cyan-400">#{e.seq}</td>
                  <td className="py-2 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {e.timestampUtc.replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="text-slate-200 font-medium">{e.userId}</span>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">{e.role}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {e.action}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      e.outcome === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}>
                      {e.outcome}
                    </span>
                  </td>
                  <td className="py-2 px-3 max-w-xs truncate text-[11px] text-slate-400 font-sans" title={JSON.stringify(e.details)}>
                    {JSON.stringify(e.details)}
                  </td>
                  <td className="py-2 px-3 text-[10px] font-mono text-cyan-400/90 whitespace-nowrap" title={`Prev: ${e.prevHash}\nEntry: ${e.entryHash}`}>
                    {e.entryHash.slice(0, 14)}...{e.entryHash.slice(-8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Genesis Hash: <span className="font-mono text-slate-400">0000000000000000...0000</span>
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
