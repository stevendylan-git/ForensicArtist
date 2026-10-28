import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Lock, 
  Key, 
  FileSpreadsheet,
  Layers,
  ArrowRight
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
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  if (!isOpen) return null;

  const filtered = filterAction === 'ALL' 
    ? entries 
    : entries.filter(e => e.action === filterAction);

  const handleExportCsv = () => {
    const headers = ['Seq', 'Timestamp', 'User', 'Role', 'Action', 'Resource', 'Outcome', 'PreviousHash', 'EntryHash'];
    const rows = entries.map(e => [
      e.seq,
      `"${e.timestampUtc}"`,
      `"${e.userId}"`,
      `"${e.role}"`,
      `"${e.action}"`,
      `"${e.resource}"`,
      `"${e.outcome}"`,
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
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#D5C6B4] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E6DFD5] flex items-center justify-between bg-[#F6F1EA]">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
              verificationResult?.isValid
                ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}>
              {verificationResult?.isValid ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base text-stone-900">Cryptographic Audit Ledger (SHA-256)</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#6B4E2E] border border-[#D5C6B4]">
                  {entries.length} Blocks Chained
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Append-only, mathematically linked tamper-evident evidentiary chain.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRunVerification}
              className="px-3.5 py-1.5 rounded-lg bg-[#8C6D46] hover:bg-[#785C3A] text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Verify Chain</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EFE8DE] text-stone-800 border border-[#D5C6B4] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-[#EAE1D2] transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className={`p-3.5 border-b text-xs flex flex-wrap items-center justify-between gap-3 ${
          verificationResult?.isValid
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2">
            {verificationResult?.isValid ? (
              <CheckCircle className="h-4 w-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-700 shrink-0" />
            )}
            <span className="font-mono">
              {verificationResult?.message || 'Ready for verification.'}
            </span>
          </div>

          {/* Tamper Simulation Testing Tool */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-600 text-[11px] font-sans">Tamper Testing:</span>
            {verificationResult?.isValid ? (
              <button
                onClick={() => onSimulateTamper(Math.min(2, entries.length))}
                className="px-2.5 py-1 rounded-md bg-white hover:bg-[#FAF5EE] border border-[#D5C6B4] text-[#8C6D46] text-[11px] font-mono flex items-center gap-1 transition cursor-pointer shadow-2xs"
                title="Simulate 1-bit tampering with block #2 to test verification engine"
              >
                <span>Tamper Block #2</span>
              </button>
            ) : (
              <button
                onClick={onRestoreChain}
                className="px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-mono flex items-center gap-1 transition cursor-pointer shadow-2xs"
              >
                <span>Restore Clean Chain</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3 bg-[#F6F1EA] border-b border-[#E6DFD5] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-600 font-medium">Filter Action:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-white border border-[#D5C6B4] text-stone-800 text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Actions ({entries.length})</option>
              {actions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
          <span className="text-stone-500 font-mono text-[11px]">
            Showing {filtered.length} of {entries.length} chained entries
          </span>
        </div>

        {/* Ledger Table */}
        <div className="flex-1 overflow-auto bg-[#FDFBF7]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F6F1EA] text-stone-600 border-b border-[#E6DFD5] sticky top-0 text-[11px]">
              <tr>
                <th className="p-2.5 font-semibold">Seq</th>
                <th className="p-2.5 font-semibold">Timestamp</th>
                <th className="p-2.5 font-semibold">Role / User</th>
                <th className="p-2.5 font-semibold">Action</th>
                <th className="p-2.5 font-semibold">Resource</th>
                <th className="p-2.5 font-semibold">Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE7DC]">
              {filtered.map((entry) => (
                <tr 
                  key={entry.seq}
                  onClick={() => setSelectedEntry(entry)}
                  className={`hover:bg-[#F5EFE6] cursor-pointer transition ${
                    selectedEntry?.seq === entry.seq ? 'bg-[#F2ECE1]' : ''
                  }`}
                >
                  <td className="p-2.5 text-stone-500 font-bold">#{entry.seq}</td>
                  <td className="p-2.5 text-stone-600 whitespace-nowrap">{entry.timestampUtc}</td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span className="font-semibold text-stone-900">{entry.role}</span>
                    <span className="text-stone-500 text-[10px] block font-sans">{entry.userId}</span>
                  </td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-[#D5C6B4] text-[#6B4E2E] font-medium">
                      {entry.action}
                    </span>
                  </td>
                  <td className="p-2.5 text-stone-600 truncate max-w-[150px]">{entry.resource}</td>
                  <td className="p-2.5 text-[#8C6D46] font-mono text-[10px] truncate max-w-[180px]">
                    {entry.entryHash.slice(0, 24)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Block Drawer Detail */}
        {selectedEntry && (
          <div className="p-4 bg-[#F6F1EA] border-t border-[#E6DFD5] text-xs font-mono">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#8C6D46]" /> Block #{selectedEntry.seq} Cryptographic Payload
              </span>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-stone-500 hover:text-stone-900 text-[11px]"
              >
                Close Details
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-[#D5C6B4] text-[11px]">
              <div>
                <div className="text-stone-500">Previous Hash (H_prev):</div>
                <div className="text-[#8C6D46] break-all">{selectedEntry.prevHash}</div>
                <div className="text-stone-500 mt-2">Entry Hash (H_entry = SHA256(H_prev || Payload)):</div>
                <div className="text-emerald-700 font-bold break-all">{selectedEntry.entryHash}</div>
              </div>
              <div className="overflow-auto max-h-24">
                <div className="text-stone-500 mb-1">Decoded Payload Details:</div>
                <pre className="text-stone-700 text-[10px] bg-[#FAF8F5] p-2 rounded-lg border border-[#E6DFD5]">
                  {JSON.stringify(selectedEntry.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
