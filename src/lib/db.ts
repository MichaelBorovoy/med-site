import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import type {
  AppointmentRow,
  DoctorRow,
  MedicalRecordRow,
  PatientRow,
  PrescriptionRow,
  UserRow,
  UserRole,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "medportal.db");

let dbInstance: Database.Database | null = null;

function tableColumns(db: Database.Database, table: string) {
  return (
    db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  ).map((column) => column.name);
}

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

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      category TEXT NOT NULL,
      specialty TEXT NOT NULL,
      years_experience INTEGER NOT NULL DEFAULT 0,
      experience_summary TEXT NOT NULL,
      education TEXT,
      languages TEXT,
      accepting_patients INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'patient', 'doctor', 'coordinator')),
      patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
      provider_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
      scheduled_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      record_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      diagnosis TEXT,
      treatment TEXT,
      provider_name TEXT,
      recorded_at TEXT NOT NULL,
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

function migrateSchema(db: Database.Database) {
  const userCols = tableColumns(db, "users");
  if (userCols.length && !userCols.includes("doctor_id")) {
    db.exec(`
      CREATE TABLE users_migrated (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'patient', 'doctor', 'coordinator')),
        patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO users_migrated (id, username, password_hash, role, patient_id, created_at)
      SELECT id, username, password_hash, role, patient_id, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_migrated RENAME TO users;
    `);
  }

  const appointmentCols = tableColumns(db, "appointments");
  if (appointmentCols.length && !appointmentCols.includes("doctor_id")) {
    db.exec(`ALTER TABLE appointments ADD COLUMN doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL`);
  }

  const recordCols = tableColumns(db, "medical_records");
  if (recordCols.length && !recordCols.includes("appointment_id")) {
    db.exec(
      `ALTER TABLE medical_records ADD COLUMN appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL`,
    );
  }
}

