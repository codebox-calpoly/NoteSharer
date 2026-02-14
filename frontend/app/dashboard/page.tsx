"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSessionWithRecovery, supabase } from "@/lib/supabaseClient";
import { CALPOLY_DEPARTMENT_CODES } from "./calpoly-catalog";
import { getCourseSubline } from "./course-name-utils";
import "./dashboard.css";
import "./browse.css";
import ProfileIcons from "./profile-icon";

type CatalogTerm = {
  id: string;
  label: string;
  term: string;
  year: number;
};

/** Fallback when /api/catalog/terms is empty (e.g. catalog_terms not seeded). */
const FALLBACK_CATALOG_TERMS: CatalogTerm[] = [
  { id: "fallback-1", label: "Fall 2026", term: "Fall", year: 2026 },
  { id: "fallback-2", label: "Winter 2027", term: "Winter", year: 2027 },
  { id: "fallback-3", label: "Spring 2027", term: "Spring", year: 2027 },
  { id: "fallback-4", label: "Summer 2027", term: "Summer", year: 2027 },
  { id: "fallback-5", label: "Fall 2027", term: "Fall", year: 2027 },
  { id: "fallback-6", label: "Winter 2028", term: "Winter", year: 2028 },
  { id: "fallback-7", label: "Spring 2028", term: "Spring", year: 2028 },
  { id: "fallback-8", label: "Summer 2028", term: "Summer", year: 2028 },
];

type CourseOption = {
  id: string;
  name: string;
  code: string | null;
  department: string | null;
  term: string | null;
  year: number | null;
  note_count: number;
};

function termYearLabel(term: string | null, year: number | null): string {
  if (term && year != null) return `${term} ${year}`;
  if (term) return term;
  if (year != null) return String(year);
  return "—";
}

