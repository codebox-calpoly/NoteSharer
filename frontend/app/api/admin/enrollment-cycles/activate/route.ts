import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/enrollment";
import { createClient } from "@/utils/supabaseServerClient";

function toBearerToken(authHeader: string | null) {
  return authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.split(" ")[1]?.trim() ?? null
    : null;
}

export async function POST(req: Request) {
  const headerStore = await headers();
  const bearerToken = toBearerToken(headerStore.get("authorization"));
  const supabase = await createClient(bearerToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let payload: { name?: string; catalogTerm?: string | null } | null = null;
  try {
    payload = (await req.json()) as { name?: string; catalogTerm?: string | null };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = payload?.name?.trim();
  const catalogTerm =
    typeof payload?.catalogTerm === "string" && payload.catalogTerm.trim().length > 0
      ? payload.catalogTerm.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  try {
    const adminClient = createServiceRoleClient();
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("profile_id", user.id)
      .in("role", ["admin", "developer"]);

    if (!roles || roles.length === 0) {
      return NextResponse.json(
        { error: "Only admins or developers can activate enrollment cycles." },
        { status: 403 },
      );
    }

    const { error: deactivateError } = await adminClient
      .from("enrollment_cycles")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) {
      throw deactivateError;
    }

    const { data: cycle, error: insertError } = await adminClient
      .from("enrollment_cycles")
      .insert({
        name,
        catalog_term: catalogTerm,
        is_active: true,
        created_by: user.id,
      })
      .select("id, name, catalog_term, is_active")
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(
      {
        cycle: {
          id: cycle.id,
          name: cycle.name,
          catalogTerm: cycle.catalog_term,
          isActive: cycle.is_active,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to activate enrollment cycle." },
      { status: 500 },
    );
  }
}
