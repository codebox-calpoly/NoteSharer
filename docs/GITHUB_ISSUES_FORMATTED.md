# GitHub Issues for Note Sharer Development

**Notes:**
- Resources already default to `status = 'pending'` in the database schema (see `supabase/migrations/202411100910_note_sharer_base_schema.sql` line 111). The upload API doesn't need to explicitly set status since the database default handles this automatically. **Issue #29 "Update Upload API to Store Resources as Pending" is not needed and has been removed.**
- **Issue #33 "Implement Download API with Signed URLs"** has been replaced with **Issue 4: Generate Signed URLs for Secure File Access**, which focuses SOLELY on signed URL generation (not the download API). This signed URL implementation is part of the "Note Downloading (backend functionality)" work (Issue #27).
- **Duplicate Download Issues:** Download functionality is covered in both `GITHUB_ISSUES.md` (Issue #8) and `GITHUB_ISSUES_DETAILED.md` (Issues #8.1, #8.2, #8.3). Consider consolidating to avoid confusion.

---

## Issue 1: Create Moderation Queue System

**Description:****
Create a moderation system where moderators can review pending uploads, approve them (which awards credits), or reject them with a reason. This includes API routes and a moderation page UI.

**Step-by-Step Instructions:**

1. **Create API route to fetch pending resources:**
   ```bash
   mkdir -p frontend/app/api/moderation
   touch frontend/app/api/moderation/pending/route.ts
   ```
   - Verify user is authenticated
   - Check user has moderator role (query `user_roles` table for roles: moderator, teacher, ta, admin, developer)
   - Query `resources` table where `status = 'pending'`
   - Return list of pending resources with details (title, course, uploader, preview, etc.)

2. **Create API route to approve resources:**
   ```bash
   touch frontend/app/api/moderation/approve/route.ts
   ```
   - Accept `resourceId` in request body
   - Verify moderator access
   - Update resource `status` to 'active'
   - Award credits based on `resource_type`:
     - Lecture Notes: 3 credits
     - Study Guide: 3 credits
     - Class Overview: 5 credits
     - Link: 1 credit
   - Insert credit entry into `credits_ledger` table

3. **Create API route to reject resources:**
   ```bash
   touch frontend/app/api/moderation/reject/route.ts
   ```
   - Accept `resourceId` and `reason` in request body
   - Verify moderator access
   - Update resource `status` to 'rejected'
   - Store rejection reason in `ai_metadata` JSONB field
   - Do NOT award credits

4. **Create moderation page UI:**
   ```bash
   mkdir -p frontend/app/moderation
   touch frontend/app/moderation/page.tsx
   ```
   - Check authentication and moderator role
   - Fetch pending resources from `/api/moderation/pending`
   - Display list of pending resources with details
   - Add approve/reject buttons for each resource
   - Show rejection reason input modal for reject action
   - Refresh list after approve/reject actions

**Acceptance Criteria:**
- [ ] Moderators can fetch list of pending resources via API
- [ ] Moderators can approve resources, which updates status to 'active' and awards credits
- [ ] Moderators can reject resources with a reason (stored in `ai_metadata`)
- [ ] Moderation page displays pending resources with details
- [ ] Only users with moderator roles can access
- [ ] Credits are recorded in `credits_ledger` table on approval

---

## Issue 2: Add Resource Type to Upload Flow

**Description:****
Add resource type selection to the upload form and store it in the database. The PRD specifies four resource types: Lecture Notes, Study Guide, Class Overview, and Link. Each type earns different credits upon approval.

**Step-by-Step Instructions:**

1. **Check if database column exists:**
   ```sql
   -- Run this query in Supabase SQL editor
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'resources' AND column_name = 'resource_type';
   ```
   - If column doesn't exist, create migration first:
     ```sql
     ALTER TABLE public.resources ADD COLUMN resource_type text;
     ALTER TABLE public.resources ADD CONSTRAINT check_resource_type 
       CHECK (resource_type IN ('lecture_notes', 'study_guide', 'class_overview', 'link'));
     ```

2. **Add resource type dropdown to upload form:**
   - In the upload form component (Issue #4)
   - Add dropdown with options: "Lecture Notes", "Study Guide", "Class Overview", "Link"
   - Make it a required field
   - Store selected value in form state

3. **Send resource type to API:**
   - Add `resource_type` to FormData when submitting upload
   - Map display names to database values:
     - "Lecture Notes" → "lecture_notes"
     - "Study Guide" → "study_guide"
     - "Class Overview" → "class_overview"
     - "Link" → "link"

4. **Update upload API to accept and validate resource type:**
   - Extract `resource_type` from FormData
   - Validate against allowed values
   - Store in database insert statement
   - Return error if invalid type

5. **Test:**
   - Upload with each resource type
   - Verify type is stored correctly in database
   - Verify invalid types are rejected

**Acceptance Criteria:**
- [ ] Upload form includes resource type dropdown
- [ ] Resource type is sent to `/api/upload` endpoint in FormData
- [ ] Upload API validates resource type and stores it in database
- [ ] Resource type is stored in `resources.resource_type` column

---

## Issue 3: Add Credit Display to Dashboard

**Description:****
Display the user's current credit balance and free download vouchers in the dashboard so users know how many credits they have available for downloads.

**Step-by-Step Instructions:**

1. **Create credits API route:**
   ```bash
   touch frontend/app/api/credits/route.ts
   ```
   - Verify user authentication
   - Query `credit_balances` view for user's credit balance
   - Query `download_vouchers` table for unredeemed vouchers (where `redeemed_at IS NULL`)
   - Return both values

2. **Add credit display to dashboard:**
   - In `/frontend/app/dashboard/page.tsx`
   - Add state for credits and vouchers
   - Fetch from `/api/credits` on component mount
   - Display in dashboard header or sidebar
   - Format: "Credits: 12" and "Free Downloads: 2"

3. **Refresh credits after actions:**
   - Refresh after download (if download functionality exists)
   - Refresh after upload approval (if user is uploader)
   - Consider using a refresh function that can be called after actions

4. **Test:**
   - Verify credits display correctly
   - Verify vouchers display correctly
   - Verify values update after actions

**Acceptance Criteria:**
- [ ] Credits API route exists at `/api/credits`
- [ ] Dashboard displays current credit balance
- [ ] Dashboard displays free download vouchers if available
- [ ] Credit balance updates after downloads or upload approvals

---

## Issue 4: Generate Signed URLs for Secure File Access (Note Downloading Backend)

**Description:**
Implement signed URL generation for secure, time-limited access to files in Supabase Storage. This is part of the "Note Downloading (backend functionality)" work. Signed URLs are needed for file downloads and preview images. This issue focuses SOLELY on signed URL generation - the download API logic (credit checking, deduction, etc.) is handled in a separate issue.

**Current State:**
The notes API already uses signed URLs for preview images (see `/api/notes/route.ts` lines 141-145). This issue ensures signed URLs are properly implemented for the download functionality and used consistently across the application for all private file access.

**Step-by-Step Instructions:**

1. **Review existing signed URL usage:**
   - Check `/api/notes/route.ts` for preview image signed URLs
   - Verify current implementation uses `createSignedUrl()` method
   - Note the TTL (time-to-live) currently used

2. **Understand Supabase signed URLs:**
   - Signed URLs are generated server-side using Supabase Storage client
   - They provide temporary access (typically 1 hour) to private files
   - Format: `supabase.storage.from('bucket').createSignedUrl('file_path', expiresIn)`
   - Returns: `{ data: { signedUrl: string } }`

3. **Create helper function for signed URL generation (optional):**
   ```typescript
   // In a utility file like /frontend/lib/storage.ts
   export async function generateSignedUrl(
     bucket: string,
     filePath: string,
     expiresIn: number = 3600 // 1 hour default
   ): Promise<string> {
     const supabase = createClient(/* with service role key for server-side */);
     const { data, error } = await supabase.storage
       .from(bucket)
       .createSignedUrl(filePath, expiresIn);
     
     if (error || !data) {
       throw new Error(`Failed to generate signed URL: ${error?.message}`);
     }
     
     return data.signedUrl;
   }
   ```

4. **Ensure preview images use signed URLs:**
   - In `/api/notes/route.ts`, verify preview images use signed URLs
   - If not, update to generate signed URLs for `preview_key` from resources
   - TTL: 1 hour (3600 seconds) is appropriate for previews

5. **Document signed URL usage:**
   - Document which buckets use signed URLs (resources, previews)
   - Document TTL values used (previews: 1 hour, downloads: 1 hour)
   - Note that signed URLs should be generated server-side only

6. **Test signed URL generation:**
   - Generate signed URL for a test file
   - Verify URL is accessible
   - Verify URL expires after TTL period
   - Verify invalid/expired URLs return appropriate errors

**Acceptance Criteria:**
- [ ] Signed URLs are generated for preview images in notes API
- [ ] Signed URLs have appropriate TTL (1 hour recommended)
- [ ] Signed URLs are generated server-side only (not exposed in client code)
- [ ] Helper function exists (optional but recommended)
- [ ] Documentation explains signed URL usage and TTL values
- [ ] Expired URLs are handled gracefully

**Code References:**
- Supabase Storage: `createSignedUrl()` method
- Current implementation: Check `/api/notes/route.ts` lines 141-145 for existing usage
- Storage buckets: `resources` (PDFs), `previews` (PNG teasers)
- Related issue: "Note Downloading (backend functionality)" - this signed URL implementation is part of that work

**Note:** This issue is separate from the download API implementation. The download API will use the signed URL helper/functionality created in this issue, but credit checking, deduction, and download flow logic are handled in the download API issue.

---

## Issue 5: Extract PDF Text Content for Enhanced Search Matching

**Description:**
Extract text content from uploaded PDFs and store it in the database to enable full-text search within PDF documents. This will allow users to search for notes not just by title and description, but also by matching text found inside the PDF files themselves.

**Step-by-Step Instructions:**

1. **Install PDF text extraction library:**
   ```bash
   cd frontend
   npm install pdf-parse
   ```
   - This library extracts text content from PDF files
   - Works server-side in Next.js API routes

2. **Create database migration to add extracted_text field:**
   ```bash
   touch supabase/migrations/YYYYMMDDHHMMSS_add_extracted_text_to_resources.sql
   ```
   - Migration should:
     ```sql
     -- Add extracted_text field to resources table
     ALTER TABLE public.resources 
     ADD COLUMN IF NOT EXISTS extracted_text text;

     -- Update the full-text search index to include extracted_text
     DROP INDEX IF EXISTS idx_resources_fts;
     CREATE INDEX idx_resources_fts ON public.resources 
     USING gin (to_tsvector('english', 
       coalesce(title,'') || ' ' || 
       coalesce(description,'') || ' ' || 
       coalesce(extracted_text,'')
     ));
     ```
   - This adds the field and updates the FTS index to include PDF content

3. **Apply the migration:**
   ```bash
   cd supabase
   supabase db push
   ```
   - Or run the SQL directly in Supabase SQL Editor if migration sync issues occur

4. **Update upload API to extract PDF text:**
   - In `/frontend/app/api/upload/route.ts`
   - Import pdf-parse:
     ```typescript
     import pdf from "pdf-parse";
     ```
   - After file buffer is created, extract text:
     ```typescript
     const fileBuffer = Buffer.from(await file.arrayBuffer());
     
     // Extract text from PDF for search functionality
     let extractedText = "";
     try {
       const pdfData = await pdf(fileBuffer);
       extractedText = pdfData.text || "";
       // Limit extracted text to reasonable size (first 50000 characters)
       // This prevents database bloat while maintaining search functionality
       if (extractedText.length > 50000) {
         extractedText = extractedText.substring(0, 50000);
       }
     } catch (err) {
       // If PDF parsing fails, continue without extracted text
       // Log warning but don't fail the upload
       console.warn("PDF text extraction failed:", err);
       extractedText = "";
     }
     ```

5. **Store extracted text in database:**
   - Update the resource insert to include extracted_text:
     ```typescript
     const { data: resource, error: insertError } = await supabase
       .from("resources")
       .insert({
         profile_id: userId,
         course_id: classId,
         title,
         file_key: filePath,
         preview_key: filePath,
         extracted_text: extractedText || null, // Store extracted text
       })
       .select()
       .single();
     ```

6. **Update search API to include extracted_text:**
   - In `/frontend/app/api/notes/route.ts`
   - Update the search query to include extracted_text field:
     ```typescript
     // Full-text search using the FTS index (searches title, description, and extracted PDF text)
     if (searchQuery && searchQuery.trim()) {
       const searchTerm = `%${searchQuery.trim()}%`;
       query = query.or(
         `title.ilike.${searchTerm},description.ilike.${searchTerm},extracted_text.ilike.${searchTerm}`
       );
     }
     ```

7. **Handle edge cases:**
   - PDFs with no extractable text (images, scanned PDFs): Store empty string or null
   - Very large PDFs: Limit extraction to first 50,000 characters to prevent database bloat
   - Corrupted PDFs: Catch errors and continue upload without extracted text
   - Password-protected PDFs: Handle gracefully (may fail extraction)

8. **Test the implementation:**
   - Upload a PDF with text content
   - Verify extracted_text is stored in database
   - Search for text that appears in the PDF but not in title/description
   - Verify search returns the correct note
   - Test with image-only PDF (should handle gracefully)
   - Test with very large PDF (should truncate appropriately)
   - Verify existing notes without extracted_text still work

9. **Consider performance:**
   - PDF text extraction happens during upload (async, doesn't block user)
   - Extraction may add 1-3 seconds to upload time for large PDFs
   - Consider adding progress indicator if extraction takes long
   - Monitor server performance with PDF extraction enabled

**Acceptance Criteria:**
- [ ] `pdf-parse` library is installed
- [ ] Database migration adds `extracted_text` field to resources table
- [ ] Full-text search index includes `extracted_text` field
- [ ] Upload API extracts text from PDFs during upload
- [ ] Extracted text is stored in database (limited to 50,000 characters)
- [ ] Search API searches in title, description, AND extracted_text
- [ ] Search returns notes matching text found inside PDFs
- [ ] Uploads handle PDF extraction failures gracefully (don't fail upload)
- [ ] Large PDFs are handled appropriately (text truncation)
- [ ] Image-only or corrupted PDFs don't break the upload process
- [ ] Existing notes without extracted_text still appear in search results

**Technical Notes:**
- PDF text extraction uses `pdf-parse` library (server-side only)
- Text is limited to 50,000 characters to prevent database bloat
- Extraction happens synchronously during upload (may add 1-3 seconds)
- The full-text search index (`idx_resources_fts`) is updated to include extracted text
- Search uses PostgreSQL's `ilike` for case-insensitive pattern matching
- Extracted text is stored as `text` type in PostgreSQL (unlimited length, but we limit it)
- If extraction fails, upload continues without extracted text (graceful degradation)

**Code References:**
- Upload API: `/frontend/app/api/upload/route.ts`
- Search API: `/frontend/app/api/notes/route.ts`
- Database schema: `supabase/migrations/202411100910_note_sharer_base_schema.sql`
- Full-text search index: `idx_resources_fts` (line 124 in base schema)
- PDF parsing library: `pdf-parse` npm package

**Estimated Effort:** 4-6 hours

**Related Issues:**
- This builds on the existing search functionality (title and description matching)
- May be useful for AI pre-screening (Issue #12) to detect prohibited keywords in PDF content