export default function DashboardPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedTermYear, setSelectedTermYear] = useState<string | null>(null);
  const [browseSearch, setBrowseSearch] = useState("");
  const [departmentFilterSearch, setDepartmentFilterSearch] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesLoadingMore, setCoursesLoadingMore] = useState(false);
  const [catalogTerms, setCatalogTerms] = useState<CatalogTerm[]>(FALLBACK_CATALOG_TERMS);
  const [departments, setDepartments] = useState<string[]>(() => [...CALPOLY_DEPARTMENT_CODES]);
  const [credits, setCredits] = useState<number | null>(null);
  const [freeDownloads, setFreeDownloads] = useState<number | null>(null);
  /** Number of course cards to render (paginated for performance). */
  const [visibleCourseCount, setVisibleCourseCount] = useState(80);
  /** When no department selected, whether the API has more courses to fetch. */
  const [hasMoreFromApi, setHasMoreFromApi] = useState(false);

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

  const INITIAL_PAGE_SIZE = 200;
  const DEPARTMENT_PAGE_SIZE = 1000;

  const fetchCoursesPage = useCallback(
    async (
      token: string,
      offset: number,
      department: string | null,
      limit: number
    ): Promise<{ classes: CourseOption[]; hasMore: boolean } | null> => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (department?.trim()) params.set("department", department.trim());
      const res = await fetch(`/api/classes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return null;
      if (!res.ok) return null;
      const data = (await res.json()) as { classes?: CourseOption[]; hasMore?: boolean };
      return {
        classes: data.classes ?? [],
        hasMore: data.hasMore ?? false,
      };
    },
    []
  );

  useEffect(() => {
    if (!tokenLoaded || !accessToken) {
      if (tokenLoaded && !accessToken) {
        setCoursesError("Not authenticated");
        setCoursesLoading(false);
      }
      return;
    }
    let active = true;
    setCoursesLoading(true);
    setCoursesLoadingMore(false);
    const pageSize = selectedDepartment ? DEPARTMENT_PAGE_SIZE : INITIAL_PAGE_SIZE;

    const run = async () => {
      try {
        let token = accessToken;
        let res = await fetchCoursesPage(token, 0, selectedDepartment, pageSize);
        if (res === null) {
          const newToken = await refreshToken();
          if (newToken) res = await fetchCoursesPage(newToken, 0, selectedDepartment, pageSize);
        }
        if (!active) return;
        if (res === null) {
          setCoursesError("Failed to load courses");
          setCourses([]);
          setCoursesLoading(false);
          return;
        }
        setCourses(res.classes);
        setCoursesError(null);
        setCoursesLoading(false);
        if (selectedDepartment) {
          setHasMoreFromApi(false);
        } else {
          setHasMoreFromApi(res.hasMore);
          if (res.hasMore) setCoursesLoadingMore(true);
        }
      } catch {
        if (active) {
          setCoursesError("Failed to load courses");
          setCourses([]);
          setCoursesLoading(false);
        }
      }
    };
    run();
    return () => { active = false; };
  }, [accessToken, tokenLoaded, selectedDepartment, refreshToken, fetchCoursesPage]);

  useEffect(() => {
    if (!tokenLoaded || !accessToken) return;
    let active = true;
    const fetchCatalog = async () => {
      try {
        const res = await fetch("/api/catalog/terms", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!active) return;
        if (res.ok) {
          const data = (await res.json()) as { terms?: CatalogTerm[] };
          const terms = data.terms ?? [];
          if (terms.length > 0) setCatalogTerms(terms);
        }
      } catch {
        // Keep initial FALLBACK_CATALOG_TERMS
      }
    };
    fetchCatalog();
    return () => { active = false; };
  }, [accessToken, tokenLoaded]);

  const fetchCredits = useCallback(
    async (token: string | null) => {
      if (!token) return null;
      try {
        let res = await fetch("/api/credits", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          const newToken = await refreshToken();
          if (newToken) res = await fetch("/api/credits", { headers: { Authorization: `Bearer ${newToken}` } });
        }
        if (!res.ok) return null;
        const data = (await res.json()) as { credits?: number; freeDownloads?: number };
        return {
          credits: Number.isFinite(data?.credits) ? Number(data.credits) : 0,
          freeDownloads: Number.isFinite(data?.freeDownloads) ? Number(data.freeDownloads) : 0,
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
    return () => { active = false; };
  }, [accessToken, tokenLoaded, fetchCredits]);

  /** Departments filtered by sidebar search (substring match, updates as you type). */
  const filteredDepartments = useMemo(() => {
    const q = departmentFilterSearch.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.toLowerCase().includes(q));
  }, [departments, departmentFilterSearch]);

  /** Courses from DB, filtered by department, term, and search. One card per unique course (deduplicated by code). */
  const allDisplayCourses = useMemo((): CourseOption[] => {
    let list = [...courses];
    if (selectedDepartment) {
      list = list.filter((c) => c.department === selectedDepartment);
    }
    if (selectedTermYear) {
      list = list.filter((c) => termYearLabel(c.term, c.year) === selectedTermYear);
    }
    // Course search: filter by course code prefix (like department filter). Type "C" → codes starting with C; "CSC" → only CSC courses.
    const q = browseSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => (c.code ?? "").toLowerCase().startsWith(q));
    }
    return list.sort((a, b) => {
      const codeA = (a.code ?? a.name).toLowerCase();
      const codeB = (b.code ?? b.name).toLowerCase();
      const byCode = codeA.localeCompare(codeB);
      if (byCode !== 0) return byCode;
      const termA = termYearLabel(a.term, a.year);
      const termB = termYearLabel(b.term, b.year);
      return termA.localeCompare(termB);
    });
  }, [courses, selectedDepartment, selectedTermYear, browseSearch]);

  /** Reset visible count when filters/search change so we don't show a short list after narrowing. */
  useEffect(() => {
    setVisibleCourseCount(80);
  }, [selectedDepartment, selectedTermYear, browseSearch]);

  const coursesToRender = allDisplayCourses.slice(0, visibleCourseCount);
  const hasMoreToShow = visibleCourseCount < allDisplayCourses.length;
  const hasMoreToFetch = !selectedDepartment && (hasMoreFromApi || coursesLoadingMore);
  const hasMoreCourses = hasMoreToShow || hasMoreToFetch;

  const loadMoreCourses = useCallback(() => {
    if (hasMoreToShow) {
      setVisibleCourseCount((n) => Math.min(n + 80, allDisplayCourses.length));
      return;
    }
    if (hasMoreToFetch && !coursesLoadingMore && accessToken) {
      setCoursesLoadingMore(true);
      const offset = courses.length;
      let cancelled = false;
      (async () => {
        try {
          let token = accessToken;
          let res = await fetchCoursesPage(token, offset, null, INITIAL_PAGE_SIZE);
          if (res === null) {
            const newToken = await refreshToken();
            if (newToken) res = await fetchCoursesPage(newToken, offset, null, INITIAL_PAGE_SIZE);
          }
          if (cancelled) return;
          if (res !== null) {
            setCourses((prev) => [...prev, ...res.classes]);
            setHasMoreFromApi(res.hasMore);
            if (!res.hasMore) setCoursesLoadingMore(false);
          } else {
            setCoursesLoadingMore(false);
            setHasMoreFromApi(false);
          }
        } catch {
          if (!cancelled) {
            setCoursesLoadingMore(false);
            setHasMoreFromApi(false);
          }
        }
      })();
      return () => { cancelled = true };
    }
  }, [hasMoreToShow, hasMoreToFetch, coursesLoadingMore, accessToken, courses.length, allDisplayCourses.length, refreshToken, fetchCoursesPage]);

  const clearFilters = () => {
    setSelectedDepartment(null);
    setSelectedTermYear(null);
  };

  const hasActiveFilters = selectedDepartment != null || selectedTermYear != null;

  return (
    <div className="browse-page">
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
            <span className="browse-credits-pill">
              Credits: {credits ?? "—"}
            </span>
            <Link href="/upload" className="browse-upload-btn">
              Upload Notes
            </Link>
            <ProfileIcons />
          </div>
        </div>
      </nav>

      <div className="browse-body">
        <aside className="browse-sidebar">
          <h2 className="browse-sidebar-title">Filters</h2>
          <div className="browse-filter-section">
            <span className="browse-filter-heading">Department</span>
            <div className="browse-department-search-wrap">
              <input
                type="search"
                className="browse-department-search"
                placeholder="Search departments..."
                value={departmentFilterSearch}
                onChange={(e) => setDepartmentFilterSearch(e.target.value)}
                aria-label="Search departments"
              />
            </div>
            <div className="browse-filter-options">
              {filteredDepartments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  className={`browse-filter-option ${selectedDepartment === dept ? "active" : ""}`}
                  onClick={() => setSelectedDepartment(selectedDepartment === dept ? null : dept)}
                >
                  {dept}
                </button>
              ))}
              {filteredDepartments.length === 0 && (
                <span className="browse-empty">No departments match</span>
              )}
            </div>
          </div>
          <div className="browse-filter-section">
            <span className="browse-filter-heading">2026-2028 Catalog</span>
            <div className="browse-filter-options">
              {catalogTerms.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`browse-filter-option ${selectedTermYear === t.label ? "active" : ""}`}
                  onClick={() => setSelectedTermYear(selectedTermYear === t.label ? null : t.label)}
                >
                  {t.label}
                </button>
              ))}
              {catalogTerms.length === 0 && (
                <span className="browse-empty">No terms</span>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <button type="button" className="browse-clear-filters" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </aside>

        <main className="browse-main">
          {coursesError && <p className="browse-error">{coursesError}</p>}
          <div className="browse-heading-wrap">
            <h1 className="browse-heading">Browse Courses</h1>
            <p className="browse-subtitle">
              Select a course to view and download notes.
            </p>
            <div className="browse-main-search-wrap">
              <svg className="browse-main-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="search"
                className="browse-main-search"
                placeholder="Search by code (e.g. C, CSC, MATH)"
                value={browseSearch}
                onChange={(e) => setBrowseSearch(e.target.value)}
                aria-label="Search courses"
              />
            </div>
          </div>
          {(!tokenLoaded || coursesLoading) && !coursesError && (
            <p className="browse-loading" aria-live="polite">Loading courses…</p>
          )}
          {tokenLoaded && !coursesLoading && allDisplayCourses.length === 0 && !coursesError && (
            <p className="browse-empty">No courses match your filters.</p>
          )}
          <div className="browse-course-grid">
            {coursesToRender.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/course/${course.id}`}
                className="browse-course-card"
              >
                <div className="browse-course-card-top">
                  <div className="browse-course-card-info">
                    <p className="browse-course-code">{course.code ?? course.name}</p>
                    {(() => {
                      const subline = getCourseSubline(course.code);
                      const termLabel = termYearLabel(course.term, course.year);
                      return (
                        <>
                          {subline ? <p className="browse-course-subline">{subline}</p> : null}
                          {termLabel !== "—" ? (
                            <p className="browse-course-term" aria-label={`Term: ${termLabel}`}>
                              {termLabel}
                            </p>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                  {course.department && (
                    <span className="browse-course-badge">{course.department}</span>
                  )}
                </div>
                <div className="browse-course-meta">
                  <svg className="browse-course-meta-icon" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M8 1v14M1 8h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {course.note_count} notes available
                </div>
              </Link>
            ))}
          </div>
          {hasMoreCourses && (
            <div className="browse-load-more-wrap">
              <button
                type="button"
                className="browse-load-more"
                onClick={loadMoreCourses}
                disabled={hasMoreToFetch && coursesLoadingMore}
              >
                {hasMoreToShow
                  ? `Load more (${allDisplayCourses.length - visibleCourseCount} remaining)`
                  : coursesLoadingMore
                    ? "Loading…"
                    : "Load more courses"}
              </button>
            </div>
          )}
          {coursesLoadingMore && (
            <p className="browse-loading-more" aria-live="polite">Loading more courses…</p>
          )}
        </main>
      </div>
    </div>
  );
}
