export interface ChatApiPayload {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  model?: string;
  caseContext?: {
    caseNumber?: string;
    title?: string;
    offense?: string;
    witnessPseudonym?: string;
    notes?: string;
    incidentDate?: string;
  };
  faceSpecContext?: {
    statedFeatures?: string[];
    unstatedFeatures?: string[];
  };
}

export interface ChatApiResponse {
  reply: string;
  modelUsed?: string;
  isAdversarialRejection?: boolean;
  contextAware?: boolean;
  notice?: string;
}

export interface GenerateCompositePayload {
  prompt: string;
  styleMode?: 'charcoal' | 'photoreal';
  caseNumber?: string;
  version?: number;
  previousImageBase64?: string;
}

export interface GenerateCompositeResponse {
  imageUrl: string | null;
  status: 'success' | 'fallback';
  modelUsed: string;
  prompt: string;
}

export async function sendInterviewChatMessage(payload: ChatApiPayload): Promise<ChatApiResponse> {
  const res = await fetch('/api/interview/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Chat API error (${res.status})`);
  }
  return res.json();
}

export async function generateCompositeImage(payload: GenerateCompositePayload): Promise<GenerateCompositeResponse> {
  const res = await fetch('/api/composite/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Composite generation failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch('/api/v1/health');
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json();
}
