import "server-only";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_SIGNED_URL_TTL_SECONDS = 3600;

let adminClient: ReturnType<typeof createClient> | null = null;

const getAdminClient = () => {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase service role credentials are not configured.");
  }

  adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return adminClient;
};

export const SIGNED_URL_TTL_SECONDS = DEFAULT_SIGNED_URL_TTL_SECONDS;

export async function generateSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  if (!bucket || !filePath) {
    throw new Error("Bucket and file path are required to generate a signed URL.");
  }

  const { data, error } = await getAdminClient()
    .storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message ?? "Unknown error"}`);
  }

  return data.signedUrl;
}
