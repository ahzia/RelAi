/**
 * Smoke-test for Supabase env vars and connectivity.
 *
 * Run with:
 *   pnpm exec tsx --env-file=.env scripts/check-supabase.ts
 *
 * Exits 0 if both clients can connect to the project, 1 otherwise.
 * Does NOT require the schema to be applied — uses a non-existent table.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!url) fail("NEXT_PUBLIC_SUPABASE_URL is not set");
if (!publishable) fail("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set");
if (!secret) fail("SUPABASE_SECRET_KEY is not set");

console.log(`→ Project: ${url}`);

type CheckResult = { ok: boolean; detail: string };

async function ping(label: string, key: string): Promise<CheckResult> {
  const sb = createClient(url!, key, { auth: { persistSession: false } });
  const { error } = await sb.from("_relai_smoke_test_").select("*").limit(1);

  if (!error) {
    return { ok: true, detail: "(table somehow exists — unexpected but harmless)" };
  }

  // Expected codes when the table doesn't exist:
  //   42P01 — undefined_table (Postgres)
  //   PGRST205 — schema cache miss (PostgREST)
  if (error.code === "42P01" || error.code === "PGRST205") {
    return { ok: true, detail: `connected (table missing as expected — ${error.code})` };
  }

  // Auth errors are the most informative failure mode:
  //   401 — invalid key
  //   403 — RLS denial (only the publishable key would see this)
  return { ok: false, detail: `${error.code ?? "?"} — ${error.message}` };
}

async function main(): Promise<void> {
  const browser = await ping("publishable key", publishable!);
  console.log(`${browser.ok ? "✓" : "✗"} publishable key: ${browser.detail}`);

  const server = await ping("secret key", secret!);
  console.log(`${server.ok ? "✓" : "✗"} secret key:      ${server.detail}`);

  process.exit(browser.ok && server.ok ? 0 : 1);
}

main().catch((err) => fail(String(err)));
