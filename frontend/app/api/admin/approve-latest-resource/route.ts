import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabaseServerClient";

type ResourceRow = {
  id: string;
  title: string;
  status: string;
};

export async function POST() {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.split(" ")[1]?.trim()
    : null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  const supabase = await createServerClient(bearerToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: roles } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("profile_id", user.id)
    .in("role", ["admin", "moderator", "developer"]);

  if (!roles || roles.length === 0) {
    return NextResponse.json(
      { error: "Only admins or moderators can approve notes." },
      { status: 403 },
    );
  }

  // Find the most recently created pending resource and approve it.
  const { data: rows, error: listError } = await adminClient
    .from("resources")
    .select("id, title, status")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<ResourceRow[]>();

  if (listError) {
    return NextResponse.json(
      { error: "Failed to list resources.", details: listError.message },
      { status: 500 },
    );
  }

  const resource = rows?.[0];
  if (!resource) {
    return NextResponse.json(
      { ok: false, message: "No pending resources to approve." },
      { status: 200 },
    );
  }

  const { error: updateError } = await adminClient
    .from("resources")
    .update({ status: "active" })
    .eq("id", resource.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to approve resource.", details: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      id: resource.id,
      title: resource.title,
      previousStatus: resource.status,
      newStatus: "active",
    },
    { status: 200 },
  );
}

