import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Files, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp, 
  ShieldAlert, 
  FileText, 
  Eye, 
  ArrowRight,
  RefreshCw,
  Clock,
  Check,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ResponsibleAIDisclaimer from '@/components/medlens/ResponsibleAIDisclaimer';
import PatientIntakeModal from '@/components/medlens/PatientIntakeModal';

interface DashboardStats {
  total_patients: number;
  total_reports: number;
  total_findings: number;
  needs_review: number;
  within_provided_range: number;
  outside_provided_range: number;
  not_determined: number;
  verified_findings: number;
  recent_activity: any[];
}

interface ReviewItem {
  id: string;
  patient_id: string;
  finding_id?: string;
  finding_name?: string;
  issue_type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  created_at: string;
  resolved: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch real stats
      const statsRes = await fetch('http://127.0.0.1:8000/api/medlens/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch pending review items
      const reviewRes = await fetch('http://127.0.0.1:8000/api/medlens/review-items');
      if (reviewRes.ok) {
        const items = await reviewRes.json();
        setReviewItems(items);
      }

      // 3. Fetch patients
      const patRes = await fetch('http://127.0.0.1:8000/api/medlens/patients');
      if (patRes.ok) {
        const patData = await patRes.json();
        setPatients(patData);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      toast.error('Unable to fetch live dashboard telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalEvaluated = (stats?.within_provided_range || 0) + (stats?.outside_provided_range || 0) + (stats?.not_determined || 0);
  const withinPct = totalEvaluated ? Math.round(((stats?.within_provided_range || 0) / totalEvaluated) * 100) : 0;
  const outsidePct = totalEvaluated ? Math.round(((stats?.outside_provided_range || 0) / totalEvaluated) * 100) : 0;
  const notDetPct = totalEvaluated ? Math.round(((stats?.not_determined || 0) / totalEvaluated) * 100) : 0;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const item = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>MedLens Clinical Intelligence Command Center</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Overview & Quality Radar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry on patient records, report extractions, reference range evaluations, and clinical inconsistencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardData} 
            disabled={isLoading}
            className="text-xs border-slate-200 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button 
            size="sm" 
            onClick={() => setShowIntakeModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5 shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            + New Patient Intake
          </Button>

          <Button 
            size="sm" 
            onClick={() => navigate('/medlens')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open MedLens Studio
          </Button>
        </div>
      </div>

      {/* Responsible AI Compliance Banner */}
      <ResponsibleAIDisclaimer />

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Patients */}
        <motion.div variants={item}>
          <Card className="border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patients In System</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{stats?.total_patients ?? 0}</span>
                <span className="text-xs text-slate-400 font-medium">with clinical intake</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Intake status</span>
                <span className="font-semibold text-emerald-600">100% Captured</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2. Ingested Reports */}
        <motion.div variants={item}>
          <Card className="border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingested Reports</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Files className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{stats?.total_reports ?? 0}</span>
                <span className="text-xs text-slate-400 font-medium">processed</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>OCR / Parsing fidelity</span>
                <span className="font-semibold text-indigo-600">Deterministic</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Structured Findings */}
        <motion.div variants={item}>
          <Card className="border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Structured Findings</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{stats?.total_findings ?? 0}</span>
                <span className="text-xs text-slate-400 font-medium">biomarkers extracted</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Verified by clinician</span>
                <span className="font-semibold text-emerald-600">{stats?.verified_findings ?? 0} verified</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 4. Quality Review Items */}
        <motion.div variants={item}>
          <Card className="border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requires Review</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-600">{stats?.needs_review ?? 0}</span>
                <span className="text-xs text-slate-400 font-medium">clinical discrepancies</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Action required</span>
                <button 
                  onClick={() => navigate('/review')} 
                  className="font-semibold text-rose-600 hover:underline flex items-center gap-0.5"
                >
                  Review Center <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Grid: Reference Range Breakdown + Clinical Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Reference Range Distribution & Quality Bar */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Source Reference Range Audit
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Deterministic range classification based strictly on document-printed cutoffs.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-slate-200 bg-slate-50">
                  {totalEvaluated} Total Data Points
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Stacked Percentage Bar */}
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  style={{ width: `${withinPct}%` }} 
                  className="bg-emerald-500 hover:opacity-90 transition-all"
                  title={`Within Range: ${withinPct}%`}
                />
                <div 
                  style={{ width: `${outsidePct}%` }} 
                  className="bg-amber-500 hover:opacity-90 transition-all"
                  title={`Outside Range: ${outsidePct}%`}
                />
                <div 
                  style={{ width: `${notDetPct}%` }} 
                  className="bg-slate-400 hover:opacity-90 transition-all"
                  title={`Range Not Determined: ${notDetPct}%`}
                />
              </div>

              {/* Range Legend Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100/80">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Within Reference Range
                  </div>
                  <div className="text-2xl font-black text-emerald-900">{stats?.within_provided_range ?? 0}</div>
                  <p className="text-[11px] text-emerald-700/80 mt-1">
                    {withinPct}% of findings within source lab limits
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100/80">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Outside Reference Range
                  </div>
                  <div className="text-2xl font-black text-amber-900">{stats?.outside_provided_range ?? 0}</div>
                  <p className="text-[11px] text-amber-700/80 mt-1">
                    {outsidePct}% marked HIGH or LOW by lab
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs mb-1">
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                    Range Not Determined
                  </div>
                  <div className="text-2xl font-black text-slate-800">{stats?.not_determined ?? 0}</div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {notDetPct}% missing source limits (never invented)
                  </p>
                </div>
              </div>

              {/* Clinical Guardrail Explanation */}
              <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Zero-Hallucination Policy: </span>
                  MedLens strictly parses the printed intervals (e.g. 70–99 mg/dL or &lt; 200 mg/dL) from the original report. 
                  When a report omits reference intervals, MedLens labels it <span className="font-semibold text-slate-700">NOT_DETERMINED</span> rather than generating arbitrary cutoffs.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Inconsistency Radar (Unresolved Issues Preview) */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Clinical Inconsistency Radar
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Cross-referenced conflicts between intake notes, allergy history, and laboratory reports.
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/review')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1 font-semibold"
                >
                  View All ({reviewItems.length}) <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {reviewItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700">No active clinical inconsistencies</p>
                  <p className="text-slate-400 mt-0.5">All ingested reports match patient intake profile without safety alerts.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviewItems.slice(0, 3).map((item) => (
                    <div 
                      key={item.id}
                      className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/30 flex items-start justify-between gap-3 hover:bg-rose-50/50 transition-colors"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 ${
                              item.severity === 'HIGH' 
                                ? 'bg-rose-100 text-rose-700 border-rose-200' 
                                : item.severity === 'MEDIUM' 
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-blue-100 text-blue-700 border-blue-200'
                            }`}
                          >
                            {item.severity} SEVERITY
                          </Badge>
                          <span className="font-semibold text-slate-800">{item.finding_name || item.issue_type}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{item.description}</p>
                      </div>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => navigate('/review')}
                        className="text-xs shrink-0 border-rose-200 text-rose-700 hover:bg-rose-100/60"
                      >
                        Inspect
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Quick Actions, Active Patients & Studio Launcher */}
        <div className="space-y-6">
          {/* MedLens Studio Highlight Card */}
          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">MedLens Studio</h3>
                  <p className="text-xs text-indigo-200">Side-by-Side Clinical Reviewer</p>
                </div>
              </div>

              <p className="text-xs text-indigo-100/80 leading-relaxed">
                Review source medical documents directly adjacent to AI-extracted structured records. Verify, edit, or reject values with instant visual provenance.
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <Button 
                  onClick={() => navigate('/medlens')}
                  className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Launch Clinical Studio
                </Button>

                <Button 
                  onClick={() => navigate('/trends')}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 font-medium text-xs gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-300" />
                  View Biomarker Trends
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Registered Patients Dossiers */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">Active Patient Cohort</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Patients undergoing clinical review</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/patients')}
                  className="text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                >
                  All ({patients.length})
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {patients.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  No patients registered yet.
                </div>
              ) : (
                patients.slice(0, 3).map((pat) => (
                  <div 
                    key={pat.patient_id}
                    onClick={() => navigate(`/patients/${pat.patient_id}`)}
                    className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{pat.full_name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {pat.age}y • {pat.gender} • ID: <span className="font-mono">{pat.patient_id}</span>
                      </p>
                      {pat.allergies && pat.allergies.length > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-[10px] px-1.5 py-0.2 bg-rose-50 text-rose-700 font-semibold rounded-md border border-rose-100">
                            {pat.allergies.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))
              )}

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowIntakeModal(true)}
                className="w-full text-xs border-dashed border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                + Register New Patient Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Patient Intake Modal */}
      {showIntakeModal && (
        <PatientIntakeModal 
          isOpen={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          onSuccess={() => {
            setShowIntakeModal(false);
            fetchDashboardData();
            toast.success('Patient intake profile recorded successfully');
          }}
        />
      )}
    </motion.div>
  );
};

export default Dashboard;
