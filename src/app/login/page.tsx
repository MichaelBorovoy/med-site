import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/auth";
import { ensureDb } from "@/lib/db";
import { homeForRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await ensureDb();
  const session = await getSession();

  if (session) {
    redirect(homeForRole(session.role));
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-700/10 blur-3xl" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--panel)] shadow-[0_30px_80px_rgba(20,48,43,0.08)] md:grid-cols-[1.1fr_0.9fr]">
        <section className="relative min-h-[320px] bg-[linear-gradient(145deg,#0f766e_0%,#134e4a_55%,#164e63_100%)] p-8 text-white md:min-h-[520px] md:p-10">
          <div
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.18), transparent 35%)",
            }}
          />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <p className="font-[family-name:var(--font-display)] text-4xl tracking-tight md:text-5xl">
                HarborCare
              </p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-teal-50/90 md:text-base">
                Role-based access for guests, patients, doctors, coordinators,
                and admins.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-teal-50/85">
              <li>Guest: public doctor and clinic info</li>
              <li>Patient: own records and profile only</li>
              <li>Doctor / coordinator / admin workspaces</li>
            </ul>
          </div>
        </section>

        <section className="flex flex-col justify-center p-8 md:p-10">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Use credentials from your local environment setup.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-6 text-sm text-[var(--muted)]">
            Guest access?{" "}
            <Link
              href="/"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              View public info
            </Link>{" "}
            or{" "}
            <Link
              href="/doctors"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              browse doctors
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
