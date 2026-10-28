import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Eye, 
  AlertCircle, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  HelpCircle, 
  Bookmark,
  Bot,
  User,
  Cpu,
  CornerDownLeft,
  Mic,
  MicOff,
  Radio,
  X,
  Volume2
} from 'lucide-react';
import { Utterance, ForensicCase, FaceSpec } from '../types';
import { COGNITIVE_PROMPTS } from '../services/antiLeadingSafety';

interface CognitiveInterviewProps {
  utterances: Utterance[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  adversarialError: string | null;
  onClearAdversarialError: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  activeCase: ForensicCase;
  faceSpec: FaceSpec;
}

export const CognitiveInterview: React.FC<CognitiveInterviewProps> = ({
  utterances,
  onSendMessage,
  isProcessing,
  adversarialError,
  onClearAdversarialError,
  selectedModel,
  onSelectModel,
  activeCase,
  faceSpec,
}) => {
  const [inputText, setInputText] = useState('');
  const [showCognitiveGuide, setShowCognitiveGuide] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  // Web Speech API State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const isSpeechSupported = typeof window !== 'undefined' && 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    setSpeechError(null);

    if (!isSpeechSupported) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInputText((prev) => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${transcriptPart.trim()}` : transcriptPart.trim();
            });
          } else {
            currentInterim += transcriptPart;
          }
        }
        setInterimTranscript(currentInterim);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access in your browser to dictate statements.');
        } else if (event.error === 'audio-capture') {
          setSpeechError('No microphone detected. Please check your audio input device.');
        } else if (event.error === 'network') {
          setSpeechError('Network error occurred during speech transcription.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown initialization error';
      setSpeechError(`Could not start speech recognition: ${msg}`);
      setIsListening(false);
    }
  }, [isSpeechSupported]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [utterances, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
      stopListening();
    }
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickInsert = (text: string) => {
    setInputText(text);
  };

  // Compute stated features list for context awareness badge
  const statedFeaturesCount = [
    faceSpec.gender_presentation,
    faceSpec.approximate_age,
    faceSpec.face_shape,
    faceSpec.skin_tone_complexion,
    faceSpec.hair.style,
    faceSpec.eyebrows,
    faceSpec.eyes.shape,
    faceSpec.nose.width,
    faceSpec.nose.bridge,
    faceSpec.mouth_lips,
    faceSpec.jawline_chin,
    faceSpec.facial_hair,
    faceSpec.distinguishing_marks.type,
    faceSpec.accessories,
  ].filter(a => a.stated).length;

  return (
    <section className="h-full flex flex-col bg-slate-900/40 border-r border-slate-800">
      {/* Console Header with Model Selector */}
      <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/70">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
              <span>Cognitive Interviewer</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                AI Agent
              </span>
            </h2>
          </div>
        </div>

        {/* Model Selector & Protocol Info */}
        <div className="flex items-center gap-2 text-xs">
          {/* Gemini Model Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1">
            <Cpu className="h-3 w-3 text-cyan-400" />
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="bg-transparent text-cyan-300 font-mono text-[11px] focus:outline-none cursor-pointer"
              title="Select Gemini model for cognitive interviewing"
            >
              <option value="gemini-3.8-flash" className="bg-slate-900 text-slate-200">
                gemini-3.8-flash (General Elicitation)
              </option>
              <option value="gemini-3.1-flash-lite" className="bg-slate-900 text-slate-200">
                gemini-3.1-flash-lite (Fast Recall)
              </option>
              <option value="gemini-4-argon" className="bg-slate-900 text-slate-200">
                gemini-4-argon (Complex Reasoning)
              </option>
            </select>
          </div>

          <button
            onClick={() => setShowCognitiveGuide(!showCognitiveGuide)}
            className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
            title="Certified cognitive interview prompts"
          >
            <HelpCircle className="h-3 w-3 text-cyan-400" />
            <span>Guide</span>
          </button>
        </div>
      </div>

      {/* Context Awareness Active Bar */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/80 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Case Context:</span>
          <span className="text-amber-400 font-semibold">{activeCase.caseNumber}</span>
          <span>•</span>
          <span className="text-slate-300">{activeCase.witnessPseudonym}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Context-Aware
          </span>
          <span>•</span>
          <span className="text-cyan-400">{statedFeaturesCount}/14 Stated</span>
        </div>
      </div>

      {/* Protocol Banner */}
      <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <span className="text-[11px] leading-relaxed">
          <strong className="text-slate-300">Rule 7 Invariant:</strong> The AI interviewer enforces anti-leading cognitive elicitation. It dynamically inspects the unstated areas of the FaceSpec and guides recall without suggesting features.
        </span>
      </div>

      {/* Cognitive Interviewing Protocol Guide (collapsible) */}
      {showCognitiveGuide && (
        <div className="p-3 bg-cyan-950/30 border-b border-cyan-800/50 text-xs space-y-2">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5" /> Certified Cognitive Recall Prompts
          </div>
          <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {COGNITIVE_PROMPTS.map((cp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickInsert(cp.prompt)}
                className="text-left p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition cursor-pointer"
              >
                <span className="font-semibold text-cyan-400 block">{cp.category}</span>
                <span className="text-slate-400">{cp.prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Adversarial Celebrity Violation Alert Banner */}
      {adversarialError && (
        <div className="p-3 bg-red-950/80 border-b border-red-800 text-xs text-red-200 flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Adversarial Celebrity Rejection Logged</p>
              <p className="mt-0.5 text-red-200/90">{adversarialError}</p>
              <p className="mt-1 text-[10px] font-mono text-red-400">Denial cryptographically stamped into Audit Ledger.</p>
            </div>
          </div>
          <button
            onClick={onClearAdversarialError}
            className="text-red-400 hover:text-red-200 font-bold px-1 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Multi-turn Chat Thread */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans text-sm">
        {utterances.map((utt) => {
          const isWitness = utt.speaker === 'witness';
          const isAgent = utt.speaker === 'agent';

          return (
            <div
              key={utt.id}
              className={`p-3 rounded-xl border leading-relaxed transition ${
                utt.isAdversarialRejection
                  ? 'bg-red-950/40 border-red-900/60 text-red-200'
                  : isWitness
                  ? 'bg-slate-800/80 border-slate-700/80 text-slate-200 ml-4 shadow-sm'
                  : isAgent
                  ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-100 mr-4 shadow-sm'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 text-xs'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                <span className={`font-semibold flex items-center gap-1.5 ${
                  isWitness ? 'text-amber-400' : isAgent ? 'text-cyan-400' : 'text-slate-400'
                }`}>
                  {isWitness ? (
                    <>
                      <User className="h-3 w-3" />
                      <span>{activeCase.witnessPseudonym} (Eyewitness)</span>
                    </>
                  ) : isAgent ? (
                    <>
                      <Bot className="h-3 w-3" />
                      <span>Forensic Cognitive Agent ({selectedModel})</span>
                    </>
                  ) : (
                    <span>System Protocol</span>
                  )}
                </span>
                <span className="text-slate-500 text-[10px]">{utt.timestamp}</span>
              </div>

              {/* Message Content */}
              <p className="text-xs sm:text-sm leading-relaxed">{utt.text}</p>

              {/* Extracted FaceSpec Features Badge */}
              {utt.parsedFields && utt.parsedFields.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Synchronized to FaceSpec:</span>
                  {utt.parsedFields.map((f, i) => (
                    <span key={i} className="text-[10px] font-mono bg-cyan-950/90 text-cyan-300 border border-cyan-800/80 px-1.5 py-0.5 rounded">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isProcessing && (
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-300 mr-4 flex items-center gap-2 text-xs font-mono">
            <Bot className="h-3.5 w-3.5 animate-bounce text-cyan-400" />
            <span>Forensic agent is analyzing description & synthesizing cognitive recall query...</span>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Suggested Test Statements */}
      <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono text-slate-400">
        <span className="shrink-0 text-slate-500">Quick Test:</span>
        <button
          type="button"
          onClick={() => handleQuickInsert("He was a male in his early 30s with a sharp angular jaw, thick dark brows, and a thin scar across his left cheek.")}
          className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
        >
          Jaw & Scar
        </button>
        <button
          type="button"
          onClick={() => handleQuickInsert("He had short wavy brown hair, a narrow nose with a high bridge, and thin lips.")}
          className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
        >
          Hair & Nose
        </button>
        <button
          type="button"
          onClick={() => handleQuickInsert("He looked kind of like Brad Pitt with a wide jaw")}
          className="whitespace-nowrap px-2 py-0.5 rounded bg-red-950/70 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition cursor-pointer"
          title="Tests Rule 7 adversarial celebrity comparison detection"
        >
          Adversarial Test
        </button>
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/80">
        {/* Speech Error Notice */}
        {speechError && (
          <div className="mb-2 p-2 rounded bg-red-950/70 border border-red-800 text-[11px] text-red-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="text-red-400 hover:text-white p-0.5 rounded cursor-pointer"
              title="Dismiss error"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Live Speech Recognition Waveform & Interim HUD */}
        {isListening && (
          <div className="mb-2 p-2.5 rounded-lg bg-red-950/40 border border-red-600/50 flex flex-col gap-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-[11px] font-mono font-semibold text-red-200 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="h-3 w-3 text-red-400 animate-pulse" />
                  Live Witness Audio Dictation Active
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-red-300/80 bg-red-900/60 px-1.5 py-0.5 rounded border border-red-700/60">
                  Web Speech API (en-US)
                </span>
                <button
                  type="button"
                  onClick={stopListening}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900 hover:bg-red-800 text-white transition cursor-pointer"
                >
                  Stop Dictating
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-200 bg-slate-950/80 p-2 rounded border border-red-900/40 min-h-[1.75rem] flex items-center">
              {interimTranscript ? (
                <span className="italic text-cyan-300">
                  "{interimTranscript}"
                </span>
              ) : (
                <span className="text-slate-500 italic text-[11px] flex items-center gap-1.5">
                  <Volume2 className="h-3 w-3 animate-pulse text-red-400" />
                  Speak clearly into microphone... Witness statements are transcribed in real-time.
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {/* Web Speech Dictation Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isProcessing}
            className={`px-3 py-2 rounded-md border text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 border-red-500 text-white animate-pulse shadow-lg shadow-red-950/80 ring-2 ring-red-400'
                : isSpeechSupported
                ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title={
              !isSpeechSupported
                ? 'Speech recognition not supported in this browser'
                : isListening
                ? 'Stop live audio dictation'
                : 'Dictate witness statement with Web Speech API'
            }
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 text-white" />
                <span className="hidden sm:inline">Listening</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Dictate</span>
              </>
            )}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening... speak witness description now" : "Respond to the interviewer or describe what you remember..."}
            disabled={isProcessing}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs sm:text-sm font-medium rounded-md transition cursor-pointer flex items-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
