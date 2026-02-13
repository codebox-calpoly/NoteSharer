import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabaseServerClient";

type CourseRow = {
  id: string;
  title: string | null;
  department: string | null;
  course_number: string | null;
  term: string | null;
  year: number | null;
};

type ClassResponse = {
  id: string;
  name: string;
  code: string | null;
  department: string | null;
  term: string | null;
  year: number | null;
  note_count: number;
};

const PAGE_SIZE = 1000;
const RESOURCE_PAGE_SIZE = 1000;
const RPC_BATCH_SIZE = 500;

type RpcRow = { course_id: string; note_count: number };

/** Get note counts via DB RPC (accurate, no row limit). Falls back to paginated fetch if RPC fails. */
async function getNoteCountMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseIds: string[] | null
): Promise<Map<string, number>> {
  const countMap = new Map<string, number>();

  if (courseIds != null && courseIds.length === 0) return countMap;

  const ids = courseIds ?? [];
  const useRpc = ids.length > 0;

  if (useRpc) {
    let rpcFailed = false;
    for (let i = 0; i < ids.length && !rpcFailed; i += RPC_BATCH_SIZE) {
      const batch = ids.slice(i, i + RPC_BATCH_SIZE);
      const { data, error } = await supabase.rpc("get_course_note_counts", {
        p_course_ids: batch,
      });
      if (!error && Array.isArray(data)) {
        (data as RpcRow[]).forEach((row) => {
          countMap.set(row.course_id, Number(row.note_count) ?? 0);
        });
        continue;
      }
      if (error) rpcFailed = true;
    }
    if (!rpcFailed && (countMap.size > 0 || ids.length === 0)) return countMap;
  }

  return fetchNoteCountMapFallback(supabase, courseIds);
}

/** Fallback: fetch all active resource rows (paginated) and count when RPC is not available. */
async function fetchNoteCountMapFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseIds: string[] | null
): Promise<Map<string, number>> {
  const countMap = new Map<string, number>();
  let offset = 0;
  let hasMore = true;

  const maxInClause = 500;
  const useFilter = courseIds != null && courseIds.length > 0 && courseIds.length <= maxInClause;

  while (hasMore) {
    let query = supabase
      .from("resources")
      .select("course_id")
      .eq("status", "active")
      .range(offset, offset + RESOURCE_PAGE_SIZE - 1);
    if (useFilter) {
      query = query.in("course_id", courseIds!);
    }
    const { data: page, error } = await query;
    if (error) throw error;
    const list = (page ?? []) as { course_id: string }[];
    list.forEach((r) => {
      countMap.set(r.course_id, (countMap.get(r.course_id) ?? 0) + 1);
    });
    hasMore = list.length === RESOURCE_PAGE_SIZE;
    offset += RESOURCE_PAGE_SIZE;
  }

  return countMap;
}

function buildClasses(rows: CourseRow[], countMap: Map<string, number>): ClassResponse[] {
  return rows.map((course) => {
    const codeParts = [course.department, course.course_number].filter(Boolean).join(" ").trim();
    const fallbackName = codeParts || "Untitled course";
    return {
      id: course.id,
      name: course.title?.trim() || fallbackName,
      code: codeParts || null,
      department: course.department ?? null,
      term: course.term ?? null,
      year: course.year ?? null,
      note_count: countMap.get(course.id) ?? 0,
    };
  });
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const paginated = limitParam != null && limitParam !== "";
  const limit = paginated ? Math.min(Math.max(1, parseInt(limitParam, 10) || PAGE_SIZE), 1000) : PAGE_SIZE;
  const offset = paginated ? Math.max(0, parseInt(offsetParam ?? "0", 10)) : 0;

  if (paginated) {
    const { data: page, error } = await supabase
      .from("courses")
      .select("id, title, department, course_number, term, year")
      .order("title", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const rows = (page ?? []) as CourseRow[];
    const courseIds = rows.map((c) => c.id);
    let countMap: Map<string, number>;
    try {
      countMap = await getNoteCountMap(supabase, courseIds.length > 0 ? courseIds : null);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to load resource counts" },
        { status: 500 }
      );
    }

    const classes = buildClasses(rows, countMap);
    const hasMore = rows.length === limit;

    return NextResponse.json(
      { classes, hasMore },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  }

  const rows: CourseRow[] = [];
  let currentOffset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: page, error } = await supabase
      .from("courses")
      .select("id, title, department, course_number, term, year")
      .order("title", { ascending: true })
      .range(currentOffset, currentOffset + PAGE_SIZE - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const list = (page ?? []) as CourseRow[];
    rows.push(...list);
    hasMore = list.length === PAGE_SIZE;
    currentOffset += PAGE_SIZE;
  }

  const allCourseIds = rows.map((c) => c.id);
  let countMap: Map<string, number>;
  try {
    countMap = await getNoteCountMap(supabase, allCourseIds.length > 0 ? allCourseIds : null);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load resource counts" },
      { status: 500 }
    );
  }

  const classes = buildClasses(rows, countMap);

  return NextResponse.json(
    { classes },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    }
  );
}
