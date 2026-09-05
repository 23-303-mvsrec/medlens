import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  FileText, 
  ShieldAlert, 
  Clock, 
  Pill, 
  Heart, 
  RefreshCw,
  ExternalLink,
  Plus,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

import ResponsibleAIDisclaimer from '@/components/medlens/ResponsibleAIDisclaimer';
import ProvenanceTag from '@/components/medlens/ProvenanceTag';
import StructuredRecordTable from '@/components/medlens/StructuredRecordTable';
import ClinicalSummaryCard from '@/components/medlens/ClinicalSummaryCard';
import InconsistencyRadar from '@/components/medlens/InconsistencyRadar';
import ReferenceRangeBadge from '@/components/medlens/ReferenceRangeBadge';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const patientId = id || 'p-101';

  const [patient, setPatient] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatientDossier = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Patient Intake
      const patRes = await fetch(`http://127.0.0.1:8000/api/medlens/patients/${patientId}`);
      if (patRes.ok) {
        const pData = await patRes.json();
        setPatient(pData);
      } else {
        // Fallback default
        setPatient({
          patient_id: patientId,
          full_name: 'Eleanor Vance',
          age: 58,
          gender: 'Female',
          symptoms: ['Chronic fatigue', 'Increased thirst', 'Occasional blurred vision', 'Mild bilateral leg edema'],
          chronic_conditions: ['Essential Hypertension (Diagnosed 2019)'],
          allergies: ['Penicillin (Severe anaphylactoid rash)', 'Sulfa drugs'],
          current_medications: [
            { name: 'Amlodipine', dosage: '5mg once daily', frequency: 'Morning', source: 'Patient Self-Reported' },
            { name: 'Ibuprofen', dosage: '400mg PRN for joint pain', frequency: 'As needed', source: 'Patient Self-Reported' }
          ],
          provenance: 'PATIENT_PROVIDED',
          intake_date: '2026-09-05'
        });
      }

      // 2. Fetch Reports
      const repRes = await fetch(`http://127.0.0.1:8000/api/medlens/reports/patient/${patientId}`);
      if (repRes.ok) {
        const rData = await repRes.json();
        setReports(rData);
      }

      // 3. Fetch Review Items for this patient
      const revRes = await fetch(`http://127.0.0.1:8000/api/medlens/review-items?patient_id=${patientId}`);
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviewItems(revData);
      }

      // 4. Fetch Longitudinal Comparisons
      const compRes = await fetch(`http://127.0.0.1:8000/api/medlens/compare/${patientId}`);
      if (compRes.ok) {
        const cData = await compRes.json();
        setComparisons(cData);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patient clinical dossier');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDossier();
  }, [patientId]);

  const handleVerifyFinding = async (findingId: string, action: 'VERIFY' | 'EDIT' | 'REJECT', correctedVal?: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/medlens/findings/${findingId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding_id: findingId,
          action,
          corrected_value: correctedVal,
          reviewer_note: `Action ${action} taken by Dr. Eleanor Vance`
        })
      });

      if (res.ok) {
        toast.success(`Finding status successfully updated to ${action}`);
        fetchPatientDossier();
      } else {
        toast.error('Could not verify finding');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating finding verification');
    }
  };

  const activeReport = reports[0] || null;
  const extractedFindings = activeReport?.extracted_tests || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Back Nav & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/patients')} 
          className="text-slate-600 hover:text-slate-900 gap-1.5 w-fit -ml-2 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient Cohort
        </Button>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPatientDossier} 
            disabled={isLoading}
            className="text-xs border-slate-200 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button 
            size="sm" 
            onClick={() => navigate('/medlens')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 font-semibold shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open in MedLens Studio
          </Button>
        </div>
      </div>

      {/* Patient Header Banner */}
      <Card className="border-slate-200/90 shadow-xs bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight">{patient?.full_name || 'Eleanor Vance'}</h1>
                <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/40 text-[10px] font-mono">
                  {patient?.patient_id || patientId}
                </Badge>
                <ProvenanceTag source={patient?.provenance || 'PATIENT_PROVIDED'} />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span><strong className="text-white">Age:</strong> {patient?.age || 58} years</span>
                <span>•</span>
                <span><strong className="text-white">Gender:</strong> {patient?.gender || 'Female'}</span>
                <span>•</span>
                <span><strong className="text-white">Intake Date:</strong> {patient?.intake_date || '2026-09-05'}</span>
                <span>•</span>
                <span><strong className="text-white">Reports Ingested:</strong> {reports.length}</span>
              </div>
            </div>

            {/* Inconsistency Alert badge */}
            {reviewItems.length > 0 && (
              <div 
                onClick={() => navigate('/review')}
                className="bg-rose-500/20 border border-rose-400/40 rounded-xl p-3 cursor-pointer hover:bg-rose-500/30 transition-all flex items-center gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-rose-200">{reviewItems.length} Clinical Discrepancy Flag(s)</p>
                  <p className="text-[11px] text-rose-300/80 mt-0.5">Click to resolve in Review Center</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Responsible AI Compliance Banner */}
      <ResponsibleAIDisclaimer />

      {/* Dossier Tabs */}
      <Tabs defaultValue="findings" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
          <TabsTrigger value="findings" className="text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
            Extracted Lab Findings ({extractedFindings.length})
          </TabsTrigger>
          <TabsTrigger value="intake" className="text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
            Clinical Intake & History
          </TabsTrigger>
          <TabsTrigger value="discrepancies" className="text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
            Inconsistencies & Review ({reviewItems.length})
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
            Longitudinal Trends ({comparisons.length})
          </TabsTrigger>
          <TabsTrigger value="summary" className="text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
            Patient Plain Summary
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Extracted Lab Findings */}
        <TabsContent value="findings" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Structured Laboratory Findings</h3>
              <p className="text-xs text-slate-500">
                Biomarkers parsed with printed source reference ranges and human verification actions.
              </p>
            </div>
            {activeReport && (
              <Badge variant="outline" className="text-[10px] font-mono border-slate-200">
                Source Document: {activeReport.file_name}
              </Badge>
            )}
          </div>

          <StructuredRecordTable 
            findings={extractedFindings}
            onVerifyFinding={handleVerifyFinding}
          />
        </TabsContent>

        {/* Tab 2: Clinical Intake Profile */}
        <TabsContent value="intake" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Col: Symptoms & Conditions */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Chief Complaints & Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {patient?.symptoms?.map((sym: string, idx: number) => (
                    <span key={idx} className="text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100 px-3 py-1 rounded-lg">
                      {sym}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Documented Chronic Conditions:
                  </span>
                  <div className="space-y-1.5">
                    {patient?.chronic_conditions?.map((cond: string, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200/80">
                        {cond}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Col: Allergies & Medications */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Reported Drug Allergies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {patient?.allergies?.map((allergy: string, idx: number) => (
                    <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center justify-between">
                      <span className="font-bold text-rose-900">{allergy}</span>
                      <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[9px] font-bold">
                        CONTRAINDICATION RISK
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Current Active Medications:
                  </span>
                  <div className="space-y-2">
                    {patient?.current_medications?.map((med: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{med.name} ({med.dosage})</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{med.frequency || 'Daily'} • Source: {med.source || 'Patient'}</p>
                        </div>
                        <Pill className="w-4 h-4 text-indigo-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Inconsistencies & Review Items */}
        <TabsContent value="discrepancies" className="space-y-4">
          <InconsistencyRadar 
            items={reviewItems}
            onOpenReviewCenter={() => navigate('/review')}
          />
        </TabsContent>

        {/* Tab 4: Longitudinal Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Serial Encounter Comparisons ($\Delta$)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Biomarker changes tracked across consecutive diagnostic encounters.
                  </CardDescription>
                </div>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/trends')}
                  className="text-xs text-indigo-600 hover:bg-indigo-50 font-semibold gap-1"
                >
                  Dedicated Trends Page <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Biomarker</th>
                      <th className="py-3 px-4">Baseline (June 2026)</th>
                      <th className="py-3 px-4">Current (Sept 2026)</th>
                      <th className="py-3 px-4 text-center">Encounter Delta</th>
                      <th className="py-3 px-4">Clinical Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisons.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.test_name}</td>
                        <td className="py-3 px-4 font-mono">{c.previous_val} {c.unit}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.current_val} {c.unit}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                            c.delta > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {c.delta > 0 ? `+${c.delta}` : c.delta} {c.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">{c.note || 'Encounter change noted'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Patient-Friendly Summary */}
        <TabsContent value="summary" className="space-y-4">
          <ClinicalSummaryCard 
            patientName={patient?.full_name || 'Eleanor Vance'}
            summary={activeReport?.plain_summary || 'This patient record reflects clinical evaluations across multiple encounters.'}
            keyFindings={activeReport?.key_findings || []}
            questionsForDoctor={activeReport?.questions_for_doctor || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetail;
