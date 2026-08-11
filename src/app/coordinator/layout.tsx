import { redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const links = [
  { href: "/coordinator", label: "Overview" },
  { href: "/coordinator/patients", label: "Patients" },
  { href: "/coordinator/appointments", label: "Appointments" },
];

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  getDb();
  const session = await requireSession("coordinator");
  if (!session) {
    redirect("/login");
  }

  return (
    <PortalShell
      brandNote="Care coordination"
      title={session.username}
      links={links}
    >
      {children}
    </PortalShell>
  );
}
