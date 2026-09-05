import React, { useState } from 'react';
import { User, Activity, AlertOctagon, Pill, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PatientIntake, MedicationItem } from '@/types/medlens';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialIntake: PatientIntake;
  onSave: (updatedIntake: PatientIntake) => void;
}

export const PatientIntakeModal: React.FC<Props> = ({ isOpen, onClose, initialIntake, onSave }) => {
  const [formData, setFormData] = useState<PatientIntake>(initialIntake);
  const [newSymptom, setNewSymptom] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');

  const handleAddSymptom = () => {
    if (!newSymptom.trim()) return;
    setFormData(prev => ({ ...prev, symptoms: [...prev.symptoms, newSymptom.trim()] }));
    setNewSymptom('');
  };

  const handleRemoveSymptom = (index: number) => {
    setFormData(prev => ({ ...prev, symptoms: prev.symptoms.filter((_, i) => i !== index) }));
  };

  const handleAddCondition = () => {
    if (!newCondition.trim()) return;
    setFormData(prev => ({ ...prev, chronic_conditions: [...prev.chronic_conditions, newCondition.trim()] }));
    setNewCondition('');
  };

  const handleRemoveCondition = (index: number) => {
    setFormData(prev => ({ ...prev, chronic_conditions: prev.chronic_conditions.filter((_, i) => i !== index) }));
  };

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    setFormData(prev => ({ ...prev, allergies: [...prev.allergies, newAllergy.trim()] }));
    setNewAllergy('');
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData(prev => ({ ...prev, allergies: prev.allergies.filter((_, i) => i !== index) }));
  };

  const handleAddMedication = () => {
    if (!medName.trim()) return;
    const newMed: MedicationItem = {
      name: medName.trim(),
      dosage: medDosage.trim() || 'Unspecified dosage',
      source: 'Patient Self-Reported'
    };
    setFormData(prev => ({ ...prev, current_medications: [...prev.current_medications, newMed] }));
    setMedName('');
    setMedDosage('');
  };

  const handleRemoveMedication = (index: number) => {
    setFormData(prev => ({ ...prev, current_medications: prev.current_medications.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    onSave(formData);
    toast.success('Patient intake profile updated successfully');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Patient Information Intake
            </DialogTitle>
            <span className="text-[11px] px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-semibold">
              Provenance: User-Provided
            </span>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Capture patient baseline demographics, complaints, known allergies, chronic conditions, and active medications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Demographics */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <Label className="text-[11px] text-slate-500">Patient Full Name</Label>
              <Input 
                value={formData.full_name} 
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="h-8 text-xs mt-1 bg-white" 
              />
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Age</Label>
              <Input 
                type="number"
                value={formData.age} 
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs mt-1 bg-white" 
              />
            </div>
            <div>
              <Label className="text-[11px] text-slate-500">Biological Sex</Label>
              <Input 
                value={formData.gender} 
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="h-8 text-xs mt-1 bg-white" 
              />
            </div>
          </div>

          {/* Current Symptoms */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              Current Symptoms & Chief Complaints
            </Label>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. Fatigue, occasional palpitations..." 
                value={newSymptom} 
                onChange={(e) => setNewSymptom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSymptom())}
                className="h-8 text-xs bg-white"
              />
              <Button size="sm" onClick={handleAddSymptom} className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.symptoms.map((symp, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1 pl-2 pr-1 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {symp}
                  <button onClick={() => handleRemoveSymptom(i)} className="hover:text-rose-600">×</button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Chronic Conditions */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Label className="text-xs font-semibold text-slate-700">
              Existing Chronic Conditions
            </Label>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. Essential Hypertension (2019)..." 
                value={newCondition} 
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
                className="h-8 text-xs bg-white"
              />
              <Button size="sm" onClick={handleAddCondition} className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.chronic_conditions.map((cond, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1 pl-2 pr-1 py-0.5 bg-slate-100 text-slate-700 border border-slate-300">
                  {cond}
                  <button onClick={() => handleRemoveCondition(i)} className="hover:text-rose-600">×</button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Known Allergies */}
          <div className="space-y-2 p-3 bg-rose-50/50 rounded-lg border border-rose-200">
            <Label className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              Known Allergies (Food & Drug)
            </Label>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. Penicillin, Sulfa drugs..." 
                value={newAllergy} 
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                className="h-8 text-xs bg-white border-rose-200"
              />
              <Button size="sm" onClick={handleAddAllergy} className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.allergies.map((allg, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1 pl-2 pr-1 py-0.5 bg-rose-100 text-rose-800 border border-rose-300">
                  {allg}
                  <button onClick={() => handleRemoveAllergy(i)} className="hover:text-rose-900 font-bold">×</button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Current Medications */}
          <div className="space-y-2 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
            <Label className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-blue-600" />
              Current Medications (Patient Intake)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                placeholder="Medication name (e.g. Amlodipine)" 
                value={medName} 
                onChange={(e) => setMedName(e.target.value)}
                className="h-8 text-xs bg-white border-blue-200"
              />
              <div className="flex gap-2">
                <Input 
                  placeholder="Dosage (e.g. 5mg daily)" 
                  value={medDosage} 
                  onChange={(e) => setMedDosage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMedication())}
                  className="h-8 text-xs bg-white border-blue-200"
                />
                <Button size="sm" onClick={handleAddMedication} className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="space-y-1 pt-1">
              {formData.current_medications.map((med, i) => (
                <div key={i} className="flex items-center justify-between p-1.5 bg-white rounded border border-blue-100 text-xs">
                  <span className="font-semibold text-slate-800">{med.name} <span className="font-normal text-slate-500">({med.dosage})</span></span>
                  <button onClick={() => handleRemoveMedication(i)} className="text-slate-400 hover:text-rose-600 p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Save Intake Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PatientIntakeModal;
