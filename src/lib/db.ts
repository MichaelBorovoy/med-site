import bcrypt from "bcryptjs";
import type {
  AppointmentRow,
  ClinicRow,
  ClinicSummary,
  DoctorListItem,
  DoctorRow,
  MedicalRecordRow,
  PatientRow,
  PrescriptionRow,
  ServiceListItem,
  ServiceRow,
  UserRow,
  UserRole,
} from "@/lib/types";
import { getSql, serializeRow, serializeRows } from "@/lib/sql";

type Sql = ReturnType<typeof getSql>;

let dbReady: Promise<void> | null = null;

const DOCTOR_SELECT = `
  d.id, d.full_name, d.clinic_id, d.category, d.specialty, d.years_experience,
  d.experience_summary, d.education, d.languages,
  d.accepting_patients::int AS accepting_patients,
  d.created_at, d.updated_at
`;

async function upsertMeta(sql: Sql, key: string, value: string) {
  await sql`
    INSERT INTO meta (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

async function upsertUser(
  sql: Sql,
  input: {
    username: string;
    password: string;
    role: UserRole;
    patientId?: number | null;
    doctorId?: number | null;
  },
) {
  const existing = await sql`
    SELECT id FROM users WHERE username = ${input.username}
  `;
  if (existing.length > 0) {
    return Number(existing[0].id);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const [row] = await sql`
    INSERT INTO users (username, password_hash, role, patient_id, doctor_id)
    VALUES (
      ${input.username},
      ${passwordHash},
      ${input.role},
      ${input.patientId ?? null},
      ${input.doctorId ?? null}
    )
    RETURNING id
  `;
  return Number(row.id);
}

async function assignDoctorsToClinics(sql: Sql) {
  const clinics = await sql`SELECT id FROM clinics ORDER BY id ASC`;
  if (clinics.length === 0) {
    return;
  }

  const unassigned = await sql`
    SELECT id FROM doctors WHERE clinic_id IS NULL ORDER BY id ASC
  `;

  for (let index = 0; index < unassigned.length; index++) {
    const clinicId = clinics[index % clinics.length].id;
    await sql`UPDATE doctors SET clinic_id = ${clinicId} WHERE id = ${unassigned[index].id}`;
  }
}

async function seedClinics() {
  const sql = getSql();
  const seeded = await sql`
    SELECT value FROM meta WHERE key = 'clinics_seeded'
  `;

  if (seeded[0]?.value === "1") {
    await assignDoctorsToClinics(sql);
    return;
  }

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM clinics`;
  if (count === 0) {
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

    for (const [name, city, address, phone, description] of clinics) {
      await sql`
        INSERT INTO clinics (name, city, address, phone, description)
        VALUES (${name}, ${city}, ${address}, ${phone}, ${description})
      `;
    }
  }

  await assignDoctorsToClinics(sql);
  await upsertMeta(sql, "clinics_seeded", "1");
}

