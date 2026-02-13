"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSessionWithRecovery, supabase } from "@/lib/supabaseClient";
import PDFThumbnail from "@/app/components/pdf/PDFThumbnail";
import ProfileIcons from "../../profile-icon";
import { getCourseSubline } from "../../course-name-utils";
import "../../dashboard.css";
import "../../browse.css";
import "../../course-detail.css";

type CourseOption = {
  id: string;
  name: string;
  code: string | null;
  department: string | null;
  term: string | null;
  year: number | null;
  note_count: number;
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
  my_vote: number | null;
  download_cost: number;
  downloaded: boolean;
};

type ReportStatus = "idle" | "submitting" | "success" | "error";

function termYearLabel(term: string | null, year: number | null): string {
  if (term && year != null) return `${term} ${year}`;
  if (term) return term;
  if (year != null) return String(year);
  return "—";
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = typeof params.classId === "string" ? params.classId : null;

  const [course, setCourse] = useState<CourseOption | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [downloadedFilter, setDownloadedFilter] = useState<
    "downloaded" | "not_downloaded"
  >("not_downloaded");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [freeDownloads, setFreeDownloads] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportStatus, setReportStatus] = useState<ReportStatus>("idle");
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [notesVersion, setNotesVersion] = useState(0);
  const [noteForVotePrompt, setNoteForVotePrompt] = useState<Note | null>(null);
  const [isVotePromptOpen, setIsVotePromptOpen] = useState(false);

  const refreshToken = useCallback(async () => {
    const { session, error } = await getSessionWithRecovery(supabase);
    if (error) return null;
    const newToken = session?.access_token ?? null;
    if (newToken) setAccessToken(newToken);
    return newToken;
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      const { session, error } = await getSessionWithRecovery(supabase);
      if (error) setCoursesError("Not authenticated");
      setAccessToken(session?.access_token ?? null);
      setTokenLoaded(true);
    };
    loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!tokenLoaded || !accessToken || !classId) return;
    let active = true;
    const fetchCourses = async () => {
      try {
        let res = await fetch("/api/classes", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            res = await fetch("/api/classes", {
              headers: { Authorization: `Bearer ${newToken}` },
            });
          }
        }
        if (!active) return;
        if (!res.ok) {
          setCoursesError("Failed to load course");
          setCourse(null);
          return;
        }
        const data = (await res.json()) as { classes?: CourseOption[] };
        const list = data.classes ?? [];
        const found = list.find((c) => c.id === classId) ?? null;
        setCourse(found);
        setCoursesError(found ? null : "Course not found");
      } catch {
        if (active) {
          setCoursesError("Failed to load course");
          setCourse(null);
        }
      }
    };
    fetchCourses();
    return () => {
      active = false;
    };
  }, [accessToken, tokenLoaded, classId, refreshToken]);

  const fetchCredits = useCallback(
    async (token: string | null) => {
      if (!token) return null;
      try {
        let res = await fetch("/api/credits", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          const newToken = await refreshToken();
          if (newToken)
            res = await fetch("/api/credits", {
              headers: { Authorization: `Bearer ${newToken}` },
            });
        }
        if (!res.ok) return null;
        const data = (await res.json()) as {
          credits?: number;
          freeDownloads?: number;
        };
        return {
          credits: Number.isFinite(data?.credits) ? Number(data.credits) : 0,
          freeDownloads: Number.isFinite(data?.freeDownloads)
            ? Number(data.freeDownloads)
            : 0,
        };
      } catch {
        return null;
      }
    },
    [refreshToken],
  );

  useEffect(() => {
    if (!tokenLoaded) return;
    let active = true;
    const load = async () => {
      const payload = await fetchCredits(accessToken);
      if (!active) return;
      if (!payload) {
        setCredits(null);
        setFreeDownloads(null);
        return;
      }
      setCredits(payload.credits);
      setFreeDownloads(payload.freeDownloads);
    };
    load();
    return () => {
      active = false;
    };
  }, [accessToken, tokenLoaded, fetchCredits]);

  useEffect(() => {
    if (!tokenLoaded || !classId) return;
    const fetchNotes = async () => {
      setLoadingNotes(true);
      setNotesError(null);
      const params = new URLSearchParams();
      params.set("class_id", classId);
      params.set("page", String(page));
      params.set("page_size", "16");
      params.set("sort", sortOrder);
      try {
        let res = await fetch(`/api/notes?${params.toString()}`, {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
        });
        if (res.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            res = await fetch(`/api/notes?${params.toString()}`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
          }
        }
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setNotesError(payload.error || "Failed to fetch notes");
          setHasMore(false);
          setLoadingNotes(false);
          return;
        }
        const data = (await res.json()) as {
          notes?: Note[];
          hasMore?: boolean;
        };
        const incoming = data.notes ?? [];
        if (page === 1) {
          setNotes(incoming);
        } else {
          setNotes((prev) => [...prev, ...incoming]);
        }
        setHasMore(Boolean(data.hasMore));
      } catch {
        setNotesError("Unexpected error fetching notes");
        setHasMore(false);
      } finally {
        setLoadingNotes(false);
      }
    };
    fetchNotes();
  }, [
    page,
    classId,
    sortOrder,
    accessToken,
    tokenLoaded,
    refreshToken,
    notesVersion,
  ]);

  const filteredNotes = useMemo(() => {
    const list = notes.filter((n) =>
      downloadedFilter === "downloaded" ? n.downloaded : !n.downloaded,
    );
    return [...list].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });
  }, [notes, downloadedFilter, sortOrder]);

  const handleDownload = useCallback(
    async (noteId: string) => {
      if (!accessToken) {
        setDownloadError("Not authenticated. Please sign in again.");
        return;
      }
      if (downloadingId) return;
      setDownloadError(null);
      setDownloadingId(noteId);
      try {
        let res = await fetch(`/api/notes/${noteId}/download`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            res = await fetch(`/api/notes/${noteId}/download`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
          } else {
            setDownloadError("Session expired. Please sign in again.");
            setDownloadingId(null);
            return;
          }
        }
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setDownloadError(
            payload && typeof payload === "object" && "error" in payload
              ? String(payload.error)
              : "Failed to download note.",
          );
          setDownloadingId(null);
          return;
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        const disposition = res.headers.get("content-disposition");
        const match = disposition?.match(/filename="([^"]+)"/);
        link.href = url;
        link.download = match?.[1] || `${noteId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        const payload = await fetchCredits(accessToken);
        if (payload) {
          setCredits(payload.credits);
          setFreeDownloads(payload.freeDownloads);
        }
        setNotes((prev) => {
          const updated = prev.map((n) =>
            n.id === noteId ? { ...n, downloaded: true } : n,
          );
          const note = prev.find((n) => n.id === noteId);
          if (note) {
            setNoteForVotePrompt({ ...note, downloaded: true });
            setIsVotePromptOpen(true);
          }
          return updated;
        });
        if (selectedNote?.id === noteId) {
          setSelectedNote((prev) =>
            prev ? { ...prev, downloaded: true } : null,
          );
        }
      } catch {
        setDownloadError("Failed to download note. Try again.");
      } finally {
        setDownloadingId(null);
      }
    },
    [
      accessToken,
      downloadingId,
      refreshToken,
      fetchCredits,
      selectedNote?.id,
    ],
  );

  const handleVote = useCallback(
    async (noteId: string, value: 1 | -1) => {
      if (!accessToken) {
        setVoteError("Not authenticated. Please sign in again.");
        return;
      }
      if (votingId) return;
      setVoteError(null);
      setVotingId(noteId);
      try {
        let res = await fetch(`/api/notes/${noteId}/vote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ value }),
        });
        if (res.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            res = await fetch(`/api/notes/${noteId}/vote`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({ value }),
            });
          }
        }
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setVoteError(
            payload && typeof payload === "object" && "error" in payload
              ? String(payload.error)
              : "Failed to vote.",
          );
          setVotingId(null);
          return;
        }
        setNotes((prev) => {
          const n = prev.find((x) => x.id === noteId);
          const prevVote = n?.my_vote ?? 0;
          const upDelta =
            (value === 1 ? 1 : 0) - (prevVote === 1 ? 1 : 0);
          const downDelta =
            (value === -1 ? 1 : 0) - (prevVote === -1 ? 1 : 0);
          const scoreDelta = value - prevVote;
          return prev.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  my_vote: value,
                  upvote_count: (n.upvote_count ?? 0) + upDelta,
                  downvote_count: (n.downvote_count ?? 0) + downDelta,
                  score: (n.score ?? 0) + scoreDelta,
                }
              : n,
          );
        });
        setSelectedNote((prev) => {
          if (!prev || prev.id !== noteId) return prev;
          const prevVote = prev.my_vote ?? 0;
          const upDelta = (value === 1 ? 1 : 0) - (prevVote === 1 ? 1 : 0);
          const downDelta =
            (value === -1 ? 1 : 0) - (prevVote === -1 ? 1 : 0);
          const scoreDelta = value - prevVote;
          return {
            ...prev,
            my_vote: value,
            upvote_count: (prev.upvote_count ?? 0) + upDelta,
            downvote_count: (prev.downvote_count ?? 0) + downDelta,
            score: (prev.score ?? 0) + scoreDelta,
          };
        });
        const payload = await fetchCredits(accessToken);
        if (payload) {
          setCredits(payload.credits);
          setFreeDownloads(payload.freeDownloads);
        }
        setNotesVersion((v) => v + 1);
      } catch {
        setVoteError("Failed to vote. Try again.");
      } finally {
        setVotingId(null);
      }
    },
    [accessToken, votingId, refreshToken, fetchCredits, selectedNote],
  );

  const handleOpenNoteModal = (note: Note) => {
    setSelectedNote(note);
    setIsNoteModalOpen(true);
    setVoteError(null);
  };

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false);
    setSelectedNote(null);
    setIsReportOpen(false);
  };

  const handleReportNote = () => {
    if (!selectedNote) return;
    setReportReason("");
    setReportStatus("idle");
    setReportMessage(null);
    setIsReportOpen(true);
  };

  const handleCloseReport = () => {
    setIsReportOpen(false);
    setReportReason("");
    setReportStatus("idle");
    setReportMessage(null);
  };

  const handleSubmitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedNote) return;
    const trimmedReason = reportReason.trim();
    if (!trimmedReason) return;
    setReportStatus("submitting");
    setReportMessage(null);
    try {
      const res = await fetch("https://formspree.io/f/mwvbvqln", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          noteId: selectedNote.id,
          noteTitle: selectedNote.title,
          classId: selectedNote.class_id ?? "",
          reason: trimmedReason,
        }),
      });
      if (!res.ok) {
        setReportStatus("error");
        setReportMessage("Failed to send report. Please try again.");
        return;
      }
      setReportStatus("success");
      setReportMessage("Thanks for reporting. We'll review this note.");
      setReportReason("");
    } catch {
      setReportStatus("error");
      setReportMessage("Failed to send report. Please try again.");
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingNotes) setPage((p) => p + 1);
  };

  if (!classId) {
    return (
      <div className="course-detail-page">
        <p className="course-detail-error">Invalid course.</p>
        <Link href="/dashboard">Back to Browse</Link>
      </div>
    );
  }

  if (coursesError && !course) {
    return (
      <div className="course-detail-page">
        <nav className="browse-navbar">
          <div className="browse-navbar-inner">
            <Link href="/dashboard" className="browse-nav-logo">
              <span className="browse-nav-logo-text">NoteSharer</span>
            </Link>
            <div className="browse-nav-center">
              <Link href="/dashboard" className="browse-nav-link active">
                Browse Notes
              </Link>
              <Link href="/leaderboard" className="browse-nav-link">
                Leaderboard
              </Link>
            </div>
            <div className="browse-nav-right">
              <span className="browse-credits-pill">Credits: {credits ?? "—"}</span>
              <Link href="/upload" className="browse-upload-btn">
                Upload Notes
              </Link>
              <ProfileIcons />
            </div>
          </div>
        </nav>
        <div className="course-detail-body">
          <p className="course-detail-error">{coursesError}</p>
          <Link href="/dashboard">Back to Browse</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <nav className="browse-navbar">
        <div className="browse-navbar-inner">
          <Link href="/dashboard" className="browse-nav-logo">
            <span className="browse-nav-logo-text">NoteSharer</span>
          </Link>
          <div className="browse-nav-center">
            <Link href="/dashboard" className="browse-nav-link active">
              Browse Courses
            </Link>
            <Link href="/leaderboard" className="browse-nav-link">
              Leaderboard
            </Link>
          </div>
          <div className="browse-nav-right">
            <span className="browse-credits-pill">Credits: {credits ?? "—"}</span>
            <Link href="/upload" className="browse-upload-btn">
              Upload Notes
            </Link>
            <ProfileIcons />
          </div>
        </div>
      </nav>

      <div className="course-detail-body">
        {course && (
          <>
            <header className="course-detail-header">
              <div className="course-detail-header-info">
                <div className="course-detail-header-top">
                  <span className="course-detail-term-badge">
                    {termYearLabel(course.term, course.year)}
                  </span>
                </div>
                <h1 className="course-detail-title">{course.code ?? course.name}</h1>
                {(() => {
                  const subline = getCourseSubline(course.code);
                  return subline ? <p className="course-detail-subline">{subline}</p> : null;
                })()}
              </div>
              <Link
                href={`/upload?course=${course.id}`}
                className="course-detail-add-note"
              >
                Add Note
              </Link>
            </header>

            <div className="course-detail-tabs">
              <button type="button" className="course-detail-tab active">
                Notes
              </button>
              <button type="button" className="course-detail-tab" disabled>
                Resources
              </button>
              <button type="button" className="course-detail-tab" disabled>
                Top Contributors
              </button>
            </div>

            <div className="course-detail-filters">
              <div className="course-detail-filter-group">
                <span className="course-detail-filter-label">Filter:</span>
                <button
                  type="button"
                  className={`course-detail-filter-btn ${downloadedFilter === "downloaded" ? "active" : ""}`}
                  onClick={() => {
                    setDownloadedFilter("downloaded");
                    setPage(1);
                    setHasMore(false);
                  }}
                >
                  Downloaded notes
                </button>
                <button
                  type="button"
                  className={`course-detail-filter-btn ${downloadedFilter === "not_downloaded" ? "active" : ""}`}
                  onClick={() => {
                    setDownloadedFilter("not_downloaded");
                    setPage(1);
                    setHasMore(false);
                  }}
                >
                  New notes
                </button>
              </div>
              <div className="course-detail-filter-group">
                <span className="course-detail-filter-label">Sort:</span>
                <button
                  type="button"
                  className={`course-detail-filter-btn ${sortOrder === "newest" ? "active" : ""}`}
                  onClick={() => {
                    setSortOrder("newest");
                    setPage(1);
                    setNotesVersion((v) => v + 1);
                  }}
                >
                  Newest
                </button>
                <button
                  type="button"
                  className={`course-detail-filter-btn ${sortOrder === "oldest" ? "active" : ""}`}
                  onClick={() => {
                    setSortOrder("oldest");
                    setPage(1);
                    setNotesVersion((v) => v + 1);
                  }}
                >
                  Oldest
                </button>
              </div>
              <span className="course-detail-notes-count">
                {filteredNotes.length} notes available
              </span>
            </div>

            {downloadError && (
              <p className="course-detail-error">{downloadError}</p>
            )}
            {voteError && (
              <p className="course-detail-error" role="alert">
                {voteError}
              </p>
            )}
            {notesError && (
              <p className="course-detail-error">{notesError}</p>
            )}

            <div className="course-detail-note-grid">
              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className="course-detail-note-card"
                  onClick={() => handleOpenNoteModal(note)}
                >
                  <h3 className="course-detail-note-title">{note.title}</h3>
                  <p className="course-detail-note-by">
                    by {note.profile_display_name ?? "Anonymous"}
                  </p>
                  <div className="course-detail-note-meta">
                    <div className="course-detail-note-votes">
                      <span className="course-detail-note-vote-up">
                        ↑ {note.upvote_count ?? 0}
                      </span>
                      <span className="course-detail-note-vote-down">
                        ↓ {note.downvote_count ?? 0}
                      </span>
                    </div>
                    <span className="course-detail-note-credits">
                      {note.downloaded ? "🔓" : "🔒"} {note.downloaded ? "Owned" : `−${note.download_cost} credits`}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {loadingNotes && (
              <p className="course-detail-loading">Loading notes…</p>
            )}
            {!loadingNotes && hasMore && (
              <button
                type="button"
                className="course-detail-load-more"
                onClick={handleLoadMore}
              >
                Load more
              </button>
            )}
            {!loadingNotes &&
              filteredNotes.length === 0 &&
              !notesError && (
                <p className="course-detail-empty">No notes in this course yet.</p>
              )}
          </>
        )}
      </div>

      {/* Note preview modal – download only from modal */}
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
            onClick={(e) => e.stopPropagation()}
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
                ×
              </button>
            </div>
            <div className="note-modal-content">
              <div className="note-modal-preview">
                {selectedNote.previewUrl ? (
                  <PDFThumbnail
                    fileUrl={selectedNote.previewUrl}
                    width={400}
                  />
                ) : (
                  <div className="note-modal-no-preview">
                    No preview available
                  </div>
                )}
              </div>
              <div className="note-modal-details">
                <p>
                  <strong>Uploader:</strong>{" "}
                  {selectedNote.profile_display_name ?? "Unknown"}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(selectedNote.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Download:</strong>{" "}
                  {selectedNote.downloaded
                    ? "You have this (re-download free)"
                    : `−${selectedNote.download_cost} credits`}
                </p>
                <p className="note-modal-score-hint" title="Net score">
                  Score: {selectedNote.score ?? 0}{" "}
                  <span className="note-modal-score-desc">(up − down)</span>
                </p>
                <div className="note-modal-vote-row note-modal-vote-row-static">
                  <span
                    className={`note-modal-vote-arrow note-modal-vote-up note-modal-vote-static ${selectedNote.my_vote === 1 ? "note-modal-vote-active" : ""}`}
                    title="Upvotes"
                    aria-hidden
                  >
                    <span className="note-modal-vote-arrow-icon">↑</span>
                    <span className="note-modal-vote-count">
                      {selectedNote.upvote_count ?? 0}
                    </span>
                  </span>
                  <span
                    className={`note-modal-vote-arrow note-modal-vote-down note-modal-vote-static ${selectedNote.my_vote === -1 ? "note-modal-vote-active" : ""}`}
                    title="Downvotes"
                    aria-hidden
                  >
                    <span className="note-modal-vote-arrow-icon">↓</span>
                    <span className="note-modal-vote-count">
                      {selectedNote.downvote_count ?? 0}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="note-modal-actions">
              <button
                type="button"
                className="note-modal-download-btn"
                onClick={() => handleDownload(selectedNote.id)}
                disabled={downloadingId === selectedNote.id}
                title={
                  selectedNote.downloaded
                    ? "Re-download (free)"
                    : `Download (−${selectedNote.download_cost} credits)`
                }
              >
                {downloadingId === selectedNote.id
                  ? "Preparing…"
                  : selectedNote.downloaded
                    ? "Download again"
                    : `Download (−${selectedNote.download_cost} credits)`}
              </button>
              <button
                type="button"
                className={`note-modal-vote-arrow note-modal-vote-up ${selectedNote.my_vote === 1 ? "note-modal-vote-active" : ""}`}
                onClick={() => handleVote(selectedNote.id, 1)}
                disabled={
                  !selectedNote.downloaded || votingId === selectedNote.id
                }
                title={
                  selectedNote.downloaded
                    ? "Upvote this note"
                    : "Download this note to vote"
                }
                aria-label="Upvote"
              >
                <span className="note-modal-vote-arrow-icon">↑</span>
                <span className="note-modal-vote-count">Upvote</span>
              </button>
              <button
                type="button"
                className={`note-modal-vote-arrow note-modal-vote-down ${selectedNote.my_vote === -1 ? "note-modal-vote-active" : ""}`}
                onClick={() => handleVote(selectedNote.id, -1)}
                disabled={
                  !selectedNote.downloaded || votingId === selectedNote.id
                }
                title={
                  selectedNote.downloaded
                    ? "Downvote this note"
                    : "Download this note to vote"
                }
                aria-label="Downvote"
              >
                <span className="note-modal-vote-arrow-icon">↓</span>
                <span className="note-modal-vote-count">Downvote</span>
              </button>
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

      {/* Vote prompt after download */}
      {isVotePromptOpen && noteForVotePrompt && (
        <div
          className="vote-prompt-overlay"
          role="presentation"
          onClick={() => {
            setIsVotePromptOpen(false);
            setNoteForVotePrompt(null);
            setVoteError(null);
          }}
        >
          <div
            className="vote-prompt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vote-prompt-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vote-prompt-header">
              <h3 id="vote-prompt-title" className="vote-prompt-title">
                Rate this note
              </h3>
              <button
                type="button"
                className="vote-prompt-close"
                onClick={() => {
                  setIsVotePromptOpen(false);
                  setNoteForVotePrompt(null);
                  setVoteError(null);
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="vote-prompt-subtitle">
              You downloaded &quot;{noteForVotePrompt.title}&quot;. How was it?
            </p>
            <div className="vote-prompt-actions">
              <button
                type="button"
                className={`note-modal-vote-arrow note-modal-vote-up ${noteForVotePrompt.my_vote === 1 ? "note-modal-vote-active" : ""}`}
                onClick={() => {
                  handleVote(noteForVotePrompt.id, 1);
                  setIsVotePromptOpen(false);
                  setNoteForVotePrompt(null);
                  setVoteError(null);
                }}
                disabled={votingId === noteForVotePrompt.id}
                aria-label="Upvote"
              >
                <span className="note-modal-vote-arrow-icon">↑</span>
                <span className="note-modal-vote-count">Upvote</span>
              </button>
              <button
                type="button"
                className={`note-modal-vote-arrow note-modal-vote-down ${noteForVotePrompt.my_vote === -1 ? "note-modal-vote-active" : ""}`}
                onClick={() => {
                  handleVote(noteForVotePrompt.id, -1);
                  setIsVotePromptOpen(false);
                  setNoteForVotePrompt(null);
                  setVoteError(null);
                }}
                disabled={votingId === noteForVotePrompt.id}
                aria-label="Downvote"
              >
                <span className="note-modal-vote-arrow-icon">↓</span>
                <span className="note-modal-vote-count">Downvote</span>
              </button>
            </div>
            {voteError && (
              <p className="dashboard-vote-error" role="alert">
                {voteError}
              </p>
            )}
            <button
              type="button"
              className="vote-prompt-skip"
              onClick={() => {
                setIsVotePromptOpen(false);
                setNoteForVotePrompt(null);
                setVoteError(null);
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Report modal */}
      {isReportOpen && selectedNote && (
        <div
          className="report-modal-overlay"
          role="presentation"
          onClick={handleCloseReport}
        >
          <div
            className="report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="report-modal-header">
              <h3 id="report-modal-title" className="report-modal-title">
                Report note
              </h3>
              <button
                type="button"
                className="report-modal-close"
                onClick={handleCloseReport}
                aria-label="Close report form"
              >
                ×
              </button>
            </div>
            <p className="report-modal-subtitle">
              Reporting: <span>{selectedNote.title}</span> (ID: {selectedNote.id})
            </p>
            <form className="report-modal-form" onSubmit={handleSubmitReport}>
              <label className="report-modal-label" htmlFor="report-reason">
                Why are you reporting this note?
              </label>
              <textarea
                id="report-reason"
                name="reason"
                className="report-modal-textarea"
                placeholder="Tell us what's wrong with this note."
                rows={5}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                disabled={reportStatus === "submitting"}
                required
              />
              {reportMessage && (
                <p
                  className={
                    reportStatus === "success"
                      ? "report-modal-message success"
                      : "report-modal-message error"
                  }
                >
                  {reportMessage}
                </p>
              )}
              <div className="report-modal-actions">
                <button
                  type="button"
                  className="report-modal-cancel"
                  onClick={handleCloseReport}
                  disabled={reportStatus === "submitting"}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="report-modal-submit"
                  disabled={
                    reportStatus === "submitting" || !reportReason.trim()
                  }
                >
                  {reportStatus === "submitting"
                    ? "Sending…"
                    : "Submit report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
