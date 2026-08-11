"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    try {
      await apiClient<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className="rounded-md border border-[var(--line)] bg-white/70 px-3 py-1.5 text-sm text-[var(--ink)] transition hover:bg-white disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
