import React from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, GitCompare, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReferenceRangeBadge } from './ReferenceRangeBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TrendComparisonModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const comparisonData = [
    {
      marker: 'Fasting Blood Glucose',
      unit: 'mg/dL',
      reference: '70.0 - 99.0',
      previousDate: '2026-06-15',
      previousVal: 205,
      previousStatus: 'HIGH' as const,
      currentDate: '2026-09-05',
      currentVal: 182,
      currentStatus: 'HIGH' as const,
      delta: -11.2, // %
      trendDirection: 'down',
      note: 'Decreased by 23 mg/dL (-11.2%)'
    },
    {
      marker: 'Glycated HbA1c',
      unit: '%',
      reference: '4.0 - 5.6',
      previousDate: '2026-06-15',
      previousVal: 9.1,
      previousStatus: 'HIGH' as const,
      currentDate: '2026-09-05',
      currentVal: 8.4,
      currentStatus: 'HIGH' as const,
      delta: -7.7,
      trendDirection: 'down',
      note: 'Decreased by 0.7% (-7.7%)'
    },
    {
      marker: 'Serum Creatinine',
      unit: 'mg/dL',
      reference: '0.70 - 1.20',
      previousDate: '2026-06-15',
      previousVal: 1.15,
      previousStatus: 'NORMAL' as const,
      currentDate: '2026-09-05',
      currentVal: 1.45,
      currentStatus: 'HIGH' as const,
      delta: +26.1,
      trendDirection: 'up',
      note: 'Increased by 0.30 mg/dL (+26.1%)'
    },
    {
      marker: 'Total Cholesterol',
      unit: 'mg/dL',
      reference: '< 200',
      previousDate: '2026-06-15',
      previousVal: 232,
      previousStatus: 'HIGH' as const,
      currentDate: '2026-09-05',
      currentVal: 218,
      currentStatus: 'HIGH' as const,
      delta: -6.0,
      trendDirection: 'down',
      note: 'Improved by 14 mg/dL (-6.0%)'
    },
    {
      marker: 'Hemoglobin (Hb)',
      unit: 'g/dL',
      reference: '13.5 - 17.5',
      previousDate: '2026-06-15',
      previousVal: 14.0,
      previousStatus: 'NORMAL' as const,
      currentDate: '2026-09-05',
      currentVal: 14.2,
      currentStatus: 'NORMAL' as const,
      delta: +1.4,
      trendDirection: 'neutral',
      note: 'Stable physiological plateau'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-600" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Longitudinal Report Comparison & Trend Analytics
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Comparing historical laboratory findings across encounters to identify biomarker trajectories.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {/* Comparison summary cards */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
                <Calendar className="w-3 h-3" /> Baseline Report
              </span>
              <p className="font-bold text-slate-800">June 15, 2026</p>
              <p className="text-[11px] text-slate-500">Lab: Metro Diagnostic Center</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-indigo-600 font-semibold flex items-center gap-1 text-[11px]">
                <Calendar className="w-3 h-3" /> Current Report (Follow-up)
              </span>
              <p className="font-bold text-slate-800">September 05, 2026</p>
              <p className="text-[11px] text-indigo-600 font-medium">Lab: Quest / LalPathLabs</p>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-bold py-2">Biomarker</TableHead>
                  <TableHead className="text-xs font-bold py-2">Report Ref Range</TableHead>
                  <TableHead className="text-xs font-bold py-2 text-center">Previous (Jun 15)</TableHead>
                  <TableHead className="text-xs font-bold py-2 text-center">Current (Sep 05)</TableHead>
                  <TableHead className="text-xs font-bold py-2 text-right">Delta / Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/70">
                    <TableCell className="py-2.5 font-semibold text-xs text-slate-900">
                      {row.marker}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs font-mono text-slate-500">
                      {row.reference} {row.unit}
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <span className="font-mono text-xs font-semibold">{row.previousVal} {row.unit}</span>
                      <div className="mt-0.5">
                        <ReferenceRangeBadge status={row.previousStatus} className="text-[10px] py-0 px-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-center bg-indigo-50/30">
                      <span className="font-mono text-xs font-bold text-indigo-950">{row.currentVal} {row.unit}</span>
                      <div className="mt-0.5">
                        <ReferenceRangeBadge status={row.currentStatus} className="text-[10px] py-0 px-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.trendDirection === 'down' ? (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                            {Math.abs(row.delta)}%
                          </span>
                        ) : row.trendDirection === 'up' ? (
                          <span className="inline-flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                            +{row.delta}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Minus className="w-3 h-3 mr-0.5" />
                            Stable
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{row.note}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Close Comparison
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrendComparisonModal;
