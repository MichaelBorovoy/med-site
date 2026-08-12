import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

let sqlInstance: Sql | null = null;

function requireDatabaseUrl() {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    "";
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set (local Docker Postgres or production Supabase URI).",
    );
  }
  return url;
}

function isLocalDatabaseUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "db" ||
      hostname === "postgres"
    );
  } catch {
    return false;
  }
}

function shouldUseSsl(url: string) {
  const flag = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "disable") {
    return false;
  }
  if (flag === "true" || flag === "1" || flag === "require") {
    return "require" as const;
  }
  // Default: SSL off for local Docker Postgres, on for Supabase/hosted.
  return isLocalDatabaseUrl(url) ? false : ("require" as const);
}

export function getSql() {
  if (sqlInstance) {
    return sqlInstance;
  }

  const url = requireDatabaseUrl();
  // Transaction pooler (port 6543) does not support prepared statements.
  const usePooler = url.includes(":6543") || url.includes("pooler.supabase");

  sqlInstance = postgres(url, {
    ssl: shouldUseSsl(url),
    max: 10,
    prepare: !usePooler,
    idle_timeout: 20,
    connect_timeout: 30,
  });

  return sqlInstance;
}

export function serializeRow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(out)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
    } else if (typeof value === "bigint") {
      out[key] = Number(value);
    }
  }
  return out as T;
}

export function serializeRows<T extends Record<string, unknown>>(rows: T[]) {
  return rows.map((row) => serializeRow(row));
}
