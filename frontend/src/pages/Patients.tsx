import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Sparkles, 
  Filter, 
  ShieldAlert, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ArrowRight,
  Pill,
  HeartPulse
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ResponsibleAIDisclaimer from '@/components/medlens/ResponsibleAIDisclaimer';
import PatientIntakeModal from '@/components/medlens/PatientIntakeModal';
import ProvenanceTag from '@/components/medlens/ProvenanceTag';

interface Patient {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  symptoms?: string[];
  chronic_conditions?: string[];
  allergies?: string[];
  current_medications?: any[];
  provenance?: string;
  intake_date?: string;
}

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/medlens/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      } else {
        toast.error('Failed to load patient records');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error connecting to patient registry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = p.full_name?.toLowerCase().includes(q);
    const matchId = p.patient_id?.toLowerCase().includes(q);
    const matchAllergies = p.allergies?.some(a => a.toLowerCase().includes(q));
    const matchConditions = p.chronic_conditions?.some(c => c.toLowerCase().includes(q));
    const matchSymptoms = p.symptoms?.some(s => s.toLowerCase().includes(q));
    return matchName || matchId || matchAllergies || matchConditions || matchSymptoms;
  });

  const totalPatients = patients.length;
  const totalAllergies = patients.reduce((acc, p) => acc + (p.allergies?.length || 0), 0);
  const totalMeds = patients.reduce((acc, p) => acc + (p.current_medications?.length || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 text-xs font-semibold mb-2">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <span>Patient Intake & Clinical Registry</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patient Clinical Dossiers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Canonical patient-provided intake records, baseline symptom histories, drug allergies, and active medication regimens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPatients} 
            disabled={isLoading}
            className="text-xs border-slate-200 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button 
            size="sm" 
            onClick={() => setShowIntakeModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Patient Intake
          </Button>
        </div>
      </div>

      {/* Responsible AI Compliance Banner */}
      <ResponsibleAIDisclaimer />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinical Cohort</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalPatients}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Active under review</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Documented Allergies</p>
              <p className="text-2xl font-black text-rose-700 mt-1">{totalAllergies}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cross-checked vs reports</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Regimens</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalMeds}</p>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Reported medications</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Intake Integrity</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">100%</p>
              <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Traceable provenance</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by patient name, ID, symptom, allergy, or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPatients.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No matching patients found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or create a new patient intake record.</p>
          </div>
        ) : (
          filteredPatients.map((pat) => (
            <Card 
              key={pat.patient_id}
              className="border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-4">
                {/* Header: Name, Age, ID, Provenance */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      {pat.full_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{pat.age} years old</span>
                      <span>•</span>
                      <span>{pat.gender}</span>
                      <span>•</span>
                      <span className="font-mono font-semibold text-slate-700">ID: {pat.patient_id}</span>
                    </div>
                  </div>

                  <ProvenanceTag source={pat.provenance || 'PATIENT_PROVIDED'} />
                </div>

                {/* Chronic Conditions */}
                {pat.chronic_conditions && pat.chronic_conditions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Chronic Medical Conditions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pat.chronic_conditions.map((c, i) => (
                        <span key={i} className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergies Highlight */}
                {pat.allergies && pat.allergies.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
                      Reported Drug Allergies:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pat.allergies.map((a, i) => (
                        <span key={i} className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-md">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symptoms */}
                {pat.symptoms && pat.symptoms.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Presenting Symptoms:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {pat.symptoms.map((s, i) => (
                        <span key={i} className="text-[10px] bg-blue-50/70 text-blue-700 px-2 py-0.5 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medications count & intake date */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Pill className="w-3.5 h-3.5 text-indigo-500" />
                    {pat.current_medications?.length || 0} active medication(s)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Intake: {pat.intake_date || '2026-09-05'}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <Button 
                    size="sm"
                    onClick={() => navigate(`/patients/${pat.patient_id}`)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Clinical Dossier
                  </Button>

                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/medlens')}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Studio Ingestion
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Patient Intake Modal */}
      {showIntakeModal && (
        <PatientIntakeModal 
          isOpen={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          onSuccess={() => {
            setShowIntakeModal(false);
            fetchPatients();
            toast.success('New patient profile recorded in MedLens registry');
          }}
        />
      )}
    </div>
  );
};

export default Patients;
