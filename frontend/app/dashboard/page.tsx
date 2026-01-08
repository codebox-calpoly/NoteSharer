"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PDFThumbnail from "@/app/components/pdf/PDFThumbnail";

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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
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
      } catch (err) {
        setClassesError("Failed to load classes");
        setClasses([]);
      }
    };

    fetchClasses();
  }, [accessToken, tokenLoaded]);

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
      } catch (err) {
        setNotesError("Unexpected error fetching notes");
        setHasMore(false);
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [page, selectedClassId, sortOrder, accessToken, tokenLoaded]);

  const handleSelectClass = (id: string | "all") => {
    setSelectedClassId(id);
    setPage(1);
    setNotes([]);
    setIsClassDropdownOpen(false);
    setClassSearch("");
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

  const selectedClassLabel =
    selectedClassId === "all"
      ? "All classes"
      : (() => {
          const c = classes.find((cl) => cl.id === selectedClassId);
          if (!c) return "Unknown class";
          return c.code ? `${c.name} (${c.code})` : c.name;
        })();

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          type="button"
          className="border rounded px-3 py-1 text-sm bg-white text-gray-800"
          onClick={() => router.replace("/upload")}
        >
          {isUploadOpen ? "Cancel" : "Upload"}
        </button>
      </header>

      {/* Class Selection */}
      <section className="flex flex-wrap gap-4 items-center">
        <div className="relative min-w-[220px]">
          <label className="block text-sm mb-1">Class</label>

          <div
            className="border rounded px-2 py-1 flex items-center justify-between cursor-pointer bg-white"
            onClick={() => setIsClassDropdownOpen((open) => !open)}
          >
            <span className="text-sm truncate text-gray-800">
              {selectedClassLabel}
            </span>
            <span className="ml-2 text-xs text-gray-700">▾</span>
          </div>

          {isClassDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full border rounded bg-white shadow-md max-h-64 overflow-y-auto">
              <div className="course-request-row">
                <button
                  type="button"
                  className="course-request-button"
                  onClick={openCourseRequest}
                >
                  Request a new course
                </button>
              </div>
              <div className="p-2 border-b">
                <input
                  type="text"
                  className="w-full border px-2 py-1 text-sm text-gray-800 placeholder:text-gray-500"
                  placeholder="Search classes…"
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSelectClass("all")}
              >
                All classes
              </button>

              {filteredClasses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
                  onClick={() => handleSelectClass(c.id)}
                >
                  {c.name}
                  {c.code ? ` (${c.code})` : ""}
                </button>
              ))}

              {filteredClasses.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-700">
                  No classes match “{classSearch}”
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Selection */}
        <div className="relative">
          <label className="block text-sm mb-1">Sort</label>
          <button
            type="button"
            className="border rounded px-3 py-1 text-sm bg-white text-gray-800"
            onClick={() => setIsFilterOpen((open) => !open)}
          >
            Filters <span className="text-gray-700">▾</span>
          </button>
          {isFilterOpen && (
            <div className="absolute z-10 mt-1 w-40 border rounded bg-white shadow-md overflow-hidden">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSelectSort("newest")}
              >
                Newest
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSelectSort("oldest")}
              >
                Oldest
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Notes list */}
      <section>
        {classesError && (
          <p className="text-sm text-red-500 mb-2">{classesError}</p>
        )}

        {notesError && (
          <p className="text-sm text-red-500 mb-2">{notesError}</p>
        )}

        <ul className="divide-y">
          {notes.map((note) => (
            <li key={note.id} className="py-3">
              <div className="flex gap-4 items-start">
                <div className="relative w-[200px]">
                  {note.previewUrl ? (
                    <PDFThumbnail fileUrl={note.previewUrl} width={200} />
                  ) : (
                    <div className="w-[200px] h-[280px] bg-gray-100 border rounded flex items-center justify-center text-xs text-gray-600">
                      No preview
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/60 text-white px-3 py-2 flex flex-col justify-end gap-1 rounded-b">
                    <div className="text-sm font-semibold leading-tight line-clamp-2">
                      {note.title}
                    </div>
                    <div className="text-[11px] text-gray-100 leading-tight">
                      <span className="font-medium">
                        {note.profile_display_name ?? "Unknown uploader"}
                      </span>
                      {" • "}
                      {new Date(note.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-[11px] text-gray-100">
                      <span className="text-green-200 font-semibold">
                        ↑ {note.upvote_count ?? 0}
                      </span>
                      {" / "}
                      <span className="text-red-200 font-semibold">
                        ↓ {note.downvote_count ?? 0}
                      </span>
                      {" • "}
                      <span className="font-semibold">
                        Score: {note.score ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {loadingNotes && (
          <p className="mt-3 text-sm text-gray-600">Loading notes…</p>
        )}

        {!loadingNotes && hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            className="mt-4 border rounded px-3 py-1 text-sm text-gray-800 bg-white"
          >
            Load more
          </button>
        )}

        {!loadingNotes && !hasMore && notes.length > 0 && (
          <p className="mt-3 text-xs text-gray-600">No more notes to load.</p>
        )}

        {!loadingNotes && notes.length === 0 && !notesError && (
          <p className="mt-3 text-sm text-gray-600">No notes found.</p>
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
    </main>
  );
}
