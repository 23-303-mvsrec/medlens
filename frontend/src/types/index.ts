/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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

export interface Department {
  id: string;
  name: string;
  code: string;
  floor: string;
  hodId: string;
  hodName: string;
  totalBeds: number;
  availableBeds: number;
  icuSlots: number;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  is_primary: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  password?: string;
  specialization: string;
  sub_specialization?: string;
  qualifications: string[];
  experience_years: number;
  registration_number: string;
  consultation_fee: number;
  followup_fee: number;
  departments: DepartmentInfo[];
  created_at: string;
  status?: 'Available' | 'On Break' | 'Busy' | 'Offline';
  availability?: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  id: string;
  doctor_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  consultation_duration: number;
  is_leave: boolean;
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
  assignedDoctorId: string;
}

export interface Document {
  id: string;
  patientId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  
  // New structured fields
  scanDate?: string;
  bodyPart?: string;
  department?: string;
  referringDoctorId?: string;
  
  findings?: string;
  impression?: string;
  
  symptoms?: string;
  clinicalHistory?: string;
  reasonForScan?: string;
  doctorNotes?: string;
  
  notes: string; // Legacy
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
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinical_notes: string;
  medications: MedicationItem[];
  additional_notes: string;
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
  referringDoctorId?: string;
  
  findings?: string;
  impression?: string;
  
  symptoms?: string;
  clinicalHistory?: string;
  reasonForScan?: string;
  doctorNotes?: string;
  
  uploadedBy: string;
  createdAt: string;
  files: StudyFile[];
  
  // For repository table
  patientName?: string;
  mrn?: string;
  appId?: string;
  filesCount?: number;
}
