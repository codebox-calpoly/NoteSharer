"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PDFThumbnail from "@/app/components/pdf/PDFThumbnail";
import "./dashboard.css";

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

type Note = {
  id: string;
  title: string;
  created_at: string;
  class_id: string | null;
  storage_path: string | null;
  previewUrl: string | null;
  profile_display_name: string | null;
  upvote_count: number;
  downvote_count: number;
  score: number;
};

export default function DashboardPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classSearch, setClassSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | "all">("all");
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [isCourseRequestOpen, setIsCourseRequestOpen] = useState(false);
  const [courseRequest, setCourseRequest] =
    useState<CourseRequestForm>(emptyCourseRequest);
  const [courseRequestStatus, setCourseRequestStatus] =
    useState<CourseRequestStatus>("idle");
  const [courseRequestMessage, setCourseRequestMessage] = useState<
    string | null
  >(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [freeDownloads, setFreeDownloads] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const router = useRouter();

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setClassesError("Failed to load classes");
        setClasses([]);
      }
    };

    fetchClasses();
  }, [accessToken, tokenLoaded]);

  const refreshCredits = useCallback(async () => {
    if (!accessToken) {
      setCredits(null);
      setFreeDownloads(null);
      return;
    }

    try {
      const res = await fetch("/api/credits", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        setCredits(null);
        setFreeDownloads(null);
        return;
      }

      const data = await res.json();
      setCredits(
        Number.isFinite(data?.credits) ? Number(data.credits) : 0,
      );
      setFreeDownloads(
        Number.isFinite(data?.freeDownloads) ? Number(data.freeDownloads) : 0,
      );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setCredits(null);
      setFreeDownloads(null);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!tokenLoaded) return;
    refreshCredits();
  }, [refreshCredits, tokenLoaded]);

  const filteredClasses = useMemo(() => {
    const term = classSearch.trim().toLowerCase();
    if (!term) return classes;
    return classes.filter((c) => {
      const label = (c.name + (c.code ? ` ${c.code}` : "")).toLowerCase();
      return label.includes(term);
    });
  }, [classes, classSearch]);

  useEffect(() => {
    if (!tokenLoaded) return;
    const fetchNotes = async () => {
      setLoadingNotes(true);
      setNotesError(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", "16");
      params.set("sort", sortOrder);

      if (selectedClassId !== "all") {
        params.set("class_id", selectedClassId);
      }

      if (noteSearch.trim()) {
        params.set("search", noteSearch.trim());
      }

      try {
        const res = await fetch(`/api/notes?${params.toString()}`, {
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : undefined,
        });
        if (!res.ok) {
          const errorPayload =
            (await res.json().catch(async () => ({
              error: await res.text().catch(() => ""),
            }))) || {};
          setNotesError(errorPayload.error || "Failed to fetch notes");
          setHasMore(false);
          setLoadingNotes(false);
          return;
        }

        const data = await res.json();
        const incoming: Note[] = data.notes || [];

        if (page === 1) {
          setNotes(incoming);
        } else {
          setNotes((prev) => [...prev, ...incoming]);
        }

        setHasMore(Boolean(data.hasMore));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setNotesError("Unexpected error fetching notes");
        setHasMore(false);
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [page, selectedClassId, sortOrder, noteSearch, accessToken, tokenLoaded]);

  const handleSelectClass = (id: string | "all") => {
    setSelectedClassId(id);
    setPage(1);
    setNotes([]);
    setIsClassDropdownOpen(false);
    setClassSearch("");
    setHasMore(false);
  };

  const handleSearchChange = (value: string) => {
    setNoteSearch(value);
    setPage(1);
    setNotes([]);
    setHasMore(false);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setCourseRequestStatus("error");
      setCourseRequestMessage("Failed to submit the request. Try again.");
    }
  };

  const handleSelectSort = (order: "newest" | "oldest") => {
    setSortOrder(order);
    setPage(1);
    setHasMore(false);
    setIsFilterOpen(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingNotes) {
      setPage((prev) => prev + 1);
    }
  };

  const handleDownload = async (noteId: string) => {
    if (!accessToken) {
      setDownloadError("Not authenticated. Please sign in again.");
      return;
    }

    if (downloadingId) return;

    setDownloadError(null);
    setDownloadingId(noteId);

    try {
      const res = await fetch(`/api/notes/${noteId}/download`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "Failed to download note.";
        setDownloadError(message);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = res.headers.get("content-disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const fallbackName = `${noteId}.pdf`;
      link.href = url;
      link.download = match?.[1] || fallbackName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      refreshCredits();
    } catch {
      setDownloadError("Failed to download note. Try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenNoteModal = (note: Note) => {
    setSelectedNote(note);
    setIsNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false);
    setSelectedNote(null);
  };

  const handleReportNote = () => {
    // TODO: wire report flow
  };

  const selectedClassLabel =
    selectedClassId === "all"
      ? "All classes"
      : (() => {
          const c = classes.find((cl) => cl.id === selectedClassId);
          if (!c) return "Unknown class";
          return c.code ? `${c.name} (${c.code})` : c.name;
        })();

  return (
    <main className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <div className="dashboard-kicker">Notes hub</div>
          <h1 className="dashboard-title">Dashboard</h1>
        </div>
        <div className="dashboard-credit-summary">
          <span className="dashboard-credit-pill">
            Credits: {credits ?? "—"}
          </span>
          <span className="dashboard-credit-pill">
            Free Downloads: {freeDownloads ?? "—"}
          </span>
        </div>
      </header>

      <section className="dashboard-controls">
        <div className="dashboard-control-row">
          <div className="dashboard-control-group">
            {/* Note Search */}
            <div className="dashboard-control">
              <label className="dashboard-label">Search notes</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Type to search notes by title..."
                value={noteSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <div className="dashboard-control">
              <label className="dashboard-label">Class</label>

              <div
                className="dashboard-select"
                onClick={() => setIsClassDropdownOpen((open) => !open)}
              >
                <span className="dashboard-select-text">
                  {selectedClassLabel}
                </span>
                <span className="dashboard-select-caret">▾</span>
              </div>

              {isClassDropdownOpen && (
                <div className="dashboard-dropdown">
                  <div className="course-request-row">
                    <button
                      type="button"
                      className="course-request-button"
                      onClick={openCourseRequest}
                    >
                      Request a new course
                    </button>
                  </div>
                  <div className="dashboard-dropdown-search">
                    <input
                      type="text"
                      className="dashboard-search-input"
                      placeholder="Search classes…"
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <button
                    type="button"
                    className="dashboard-dropdown-item"
                    onClick={() => handleSelectClass("all")}
                  >
                    All classes
                  </button>

                  {filteredClasses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="dashboard-dropdown-item"
                      onClick={() => handleSelectClass(c.id)}
                    >
                      {c.name}
                      {c.code ? ` (${c.code})` : ""}
                    </button>
                  ))}

                  {filteredClasses.length === 0 && (
                    <div className="dashboard-empty">
                      No classes match “{classSearch}”
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filter Selection */}
            <div className="dashboard-control">
              <label className="dashboard-label">Sort</label>
              <button
                type="button"
                className="dashboard-select-button"
                onClick={() => setIsFilterOpen((open) => !open)}
              >
                Filters <span className="dashboard-select-caret">▾</span>
              </button>
              {isFilterOpen && (
                <div className="dashboard-dropdown dashboard-dropdown-compact">
                  <button
                    type="button"
                    className="dashboard-dropdown-item"
                    onClick={() => handleSelectSort("newest")}
                  >
                    Newest
                  </button>
                  <button
                    type="button"
                    className="dashboard-dropdown-item"
                    onClick={() => handleSelectSort("oldest")}
                  >
                    Oldest
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="dashboard-upload-slot">
            <button
              type="button"
              className="dashboard-upload"
              onClick={() => router.replace("/upload")}
            >
              {isUploadOpen ? "Cancel" : "Upload"}
            </button>
          </div>
        </div>
      </section>

      {/* Notes list */}
      <section>
        {classesError && <p className="dashboard-error">{classesError}</p>}

        {notesError && <p className="dashboard-error">{notesError}</p>}

        {downloadError && <p className="dashboard-error">{downloadError}</p>}

        <ul className="dashboard-grid">
          {notes.map((note) => (
            <li
              key={note.id}
              className="dashboard-card"
              onClick={() => handleOpenNoteModal(note)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleOpenNoteModal(note);
                }
              }}
            >
              <div className="dashboard-card-media">
                {note.previewUrl ? (
                  <PDFThumbnail fileUrl={note.previewUrl} width={240} />
                ) : (
                  <div className="dashboard-no-preview">No preview</div>
                )}
                <div className="dashboard-card-overlay">
                  <div className="dashboard-card-title">{note.title}</div>
                  <div className="dashboard-card-meta">
                    <span className="dashboard-card-author">
                      {note.profile_display_name ?? "Unknown uploader"}
                    </span>
                    {" • "}
                    {new Date(note.created_at).toLocaleDateString()}
                  </div>
                  <div className="dashboard-card-stats">
                    <span className="dashboard-votes-up">
                      ↑ {note.upvote_count ?? 0}
                    </span>
                    {" / "}
                    <span className="dashboard-votes-down">
                      ↓ {note.downvote_count ?? 0}
                    </span>
                    {" • "}
                    <span className="dashboard-score">
                      Score: {note.score ?? 0}
                    </span>
                  </div>
                  <div className="dashboard-download-row">
                    <button
                      type="button"
                      className="dashboard-download"
                      onClick={() => handleDownload(note.id)}
                      disabled={downloadingId === note.id}
                    >
                      {downloadingId === note.id ? "Preparing..." : "Download"}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {loadingNotes && <p className="dashboard-loading">Loading notes…</p>}

        {!loadingNotes && hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            className="dashboard-load-more"
          >
            Load more
          </button>
        )}

        {!loadingNotes && !hasMore && notes.length > 0 && (
          <p className="dashboard-subtle">No more notes to load.</p>
        )}

        {!loadingNotes && notes.length === 0 && !notesError && (
          <p className="dashboard-empty-state">No notes found.</p>
        )}
      </section>

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

      {isNoteModalOpen && selectedNote && (
        <div
          className="note-modal-overlay"
          role="presentation"
          onClick={handleCloseNoteModal}
        >
          <div
            className="note-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="note-modal-header">
              <h2 id="note-modal-title" className="note-modal-title">
                {selectedNote.title}
              </h2>
              <button
                type="button"
                className="note-modal-close"
                onClick={handleCloseNoteModal}
                aria-label="Close"
              >
                x
              </button>
            </div>
            <div className="note-modal-content">
              <div className="note-modal-preview">
                {selectedNote.previewUrl ? (
                  <PDFThumbnail fileUrl={selectedNote.previewUrl} width={400} />
                ) : (
                  <div className="note-modal-no-preview">No preview available</div>
                )}
              </div>
              <div className="note-modal-details">
                <p>
                  <strong>Uploader:</strong> {selectedNote.profile_display_name ?? "Unknown"}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(selectedNote.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Upvotes:</strong> {selectedNote.upvote_count ?? 0}
                </p>
                <p>
                  <strong>Downvotes:</strong> {selectedNote.downvote_count ?? 0}
                </p>
                <p>
                  <strong>Score:</strong> {selectedNote.score ?? 0}
                </p>
              </div>
            </div>
            <div className="note-modal-actions">
              <button
                type="button"
                className="note-modal-report-btn"
                onClick={handleReportNote}
              >
                Report
              </button>
              <button
                type="button"
                className="note-modal-close-btn"
                onClick={handleCloseNoteModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
