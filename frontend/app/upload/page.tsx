// app/upload/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const COURSE_REQUEST_TERMS = ["Fall", "Winter", "Spring", "Summer"] as const;
const COURSE_REQUEST_YEARS = Array.from({ length: 51 }, (_, i) => String(2000 + i));

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
  const searchParams = useSearchParams();
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
  const [showRequestCourseModal, setShowRequestCourseModal] = useState(false);
  const [requestDepartment, setRequestDepartment] = useState("");
  const [requestCourseNumber, setRequestCourseNumber] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestTerm, setRequestTerm] = useState("");
  const [requestYear, setRequestYear] = useState("");
  const [requestJustification, setRequestJustification] = useState("");
  const [requestCourseError, setRequestCourseError] = useState<string | null>(null);
  const [requestCourseSuccess, setRequestCourseSuccess] = useState<string | null>(null);
  const [isSubmittingCourseRequest, setIsSubmittingCourseRequest] = useState(false);
  const [showRequestCourseToast, setShowRequestCourseToast] = useState(false);

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

  useEffect(() => {
    const departmentParam = searchParams.get("department")?.trim().toUpperCase() ?? "";
    const courseNumberParam = (searchParams.get("course_number")?.trim() ?? "").replace(/\D/g, "");
    const titleParam = searchParams.get("title")?.trim() ?? "";
    const termParam = searchParams.get("term")?.trim() ?? "";
    const yearParam = searchParams.get("year")?.trim() ?? "";

    if (departmentParam) {
      setRequestDepartment(departmentParam);
      if (!department) setDepartment(departmentParam);
    }
    if (courseNumberParam) {
      setRequestCourseNumber(courseNumberParam);
      if (!classNumberInput) setClassNumberInput(courseNumberParam);
    }
    if (titleParam) setRequestTitle(titleParam);
    if (termParam && COURSE_REQUEST_TERMS.includes(termParam as (typeof COURSE_REQUEST_TERMS)[number])) {
      setRequestTerm(termParam);
    }
    if (yearParam && COURSE_REQUEST_YEARS.includes(yearParam)) {
      setRequestYear(yearParam);
    }
  }, [searchParams, department, classNumberInput]);

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

  const openCourseRequestModal = useCallback(() => {
    setRequestCourseError(null);
    setRequestCourseSuccess(null);
    setRequestDepartment((prev) => prev || department.trim().toUpperCase());
    setRequestCourseNumber((prev) => prev || classNumberInput.trim());
    setShowRequestCourseModal(true);
  }, [department, classNumberInput]);

  const handleCourseRequestSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setRequestCourseError(null);
      setRequestCourseSuccess(null);

      if (!requestDepartment.trim()) {
        setRequestCourseError("Department is required.");
        return;
      }
      if (!requestCourseNumber.trim()) {
        setRequestCourseError("Course number is required.");
        return;
      }
      if (!requestTitle.trim()) {
        setRequestCourseError("Course title is required.");
        return;
      }
      if (!requestTerm.trim()) {
        setRequestCourseError("Term is required.");
        return;
      }
      if (!requestYear.trim()) {
        setRequestCourseError("Year is required.");
        return;
      }
      if (!requestJustification.trim()) {
        setRequestCourseError("Justification is required.");
        return;
      }
      if (!/^\d+$/.test(requestCourseNumber.trim())) {
        setRequestCourseError("Course number must contain only numbers.");
        return;
      }
      if (!accessToken) {
        setRequestCourseError("Please sign in again.");
        return;
      }

      const yearValue = requestYear.trim();
      const parsedYear = yearValue ? Number.parseInt(yearValue, 10) : null;
      if (
        yearValue &&
        (!Number.isFinite(parsedYear) || parsedYear == null || parsedYear < 2000 || parsedYear > 2050)
      ) {
        setRequestCourseError("Year must be between 2000 and 2050.");
        return;
      }
      if (
        requestTerm.trim() &&
        !COURSE_REQUEST_TERMS.includes(requestTerm.trim() as (typeof COURSE_REQUEST_TERMS)[number])
      ) {
        setRequestCourseError("Please select a valid term.");
        return;
      }

      setIsSubmittingCourseRequest(true);
      try {
        const res = await fetch("/api/course-submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            department: requestDepartment.trim().toUpperCase(),
            course_number: requestCourseNumber.trim(),
            title: requestTitle.trim() || null,
            term: requestTerm.trim() || null,
            year: parsedYear,
            justification: requestJustification.trim() || null,
          }),
        });

        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setRequestCourseError(payload.error || "Failed to submit course request.");
          return;
        }

        setRequestCourseSuccess("Request submitted. The team has been notified.");
        setShowRequestCourseToast(true);
        setShowRequestCourseModal(false);
      } catch {
        setRequestCourseError("Failed to submit course request.");
      } finally {
        setIsSubmittingCourseRequest(false);
      }
    },
    [
      requestDepartment,
      requestCourseNumber,
      requestTitle,
      requestTerm,
      requestYear,
      requestJustification,
      accessToken,
    ]
  );

  useEffect(() => {
    if (!isSuccess) return;
    const t = window.setTimeout(() => router.push("/dashboard"), 1500);
    return () => window.clearTimeout(t);
  }, [isSuccess, router]);

  useEffect(() => {
    if (!showRequestCourseToast) return;
    const t = window.setTimeout(() => setShowRequestCourseToast(false), 2000);
    return () => window.clearTimeout(t);
  }, [showRequestCourseToast]);

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
            <Link href="/upload" className="upload-nav-upload-btn">Upload Notes</Link>
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
            <div className="upload-request-course-banner">
              <span className="upload-request-course-banner-text">
                Can&apos;t find your class?
              </span>
              <button
                type="button"
                className="upload-request-course-banner-button"
                onClick={openCourseRequestModal}
              >
                Request a new course
              </button>
            </div>
            {requestCourseError && step === 1 && (
              <p className="upload-field-error" role="alert">
                {requestCourseError}
              </p>
            )}
            {requestCourseSuccess && step === 1 && (
              <p className="upload-field-success" role="status">
                {requestCourseSuccess}
              </p>
            )}

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
                          {matchingClasses.length === 0 ? (
                            <div className="upload-class-results-empty">
                              <p>No classes match.</p>
                              <button
                                type="button"
                                className="upload-class-results-request-btn"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  openCourseRequestModal();
                                }}
                              >
                                Request this course
                              </button>
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
                    <button
                      type="button"
                      className="upload-request-course-link"
                      onClick={openCourseRequestModal}
                    >
                      Request a new course
                    </button>
                    {requestCourseError && (
                      <p className="upload-field-error" role="alert">
                        {requestCourseError}
                      </p>
                    )}
                    {requestCourseSuccess && (
                      <p className="upload-field-success" role="status">
                        {requestCourseSuccess}
                      </p>
                    )}
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

      {showRequestCourseModal && (
        <div className="upload-request-modal" onClick={() => setShowRequestCourseModal(false)}>
          <div
            className="upload-request-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-course-title"
          >
            <div className="upload-request-modal-header">
              <h3 id="request-course-title" className="upload-request-modal-title">
                Request a New Course
              </h3>
              <button
                type="button"
                className="upload-request-modal-close"
                onClick={() => setShowRequestCourseModal(false)}
                aria-label="Close course request form"
              >
                ×
              </button>
            </div>
            <form className="upload-request-form" onSubmit={handleCourseRequestSubmit} noValidate>
              <label className="upload-label">
                Department *
                <select
                  className="upload-input"
                  value={requestDepartment}
                  onChange={(e) => setRequestDepartment(e.target.value)}
                >
                  <option value="">Select department</option>
                  {CALPOLY_DEPARTMENT_CODES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="upload-label">
                Course number *
                <input
                  className="upload-input"
                  value={requestCourseNumber}
                  onChange={(e) => setRequestCourseNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 101"
                  inputMode="numeric"
                />
              </label>
              <label className="upload-label">
                Course title *
                <input
                  className="upload-input"
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="e.g. Data Structures"
                />
              </label>
              <div className="upload-request-form-row">
                <label className="upload-label">
                  Term *
                  <select
                    className="upload-input"
                    value={requestTerm}
                    onChange={(e) => setRequestTerm(e.target.value)}
                  >
                    <option value="">Select term</option>
                    {COURSE_REQUEST_TERMS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="upload-label">
                  Year *
                  <select
                    className="upload-input"
                    value={requestYear}
                    onChange={(e) => setRequestYear(e.target.value)}
                  >
                    <option value="">Select year</option>
                    {COURSE_REQUEST_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="upload-label">
                Why do you need this course?*
                <textarea
                  className="upload-input upload-textarea"
                  value={requestJustification}
                  onChange={(e) => setRequestJustification(e.target.value)}
                  placeholder="Explain what this course is."
                  rows={4}
                  maxLength={2000}
                />
              </label>
              {requestCourseError && (
                <p className="upload-field-error" role="alert">
                  {requestCourseError}
                </p>
              )}
              <div className="upload-request-modal-actions">
                <button
                  type="button"
                  className="upload-step-back"
                  onClick={() => setShowRequestCourseModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="upload-step-continue btn-lift"
                  disabled={isSubmittingCourseRequest}
                >
                  {isSubmittingCourseRequest ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRequestCourseToast && (
        <div className="upload-request-toast" role="status" aria-live="polite">
          Successfully submitted
        </div>
      )}

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
    </main>
  );
}
