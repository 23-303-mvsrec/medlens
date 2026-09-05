import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const ResponsibleAIDisclaimer: React.FC<Props> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-700 font-medium">
        <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
        <span>MedLens is an informational tool. It does not provide medical diagnosis or replace physician consultation.</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 border border-indigo-100 rounded-xl shadow-xs">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shrink-0 mt-0.5 shadow-xs">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-indigo-950 flex items-center gap-2">
            Safety, Security & Responsible AI Guardrail
            <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold uppercase tracking-wider">Verified Compliance</span>
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            MedLens transforms fragmented clinical information into an organized, traceable, and reviewable patient record. 
            It strictly <strong>does not provide medical diagnoses, prescribe medications, or recommend dosage adjustments</strong>. 
            All clinical findings and reference ranges reflect source documentation and must be reviewed by a licensed medical practitioner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResponsibleAIDisclaimer;
