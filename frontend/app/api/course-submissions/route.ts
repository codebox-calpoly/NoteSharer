import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabaseServerClient";

type SubmissionPayload = {
  department?: string;
  course_number?: string;
  title?: string | null;
  term?: string | null;
  year?: number | null;
  justification?: string | null;
};

export async function POST(request: Request) {
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

  let payload: SubmissionPayload;
  try {
    payload = (await request.json()) as SubmissionPayload;
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const department =
    typeof payload.department === "string" ? payload.department.trim() : "";
  const courseNumber =
    typeof payload.course_number === "string"
      ? payload.course_number.trim()
      : "";

  if (!department || !courseNumber) {
    return NextResponse.json(
      { error: "Department and course number are required." },
      { status: 400 }
    );
  }

  const title =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title.trim()
      : null;
  const term =
    typeof payload.term === "string" && payload.term.trim()
      ? payload.term.trim()
      : null;
  const justification =
    typeof payload.justification === "string" && payload.justification.trim()
      ? payload.justification.trim()
      : null;

  const year =
    typeof payload.year === "number" && Number.isFinite(payload.year)
      ? Math.trunc(payload.year)
      : null;

  const { error: insertError } = await supabase.from("course_submissions").insert(
    {
      submitter_id: user.id,
      department,
      course_number: courseNumber,
      title,
      term,
      year,
      justification,
    }
  );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
