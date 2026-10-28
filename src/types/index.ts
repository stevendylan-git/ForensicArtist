export interface FeatureAttribute {
  value: string;
  confidence: number; // 0.0 - 1.0
  stated: boolean;
  locked: boolean;
  verbatim?: string;
  sourceUtteranceId?: string;
  notes?: string;
}

export interface GranularEyesSpec {
  shape: FeatureAttribute;
  size: FeatureAttribute;
  spacing: FeatureAttribute;
  color: FeatureAttribute;
}

export interface GranularNoseSpec {
  width: FeatureAttribute;
  length: FeatureAttribute;
  bridge: FeatureAttribute;
  tip: FeatureAttribute;
}

export interface GranularHairSpec {
  length: FeatureAttribute;
  style: FeatureAttribute;
  color: FeatureAttribute;
  hairline: FeatureAttribute;
}

export interface GranularDistinguishingMarksSpec {
  type: FeatureAttribute;
  location: FeatureAttribute;
}

export interface FaceSpec {
  gender_presentation: FeatureAttribute;
  approximate_age: FeatureAttribute;
  face_shape: FeatureAttribute;
  skin_tone_complexion: FeatureAttribute;
  hair: GranularHairSpec;
  eyebrows: FeatureAttribute;
  eyes: GranularEyesSpec;
  nose: GranularNoseSpec;
  mouth_lips: FeatureAttribute;
  jawline_chin: FeatureAttribute;
  cheekbones_ears: FeatureAttribute;
  facial_hair: FeatureAttribute;
  distinguishing_marks: GranularDistinguishingMarksSpec;
  accessories: FeatureAttribute;
  expression: FeatureAttribute;
  notes: FeatureAttribute;
}

export type UserRole = 'INVESTIGATOR' | 'FORENSIC_ARTIST' | 'SUPERVISOR' | 'ADMIN' | 'AUDITOR';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  badgeNumber: string;
  agency: string;
}

export interface Utterance {
  id: string;
  speaker: 'witness' | 'agent' | 'investigator' | 'system';
  text: string;
  timestamp: string;
  parsedFields?: string[];
  isAdversarialRejection?: boolean;
}

export interface CompositeVersion {
  id: string;
  version: number;
  timestamp: string;
  triggeringCall: string;
  localityScore: number; // 0 - 100%
  localityUnverified?: boolean;
  lockedRegions: string[];
  faceSpec: FaceSpec;
  utteranceId?: string;
  diffSummary?: string;
}

export interface CandidateVariation {
  candidateIndex: number;
  variationFeature: string;
  variationValue: string;
  imageSeed: number;
  localityScore: number;
  label: string;
}

export interface AuditEntry {
  seq: number;
  timestampUtc: string;
  userId: string;
  role: string;
  caseId: string;
  action: string;
  resource: string;
  outcome: 'SUCCESS' | 'DENIED' | 'ERROR';
  details: Record<string, unknown>;
  prevHash: string;
  entryHash: string;
}

export interface AuditVerificationResult {
  isValid: boolean;
  totalEntries: number;
  brokenAtSeq?: number;
  expectedHash?: string;
  actualHash?: string;
  message: string;
}

export interface ForensicCase {
  id: string;
  caseNumber: string;
  title: string;
  offense: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'VERIFIED' | 'CLOSED';
  incidentDate: string;
  assignedUsers: string[];
  witnessPseudonym: string;
  notes: string;
  createdAt: string;
}
