import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/utils/supabaseServerClient";

export async function POST(req: Request) {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.split(" ")[1]?.trim()
    : null;

  const supabase = await createSupabaseServerClient(bearerToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // Check if user is a moderator
    const { data: roles, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("profile_id", user.id)
      .in("role", ["moderator", "admin", "developer"]);

    if (roleError || !roles || roles.length === 0) {
      return NextResponse.json(
        { error: "Access denied. Moderator role required." },
        { status: 403 },
      );
    }

    // Get current credits
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("credit_score")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Failed to read credits", details: profileError?.message },
        { status: 500 },
      );
    }

    const { amount = 500 } = await req.json().catch(() => ({}));
    const currentCredits = profile?.credit_score ?? 0;
    const newCredits = currentCredits + amount;

    // Update credits
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ credit_score: newCredits })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update credits", details: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Credits added successfully",
        previousCredits: currentCredits,
        newCredits: newCredits,
        amountAdded: amount,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
