import Link from "next/link";
import { DoctorsDirectory } from "@/components/doctors/DoctorsDirectory";
import { getDb, listDoctorCategories, listDoctors } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublicDoctorsPage() {
  getDb();
  const doctors = listDoctors();
  const categories = listDoctorCategories();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]">
              HarborCare
            </p>
            <p className="text-sm text-[var(--muted)]">Doctor directory</p>
          </div>
          <Link
            href="/login"
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] md:text-5xl">
            Meet the care team
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Explore doctors by category and learn about their clinical
            experience.
          </p>
        </div>
        <DoctorsDirectory doctors={doctors} categories={categories} />
      </main>
    </div>
  );
}
