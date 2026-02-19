import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabaseServerClient";

type LeaderboardRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  uploaded_note_count: number | null;
  credit_score: number | null;
};

function buildInitials(displayName: string | null, handle: string | null): string {
  const source = (displayName?.trim() || handle?.trim() || "U").replace(/^@/, "");
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export async function GET() {
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

  const { data, error } = await supabase
    .from("profiles")
    .select("id, handle, display_name, uploaded_note_count, credit_score")
    .order("uploaded_note_count", { ascending: false })
    .order("credit_score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(100)
    .returns<LeaderboardRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries = (data ?? []).map((row, index) => ({
    rank: index + 1,
    userId: row.id,
    name: row.display_name?.trim() || row.handle || "Anonymous",
    uploads: Number(row.uploaded_note_count ?? 0),
    credits: Number(row.credit_score ?? 0),
    avatar: buildInitials(row.display_name, row.handle),
  }));

  return NextResponse.json({ leaderboard: entries }, { status: 200 });
}
