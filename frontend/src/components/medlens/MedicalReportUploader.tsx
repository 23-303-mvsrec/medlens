import React, { useState } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Props {
  onAnalyzeReport: (title: string, rawText: string, file?: File) => Promise<void>;
  isAnalyzing: boolean;
}

export const MedicalReportUploader: React.FC<Props> = ({ onAnalyzeReport, isAnalyzing }) => {
  const [reportTitle, setReportTitle] = useState('Comprehensive Diagnostic Panel');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const sampleReports = [
    {
      title: 'Metabolic & Renal Panel (High Sugar & Creatinine)',
      text: `METROPOLITAN CLINICAL LABORATORIES — BIOCHEMISTRY REPORT
Patient: Eleanor Vance | Date: 2026-09-05

TEST MARKER                 RESULT   UNITS      REFERENCE RANGE
Fasting Blood Glucose       182      mg/dL      70.0 - 99.0
Glycated Hemoglobin (HbA1c) 8.4      %          4.0 - 5.6
Serum Creatinine            1.45     mg/dL      0.70 - 1.20
Blood Urea Nitrogen (BUN)   18.0     mg/dL      7.0 - 20.0
Total Cholesterol           218      mg/dL      < 200
Hemoglobin (Hb)             14.2     g/dL       13.5 - 17.5
Platelet Count              260      10^3/uL    150 - 450`
    },
    {
      title: 'Lipid Profile & Liver Function (Elevated Lipids)',
      text: `QUEST PATHOLOGY SERVICES — LIPID & HEPATIC PANEL
Patient: Eleanor Vance | Date: 2026-09-05

TEST MARKER                 RESULT   UNITS      REFERENCE RANGE
Total Cholesterol           245      mg/dL      < 200
Triglycerides               198      mg/dL      < 150
HDL Cholesterol             38       mg/dL      > 50
LDL Cholesterol             162      mg/dL      < 100
SGPT / ALT                  34       U/L        7.0 - 56.0
SGOT / AST                  28       U/L        8.0 - 48.0`
    },
    {
      title: 'Complete Blood Count (CBC with Anemia Check)',
      text: `MEDLENS CLINICAL REFERENCE LABORATORY
Patient: Eleanor Vance | Date: 2026-09-05

TEST MARKER                 RESULT   UNITS      REFERENCE RANGE
Hemoglobin (Hb)             10.8     g/dL       12.0 - 15.5
Red Blood Cells (RBC)       3.6      million/uL 3.8 - 5.2
White Blood Cells (WBC)     6.2      10^3/uL    4.5 - 11.0
Hematocrit (Hct)            32.5     %          37.0 - 48.0
Platelet Count              240      10^3/uL    150 - 450`
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setReportTitle(file.name.replace(/\.[^/.]+$/, ""));
      toast.info(`Selected file: ${file.name}`);
    }
  };

  const handleSelectSample = (sample: typeof sampleReports[0]) => {
    setReportTitle(sample.title);
    setRawText(sample.text);
    setSelectedFile(null);
    toast.success(`Loaded sample: ${sample.title}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() && !selectedFile) {
      // Default to sample 0
      await onAnalyzeReport(sampleReports[0].title, sampleReports[0].text);
      return;
    }
    await onAnalyzeReport(reportTitle, rawText, selectedFile || undefined);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            Ingest & Process Medical Report
          </h3>
          <p className="text-xs text-slate-500">
            Upload PDF/Image report or paste clinical report text for instant AI extraction.
          </p>
        </div>
        <span className="text-[11px] px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI Extraction Engine
        </span>
      </div>

      {/* Preset demo quick-fill buttons */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Quick Demo Presets (1-Click Load)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {sampleReports.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(s)}
              className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs group"
            >
              <span className="font-semibold text-slate-800 block truncate group-hover:text-indigo-700">
                {s.title}
              </span>
              <span className="text-[10px] text-slate-400">Click to autofill report text</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* File Upload Drop Area */}
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/60 relative">
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg,.txt" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
            {selectedFile ? (
              <div className="space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction</p>
              </div>
            ) : (
              <div className="space-y-1">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Drag & drop lab report PDF or Image</p>
                <p className="text-[10px] text-slate-400">Supports PDF, PNG, JPEG</p>
              </div>
            )}
          </div>

          {/* Report Title & Metadata */}
          <div className="space-y-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Report Title / Encounter Name</Label>
              <input 
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-slate-200 rounded mt-1 bg-white"
                placeholder="e.g. Metabolic & Lipid Panel"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Clinical Report Text (OCR stream)</Label>
              <Textarea 
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste lab text here or select a quick demo preset above..."
                rows={4}
                className="text-xs font-mono bg-white mt-1 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500">
            Source & Reference Ranges will be automatically attributed and cross-referenced with patient intake.
          </span>
          <Button 
            type="submit" 
            disabled={isAnalyzing}
            className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-xs"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                Processing Report...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Extract & Structure Clinical Record
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MedicalReportUploader;

