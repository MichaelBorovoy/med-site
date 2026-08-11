import { Suspense } from "react";
import Link from "next/link";
import { DoctorsDirectory } from "@/components/doctors/DoctorsDirectory";
import { getSession } from "@/lib/auth";
import { getDb, listDoctorCategories, searchDoctors } from "@/lib/db";
import { homeForRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  page?: string;
}>;

export default async function PublicDoctorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  getDb();
  const session = await getSession();
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const category = params.category?.trim() || "All";
  const page = Number(params.page || "1") || 1;

  const result = searchDoctors({
    query,
    category,
    page,
    pageSize: 10,
  });
  const categories = listDoctorCategories();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]"
            >
              HarborCare
            </Link>
            <p className="text-sm text-[var(--muted)]">
              Public doctor directory
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 text-sm text-[var(--ink-soft)] hover:bg-white"
            >
              Home
            </Link>
            <Link
              href={session ? homeForRole(session.role) : "/login"}
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
            >
              {session ? "Open portal" : "Sign in"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] md:text-5xl">
            Meet the care team
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Search and filter doctors by category. Results are paginated so large
            directories stay fast.
          </p>
        </div>
        <Suspense fallback={<p className="text-[var(--muted)]">Loading doctors…</p>}>
          <DoctorsDirectory
            doctors={result.doctors}
            categories={categories}
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
            totalPages={result.totalPages}
            initialQuery={query}
            initialCategory={category}
          />
        </Suspense>
      </main>
    </div>
  );
}
