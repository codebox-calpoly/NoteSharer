/**
 * TEXTEXTRACTOR — Extract text from PDFs (typed and handwritten/scanned).
 * Uses typed text layer first (pdfjs-dist); falls back to OCR (Tesseract) when text is missing or minimal.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fromPath } from "pdf2pic";
import * as pdfjsLib from "pdfjs-dist";

export type ExtractResult = {
  text: string;
  method: "typed" | "ocr";
  pagesProcessed: number;
  totalPages: number;
  /** Only set when method is "ocr" */
  ocrConfidence?: number;
};

export type ExtractOptions = {
  /** Max pages to run OCR on when falling back (default 10). */
  maxOcrPages?: number;
  /** Min chars per page (average) to consider typed extraction sufficient (default 20). */
  minCharsPerPage?: number;
  /** If true, skip typed extraction and run OCR only (e.g. for known scanned docs). */
  forceOcr?: boolean;
};

const DEFAULT_MAX_OCR_PAGES = 10;
const DEFAULT_MIN_CHARS_PER_PAGE = 20;

/**
 * Extract text from PDF buffer using the native text layer (typed/digital PDFs) via pdfjs-dist.
 */
export async function extractTyped(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const uint8 = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
  const numPages = doc.numPages;
  const parts: string[] = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(pageText);
  }
  const text = parts.join("\n\n").trim();
  return { text, numPages };
}

/**
 * Render PDF pages to images and run Tesseract OCR. Requires pdfPath on disk (pdf2pic uses path).
 */
export async function extractOcr(
  pdfPath: string,
  maxPages: number = DEFAULT_MAX_OCR_PAGES
): Promise<{ text: string; pagesProcessed: number; confidence?: number }> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", undefined, { logger: () => {} });

  try {
    const convert = fromPath(pdfPath, { density: 200 });
    const parts: string[] = [];
    let pagesProcessed = 0;
    let totalConfidence = 0;

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const result = await convert(pageNum, { format: "png" });
      if (!result?.path || !fs.existsSync(result.path)) break;

      try {
        const {
          data: { text, confidence },
        } = await worker.recognize(result.path);
        if (text?.trim()) {
          parts.push(text.trim());
          totalConfidence += confidence ?? 0;
        }
        pagesProcessed++;
      } finally {
        try {
          fs.unlinkSync(result.path);
        } catch {
          // ignore cleanup errors
        }
      }
    }

    const text = parts.join("\n\n");
    const confidence =
      pagesProcessed > 0 ? totalConfidence / pagesProcessed : undefined;
    return { text, pagesProcessed, confidence };
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract text from a PDF buffer. Tries typed extraction first; if the result is
 * too short (likely scanned/handwritten), falls back to OCR for up to maxOcrPages.
 */
export async function extract(
  buffer: Buffer,
  options: ExtractOptions = {}
): Promise<ExtractResult> {
  const {
    maxOcrPages = DEFAULT_MAX_OCR_PAGES,
    minCharsPerPage = DEFAULT_MIN_CHARS_PER_PAGE,
    forceOcr = false,
  } = options;

  if (!forceOcr) {
    const { text: typedText, numPages } = await extractTyped(buffer);
    const avgCharsPerPage =
      numPages > 0 ? typedText.length / numPages : typedText.length;
    if (typedText.length > 0 && avgCharsPerPage >= minCharsPerPage) {
      return {
        text: typedText,
        method: "typed",
        pagesProcessed: numPages,
        totalPages: numPages,
      };
    }
  }

  // Fallback: write buffer to temp file and run OCR (pdf2pic needs a path)
  const tmpDir = os.tmpdir();
  const tmpPdf = path.join(tmpDir, `textextractor-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  fs.writeFileSync(tmpPdf, buffer);
  try {
    const { text, pagesProcessed, confidence } = await extractOcr(tmpPdf, maxOcrPages);
    const typedMeta = await extractTyped(buffer);
    return {
      text: text || typedMeta.text,
      method: "ocr",
      pagesProcessed,
      totalPages: typedMeta.numPages,
      ocrConfidence: confidence,
    };
  } finally {
    try {
      fs.unlinkSync(tmpPdf);
    } catch {
      // ignore
    }
  }
}
