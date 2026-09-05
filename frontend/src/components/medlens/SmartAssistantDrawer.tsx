import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  HelpCircle, 
  FileText, 
  ArrowRight,
  Bot,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Props {
  patientId: string;
  patientName?: string;
}

export const SmartAssistantDrawer: React.FC<Props> = ({ patientId, patientName = 'Patient' }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{
    query: string;
    answer: string;
    context: string[];
    sources: string[];
    followups: string[];
  }>>([
    {
      query: `Overview of ${patientName}'s clinical profile and out-of-range findings`,
      answer: `Contextual synthesis for ${patientName}: Multiple diagnostic markers have been processed with first-class provenance. Findings outside source reference limits are prioritized in the MedLens Studio for physician review.`,
      context: [`Patient: ${patientName}`, `ID: ${patientId}`, `Active Monitoring`],
      sources: ['CBC_Panel_2026.pdf (Page 1)', 'Patient Intake Form (PATIENT_PROVIDED)'],
      followups: [
        'What are the specific out-of-range biomarkers on the latest report?',
        'Are there any documented drug allergies or history conflicts?',
        'Summarize longitudinal trends between previous and current reports.'
      ]
    }
  ]);

  const quickPrompts = [
    'What biomarkers are out of range?',
    'Are there any documented allergies or medication conflicts?',
    'Summarize longitudinal trends from previous encounters.',
    'What questions should the patient ask their doctor?'
  ];

  const handleAsk = async (userQuery: string) => {
    if (!userQuery.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/medlens/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, query: userQuery })
      });

      if (!res.ok) {
        throw new Error('Failed to query assistant');
      }

      const data = await res.json();
      setConversation((prev) => [
        ...prev,
        {
          query: userQuery,
          answer: data.answer,
          context: data.context_used || [],
          sources: data.provenance_sources || [],
          followups: data.suggested_followups || []
        }
      ]);
      setQuery('');
    } catch {
      toast.error('Could not reach assistant backend. Ensure server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Context-Aware Clinical Assistant
              <Badge variant="outline" className="text-[10px] bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold">
                Dynamic Grounding
              </Badge>
            </h3>
            <p className="text-xs text-slate-500">
              Cites exact patient records, laboratory ranges, and inconsistency radar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          Non-Diagnostic Guardrail
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Suggested Context Queries
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleAsk(prompt)}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition-colors text-left flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
        {conversation.map((entry, idx) => (
          <div key={idx} className="space-y-2.5 bg-slate-50/70 border border-slate-100 rounded-xl p-3.5">
            {/* User Question */}
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                Q
              </span>
              <p className="text-xs font-semibold text-slate-900 pt-0.5">{entry.query}</p>
            </div>

            {/* Answer */}
            <div className="pl-6 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
              {entry.answer}
            </div>

            {/* Evidence & Provenance Sources */}
            {entry.sources && entry.sources.length > 0 && (
              <div className="pl-6 pt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <FileText className="w-2.5 h-2.5" /> Sources:
                </span>
                {entry.sources.map((src, sIdx) => (
                  <Badge key={sIdx} variant="secondary" className="text-[10px] bg-white border border-slate-200 text-slate-600 font-mono">
                    {src}
                  </Badge>
                ))}
              </div>
            )}

            {/* Suggested Followups */}
            {entry.followups && entry.followups.length > 0 && (
              <div className="pl-6 pt-1 space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5" /> Follow-up Suggestions:
                </span>
                <div className="flex flex-wrap gap-1">
                  {entry.followups.map((f, fIdx) => (
                    <button
                      key={fIdx}
                      onClick={() => handleAsk(f)}
                      className="text-[11px] px-2 py-0.5 bg-indigo-50/60 hover:bg-indigo-100 border border-indigo-200/60 text-indigo-800 rounded-md transition-colors text-left"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 py-2 pl-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Analyzing patient record and citing laboratory evidence...
          </div>
        )}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(query);
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-100"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Ask about ${patientName}'s lab trends, out-of-range markers, or allergy conflicts...`}
          className="text-xs h-9 bg-slate-50 border-slate-200 focus-visible:ring-indigo-600 rounded-xl"
          disabled={loading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!query.trim() || loading}
          className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Ask
        </Button>
      </form>
    </div>
  );
};
