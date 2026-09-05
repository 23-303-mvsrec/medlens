import React from 'react';
import { FileText, HelpCircle, Sparkles, Printer, CheckCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  summary: string;
  keyFindings: string[];
  doctorQuestions?: string[];
  questionsForDoctor?: string[];
  patientName: string;
}

export const ClinicalSummaryCard: React.FC<Props> = ({ 
  summary, 
  keyFindings, 
  doctorQuestions, 
  questionsForDoctor, 
  patientName 
}) => {
  const questions = doctorQuestions || questionsForDoctor || [];
  const handlePrint = () => {
    window.print();
    toast.success('Preparing structured clinical summary for export');
  };

  return (
    <Card className="border-indigo-100 bg-white shadow-xs overflow-hidden">
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-indigo-50/70 to-blue-50/70 border-b border-indigo-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <CardTitle className="text-sm font-semibold text-indigo-950">
            AI-Powered Patient-Friendly Clinical Digest
          </CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint} className="h-7 text-xs gap-1.5 border-indigo-200 hover:bg-indigo-50">
          <Printer className="w-3.5 h-3.5 text-indigo-600" />
          <span>Export Summary</span>
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Plain Language Summary */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Understandable Overview</span>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-100">
            {summary}
          </p>
        </div>

        {/* Key Findings */}
        {keyFindings && keyFindings.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Key Laboratory Observations</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {keyFindings.map((finding, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-indigo-50/40 rounded border border-indigo-100/60 text-xs text-slate-700">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctor Clarification Questions */}
        {questions && questions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Context-Aware Questions to Ask Your Doctor
              </span>
            </div>
            <div className="space-y-1.5">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-amber-50/40 rounded border border-amber-100 text-xs text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClinicalSummaryCard;
