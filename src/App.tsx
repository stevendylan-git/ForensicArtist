import React, { useState, useEffect } from 'react';
import { 
  FaceSpec, 
  UserRole, 
  UserProfile, 
  ForensicCase, 
  Utterance, 
  CompositeVersion, 
  AuditEntry, 
  AuditVerificationResult 
} from './types';
import { createInitialFaceSpec, parseUtteranceToFaceSpec } from './services/faceSpecEngine';
import { 
  createSignedAuditEntry, 
  verifyAuditLedgerChain, 
  GENESIS_HASH 
} from './services/crypto';
import { detectCelebrityReference, isLeadingQuestion } from './services/antiLeadingSafety';

import { Header } from './components/Header';
import { CognitiveInterview } from './components/CognitiveInterview';
import { CompositeCanvas } from './components/CompositeCanvas';
import { FaceSpecInspector } from './components/FaceSpecInspector';
import { RecognitionGridModal } from './components/RecognitionGridModal';
import { TimelineModal } from './components/TimelineModal';
import { AuditLedgerModal } from './components/AuditLedgerModal';
import { ExportModal } from './components/ExportModal';
import { CaseManagerModal } from './components/CaseManagerModal';

export default function App() {
  // Demo Users / Role
  const [currentRole, setCurrentRole] = useState<UserRole>('INVESTIGATOR');
  
  const currentUser: UserProfile = {
    id: currentRole === 'INVESTIGATOR' ? 'user-sarah-miller' :
        currentRole === 'FORENSIC_ARTIST' ? 'user-alex-reed' :
        currentRole === 'SUPERVISOR' ? 'user-marcus-vance' :
        currentRole === 'AUDITOR' ? 'user-elena-rostova' : 'user-admin',
    email: `${currentRole.toLowerCase()}@forensic.local`,
    fullName: currentRole === 'INVESTIGATOR' ? 'Det. Sarah Miller' :
              currentRole === 'FORENSIC_ARTIST' ? 'Alex Reed' :
              currentRole === 'SUPERVISOR' ? 'Capt. Marcus Vance' :
              currentRole === 'AUDITOR' ? 'Elena Rostova (Compliance Auditor)' : 'System Administrator',
    role: currentRole,
    badgeNumber: 'BADGE-4892',
    agency: 'Metropolitan Forensic Division',
  };

  // Forensic Cases
  const [cases, setCases] = useState<ForensicCase[]>([
    {
      id: 'case-001',
      caseNumber: 'CASE-2026-0814',
      title: 'Downtown Commercial Armed Robbery Suspect',
      offense: 'Armed Robbery / Aggravated Assault',
      status: 'IN_PROGRESS',
      incidentDate: '2026-10-24',
      assignedUsers: ['user-sarah-miller', 'user-alex-reed'],
      witnessPseudonym: 'Witness-Delta',
      notes: 'Incident occurred under high-pressure sodium street lamps. Witness was approx 8 feet away.',
      createdAt: '2026-10-25T08:00:00Z',
    },
    {
      id: 'case-002',
      caseNumber: 'CASE-2026-0922',
      title: 'Harbor District Night Burglary',
      offense: 'Commercial Burglary',
      status: 'OPEN',
      incidentDate: '2026-10-26',
      assignedUsers: ['user-sarah-miller'],
      witnessPseudonym: 'Witness-Sierra',
      notes: 'Security guard witnessed subject exiting side entrance.',
      createdAt: '2026-10-27T10:15:00Z',
    }
  ]);
  const [activeCaseId, setActiveCaseId] = useState<string>('case-001');
  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0];

  // FaceSpec Source of Truth (Rule 3 invariant)
  const [faceSpec, setFaceSpec] = useState<FaceSpec>(createInitialFaceSpec());
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Utterance Interview Dialogue
  const [utterances, setUtterances] = useState<Utterance[]>([
    {
      id: 'utt-001',
      speaker: 'agent',
      text: 'Hello. Take all the time you need. Close your eyes if that helps you picture the scene. In your own words, describe whatever facial details stand out most clearly in your memory.',
      timestamp: '09:00:15 UTC',
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adversarialError, setAdversarialError] = useState<string | null>(null);

  // Version Timeline & History
  const [versions, setVersions] = useState<CompositeVersion[]>([
    {
      id: 'ver-1',
      version: 1,
      timestamp: '09:00:20 UTC',
      triggeringCall: 'Initial baseline template',
      localityScore: 100.0,
      lockedRegions: [],
      faceSpec: createInitialFaceSpec(),
      diffSummary: 'Initial neutral evidentiary baseline created.',
    }
  ]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(0);
  const activeVersion = versions[currentVersionIndex] || versions[0];

  // Cryptographic SHA-256 Audit Ledger
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditResult, setAuditResult] = useState<AuditVerificationResult | null>(null);

  // Modals state
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);
  const [gridInitialFeature, setGridInitialFeature] = useState('nose');
  const [showExportModal, setShowExportModal] = useState(false);

  // Initialize genesis audit entry on mount
  useEffect(() => {
    async function initAuditChain() {
      const genesis = await createSignedAuditEntry([], {
        userId: 'system-genesis',
        role: 'SYSTEM',
        caseId: 'SYSTEM',
        action: 'GENESIS_INIT',
        resource: '/system/audit',
        outcome: 'SUCCESS',
        details: { message: 'Forensic tamper-evident audit ledger initialized with genesis hash 0x00.' },
      });

      const caseEntry = await createSignedAuditEntry([genesis], {
        userId: currentUser.id,
        role: currentUser.role,
        caseId: activeCase.id,
        action: 'OPEN_CASE',
        resource: `/cases/${activeCase.id}`,
        outcome: 'SUCCESS',
        details: { caseNumber: activeCase.caseNumber, title: activeCase.title },
      });

      const initialLedger = [genesis, caseEntry];
      setAuditEntries(initialLedger);

      const verifyRes = await verifyAuditLedgerChain(initialLedger);
      setAuditResult(verifyRes);
    }
    initAuditChain();
  }, []);

  // Handle witness utterance submission
  const handleSendMessage = async (text: string, speaker: 'witness' | 'agent') => {
    // 1. Check for Adversarial Celebrity Reference
    const celebCheck = detectCelebrityReference(text);
    if (celebCheck.blocked) {
      setAdversarialError(celebCheck.errorMessage || 'Adversarial comparison blocked.');

      // Append denied utterance
      const deniedUtt: Utterance = {
        id: `utt-${Date.now()}`,
        speaker: 'witness',
        text,
        timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
        isAdversarialRejection: true,
      };
      setUtterances(prev => [...prev, deniedUtt]);

      // Cryptographically log denial into Audit Ledger
      const denialAudit = await createSignedAuditEntry(auditEntries, {
        userId: currentUser.id,
        role: currentUser.role,
        caseId: activeCase.id,
        action: 'EDIT_DENIED',
        resource: `/cases/${activeCase.id}/describe`,
        outcome: 'DENIED',
        details: {
          rejectionReason: 'Adversarial celebrity comparison strictly prohibited under Rule 7',
          celebrity: celebCheck.celebrityName,
          utterance: text,
        },
      });
      const updatedLedger = [...auditEntries, denialAudit];
      setAuditEntries(updatedLedger);
      const verifyRes = await verifyAuditLedgerChain(updatedLedger);
      setAuditResult(verifyRes);
      return;
    }

    setAdversarialError(null);
    setIsProcessing(true);

    const utteranceId = `utt-${Date.now()}`;
    const timestampStr = new Date().toISOString().slice(11, 19) + ' UTC';

    if (speaker === 'agent') {
      // Question from interviewer
      const newUtt: Utterance = {
        id: utteranceId,
        speaker: 'agent',
        text,
        timestamp: timestampStr,
      };
      setUtterances(prev => [...prev, newUtt]);
      setIsProcessing(false);
      return;
    }

    // Parse witness statement into FaceSpec update
    const { updatedSpec, diff } = parseUtteranceToFaceSpec(text, utteranceId, faceSpec);
    const parsedFieldKeys = Object.keys(diff);

    const newUtt: Utterance = {
      id: utteranceId,
      speaker: 'witness',
      text,
      timestamp: timestampStr,
      parsedFields: parsedFieldKeys,
    };
    setUtterances(prev => [...prev, newUtt]);

    if (parsedFieldKeys.length > 0) {
      setFaceSpec(updatedSpec);

      // Create new version in timeline
      const newVersionNum = versions.length + 1;
      const newVersion: CompositeVersion = {
        id: `ver-${newVersionNum}`,
        version: newVersionNum,
        timestamp: timestampStr,
        triggeringCall: `NL describe (${parsedFieldKeys.length} features updated)`,
        localityScore: 98.6,
        lockedRegions: [],
        faceSpec: updatedSpec,
        utteranceId,
        diffSummary: `Updated: ${parsedFieldKeys.join(', ')}`,
      };

      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setCurrentVersionIndex(updatedVersions.length - 1);

      // Log to cryptographic audit ledger
      const versionAudit = await createSignedAuditEntry(auditEntries, {
        userId: currentUser.id,
        role: currentUser.role,
        caseId: activeCase.id,
        action: 'CREATE_VERSION',
        resource: `/cases/${activeCase.id}/describe`,
        outcome: 'SUCCESS',
        details: {
          version: newVersionNum,
          utteranceId,
          diff,
        },
      });
      const updatedLedger = [...auditEntries, versionAudit];
      setAuditEntries(updatedLedger);
      const verifyRes = await verifyAuditLedgerChain(updatedLedger);
      setAuditResult(verifyRes);
    }

    setIsProcessing(false);
  };

  // Toggle lock on feature
  const handleToggleLock = async (fieldPath: string) => {
    const updated: FaceSpec = JSON.parse(JSON.stringify(faceSpec));
    const parts = fieldPath.split('.');
    
    // Helper to find attribute
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let target: any = updated;
    for (let i = 0; i < parts.length; i++) {
      target = target[parts[i]];
    }

    if (target && typeof target.locked === 'boolean') {
      target.locked = !target.locked;
      setFaceSpec(updated);

      // Audit log lock change
      const lockAudit = await createSignedAuditEntry(auditEntries, {
        userId: currentUser.id,
        role: currentUser.role,
        caseId: activeCase.id,
        action: target.locked ? 'LOCK_FEATURE' : 'UNLOCK_FEATURE',
        resource: `/cases/${activeCase.id}/lock`,
        outcome: 'SUCCESS',
        details: { fieldPath, locked: target.locked },
      });
      const updatedLedger = [...auditEntries, lockAudit];
      setAuditEntries(updatedLedger);
      const verifyRes = await verifyAuditLedgerChain(updatedLedger);
      setAuditResult(verifyRes);
    }
  };

  // Select candidate from 3x3 recognition grid
  const handleSelectCandidate = async (feature: string, value: string) => {
    const updated: FaceSpec = JSON.parse(JSON.stringify(faceSpec));
    
    if (feature === 'nose') {
      updated.nose.bridge.stated = true;
      updated.nose.bridge.value = value;
      updated.nose.bridge.confidence = 0.9;
    } else if (feature === 'hair') {
      updated.hair.style.stated = true;
      updated.hair.style.value = value;
      updated.hair.style.confidence = 0.9;
    } else if (feature === 'jawline_chin') {
      updated.jawline_chin.stated = true;
      updated.jawline_chin.value = value;
      updated.jawline_chin.confidence = 0.9;
    } else if (feature === 'eyebrows') {
      updated.eyebrows.stated = true;
      updated.eyebrows.value = value;
      updated.eyebrows.confidence = 0.9;
    } else if (feature === 'eyes') {
      updated.eyes.shape.stated = true;
      updated.eyes.shape.value = value;
      updated.eyes.shape.confidence = 0.9;
    } else if (feature === 'face_shape') {
      updated.face_shape.stated = true;
      updated.face_shape.value = value;
      updated.face_shape.confidence = 0.9;
    } else if (feature === 'facial_hair') {
      updated.facial_hair.stated = true;
      updated.facial_hair.value = value;
      updated.facial_hair.confidence = 0.9;
    }

    setFaceSpec(updated);

    const newVersionNum = versions.length + 1;
    const timestampStr = new Date().toISOString().slice(11, 19) + ' UTC';

    const newVersion: CompositeVersion = {
      id: `ver-${newVersionNum}`,
      version: newVersionNum,
      timestamp: timestampStr,
      triggeringCall: `Candidate Grid: ${feature} -> ${value}`,
      localityScore: 98.4,
      lockedRegions: [],
      faceSpec: updated,
      diffSummary: `Eyewitness picked variation: ${feature} = "${value}"`,
    };

    const updatedVersions = [...versions, newVersion];
    setVersions(updatedVersions);
    setCurrentVersionIndex(updatedVersions.length - 1);

    // Audit log candidate pick
    const gridAudit = await createSignedAuditEntry(auditEntries, {
      userId: currentUser.id,
      role: currentUser.role,
      caseId: activeCase.id,
      action: 'GRID_SELECT',
      resource: `/cases/${activeCase.id}/grid/select`,
      outcome: 'SUCCESS',
      details: {
        feature,
        selectedCandidate: value,
        newVersion: newVersionNum,
      },
    });
    const updatedLedger = [...auditEntries, gridAudit];
    setAuditEntries(updatedLedger);
    const verifyRes = await verifyAuditLedgerChain(updatedLedger);
    setAuditResult(verifyRes);
  };

  // Revert to historical version
  const handleRevertToVersion = async (versionNum: number) => {
    const target = versions.find(v => v.version === versionNum);
    if (!target) return;

    const revertedSpec = JSON.parse(JSON.stringify(target.faceSpec));
    setFaceSpec(revertedSpec);

    const newVersionNum = versions.length + 1;
    const timestampStr = new Date().toISOString().slice(11, 19) + ' UTC';

    const newVersion: CompositeVersion = {
      id: `ver-${newVersionNum}`,
      version: newVersionNum,
      timestamp: timestampStr,
      triggeringCall: `Reverted to v${versionNum}.0`,
      localityScore: 100.0,
      lockedRegions: [],
      faceSpec: revertedSpec,
      diffSummary: `Restored composite state of version ${versionNum}.0`,
    };

    const updatedVersions = [...versions, newVersion];
    setVersions(updatedVersions);
    setCurrentVersionIndex(updatedVersions.length - 1);

    const revertAudit = await createSignedAuditEntry(auditEntries, {
      userId: currentUser.id,
      role: currentUser.role,
      caseId: activeCase.id,
      action: 'REVERT_VERSION',
      resource: `/cases/${activeCase.id}/revert`,
      outcome: 'SUCCESS',
      details: { revertedToVersion: versionNum, newVersion: newVersionNum },
    });
    const updatedLedger = [...auditEntries, revertAudit];
    setAuditEntries(updatedLedger);
    const verifyRes = await verifyAuditLedgerChain(updatedLedger);
    setAuditResult(verifyRes);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (currentVersionIndex > 0) {
      const prevIdx = currentVersionIndex - 1;
      setCurrentVersionIndex(prevIdx);
      setFaceSpec(JSON.parse(JSON.stringify(versions[prevIdx].faceSpec)));
    }
  };

  const handleRedo = () => {
    if (currentVersionIndex < versions.length - 1) {
      const nextIdx = currentVersionIndex + 1;
      setCurrentVersionIndex(nextIdx);
      setFaceSpec(JSON.parse(JSON.stringify(versions[nextIdx].faceSpec)));
    }
  };

  // Run audit ledger verification manually
  const handleRunVerification = async () => {
    const res = await verifyAuditLedgerChain(auditEntries);
    setAuditResult(res);
  };

  // Simulate 1-bit tampering
  const handleSimulateTamper = async (seq: number) => {
    const tampered = auditEntries.map(e => {
      if (e.seq === seq) {
        return {
          ...e,
          details: { ...e.details, unauthorizedTamperPayload: 'MODIFIED_BY_ADVERSARY' }
        };
      }
      return e;
    });
    setAuditEntries(tampered);
    const res = await verifyAuditLedgerChain(tampered);
    setAuditResult(res);
  };

  // Restore chain
  const handleRestoreChain = async () => {
    // Recompute all hashes
    let prev = GENESIS_HASH;
    const restored: AuditEntry[] = [];
    for (const e of auditEntries) {
      const cleanDetails = { ...e.details };
      delete cleanDetails.unauthorizedTamperPayload;
      const signed = await createSignedAuditEntry(restored, {
        userId: e.userId,
        role: e.role,
        caseId: e.caseId,
        action: e.action,
        resource: e.resource,
        outcome: e.outcome,
        details: cleanDetails,
      });
      restored.push(signed);
    }
    setAuditEntries(restored);
    const res = await verifyAuditLedgerChain(restored);
    setAuditResult(res);
  };

  // Log export action
  const handleLogExport = async (format: string, mode: string) => {
    const exportAudit = await createSignedAuditEntry(auditEntries, {
      userId: currentUser.id,
      role: currentUser.role,
      caseId: activeCase.id,
      action: 'EXPORT_DOCKET',
      resource: `/cases/${activeCase.id}/export`,
      outcome: 'SUCCESS',
      details: {
        format,
        renderMode: mode,
        version: activeVersion.version,
        caseNumber: activeCase.caseNumber,
      },
    });
    const updatedLedger = [...auditEntries, exportAudit];
    setAuditEntries(updatedLedger);
    const verifyRes = await verifyAuditLedgerChain(updatedLedger);
    setAuditResult(verifyRes);
  };

  // Open 3x3 grid with preselected feature
  const handleOpenGridForRegion = (region: string) => {
    setGridInitialFeature(region);
    setShowGridModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation & Status Bar */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeCase={activeCase}
        auditResult={auditResult}
        totalAuditEntries={auditEntries.length}
        onOpenAuditModal={() => setShowAuditModal(true)}
        onOpenCaseModal={() => setShowCaseModal(true)}
        onOpenTimelineModal={() => setShowTimelineModal(true)}
        onOpenGridModal={() => setShowGridModal(true)}
        onOpenExportModal={() => setShowExportModal(true)}
      />

      {/* Main Studio 3-Column Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Column: Cognitive Elicitation Dialogue (4 cols) */}
        <div className="lg:col-span-4 h-[calc(100vh-61px)] overflow-hidden">
          <CognitiveInterview
            utterances={utterances}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            adversarialError={adversarialError}
            onClearAdversarialError={() => setAdversarialError(null)}
          />
        </div>

        {/* Center Column: Composite Canvas Viewport (5 cols) */}
        <div className="lg:col-span-5 h-[calc(100vh-61px)] overflow-hidden">
          <CompositeCanvas
            faceSpec={faceSpec}
            version={activeVersion.version}
            caseNumber={activeCase.caseNumber}
            currentRole={currentRole}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            entryHash={auditEntries.length > 0 ? auditEntries[auditEntries.length - 1].entryHash : undefined}
            onOpenGridForRegion={handleOpenGridForRegion}
          />
        </div>

        {/* Right Column: FaceSpec Source of Truth Inspector (3 cols) */}
        <div className="lg:col-span-3 h-[calc(100vh-61px)] overflow-hidden">
          <FaceSpecInspector
            faceSpec={faceSpec}
            onToggleLock={handleToggleLock}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
        </div>
      </main>

      {/* Modals */}
      <RecognitionGridModal
        isOpen={showGridModal}
        onClose={() => setShowGridModal(false)}
        faceSpec={faceSpec}
        caseNumber={activeCase.caseNumber}
        version={activeVersion.version}
        onSelectCandidate={handleSelectCandidate}
        initialFeature={gridInitialFeature}
      />

      <TimelineModal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        versions={versions}
        currentVersionIndex={currentVersionIndex}
        onRevertToVersion={handleRevertToVersion}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={currentVersionIndex > 0}
        canRedo={currentVersionIndex < versions.length - 1}
        caseNumber={activeCase.caseNumber}
      />

      <AuditLedgerModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        entries={auditEntries}
        verificationResult={auditResult}
        onRunVerification={handleRunVerification}
        onSimulateTamper={handleSimulateTamper}
        onRestoreChain={handleRestoreChain}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        faceSpec={faceSpec}
        activeCase={activeCase}
        version={activeVersion.version}
        currentUser={currentUser}
        entryHash={auditEntries.length > 0 ? auditEntries[auditEntries.length - 1].entryHash : undefined}
        onLogExport={handleLogExport}
      />

      <CaseManagerModal
        isOpen={showCaseModal}
        onClose={() => setShowCaseModal(false)}
        cases={cases}
        activeCaseId={activeCaseId}
        onSelectCase={setActiveCaseId}
        onCreateCase={async (newCase) => {
          const created: ForensicCase = {
            ...newCase,
            id: `case-${Date.now()}`,
            createdAt: new Date().toISOString(),
          };
          setCases(prev => [created, ...prev]);
          setActiveCaseId(created.id);
          // Reset FaceSpec for new case
          setFaceSpec(createInitialFaceSpec());
          setVersions([
            {
              id: `ver-1`,
              version: 1,
              timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
              triggeringCall: `Created case ${created.caseNumber}`,
              localityScore: 100.0,
              lockedRegions: [],
              faceSpec: createInitialFaceSpec(),
              diffSummary: `Initiated forensic dossier for ${created.caseNumber}`,
            }
          ]);
          setCurrentVersionIndex(0);

          // Log to audit chain
          const caseAudit = await createSignedAuditEntry(auditEntries, {
            userId: currentUser.id,
            role: currentUser.role,
            caseId: created.id,
            action: 'CREATE_CASE',
            resource: `/cases/${created.id}`,
            outcome: 'SUCCESS',
            details: { caseNumber: created.caseNumber, title: created.title },
          });
          const updatedLedger = [...auditEntries, caseAudit];
          setAuditEntries(updatedLedger);
          const verifyRes = await verifyAuditLedgerChain(updatedLedger);
          setAuditResult(verifyRes);
        }}
      />
    </div>
  );
}
