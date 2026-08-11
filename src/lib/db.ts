import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import type {
  AppointmentRow,
  ClinicRow,
  ClinicSummary,
  DoctorListItem,
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

    CREATE TABLE IF NOT EXISTS clinics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL,
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

  const doctorCols = tableColumns(db, "doctors");
  if (doctorCols.length && !doctorCols.includes("clinic_id")) {
    db.exec(
      `ALTER TABLE doctors ADD COLUMN clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL`,
    );
  }

  // Indexes must run after clinic_id exists on upgraded databases.
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);
    CREATE INDEX IF NOT EXISTS idx_doctors_category ON doctors(category);
    CREATE INDEX IF NOT EXISTS idx_doctors_full_name ON doctors(full_name);
  `);
}

function seedClinics(db: Database.Database) {
  const seeded = db
    .prepare("SELECT value FROM meta WHERE key = 'clinics_seeded'")
    .get() as { value: string } | undefined;

  if (seeded?.value === "1") {
    assignDoctorsToClinics(db);
    return;
  }

  const count = (
    db.prepare("SELECT COUNT(*) AS count FROM clinics").get() as {
      count: number;
    }
  ).count;

  if (count === 0) {
    const insert = db.prepare(
      `INSERT INTO clinics (name, city, address, phone, description)
       VALUES (?, ?, ?, ?, ?)`,
    );

    const clinics: Array<[string, string, string, string, string]> = [
      [
        "HarborCare Downtown",
        "Seattle",
        "120 Pine Street, Seattle, WA",
        "+1 (206) 555-0101",
        "Flagship clinic for primary care and specialty referrals.",
      ],
      [
        "HarborCare Lakeside",
        "Bellevue",
        "88 Lake Avenue, Bellevue, WA",
        "+1 (425) 555-0102",
        "Family medicine and pediatrics for Eastside communities.",
      ],
      [
        "HarborCare Northgate",
        "Seattle",
        "401 Northgate Way, Seattle, WA",
        "+1 (206) 555-0103",
        "Cardiology and neurology outpatient services.",
      ],
      [
        "HarborCare Southcenter",
        "Tukwila",
        "300 Andover Park West, Tukwila, WA",
        "+1 (206) 555-0104",
        "Orthopedics and rehabilitation-focused campus.",
      ],
      [
        "HarborCare Westside",
        "Seattle",
        "2100 California Avenue SW, Seattle, WA",
        "+1 (206) 555-0105",
        "Behavioral health and dermatology clinic.",
      ],
    ];

    for (const clinic of clinics) {
      insert.run(...clinic);
    }
  }

  assignDoctorsToClinics(db);

  db.prepare(
    "INSERT INTO meta (key, value) VALUES ('clinics_seeded', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run();
}

function assignDoctorsToClinics(db: Database.Database) {
  const clinics = db
    .prepare("SELECT id FROM clinics ORDER BY id ASC")
    .all() as Array<{ id: number }>;
  if (clinics.length === 0) {
    return;
  }

  const unassigned = db
    .prepare("SELECT id FROM doctors WHERE clinic_id IS NULL ORDER BY id ASC")
    .all() as Array<{ id: number }>;

  const update = db.prepare("UPDATE doctors SET clinic_id = ? WHERE id = ?");
  unassigned.forEach((doctor, index) => {
    update.run(clinics[index % clinics.length].id, doctor.id);
  });
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
    const clinics = db
      .prepare("SELECT id FROM clinics ORDER BY id ASC")
      .all() as Array<{ id: number }>;

    const insert = db.prepare(
      `INSERT INTO doctors (
        full_name, clinic_id, category, specialty, years_experience,
        experience_summary, education, languages, accepting_patients
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    doctors.forEach((doctor, index) => {
      const clinicId = clinics.length ? clinics[index % clinics.length].id : null;
      insert.run(doctor[0], clinicId, doctor[1], doctor[2], doctor[3], doctor[4], doctor[5], doctor[6], doctor[7]);
    });
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
  seedClinics(db);
  seedDoctors(db);
  seedFromEnv(db);
  seedScaleDoctors(db);
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

export function searchDoctors(options?: {
  query?: string;
  category?: string;
  clinicId?: number | null;
  page?: number;
  pageSize?: number;
}) {
  const query = options?.query?.trim() || "";
  const category =
    options?.category && options.category !== "All"
      ? options.category.trim()
      : "";
  const clinicId = options?.clinicId && options.clinicId > 0 ? options.clinicId : null;
  const pageSize = Math.min(Math.max(options?.pageSize || 10, 1), 50);
  const page = Math.max(options?.page || 1, 1);
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const params: Array<string | number> = [];

  if (clinicId) {
    where.push("d.clinic_id = ?");
    params.push(clinicId);
  }

  if (category) {
    where.push("d.category = ?");
    params.push(category);
  }

  if (query) {
    where.push(
      `(d.full_name LIKE ? OR d.specialty LIKE ? OR d.experience_summary LIKE ? OR d.education LIKE ? OR d.languages LIKE ? OR c.name LIKE ? OR c.city LIKE ?)`,
    );
    const like = `%${query}%`;
    params.push(like, like, like, like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const db = getDb();

  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM doctors d
         LEFT JOIN clinics c ON c.id = d.clinic_id
         ${whereSql}`,
      )
      .get(...params) as { count: number }
  ).count;

  const doctors = db
    .prepare(
      `SELECT d.*, c.name AS clinic_name, c.city AS clinic_city
       FROM doctors d
       LEFT JOIN clinics c ON c.id = d.clinic_id
       ${whereSql}
       ORDER BY c.name ASC, d.category ASC, d.full_name ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as DoctorListItem[];

  return {
    doctors,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function listClinics() {
  return getDb()
    .prepare(
      `SELECT c.*, COUNT(d.id) AS doctor_count
       FROM clinics c
       LEFT JOIN doctors d ON d.clinic_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`,
    )
    .all() as ClinicSummary[];
}

export function getClinic(id: number) {
  return getDb()
    .prepare("SELECT * FROM clinics WHERE id = ?")
    .get(id) as ClinicRow | undefined;
}

function seedScaleDoctors(db: Database.Database) {
  const raw = process.env.DEMO_SCALE_DOCTORS?.trim();
  if (!raw) {
    return;
  }

  const target = Math.min(Math.max(Number(raw) || 0, 0), 1000);
  if (target <= 0) {
    return;
  }

  const clinics = db
    .prepare("SELECT id FROM clinics ORDER BY id ASC")
    .all() as Array<{ id: number }>;
  if (clinics.length === 0) {
    return;
  }

  const current = (
    db.prepare("SELECT COUNT(*) AS count FROM doctors").get() as {
      count: number;
    }
  ).count;

  if (current >= target) {
    return;
  }

  const categories = [
    "Primary Care",
    "Cardiology",
    "Dermatology",
    "Pediatrics",
    "Orthopedics",
    "Mental Health",
    "Neurology",
  ];

  const insert = db.prepare(
    `INSERT INTO doctors (
      full_name, clinic_id, category, specialty, years_experience,
      experience_summary, education, languages, accepting_patients
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
  );

  const tx = db.transaction(() => {
    for (let i = current + 1; i <= target; i++) {
      const category = categories[i % categories.length];
      insert.run(
        `Dr. Scale ${i}`,
        clinics[i % clinics.length].id,
        category,
        `${category} Specialist`,
        3 + (i % 25),
        `Scaled directory profile for doctor ${i} used to validate clinic filters and pagination.`,
        "MD, Harbor University",
        "English",
      );
    }
  });
  tx();
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
  const clinics = (
    db.prepare("SELECT COUNT(*) AS count FROM clinics").get() as {
      count: number;
    }
  ).count;

  return { patients, records, appointments, users, doctors, clinics };
}
