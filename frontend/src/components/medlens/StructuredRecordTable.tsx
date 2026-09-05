import React, { useState } from 'react';
import { Search, Filter, Check, Edit2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { LabTestItem } from '@/types/medlens';
import { ReferenceRangeBadge } from './ReferenceRangeBadge';
import { ProvenanceTag } from './ProvenanceTag';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Props {
  tests: LabTestItem[];
  onVerifyTest?: (testId: string, correctedValue?: string, correctedStatus?: 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN') => void;
}

export const StructuredRecordTable: React.FC<Props> = ({ tests, onVerifyTest }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Inline editing modal state
  const [editingTest, setEditingTest] = useState<LabTestItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editStatus, setEditStatus] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN'>('NORMAL');

  const categories = ['ALL', ...Array.from(new Set(tests.map(t => t.category)))];

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          test.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || test.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || test.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenEdit = (test: LabTestItem) => {
    setEditingTest(test);
    setEditValue(test.value);
    setEditStatus(test.status);
  };

  const handleSaveEdit = () => {
    if (!editingTest) return;
    if (onVerifyTest) {
      onVerifyTest(editingTest.id, editValue, editStatus);
    }
    toast.success(`Updated ${editingTest.test_name} and marked as verified`);
    setEditingTest(null);
  };

  const handleQuickVerify = (testId: string) => {
    if (onVerifyTest) {
      onVerifyTest(testId);
    }
    toast.success('Laboratory test value verified by clinical reviewer');
  };

  return (
    <div className="space-y-3">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <Input 
            placeholder="Search test marker (e.g. Glucose, Creatinine)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white font-semibold' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Status:</span>
          {['ALL', 'HIGH', 'LOW', 'NORMAL'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedStatus === status 
                  ? 'bg-slate-900 text-white font-semibold' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="text-xs font-bold text-slate-700 py-2.5">Test Marker</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 py-2.5">Category</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 py-2.5">Extracted Value</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 py-2.5">Reference Range (Report)</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 py-2.5">Clinical Status</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 py-2.5">Data Provenance</TableHead>
              <TableHead className="text-xs font-bold text-slate-700 py-2.5 text-right">Human Verification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-400">
                  No matching laboratory test markers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTests.map((test) => (
                <TableRow key={test.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="py-2.5 font-semibold text-xs text-slate-900">
                    {test.test_name}
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-slate-500">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                      {test.category}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs font-bold font-mono text-slate-900">
                    {test.value} <span className="font-normal text-slate-500">{test.unit}</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs font-mono text-slate-600">
                    {test.reference_range} {test.unit}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <ReferenceRangeBadge 
                      status={test.status} 
                      reason={test.status_reason}
                      range={test.reference_range}
                    />
                  </TableCell>
                  <TableCell className="py-2.5">
                    <ProvenanceTag 
                      source={test.provenance} 
                      confidence={test.confidence} 
                      isVerified={test.is_verified}
                    />
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!test.is_verified ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleQuickVerify(test.id)}
                          className="h-7 px-2 text-[11px] text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1"
                          title="Verify this AI extraction"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          Verify
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Approved
                        </span>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleOpenEdit(test)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                        title="Edit extracted value"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingTest && (
        <Dialog open={!!editingTest} onOpenChange={() => setEditingTest(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">
                Edit & Verify: {editingTest.test_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div>
                <Label className="text-[11px] text-slate-500">Corrected Value ({editingTest.unit})</Label>
                <Input 
                  value={editValue} 
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-8 text-xs mt-1" 
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-500">Reference Range in Report</Label>
                <div className="p-2 bg-slate-100 rounded text-xs font-mono text-slate-700 mt-1">
                  {editingTest.reference_range} {editingTest.unit}
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-slate-500">Verified Clinical Status</Label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {(['NORMAL', 'HIGH', 'LOW', 'UNKNOWN'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`p-1.5 rounded text-xs font-semibold border ${
                        editStatus === st ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingTest(null)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                Save & Verify
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StructuredRecordTable;
