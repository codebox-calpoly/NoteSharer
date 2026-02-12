import { createClient, type AuthError, type Session, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

const isStaleRefreshTokenError = (error: AuthError | null) => {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found") ||
    message.includes("refresh_token_not_found")
  );
};

export async function getSessionWithRecovery(
  client: SupabaseClient = supabase,
): Promise<{ session: Session | null; error: AuthError | null; recovered: boolean }> {
  const { data, error } = await client.auth.getSession();
  if (!isStaleRefreshTokenError(error)) {
    return { session: data.session, error, recovered: false };
  }

  // Stale browser session: clear local auth state and continue as signed out.
  await client.auth.signOut({ scope: "local" });
  return { session: null, error: null, recovered: true };
}