function upsertUser(
  db: Database.Database,
  input: {
    username: string;
    password: string;
    role: UserRole;
    patientId?: number | null;
    doctorId?: number | null;
  },
) {
  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(input.username) as { id: number } | undefined;

  if (existing) {
    return existing.id;
  }

  const result = db
    .prepare(
      `INSERT INTO users (username, password_hash, role, patient_id, doctor_id)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      input.username,
      bcrypt.hashSync(input.password, 12),
      input.role,
      input.patientId ?? null,
      input.doctorId ?? null,
    );

  return Number(result.lastInsertRowid);
}

function seedDoctors(db: Database.Database) {
  const seeded = db
    .prepare("SELECT value FROM meta WHERE key = 'doctors_seeded'")
    .get() as { value: string } | undefined;

  if (seeded?.value === "1") {
    return;
  }

  const count = (
    db.prepare("SELECT COUNT(*) AS count FROM doctors").get() as {
      count: number;
    }
  ).count;

  if (count === 0) {
    const insert = db.prepare(
      `INSERT INTO doctors (
        full_name, category, specialty, years_experience,
        experience_summary, education, languages, accepting_patients
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const doctors: Array<
      [string, string, string, number, string, string, string, number]
    > = [
      [
        "Dr. Maya Chen",
        "Primary Care",
        "Family Medicine",
        14,
        "Leads comprehensive adult and family wellness programs, with a focus on preventive screening and long-term chronic disease management.",
        "MD, University of Washington",
        "English, Mandarin",
        1,
      ],
      [
        "Dr. Omar Hassan",
        "Cardiology",
        "Interventional Cardiology",
        18,
        "Specializes in coronary artery disease and catheter-based interventions. Mentors fellows in advanced cardiac imaging.",
        "MD, Johns Hopkins University",
        "English, Arabic",
        1,
      ],
      [
        "Dr. Elena Brooks",
        "Cardiology",
        "Heart Failure",
        11,
        "Manages complex heart-failure caseloads and coordinates multidisciplinary care teams.",
        "MD, Emory University",
        "English, Spanish",
        1,
      ],
      [
        "Dr. Priya Nair",
        "Dermatology",
        "Medical Dermatology",
        9,
        "Treats inflammatory skin conditions and early skin-cancer detection.",
        "MD, UCLA",
        "English, Hindi",
        1,
      ],
      [
        "Dr. Luis Ortega",
        "Pediatrics",
        "General Pediatrics",
        16,
        "Provides newborn through adolescent care with emphasis on developmental screening.",
        "MD, University of Michigan",
        "English, Spanish",
        1,
      ],
      [
        "Dr. Hannah Park",
        "Orthopedics",
        "Sports Medicine",
        12,
        "Focuses on joint preservation, injury recovery, and return-to-activity planning.",
        "MD, Northwestern University",
        "English, Korean",
        0,
      ],
      [
        "Dr. Jordan Blake",
        "Mental Health",
        "Psychiatry",
        13,
        "Supports adults with anxiety, depression, and trauma-related conditions.",
        "MD, Columbia University",
        "English",
        1,
      ],
      [
        "Dr. Sophia Grant",
        "Neurology",
        "Headache & Migraine",
        10,
        "Evaluates migraine, neuropathy, and seizure disorders with practical lifestyle and medication strategies.",
        "MD, Duke University",
        "English, French",
        1,
      ],
    ];

    for (const doctor of doctors) {
      insert.run(...doctor);
    }
  }

  db.prepare(
    "INSERT INTO meta (key, value) VALUES ('doctors_seeded', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run();
}

function seedFromEnv(db: Database.Database) {
  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (adminUsername && adminPassword) {
    upsertUser(db, {
      username: adminUsername,
      password: adminPassword,
      role: "admin",
    });
  } else {
    console.warn(
      "[med-portal] Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.local to bootstrap admin.",
    );
  }

  const demoUsername = process.env.DEMO_PATIENT_USERNAME?.trim();
  const demoPassword = process.env.DEMO_PATIENT_PASSWORD?.trim();
  let patientId: number | null = null;

  if (demoUsername && demoPassword) {
    const existingPatientUser = db
      .prepare("SELECT id, patient_id FROM users WHERE username = ?")
      .get(demoUsername) as { id: number; patient_id: number | null } | undefined;

    if (existingPatientUser?.patient_id) {
      patientId = existingPatientUser.patient_id;
    } else {
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

      patientId = Number(patientInfo.lastInsertRowid);

      upsertUser(db, {
        username: demoUsername,
        password: demoPassword,
        role: "patient",
        patientId,
      });

      const recordCount = (
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM medical_records WHERE patient_id = ?",
          )
          .get(patientId) as { count: number }
      ).count;

      if (recordCount === 0) {
        const maya = db
          .prepare("SELECT id FROM doctors WHERE full_name = ?")
          .get("Dr. Maya Chen") as { id: number } | undefined;

        const appointment = db
          .prepare(
            `INSERT INTO appointments (
              patient_id, doctor_id, provider_name, reason, status, scheduled_at, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            patientId,
            maya?.id ?? null,
            "Dr. Maya Chen",
            "Follow-up lipid review",
            "scheduled",
            "2026-05-20T15:00:00.000Z",
            "Bring recent pharmacy list.",
          );

        db.prepare(
          `INSERT INTO medical_records (
            patient_id, appointment_id, title, record_type, summary, diagnosis, treatment, provider_name, recorded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          patientId,
          null,
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
            patient_id, appointment_id, title, record_type, summary, diagnosis, treatment, provider_name, recorded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          patientId,
          Number(appointment.lastInsertRowid),
          "Lipid panel",
          "Lab",
          "Cholesterol panel collected during wellness visit.",
          "Borderline LDL",
          "Dietary counseling; recheck in 6 months.",
          "Harbor Labs",
          "2025-11-12T11:30:00.000Z",
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
  }

  const doctorUsername = process.env.DEMO_DOCTOR_USERNAME?.trim();
  const doctorPassword = process.env.DEMO_DOCTOR_PASSWORD?.trim();
  if (doctorUsername && doctorPassword) {
    const doctorName =
      process.env.DEMO_DOCTOR_FULL_NAME?.trim() || "Dr. Maya Chen";
    const doctor = db
      .prepare("SELECT id FROM doctors WHERE full_name = ?")
      .get(doctorName) as { id: number } | undefined;

    if (doctor) {
      upsertUser(db, {
        username: doctorUsername,
        password: doctorPassword,
        role: "doctor",
        doctorId: doctor.id,
      });

      if (patientId) {
        db.prepare(
          `UPDATE appointments
           SET doctor_id = ?
           WHERE patient_id = ? AND provider_name = ? AND doctor_id IS NULL`,
        ).run(doctor.id, patientId, doctorName);
      }
    }
  }

  const coordinatorUsername = process.env.DEMO_COORDINATOR_USERNAME?.trim();
  const coordinatorPassword = process.env.DEMO_COORDINATOR_PASSWORD?.trim();
  if (coordinatorUsername && coordinatorPassword) {
    upsertUser(db, {
      username: coordinatorUsername,
      password: coordinatorPassword,
      role: "coordinator",
    });
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
  migrateSchema(db);
  seedDoctors(db);
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

export function listDoctorAppointments(doctorId: number) {
  return getDb()
    .prepare(
      `SELECT a.*, p.full_name AS patient_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       WHERE a.doctor_id = ?
       ORDER BY a.scheduled_at DESC`,
    )
    .all(doctorId) as Array<AppointmentRow & { patient_name: string }>;
}

export function doctorCanAccessPatient(doctorId: number, patientId: number) {
  const row = getDb()
    .prepare(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND patient_id = ?
       LIMIT 1`,
    )
    .get(doctorId, patientId) as { id: number } | undefined;
  return Boolean(row);
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
      `SELECT u.id, u.username, u.role, u.patient_id, u.doctor_id, u.created_at,
              p.full_name AS patient_name, d.full_name AS doctor_name
       FROM users u
       LEFT JOIN patients p ON p.id = u.patient_id
       LEFT JOIN doctors d ON d.id = u.doctor_id
       ORDER BY u.created_at DESC`,
    )
    .all() as Array<{
    id: number;
    username: string;
    role: UserRole;
    patient_id: number | null;
    doctor_id: number | null;
    created_at: string;
    patient_name: string | null;
    doctor_name: string | null;
  }>;
}

export function listDoctors(category?: string) {
  if (category && category !== "All") {
    return getDb()
      .prepare(
        `SELECT * FROM doctors
         WHERE category = ?
         ORDER BY category ASC, full_name ASC`,
      )
      .all(category) as DoctorRow[];
  }

  return getDb()
    .prepare("SELECT * FROM doctors ORDER BY category ASC, full_name ASC")
    .all() as DoctorRow[];
}

export function getDoctor(id: number) {
  return getDb()
    .prepare("SELECT * FROM doctors WHERE id = ?")
    .get(id) as DoctorRow | undefined;
}

export function listDoctorCategories() {
  return getDb()
    .prepare(
      `SELECT category, COUNT(*) AS count
       FROM doctors
       GROUP BY category
       ORDER BY category ASC`,
    )
    .all() as Array<{ category: string; count: number }>;
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
  const doctors = (
    db.prepare("SELECT COUNT(*) AS count FROM doctors").get() as {
      count: number;
    }
  ).count;

  return { patients, records, appointments, users, doctors };
}
