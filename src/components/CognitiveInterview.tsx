import React, { useState } from 'react';
import { 
  Eye, 
  AlertCircle, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  HelpCircle, 
  MessageSquare,
  Bookmark
} from 'lucide-react';
import { Utterance } from '../types';
import { COGNITIVE_PROMPTS } from '../services/antiLeadingSafety';

interface CognitiveInterviewProps {
  utterances: Utterance[];
  onSendMessage: (text: string, speaker: 'witness' | 'agent') => void;
  isProcessing: boolean;
  adversarialError: string | null;
  onClearAdversarialError: () => void;
}

export const CognitiveInterview: React.FC<CognitiveInterviewProps> = ({
  utterances,
  onSendMessage,
  isProcessing,
  adversarialError,
  onClearAdversarialError,
}) => {
  const [inputText, setInputText] = useState('');
  const [speaker, setSpeaker] = useState<'witness' | 'agent'>('witness');
  const [showCognitiveGuide, setShowCognitiveGuide] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText.trim(), speaker);
    setInputText('');
  };

  const handleQuickInsert = (text: string) => {
    setInputText(text);
  };

  return (
    <section className="h-full flex flex-col bg-slate-900/40 border-r border-slate-800">
      {/* Console Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-cyan-400" />
          <h2 className="font-semibold text-sm text-slate-100">Cognitive Elicitation Console</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCognitiveGuide(!showCognitiveGuide)}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
          >
            <HelpCircle className="h-3 w-3 text-cyan-400" />
            <span>Protocol</span>
          </button>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
            Anti-Leading Active
          </span>
        </div>
      </div>

      {/* Protocol Banner */}
      <div className="px-3.5 py-2.5 bg-slate-950/50 border-b border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong className="text-slate-300">Rule 7:</strong> Investigator agent strictly avoids leading questions. Focus on free recall and unprompted morphological descriptions. Unstated attributes remain <code className="text-cyan-400 font-mono">unknown</code>.
        </span>
      </div>

      {/* Cognitive Interviewing Protocol Guide (collapsible) */}
      {showCognitiveGuide && (
        <div className="p-3 bg-cyan-950/30 border-b border-cyan-800/50 text-xs space-y-2">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5" /> Certified Cognitive Elicitation Prompts
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

      {/* Utterance History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 font-sans text-sm">
        {utterances.map((utt) => (
          <div
            key={utt.id}
            className={`p-3 rounded-lg border leading-relaxed ${
              utt.isAdversarialRejection
                ? 'bg-red-950/40 border-red-900/60 text-red-200'
                : utt.speaker === 'witness'
                ? 'bg-slate-800/80 border-slate-700/80 text-slate-200 ml-4'
                : utt.speaker === 'agent'
                ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-100 mr-4'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 text-xs'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
              <span className={`font-medium flex items-center gap-1 ${
                utt.speaker === 'witness' ? 'text-amber-400' : utt.speaker === 'agent' ? 'text-cyan-400' : 'text-slate-400'
              }`}>
                {utt.speaker === 'witness' ? 'Eyewitness Statement' : utt.speaker === 'agent' ? 'Forensic Interviewer' : 'System Notice'}
              </span>
              <span className="text-slate-500 text-[10px]">{utt.timestamp}</span>
            </div>

            <p className="text-sm">{utt.text}</p>

            {/* Parsed features badge pill tags */}
            {utt.parsedFields && utt.parsedFields.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Extracted to FaceSpec:</span>
                {utt.parsedFields.map((f, i) => (
                  <span key={i} className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/70 px-1.5 py-0.5 rounded">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Suggested Test Statements */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono text-slate-400">
        <span className="shrink-0 text-slate-500">Test Statements:</span>
        <button
          type="button"
          onClick={() => handleQuickInsert("Male, early 30s, sharp angular jawline, thick dark eyebrows, deep-set dark brown eyes, thin scar on left cheek")}
          className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
        >
          Sample Suspect #1
        </button>
        <button
          type="button"
          onClick={() => handleQuickInsert("He had short wavy brown hair, a narrow nose with a high bridge, and thin lips")}
          className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
        >
          Sample Hair & Nose
        </button>
        <button
          type="button"
          onClick={() => handleQuickInsert("He looked kind of like Brad Pitt with a wide jaw")}
          className="whitespace-nowrap px-2 py-0.5 rounded bg-red-950/70 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition cursor-pointer"
          title="Tests Rule 7 adversarial celebrity comparison detection"
        >
          Test Celebrity Rejection
        </button>
      </div>

      {/* Input Console */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/80 space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-[10px] uppercase font-mono text-slate-500">Speaking As:</span>
            <select
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value as 'witness' | 'agent')}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
            >
              <option value="witness">Eyewitness (Free Recall)</option>
              <option value="agent">Forensic Agent (Elicitation Question)</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              speaker === 'witness'
                ? "Witness statement (e.g. 'He had a sharp jaw, thick dark brows, and a scar on his left cheek')..."
                : "Ask open-ended question (e.g. 'Tell me what you remember about his hair or nose')..."
            }
            disabled={isProcessing}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-medium rounded-md transition cursor-pointer flex items-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                <span>Parsing...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
