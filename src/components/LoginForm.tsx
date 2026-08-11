"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ROLE_HOME, type UserRole } from "@/lib/types";

type LoginResponse = {
  user: {
    id: number;
    username: string;
    role: UserRole;
    patientId: number | null;
    doctorId: number | null;
  };
};

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const data = await apiClient<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      router.replace(ROLE_HOME[data.user.role]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--ink-soft)]">
          Username
        </span>
        <input
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2.5 text-[var(--ink)] outline-none ring-[var(--accent)] transition focus:ring-2"
          required
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--ink-soft)]">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2.5 text-[var(--ink)] outline-none ring-[var(--accent)] transition focus:ring-2"
          required
        />
      </label>

      {error ? (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
