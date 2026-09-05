import React from 'react';
import { UserCheck, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  source: string;
  confidence?: number;
  isVerified?: boolean;
  className?: string;
}

export const ProvenanceTag: React.FC<Props> = ({ source, confidence, isVerified = false, className }) => {
  const isUser = source?.toLowerCase().includes('user') || source?.toLowerCase().includes('patient');

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all", className, 
      isUser 
        ? "bg-sky-50 text-sky-800 border border-sky-200" 
        : isVerified 
          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
          : "bg-purple-50 text-purple-800 border border-purple-200"
    )}>
      {isUser ? (
        <UserCheck className="w-3 h-3 text-sky-600 shrink-0" />
      ) : isVerified ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
      ) : (
        <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
      )}
      
      <span className="truncate max-w-[180px]" title={source}>{source}</span>
      
      {confidence !== undefined && !isUser && (
        <span className="text-[10px] px-1 py-0.2 bg-purple-100/70 rounded text-purple-700 font-mono">
          {Math.round(confidence * 100)}%
        </span>
      )}
      
      {isVerified && (
        <span className="text-[10px] font-semibold text-emerald-700 ml-0.5">
          Verified
        </span>
      )}
    </div>
  );
};

export default ProvenanceTag;
