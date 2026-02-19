import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabaseServerClient";

type SubmissionPayload = {
  department?: string;
  course_number?: string;
  title?: string | null;
  term?: string | null;
  year?: number | null;
  justification?: string | null;
};

type NormalizedSubmission = {
  department: string;
  courseNumber: string;
  title: string | null;
  term: string | null;
  year: number | null;
  justification: string | null;
};

type NotificationPayload = {
  event: "course_request_submitted";
  submittedAt: string;
  submitter: {
    id: string;
    email: string | null;
  };
  course: {
    department: string;
    courseNumber: string;
    title: string | null;
    term: string | null;
    year: number | null;
  };
  justification: string | null;
  moderatorUrl: string | null;
};

type NotificationResult = {
  attempted: number;
  succeeded: number;
  errors: string[];
};

const REQUEST_EMAIL_FROM =
  process.env.COURSE_REQUEST_NOTIFY_FROM_EMAIL?.trim() ||
  "NoteSharer Course Requests <onboarding@resend.dev>";
const ALLOWED_TERMS = new Set(["Fall", "Winter", "Spring", "Summer"]);
const MIN_YEAR = 2000;
const MAX_YEAR = 2050;

function normalizePayload(payload: SubmissionPayload): NormalizedSubmission | null {
  const department =
    typeof payload.department === "string" ? payload.department.trim().toUpperCase() : "";
  const courseNumber =
    typeof payload.course_number === "string" ? payload.course_number.trim() : "";

  if (!department || !courseNumber || !/^\d+$/.test(courseNumber)) {
    return null;
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

  if (!title || !term || year == null || !justification) {
    return null;
  }
  if (!ALLOWED_TERMS.has(term) || year < MIN_YEAR || year > MAX_YEAR) {
    return null;
  }

  return {
    department,
    courseNumber,
    title,
    term,
    year,
    justification,
  };
}

function buildModeratorUrl(submission: NormalizedSubmission): string | null {
  const moderatorBase = process.env.COURSE_REQUEST_MODERATOR_URL?.trim();
  if (!moderatorBase) return null;

  try {
    const url = new URL(moderatorBase);
    url.searchParams.set("department", submission.department);
    url.searchParams.set("course_number", submission.courseNumber);
    if (submission.term) url.searchParams.set("term", submission.term);
    if (submission.year != null) url.searchParams.set("year", String(submission.year));
    return url.toString();
  } catch {
    return moderatorBase;
  }
}

function buildNotificationPayload(
  user: { id: string; email?: string | null },
  submission: NormalizedSubmission,
): NotificationPayload {
  return {
    event: "course_request_submitted",
    submittedAt: new Date().toISOString(),
    submitter: {
      id: user.id,
      email: user.email ?? null,
    },
    course: {
      department: submission.department,
      courseNumber: submission.courseNumber,
      title: submission.title,
      term: submission.term,
      year: submission.year,
    },
    justification: submission.justification,
    moderatorUrl: buildModeratorUrl(submission),
  };
}

function toEmailText(payload: NotificationPayload): string {
  return [
    "A new course request was submitted.",
    "",
    `Department: ${payload.course.department || "N/A"}`,
    `Course Number: ${payload.course.courseNumber || "N/A"}`,
    `Course Title: ${payload.course.title || "N/A"}`,
    `Term: ${payload.course.term || "N/A"}`,
    `Year: ${payload.course.year != null ? String(payload.course.year) : "N/A"}`,
    `Submitter ID: ${payload.submitter.id}`,
    `Submitter Email: ${payload.submitter.email ?? "N/A"}`,
    `Justification: ${payload.justification ?? "N/A"}`,
    "",
    payload.moderatorUrl ? `Moderator URL: ${payload.moderatorUrl}` : "Moderator URL: N/A",
    `Submitted At: ${payload.submittedAt}`,
  ].join("\n");
}

function toEmailHtml(payload: NotificationPayload): string {
  const safe = (value: string | null | undefined): string =>
    value == null || value === "" ? "N/A" : value;

  return [
    "<p>A new course request was submitted.</p>",
    "<p>",
    `<strong>Department:</strong> ${safe(payload.course.department)}<br/>`,
    `<strong>Course Number:</strong> ${safe(payload.course.courseNumber)}<br/>`,
    `<strong>Course Title:</strong> ${safe(payload.course.title)}<br/>`,
    `<strong>Term:</strong> ${safe(payload.course.term)}<br/>`,
    `<strong>Year:</strong> ${payload.course.year != null ? String(payload.course.year) : "N/A"}<br/>`,
    `<strong>Submitter ID:</strong> ${safe(payload.submitter.id)}<br/>`,
    `<strong>Submitter Email:</strong> ${safe(payload.submitter.email)}<br/>`,
    `<strong>Justification:</strong> ${safe(payload.justification)}`,
    "</p>",
    "<p>",
    `<strong>Moderator URL:</strong> ${payload.moderatorUrl ? payload.moderatorUrl : "N/A"}<br/>`,
    `<strong>Submitted At:</strong> ${safe(payload.submittedAt)}`,
    "</p>",
  ].join("");
}

async function sendWebhookNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<string | null> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return `Webhook notification failed (${response.status}).`;
    }

    return null;
  } catch {
    return "Webhook notification failed.";
  }
}

