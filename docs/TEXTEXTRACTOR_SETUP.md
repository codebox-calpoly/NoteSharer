# TEXTEXTRACTOR — Full setup and usage guide

This guide walks you through the **entire** TEXTEXTRACTOR flow: what it does, how to use the API, how it’s built, and optional external services for better handwriting support.

---

## What it does

- **Typed/digital PDFs**  
  Extracts text from the PDF’s built-in text layer (no OCR). Fast and accurate.

- **Scanned / handwritten PDFs**  
  When there’s little or no text in the file, the pipeline falls back to **OCR**:
  1. Renders PDF pages to images (using `pdf2pic`).
  2. Runs **Tesseract.js** on each image to recognize text (including handwriting, with varying quality).

So one API handles both: you send a PDF and get back plain text, with an indication of whether it came from the text layer or OCR.

---

## Using the API

### Endpoint

- **URL:** `POST /api/textextractor`
- **Auth:** None required for this route (add auth in your app if you want).
- **Body:** `multipart/form-data` with a PDF file.

### Form fields

| Field            | Required | Description |
|------------------|----------|-------------|
| `file` or `pdf`  | Yes      | The PDF file. |
| `force_ocr`      | No       | If `"true"` or `"1"`, skip typed extraction and run OCR only (useful for known scanned docs). |
| `max_ocr_pages`  | No       | Max number of pages to run OCR on (default 10, cap 50). |

### Example (curl)

```bash
curl -X POST http://localhost:3000/api/textextractor \
  -F "file=@/path/to/notes.pdf"
```

Force OCR for all (e.g. scanned) PDFs:

```bash
curl -X POST http://localhost:3000/api/textextractor \
  -F "file=@/path/to/scan.pdf" \
  -F "force_ocr=true"
```

### Example (JavaScript)

```javascript
const form = new FormData();
form.append("file", pdfFile); // File from <input type="file"> or fetch

const res = await fetch("/api/textextractor", {
  method: "POST",
  body: form,
});
const data = await res.json();

if (!res.ok) {
  console.error(data.error, data.details);
  return;
}

console.log("Method:", data.method);           // "typed" or "ocr"
console.log("Text:", data.text);
console.log("Pages processed:", data.pages_processed);
console.log("Total pages:", data.total_pages);
if (data.ocr_confidence != null) {
  console.log("OCR confidence:", data.ocr_confidence);
}
```

### Response shape

- **Success (200):**
  - `text` (string) — Extracted text.
  - `method` (`"typed"` | `"ocr"`) — How the text was obtained.
  - `pages_processed` (number) — Pages used for extraction/OCR.
  - `total_pages` (number) — Total pages in the PDF.
  - `ocr_confidence` (number, optional) — Only when `method === "ocr"`; average confidence from Tesseract (0–100).

- **Error (4xx/5xx):**
  - `error` (string) — Short message.
  - `details` (string, optional) — Extra info (e.g. stack or internal message).

---

## How it’s built (in this repo)

1. **Dependencies**
   - **pdfjs-dist** — Reads the text layer from a PDF buffer (typed PDFs); already in the project.
   - **pdf2pic** — Renders PDF pages to PNG/JPEG (already used for previews).
   - **tesseract.js** — OCR on images (works in Node; no separate Tesseract install).

2. **Library: `frontend/lib/textextractor.ts`**
   - `extractTyped(buffer)` — Uses `pdfjs-dist` to get text and page count.
   - `extractOcr(pdfPath, maxPages)` — Uses `pdf2pic` + Tesseract.js to OCR pages (writes PDF to a temp file because `pdf2pic` needs a path).
   - `extract(buffer, options)` — Tries typed first; if the average text per page is below a threshold (default 20 chars), runs OCR. Options: `maxOcrPages`, `minCharsPerPage`, `forceOcr`.

3. **API route: `frontend/app/api/textextractor/route.ts`**
   - Accepts `multipart/form-data` with `file` or `pdf`.
   - Validates type (PDF) and size (max 25 MB).
   - Calls `extract()` and returns the JSON above.

No external API keys are required for the built-in flow.

---

## Optional: external APIs for better handwriting

The built-in pipeline uses **Tesseract.js** for OCR. It’s free and runs locally but handwriting quality can be mixed. If you need better results on handwritten notes, you can:

1. **Keep the current API** for typed PDFs and “good enough” handwritten/scanned text.
2. **Add an optional external OCR step** (e.g. only when `force_ocr=true` or when Tesseract confidence is low) that calls one of the services below and then merge or replace the text.

### Free / freemium options

| Service              | Free tier / notes |
|----------------------|--------------------|
| **Google Cloud Vision** | $300 free credit; Document AI has document + handwriting models. |
| **OCR.space**        | 25,000 requests/month free; Engine 3 supports handwriting; API key required. |
| **OCRAPI.cloud**     | 250 requests/month free; supports handwritten + typed. |
| **Azure Document Intelligence** | Free tier (e.g. 500 pages/month); good for documents and handwriting. |

### Wiring an external OCR provider

1. Add an env var for the API key (e.g. `OCR_API_KEY`, `GOOGLE_VISION_KEY`).
2. In `lib/textextractor.ts` (or a separate `lib/ocr-external.ts`):
   - When you want to use the external API (e.g. `forceOcr` and key is set), render pages with `pdf2pic`, then send each image (or a multi-page PDF) to the provider’s REST API.
   - Map their response to your existing `ExtractResult` shape (e.g. set `method: "ocr"`, `text`, `pagesProcessed`, optional `ocrConfidence`).
3. In the API route, pass a flag or option so the extractor can choose “internal OCR vs external OCR” (e.g. query param `ocr=external` or env-based).

This way you keep one **TEXTEXTRACTOR** API; only the backend implementation of “OCR path” changes when the key is set.

---

## Limits and tips

- **Size:** Max 25 MB per PDF (configurable in `route.ts`).
- **OCR pages:** Default max 10 pages for OCR; use `max_ocr_pages` to change (capped at 50) to balance speed and cost if you later add a paid API.
- **Handwriting:** Tesseract.js is best on clear, printed text; handwriting support is limited. For heavy handwriting, use an external API as above.
- **Performance:** Typed extraction is quick; OCR is slower (especially first run while Tesseract.js loads language data). Consider a “processing” status in the UI for large or OCR-only requests.

---

## Quick checklist

- [ ] Run `npm install` in `frontend` (adds `tesseract.js`; `pdfjs-dist` and `pdf2pic` are already present).
- [ ] Start dev server: `npm run dev` in `frontend`.
- [ ] Call `POST /api/textextractor` with a PDF in `file` or `pdf`.
- [ ] (Optional) Add auth to the route if the app is not public.
- [ ] (Optional) Integrate an external OCR API for better handwriting and set env keys.

You now have a single API that analyzes text from both typed and handwritten/typed PDF notes, with the option to plug in a stronger OCR service later.
