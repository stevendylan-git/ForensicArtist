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
import { 
  createInitialFaceSpec, 
  parseUtteranceToFaceSpec, 
  buildForensicPrompt, 
  applyCandidateVariationToFaceSpec,
  calculateFacialSymmetryScore
} from './services/faceSpecEngine';
import { 
  createSignedAuditEntry, 
  verifyAuditLedgerChain, 
  GENESIS_HASH 
} from './services/crypto';
import { detectCelebrityReference } from './services/antiLeadingSafety';
import { sendInterviewChatMessage, generateCompositeImage } from './services/api';

import { Header } from './components/Header';
import { CognitiveInterview } from './components/CognitiveInterview';
import { CompositeCanvas } from './components/CompositeCanvas';
import { FaceSpecInspector } from './components/FaceSpecInspector';
import { RecognitionGridModal } from './components/RecognitionGridModal';
import { TimelineModal } from './components/TimelineModal';
import { AuditLedgerModal } from './components/AuditLedgerModal';
import { ExportModal } from './components/ExportModal';
import { CaseManagerModal } from './components/CaseManagerModal';
import { ForensicArtistBriefModal } from './components/ForensicArtistBriefModal';
import { SurgicalAlterationsTab } from './components/SurgicalAlterationsTab';
import { NeuralSketchTab } from './components/NeuralSketchTab';

