import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceRoleClient, getActiveEnrollmentCycle, getEnrollmentStateForUser } from "@/lib/enrollment";
import { createClient } from "@/utils/supabaseServerClient";

function toBearerToken(authHeader: string | null) {
  return authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.split(" ")[1]?.trim() ?? null
    : null;
}

export async function GET() {
  const headerStore = await headers();
  const bearerToken = toBearerToken(headerStore.get("authorization"));
  const supabase = await createClient(bearerToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    const status = userError.status === 401 ? 401 : 500;
    const message =
      userError.status === 401 || userError.message === "Auth session missing!"
        ? "Not authenticated"
        : userError.message;
    return NextResponse.json({ error: message }, { status });
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const adminClient = createServiceRoleClient();
    const enrollment = await getEnrollmentStateForUser(adminClient, user.id);
    return NextResponse.json(enrollment, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load enrollment." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const headerStore = await headers();
  const bearerToken = toBearerToken(headerStore.get("authorization"));
  const supabase = await createClient(bearerToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    const status = userError.status === 401 ? 401 : 500;
    const message =
      userError.status === 401 || userError.message === "Auth session missing!"
        ? "Not authenticated"
        : userError.message;
    return NextResponse.json({ error: message }, { status });
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let payload: { courseIds?: string[] } | null = null;
  try {
    payload = (await req.json()) as { courseIds?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const courseIds = Array.isArray(payload?.courseIds)
    ? Array.from(new Set(payload.courseIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)))
    : [];

  try {
    const adminClient = createServiceRoleClient();
    const activeCycle = await getActiveEnrollmentCycle(adminClient);
    if (!activeCycle) {
      return NextResponse.json(
        { error: "No active enrollment cycle is configured." },
        { status: 409 },
      );
    }

    if (courseIds.length > 0) {
      const { data: validCourses, error: courseError } = await adminClient
        .from("courses")
        .select("id")
        .in("id", courseIds);

      if (courseError) {
        throw courseError;
      }

      const validIds = new Set((validCourses ?? []).map((row: { id: string }) => row.id));
      if (validIds.size !== courseIds.length) {
        return NextResponse.json(
          { error: "One or more selected courses are invalid." },
          { status: 400 },
        );
      }
    }

    const { error: deleteError } = await adminClient
      .from("profile_course_enrollments")
      .delete()
      .eq("profile_id", user.id)
      .eq("cycle_id", activeCycle.id);

    if (deleteError) {
      throw deleteError;
    }

    if (courseIds.length > 0) {
      const rows = courseIds.map((courseId) => ({
        profile_id: user.id,
        course_id: courseId,
        cycle_id: activeCycle.id,
      }));

      const { error: insertError } = await adminClient
        .from("profile_course_enrollments")
        .insert(rows);

      if (insertError) {
        throw insertError;
      }
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ last_completed_enrollment_cycle_id: activeCycle.id })
      .eq("id", user.id);

    if (profileError) {
      throw profileError;
    }

    const enrollment = await getEnrollmentStateForUser(adminClient, user.id);
    return NextResponse.json(enrollment, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save enrollment." },
      { status: 500 },
    );
  }
}
