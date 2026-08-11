import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireSession } from "@/lib/auth";
import { ensureDb } from "@/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDb();
  const session = await requireSession("admin");
  if (!session) {
    redirect("/login");
  }

  return <AdminShell username={session.username}>{children}</AdminShell>;
}
