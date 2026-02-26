import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabaseServerClient";
import { buildInitials, sortLeaderboardRows, toLeaderboardEntries, type LeaderboardProfileRow } from "./helpers";

type WeeklyResourceRow = {
  profile_id: string;
};

type WeeklyCreditRow = {
  profile_id: string;
  amount: number;
  source: string;
  resource_id: string | null;
};

type ResourceStatusRow = {
  id: string;
};

type Period = "all_time" | "this_week";

export async function GET(req: Request) {
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }
  const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);

  const periodParam = new URL(req.url).searchParams.get("period");
  const period: Period = periodParam === "this_week" ? "this_week" : "all_time";

  const { data, error } = await adminClient
    .from("profiles")
    .select("id, handle, display_name, uploaded_note_count, total_credits_earned, credit_score, created_at")
    .returns<LeaderboardProfileRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = data ?? [];
  const sortedAllTime = sortLeaderboardRows(profiles);

  if (period === "all_time") {
    return NextResponse.json({ leaderboard: toLeaderboardEntries(profiles) }, { status: 200 });
  }

  const weekStart = new Date();
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

  const { data: weeklyRows, error: weeklyError } = await adminClient
    .from("resources")
    .select("profile_id")
    .eq("status", "active")
    .gte("created_at", weekStart.toISOString())
    .returns<WeeklyResourceRow[]>();

  if (weeklyError) {
    return NextResponse.json({ error: weeklyError.message }, { status: 500 });
  }

  const weeklyUploadCounts = new Map<string, number>();
  for (const row of weeklyRows ?? []) {
    weeklyUploadCounts.set(row.profile_id, (weeklyUploadCounts.get(row.profile_id) ?? 0) + 1);
  }

  const { data: weeklyCreditRows, error: weeklyCreditsError } = await adminClient
    .from("credits_ledger")
    .select("profile_id, amount, source, resource_id")
    .in("source", ["upload_reward", "upvote_bonus"])
    .gte("created_at", weekStart.toISOString())
    .returns<WeeklyCreditRow[]>();

  if (weeklyCreditsError) {
    return NextResponse.json({ error: weeklyCreditsError.message }, { status: 500 });
  }

  const uploadRewardResourceIds = Array.from(
    new Set(
      (weeklyCreditRows ?? [])
        .filter((row) => row.source === "upload_reward" && row.resource_id)
        .map((row) => row.resource_id as string),
    ),
  );

  const activeUploadRewardResourceIds = new Set<string>();
  if (uploadRewardResourceIds.length > 0) {
    const { data: activeResources, error: activeResourcesError } = await adminClient
      .from("resources")
      .select("id")
      .eq("status", "active")
      .in("id", uploadRewardResourceIds)
      .returns<ResourceStatusRow[]>();

    if (activeResourcesError) {
      return NextResponse.json({ error: activeResourcesError.message }, { status: 500 });
    }

    for (const resource of activeResources ?? []) {
      activeUploadRewardResourceIds.add(resource.id);
    }
  }

  const weeklyCreditsEarned = new Map<string, number>();
  for (const row of weeklyCreditRows ?? []) {
    if (Number(row.amount ?? 0) <= 0) continue;
    if (
      row.source === "upload_reward" &&
      (!row.resource_id || !activeUploadRewardResourceIds.has(row.resource_id))
    ) {
      continue;
    }

    weeklyCreditsEarned.set(
      row.profile_id,
      (weeklyCreditsEarned.get(row.profile_id) ?? 0) + Number(row.amount ?? 0),
    );
  }

  const weeklyEntries = sortedAllTime
    .map((row) => ({
      ...row,
      weekUploadCount: weeklyUploadCounts.get(row.id) ?? 0,
      weekCreditsEarned: weeklyCreditsEarned.get(row.id) ?? 0,
    }))
    .filter((row) => row.weekUploadCount > 0 || row.weekCreditsEarned > 0)
    .sort((a, b) => {
      const uploadDiff = b.weekUploadCount - a.weekUploadCount;
      if (uploadDiff !== 0) return uploadDiff;

      const weeklyCreditsDiff = b.weekCreditsEarned - a.weekCreditsEarned;
      if (weeklyCreditsDiff !== 0) return weeklyCreditsDiff;

      const creditScoreDiff = Number(b.credit_score ?? 0) - Number(a.credit_score ?? 0);
      if (creditScoreDiff !== 0) return creditScoreDiff;

      return a.created_at.localeCompare(b.created_at);
    })
    .map((row, index) => ({
      rank: index + 1,
      userId: row.id,
      name: row.display_name?.trim() || row.handle || "Anonymous",
      uploads: row.weekUploadCount,
      credits: row.weekCreditsEarned,
      avatar: buildInitials(row.display_name, row.handle),
    }));

  return NextResponse.json({ leaderboard: weeklyEntries }, { status: 200 });
}