async function seedDoctors() {
  const sql = getSql();
  const seeded = await sql`
    SELECT value FROM meta WHERE key = 'doctors_seeded'
  `;
  if (seeded[0]?.value === "1") {
    return;
  }

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM doctors`;
  if (count === 0) {
    const clinics = await sql`SELECT id FROM clinics ORDER BY id ASC`;

    const doctors: Array<
      [string, string, string, number, string, string, string, boolean]
    > = [
      [
        "Dr. Maya Chen",
        "Primary Care",
        "Family Medicine",
        14,
        "Leads comprehensive adult and family wellness programs, with a focus on preventive screening and long-term chronic disease management.",
        "MD, University of Washington",
        "English, Mandarin",
        true,
      ],
      [
        "Dr. Omar Hassan",
        "Cardiology",
        "Interventional Cardiology",
        18,
        "Specializes in coronary artery disease and catheter-based interventions. Mentors fellows in advanced cardiac imaging.",
        "MD, Johns Hopkins University",
        "English, Arabic",
        true,
      ],
      [
        "Dr. Elena Brooks",
        "Cardiology",
        "Heart Failure",
        11,
        "Manages complex heart-failure caseloads and coordinates multidisciplinary care teams.",
        "MD, Emory University",
        "English, Spanish",
        true,
      ],
      [
        "Dr. Priya Nair",
        "Dermatology",
        "Medical Dermatology",
        9,
        "Treats inflammatory skin conditions and early skin-cancer detection.",
        "MD, UCLA",
        "English, Hindi",
        true,
      ],
      [
        "Dr. Luis Ortega",
        "Pediatrics",
        "General Pediatrics",
        16,
        "Provides newborn through adolescent care with emphasis on developmental screening.",
        "MD, University of Michigan",
        "English, Spanish",
        true,
      ],
      [
        "Dr. Hannah Park",
        "Orthopedics",
        "Sports Medicine",
        12,
        "Focuses on joint preservation, injury recovery, and return-to-activity planning.",
        "MD, Northwestern University",
        "English, Korean",
        false,
      ],
      [
        "Dr. Jordan Blake",
        "Mental Health",
        "Psychiatry",
        13,
        "Supports adults with anxiety, depression, and trauma-related conditions.",
        "MD, Columbia University",
        "English",
        true,
      ],
      [
        "Dr. Sophia Grant",
        "Neurology",
        "Headache & Migraine",
        10,
        "Evaluates migraine, neuropathy, and seizure disorders with practical lifestyle and medication strategies.",
        "MD, Duke University",
        "English, French",
        true,
      ],
    ];

    for (let index = 0; index < doctors.length; index++) {
      const [
        fullName,
        category,
        specialty,
        yearsExperience,
        experienceSummary,
        education,
        languages,
        acceptingPatients,
      ] = doctors[index];
      const clinicId = clinics.length
        ? clinics[index % clinics.length].id
        : null;
      await sql`
        INSERT INTO doctors (
          full_name, clinic_id, category, specialty, years_experience,
          experience_summary, education, languages, accepting_patients
        ) VALUES (
          ${fullName},
          ${clinicId},
          ${category},
          ${specialty},
          ${yearsExperience},
          ${experienceSummary},
          ${education},
          ${languages},
          ${acceptingPatients}
        )
      `;
    }
  }

  await upsertMeta(sql, "doctors_seeded", "1");
}

async function seedFromEnv() {
  const sql = getSql();

  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (adminUsername && adminPassword) {
    await upsertUser(sql, {
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
    const existingPatientUser = await sql`
      SELECT id, patient_id FROM users WHERE username = ${demoUsername}
    `;

    if (existingPatientUser[0]?.patient_id) {
      patientId = Number(existingPatientUser[0].patient_id);
    } else {
      const [patientRow] = await sql`
        INSERT INTO patients (
          full_name, email, phone, date_of_birth, blood_type,
          allergies, emergency_contact, notes
        ) VALUES (
          ${process.env.DEMO_PATIENT_FULL_NAME || "Demo Patient"},
          ${process.env.DEMO_PATIENT_EMAIL || "demo.patient@example.com"},
          ${"+1 (555) 010-2000"},
          ${process.env.DEMO_PATIENT_DATE_OF_BIRTH || "1990-01-01"},
          ${"O+"},
          ${"Penicillin"},
          ${"Jordan Rivera · +1 (555) 010-2001"},
          ${"Seeded demo patient for local development."}
        )
        RETURNING id
      `;

      patientId = Number(patientRow.id);

      await upsertUser(sql, {
        username: demoUsername,
        password: demoPassword,
        role: "patient",
        patientId,
      });

      const [{ count: recordCount }] = await sql`
        SELECT COUNT(*)::int AS count FROM medical_records WHERE patient_id = ${patientId}
      `;

      if (recordCount === 0) {
        const mayaRows = await sql`
          SELECT id FROM doctors WHERE full_name = ${"Dr. Maya Chen"}
        `;
        const mayaId = mayaRows[0]?.id ?? null;

        const [appointmentRow] = await sql`
          INSERT INTO appointments (
            patient_id, doctor_id, provider_name, reason, status, scheduled_at, notes
          ) VALUES (
            ${patientId},
            ${mayaId},
            ${"Dr. Maya Chen"},
            ${"Follow-up lipid review"},
            ${"scheduled"},
            ${"2026-05-20T15:00:00.000Z"},
            ${"Bring recent pharmacy list."}
          )
          RETURNING id
        `;

        await sql`
          INSERT INTO medical_records (
            patient_id, appointment_id, title, record_type, summary, diagnosis, treatment, provider_name, recorded_at
          ) VALUES (
            ${patientId},
            ${null},
            ${"Annual wellness visit"},
            ${"Visit"},
            ${"Routine physical exam with normal vitals and labs within range."},
            ${"Healthy adult"},
            ${"Continue current lifestyle plan; follow up in 12 months."},
            ${"Dr. Maya Chen"},
            ${"2025-11-12T10:00:00.000Z"}
          )
        `;

        await sql`
          INSERT INTO medical_records (
            patient_id, appointment_id, title, record_type, summary, diagnosis, treatment, provider_name, recorded_at
          ) VALUES (
            ${patientId},
            ${Number(appointmentRow.id)},
            ${"Lipid panel"},
            ${"Lab"},
            ${"Cholesterol panel collected during wellness visit."},
            ${"Borderline LDL"},
            ${"Dietary counseling; recheck in 6 months."},
            ${"Harbor Labs"},
            ${"2025-11-12T11:30:00.000Z"}
          )
        `;

        await sql`
          INSERT INTO prescriptions (
            patient_id, medication, dosage, instructions, prescribed_by, starts_on, ends_on
          ) VALUES (
            ${patientId},
            ${"Atorvastatin"},
            ${"10 mg"},
            ${"Take once daily in the evening with water."},
            ${"Dr. Maya Chen"},
            ${"2025-11-12"},
            ${null}
          )
        `;
      }
    }
  }

  const doctorUsername = process.env.DEMO_DOCTOR_USERNAME?.trim();
  const doctorPassword = process.env.DEMO_DOCTOR_PASSWORD?.trim();
  if (doctorUsername && doctorPassword) {
    const doctorName =
      process.env.DEMO_DOCTOR_FULL_NAME?.trim() || "Dr. Maya Chen";
    const doctorRows = await sql`
      SELECT id FROM doctors WHERE full_name = ${doctorName}
    `;

    if (doctorRows[0]) {
      const doctorId = Number(doctorRows[0].id);
      await upsertUser(sql, {
        username: doctorUsername,
        password: doctorPassword,
        role: "doctor",
        doctorId,
      });

      if (patientId) {
        await sql`
          UPDATE appointments
          SET doctor_id = ${doctorId}
          WHERE patient_id = ${patientId}
            AND provider_name = ${doctorName}
            AND doctor_id IS NULL
        `;
      }
    }
  }

  const coordinatorUsername = process.env.DEMO_COORDINATOR_USERNAME?.trim();
  const coordinatorPassword = process.env.DEMO_COORDINATOR_PASSWORD?.trim();
  if (coordinatorUsername && coordinatorPassword) {
    await upsertUser(sql, {
      username: coordinatorUsername,
      password: coordinatorPassword,
      role: "coordinator",
    });
  }

  await upsertMeta(sql, "seeded", "1");
}

async function seedScaleDoctors() {
  const raw = process.env.DEMO_SCALE_DOCTORS?.trim();
  if (!raw) {
    return;
  }

  const target = Math.min(Math.max(Number(raw) || 0, 0), 1000);
  if (target <= 0) {
    return;
  }

  const sql = getSql();
  const clinics = await sql`SELECT id FROM clinics ORDER BY id ASC`;
  if (clinics.length === 0) {
    return;
  }

  const [{ count: current }] = await sql`
    SELECT COUNT(*)::int AS count FROM doctors
  `;
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

  await sql.begin(async (tx) => {
    for (let i = current + 1; i <= target; i++) {
      const category = categories[i % categories.length];
      await tx`
        INSERT INTO doctors (
          full_name, clinic_id, category, specialty, years_experience,
          experience_summary, education, languages, accepting_patients
        ) VALUES (
          ${`Dr. Scale ${i}`},
          ${clinics[i % clinics.length].id},
          ${category},
          ${`${category} Specialist`},
          ${3 + (i % 25)},
          ${`Scaled directory profile for doctor ${i} used to validate clinic filters and pagination.`},
          ${"MD, Harbor University"},
          ${"English"},
          ${true}
        )
      `;
    }
  });
}

async function seedServices() {
  const sql = getSql();
  const seeded = await sql`
    SELECT value FROM meta WHERE key = 'services_seeded'
  `;
  if (seeded[0]?.value === "1") {
    return;
  }

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM services`;
  if (count === 0) {
    const doctors = await sql`
      SELECT id, category, clinic_id, full_name FROM doctors ORDER BY id ASC
    `;

    const byCategory = new Map<
      string,
      Array<{ id: number; category: string; clinic_id: number | null; full_name: string }>
    >();
    for (const doctor of doctors) {
      const category = String(doctor.category);
      const list = byCategory.get(category) || [];
      list.push({
        id: Number(doctor.id),
        category,
        clinic_id: doctor.clinic_id != null ? Number(doctor.clinic_id) : null,
        full_name: String(doctor.full_name),
      });
      byCategory.set(category, list);
    }

    const catalog: Array<{
      name: string;
      specialty: string;
      description: string;
      duration: number;
    }> = [
      {
        name: "Annual wellness exam",
        specialty: "Primary Care",
        description:
          "Comprehensive preventive visit with vitals, labs review, and care planning.",
        duration: 45,
      },
      {
        name: "Chronic care follow-up",
        specialty: "Primary Care",
        description:
          "Ongoing management for hypertension, diabetes, and related conditions.",
        duration: 30,
      },
      {
        name: "Cardiology consultation",
        specialty: "Cardiology",
        description:
          "Evaluation for chest pain, heart rhythm concerns, and cardiovascular risk.",
        duration: 40,
      },
      {
        name: "Heart failure management visit",
        specialty: "Cardiology",
        description:
          "Medication titration and monitoring for heart-failure patients.",
        duration: 35,
      },
      {
        name: "Skin check",
        specialty: "Dermatology",
        description:
          "Full-body exam for moles, rashes, and early skin-cancer detection.",
        duration: 30,
      },
      {
        name: "Acne treatment consult",
        specialty: "Dermatology",
        description:
          "Assessment and treatment planning for inflammatory acne.",
        duration: 25,
      },
      {
        name: "Well-child visit",
        specialty: "Pediatrics",
        description:
          "Growth, development, and immunization review for children.",
        duration: 30,
      },
      {
        name: "Pediatric asthma review",
        specialty: "Pediatrics",
        description:
          "Action-plan update and inhaler technique coaching for families.",
        duration: 30,
      },
      {
        name: "Sports injury evaluation",
        specialty: "Orthopedics",
        description:
          "Assessment of joint and soft-tissue injuries with rehab guidance.",
        duration: 40,
      },
      {
        name: "Joint pain consultation",
        specialty: "Orthopedics",
        description:
          "Workup for chronic joint pain and mobility limitations.",
        duration: 35,
      },
      {
        name: "Initial psychiatry consult",
        specialty: "Mental Health",
        description:
          "Diagnostic interview and treatment planning for mood or anxiety concerns.",
        duration: 50,
      },
      {
        name: "Medication management visit",
        specialty: "Mental Health",
        description:
          "Follow-up for psychiatric medication response and side effects.",
        duration: 25,
      },
      {
        name: "Migraine evaluation",
        specialty: "Neurology",
        description:
          "History, trigger review, and preventive/rescue plan for migraine.",
        duration: 40,
      },
      {
        name: "Neurology follow-up",
        specialty: "Neurology",
        description:
          "Ongoing review for neuropathy, headache, or seizure care plans.",
        duration: 30,
      },
    ];

    await sql.begin(async (tx) => {
      for (const item of catalog) {
        const pool = byCategory.get(item.specialty) || [];
        const clinicId = pool[0]?.clinic_id ?? null;
        const [serviceRow] = await tx`
          INSERT INTO services (name, specialty, description, duration_minutes, clinic_id)
          VALUES (
            ${item.name},
            ${item.specialty},
            ${item.description},
            ${item.duration},
            ${clinicId}
          )
          RETURNING id
        `;
        const serviceId = Number(serviceRow.id);
        const linked = pool.slice(0, Math.min(3, pool.length));
        for (const doctor of linked) {
          await tx`
            INSERT INTO service_doctors (service_id, doctor_id)
            VALUES (${serviceId}, ${doctor.id})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    });
  }

  await upsertMeta(sql, "services_seeded", "1");
}

export async function ensureDb() {
  if (!dbReady) {
    dbReady = (async () => {
      getSql();
      await seedClinics();
      await seedDoctors();
      await seedFromEnv();
      await seedScaleDoctors();
      await seedServices();
    })();
  }
  await dbReady;
}

export async function getDb() {
  await ensureDb();
}

export async function listPatients() {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`SELECT * FROM patients ORDER BY full_name ASC`;
  return serializeRows(rows) as PatientRow[];
}

export async function getPatient(id: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`SELECT * FROM patients WHERE id = ${id}`;
  return rows[0] ? (serializeRow(rows[0]) as PatientRow) : undefined;
}

export async function createPatient(data: {
  fullName: string;
  email: string;
  phone?: string | null;
  dateOfBirth: string;
  bloodType?: string | null;
  allergies?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
  username?: string;
  password?: string;
}) {
  await ensureDb();
  const sql = getSql();

  const [row] = await sql`
    INSERT INTO patients (
      full_name, email, phone, date_of_birth, blood_type,
      allergies, emergency_contact, notes
    ) VALUES (
      ${data.fullName},
      ${data.email},
      ${data.phone ?? null},
      ${data.dateOfBirth},
      ${data.bloodType ?? null},
      ${data.allergies ?? null},
      ${data.emergencyContact ?? null},
      ${data.notes ?? null}
    )
    RETURNING id
  `;

  const patientId = Number(row.id);

  if (data.username && data.password) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    await sql`
      INSERT INTO users (username, password_hash, role, patient_id)
      VALUES (${data.username}, ${passwordHash}, ${"patient"}, ${patientId})
    `;
  }

  return (await getPatient(patientId))!;
}

export async function updatePatient(
  id: number,
  data: {
    fullName: string;
    email: string;
    phone?: string | null;
    dateOfBirth: string;
    bloodType?: string | null;
    allergies?: string | null;
    emergencyContact?: string | null;
    notes?: string | null;
  },
) {
  await ensureDb();
  const sql = getSql();
  await sql`
    UPDATE patients SET
      full_name = ${data.fullName},
      email = ${data.email},
      phone = ${data.phone ?? null},
      date_of_birth = ${data.dateOfBirth},
      blood_type = ${data.bloodType ?? null},
      allergies = ${data.allergies ?? null},
      emergency_contact = ${data.emergencyContact ?? null},
      notes = ${data.notes ?? null},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  return getPatient(id);
}

export async function deletePatient(id: number) {
  await ensureDb();
  const sql = getSql();
  await sql`DELETE FROM patients WHERE id = ${id}`;
}

export async function updatePatientProfile(
  id: number,
  data: {
    phone?: string | null;
    allergies?: string | null;
    emergencyContact?: string | null;
  },
) {
  await ensureDb();
  const sql = getSql();
  await sql`
    UPDATE patients SET
      phone = ${data.phone ?? null},
      allergies = ${data.allergies ?? null},
      emergency_contact = ${data.emergencyContact ?? null},
      updated_at = NOW()
    WHERE id = ${id}
  `;
  return getPatient(id);
}

export async function listRecords(patientId?: number) {
  await ensureDb();
  const sql = getSql();
  const rows = patientId
    ? await sql`
        SELECT * FROM medical_records
        WHERE patient_id = ${patientId}
        ORDER BY recorded_at DESC
      `
    : await sql`SELECT * FROM medical_records ORDER BY recorded_at DESC`;
  return serializeRows(rows) as MedicalRecordRow[];
}

export async function listRecordsWithPatientNames() {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT r.*, p.full_name AS patient_name
    FROM medical_records r
    JOIN patients p ON p.id = r.patient_id
    ORDER BY r.recorded_at DESC
  `;
  return serializeRows(rows) as Array<MedicalRecordRow & { patient_name: string }>;
}

export async function getRecord(id: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`SELECT * FROM medical_records WHERE id = ${id}`;
  return rows[0] ? (serializeRow(rows[0]) as MedicalRecordRow) : undefined;
}

export async function createRecord(data: {
  patientId: number;
  appointmentId?: number | null;
  title: string;
  recordType: string;
  summary: string;
  diagnosis?: string | null;
  treatment?: string | null;
  providerName?: string | null;
  recordedAt: string;
}) {
  await ensureDb();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO medical_records (
      patient_id, appointment_id, title, record_type, summary, diagnosis,
      treatment, provider_name, recorded_at
    ) VALUES (
      ${data.patientId},
      ${data.appointmentId ?? null},
      ${data.title},
      ${data.recordType},
      ${data.summary},
      ${data.diagnosis ?? null},
      ${data.treatment ?? null},
      ${data.providerName ?? null},
      ${data.recordedAt}
    )
    RETURNING id
  `;
  return getRecord(Number(row.id));
}

export async function deleteRecord(id: number) {
  await ensureDb();
  const sql = getSql();
  await sql`DELETE FROM medical_records WHERE id = ${id}`;
}

export async function listAppointments(patientId?: number) {
  await ensureDb();
  const sql = getSql();
  const rows = patientId
    ? await sql`
        SELECT * FROM appointments
        WHERE patient_id = ${patientId}
        ORDER BY scheduled_at DESC
      `
    : await sql`SELECT * FROM appointments ORDER BY scheduled_at DESC`;
  return serializeRows(rows) as AppointmentRow[];
}

export async function listAppointmentsWithPatientNames() {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT a.*, p.full_name AS patient_name
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    ORDER BY a.scheduled_at DESC
  `;
  return serializeRows(rows) as Array<AppointmentRow & { patient_name: string }>;
}

export async function getAppointment(id: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`SELECT * FROM appointments WHERE id = ${id}`;
  return rows[0] ? (serializeRow(rows[0]) as AppointmentRow) : undefined;
}

export async function createAppointment(data: {
  patientId: number;
  doctorId?: number | null;
  providerName: string;
  reason: string;
  status: "scheduled" | "completed" | "cancelled";
  scheduledAt: string;
  notes?: string | null;
}) {
  await ensureDb();
  const sql = getSql();
  let providerName = data.providerName;
  if (data.doctorId) {
    const doctor = await getDoctor(data.doctorId);
    if (doctor) {
      providerName = doctor.full_name;
    }
  }

  const [row] = await sql`
    INSERT INTO appointments (
      patient_id, doctor_id, provider_name, reason, status, scheduled_at, notes
    ) VALUES (
      ${data.patientId},
      ${data.doctorId ?? null},
      ${providerName},
      ${data.reason},
      ${data.status},
      ${data.scheduledAt},
      ${data.notes ?? null}
    )
    RETURNING id
  `;
  return getAppointment(Number(row.id));
}

export async function updateAppointmentStatus(
  id: number,
  status: "scheduled" | "completed" | "cancelled",
) {
  await ensureDb();
  const sql = getSql();
  await sql`UPDATE appointments SET status = ${status} WHERE id = ${id}`;
}

export async function deleteAppointment(id: number) {
  await ensureDb();
  const sql = getSql();
  await sql`DELETE FROM appointments WHERE id = ${id}`;
}

export async function listDoctorAppointments(doctorId: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT a.*, p.full_name AS patient_name
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    WHERE a.doctor_id = ${doctorId}
    ORDER BY a.scheduled_at DESC
  `;
  return serializeRows(rows) as Array<AppointmentRow & { patient_name: string }>;
}

export async function doctorCanAccessPatient(
  doctorId: number,
  patientId: number,
) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT id FROM appointments
    WHERE doctor_id = ${doctorId} AND patient_id = ${patientId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function findAppointmentForDoctorPatient(
  appointmentId: number,
  doctorId: number,
  patientId: number,
) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT id FROM appointments
    WHERE id = ${appointmentId}
      AND doctor_id = ${doctorId}
      AND patient_id = ${patientId}
  `;
  return rows[0] ? Number(rows[0].id) : undefined;
}

export async function listPrescriptions(patientId: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM prescriptions
    WHERE patient_id = ${patientId}
    ORDER BY starts_on DESC
  `;
  return serializeRows(rows) as PrescriptionRow[];
}

export async function findUserByUsername(username: string) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE username = ${username}`;
  return rows[0] ? (serializeRow(rows[0]) as UserRow) : undefined;
}

export async function findUserById(id: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return rows[0] ? (serializeRow(rows[0]) as UserRow) : undefined;
}

export async function listUsers() {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.username, u.role, u.patient_id, u.doctor_id, u.created_at,
           p.full_name AS patient_name, d.full_name AS doctor_name
    FROM users u
    LEFT JOIN patients p ON p.id = u.patient_id
    LEFT JOIN doctors d ON d.id = u.doctor_id
    ORDER BY u.created_at DESC
  `;
  return serializeRows(rows) as Array<{
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

export async function createPatientUser(
  username: string,
  passwordHash: string,
  patientId: number,
) {
  await ensureDb();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO users (username, password_hash, role, patient_id)
    VALUES (${username}, ${passwordHash}, ${"patient"}, ${patientId})
    RETURNING id
  `;
  return Number(row.id);
}

export async function listDoctors(category?: string) {
  await ensureDb();
  const sql = getSql();
  const rows =
    category && category !== "All"
      ? await sql`
          SELECT ${sql.unsafe(DOCTOR_SELECT)}
          FROM doctors d
          WHERE d.category = ${category}
          ORDER BY d.category ASC, d.full_name ASC
        `
      : await sql`
          SELECT ${sql.unsafe(DOCTOR_SELECT)}
          FROM doctors d
          ORDER BY d.category ASC, d.full_name ASC
        `;
  return serializeRows(rows) as DoctorRow[];
}

export async function searchDoctors(options?: {
  query?: string;
  category?: string;
  clinicId?: number | null;
  page?: number;
  pageSize?: number;
}) {
  await ensureDb();
  const sql = getSql();

  const query = options?.query?.trim() || "";
  const category =
    options?.category && options.category !== "All"
      ? options.category.trim()
      : "";
  const clinicId =
    options?.clinicId && options.clinicId > 0 ? options.clinicId : null;
  const pageSize = Math.min(Math.max(options?.pageSize || 10, 1), 50);
  const page = Math.max(options?.page || 1, 1);
  const offset = (page - 1) * pageSize;

  const conditions = [sql`TRUE`];
  if (clinicId) {
    conditions.push(sql`d.clinic_id = ${clinicId}`);
  }
  if (category) {
    conditions.push(sql`d.category = ${category}`);
  }
  if (query) {
    const like = `%${query}%`;
    conditions.push(sql`(
      d.full_name ILIKE ${like}
      OR d.specialty ILIKE ${like}
      OR d.experience_summary ILIKE ${like}
      OR d.education ILIKE ${like}
      OR d.languages ILIKE ${like}
      OR c.name ILIKE ${like}
      OR c.city ILIKE ${like}
    )`);
  }
  const whereClause = conditions.reduce(
    (accumulator, condition) => sql`${accumulator} AND ${condition}`,
  );

  const [{ count: total }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM doctors d
    LEFT JOIN clinics c ON c.id = d.clinic_id
    WHERE ${whereClause}
  `;

  const doctors = await sql`
    SELECT ${sql.unsafe(DOCTOR_SELECT)}, c.name AS clinic_name, c.city AS clinic_city
    FROM doctors d
    LEFT JOIN clinics c ON c.id = d.clinic_id
    WHERE ${whereClause}
    ORDER BY c.name ASC, d.category ASC, d.full_name ASC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  return {
    doctors: serializeRows(doctors) as DoctorListItem[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getDoctor(id: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(DOCTOR_SELECT)}
    FROM doctors d
    WHERE d.id = ${id}
  `;
  return rows[0] ? (serializeRow(rows[0]) as DoctorRow) : undefined;
}

export async function createDoctor(data: {
  fullName: string;
  clinicId: number | null;
  category: string;
  specialty: string;
  yearsExperience: number;
  experienceSummary: string;
  education?: string | null;
  languages?: string | null;
  acceptingPatients?: boolean;
}) {
  await ensureDb();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO doctors (
      full_name, clinic_id, category, specialty, years_experience,
      experience_summary, education, languages, accepting_patients
    ) VALUES (
      ${data.fullName},
      ${data.clinicId},
      ${data.category},
      ${data.specialty},
      ${data.yearsExperience},
      ${data.experienceSummary},
      ${data.education ?? null},
      ${data.languages ?? null},
      ${data.acceptingPatients !== false}
    )
    RETURNING id
  `;
  return getDoctor(Number(row.id));
}

export async function deleteDoctor(id: number) {
  await ensureDb();
  const sql = getSql();
  await sql`DELETE FROM doctors WHERE id = ${id}`;
}

export async function listDoctorCategories() {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT category, COUNT(*)::int AS count
    FROM doctors
    GROUP BY category
    ORDER BY category ASC
  `;
  return serializeRows(rows) as Array<{ category: string; count: number }>;
}

export async function listClinics() {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT c.*, COUNT(d.id)::int AS doctor_count
    FROM clinics c
    LEFT JOIN doctors d ON d.clinic_id = c.id
    GROUP BY c.id
    ORDER BY c.name ASC
  `;
  return serializeRows(rows) as ClinicSummary[];
}

export async function getClinic(id: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`SELECT * FROM clinics WHERE id = ${id}`;
  return rows[0] ? (serializeRow(rows[0]) as ClinicRow) : undefined;
}

export async function createClinic(data: {
  name: string;
  city: string;
  address: string;
  phone?: string | null;
  description?: string | null;
}) {
  await ensureDb();
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO clinics (name, city, address, phone, description)
    VALUES (
      ${data.name},
      ${data.city},
      ${data.address},
      ${data.phone ?? null},
      ${data.description ?? null}
    )
    RETURNING id
  `;
  return getClinic(Number(row.id));
}

export async function deleteClinic(id: number) {
  await ensureDb();
  const sql = getSql();
  await sql`DELETE FROM clinics WHERE id = ${id}`;
}

export async function listServiceSpecialties() {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT specialty, COUNT(*)::int AS count
    FROM services
    GROUP BY specialty
    ORDER BY specialty ASC
  `;
  return serializeRows(rows) as Array<{ specialty: string; count: number }>;
}

export async function listDoctorsForFilter(options?: {
  specialty?: string;
  limit?: number;
}) {
  await ensureDb();
  const sql = getSql();
  const specialty =
    options?.specialty && options.specialty !== "All"
      ? options.specialty.trim()
      : "";
  const limit = Math.min(Math.max(options?.limit || 200, 1), 500);

  const rows = specialty
    ? await sql`
        SELECT id, full_name, category, specialty, clinic_id
        FROM doctors
        WHERE category = ${specialty}
        ORDER BY full_name ASC
        LIMIT ${limit}
      `
    : await sql`
        SELECT id, full_name, category, specialty, clinic_id
        FROM doctors
        ORDER BY full_name ASC
        LIMIT ${limit}
      `;

  return serializeRows(rows) as Array<{
    id: number;
    full_name: string;
    category: string;
    specialty: string;
    clinic_id: number | null;
  }>;
}

export async function searchServices(options?: {
  query?: string;
  specialty?: string;
  doctorId?: number | null;
  clinicId?: number | null;
  page?: number;
  pageSize?: number;
}) {
  await ensureDb();
  const sql = getSql();

  const query = options?.query?.trim() || "";
  const specialty =
    options?.specialty && options.specialty !== "All"
      ? options.specialty.trim()
      : "";
  const doctorId =
    options?.doctorId && options.doctorId > 0 ? options.doctorId : null;
  const clinicId =
    options?.clinicId && options.clinicId > 0 ? options.clinicId : null;
  const pageSize = Math.min(Math.max(options?.pageSize || 10, 1), 50);
  const page = Math.max(options?.page || 1, 1);
  const offset = (page - 1) * pageSize;

  const conditions = [sql`TRUE`];
  if (specialty) {
    conditions.push(sql`s.specialty = ${specialty}`);
  }
  if (clinicId) {
    conditions.push(sql`s.clinic_id = ${clinicId}`);
  }
  if (doctorId) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM service_doctors sd
      WHERE sd.service_id = s.id AND sd.doctor_id = ${doctorId}
    )`);
  }
  if (query) {
    const like = `%${query}%`;
    conditions.push(sql`(
      s.name ILIKE ${like}
      OR s.description ILIKE ${like}
      OR s.specialty ILIKE ${like}
      OR c.name ILIKE ${like}
    )`);
  }
  const whereClause = conditions.reduce(
    (accumulator, condition) => sql`${accumulator} AND ${condition}`,
  );

  const [{ count: total }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM services s
    LEFT JOIN clinics c ON c.id = s.clinic_id
    WHERE ${whereClause}
  `;

  const serviceRows = await sql`
    SELECT
      s.*,
      c.name AS clinic_name,
      COALESCE((
        SELECT STRING_AGG(d.full_name, ', ' ORDER BY d.full_name)
        FROM service_doctors sd
        JOIN doctors d ON d.id = sd.doctor_id
        WHERE sd.service_id = s.id
      ), '') AS doctor_names,
      COALESCE((
        SELECT STRING_AGG(d.id::text, ',' ORDER BY d.full_name)
        FROM service_doctors sd
        JOIN doctors d ON d.id = sd.doctor_id
        WHERE sd.service_id = s.id
      ), '') AS doctor_ids
    FROM services s
    LEFT JOIN clinics c ON c.id = s.clinic_id
    WHERE ${whereClause}
    ORDER BY s.specialty ASC, s.name ASC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  return {
    services: serializeRows(serviceRows) as ServiceListItem[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getService(id: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`SELECT * FROM services WHERE id = ${id}`;
  return rows[0] ? (serializeRow(rows[0]) as ServiceRow) : undefined;
}

export async function getServiceById(id: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT
      s.*,
      c.name AS clinic_name,
      COALESCE((
        SELECT STRING_AGG(d.full_name, ', ' ORDER BY d.full_name)
        FROM service_doctors sd
        JOIN doctors d ON d.id = sd.doctor_id
        WHERE sd.service_id = s.id
      ), '') AS doctor_names,
      COALESCE((
        SELECT STRING_AGG(d.id::text, ',' ORDER BY d.full_name)
        FROM service_doctors sd
        JOIN doctors d ON d.id = sd.doctor_id
        WHERE sd.service_id = s.id
      ), '') AS doctor_ids
    FROM services s
    LEFT JOIN clinics c ON c.id = s.clinic_id
    WHERE s.id = ${id}
  `;
  return rows[0] ? (serializeRow(rows[0]) as ServiceListItem) : undefined;
}

export async function listServices() {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT
      s.*,
      c.name AS clinic_name,
      COALESCE((
        SELECT STRING_AGG(d.full_name, ', ' ORDER BY d.full_name)
        FROM service_doctors sd
        JOIN doctors d ON d.id = sd.doctor_id
        WHERE sd.service_id = s.id
      ), '') AS doctor_names,
      COALESCE((
        SELECT STRING_AGG(d.id::text, ',' ORDER BY d.full_name)
        FROM service_doctors sd
        JOIN doctors d ON d.id = sd.doctor_id
        WHERE sd.service_id = s.id
      ), '') AS doctor_ids
    FROM services s
    LEFT JOIN clinics c ON c.id = s.clinic_id
    ORDER BY s.specialty ASC, s.name ASC
  `;
  return serializeRows(rows) as ServiceListItem[];
}

export async function listServiceDoctorIds(serviceId: number) {
  await ensureDb();
  const sql = getSql();
  const rows = await sql`
    SELECT doctor_id FROM service_doctors WHERE service_id = ${serviceId}
  `;
  return rows.map((row) => Number(row.doctor_id));
}

type ServiceWriteInput = {
  name: string;
  specialty: string;
  description: string;
  durationMinutes?: number | null;
  clinicId?: number | null;
  doctorIds: number[];
};

async function resolveServiceClinicId(
  clinicId: number | null | undefined,
  doctorIds: number[],
) {
  if (clinicId) {
    return clinicId;
  }
  if (!doctorIds.length) {
    return null;
  }
  const sql = getSql();
  const rows = await sql`
    SELECT clinic_id FROM doctors WHERE id = ${doctorIds[0]}
  `;
  return rows[0]?.clinic_id != null ? Number(rows[0].clinic_id) : null;
}

async function replaceServiceDoctors(
  serviceId: number,
  doctorIds: number[],
) {
  const sql = getSql();
  await sql`DELETE FROM service_doctors WHERE service_id = ${serviceId}`;
  for (const doctorId of doctorIds) {
    await sql`
      INSERT INTO service_doctors (service_id, doctor_id)
      VALUES (${serviceId}, ${doctorId})
      ON CONFLICT DO NOTHING
    `;
  }
}

export async function createService(input: ServiceWriteInput) {
  await ensureDb();
  const sql = getSql();
  const clinicId = await resolveServiceClinicId(input.clinicId, input.doctorIds);
  const [row] = await sql`
    INSERT INTO services (name, specialty, description, duration_minutes, clinic_id)
    VALUES (
      ${input.name},
      ${input.specialty},
      ${input.description},
      ${input.durationMinutes ?? null},
      ${clinicId}
    )
    RETURNING id
  `;
  const id = Number(row.id);
  await replaceServiceDoctors(id, input.doctorIds);
  return id;
}

export async function updateService(id: number, input: ServiceWriteInput) {
  await ensureDb();
  const sql = getSql();
  const clinicId = await resolveServiceClinicId(input.clinicId, input.doctorIds);
  await sql`
    UPDATE services
    SET name = ${input.name},
        specialty = ${input.specialty},
        description = ${input.description},
        duration_minutes = ${input.durationMinutes ?? null},
        clinic_id = ${clinicId},
        updated_at = NOW()
    WHERE id = ${id}
  `;
  await replaceServiceDoctors(id, input.doctorIds);
}

export async function deleteService(id: number) {
  await ensureDb();
  const sql = getSql();
  await sql`DELETE FROM services WHERE id = ${id}`;
}

export async function getDashboardStats() {
  await ensureDb();
  const sql = getSql();

  const [{ count: patients }] = await sql`
    SELECT COUNT(*)::int AS count FROM patients
  `;
  const [{ count: records }] = await sql`
    SELECT COUNT(*)::int AS count FROM medical_records
  `;
  const [{ count: appointments }] = await sql`
    SELECT COUNT(*)::int AS count FROM appointments WHERE status = 'scheduled'
  `;
  const [{ count: users }] = await sql`
    SELECT COUNT(*)::int AS count FROM users
  `;
  const [{ count: doctors }] = await sql`
    SELECT COUNT(*)::int AS count FROM doctors
  `;
  const [{ count: clinics }] = await sql`
    SELECT COUNT(*)::int AS count FROM clinics
  `;
  const [{ count: services }] = await sql`
    SELECT COUNT(*)::int AS count FROM services
  `;

  return { patients, records, appointments, users, doctors, clinics, services };
}
