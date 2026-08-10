export type UserRole = "admin" | "patient";

export type SessionUser = {
  id: number;
  username: string;
  role: UserRole;
  patientId: number | null;
};

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  patient_id: number | null;
  created_at: string;
};

export type PatientRow = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string;
  blood_type: string | null;
  allergies: string | null;
  emergency_contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MedicalRecordRow = {
  id: number;
  patient_id: number;
  title: string;
  record_type: string;
  summary: string;
  diagnosis: string | null;
  treatment: string | null;
  provider_name: string | null;
  recorded_at: string;
  created_at: string;
};

export type AppointmentRow = {
  id: number;
  patient_id: number;
  provider_name: string;
  reason: string;
  status: "scheduled" | "completed" | "cancelled";
  scheduled_at: string;
  notes: string | null;
  created_at: string;
};

export type PrescriptionRow = {
  id: number;
  patient_id: number;
  medication: string;
  dosage: string;
  instructions: string | null;
  prescribed_by: string | null;
  starts_on: string;
  ends_on: string | null;
  created_at: string;
};
