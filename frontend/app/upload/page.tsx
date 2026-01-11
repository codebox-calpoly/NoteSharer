// app/upload/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "./upload.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type ClassOption = {
  id: string;
  name: string;
  code: string | null;
};

type CourseRequestForm = {
  department: string;
  courseNumber: string;
  title: string;
  term: string;
  year: string;
  justification: string;
};

type CourseRequestStatus = "idle" | "submitting" | "success" | "error";

const emptyCourseRequest: CourseRequestForm = {
  department: "",
  courseNumber: "",
  title: "",
  term: "",
  year: "",
  justification: "",
};

export default function UploadPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classSearch, setClassSearch] = useState("");
  const [classId, setClassId] = useState<string | "all">("all");
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [isCourseRequestOpen, setIsCourseRequestOpen] = useState(false);
  const [courseRequest, setCourseRequest] =
    useState<CourseRequestForm>(emptyCourseRequest);
  const [courseRequestStatus, setCourseRequestStatus] =
    useState<CourseRequestStatus>("idle");
  const [courseRequestMessage, setCourseRequestMessage] = useState<
    string | null
  >(null);

  // Authentications
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log("UploadPage supabase.auth.getSession error:", error);
      }
      if (!data?.session) {
        // not logged in
        router.replace("/auth");
        return;
      }

      setIsAuthenticated(true);
    })();
  }, [router]);

  //recycled
  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setClassesError("Not authenticated");
      }
      setAccessToken(data.session?.access_token ?? null);
      setTokenLoaded(true);
    };
    loadSession();
  }, []);

  const selectedClassLabel = (() => {
    if (!classId) return "--Select Class--";
    const c = classes.find((cl) => cl.id === classId);
    if (!c) return "--Select Class--";
    return c.code ? `${c.name} (${c.code})` : c.name;
  })();

  const handleSelectClass = (id: string | "all") => {
    console.log("handleSelectClass:", id);
    setClassId(id);
    setIsClassDropdownOpen(false);
    setClassSearch("");
  };

  const openCourseRequest = () => {
    setIsClassDropdownOpen(false);
    setIsCourseRequestOpen(true);
    setCourseRequestStatus("idle");
    setCourseRequestMessage(null);
  };

  const closeCourseRequest = () => {
    setIsCourseRequestOpen(false);
    setCourseRequestStatus("idle");
    setCourseRequestMessage(null);
  };

  const handleCourseRequestChange =
    (field: keyof CourseRequestForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setCourseRequest((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleCourseRequestSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCourseRequestMessage(null);

    if (!accessToken) {
      setCourseRequestStatus("error");
      setCourseRequestMessage("Not authenticated. Please sign in again.");
      return;
    }

    const department = courseRequest.department.trim();
    const courseNumber = courseRequest.courseNumber.trim();

    if (!department || !courseNumber) {
      setCourseRequestStatus("error");
      setCourseRequestMessage("Department and course number are required.");
      return;
    }

    const yearText = courseRequest.year.trim();
    let yearValue: number | null = null;
    if (yearText) {
      const parsedYear = Number(yearText);
      if (!Number.isFinite(parsedYear)) {
        setCourseRequestStatus("error");
        setCourseRequestMessage("Year must be a number.");
        return;
      }
      yearValue = Math.trunc(parsedYear);
    }

    setCourseRequestStatus("submitting");

    try {
      const res = await fetch("/api/course-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          department,
          course_number: courseNumber,
          title: courseRequest.title.trim() || null,
          term: courseRequest.term.trim() || null,
          year: yearValue,
          justification: courseRequest.justification.trim() || null,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "Failed to submit the request.";
        setCourseRequestStatus("error");
        setCourseRequestMessage(message);
        return;
      }

      setCourseRequestStatus("success");
      setCourseRequestMessage("Request submitted. We will review it soon.");
      setCourseRequest(emptyCourseRequest);
    } catch (error) {
      setCourseRequestStatus("error");
      setCourseRequestMessage("Failed to submit the request. Try again.");
    }
  };

  const filteredClasses = useMemo(() => {
    const term = classSearch.trim().toLowerCase();
    if (!term) return classes;
    return classes.filter((c) => {
      const label = (c.name + (c.code ? ` ${c.code}` : "")).toLowerCase();
      return label.includes(term);
    });
  }, [classes, classSearch]);

  //

  useEffect(() => {
    if (!tokenLoaded) return;
    if (!accessToken) {
      setClassesError("Not authenticated");
      return;
    }

    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          const errorPayload =
            (await res.json().catch(async () => ({
              error: await res.text().catch(() => ""),
            }))) || {};
          setClassesError(errorPayload.error || "Failed to load classes");
          setClasses([]);
          return;
        }
        const data = await res.json();
        setClasses(data.classes || []);
      } catch (err) {
        setClassesError("Failed to load classes");
        setClasses([]);
      }
    };

    fetchClasses();
  }, [accessToken, tokenLoaded]);

  useEffect(() => {
    if (!isSuccess) return;
    const timer = window.setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [isSuccess, router]);

  // Cleanup preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  // File Upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setResult(null);
    setIsUploading(true);
    setIsSuccess(false);

    if (!file) {
      setSubmitError("No file selected");
      setIsUploading(false);
      return;
    }

    if (!classId || classId === "all") {
      setSubmitError("Please select a class before uploading.");
      setIsUploading(false);
      return;
    }

    if (!accessToken) {
      setSubmitError("Missing access token. Please re-authenticate.");
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("class_id", classId);
    formData.append("title", title);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      let payload: unknown;
      try {
        if (res.headers.get("content-type")?.includes("application/json")) {
          payload = await res.json();
        } else {
          const text = await res.text();
          payload = text ? { message: text } : null;
        }
      } catch (error) {
        payload = {
          error: "Response was not valid JSON",
          details: String(error),
        };
      }

      if (!res.ok) {
        const message =
          typeof payload === "object" && payload && "error" in payload
            ? String((payload as { error?: string }).error)
            : "Upload failed. Please try again.";
        setSubmitError(message);
        setIsUploading(false);
        return;
      }

      setResult(`${res.status}: ${JSON.stringify(payload)}`);
      setIsSuccess(true);
    } catch (error) {
      setSubmitError("Upload failed. Please check your connection and retry.");
    } finally {
      setIsUploading(false);
    }

    //json for deubgging purposes
    //setResult(`${res.status}: ${JSON.stringify(payload)}`);
  };

  if (isUploading) {
    return (
      <main className="upload-status-screen">
        <div className="upload-status-card">
          <div className="upload-spinner" aria-hidden="true" />
          <h1 className="upload-status-title">Uploading your notes…</h1>
          <p className="upload-status-subtitle">
            Hang tight while we save your file.
          </p>
        </div>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main className="upload-status-screen">
        <div className="upload-status-card">
          <div className="upload-success-check" aria-hidden="true">
            ✓
          </div>
          <h1 className="upload-status-title">Upload successful</h1>
          <p className="upload-status-subtitle">
            Redirecting you to your dashboard…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="upload-page">
      <header className="upload-hero">
        <div className="upload-hero-content">
          <p className="upload-eyebrow">Cal Poly SLO Notes</p>
          <h1 className="upload-title">Upload your notes</h1>
          <p className="upload-subtitle">
            Share course materials with fellow Mustangs in a clean, consistent
            format. PDFs keep the library tidy and searchable.
          </p>
        </div>
        <div className="upload-hero-badge" aria-hidden="true">
          PDF
        </div>
      </header>

      <section className="upload-panel">
        <div className="upload-panel-header">
          <h2 className="upload-panel-title">Add a new file</h2>
          <p className="upload-panel-subtitle">
            Select your class, upload the PDF, and add a quick title.
          </p>
        </div>

        {!isAuthenticated && (
          <p className="upload-alert upload-alert--info">
            Checking authentication… If you are not redirected, refresh the
            page.
          </p>
        )}

        {classesError && (
          <p className="upload-alert upload-alert--error">{classesError}</p>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-field">
            <label className="upload-label">File (PDF)</label>
            <div className="upload-file-wrapper">
              <input
                id="file-input"
                className="upload-input upload-input--file"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] ?? null;
                  setFile(selectedFile);
                  // Create preview URL for the selected file
                  if (selectedFile) {
                    const url = URL.createObjectURL(selectedFile);
                    setFilePreviewUrl(url);
                  } else {
                    if (filePreviewUrl) {
                      URL.revokeObjectURL(filePreviewUrl);
                    }
                    setFilePreviewUrl(null);
                  }
                }}
                style={{ display: "none" }}
              />
              <label
                htmlFor="file-input"
                className="upload-file-label"
              >
                {file ? file.name : "Choose File"}
              </label>
            </div>
            {file && (
              <button
                type="button"
                className="upload-preview-button"
                onClick={() => {
                  setShowPreview(true);
                }}
              >
                Preview PDF
              </button>
            )}
          </div>

          <div className="upload-field">
            <label className="upload-label">Class</label>
            <div className="upload-select">
              <button
                className="upload-select-trigger"
                type="button"
                onClick={() => setIsClassDropdownOpen((open) => !open)}
              >
                <span className="upload-select-value">
                  {selectedClassLabel}
                </span>
                <span className="upload-select-caret" aria-hidden="true">
                  ▾
                </span>
              </button>

              {isClassDropdownOpen && (
                <div className="upload-select-menu">
                  <div className="course-request-row">
                    <button
                      type="button"
                      className="course-request-button"
                      onClick={openCourseRequest}
                    >
                      Request a new course
                    </button>
                  </div>
                  <div className="upload-select-search">
                    <input
                      type="text"
                      className="upload-input upload-input--search"
                      placeholder="Search classes…"
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {filteredClasses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="upload-select-option"
                      onClick={() => handleSelectClass(c.id)}
                    >
                      {c.name}
                      {c.code ? ` (${c.code})` : ""}
                    </button>
                  ))}

                  {filteredClasses.length === 0 && (
                    <div className="upload-select-empty">
                      No classes match “{classSearch}”
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="upload-field">
            <label className="upload-label">Note title</label>
            <input
              className="upload-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: Midterm review sheet"
            />
          </div>

        {/* remove in production, kept for testing purposes */}

        {/*<div>
          <label className="block text-sm mb-1">Access Token (Bearer)</label>
          <input
            className="border px-2 py-1 w-full"
            value={accessToken ? accessToken : ""}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Paste a user access token"
          />
        </div>*/}

          {submitError && (
            <p className="upload-alert upload-alert--error">{submitError}</p>
          )}

          <button type="submit" className="upload-submit">
            Upload notes
          </button>
        </form>

        {result && <pre className="upload-result">{result}</pre>}
      </section>

      <aside className="upload-sidecard">
        <h3 className="upload-sidecard-title">Before you upload</h3>
        <ul className="upload-sidecard-list">
          <li>Name files clearly and keep titles short.</li>
          <li>Remove any personal contact info from the PDF.</li>
          <li>Make sure the content is legible on mobile screens.</li>
        </ul>
      </aside>

      {/* PDF Preview Modal */}
      {showPreview && filePreviewUrl && (
        <div
          className="upload-preview-modal"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="upload-preview-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="upload-preview-modal-header">
              <h3 className="upload-preview-modal-title">
                {file?.name || "PDF Preview"}
              </h3>
              <button
                type="button"
                className="upload-preview-modal-close"
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="upload-preview-modal-body">
              <Document
                file={filePreviewUrl}
                onLoadSuccess={({ numPages }) => {
                  setNumPages(numPages);
                  setPageNumber(1);
                }}
                onLoadError={(error) => {
                  console.error("PDF load error:", error);
                }}
                loading={
                  <div className="upload-preview-loading">Loading PDF...</div>
                }
                error={
                  <div className="upload-preview-error">
                    Failed to load PDF preview
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={Math.min(800, typeof window !== "undefined" ? window.innerWidth - 100 : 800)}
                  renderAnnotationLayer={false}
                  renderTextLayer={true}
                />
              </Document>
              {numPages && numPages > 1 && (
                <div className="upload-preview-controls">
                  <button
                    type="button"
                    onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                    disabled={pageNumber <= 1}
                    className="upload-preview-nav-button"
                  >
                    Previous
                  </button>
                  <span className="upload-preview-page-info">
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPageNumber((prev) => Math.min(numPages, prev + 1))
                    }
                    disabled={pageNumber >= numPages}
                    className="upload-preview-nav-button"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isCourseRequestOpen && (
        <div
          className="course-request-overlay"
          role="presentation"
          onClick={closeCourseRequest}
        >
          <div
            className="course-request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-request-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="course-request-header">
              <h2 id="course-request-title" className="course-request-title">
                Request a new course
              </h2>
              <button
                type="button"
                className="course-request-close"
                onClick={closeCourseRequest}
                aria-label="Close"
              >
                x
              </button>
            </div>
            <form
              className="course-request-form"
              onSubmit={handleCourseRequestSubmit}
            >
              <div className="course-request-grid">
                <label className="course-request-field">
                  <span className="course-request-label">Department *</span>
                  <input
                    className="course-request-input"
                    value={courseRequest.department}
                    onChange={handleCourseRequestChange("department")}
                    autoComplete="off"
                  />
                </label>
                <label className="course-request-field">
                  <span className="course-request-label">Course number *</span>
                  <input
                    className="course-request-input"
                    value={courseRequest.courseNumber}
                    onChange={handleCourseRequestChange("courseNumber")}
                    autoComplete="off"
                  />
                </label>
              </div>
              <label className="course-request-field">
                <span className="course-request-label">Course title</span>
                <input
                  className="course-request-input"
                  value={courseRequest.title}
                  onChange={handleCourseRequestChange("title")}
                  autoComplete="off"
                />
              </label>
              <div className="course-request-grid">
                <label className="course-request-field">
                  <span className="course-request-label">Term</span>
                  <input
                    className="course-request-input"
                    value={courseRequest.term}
                    onChange={handleCourseRequestChange("term")}
                    autoComplete="off"
                  />
                </label>
                <label className="course-request-field">
                  <span className="course-request-label">Year</span>
                  <input
                    className="course-request-input"
                    value={courseRequest.year}
                    onChange={handleCourseRequestChange("year")}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </label>
              </div>
              <label className="course-request-field">
                <span className="course-request-label">Justification</span>
                <textarea
                  className="course-request-textarea"
                  rows={3}
                  value={courseRequest.justification}
                  onChange={handleCourseRequestChange("justification")}
                />
              </label>
              {courseRequestMessage && (
                <p
                  className={`course-request-message ${
                    courseRequestStatus === "error" ? "is-error" : "is-success"
                  }`}
                  role="status"
                >
                  {courseRequestMessage}
                </p>
              )}
              <div className="course-request-actions">
                <button
                  type="button"
                  className="course-request-secondary"
                  onClick={closeCourseRequest}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="course-request-primary"
                  disabled={courseRequestStatus === "submitting"}
                >
                  {courseRequestStatus === "submitting"
                    ? "Submitting..."
                    : "Submit request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
