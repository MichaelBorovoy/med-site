import { redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { requireSession } from "@/lib/auth";
import { ensureDb } from "@/lib/db";

export const dynamic = "force-dynamic";

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
  await ensureDb();
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
