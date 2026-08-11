import { redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { requireSession } from "@/lib/auth";
import { ensureDb, getDoctor } from "@/lib/db";

const links = [
  { href: "/doctor", label: "Dashboard" },
  { href: "/doctor/appointments", label: "Appointments" },
  { href: "/doctor/records", label: "Documents" },
];

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDb();
  const session = await requireSession("doctor");
  if (!session?.doctorId) {
    redirect("/login");
  }

  const doctor = await getDoctor(session.doctorId);
  if (!doctor) {
    redirect("/login");
  }

  return (
    <PortalShell
      brandNote="Doctor workspace"
      title={doctor.full_name}
      links={links}
    >
      {children}
    </PortalShell>
  );
}
