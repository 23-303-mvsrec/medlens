import React from 'react';
import { ArrowDownRight, ArrowUpRight, Check, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  status: 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN';
  reason?: string;
  range?: string;
  className?: string;
}

export const ReferenceRangeBadge: React.FC<Props> = ({ status, reason, range, className }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'HIGH':
        return {
          container: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
          icon: <ArrowUpRight className="w-3 h-3 text-rose-600 stroke-[2.5]" />,
          label: 'HIGH'
        };
      case 'LOW':
        return {
          container: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
          icon: <ArrowDownRight className="w-3 h-3 text-amber-600 stroke-[2.5]" />,
          label: 'LOW'
        };
      case 'NORMAL':
        return {
          container: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
          icon: <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />,
          label: 'NORMAL'
        };
      default:
        return {
          container: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <HelpCircle className="w-3 h-3 text-slate-500" />,
          label: 'UNCATEGORIZED'
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border cursor-help transition-colors",
        style.container,
        className
      )}
      title={reason || (range ? `Report Reference Range: ${range}` : 'No reference range provided')}
    >
      {style.icon}
      <span>{style.label}</span>
      {range && <span className="font-normal opacity-75 text-[10px] ml-0.5">({range})</span>}
    </div>
  );
};

export default ReferenceRangeBadge;
