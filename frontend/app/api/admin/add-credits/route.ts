import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
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
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const { data: users, error: userError } = await adminClient.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json(
        { error: "Failed to find user", details: userError.message },
        { status: 500 },
      );
    }

    const user = users.users.find((u) => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 },
      );
    }

    // Update credits in profiles table
    const { data: profile, error: updateError } = await adminClient
      .from("profiles")
      .update({ credit_score: 500 })
      .eq("id", user.id)
      .select("credit_score")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update credits", details: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Credits updated successfully",
        email: email,
        userId: user.id,
        credits: profile?.credit_score ?? 500,
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
