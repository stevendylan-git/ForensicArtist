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
  Mic,
  MicOff,
  Radio,
  X,
  Volume2,
  Info
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

  // Web Speech API & Microphone State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [micActiveNotice, setMicActiveNotice] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const isSpeechSupported = typeof window !== 'undefined' && 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));

  // Stop listening helper
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Robust startListening with explicit getUserMedia check first
  const startListening = useCallback(async () => {
    setSpeechError(null);
    setMicActiveNotice(null);

    let streamObtained = false;

    // 1. Explicitly request real microphone device permission from the browser
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        streamObtained = true;
      } catch (err: unknown) {
        console.warn('getUserMedia error:', err);
        const errObj = err as { name?: string; message?: string };
        if (errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError') {
          setSpeechError('Microphone permission is blocked by your browser settings. Please click the permissions icon in your browser URL bar to allow microphone access, then try again.');
          return;
        } else if (errObj.name === 'NotFoundError' || errObj.name === 'DevicesNotFoundError') {
          setSpeechError('No microphone hardware detected on this device. Please connect an audio input device.');
          return;
        }
      }
    }

    // 2. Start Web Speech Recognition
    if (!isSpeechSupported) {
      if (streamObtained) {
        setSpeechError('Microphone is active, but Web Speech API is not supported in this browser. Please use Chrome or Edge for live speech-to-text.');
      } else {
        setSpeechError('Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      }
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
        console.warn('Speech recognition error event:', event.error);
        
        if (event.error === 'not-allowed') {
          // If stream was successfully obtained, the microphone IS physically allowed by the user!
          // Chrome sandbox iframes restrict Web Speech cloud service connection without allow="microphone" on iframe.
          if (streamObtained) {
            setMicActiveNotice('Microphone connected! Note: Your browser restricts automatic Web Speech transcription inside sandboxed preview iframes. You can dictate in a standalone tab or type witness statements directly.');
          } else {
            setSpeechError('Microphone permission was denied by browser settings. Please allow microphone access in site settings.');
          }
        } else if (event.error === 'audio-capture') {
          setSpeechError('Audio capture failed. Please check your microphone connection.');
        } else if (event.error === 'network') {
          setSpeechError('Network error connecting to speech transcription service.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Speech recognition notice: ${event.error}`);
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
      console.error('Speech recognition start failed:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (streamObtained) {
        setMicActiveNotice('Microphone is active. Note: Web Speech recognition is restricted in this preview frame.');
      } else {
        setSpeechError(`Could not activate speech recognition: ${msg}`);
      }
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
    <section className="h-full flex flex-col bg-[#FAF8F5] border-r border-[#E6DFD5]">
      {/* Console Header with Model Selector */}
      <div className="p-3 border-b border-[#E6DFD5] flex flex-wrap items-center justify-between gap-2 bg-[#F6F1EA]/80 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#EFE7DC] border border-[#D8CABE] flex items-center justify-center text-[#8C6D46]">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-stone-900 flex items-center gap-1.5">
              <span>Cognitive Interview</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAE2D5] text-[#6B4E2E] border border-[#D5C6B4]">
                AI Agent
              </span>
            </h2>
          </div>
        </div>

        {/* Model Selector & Protocol Info */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Gemini Model Selector */}
          <div className="flex items-center gap-1 bg-white border border-[#D8CFC2] rounded-md px-2 py-1 shadow-2xs">
            <Cpu className="h-3 w-3 text-[#8C6D46]" />
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="bg-transparent text-stone-800 font-mono text-[11px] focus:outline-none cursor-pointer"
              title="Select Gemini model for cognitive interviewing"
            >
              <option value="gemini-3.8-flash" className="bg-white text-stone-800">
                gemini-3.8-flash (General Elicitation)
              </option>
              <option value="gemini-3.1-flash-lite" className="bg-white text-stone-800">
                gemini-3.1-flash-lite (Fast Recall)
              </option>
              <option value="gemini-4-argon" className="bg-white text-stone-800">
                gemini-4-argon (Complex Reasoning)
              </option>
            </select>
          </div>

          <button
            onClick={() => setShowCognitiveGuide(!showCognitiveGuide)}
            className="text-[11px] font-medium px-2 py-1 rounded bg-[#EFE8DE] hover:bg-[#E5DDD0] text-[#6B4E2E] border border-[#D8CABE] flex items-center gap-1 transition cursor-pointer"
            title="Certified cognitive interview prompts"
          >
            <HelpCircle className="h-3 w-3 text-[#8C6D46]" />
            <span>Guide</span>
          </button>
        </div>
      </div>

      {/* Case Context & Recall Counter Bar */}
      <div className="px-3.5 py-1.5 bg-[#F2ECE1] border-b border-[#E6DFD5] text-[11px] font-mono text-stone-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-stone-500">Witness:</span>
          <span className="font-semibold text-stone-900">{activeCase.witnessPseudonym}</span>
          <span>•</span>
          <span className="text-stone-600">{activeCase.caseNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#6B4E2E] font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8C6D46] animate-pulse"></span>
            Context-Aware
          </span>
          <span>•</span>
          <span className="text-[#8C6D46] font-semibold">{statedFeaturesCount}/14 Stated</span>
        </div>
      </div>

      {/* Certified Cognitive Recall Guide (Collapsible) */}
      {showCognitiveGuide && (
        <div className="p-3 bg-[#F4EFE6] border-b border-[#DFD3C4] text-xs space-y-2 animate-in fade-in duration-150">
          <div className="font-semibold text-[#6B4E2E] flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5 text-[#8C6D46]" />
            <span>Certified Cognitive Interview Prompts (Rule 7 Non-Leading)</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {COGNITIVE_PROMPTS.map((cp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickInsert(cp.prompt)}
                className="text-left p-2 rounded bg-white hover:bg-[#FAF7F2] border border-[#E0D5C7] text-[11px] text-stone-700 transition cursor-pointer shadow-2xs"
              >
                <span className="font-semibold text-[#8C6D46] block">{cp.category}</span>
                <span className="text-stone-600">{cp.prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Adversarial Alert Banner */}
      {adversarialError && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-800 flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Rule 7 Adversarial Contamination Detected</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">{adversarialError}</p>
            </div>
          </div>
          <button
            onClick={onClearAdversarialError}
            className="text-red-600 hover:text-red-900 p-1 text-xs font-mono cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Revised Chat Thread */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans text-sm">
        {utterances.map((utt) => {
          const isWitness = utt.speaker === 'witness';
          const isAgent = utt.speaker === 'agent';

          return (
            <div
              key={utt.id}
              className={`p-3 rounded-xl border leading-relaxed transition ${
                utt.isAdversarialRejection
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : isWitness
                  ? 'bg-white border-[#E2D8CC] text-stone-800 ml-4 shadow-2xs'
                  : isAgent
                  ? 'bg-[#F5EFE6] border-[#DFD3C4] text-stone-900 mr-4 shadow-2xs'
                  : 'bg-[#ECE4D8]/60 border-[#D8CCBE] text-stone-600 text-xs'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                <span className={`font-semibold flex items-center gap-1.5 ${
                  isWitness ? 'text-[#8C6D46]' : isAgent ? 'text-[#6B4E2E]' : 'text-stone-500'
                }`}>
                  {isWitness ? (
                    <>
                      <User className="h-3 w-3 text-[#8C6D46]" />
                      <span>{activeCase.witnessPseudonym} (Eyewitness)</span>
                    </>
                  ) : isAgent ? (
                    <>
                      <Bot className="h-3 w-3 text-[#8C6D46]" />
                      <span>Cognitive Interviewer ({selectedModel})</span>
                    </>
                  ) : (
                    <span>System Protocol</span>
                  )}
                </span>
                <span className="text-stone-400 text-[10px]">{utt.timestamp}</span>
              </div>

              {/* Message Content */}
              <p className="text-xs sm:text-sm leading-relaxed text-stone-800">{utt.text}</p>

              {/* Extracted FaceSpec Features Badge */}
              {utt.parsedFields && utt.parsedFields.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#E8DFD3] flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-mono text-stone-500 uppercase">Synchronized to FaceSpec:</span>
                  {utt.parsedFields.map((f, i) => (
                    <span key={i} className="text-[10px] font-mono bg-[#EAE2D5] text-[#5C452D] border border-[#D5C6B4] px-1.5 py-0.5 rounded">
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
          <div className="p-3 rounded-xl bg-[#F5EFE6] border border-[#DFD3C4] text-stone-700 mr-4 flex items-center gap-2 text-xs font-mono shadow-2xs">
            <Bot className="h-3.5 w-3.5 animate-bounce text-[#8C6D46]" />
            <span>Forensic agent is analyzing witness recall & structuring non-leading query...</span>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-3 py-1.5 bg-[#F4EFE6]/80 border-t border-[#E6DFD5] flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono text-stone-600">
        <span className="shrink-0 text-stone-500 text-[10px] uppercase font-semibold">Quick Prompt:</span>
        <button
          type="button"
          onClick={() => handleQuickInsert("He was a male in his early 30s with a sharp angular jaw, thick dark brows, and a thin scar across his left cheek.")}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-[#EFE8DE] text-stone-700 border border-[#D8CABE] transition cursor-pointer shadow-2xs"
        >
          Jaw & Scar
        </button>
        <button
          type="button"
          onClick={() => handleQuickInsert("He had short wavy brown hair, a narrow nose with a high bridge, and thin lips.")}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-[#EFE8DE] text-stone-700 border border-[#D8CABE] transition cursor-pointer shadow-2xs"
        >
          Hair & Nose
        </button>
        <button
          type="button"
          onClick={() => handleQuickInsert("He looked kind of like Brad Pitt with a wide jaw")}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
          title="Tests Rule 7 adversarial celebrity comparison detection"
        >
          Adversarial Test
        </button>
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#E6DFD5] bg-[#F7F3EC]/90">
        {/* Speech Error Notice */}
        {speechError && (
          <div className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-900 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="text-amber-700 hover:text-amber-900 p-0.5 rounded cursor-pointer"
              title="Dismiss notice"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Microphone Active Informational Notice */}
        {micActiveNotice && (
          <div className="mb-2 p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-900 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>{micActiveNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setMicActiveNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
              title="Dismiss notice"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Live Speech Recognition Waveform & Interim HUD */}
        {isListening && (
          <div className="mb-2 p-2.5 rounded-lg bg-red-50 border border-red-300 flex flex-col gap-1.5 animate-in fade-in duration-150 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                </span>
                <span className="text-[11px] font-mono font-semibold text-red-800 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="h-3 w-3 text-red-600 animate-pulse" />
                  Live Witness Audio Dictation Active
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-red-800 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                  Web Speech (en-US)
                </span>
                <button
                  type="button"
                  onClick={stopListening}
                  className="text-[10px] font-medium px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white transition cursor-pointer shadow-2xs"
                >
                  Stop Dictating
                </button>
              </div>
            </div>
            <div className="text-xs text-stone-800 bg-white p-2 rounded border border-red-200 min-h-[1.75rem] flex items-center">
              {interimTranscript ? (
                <span className="italic text-[#8C6D46] font-medium">
                  "{interimTranscript}"
                </span>
              ) : (
                <span className="text-stone-500 italic text-[11px] flex items-center gap-1.5">
                  <Volume2 className="h-3 w-3 animate-pulse text-red-500" />
                  Listening... speak witness description into your microphone.
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 items-center">
          {/* Web Speech Dictation Microphone Button - Medium Size */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isProcessing}
            className={`px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 border-red-600 text-white animate-pulse ring-2 ring-red-300'
                : 'bg-white hover:bg-[#EFE8DE] border-[#D4C5B3] text-[#6B4E2E] hover:text-[#523A1E]'
            }`}
            title={
              isListening
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
                <Mic className="h-4 w-4 text-[#8C6D46]" />
                <span className="hidden sm:inline">Dictate</span>
              </>
            )}
          </button>

          {/* Chat text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening... speak witness description now" : "Describe suspect features or respond to interviewer..."}
            disabled={isProcessing}
            className="flex-1 bg-white border border-[#D5C6B4] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8C6D46] focus:ring-1 focus:ring-[#8C6D46] disabled:opacity-60 shadow-2xs"
          />

          {/* Prominent Primary Send Button */}
          <button
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            className="px-4 py-2 bg-[#8C6D46] hover:bg-[#785C3A] disabled:bg-[#E5DDD0] disabled:text-stone-400 text-white text-xs sm:text-sm font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            {isProcessing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-[#FAF7F2]" />
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
