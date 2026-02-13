import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabaseServerClient";

type TermRow = {
  id: string;
  label: string;
  term: string;
  year: number;
  sort_order: number;
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

  const { data, error } = await supabase
    .from("catalog_terms")
    .select("id, label, term, year, sort_order")
    .order("sort_order", { ascending: true });

  const rows = data as TermRow[] | null;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const terms = (rows ?? []).map((t) => ({
    id: t.id,
    label: t.label,
    term: t.term,
    year: t.year,
  }));

  return NextResponse.json({ terms }, { status: 200 });
}
