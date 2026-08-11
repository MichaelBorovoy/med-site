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

export const recordSchema = z.object({
  patientId: z.coerce.number().int().positive(),
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
  providerName: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(1).max(300),
  status: z.enum(["scheduled", "completed", "cancelled"]),
  scheduledAt: z.string().trim().min(4).max(64),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const doctorSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  specialty: z.string().trim().min(1).max(120),
  yearsExperience: z.coerce.number().int().min(0).max(80),
  experienceSummary: z.string().trim().min(1).max(4000),
  education: z.string().trim().max(500).optional().or(z.literal("")),
  languages: z.string().trim().max(200).optional().or(z.literal("")),
  acceptingPatients: z.boolean().optional().default(true),
});