export default function App() {
  // Demo Users / Role
  const [currentRole, setCurrentRole] = useState<UserRole>('INVESTIGATOR');
  
  const currentUser: UserProfile = {
    id: currentRole === 'INVESTIGATOR' ? 'user-sarah-miller' :
        currentRole === 'FORENSIC_ARTIST' ? 'user-alex-reed' :
        currentRole === 'SUPERVISOR' ? 'user-marcus-vance' :
        currentRole === 'AUDITOR' ? 'user-elena-rostova' : 'user-admin',
    email: `${currentRole.toLowerCase()}@forensic.local`,
    fullName: currentRole === 'INVESTIGATOR' ? 'Investigator' :
              currentRole === 'FORENSIC_ARTIST' ? 'Forensic Artist' :
              currentRole === 'SUPERVISOR' ? 'Supervisor' :
              currentRole === 'AUDITOR' ? 'Auditor' : 'Admin',
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
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [adversarialError, setAdversarialError] = useState<string | null>(null);

  // Composite Generation State (Rule 3: no face on initial startup, starts blank until witness describes)
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [styleMode, setStyleMode] = useState<'charcoal' | 'photoreal'>('photoreal');
  const [activeTab, setActiveTab] = useState<'studio' | 'surgical' | 'neural'>('studio');

  // Helper to compile stated vs unstated feature names for context-awareness
  const getFaceSpecContext = (spec: FaceSpec) => {
    const stated: string[] = [];
    const unstated: string[] = [];

    const check = (label: string, val: string, isStated: boolean) => {
      if (isStated && val && val.toLowerCase() !== 'unknown') {
        stated.push(`${label}: ${val}`);
      } else {
        unstated.push(label);
      }
    };

    check('Gender Presentation', spec.gender_presentation.value, spec.gender_presentation.stated);
    check('Approximate Age', spec.approximate_age.value, spec.approximate_age.stated);
    check('Face Contour', spec.face_shape.value, spec.face_shape.stated);
    check('Skin Complexion', spec.skin_tone_complexion.value, spec.skin_tone_complexion.stated);
    check('Hair Style', spec.hair.style.value, spec.hair.style.stated);
    check('Hair Color', spec.hair.color.value, spec.hair.color.stated);
    check('Hair Length', spec.hair.length.value, spec.hair.length.stated);
    check('Eyebrows', spec.eyebrows.value, spec.eyebrows.stated);
    check('Eyes Shape', spec.eyes.shape.value, spec.eyes.shape.stated);
    check('Eyes Color', spec.eyes.color.value, spec.eyes.color.stated);
    check('Nose Width', spec.nose.width.value, spec.nose.width.stated);
    check('Nose Bridge', spec.nose.bridge.value, spec.nose.bridge.stated);
    check('Mouth & Lips', spec.mouth_lips.value, spec.mouth_lips.stated);
    check('Jawline & Chin', spec.jawline_chin.value, spec.jawline_chin.stated);
    check('Facial Hair', spec.facial_hair.value, spec.facial_hair.stated);
    check('Distinguishing Marks', spec.distinguishing_marks.type.value, spec.distinguishing_marks.type.stated);
    check('Accessories', spec.accessories.value, spec.accessories.stated);

    return { stated, unstated };
  };

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
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [showFeatureDrawer, setShowFeatureDrawer] = useState(false);

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

  // Generate Hyper-Realistic Gemini Composite
  const handleGenerateComposite = async (overrideMode?: 'charcoal' | 'photoreal', specToUse?: FaceSpec) => {
    const currentMode = overrideMode || styleMode;
    const spec = specToUse || faceSpec;
    setIsGeneratingImage(true);
    try {
      const prompt = buildForensicPrompt(spec);
      const res = await generateCompositeImage({
        prompt,
        styleMode: currentMode,
        caseNumber: activeCase.caseNumber,
        version: activeVersion.version,
        previousImageBase64: aiImageUrl || undefined,
      });
      if (res.imageUrl) {
        setAiImageUrl(res.imageUrl);
      } else {
        setAiImageUrl('/assets/aistudio/image_138dc769.png');
      }
      setHasGenerated(true);

      // Cryptographically log composite generation into Audit Ledger
      const compositeAudit = await createSignedAuditEntry(auditEntries, {
        userId: currentUser.id,
        role: currentUser.role,
        caseId: activeCase.id,
        action: 'GENERATE_AI_COMPOSITE',
        resource: `/cases/${activeCase.id}/composite/generate`,
        outcome: 'SUCCESS',
        details: {
          model: res.modelUsed,
          styleMode: currentMode,
          status: res.status,
          promptSnippet: res.prompt.slice(0, 100),
        },
      });
      const updatedLedger = [...auditEntries, compositeAudit];
      setAuditEntries(updatedLedger);
      const verifyRes = await verifyAuditLedgerChain(updatedLedger);
      setAuditResult(verifyRes);
    } catch (err) {
      console.warn('Failed to generate AI composite image:', err);
      setHasGenerated(true);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Reset Canvas to initial unrendered drafting state (Rule 3 invariant)
  const handleResetCanvas = async () => {
    setHasGenerated(false);
    setAiImageUrl(null);
    const initial = createInitialFaceSpec();
    setFaceSpec(initial);

    const resetAudit = await createSignedAuditEntry(auditEntries, {
      userId: currentUser.id,
      role: currentUser.role,
      caseId: activeCase.id,
      action: 'RESET_CANVAS',
      resource: `/cases/${activeCase.id}/reset`,
      outcome: 'SUCCESS',
      details: { message: 'Reset composite canvas to blank drafting state awaiting witness input.' },
    });
    const updatedLedger = [...auditEntries, resetAudit];
    setAuditEntries(updatedLedger);
    const verifyRes = await verifyAuditLedgerChain(updatedLedger);
    setAuditResult(verifyRes);
  };

  // Handle witness utterance submission
  const handleSendMessage = async (text: string) => {
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
      setHasGenerated(true);

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

      // Automatically generate hyper-realistic Gemini portrait for new stated attributes
      handleGenerateComposite(styleMode, updatedSpec);
    }

    // 6. Invoke Context-Aware Gemini Interviewer Chatbot
    try {
      const historyMessages = [...utterances, newUtt].map(u => ({
        role: (u.speaker === 'witness' ? 'user' : 'model') as 'user' | 'model',
        content: u.text,
      }));

      const { stated, unstated } = getFaceSpecContext(updatedSpec);

      const chatRes = await sendInterviewChatMessage({
        messages: historyMessages,
        model: selectedModel,
        caseContext: {
          caseNumber: activeCase.caseNumber,
          title: activeCase.title,
          offense: activeCase.offense,
          witnessPseudonym: activeCase.witnessPseudonym,
          notes: activeCase.notes,
          incidentDate: activeCase.incidentDate,
        },
        faceSpecContext: {
          statedFeatures: stated,
          unstatedFeatures: unstated,
        },
      });

      const agentUttId = `utt-${Date.now() + 10}`;
      const agentTimestamp = new Date().toISOString().slice(11, 19) + ' UTC';

      const agentUtt: Utterance = {
        id: agentUttId,
        speaker: 'agent',
        text: chatRes.reply,
        timestamp: agentTimestamp,
      };

      setUtterances(prev => [...prev, agentUtt]);

      // Cryptographically log the interview conversational turn into the audit ledger
      const interviewAudit = await createSignedAuditEntry(auditEntries, {
        userId: 'agent-gemini-interviewer',
        role: 'AGENT',
        caseId: activeCase.id,
        action: 'INTERVIEW_AGENT_REPLY',
        resource: `/cases/${activeCase.id}/interview`,
        outcome: 'SUCCESS',
        details: {
          model: selectedModel,
          replySnippet: chatRes.reply.slice(0, 80),
          statedFeaturesCount: stated.length,
          unstatedFeaturesCount: unstated.length,
        },
      });
      const finalLedger = [...auditEntries, interviewAudit];
      setAuditEntries(finalLedger);
      const verifyRes = await verifyAuditLedgerChain(finalLedger);
      setAuditResult(verifyRes);
    } catch (chatError) {
      console.warn('Failed to get AI chatbot response:', chatError);
    } finally {
      setIsProcessing(false);
    }
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

  // Admin direct attribute override with cryptographic audit trail
  const handleAdminDirectEdit = async (fieldPath: string, newValue: string) => {
    const updated: FaceSpec = JSON.parse(JSON.stringify(faceSpec));
    const parts = fieldPath.split('.');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let target: any = updated;
    for (let i = 0; i < parts.length; i++) {
      if (target && target[parts[i]]) {
        target = target[parts[i]];
      }
    }

    if (target && typeof target.value !== 'undefined') {
      const oldValue = target.value;
      target.value = newValue;
      target.stated = true;
      target.confidence = Math.max(target.confidence || 0, 0.95);

      // Recalculate craniometric symmetry
      const sym = calculateFacialSymmetryScore(updated);
      updated.facial_symmetry = {
        value: sym.percentageText,
        confidence: 0.95,
        stated: true,
        locked: updated.facial_symmetry?.locked ?? false,
      };

      setFaceSpec(updated);
      setHasGenerated(true);

      const newVersionNum = versions.length + 1;
      const timestampStr = new Date().toISOString().slice(11, 19) + ' UTC';

      const newVersion: CompositeVersion = {
        id: `ver-${newVersionNum}`,
        version: newVersionNum,
        timestamp: timestampStr,
        triggeringCall: `Admin Override: ${fieldPath} -> "${newValue}"`,
        localityScore: 94.0,
        lockedRegions: [],
        faceSpec: updated,
        diffSummary: `Admin direct modification: [${fieldPath}] changed from "${oldValue}" to "${newValue}" (Symmetry: ${sym.percentageText})`,
      };

      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setCurrentVersionIndex(updatedVersions.length - 1);

      // Audit log admin override with tamper-evident chain
      const adminAudit = await createSignedAuditEntry(auditEntries, {
        userId: currentUser.id,
        role: currentUser.role,
        caseId: activeCase.id,
        action: 'ADMIN_DIRECT_EDIT',
        resource: `/cases/${activeCase.id}/admin/override`,
        outcome: 'SUCCESS',
        details: {
          fieldPath,
          oldValue,
          newValue,
          newVersion: newVersionNum,
          symmetry: sym.percentageText,
        },
      });
      const updatedLedger = [...auditEntries, adminAudit];
      setAuditEntries(updatedLedger);
      const verifyRes = await verifyAuditLedgerChain(updatedLedger);
      setAuditResult(verifyRes);

      // Regenerate composite rendering with new values
      handleGenerateComposite(styleMode, updated);
    }
  };

  // Select candidate from 3x3 recognition grid
  const handleSelectCandidate = async (feature: string, value: string) => {
    const updated = applyCandidateVariationToFaceSpec(faceSpec, feature, value);
    setFaceSpec(updated);
    setHasGenerated(true);

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

    setHasGenerated(true);
    handleGenerateComposite(styleMode, updated);
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

  const statedAttributesCount = [
    faceSpec.gender_presentation,
    faceSpec.approximate_age,
    faceSpec.face_shape,
    faceSpec.skin_tone_complexion,
    faceSpec.hair.style,
    faceSpec.hair.color,
    faceSpec.hair.length,
    faceSpec.hair.hairline,
    faceSpec.eyebrows,
    faceSpec.eyes.shape,
    faceSpec.eyes.color,
    faceSpec.eyes.spacing,
    faceSpec.nose.width,
    faceSpec.nose.bridge,
    faceSpec.nose.tip,
    faceSpec.mouth_lips,
    faceSpec.jawline_chin,
    faceSpec.facial_hair,
    faceSpec.distinguishing_marks?.type,
    faceSpec.accessories,
    faceSpec.expression,
  ].filter(a => a && a.stated).length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans">
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
        onToggleFeatureDrawer={() => setShowFeatureDrawer(!showFeatureDrawer)}
        isFeatureDrawerOpen={showFeatureDrawer}
        statedCount={statedAttributesCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Studio View OR Surgical Alterations Tab OR Neural Generator Tab */}
      {activeTab === 'studio' ? (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* Left Column: Cognitive Elicitation Dialogue (5 cols) */}
          <div className="lg:col-span-5 h-[calc(100vh-57px)] overflow-hidden">
            <CognitiveInterview
              utterances={utterances}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              adversarialError={adversarialError}
              onClearAdversarialError={() => setAdversarialError(null)}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              activeCase={activeCase}
              faceSpec={faceSpec}
            />
          </div>

          {/* Right Column: Composite Canvas Viewport (7 cols) */}
          <div className="lg:col-span-7 h-[calc(100vh-57px)] overflow-hidden">
            <CompositeCanvas
              faceSpec={faceSpec}
              version={activeVersion.version}
              caseNumber={activeCase.caseNumber}
              currentRole={currentRole}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              entryHash={auditEntries.length > 0 ? auditEntries[auditEntries.length - 1].entryHash : undefined}
              onOpenGridForRegion={handleOpenGridForRegion}
              hasGenerated={hasGenerated}
              aiImageUrl={aiImageUrl}
              isGeneratingImage={isGeneratingImage}
              onGenerateComposite={(mode) => handleGenerateComposite(mode)}
              styleMode={styleMode}
              onStyleModeChange={(mode) => {
                setStyleMode(mode);
                if (hasGenerated) {
                  handleGenerateComposite(mode);
                }
              }}
              onResetCanvas={handleResetCanvas}
              onAskQuestion={handleSendMessage}
              onOpenBriefModal={() => setShowBriefModal(true)}
            />
          </div>
        </main>
      ) : activeTab === 'surgical' ? (
        <SurgicalAlterationsTab
          faceSpec={faceSpec}
          aiImageUrl={aiImageUrl}
          hasGenerated={hasGenerated}
          activeCase={activeCase}
          currentRole={currentRole}
          styleMode={styleMode}
          onGenerateInitialComposite={() => handleGenerateComposite(styleMode)}
          onLogAuditAction={async (action, details) => {
            const audit = await createSignedAuditEntry(auditEntries, {
              userId: currentUser.id,
              role: currentUser.role,
              caseId: activeCase.id,
              action,
              resource: `/cases/${activeCase.id}/alterations`,
              outcome: 'SUCCESS',
              details,
            });
            const updatedLedger = [...auditEntries, audit];
            setAuditEntries(updatedLedger);
            const verifyRes = await verifyAuditLedgerChain(updatedLedger);
            setAuditResult(verifyRes);
          }}
        />
      ) : (
        <NeuralSketchTab
          faceSpec={faceSpec}
          activeCase={activeCase}
          currentRole={currentRole}
          onSendToSurgicalTab={(img) => {
            setAiImageUrl(img);
            setHasGenerated(true);
            setActiveTab('surgical');
          }}
          onLogAuditAction={async (action, details) => {
            const audit = await createSignedAuditEntry(auditEntries, {
              userId: currentUser.id,
              role: currentUser.role,
              caseId: activeCase.id,
              action,
              resource: `/cases/${activeCase.id}/neural-generator`,
              outcome: 'SUCCESS',
              details,
            });
            const updatedLedger = [...auditEntries, audit];
            setAuditEntries(updatedLedger);
            const verifyRes = await verifyAuditLedgerChain(updatedLedger);
            setAuditResult(verifyRes);
          }}
        />
      )}

      {/* Expandable Slide-over Side Drawer for FaceSpec Features Inspector */}
      {showFeatureDrawer && (
        <div 
          className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-2xs transition-opacity duration-200"
          onClick={() => setShowFeatureDrawer(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] max-w-[90vw] bg-[#FAF8F5] border-l border-[#D5C6B4] shadow-2xl transition-transform duration-300 ease-in-out transform ${
          showFeatureDrawer ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <FaceSpecInspector
          faceSpec={faceSpec}
          onToggleLock={handleToggleLock}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          currentRole={currentRole}
          onAdminDirectEdit={handleAdminDirectEdit}
          onCloseDrawer={() => setShowFeatureDrawer(false)}
        />
      </aside>

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
        hasGenerated={hasGenerated}
        aiImageUrl={aiImageUrl}
      />

      <ForensicArtistBriefModal
        isOpen={showBriefModal}
        onClose={() => setShowBriefModal(false)}
        faceSpec={faceSpec}
        activeCase={activeCase}
        version={activeVersion.version}
        currentUser={currentUser}
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
          // Reset FaceSpec and canvas for new case
          setHasGenerated(false);
          setAiImageUrl(null);
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
