import { API_BASE } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight, 
  ArrowUpRight, 
  Calendar, 
  Activity, 
  FileText, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  Filter, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ResponsibleAIDisclaimer from '@/components/medlens/ResponsibleAIDisclaimer';
import ReferenceRangeBadge from '@/components/medlens/ReferenceRangeBadge';

interface BiomarkerDelta {
  test_name: string;
  category: string;
  unit: string;
  reference_range?: string;
  previous_val: number;
  previous_status: string;
  previous_date: string;
  previous_source: string;
  current_val: number;
  current_status: string;
  current_date: string;
  current_source: string;
  delta: number;
  delta_percent: number;
  trend: 'up' | 'down' | 'stable';
  note?: string;
}

interface TimelineEvent {
  id: string;
  patient_id: string;
  event_type: string;
  title: string;
  description: string;
  timestamp: string;
  source: string;
}

const BiomarkerTrends = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('p-101');
  const [comparisons, setComparisons] = useState<BiomarkerDelta[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const fetchPatientsList = async () => {
    try {
      const res = await fetch(`${API_BASE}/medlens/patients`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        if (data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(data[0].patient_id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrendsData = async (patientId: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch biomarker comparisons
      const compRes = await fetch(`http://127.0.0.1:8000/api/medlens/compare/${patientId}`);
      if (compRes.ok) {
        const compData = await compRes.json();
        setComparisons(compData);
      }

      // 2. Fetch timeline
      const timeRes = await fetch(`http://127.0.0.1:8000/api/medlens/timeline/${patientId}`);
      if (timeRes.ok) {
        const timeData = await timeRes.json();
        setTimelineEvents(timeData);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load longitudinal comparison data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsList();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchTrendsData(selectedPatientId);
    }
  }, [selectedPatientId]);

  const activePatient = patients.find(p => p.patient_id === selectedPatientId) || {
    full_name: 'Eleanor Vance',
    age: 58,
    gender: 'Female',
    patient_id: 'p-101'
  };

  const categories = Array.from(new Set(comparisons.map(c => c.category)));
  const filteredComparisons = categoryFilter === 'ALL' 
    ? comparisons 
    : comparisons.filter(c => c.category === categoryFilter);

  // Compute metrics
  const totalTracked = comparisons.length;
  const elevatedCurrent = comparisons.filter(c => c.current_status === 'HIGH').length;
  const improvedCount = comparisons.filter(c => {
    // For glucose, HbA1c, creatinine, cholesterol, a decrease is improvement
    if (['Fasting Blood Glucose', 'Glycated Hemoglobin (HbA1c)', 'Total Cholesterol'].includes(c.test_name)) {
      return c.delta < 0;
    }
    return c.trend === 'stable' || (c.test_name === 'Hemoglobin (Hb)' && c.delta > 0);
  }).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 text-xs font-semibold mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
            <span>Longitudinal Encounter Comparison Engine</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Biomarker Trajectory & Deltas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare lab values across serial clinical encounters with strict mathematical deltas ($\Delta$) and document provenance.
          </p>
        </div>

        {/* Patient Switcher & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs text-slate-500 font-medium">Patient:</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {patients.length > 0 ? (
                patients.map(p => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.full_name} ({p.patient_id})
                  </option>
                ))
              ) : (
                <option value="p-101">Eleanor Vance (p-101)</option>
              )}
            </select>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchTrendsData(selectedPatientId)} 
            disabled={isLoading}
            className="text-xs border-slate-200 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Responsible AI Compliance Banner */}
      <ResponsibleAIDisclaimer />

      {/* Top Clinical Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Dossier</p>
              <p className="text-base font-bold text-slate-900 mt-1">{activePatient.full_name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{activePatient.age}y â€¢ {activePatient.gender} â€¢ ID: {activePatient.patient_id}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracked Biomarkers</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalTracked}</p>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Matched across 2 encounters</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Elevated Currently</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{elevatedCurrent}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Exceeding source cutoffs</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Favorable Trend / Stable</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{improvedCount}</p>
              <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Delta trending towards norm</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Longitudinal Comparison Table */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Encounter-to-Encounter Marker Matrix
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Baseline (June 15, 2026) vs Current (September 05, 2026) verified lab determinations.
              </CardDescription>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Panel:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Panels</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Biomarker / Panel</th>
                  <th className="py-3 px-4">Lab Reference Range</th>
                  <th className="py-3 px-4">Baseline Encounter</th>
                  <th className="py-3 px-4">Current Encounter</th>
                  <th className="py-3 px-4 text-center">Encounter Delta ($\Delta$)</th>
                  <th className="py-3 px-4">Mathematical Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComparisons.map((comp, idx) => {
                  const isUp = comp.delta > 0;
                  const isDown = comp.delta < 0;
                  const isStable = comp.delta === 0;

                  // Determine favorable vs unfavorable
                  // For glucose, HbA1c, cholesterol: down is favorable
                  // For creatinine: up is unfavorable
                  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (comp.test_name.includes('Creatinine')) {
                    badgeColor = isUp 
                      ? 'bg-rose-100 text-rose-800 border-rose-200' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  } else if (['Fasting Blood Glucose', 'Glycated Hemoglobin (HbA1c)', 'Total Cholesterol'].includes(comp.test_name)) {
                    badgeColor = isDown 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : 'bg-rose-100 text-rose-800 border-rose-200';
                  } else {
                    badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      {/* Biomarker Name & Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{comp.test_name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{comp.category}</div>
                      </td>

                      {/* Printed Reference Range */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-700 font-medium">
                          {comp.reference_range || 'NOT DETERMINED'}
                        </div>
                        <div className="text-[10px] text-slate-400">{comp.unit}</div>
                      </td>

                      {/* Previous Value */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">{comp.previous_val}</span>
                          <span className="text-slate-500">{comp.unit}</span>
                          <ReferenceRangeBadge status={comp.previous_status} />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {comp.previous_date}
                        </div>
                      </td>

                      {/* Current Value */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">{comp.current_val}</span>
                          <span className="text-slate-500">{comp.unit}</span>
                          <ReferenceRangeBadge status={comp.current_status} />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {comp.current_date}
                        </div>
                      </td>

                      {/* Delta */}
                      <td className="py-3.5 px-4 text-center">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono font-bold text-xs ${badgeColor}`}>
                          {isUp && <TrendingUp className="w-3.5 h-3.5" />}
                          {isDown && <TrendingDown className="w-3.5 h-3.5" />}
                          {isStable && <Minus className="w-3.5 h-3.5" />}
                          <span>
                            {comp.delta > 0 ? `+${comp.delta}` : comp.delta} {comp.unit}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ({comp.delta_percent > 0 ? `+${comp.delta_percent}%` : `${comp.delta_percent}%`})
                        </div>
                      </td>

                      {/* Mathematical Note */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {comp.note || `${comp.test_name} shifted from ${comp.previous_val} to ${comp.current_val} ${comp.unit}.`}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Patient Clinical Audit Timeline */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Chronological Encounter & Audit Trail
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Immutable log of patient intake, report ingestions, verified determinations, and reviewer interventions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {timelineEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No historical events recorded for this patient yet.
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-indigo-100 space-y-6 my-2">
              {timelineEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="relative group">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center group-hover:scale-125 transition-transform">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{evt.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{evt.description}</p>

                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-mono border-slate-200 bg-slate-50 text-slate-600">
                      Source: {evt.source}
                    </Badge>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      {evt.event_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BiomarkerTrends;
