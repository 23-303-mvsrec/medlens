export interface MedicationItem {
  name: string;
  dosage?: string;
  frequency?: string;
  source: string;
}

export interface PatientIntake {
  patient_id?: string;
  full_name: string;
  age: number;
  gender: string;
  symptoms: string[];
  chronic_conditions: string[];
  allergies: string[];
  current_medications: MedicationItem[];
  intake_date?: string;
  provenance: string;
}

export interface LabTestItem {
  id: string;
  test_name: string;
  category: string;
  value: string;
  numeric_value?: number;
  unit: string;
  reference_range: string;
  ref_min?: number;
  ref_max?: number;
  status: 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN';
  status_reason?: string;
  provenance: string;
  confidence: number;
  is_verified: boolean;
  observation?: string;
}

export interface ConflictDetectionItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'ALLERGY_CONFLICT' | 'MEDICATION_GAP' | 'LAB_ANOMALY' | 'HISTORY_MISMATCH';
  title: string;
  description: string;
  source_a: string;
  source_b: string;
  recommendation: string;
}

export interface MedLensReportAnalysis {
  report_id: string;
  patient_id: string;
  report_title: string;
  report_date: string;
  laboratory_name?: string;
  file_name?: string;
  file_url?: string;
  extracted_tests: LabTestItem[];
  inconsistencies: ConflictDetectionItem[];
  plain_summary: string;
  key_findings: string[];
  questions_for_doctor: string[];
  safety_disclaimer: string;
  created_at?: string;
}
