import { redirect } from "next/navigation";
import { PatientShell } from "@/components/patient/PatientShell";
import { requireSession } from "@/lib/auth";
import { ensureDb, getPatient } from "@/lib/db";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDb();
  const session = await requireSession("patient");
  if (!session || !session.patientId) {
    redirect("/login");
  }

  const patient = await getPatient(session.patientId);
  if (!patient) {
    redirect("/login");
  }

  return <PatientShell name={patient.full_name}>{children}</PatientShell>;
}
