// app/upload/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSessionWithRecovery, supabase } from "@/lib/supabaseClient";
import { DesignNav } from "@/app/components/DesignNav";
import ProfileIcons from "@/app/dashboard/profile-icon";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import {
  CALPOLY_DEPARTMENT_CODES,
  CALPOLY_PLACEHOLDER_COURSES,
} from "@/app/dashboard/calpoly-catalog";
import "./upload.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type ClassOption = {
  id: string;
  name: string;
  code: string | null;
  department: string | null;
  term: string | null;
  year: number | null;
  note_count: number;
};

const resourceTypeOptions = [
  { label: "Lecture Notes", value: "lecture_notes" },
  { label: "Study Guide", value: "study_guide" },
  { label: "Class Overview", value: "class_overview" },
  { label: "Link", value: "link" },
] as const;

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classNumberInput, setClassNumberInput] = useState("");
  const [classId, setClassId] = useState<string>("");
  const [classNotFoundError, setClassNotFoundError] = useState<string | null>(null);
  const [isClassListOpen, setIsClassListOpen] = useState(false);
  const [department, setDepartment] = useState<string>("");
  const [classesError, setClassesError] = useState<string | null>(null);
  const [classesLoading, setClassesLoading] = useState(false);

  const [tokenLoaded, setTokenLoaded] = useState(false);
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [description, setDescription] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVisible] = useState(true);

  const [isCourseRequestOpen, setIsCourseRequestOpen] = useState(false);
  const [courseRequest, setCourseRequest] =
    useState<CourseRequestForm>(emptyCourseRequest);
  const [courseRequestStatus, setCourseRequestStatus] =
    useState<CourseRequestStatus>("idle");
  const [courseRequestMessage, setCourseRequestMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    (async () => {
      const { session, error } = await getSessionWithRecovery(supabase);
      if (error) console.log("UploadPage getSession error:", error);
      if (!session) {
        router.replace("/auth");
        return;
      }
    })();
  }, [router]);

  useEffect(() => {
    const loadSession = async () => {
      const { session, error } = await getSessionWithRecovery(supabase);
      if (error) setClassesError("Not authenticated");
      setAccessToken(session?.access_token ?? null);
      setTokenLoaded(true);
    };
    loadSession();
  }, []);

  useEffect(() => {
    if (!tokenLoaded || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/credits", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { credits?: number };
          setCredits(Number.isFinite(data?.credits) ? data.credits : 0);
        } else {
          setCredits(null);
        }
      } catch {
        if (!cancelled) setCredits(null);
      }
    })();
    return () => { cancelled = true; };
  }, [tokenLoaded, accessToken]);

  const openCourseRequest = () => {
    setIsClassListOpen(false);
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

    const dept = courseRequest.department.trim();
    const courseNumber = courseRequest.courseNumber.trim();

    if (!dept || !courseNumber) {
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
          department: dept,
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
    } catch {
      setCourseRequestStatus("error");
      setCourseRequestMessage("Failed to submit the request. Try again.");
    }
  };

  useEffect(() => {
    if (!tokenLoaded || !accessToken || !department.trim()) {
      setClasses([]);
      setClassId("");
      setClassNumberInput("");
      setClassNotFoundError(null);
      return;
    }
    let cancelled = false;
    setClasses([]);
    setClassId("");
    setClassNumberInput("");
    setClassNotFoundError(null);
    setClassesLoading(true);
    setClassesError(null);
    const fetchClasses = async () => {
      try {
        const res = await fetch(
          `/api/classes?limit=1000&offset=0&department=${encodeURIComponent(department.trim())}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (cancelled) return;
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          setClassesError((payload as { error?: string }).error || "Failed to load classes");
          setClasses([]);
          setClassesLoading(false);
          return;
        }
        const data = (await res.json()) as { classes?: ClassOption[] };
        const apiClasses = data.classes ?? [];
        const dept = department.trim().toUpperCase();
        const fallback =
          apiClasses.length === 0 && dept
            ? CALPOLY_PLACEHOLDER_COURSES.filter(
                (c) => (c.department ?? "").toUpperCase() === dept
              ).map(
                (c): ClassOption => ({
                  id: `placeholder:${c.code}`,
                  name: c.name,
                  code: c.code,
                  department: c.department,
                  term: null,
                  year: null,
                  note_count: 0,
                })
              )
            : [];
        setClasses(apiClasses.length > 0 ? apiClasses : fallback);
        setClassId("");
        setClassNumberInput("");
        setClassNotFoundError(null);
        setClassesError(null);
      } catch {
        if (!cancelled) {
          setClassesError("Failed to load classes");
          setClasses([]);
        }
      }
      if (!cancelled) setClassesLoading(false);
    };
    fetchClasses();
    return () => { cancelled = true; };
  }, [tokenLoaded, accessToken, department]);

  const displayClasses = useMemo(() => {
    const dept = department.trim().toUpperCase();
    if (!dept) return [];
    if (classes.length > 0) return classes;
    return CALPOLY_PLACEHOLDER_COURSES.filter(
      (c) => (c.department ?? "").toUpperCase() === dept
    ).map(
      (c): ClassOption => ({
        id: `placeholder:${c.code}`,
        name: c.name,
        code: c.code,
        department: c.department,
        term: null,
        year: null,
        note_count: 0,
      })
    );
  }, [department, classes]);

  const matchingClasses = useMemo(() => {
    const q = classNumberInput.trim().toUpperCase().replace(/\s+/g, " ");
    if (!q) return [];
    return displayClasses.filter((c) => {
      const code = (c.code ?? "").trim().toUpperCase();
      return code.includes(q) || code.startsWith(q);
    });
  }, [displayClasses, classNumberInput]);

  const matchClassFromInput = useCallback((): string | null => {
    const q = classNumberInput.trim();
    setClassNotFoundError(null);
    if (!q) {
      setClassId("");
      return null;
    }
    if (classesLoading) return null;
    const normalized = q.toUpperCase().replace(/\s+/g, " ").trim();
    const numOnly = normalized.replace(/^[A-Z]+\s*/i, "").trim() || normalized;
    const matches = displayClasses.filter((c) => {
      const code = (c.code ?? "").trim().toUpperCase().replace(/\s+/g, " ");
      if (code === normalized) return true;
      if (code.endsWith(" " + normalized)) return true;
      if (code.endsWith(" " + numOnly)) return true;
      const codeNum = code.replace(/^[A-Z]+\s*/i, "").trim();
      if (codeNum === numOnly || codeNum === normalized) return true;
      return false;
    });
    if (matches.length === 0) {
      setClassId("");
      setClassNotFoundError("No class found for that number. Check the code or request a new course.");
      return null;
    }
    if (matches.length > 1) {
      setClassId("");
      setClassNotFoundError("Multiple classes match — enter full code (e.g. CSC 101).");
      return null;
    }
    setClassId(matches[0].id);
    setClassNotFoundError(null);
    return matches[0].id;
  }, [classNumberInput, displayClasses, classesLoading]);

  useEffect(() => {
    if (!isSuccess) return;
    const t = window.setTimeout(() => router.push("/dashboard"), 1500);
    return () => window.clearTimeout(t);
  }, [isSuccess, router]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    if (selectedFile) {
      setFilePreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") handleFileChange(f);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsUploading(true);
    setIsSuccess(false);

    if (!file) {
      setSubmitError("Please add a file first.");
      setIsUploading(false);
      return;
    }
    if (!classId) {
      setSubmitError("Please select a class.");
      setIsUploading(false);
      return;
    }
    if (!title.trim()) {
      setSubmitError("Please enter a note title.");
      setIsUploading(false);
      return;
    }
    if (!resourceType) {
      setSubmitError("Please select a resource type.");
      setIsUploading(false);
      return;
    }
    if (!accessToken) {
      setSubmitError("Please sign in again.");
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("class_id", classId);
    formData.append("title", title.trim());
    formData.append("resource_type", resourceType);
    if (description.trim()) formData.append("description", description.trim());

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(
          typeof payload === "object" && payload && "error" in payload
            ? String(payload.error)
            : "Upload failed. Try again."
        );
        setIsUploading(false);
        return;
      }
      setIsSuccess(true);
    } catch {
      setSubmitError("Upload failed. Check your connection and retry.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isUploading) {
    return (
      <main className="upload-status-screen">
        <div className="upload-status-card">
          <div className="upload-spinner" aria-hidden="true" />
          <h1 className="upload-status-title">Uploading your notes…</h1>
          <p className="upload-status-subtitle">Hang tight while we save your file.</p>
        </div>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main className="upload-status-screen">
        <div className="upload-status-card">
          <div className="upload-success-check" aria-hidden="true">✓</div>
          <h1 className="upload-status-title">Upload successful</h1>
          <p className="upload-status-subtitle">Redirecting you to your dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="upload-page upload-page--design">
      <DesignNav
        active="upload"
        rightSlot={
          <>
            {credits != null && (
              <span className="upload-nav-credits">Credits: {credits}</span>
            )}
            <ProfileIcons />
          </>
        }
      />
      <div className="upload-page-inner">
        <div className="upload-layout">
          <section
            className={`upload-main-card page-enter ${isVisible ? "page-enter-visible" : "page-enter-hidden"}`}
            style={{ transitionDelay: "0ms" }}
          >
            <h1 className="upload-main-title">Upload Your Notes</h1>
            <p className="upload-main-subtitle">Share your knowledge and earn credits</p>

            {step === 1 && (
              <div className="upload-step">
                <h2 className="upload-step-heading">Step 1: Upload Files</h2>
                <div
                  className="upload-dragzone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    id="upload-file-input"
                    type="file"
                    accept="application/pdf"
                    className="upload-dragzone-input"
                    onChange={(e) => {
                      const chosen = e.target.files?.[0] ?? null;
                      if (chosen) handleFileChange(chosen);
                      e.target.value = "";
                    }}
                  />
                  <label htmlFor="upload-file-input" className="upload-dragzone-label">
                    <span className="upload-dragzone-icon" aria-hidden>📄</span>
                    <span className="upload-dragzone-text">
                      {file ? file.name : "Drag and drop your file here"}
                    </span>
                    <span className="upload-dragzone-browse">
                      {file ? "Change file" : "or click to browse"}
                    </span>
                    <span className="upload-dragzone-hint">Supported format: PDF (Max 25MB)</span>
                  </label>
                </div>
                <div className="upload-step-buttons-row">
                  {file && filePreviewUrl && (
                    <button
                      type="button"
                      className="upload-preview-btn"
                      onClick={() => setShowPreview(true)}
                    >
                      Preview PDF
                    </button>
                  )}
                  <button
                    type="button"
                    className="upload-step-continue btn-lift"
                    onClick={() => setStep(2)}
                    disabled={!file}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="upload-step">
                <h2 className="upload-step-heading">Step 2: Note details</h2>
                <div className="upload-fields">
                  <div className="upload-field">
                    <label className="upload-label">Department *</label>
                    <select
                      className="upload-input"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    >
                      <option value="">Select department</option>
                      {CALPOLY_DEPARTMENT_CODES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="upload-field upload-field-class">
                    <label className="upload-label">Class *</label>
                    <div className="upload-class-wrap">
                      <input
                        type="text"
                        className="upload-input"
                        placeholder={
                          !department
                            ? "Select department first"
                            : classesLoading
                              ? "Loading…"
                              : "e.g. AGED, CSC 101, or 101"
                        }
                        value={classNumberInput}
                        onChange={(e) => {
                          setClassNumberInput(e.target.value);
                          setClassNotFoundError(null);
                          setIsClassListOpen(true);
                        }}
                        onFocus={() => setIsClassListOpen(true)}
                        onBlur={() => {
                          setTimeout(() => {
                            setIsClassListOpen(false);
                            matchClassFromInput();
                          }, 200);
                        }}
                        disabled={!department}
                        autoComplete="off"
                        aria-invalid={!!classNotFoundError}
                        aria-describedby={classNotFoundError ? "class-error" : undefined}
                        aria-controls="class-results-list"
                      />
                      {isClassListOpen && classNumberInput.trim() && department && (
                        <div
                          id="class-results-list"
                          className="upload-class-results"
                          role="listbox"
                        >
                          <div className="course-request-row">
                            <button
                              type="button"
                              className="course-request-button"
                              onClick={openCourseRequest}
                            >
                              Request a new course
                            </button>
                          </div>
                          {matchingClasses.length === 0 ? (
                            <div className="upload-class-results-empty">
                              No classes match. Request a new course?
                            </div>
                          ) : (
                            matchingClasses.slice(0, 80).map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                role="option"
                                aria-selected={classId === c.id}
                                className="upload-class-result-item"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setClassId(c.id);
                                  setClassNumberInput((c.code ?? c.name) ?? "");
                                  setClassNotFoundError(null);
                                  setIsClassListOpen(false);
                                }}
                              >
                                <span className="upload-class-result-code">{c.code ?? c.name}</span>
                                {c.name && c.name !== (c.code ?? "") && (
                                  <span className="upload-class-result-name">{c.name}</span>
                                )}
                              </button>
                            ))
                          )}
                          {matchingClasses.length > 80 && (
                            <div className="upload-class-results-more">
                              Type more to narrow ({matchingClasses.length} matches)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {classNotFoundError && (
                      <p id="class-error" className="upload-field-error" role="alert">
                        {classNotFoundError}
                      </p>
                    )}
                    {classesError && !classNotFoundError && (
                      <p className="upload-field-error" role="alert">
                        {classesError}
                      </p>
                    )}
                    <div className="upload-request-course-wrap">
                      <button
                        type="button"
                        className="upload-request-course-link"
                        onClick={openCourseRequest}
                      >
                        Request a new course
                      </button>
                    </div>
                  </div>
                  <div className="upload-field">
                    <label className="upload-label">Note title *</label>
                    <input
                      className="upload-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Midterm review sheet"
                      required
                    />
                  </div>
                  <div className="upload-field">
                    <label className="upload-label">Resource type *</label>
                    <select
                      className="upload-input"
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value)}
                      required
                    >
                      <option value="">Select type</option>
                      {resourceTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="upload-step-actions">
                  <button type="button" className="upload-step-back" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button
                    type="button"
                    className="upload-step-continue btn-lift"
                    onClick={() => {
                      const id = matchClassFromInput() ?? classId;
                      if (!id || !department?.trim() || !title.trim() || !resourceType) return;
                      if (id.startsWith("placeholder:")) {
                        setClassNotFoundError(
                          "This course isn’t in the catalog yet. Request a new course (link below) to add it."
                        );
                        return;
                      }
                      setStep(3);
                    }}
                    disabled={!department || !title.trim() || !resourceType}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form className="upload-step" onSubmit={handleSubmit}>
                <h2 className="upload-step-heading">Step 3: Add a description</h2>
                <p className="upload-step-desc">
                  This short description will be shown when someone clicks your note on the dashboard.
                </p>
                <div className="upload-field">
                  <label className="upload-label">Description (optional)</label>
                  <textarea
                    className="upload-input upload-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Covers chapters 1–3, key formulas and examples"
                    rows={4}
                    maxLength={2000}
                  />
                  <span className="upload-char-count">{description.length}/2000</span>
                </div>
                {submitError && (
                  <p className="upload-alert upload-alert--error" role="alert">{submitError}</p>
                )}
                <div className="upload-step-actions">
                  <button type="button" className="upload-step-back" onClick={() => setStep(2)}>
                    Back
                  </button>
                  <button type="submit" className="upload-submit-btn btn-lift">
                    Upload notes
                  </button>
                </div>
              </form>
            )}
          </section>

          <aside className="upload-sidecard upload-sidecard--credits" aria-label="Credits info">
            <h3 className="upload-sidecard-title">How Credits Work</h3>
            <div className="upload-credits-list">
              <div className="upload-credits-item">
                <span className="upload-credits-icon upload-credits-icon--upload" aria-hidden>↑</span>
                <div>
                  <h4 className="upload-credits-item-title">Upload Notes</h4>
                  <p className="upload-credits-item-desc">
                    Earn credits per note after approval: Lecture Notes &amp; Study Guide: 3 credits, Class Overview: 5 credits, Link: 1 credit.
                  </p>
                </div>
              </div>
              <div className="upload-credits-item">
                <span className="upload-credits-icon upload-credits-icon--download" aria-hidden>↓</span>
                <div>
                  <h4 className="upload-credits-item-title">Download Notes</h4>
                  <p className="upload-credits-item-desc">
                    Use 3 credits to download notes from others.
                  </p>
                </div>
              </div>
              <div className="upload-credits-item">
                <span className="upload-credits-icon upload-credits-icon--quality" aria-hidden>★</span>
                <div>
                  <h4 className="upload-credits-item-title">Quality Bonus</h4>
                  <p className="upload-credits-item-desc">
                    Earn extra credits when your notes are highly rated.
                  </p>
                </div>
              </div>
            </div>
            <p className="upload-sidecard-tip">
              Upload quality notes to build your credit balance and access more resources!
            </p>
            <div className="upload-balance-box">
              <span className="upload-balance-label">Your Current Balance</span>
              <span className="upload-balance-value">{credits != null ? `${credits} Credits` : "—"}</span>
            </div>
          </aside>
        </div>
      </div>

      {showPreview && filePreviewUrl && (
        <div className="upload-preview-modal" onClick={() => setShowPreview(false)}>
          <div className="upload-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="upload-preview-modal-header">
              <h3 className="upload-preview-modal-title">{file?.name ?? "PDF Preview"}</h3>
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
                loading={<div className="upload-preview-loading">Loading PDF…</div>}
                error={<div className="upload-preview-error">Failed to load PDF</div>}
              >
                <Page
                  pageNumber={pageNumber}
                  width={Math.min(800, typeof window !== "undefined" ? window.innerWidth - 100 : 800)}
                  renderAnnotationLayer={false}
                  renderTextLayer={true}
                />
              </Document>
              {numPages != null && numPages > 1 && (
                <div className="upload-preview-controls">
                  <button
                    type="button"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                    className="upload-preview-nav-button"
                  >
                    Previous
                  </button>
                  <span className="upload-preview-page-info">Page {pageNumber} of {numPages}</span>
                  <button
                    type="button"
                    onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
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

      {isCourseRequestOpen &&
        typeof document !== "undefined" &&
        createPortal(
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
          </div>,
          document.body
        )}
    </main>
  );
}
