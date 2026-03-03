/**
 * GET /api/notes/[id]/view — View the note PDF in-browser (downloaded notes only).
 * - Accept: application/json (default) → returns { url: signedUrl }.
 * - Accept: application/pdf or ?stream=1 → returns the PDF bytes (for in-app preview, like upload).
 */

import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabaseServerClient";
import { generateSignedUrl } from "@/lib/storage";

const VIEW_URL_TTL_SECONDS = 3600; // 1 hour

type ResourceRow = {
  id: string;
  file_key: string;
  profile_id: string;
  status: string;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: resourceId } = await params;
  if (!resourceId) {
    return NextResponse.json({ error: "Resource id is required." }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.split(" ")[1]?.trim()
    : null;

  const supabase = await createClient(bearerToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("id, file_key, profile_id, status")
    .eq("id", resourceId)
    .single()
    .returns<ResourceRow>();

  if (resourceError || !resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  if (resource.status !== "active") {
    return NextResponse.json(
      { error: "Resource is not available for viewing." },
      { status: 403 },
    );
  }

  const isOwner = resource.profile_id === user.id;
  let canView = isOwner;

  if (!canView) {
    const { data: download } = await supabase
      .from("resource_downloads")
      .select("id")
      .eq("resource_id", resourceId)
      .eq("profile_id", user.id)
      .maybeSingle();
    canView = Boolean(download?.id);
  }

  if (!canView) {
    return NextResponse.json(
      { error: "Download this note to view it." },
      { status: 403 },
    );
  }

  const acceptPdf =
    req.headers.get("accept")?.toLowerCase().includes("application/pdf") ?? false;
  const streamParam = new URL(req.url || "", "http://x").searchParams.get("stream");
  const returnStream = acceptPdf || streamParam === "1";

  if (returnStream) {
    const { data: fileData, error: fileError } = await adminClient.storage
      .from("resources")
      .download(resource.file_key);

    if (fileError || !fileData) {
      return NextResponse.json(
        { error: "Failed to load PDF." },
        { status: 500 },
      );
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer());
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": fileData.type || "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=300",
      },
    });
  }

  try {
    const url = await generateSignedUrl(
      "resources",
      resource.file_key,
      VIEW_URL_TTL_SECONDS,
    );
    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate view URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
