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

  const { data: creditData, error: creditError } = await supabase
    .from("profiles")
    .select<{ credit_score: number | null }>("credit_score")
    .eq("id", user.id)
    .maybeSingle();

  if (creditError) {
    return NextResponse.json({ error: creditError.message }, { status: 500 });
  }

  const { count: voucherCount, error: voucherError } = await supabase
    .from("download_vouchers")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .is("redeemed_at", null);

  if (voucherError) {
    return NextResponse.json({ error: voucherError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      credits: creditData?.credit_score ?? 0,
      freeDownloads: voucherCount ?? 0,
    },
    { status: 200 },
  );
}
