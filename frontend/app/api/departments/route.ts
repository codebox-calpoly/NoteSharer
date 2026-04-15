import { NextResponse } from "next/server";
import { CALPOLY_DEPARTMENTS } from "@/lib/calpoly-departments";
import { createClient } from "@/utils/supabaseServerClient";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("code, name, aliases")
    .eq("is_active", true)
    .order("code", { ascending: true });

  const departments =
    !error && data && data.length > 0
      ? data.map((department) => ({
          code: department.code,
          name: department.name,
          aliases: Array.isArray(department.aliases) ? department.aliases : [],
        }))
      : [...CALPOLY_DEPARTMENTS];

  return NextResponse.json(
    { departments },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    }
  );
}
