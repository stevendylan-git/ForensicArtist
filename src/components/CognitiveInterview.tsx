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
  VolumeX,
  Info,
  Settings2,
  ExternalLink,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Utterance, ForensicCase, FaceSpec } from '../types';
import { COGNITIVE_PROMPTS } from '../services/antiLeadingSafety';
import { transcribeAudio } from '../services/api';

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

  // Microphone & Speech State
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [activeMicLabel, setActiveMicLabel] = useState<string>('Default Microphone');
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [showMicSettings, setShowMicSettings] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [micActiveNotice, setMicActiveNotice] = useState<string | null>(null);

  // References for Web Speech, AudioContext & MediaRecorder
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const webSpeechCapturedRef = useRef<boolean>(false);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const isSpeechSupported = typeof window !== 'undefined' && 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));

  // Query and enumerate available microphone devices
  const refreshAudioDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');
      setAvailableMics(mics);
      if (mics.length > 0 && !selectedMicId) {
        setSelectedMicId(mics[0].deviceId);
      }
    } catch (err) {
      console.warn('Error enumerating audio devices:', err);
    }
  }, [selectedMicId]);

  useEffect(() => {
    refreshAudioDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshAudioDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshAudioDevices);
      };
    }
  }, [refreshAudioDevices]);

  // Cleanly shut down audio stream, analyser and Web Speech
  const cleanupAudioPipeline = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    setAudioLevel(0);
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Stop listening and finalize transcription
  const stopListening = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      // recorder onstop handles sending to /api/transcribe if Web Speech was idle
    } else {
      cleanupAudioPipeline();
    }
  }, [cleanupAudioPipeline]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioPipeline();
    };
  }, [cleanupAudioPipeline]);

  // Robust startListening with device negotiation, live volume analysis, and dual transcription
  const startListening = useCallback(async () => {
    setSpeechError(null);
    setMicActiveNotice(null);
    recordedChunksRef.current = [];
    webSpeechCapturedRef.current = false;

    // Check mediaDevices support
    if (!navigator.mediaDevices?.getUserMedia) {
      setSpeechError('Microphone capture is not supported in this browser. Please use Chrome, Edge, or Firefox.');
      return;
    }

    let stream: MediaStream | null = null;
    let chosenDeviceId = selectedMicId;

    // Step 1: Attempt to acquire audio stream with progressive constraint fallbacks
    try {
      const constraints: MediaStreamConstraints = chosenDeviceId
        ? { audio: { deviceId: { ideal: chosenDeviceId } } }
        : { audio: true };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (primaryErr: unknown) {
      console.warn('Primary getUserMedia attempt failed, trying fallback constraints:', primaryErr);
      try {
        // Fallback 1: basic audio constraint with no special parameters
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (fallbackErr: unknown) {
        console.warn('Fallback 1 getUserMedia failed, trying relaxed constraints:', fallbackErr);
        try {
          // Fallback 2: disable DSP constraints for Bluetooth / virtual inputs
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
          });
        } catch (finalErr: unknown) {
          console.error('All microphone getUserMedia attempts failed:', finalErr);
          const errObj = finalErr as { name?: string; message?: string };

          if (errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError') {
            if (isIframe) {
              setSpeechError('Microphone access is restricted by the embedded preview frame. Click "Open in Standalone Tab" to dictate with full direct microphone access.');
            } else {
              setSpeechError('Microphone permission was denied. Please allow microphone access in your browser address bar and try again.');
            }
          } else if (errObj.name === 'NotFoundError' || errObj.name === 'DevicesNotFoundError') {
            setSpeechError('No active microphone hardware detected. Please ensure your microphone or headset is plugged in and recognized by your system.');
          } else {
            setSpeechError(`Could not access microphone (${errObj.name || 'Unknown'}). Please check your audio settings.`);
          }
          return;
        }
      }
    }

    if (!stream) {
      setSpeechError('Failed to initialize audio stream.');
      return;
    }

    audioStreamRef.current = stream;

    // Retrieve active microphone name and refresh device list with populated labels
    const activeTrack = stream.getAudioTracks()[0];
    const detectedName = activeTrack?.label || 'Microphone Connected';
    setActiveMicLabel(detectedName);
    refreshAudioDevices();

    // Step 2: Initialize real-time AudioContext Volume Meter (0-100%)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          if (!audioStreamRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          // Scale average (0-255) to realistic percentage (0-100)
          const scaledLevel = Math.min(100, Math.round((average / 128) * 100));
          setAudioLevel(scaledLevel);
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      }
    } catch (audioCtxErr) {
      console.warn('AudioContext visualization setup error:', audioCtxErr);
    }

    // Step 3: Setup MediaRecorder for high-fidelity audio capture & server AI transcription
    let mimeType = 'audio/webm';
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      try {
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          cleanupAudioPipeline();

          const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
          // If Web Speech already captured text, we don't need to re-transcribe via server
          if (webSpeechCapturedRef.current && inputText.trim().length > 0) {
            return;
          }

          // If audio was recorded (size > 1500 bytes = non-empty), send to Gemini AI audio transcriber
          if (audioBlob.size > 1500) {
            setIsTranscribing(true);
            try {
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                const base64Data = reader.result as string;
                try {
                  const result = await transcribeAudio({
                    audioBase64: base64Data,
                    mimeType,
                  });
                  if (result.success && result.transcript) {
                    setInputText((prev) => {
                      const trimmed = prev.trim();
                      return trimmed ? `${trimmed} ${result.transcript}` : result.transcript;
                    });
                    setMicActiveNotice(`Transcribed verbatim: "${result.transcript}"`);
                  } else {
                    setMicActiveNotice('Spoken audio captured. Speak clearly or type statement.');
                  }
                } catch (tErr: any) {
                  console.warn('Server transcription error:', tErr);
                  setSpeechError(tErr.message || 'Could not transcribe speech. You can type directly.');
                } finally {
                  setIsTranscribing(false);
                }
              };
            } catch (rErr) {
              console.warn('FileReader error:', rErr);
              setIsTranscribing(false);
            }
          }
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn('MediaRecorder init failed:', recErr);
      }
    }

    // Step 4: Optional Web Speech API for live streaming text (if available & permitted)
    if (isSpeechSupported) {
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
              webSpeechCapturedRef.current = true;
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
          console.warn('Web Speech API event note:', event.error);
          // If Web Speech API has not-allowed / audio-capture (common in sandboxed iframes),
          // MediaRecorder handles recording + Gemini server transcription automatically on stop!
          if (event.error === 'not-allowed') {
            setMicActiveNotice('Microphone active! Audio recording active with Gemini Speech Engine.');
          } else if (event.error !== 'no-speech') {
            console.info(`Speech event: ${event.error}. MediaRecorder fallback active.`);
          }
        };

        recognition.onend = () => {
          // If recognition stops, MediaRecorder continues until user clicks stop
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (recStartErr) {
        console.warn('Web Speech recognition start deferred to MediaRecorder:', recStartErr);
      }
    }

    setIsListening(true);
  }, [isSpeechSupported, isIframe, selectedMicId, refreshAudioDevices, cleanupAudioPipeline, inputText]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const openInStandaloneWindow = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
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
        {/* Speech Error Notice with Iframe Standalone Quick-Fix */}
        {speechError && (
          <div className="mb-2 p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-950">{speechError}</p>
                {isIframe && (
                  <p className="text-[10px] text-amber-800 mt-0.5">
                    Browsers often restrict microphone access within sandboxed preview frames. Opening in a direct tab immediately restores physical microphone access.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              {isIframe && (
                <button
                  type="button"
                  onClick={openInStandaloneWindow}
                  className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Open in Standalone Tab</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => startListening()}
                className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[11px] font-medium transition cursor-pointer"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-amber-700 hover:text-amber-900 p-1 rounded cursor-pointer"
                title="Dismiss notice"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Microphone Active Informational Notice */}
        {micActiveNotice && (
          <div className="mb-2 p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-900 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
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

        {/* Transcribing Audio State Banner */}
        {isTranscribing && (
          <div className="mb-2 p-2 rounded-lg bg-[#FAF5EE] border border-[#D5C6B4] text-[11px] text-[#6B4E2E] flex items-center gap-2 shadow-2xs animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-[#8C6D46] animate-spin shrink-0" />
            <span className="font-medium">Processing spoken eyewitness audio with Gemini Speech Transcription...</span>
          </div>
        )}

        {/* Live Microphone HUD with Sound Level Meter & Waveform */}
        {isListening && (
          <div className="mb-2.5 p-3 rounded-lg bg-stone-900 text-white border border-stone-700 flex flex-col gap-2 animate-in fade-in duration-150 shadow-md">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-[11px] font-mono font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                  Recording Witness Statement
                </span>
                <span className="text-[10px] font-mono text-stone-300 bg-stone-800 px-2 py-0.5 rounded border border-stone-700 truncate max-w-[180px]" title={activeMicLabel}>
                  🎤 {activeMicLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={stopListening}
                  className="text-[11px] font-medium px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Done Dictating
                </button>
                <button
                  type="button"
                  onClick={cleanupAudioPipeline}
                  className="text-[11px] font-medium px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Live Audio Level Meter */}
            <div className="flex items-center gap-2 pt-1 border-t border-stone-800">
              <div className="flex items-center gap-1 text-[10px] font-mono text-stone-400 shrink-0 w-28">
                {audioLevel > 5 ? (
                  <>
                    <Volume2 className="h-3 w-3 text-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-semibold">Sound: {audioLevel}%</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3 w-3 text-stone-500" />
                    <span>Speak now ({audioLevel}%)</span>
                  </>
                )}
              </div>
              {/* Dynamic volume level bar */}
              <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    audioLevel > 50 ? 'bg-amber-400' : audioLevel > 10 ? 'bg-emerald-400' : 'bg-stone-600'
                  }`}
                  style={{ width: `${Math.max(4, audioLevel)}%` }}
                />
              </div>
            </div>

            {/* Live transcript or speaking prompt */}
            <div className="text-xs bg-stone-950 p-2 rounded border border-stone-800 min-h-[1.75rem] flex items-center">
              {interimTranscript ? (
                <span className="italic text-amber-300 font-medium">
                  "{interimTranscript}"
                </span>
              ) : (
                <span className="text-stone-400 italic text-[11px] flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Microphone is actively capturing your voice. Speak freely — audio will transcribe upon completion.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Microphone Settings / Device Selection Popover */}
        {showMicSettings && (
          <div className="mb-2.5 p-3 rounded-lg bg-white border border-[#D5C6B4] shadow-md animate-in fade-in duration-100 text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EAE2D5]">
              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5 text-[#8C6D46]" />
                Microphone Hardware & Configuration
              </span>
              <button
                type="button"
                onClick={() => setShowMicSettings(false)}
                className="text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-stone-600 mb-1">
                  Audio Input Device:
                </label>
                {availableMics.length > 0 ? (
                  <select
                    value={selectedMicId}
                    onChange={(e) => {
                      setSelectedMicId(e.target.value);
                      if (isListening) {
                        stopListening();
                      }
                    }}
                    className="w-full bg-[#FAF7F2] border border-[#D5C6B4] rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-[#8C6D46]"
                  >
                    {availableMics.map((mic, idx) => (
                      <option key={mic.deviceId || idx} value={mic.deviceId}>
                        {mic.label || `Microphone Input ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-[11px] text-stone-500 bg-[#FAF7F2] p-2 rounded border border-[#EAE2D5] flex items-center justify-between">
                    <span>Default system microphone will be used</span>
                    <button
                      type="button"
                      onClick={refreshAudioDevices}
                      className="text-[#8C6D46] hover:underline font-mono text-[10px]"
                    >
                      Refresh list
                    </button>
                  </div>
                )}
              </div>

              {isIframe && (
                <div className="p-2 rounded bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-amber-900">
                    <span className="font-medium">Sandbox Notice:</span> If the browser blocks audio in this preview, open in a dedicated tab.
                  </div>
                  <button
                    type="button"
                    onClick={openInStandaloneWindow}
                    className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Open in Tab</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 items-center">
          {/* Web Speech Dictation Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isProcessing || isTranscribing}
            className={`px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 border-red-600 text-white animate-pulse ring-2 ring-red-300'
                : 'bg-white hover:bg-[#EFE8DE] border-[#D4C5B3] text-[#6B4E2E] hover:text-[#523A1E]'
            }`}
            title={
              isListening
                ? 'Click to stop dictation and transcribe'
                : 'Click to speak witness statement via microphone'
            }
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 text-white" />
                <span className="hidden sm:inline">Listening...</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 text-[#8C6D46]" />
                <span className="hidden sm:inline">Dictate</span>
              </>
            )}
          </button>

          {/* Quick Microphone Hardware Settings Button */}
          <button
            type="button"
            onClick={() => setShowMicSettings((prev) => !prev)}
            className={`p-2 rounded-lg border text-stone-600 transition cursor-pointer shadow-2xs ${
              showMicSettings
                ? 'bg-[#EAE2D5] border-[#8C6D46] text-[#8C6D46]'
                : 'bg-white hover:bg-[#EFE8DE] border-[#D4C5B3]'
            }`}
            title="Microphone hardware settings & device selection"
          >
            <Settings2 className="h-4 w-4" />
          </button>

          {/* Chat text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening 
                ? "Microphone is recording... speak suspect description now" 
                : isTranscribing 
                ? "Transcribing your spoken words..."
                : "Describe suspect features or respond to interviewer..."
            }
            disabled={isProcessing || isTranscribing}
            className="flex-1 bg-white border border-[#D5C6B4] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8C6D46] focus:ring-1 focus:ring-[#8C6D46] disabled:opacity-60 shadow-2xs"
          />

          {/* Prominent Primary Send Button */}
          <button
            type="submit"
            disabled={isProcessing || isTranscribing || !inputText.trim()}
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
