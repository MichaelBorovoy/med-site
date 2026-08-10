import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import type {
  AppointmentRow,
  MedicalRecordRow,
  PatientRow,
  PrescriptionRow,
  UserRow,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "medportal.db");

let dbInstance: Database.Database | null = null;

function createSchema(db: Database.Database) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      date_of_birth TEXT NOT NULL,
      blood_type TEXT,
      allergies TEXT,
      emergency_contact TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'patient')),
      patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      record_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      diagnosis TEXT,
      treatment TEXT,
      provider_name TEXT,
      recorded_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      provider_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
      scheduled_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      medication TEXT NOT NULL,
      dosage TEXT NOT NULL,
      instructions TEXT,
      prescribed_by TEXT,
      starts_on TEXT NOT NULL,
      ends_on TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function seedFromEnv(db: Database.Database) {
  const seeded = db
    .prepare("SELECT value FROM meta WHERE key = 'seeded'")
    .get() as { value: string } | undefined;

  if (seeded?.value === "1") {
    return;
  }

  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminUsername || !adminPassword) {
    console.warn(
      "[med-portal] Skipping seed: set ADMIN_USERNAME and ADMIN_PASSWORD in .env.local",
    );
    return;
  }

  const insertUser = db.prepare(
    `INSERT INTO users (username, password_hash, role, patient_id)
     VALUES (@username, @password_hash, @role, @patient_id)`,
  );

  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(adminUsername);

  if (!existingAdmin) {
    insertUser.run({
      username: adminUsername,
      password_hash: bcrypt.hashSync(adminPassword, 12),
      role: "admin",
      patient_id: null,
    });
  }

  const demoUsername = process.env.DEMO_PATIENT_USERNAME?.trim();
  const demoPassword = process.env.DEMO_PATIENT_PASSWORD?.trim();

  if (demoUsername && demoPassword) {
    const existingPatientUser = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(demoUsername);

    if (!existingPatientUser) {
      const patientInfo = db
        .prepare(
          `INSERT INTO patients (
            full_name, email, phone, date_of_birth, blood_type,
            allergies, emergency_contact, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          process.env.DEMO_PATIENT_FULL_NAME || "Demo Patient",
          process.env.DEMO_PATIENT_EMAIL || "demo.patient@example.com",
          "+1 (555) 010-2000",
          process.env.DEMO_PATIENT_DATE_OF_BIRTH || "1990-01-01",
          "O+",
          "Penicillin",
          "Jordan Rivera · +1 (555) 010-2001",
          "Seeded demo patient for local development.",
        );

      const patientId = Number(patientInfo.lastInsertRowid);

      insertUser.run({
        username: demoUsername,
        password_hash: bcrypt.hashSync(demoPassword, 12),
        role: "patient",
        patient_id: patientId,
      });

      db.prepare(
        `INSERT INTO medical_records (
          patient_id, title, record_type, summary, diagnosis, treatment, provider_name, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        patientId,
        "Annual wellness visit",
        "Visit",
        "Routine physical exam with normal vitals and labs within range.",
        "Healthy adult",
        "Continue current lifestyle plan; follow up in 12 months.",
        "Dr. Maya Chen",
        "2025-11-12T10:00:00.000Z",
      );

      db.prepare(
        `INSERT INTO medical_records (
          patient_id, title, record_type, summary, diagnosis, treatment, provider_name, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        patientId,
        "Lipid panel",
        "Lab",
        "Cholesterol panel collected during wellness visit.",
        "Borderline LDL",
        "Dietary counseling; recheck in 6 months.",
        "Harbor Labs",
        "2025-11-12T11:30:00.000Z",
      );

      db.prepare(
        `INSERT INTO appointments (
          patient_id, provider_name, reason, status, scheduled_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        patientId,
        "Dr. Maya Chen",
        "Follow-up lipid review",
        "scheduled",
        "2026-05-20T15:00:00.000Z",
        "Bring recent pharmacy list.",
      );

      db.prepare(
        `INSERT INTO prescriptions (
          patient_id, medication, dosage, instructions, prescribed_by, starts_on, ends_on
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        patientId,
        "Atorvastatin",
        "10 mg",
        "Take once daily in the evening with water.",
        "Dr. Maya Chen",
        "2025-11-12",
        null,
      );
    }
  }

  db.prepare(
    "INSERT INTO meta (key, value) VALUES ('seeded', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run();
}

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  createSchema(db);
  seedFromEnv(db);
  dbInstance = db;
  return db;
}

export function listPatients() {
  return getDb()
    .prepare("SELECT * FROM patients ORDER BY full_name ASC")
    .all() as PatientRow[];
}

export function getPatient(id: number) {
  return getDb()
    .prepare("SELECT * FROM patients WHERE id = ?")
    .get(id) as PatientRow | undefined;
}

export function listRecords(patientId?: number) {
  if (patientId) {
    return getDb()
      .prepare(
        "SELECT * FROM medical_records WHERE patient_id = ? ORDER BY recorded_at DESC",
      )
      .all(patientId) as MedicalRecordRow[];
  }

  return getDb()
    .prepare("SELECT * FROM medical_records ORDER BY recorded_at DESC")
    .all() as MedicalRecordRow[];
}

export function listAppointments(patientId?: number) {
  if (patientId) {
    return getDb()
      .prepare(
        "SELECT * FROM appointments WHERE patient_id = ? ORDER BY scheduled_at DESC",
      )
      .all(patientId) as AppointmentRow[];
  }

  return getDb()
    .prepare("SELECT * FROM appointments ORDER BY scheduled_at DESC")
    .all() as AppointmentRow[];
}

export function listPrescriptions(patientId: number) {
  return getDb()
    .prepare(
      "SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY starts_on DESC",
    )
    .all(patientId) as PrescriptionRow[];
}

export function findUserByUsername(username: string) {
  return getDb()
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;
}

export function findUserById(id: number) {
  return getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;
}

export function listUsers() {
  return getDb()
    .prepare(
      `SELECT u.id, u.username, u.role, u.patient_id, u.created_at, p.full_name
       FROM users u
       LEFT JOIN patients p ON p.id = u.patient_id
       ORDER BY u.created_at DESC`,
    )
    .all() as Array<{
    id: number;
    username: string;
    role: "admin" | "patient";
    patient_id: number | null;
    created_at: string;
    full_name: string | null;
  }>;
}

export function getDashboardStats() {
  const db = getDb();
  const patients = (
    db.prepare("SELECT COUNT(*) AS count FROM patients").get() as {
      count: number;
    }
  ).count;
  const records = (
    db.prepare("SELECT COUNT(*) AS count FROM medical_records").get() as {
      count: number;
    }
  ).count;
  const appointments = (
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM appointments WHERE status = 'scheduled'",
      )
      .get() as { count: number }
  ).count;
  const users = (
    db.prepare("SELECT COUNT(*) AS count FROM users").get() as {
      count: number;
    }
  ).count;

  return { patients, records, appointments, users };
}
