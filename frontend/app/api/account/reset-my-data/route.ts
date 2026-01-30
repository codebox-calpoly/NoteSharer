import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabaseServerClient";

async function runReset(userId: string): Promise<
  | { ok: true; message: string; status: 200 }
  | { ok: false; error: string; status: 500 }
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { ok: false, error: "Server configuration error.", status: 500 };
  }
  const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);

  const { error: downloadsError } = await adminClient
    .from("resource_downloads")
    .delete()
    .eq("profile_id", userId);

  if (downloadsError) {
    return { ok: false, error: downloadsError.message, status: 500 };
  }

  const { error: votesError } = await adminClient
    .from("votes")
    .delete()
    .gte("id", 0);

  if (votesError) {
    return { ok: false, error: votesError.message, status: 500 };
  }

  return {
    ok: true,
    message:
      "Your downloads reverted and all votes (everyone's) removed. Reload the dashboard to see notes as undownloaded and counts at zero.",
    status: 200,
  };
}

/**
 * GET or POST /api/account/reset-my-data
 * Reverts the current user's download records (notes show as undownloaded)
 * and deletes ALL votes from every note (everyone's). Requires auth.
 * Visiting the URL in the browser (GET) while logged in runs the reset.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: userError?.message ?? "Not authenticated" },
      { status: 401 },
    );
  }

  const result = await runReset(user.id);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
  return NextResponse.json(
    { ok: true, message: result.message },
    { status: result.status },
  );
}

export async function POST() {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.split(" ")[1]?.trim()
    : null;

  const supabase = await createClient(bearerToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: userError?.message ?? "Not authenticated" },
      { status: 401 },
    );
  }

  const result = await runReset(user.id);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }
  return NextResponse.json(
    { ok: true, message: result.message },
    { status: result.status },
  );
}
