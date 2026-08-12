import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(80),
  password: z.string().min(1, "Password is required").max(200),
});

export const patientSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  dateOfBirth: z.string().trim().min(4).max(32),
  bloodType: z.string().trim().max(16).optional().or(z.literal("")),
  allergies: z.string().trim().max(500).optional().or(z.literal("")),
  emergencyContact: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  username: z.string().trim().min(3).max(80).optional().or(z.literal("")),
  password: z.string().min(8).max(200).optional().or(z.literal("")),
});

export const patientProfileSchema = z.object({
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  allergies: z.string().trim().max(500).optional().or(z.literal("")),
  emergencyContact: z.string().trim().max(200).optional().or(z.literal("")),
});

export const recordSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  appointmentId: z.coerce.number().int().positive().optional().nullable(),
  title: z.string().trim().min(1).max(160),
  recordType: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(4000),
  diagnosis: z.string().trim().max(500).optional().or(z.literal("")),
  treatment: z.string().trim().max(1000).optional().or(z.literal("")),
  providerName: z.string().trim().max(120).optional().or(z.literal("")),
  recordedAt: z.string().trim().min(4).max(64),
});

export const appointmentSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  doctorId: z.coerce.number().int().positive().optional().nullable(),
  providerName: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(1).max(300),
  status: z.enum(["scheduled", "completed", "cancelled"]),
  scheduledAt: z.string().trim().min(4).max(64),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const doctorSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  clinicId: z.coerce.number().int().positive(),
  category: z.string().trim().min(1).max(80),
  specialty: z.string().trim().min(1).max(120),
  yearsExperience: z.coerce.number().int().min(0).max(80),
  experienceSummary: z.string().trim().min(1).max(4000),
  education: z.string().trim().max(500).optional().or(z.literal("")),
  languages: z.string().trim().max(200).optional().or(z.literal("")),
  acceptingPatients: z.boolean().optional().default(true),
});

export const clinicSchema = z.object({
  name: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(240),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(1).max(160),
  specialty: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(4000),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional().nullable(),
  clinicId: z.coerce.number().int().positive().optional().nullable(),
  doctorIds: z.array(z.coerce.number().int().positive()).min(1),
});

export const userAccountSchema = z.object({
  username: z.string().trim().min(3).max(80),
  password: z.string().min(8).max(200),
  role: z.enum(["admin", "patient", "doctor", "coordinator"]),
  patientId: z.coerce.number().int().positive().optional().nullable(),
  doctorId: z.coerce.number().int().positive().optional().nullable(),
});

export const assistanceQueueSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  channel: z.enum(["phone", "chat", "walk_in", "other"]),
  subject: z.string().trim().min(1).max(200),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const assistanceQueueUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["waiting", "in_progress", "done", "cancelled"]).optional(),
  claim: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const patientContactLogSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  channel: z.enum(["phone", "chat"]),
  direction: z.enum(["inbound", "outbound"]).default("inbound"),
  summary: z.string().trim().min(1).max(4000),
  referenceCode: z.string().trim().max(120).optional().or(z.literal("")),
  queueItemId: z.coerce.number().int().positive().optional().nullable(),
});
