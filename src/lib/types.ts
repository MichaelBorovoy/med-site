export type UserRole = "admin" | "patient" | "doctor" | "coordinator";

export type SessionUser = {
  id: number;
  username: string;
  role: UserRole;
  patientId: number | null;
  doctorId: number | null;
};

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  patient_id: number | null;
  doctor_id: number | null;
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
  appointment_id: number | null;
  recorded_at: string;
  created_at: string;
};

export type AppointmentRow = {
  id: number;
  patient_id: number;
  doctor_id: number | null;
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

export const DOCTOR_CATEGORIES = [
  "Primary Care",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Mental Health",
  "Neurology",
] as const;

export type DoctorCategory = (typeof DOCTOR_CATEGORIES)[number] | string;

export type DoctorRow = {
  id: number;
  full_name: string;
  clinic_id: number | null;
  category: string;
  specialty: string;
  years_experience: number;
  experience_summary: string;
  education: string | null;
  languages: string | null;
  accepting_patients: number;
  created_at: string;
  updated_at: string;
};

export type DoctorListItem = DoctorRow & {
  clinic_name: string | null;
  clinic_city: string | null;
};

export type ClinicRow = {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ClinicSummary = ClinicRow & {
  doctor_count: number;
};

export const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  patient: "/patient",
  doctor: "/doctor",
  coordinator: "/coordinator",
};

export const ALL_ROLES: UserRole[] = [
  "admin",
  "patient",
  "doctor",
  "coordinator",
];
