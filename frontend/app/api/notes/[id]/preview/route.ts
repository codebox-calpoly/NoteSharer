/**
 * GET /api/notes/[id]/preview — Stream the note's preview image or PDF through the backend.
 * Requires authentication (cookie or Bearer). No signed storage URL is exposed; inspect cannot
 * obtain a shareable or long-lived link to the asset.
 */

import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabaseServerClient";

type ResourceRow = {
  id: string;
  preview_key: string | null;
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
    return new NextResponse(null, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new NextResponse(null, { status: 500 });
  }

  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("id, preview_key, status")
    .eq("id", resourceId)
    .single()
    .returns<ResourceRow>();

  if (resourceError || !resource) {
    return new NextResponse(null, { status: 404 });
  }

  if (resource.status !== "active") {
    return new NextResponse(null, { status: 403 });
  }

  const pathToStream = resource.preview_key;
  if (!pathToStream) {
    return new NextResponse(null, { status: 404 });
  }

  const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: fileData, error: fileError } = await adminClient.storage
    .from("resources")
    .download(pathToStream);

  if (fileError || !fileData) {
    return new NextResponse(null, { status: 404 });
  }

  const isPdf = pathToStream.toLowerCase().endsWith(".pdf");
  const contentType = isPdf ? "application/pdf" : (fileData.type || "image/jpeg");
  const buffer = Buffer.from(await fileData.arrayBuffer());

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": "inline",
    },
  });
}
