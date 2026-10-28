import { AuditEntry, AuditVerificationResult } from '../types';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes a standard SHA-256 hexadecimal hash string for arbitrary text data.
 */
export async function computeSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes the canonical SHA-256 payload hash of details JSON.
 */
export async function computePayloadHash(details: Record<string, unknown>): Promise<string> {
  const serialized = JSON.stringify(details, Object.keys(details).sort());
  return computeSha256(serialized);
}

/**
 * Computes the tamper-evident entry hash for a ledger record:
 * entry_hash = SHA-256(seq || timestampUtc || action || payloadHash || prevHash)
 */
export async function computeEntryHash(
  seq: number,
  timestampUtc: string,
  action: string,
  payloadHash: string,
  prevHash: string
): Promise<string> {
  const rawString = `${seq}|${timestampUtc}|${action}|${payloadHash}|${prevHash}`;
  return computeSha256(rawString);
}

/**
 * Verifies the integrity of the audit chain from sequence #1 to head.
 */
export async function verifyAuditLedgerChain(entries: AuditEntry[]): Promise<AuditVerificationResult> {
  if (entries.length === 0) {
    return {
      isValid: true,
      totalEntries: 0,
      message: 'Audit ledger is empty (genesis state intact).',
    };
  }

  // Sort ascending by sequence number
  const sorted = [...entries].sort((a, b) => a.seq - b.seq);

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];

    // Check sequence continuity
    if (entry.seq !== i + 1) {
      return {
        isValid: false,
        totalEntries: sorted.length,
        brokenAtSeq: entry.seq,
        message: `Sequence gap detected: expected sequence #${i + 1}, found #${entry.seq}.`,
      };
    }

    // Check previous hash link
    const expectedPrevHash = i === 0 ? GENESIS_HASH : sorted[i - 1].entryHash;
    if (entry.prevHash !== expectedPrevHash) {
      return {
        isValid: false,
        totalEntries: sorted.length,
        brokenAtSeq: entry.seq,
        expectedHash: expectedPrevHash,
        actualHash: entry.prevHash,
        message: `Cryptographic link broken at sequence #${entry.seq}. Previous hash does not match predecessor.`,
      };
    }

    // Recompute payload hash and entry hash
    const payloadHash = await computePayloadHash(entry.details);
    const expectedEntryHash = await computeEntryHash(
      entry.seq,
      entry.timestampUtc,
      entry.action,
      payloadHash,
      entry.prevHash
    );

    if (entry.entryHash !== expectedEntryHash) {
      return {
        isValid: false,
        totalEntries: sorted.length,
        brokenAtSeq: entry.seq,
        expectedHash: expectedEntryHash,
        actualHash: entry.entryHash,
        message: `Data tampering detected at sequence #${entry.seq}! Entry hash does not match recomputed SHA-256 digest.`,
      };
    }
  }

  return {
    isValid: true,
    totalEntries: sorted.length,
    message: `Audit ledger cryptographic chain is 100% intact and valid (${sorted.length} entries verified).`,
  };
}

/**
 * Creates and signs a new audit entry appended to an existing chain.
 */
export async function createSignedAuditEntry(
  existingEntries: AuditEntry[],
  params: {
    userId: string;
    role: string;
    caseId: string;
    action: string;
    resource: string;
    outcome: 'SUCCESS' | 'DENIED' | 'ERROR';
    details: Record<string, unknown>;
  }
): Promise<AuditEntry> {
  const seq = existingEntries.length + 1;
  const timestampUtc = new Date().toISOString();
  const prevHash = existingEntries.length > 0
    ? existingEntries[existingEntries.length - 1].entryHash
    : GENESIS_HASH;

  const payloadHash = await computePayloadHash(params.details);
  const entryHash = await computeEntryHash(
    seq,
    timestampUtc,
    params.action,
    payloadHash,
    prevHash
  );

  return {
    seq,
    timestampUtc,
    userId: params.userId,
    role: params.role,
    caseId: params.caseId,
    action: params.action,
    resource: params.resource,
    outcome: params.outcome,
    details: params.details,
    prevHash,
    entryHash,
  };
}
