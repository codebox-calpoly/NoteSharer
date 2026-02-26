import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Resend } from "resend";
import { createClient } from "@/utils/supabaseServerClient";

type SubmissionPayload = {
  department_code?: string;
  department_name?: string | null;
  justification?: string | null;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

  const departmentCode =
    typeof payload.department_code === "string"
      ? payload.department_code.trim()
      : "";

  if (!departmentCode) {
    return NextResponse.json(
      { error: "Department code is required." },
      { status: 400 }
    );
  }

  const departmentName =
    typeof payload.department_name === "string" && payload.department_name.trim()
      ? payload.department_name.trim()
      : null;
  const justification =
    typeof payload.justification === "string" && payload.justification.trim()
      ? payload.justification.trim()
      : null;

  const { error: insertError } = await supabase
    .from("department_submissions")
    .insert({
      submitter_id: user.id,
      department_code: departmentCode,
      department_name: departmentName,
      justification,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const notifyEmail = process.env.COURSE_REQUEST_NOTIFY_EMAIL?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.COURSE_REQUEST_NOTIFY_FROM_EMAIL?.trim();

  const hasEmailConfig = Boolean(notifyEmail && resendApiKey && fromEmail);
  if (!hasEmailConfig) {
    const missing: string[] = [];
    if (!notifyEmail) missing.push("COURSE_REQUEST_NOTIFY_EMAIL");
    if (!resendApiKey) missing.push("RESEND_API_KEY");
    if (!fromEmail) missing.push("COURSE_REQUEST_NOTIFY_FROM_EMAIL");
    console.warn(
      "[department-submissions] Moderator email not sent: missing or empty env.",
      "Missing:",
      missing.join(", ")
    );
  } else if (
    notifyEmail === "your-email@example.com" ||
    resendApiKey === "re_your_api_key_here"
  ) {
    console.warn(
      "[department-submissions] Moderator email not sent: .env.local still has placeholder values."
    );
  } else {
    try {
      const resend = new Resend(resendApiKey);
      const submitterEmail = user.email ?? "(not shared)";
      await resend.emails.send({
        from: fromEmail,
        to: [notifyEmail],
        subject: `[Poly Pages] New department request: ${departmentCode}`,
        html: [
          "<h2>New department request</h2>",
          "<p>A user has requested a new department be added to the catalog.</p>",
          "<table style='border-collapse: collapse;'>",
          `<tr><td style='padding:6px 12px 6px 0;'><strong>Department code</strong></td><td>${escapeHtml(departmentCode)}</td></tr>`,
          departmentName
            ? `<tr><td style='padding:6px 12px 6px 0;'><strong>Department name</strong></td><td>${escapeHtml(departmentName)}</td></tr>`
            : "",
          justification
            ? `<tr><td style='padding:6px 12px 6px 0;'><strong>Justification</strong></td><td>${escapeHtml(justification)}</td></tr>`
            : "",
          `<tr><td style='padding:6px 12px 6px 0;'><strong>Submitter email</strong></td><td>${escapeHtml(submitterEmail)}</td></tr>`,
          "</table>",
          "<p><em>Poly Pages – Department request notification</em></p>",
        ].join(""),
      });
    } catch (err) {
      console.error(
        "[department-submissions] Failed to send moderator notification email:",
        err
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
