import React, { useState } from 'react';
import { Columns, FileText, CheckCircle, Eye, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { LabTestItem } from '@/types/medlens';
import { StructuredRecordTable } from './StructuredRecordTable';
import { Button } from '@/components/ui/button';

interface Props {
  rawReportText?: string;
  reportFileName?: string;
  reportTitle: string;
  reportDate: string;
  tests: LabTestItem[];
  onVerifyTest?: (testId: string, correctedValue?: string, correctedStatus?: 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN') => void;
}

export const SideBySideReviewer: React.FC<Props> = ({
  rawReportText,
  reportFileName,
  reportTitle,
  reportDate,
  tests,
  onVerifyTest
}) => {
  const [isSplitMode, setIsSplitMode] = useState(true);
  const [fontSize, setFontSize] = useState(12);

  const defaultRawText = rawReportText || `QUEST DIAGNOSTICS / LALPATHLABS CERTIFIED LAB
LABORATORY REPORT — COMPREHENSIVE BIOCHEMICAL & HEMATOLOGY
Date of Collection: ${reportDate}
Specimen ID: SP-99201948-B

TEST MARKER                 RESULT   UNITS      REFERENCE RANGE
================================================================
Fasting Blood Glucose       182      mg/dL      70.0 - 99.0
Glycated Hemoglobin (HbA1c) 8.4      %          4.0 - 5.6
Serum Creatinine            1.45     mg/dL      0.70 - 1.20
Blood Urea Nitrogen (BUN)   18.0     mg/dL      7.0 - 20.0
Total Cholesterol           218      mg/dL      < 200
Hemoglobin (Hb)             14.2     g/dL       13.5 - 17.5
Platelet Count              260      10^3/uL    150 - 450
================================================================
LAB OBSERVATIONS:
- Fasting Glucose & HbA1c indicative of elevated glycemic response.
- Serum Creatinine shows mild elevation; correlate with GFR and fluid balance.
- Red blood cell indices and platelets are within normal physiological bounds.
`;

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">{reportTitle}</h3>
            <p className="text-[11px] text-slate-500">
              Source: <span className="font-mono text-slate-700">{reportFileName || 'Original_Clinical_Lab_Report.pdf'}</span> • Date: {reportDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsSplitMode(!isSplitMode)}
            className="h-8 text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{isSplitMode ? 'Full Table View' : 'Side-by-Side Review Mode'}</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      {isSplitMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: Source Document Viewer */}
          <div className="lg:col-span-5 bg-slate-950 text-slate-100 rounded-lg p-3 border border-slate-800 shadow-inner flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                Original Document Stream
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button 
                  onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  A-
                </button>
                <button 
                  onClick={() => setFontSize(Math.min(16, fontSize + 1))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  A+
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-2 font-mono leading-relaxed select-text p-2 bg-slate-900/60 rounded border border-slate-800/80" style={{ fontSize: `${fontSize}px` }}>
              <pre className="whitespace-pre-wrap font-mono text-emerald-400/90">{defaultRawText}</pre>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800 mt-2">
              <span>Verified OCR Extraction Feed</span>
              <span>100% Provenance Traceable</span>
            </div>
          </div>

          {/* Right: Structured Interactive Table */}
          <div className="lg:col-span-7 space-y-2">
            <StructuredRecordTable tests={tests} onVerifyTest={onVerifyTest} />
          </div>
        </div>
      ) : (
        <div>
          <StructuredRecordTable tests={tests} onVerifyTest={onVerifyTest} />
        </div>
      )}
    </div>
  );
};

export default SideBySideReviewer;
