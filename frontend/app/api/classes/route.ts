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
    const countMap = new Map<string, number>();

    if (courseIds.length > 0) {
      const { data: resources } = await supabase
        .from("resources")
        .select("course_id")
        .eq("status", "active")
        .in("course_id", courseIds);
      (resources ?? []).forEach((r: { course_id: string }) => {
        countMap.set(r.course_id, (countMap.get(r.course_id) ?? 0) + 1);
      });
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

  const courseIds = rows.map((c) => c.id);
  const countMap = new Map<string, number>();

  if (courseIds.length > 0) {
    const { data: resources } = await supabase
      .from("resources")
      .select("course_id")
      .eq("status", "active");
    (resources ?? []).forEach((r: { course_id: string }) => {
      countMap.set(r.course_id, (countMap.get(r.course_id) ?? 0) + 1);
    });
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
