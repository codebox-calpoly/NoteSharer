import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Find a valid unused code for this email
  const { data: otpRow, error: fetchError } = await adminClient
    .from("otp_codes")
    .select("id, code, expires_at, used")
    .eq("email", email)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: "Failed to verify code." }, { status: 500 });
  }

  if (!otpRow) {
    return NextResponse.json({ error: "No active code found. Request a new one." }, { status: 400 });
  }

  if (new Date(otpRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Code has expired. Request a new one." }, { status: 400 });
  }

  if (otpRow.code !== code) {
    return NextResponse.json({ error: "Invalid code. Check your email and try again." }, { status: 400 });
  }

  // Mark code as used
  await adminClient
    .from("otp_codes")
    .update({ used: true })
    .eq("id", otpRow.id);

  // Get or create the user in Supabase Auth
  const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = listData?.users?.find((u) => u.email === email);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    // Create new user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (createError || !newUser?.user) {
      return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
    }
    userId = newUser.user.id;
  }

  // Generate a magic link and extract the token to create a session
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json({ error: "Failed to create session." }, { status: 500 });
  }

  // Verify the magic link token to get a real session
  const { data: sessionData, error: sessionError } = await adminClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  if (sessionError || !sessionData?.session) {
    return NextResponse.json({ error: "Failed to create session." }, { status: 500 });
  }

  // Suppress unused variable warning
  void userId;

  return NextResponse.json({
    ok: true,
    session: {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_at: sessionData.session.expires_at,
    },
  });
}
