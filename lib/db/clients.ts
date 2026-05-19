import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-safe client.
 * Gated by Row-Level Security. Use this in Client Components and any code
 * that runs in the browser.
 */
export function getBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in env",
    );
  }

  return createClient(url, publishableKey, {
    auth: { persistSession: false },
  });
}

/**
 * Server-only client. Uses the secret key and BYPASSES RLS.
 * Use in API routes and the orchestrator for writes. Never import from a
 * Client Component.
 */
export function getServerClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("getServerClient() must not be called in the browser");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env",
    );
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false },
  });
}
