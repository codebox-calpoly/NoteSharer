import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { generateSignedUrl } from "@/lib/storage";
import { createClient } from "@/utils/supabaseServerClient";

type ResourceRow = {
  id: string;
  title: string;
  course_id: string | null;
  created_at: string;
  description: string | null;
  file_key: string | null;
  preview_key: string | null;
  download_cost: number;
  profiles: {
    display_name: string | null;
  } | null;
};

type VoteStatRow = {
  resource_id: string;
  upvotes: number | null;
  downvotes: number | null;
  score: number | null;
};

export async function GET(req: Request) {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.split(" ")[1]?.trim()
    : null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

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

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("class_id");
  const searchQuery = searchParams.get("search");
  const mine = searchParams.get("mine") === "1";
  const downloaded = searchParams.get("downloaded") === "1";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("page_size") ?? "16");
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // When "downloaded=1", fetch resource_ids from resource_downloads first, then query resources.
  let downloadedResourceIds: string[] = [];
  if (downloaded) {
    const { data: downloadsData } = await supabase
      .from("resource_downloads")
      .select("resource_id")
      .eq("profile_id", user.id);
    downloadedResourceIds = (downloadsData ?? []).map((d: { resource_id: string }) => d.resource_id);
    if (downloadedResourceIds.length === 0) {
      return NextResponse.json(
        { notes: [], page, pageSize, total: 0, hasMore: false },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  let query = supabase
    .from("resources")
    .select(
      `
        id,
        title,
        course_id,
        created_at,
        description,
        file_key,
        preview_key,
        download_cost,
        profiles ( display_name )
      `,
      { count: "exact" },
    )
    .eq("status", "active"); // Only show active (approved) notes on dashboard

  if (mine) {
    query = query.eq("profile_id", user.id);
  }
  if (downloaded) {
    query = query.in("id", downloadedResourceIds);
  }

  // Full-text search using the FTS index (searches title and description)
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = `%${searchQuery.trim()}%`;
    query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
  }

  query = query.order("created_at", { ascending: sort === "oldest" });

  if (classId && classId !== "all") {
    query = query.eq("course_id", classId);
  }

  query = query.range(from, to);

  const { data, error, count } = await query.returns<ResourceRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count ?? 0;
  const hasMore = to + 1 < total;
  const ids = data?.map((row) => row.id) ?? [];

  let voteStats: VoteStatRow[] = [];
  if (ids.length > 0) {
    const { data: statsData } = await supabase
      .from("resource_vote_stats")
      .select("resource_id, upvotes, downvotes, score")
      .in("resource_id", ids)
      .returns<VoteStatRow[]>();
    voteStats = statsData ?? [];
  }

  const voteMap = new Map<string, { upvotes: number; downvotes: number; score: number }>();
  voteStats.forEach((stat) => {
    voteMap.set(stat.resource_id, {
      upvotes: stat.upvotes ?? 0,
      downvotes: stat.downvotes ?? 0,
      score: stat.score ?? 0,
    });
  });

  let myVotes: { resource_id: string; value: number }[] = [];
  if (ids.length > 0) {
    const { data: myVotesData } = await supabase
      .from("votes")
      .select("resource_id, value")
      .eq("profile_id", user.id)
      .in("resource_id", ids);
    myVotes = myVotesData ?? [];
  }
  const myVoteMap = new Map<string, number>();
  myVotes.forEach((v) => myVoteMap.set(v.resource_id, v.value));

  // Use service-role so download status is authoritative for this user only (no RLS ambiguity).
  const currentUserId = user.id;
  const downloadedIds = new Set<string>();
  if (ids.length > 0) {
    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: downloadsData } = await adminClient
      .from("resource_downloads")
      .select("resource_id")
      .eq("profile_id", currentUserId)
      .in("resource_id", ids);
    (downloadsData ?? []).forEach((d: { resource_id: string }) => {
      downloadedIds.add(d.resource_id);
    });
  }

  const normalized = data
    ? await Promise.all(
        data.map(async (row) => {
          const stats = voteMap.get(row.id) ?? { upvotes: 0, downvotes: 0, score: 0 };
          const myVote = myVoteMap.get(row.id) ?? null;
          const base = {
            id: row.id,
            title: row.title,
            class_id: row.course_id,
            created_at: row.created_at,
            description: row.description ?? null,
            storage_path: row.file_key,
            profile_display_name: row.profiles?.display_name ?? null,
            upvote_count: stats.upvotes,
            downvote_count: stats.downvotes,
            score: stats.score,
            my_vote: myVote,
            download_cost: row.download_cost ?? 0,
            downloaded: downloadedIds.has(row.id),
          };

          const path = row.preview_key ?? row.file_key;
          if (!path) {
            return { ...base, previewUrl: null };
          }

          let previewUrl: string | null = null;
          try {
            previewUrl = await generateSignedUrl("resources", path);
          } catch {
            previewUrl = null;
          }
          return { ...base, previewUrl };
        }),
      )
    : [];

  return NextResponse.json(
    {
      notes: normalized,
      page,
      pageSize,
      total,
      hasMore,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
