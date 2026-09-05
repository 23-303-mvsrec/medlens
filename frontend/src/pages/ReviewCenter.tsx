import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  Filter, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  FileText, 
  User, 
  Clock, 
  AlertCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ResponsibleAIDisclaimer from '@/components/medlens/ResponsibleAIDisclaimer';

interface ReviewItem {
  id: string;
  patient_id: string;
  patient_name?: string;
  finding_id?: string;
  finding_name?: string;
  type?: string;
  issue_type?: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'WARNING' | 'INFO';
  title?: string;
  description: string;
  sources?: string[];
  status?: string;
  resolved?: boolean;
  resolution_note?: string;
  created_at: string;
  resolved_at?: string;
}

const ReviewCenter = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'UNRESOLVED' | 'RESOLVED' | 'ALL'>('UNRESOLVED');

  // Modal State for resolving an item
  const [resolvingItem, setResolvingItem] = useState<ReviewItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviewItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/medlens/review-items');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        toast.error('Failed to load review items');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error connecting to MedLens Review Center');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewItems();
  }, []);

  const handleOpenResolveModal = (item: ReviewItem) => {
    setResolvingItem(item);
    setResolutionNote('');
  };

  const handleConfirmResolve = async () => {
    if (!resolvingItem) return;
    if (!resolutionNote.trim()) {
      toast.error('Please provide clinical reasoning or action notes to resolve this issue');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/medlens/review-items/${resolvingItem.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_item_id: resolvingItem.id,
          resolution_note: resolutionNote.trim(),
          resolved_by: 'Dr. Eleanor Vance (Clinical Reviewer)'
        })
      });

      if (res.ok) {
        toast.success(`Discrepancy '${resolvingItem.title || resolvingItem.id}' resolved successfully`);
        setResolvingItem(null);
        fetchReviewItems();
      } else {
        const errData = await res.json();
        toast.error(errData.detail || 'Could not resolve review item');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit resolution note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const isResolved = item.status === 'RESOLVED' || item.resolved === true;
    if (statusFilter === 'UNRESOLVED' && isResolved) return false;
    if (statusFilter === 'RESOLVED' && !isResolved) return false;

    const itemSev = (item.severity || 'INFO').toUpperCase();
    if (selectedSeverity !== 'ALL') {
      if (selectedSeverity === 'HIGH' && itemSev !== 'HIGH') return false;
      if (selectedSeverity === 'MEDIUM' && itemSev !== 'MEDIUM' && itemSev !== 'WARNING') return false;
      if (selectedSeverity === 'LOW' && itemSev !== 'LOW' && itemSev !== 'INFO') return false;
    }

    const itemType = (item.type || item.issue_type || '').toUpperCase();
    if (selectedType !== 'ALL') {
      if (selectedType === 'CONFLICT' && !itemType.includes('CONFLICT')) return false;
      if (selectedType === 'MISSING_RANGE' && !itemType.includes('RANGE')) return false;
      if (selectedType === 'UNVERIFIED' && !itemType.includes('UNVERIFIED')) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${item.title || ''} ${item.description} ${item.patient_name || ''} ${item.patient_id} ${item.finding_name || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  const pendingCount = items.filter(i => i.status !== 'RESOLVED' && !i.resolved).length;
  const highSevCount = items.filter(i => (i.severity === 'HIGH') && i.status !== 'RESOLVED').length;
  const missingRangeCount = items.filter(i => (i.type?.includes('RANGE') || i.issue_type?.includes('RANGE')) && i.status !== 'RESOLVED').length;
  const resolvedCount = items.filter(i => i.status === 'RESOLVED' || i.resolved).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-100 text-xs font-semibold mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span>Clinical Verification & Quality Hub</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Review Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reconcile contradictions between patient intake, cross-reference lab findings, and sign-off on out-of-range biomarkers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchReviewItems} 
            disabled={isLoading}
            className="text-xs border-slate-200 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Queue
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

      {/* Responsible AI Banner */}
      <ResponsibleAIDisclaimer />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unresolved Issues</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">High Severity Alerts</p>
              <p className="text-2xl font-black text-rose-700 mt-1">{highSevCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missing Reference Ranges</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{missingRangeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Clinician Resolved</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by biomarker, issue title, patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Status Toggle */}
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
                <button
                  onClick={() => setStatusFilter('UNRESOLVED')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    statusFilter === 'UNRESOLVED' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Unresolved ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter('RESOLVED')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    statusFilter === 'RESOLVED' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Resolved ({resolvedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
              </div>

              {/* Severity Filter */}
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>

              {/* Issue Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Issue Types</option>
                <option value="CONFLICT">Cross-Check Conflicts</option>
                <option value="MISSING_RANGE">Missing Reference Ranges</option>
                <option value="UNVERIFIED">Awaiting Verification</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card className="border-slate-200/80 shadow-xs p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-90" />
            <h3 className="text-base font-bold text-slate-900">No review items match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              All clinical records, medication histories, and laboratory findings are verified or align within tolerance parameters.
            </p>
          </Card>
        ) : (
          filteredItems.map((item) => {
            const isResolved = item.status === 'RESOLVED' || item.resolved === true;
            const itemSev = (item.severity || 'INFO').toUpperCase();
            const isHigh = itemSev === 'HIGH';
            const isMedium = itemSev === 'MEDIUM' || itemSev === 'WARNING';

            return (
              <Card 
                key={item.id}
                className={`border transition-all ${
                  isResolved 
                    ? 'border-slate-200 bg-slate-50/40 opacity-80' 
                    : isHigh 
                      ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300' 
                      : isMedium
                        ? 'border-amber-200 bg-amber-50/15 hover:border-amber-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                } shadow-xs`}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Severity Badge */}
                        <Badge 
                          variant="outline"
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                            isHigh
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : isMedium
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {itemSev} SEVERITY
                        </Badge>

                        {/* Issue Type Badge */}
                        <Badge 
                          variant="outline"
                          className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-100"
                        >
                          {item.type || item.issue_type || 'CLINICAL_DISCREPANCY'}
                        </Badge>

                        {/* Patient Link */}
                        <span 
                          onClick={() => navigate(`/patients/${item.patient_id}`)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer bg-slate-100 hover:bg-indigo-50 px-2 py-0.5 rounded-md transition-colors"
                        >
                          <User className="w-3 h-3 text-slate-400" />
                          {item.patient_name || 'Patient'} ({item.patient_id})
                        </span>

                        {/* Status Badge */}
                        {isResolved ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold gap-1">
                            <Check className="w-3 h-3 text-emerald-700" /> RESOLVED
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold gap-1">
                            <Clock className="w-3 h-3 text-amber-700" /> ACTION REQUIRED
                          </Badge>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.title || item.finding_name || 'Clinical Finding Discrepancy'}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Evidence Sources */}
                      {item.sources && item.sources.length > 0 && (
                        <div className="pt-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Cross-Referenced Evidence Sources:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.sources.map((src, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center gap-1 text-[10px] font-mono bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-2xs"
                              >
                                <FileText className="w-2.5 h-2.5 text-indigo-500" />
                                {src}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resolution Note if resolved */}
                      {isResolved && item.resolution_note && (
                        <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950">
                          <p className="font-bold flex items-center gap-1.5 text-emerald-900 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Clinician Resolution Note:
                          </p>
                          <p className="text-emerald-800 mt-0.5 leading-relaxed italic">
                            "{item.resolution_note}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col items-center gap-2 shrink-0 self-end md:self-start">
                      {!isResolved && (
                        <Button 
                          size="sm"
                          onClick={() => handleOpenResolveModal(item)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Resolve Issue
                        </Button>
                      )}

                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/medlens')}
                        className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        Studio
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Clinician Resolution Modal */}
      {resolvingItem && (
        <Dialog open={!!resolvingItem} onOpenChange={(open) => !open && setResolvingItem(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                <Check className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Resolve Clinical Discrepancy
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Record your clinical reasoning, patient consultation decision, or reconciliation rationale for the clinical audit trail.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <p className="font-bold text-slate-800">
                  {resolvingItem.title || resolvingItem.finding_name || 'Discrepancy Issue'}
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {resolvingItem.description}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Clinical Action & Reconciliation Note <span className="text-rose-500">*</span>
                </label>
                <Textarea 
                  placeholder="e.g. Advised patient to discontinue OTC Ibuprofen; scheduled follow-up comprehensive renal panel in 14 days; notified attending physician."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={4}
                  className="text-xs"
                />
              </div>

              <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  This resolution will be permanently entered into the immutable clinical timeline and marked as reviewed by Dr. Eleanor Vance.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setResolvingItem(null)} 
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleConfirmResolve} 
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
              >
                {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReviewCenter;
