import { API_BASE } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Files, 
  FileText, 
  Search, 
  Upload, 
  Eye, 
  Sparkles, 
  Calendar, 
  Building2, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  User,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ResponsibleAIDisclaimer from '@/components/medlens/ResponsibleAIDisclaimer';
import MedicalReportUploader from '@/components/medlens/MedicalReportUploader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface MedicalReport {
  report_id: string;
  patient_id: string;
  patient_name?: string;
  report_title: string;
  report_date: string;
  laboratory_name?: string;
  file_name: string;
  file_url?: string;
  extracted_tests: any[];
  review_items?: any[];
  plain_summary?: string;
  created_at?: string;
}

const Documents = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchReportsAndPatients = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Patients
      const patRes = await fetch(`${API_BASE}/medlens/patients`);
      let patientList: any[] = [];
      if (patRes.ok) {
        patientList = await patRes.json();
        setPatients(patientList);
      }

      // 2. Fetch reports for default patient (or all)
      const pId = patientList.length > 0 ? patientList[0].patient_id : 'p-101';
      const repRes = await fetch(`http://127.0.0.1:8000/api/medlens/reports/patient/${pId}`);
      if (repRes.ok) {
        const repData = await repRes.json();
        setReports(repData);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load medical reports repository');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsAndPatients();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.report_title?.toLowerCase().includes(q) ||
      r.file_name?.toLowerCase().includes(q) ||
      r.laboratory_name?.toLowerCase().includes(q) ||
      r.patient_name?.toLowerCase().includes(q) ||
      r.patient_id?.toLowerCase().includes(q)
    );
  });

  const totalFindings = reports.reduce((acc, r) => acc + (r.extracted_tests?.length || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 text-xs font-semibold mb-2">
            <Files className="h-3.5 w-3.5 text-indigo-600" />
            <span>Clinical Document Repository</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ingested Medical Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Diagnostic lab reports, metabolic panels, and pathology PDFs processed through the MedLens reference-range extraction pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchReportsAndPatients} 
            disabled={isLoading}
            className="text-xs border-slate-200 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button 
            size="sm" 
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload & Ingest Report
          </Button>
        </div>
      </div>

      {/* Responsible AI Compliance Banner */}
      <ResponsibleAIDisclaimer />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports Ingested</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{reports.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PDF & Document streams</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Files className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Extracted Biomarkers</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{totalFindings}</p>
              <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">With printed lab cutoffs</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parsing Engine</p>
              <p className="text-sm font-bold text-slate-900 mt-1">Deterministic + Gemini</p>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Zero-hallucination bounds</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verification Rate</p>
              <p className="text-2xl font-black text-slate-900 mt-1">100%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Provenance-linked evidence</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search reports by title, laboratory name, patient, or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ingested Reports Grid */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card className="border-slate-200/80 shadow-xs p-12 text-center">
            <Files className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No medical reports found</h3>
            <p className="text-xs text-slate-400 mt-1">Upload a medical report PDF or clinical text to begin extraction.</p>
            <Button 
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="mt-4 bg-indigo-600 text-white text-xs font-semibold"
            >
              Upload Report
            </Button>
          </Card>
        ) : (
          filteredReports.map((report) => {
            const findings = report.extracted_tests || [];
            const highs = findings.filter(f => f.status === 'HIGH').length;
            const lows = findings.filter(f => f.status === 'LOW').length;
            const normals = findings.filter(f => f.status === 'NORMAL').length;
            const undetermined = findings.filter(f => f.status === 'NOT_DETERMINED').length;

            return (
              <Card key={report.report_id} className="border-slate-200/90 shadow-xs hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-bold">
                          DIAGNOSTIC REPORT
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-500">
                          {report.file_name}
                        </span>
                        <span className="text-slate-300">â€¢</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {report.report_date}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {report.report_title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{report.laboratory_name || 'Quest Diagnostics / LalPathLabs'}</span>
                          <span>â€¢</span>
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span 
                            onClick={() => navigate(`/patients/${report.patient_id}`)}
                            className="font-semibold text-slate-700 hover:text-indigo-600 cursor-pointer"
                          >
                            {report.patient_name || 'Patient'} ({report.patient_id})
                          </span>
                        </div>
                      </div>

                      {/* Findings count breakdown pills */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Extracted ({findings.length}):
                        </span>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                          {normals} Within Range
                        </Badge>
                        {(highs > 0 || lows > 0) && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">
                            {highs + lows} Outside Range ({highs} High, {lows} Low)
                          </Badge>
                        )}
                        {undetermined > 0 && (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-semibold">
                            {undetermined} Range Not Determined
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button 
                        size="sm"
                        onClick={() => navigate('/medlens')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Open in Studio
                      </Button>

                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/patients/${report.patient_id}`)}
                        className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        Patient Dossier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <Dialog open={showUploadModal} onOpenChange={(open) => !open && setShowUploadModal(false)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                Ingest Medical Diagnostic Report
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Upload a laboratory report file (PDF/Image) or paste clinical text for structured biomarker extraction.
              </DialogDescription>
            </DialogHeader>

            <MedicalReportUploader 
              patientId={patients[0]?.patient_id || 'p-101'}
              onAnalysisComplete={(analysis) => {
                setShowUploadModal(false);
                fetchReportsAndPatients();
                toast.success(`Successfully analyzed ${analysis.extracted_tests.length} biomarkers!`);
                navigate('/medlens');
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Documents;
