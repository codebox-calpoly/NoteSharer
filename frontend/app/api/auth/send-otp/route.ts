import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const OTP_EXPIRY_MINUTES = 10;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_AUTH_API_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }
  if (!resendApiKey) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.endsWith("@calpoly.edu")) {
    return NextResponse.json({ error: "A valid @calpoly.edu email is required." }, { status: 400 });
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Clean up old codes for this email first
  await adminClient
    .from("otp_codes")
    .delete()
    .eq("email", email)
    .eq("used", false);

  const { error: insertError } = await adminClient
    .from("otp_codes")
    .insert({ email, code, expires_at: expiresAt });

  if (insertError) {
    return NextResponse.json({ error: "Failed to generate code." }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);
  const { error: emailError } = await resend.emails.send({
    from: "Poly Pages <noreply@codeboxorg.com>",
    to: email,
    subject: "Your Poly Pages sign-in code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #2e2e2e; margin-bottom: 8px;">Poly Pages</h1>
        <p style="color: #666; margin-bottom: 24px;">Your one-time sign-in code:</p>
        <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #2e2e2e;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (emailError) {
    console.error("[send-otp] Resend error:", emailError);
    const message = typeof emailError === "object" && emailError !== null && "message" in emailError
      ? String((emailError as { message: string }).message)
      : "Failed to send email. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
