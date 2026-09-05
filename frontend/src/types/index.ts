/**
 * MedLens Clinical Information Intelligence Types
 */

export type UserRole = 'Admin' | 'Doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  specialization?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  insuranceInfo: string;
  status: 'Stable' | 'Critical' | 'Discharged' | 'In Treatment';
  assignedDoctorId?: string;
}

export interface Document {
  id: string;
  patientId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  scanDate?: string;
  bodyPart?: string;
  department?: string;
  findings?: string;
  impression?: string;
  symptoms?: string;
  clinicalHistory?: string;
  reasonForScan?: string;
  doctorNotes?: string;
  notes?: string;
  uploadDate: string;
  patientName?: string;
  patientMrn?: string;
  uploadedBy?: string;
}

export interface Note {
  id: string;
  patientId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinical_notes: string;
  medications: MedicationItem[];
  additional_notes?: string;
  created_at: string;
}

export interface StudyFile {
  id: string;
  studyId: string;
  fileUrl: string;
  fileName: string;
  fileFormat: string;
  createdAt: string;
}

export interface DocumentStudy {
  id: string;
  patientId: string;
  studyType: string;
  bodyPart?: string;
  scanDate?: string;
  department?: string;
  findings?: string;
  impression?: string;
  symptoms?: string;
  clinicalHistory?: string;
  reasonForScan?: string;
  doctorNotes?: string;
  uploadedBy: string;
  createdAt: string;
  files: StudyFile[];
  patientName?: string;
  mrn?: string;
  appId?: string;
  filesCount?: number;
}