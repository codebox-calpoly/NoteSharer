import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabaseServerClient";

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
    .from("courses")
    .select("department")
    .not("department", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deptSet = new Set<string>();
  (data ?? []).forEach((r: { department: string | null }) => {
    if (r.department) deptSet.add(r.department);
  });
  const departments = Array.from(deptSet).sort((a, b) => {
    if (a === "TEST") return -1;
    if (b === "TEST") return 1;
    return a.localeCompare(b);
  });

  return NextResponse.json({ departments }, { status: 200 });
}
