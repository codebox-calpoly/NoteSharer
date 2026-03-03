/**
 * TEXTEXTRACTOR API — POST a PDF, get extracted text (typed or OCR for handwritten/scanned).
 */

import { NextRequest, NextResponse } from "next/server";
import { extract, type ExtractOptions } from "@/lib/textextractor";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const PDF_MIME_TYPES = new Set(["application/pdf"]);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") ?? formData.get("pdf");
  const forceOcr = formData.get("force_ocr") === "true" || formData.get("force_ocr") === "1";
  const maxOcrPagesParam = formData.get("max_ocr_pages");
  const maxOcrPages = maxOcrPagesParam ? Math.min(50, Math.max(1, Number(maxOcrPagesParam))) : undefined;

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A PDF file is required. Send as form field 'file' or 'pdf'." },
      { status: 400 }
    );
  }

  const isPdf =
    file.type?.toLowerCase() === "application/pdf" ||
    file.name?.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json(
      { error: "Only PDF files are supported." },
      { status: 400 }
    );
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `File must be between 1 byte and ${MAX_FILE_SIZE_BYTES} bytes.`,
      },
      { status: 400 }
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to read file.", details: message },
      { status: 400 }
    );
  }

  const options: ExtractOptions = {};
  if (forceOcr) options.forceOcr = true;
  if (maxOcrPages != null) options.maxOcrPages = maxOcrPages;

  try {
    const result = await extract(buffer, options);
    return NextResponse.json({
      text: result.text,
      method: result.method,
      pages_processed: result.pagesProcessed,
      total_pages: result.totalPages,
      ...(result.ocrConfidence != null && {
        ocr_confidence: Math.round(result.ocrConfidence * 100) / 100,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    console.error("[textextractor]", err);
    return NextResponse.json(
      { error: "Text extraction failed.", details: message },
      { status: 500 }
    );
  }
}
