import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// ── Timeout-aware fetch ─────────────────────────────────────────────────────
// Wraps the global fetch to reject if the Supabase Auth API doesn't respond
// within 8 seconds. Prevents requests from hanging indefinitely.
const TIMEOUT_MS = 8_000;

function fetchWithTimeout(input, init) {
  return Promise.race([
    globalThis.fetch(input, init),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Supabase request timed out after ${TIMEOUT_MS}ms`)),
        TIMEOUT_MS,
      ),
    ),
  ]);
}

// Only create clients if URL and keys are available
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          // Service role client doesn't need session persistence
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: fetchWithTimeout,
        },
      })
    : null;

export default supabase;
