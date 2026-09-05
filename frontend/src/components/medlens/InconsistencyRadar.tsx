import React from 'react';
import { AlertTriangle, ShieldX, Info, GitCompare } from 'lucide-react';
import { ConflictDetectionItem } from '@/types/medlens';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  conflicts: ConflictDetectionItem[];
}

export const InconsistencyRadar: React.FC<Props> = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
        <GitCompare className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>No clinical conflicts or history discrepancies detected between patient intake and laboratory data.</span>
      </div>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/30 overflow-hidden">
      <CardHeader className="py-3 px-4 bg-amber-100/50 border-b border-amber-200/60 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
          <CardTitle className="text-sm font-semibold text-amber-900">
            Clinical Discrepancy & Inconsistency Radar ({conflicts.length})
          </CardTitle>
        </div>
        <span className="text-[11px] font-medium text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
          Requires Human Verification
        </span>
      </CardHeader>
      <CardContent className="p-3 divide-y divide-amber-200/40 space-y-3">
        {conflicts.map((item) => (
          <div key={item.id} className="pt-2 first:pt-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                {item.severity === 'CRITICAL' ? (
                  <Badge variant="destructive" className="text-[10px] uppercase py-0">Critical Discrepancy</Badge>
                ) : (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] uppercase py-0">Warning</Badge>
                )}
                {item.title}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              {item.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5 text-[11px] bg-white/70 p-2 rounded border border-amber-200/60">
              <div>
                <span className="text-slate-400 font-medium">Source 1: </span>
                <span className="text-slate-800 font-semibold">{item.source_a}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Source 2: </span>
                <span className="text-slate-800 font-semibold">{item.source_b}</span>
              </div>
            </div>
            <div className="text-[11px] text-amber-900 bg-amber-100/60 px-2 py-1 rounded flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Recommended Action: {item.recommendation}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default InconsistencyRadar;
