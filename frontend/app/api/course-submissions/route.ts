import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Resend } from "resend";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const notifyEmail = process.env.COURSE_REQUEST_NOTIFY_EMAIL?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.COURSE_REQUEST_NOTIFY_FROM_EMAIL?.trim();

  if (!notifyEmail || !resendApiKey || !fromEmail) {
    const missing: string[] = [];
    if (!notifyEmail) missing.push("COURSE_REQUEST_NOTIFY_EMAIL");
    if (!resendApiKey) missing.push("RESEND_API_KEY");
    if (!fromEmail) missing.push("COURSE_REQUEST_NOTIFY_FROM_EMAIL");
    console.warn(
      "[course-submissions] Moderator email not sent: missing or empty env.",
      "Missing:",
      missing.join(", ")
    );
  } else if (
    notifyEmail === "your-email@example.com" ||
    resendApiKey === "re_your_api_key_here"
  ) {
    console.warn(
      "[course-submissions] Moderator email not sent: .env.local still has placeholder values.",
      "Set real COURSE_REQUEST_NOTIFY_EMAIL and RESEND_API_KEY (see frontend/.env.local comments)."
    );
  } else {
    try {
      const resend = new Resend(resendApiKey);
      const submitterEmail = user.email ?? "(not shared)";
      const courseLabel = [department, courseNumber].filter(Boolean).join(" ") || "—";
      await resend.emails.send({
        from: fromEmail,
        to: [notifyEmail],
        subject: `[Poly Pages] New course request: ${courseLabel}`,
        html: [
          "<h2>New course request</h2>",
          "<p>A user has requested a new course be added to the catalog.</p>",
          "<table style='border-collapse: collapse;'>",
          `<tr><td style='padding:6px 12px 6px 0;'><strong>Department</strong></td><td>${escapeHtml(department)}</td></tr>`,
          `<tr><td style='padding:6px 12px 6px 0;'><strong>Course number</strong></td><td>${escapeHtml(courseNumber)}</td></tr>`,
          title ? `<tr><td style='padding:6px 12px 6px 0;'><strong>Title</strong></td><td>${escapeHtml(title)}</td></tr>` : "",
          term ? `<tr><td style='padding:6px 12px 6px 0;'><strong>Term</strong></td><td>${escapeHtml(term)}</td></tr>` : "",
          year != null ? `<tr><td style='padding:6px 12px 6px 0;'><strong>Year</strong></td><td>${year}</td></tr>` : "",
          justification ? `<tr><td style='padding:6px 12px 6px 0;'><strong>Justification</strong></td><td>${escapeHtml(justification)}</td></tr>` : "",
          `<tr><td style='padding:6px 12px 6px 0;'><strong>Submitter email</strong></td><td>${escapeHtml(submitterEmail)}</td></tr>`,
          "</table>",
          "<p><em>Poly Pages – Course request notification</em></p>",
        ].join(""),
      });
    } catch (err) {
      console.error("[course-submissions] Failed to send moderator notification email:", err);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
