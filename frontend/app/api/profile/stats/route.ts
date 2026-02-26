import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabaseServerClient";
import { getAllTimeRank, type LeaderboardProfileRow } from "@/app/api/leaderboard/helpers";
import { normalizeNetCredits, sumCreditTotals, type CreditLedgerRow } from "./helpers";

type ProfileRow = {
  credit_score: number | null;
};

type ResourceIdRow = {
  id: string;
};

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

  const userId = user.id;

  const [
    { data: profileData, error: profileError },
    { count: uploadCount, error: uploadCountError },
    { data: ledgerRows, error: ledgerError },
    { data: leaderboardRows, error: leaderboardError },
    { data: activeResourceRows, error: activeResourcesError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("credit_score")
      .eq("id", userId)
      .returns<ProfileRow>()
      .maybeSingle(),
    supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId)
      .eq("status", "active"),
    supabase
      .from("credits_ledger")
      .select("amount")
      .eq("profile_id", userId)
      .returns<CreditLedgerRow[]>(),
    supabase
      .from("profiles")
      .select("id, handle, display_name, uploaded_note_count, total_credits_earned, credit_score, created_at")
      .returns<LeaderboardProfileRow[]>(),
    supabase
      .from("resources")
      .select("id")
      .eq("profile_id", userId)
      .eq("status", "active")
      .returns<ResourceIdRow[]>(),
  ]);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (uploadCountError) {
    return NextResponse.json({ error: uploadCountError.message }, { status: 500 });
  }

  if (ledgerError) {
    return NextResponse.json({ error: ledgerError.message }, { status: 500 });
  }

  if (leaderboardError) {
    return NextResponse.json({ error: leaderboardError.message }, { status: 500 });
  }

  if (activeResourcesError) {
    return NextResponse.json({ error: activeResourcesError.message }, { status: 500 });
  }

  const activeResourceIds = (activeResourceRows ?? []).map((row) => row.id);
  let totalUpvotes = 0;

  if (activeResourceIds.length > 0) {
    const { count, error } = await supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("value", 1)
      .in("resource_id", activeResourceIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    totalUpvotes = count ?? 0;
  }

  const { creditsEarned, creditsSpent } = sumCreditTotals(ledgerRows ?? []);
  const { rank, totalContributors } = getAllTimeRank(leaderboardRows ?? [], userId);

  return NextResponse.json(
    {
      stats: {
        totalUploads: uploadCount ?? 0,
        totalUpvotes,
        creditsEarned,
        creditsSpent,
        netCredits: normalizeNetCredits(profileData?.credit_score),
      },
      rank: {
        allTime: rank,
        totalContributors,
      },
    },
    { status: 200 },
  );
}