async function sendResendNotification(
  toEmail: string,
  payload: NotificationPayload
): Promise<string | null> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    return "COURSE_REQUEST_NOTIFY_EMAIL is set but RESEND_API_KEY is missing.";
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REQUEST_EMAIL_FROM,
        to: [toEmail],
        subject: `New course request: ${payload.course.department} ${payload.course.courseNumber}`,
        text: toEmailText(payload),
        html: toEmailHtml(payload),
      }),
    });

    if (!response.ok) {
      return `Email notification failed (${response.status}).`;
    }

    return null;
  } catch {
    return "Email notification failed.";
  }
}

async function notifyTeam(payload: NotificationPayload): Promise<NotificationResult> {
  const webhookUrl = process.env.REQUEST_WEBHOOK_URL?.trim();
  const notifyEmail = process.env.COURSE_REQUEST_NOTIFY_EMAIL?.trim();

  let attempted = 0;
  let succeeded = 0;
  const errors: string[] = [];

  if (webhookUrl) {
    attempted += 1;
    const webhookError = await sendWebhookNotification(webhookUrl, payload);
    if (webhookError) {
      errors.push(webhookError);
    } else {
      succeeded += 1;
    }
  }

  if (notifyEmail) {
    attempted += 1;
    const emailError = await sendResendNotification(notifyEmail, payload);
    if (emailError) {
      errors.push(emailError);
    } else {
      succeeded += 1;
    }
  }

  return { attempted, succeeded, errors };
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

  const submission = normalizePayload(payload);
  if (!submission) {
    return NextResponse.json(
      {
        error:
          "Department, numeric course number, title, term, year, and justification are required.",
      },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabase.from("course_submissions").insert({
    submitter_id: user.id,
    department: submission.department,
    course_number: submission.courseNumber,
    title: submission.title,
    term: submission.term,
    year: submission.year,
    justification: submission.justification,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const notificationPayload = buildNotificationPayload(user, submission);
  const notificationResult = await notifyTeam(notificationPayload);

  if (notificationResult.attempted > 0 && notificationResult.succeeded === 0) {
    return NextResponse.json(
      {
        error: "Course request was saved, but team notification failed.",
      },
      { status: 502 }
    );
  }

  if (notificationResult.errors.length > 0) {
    console.error("Course request notification partial failure", notificationResult.errors);
  }

  return NextResponse.json(
    {
      ok: true,
      notificationAttempted: notificationResult.attempted > 0,
      notificationSucceeded: notificationResult.succeeded > 0,
    },
    { status: 201 }
  );
}
