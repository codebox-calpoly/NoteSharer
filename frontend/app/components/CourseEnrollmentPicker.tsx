"use client";

import { useEffect, useState } from "react";

export type EnrollmentCourseOption = {
  id: string;
  name: string;
  code: string | null;
  department: string | null;
  term: string | null;
  year: number | null;
  note_count?: number;
};

export function CourseEnrollmentPicker({
  accessToken,
  selectedCourses,
  onChange,
  disabled = false,
}: {
  accessToken: string | null;
  selectedCourses: EnrollmentCourseOption[];
  onChange: (next: EnrollmentCourseOption[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EnrollmentCourseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !query.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          search: query.trim(),
          limit: "12",
        });
        const res = await fetch(`/api/classes?${params.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          throw new Error("Failed to load matching courses.");
        }
        const payload = (await res.json()) as { classes?: EnrollmentCourseOption[] };
        if (!cancelled) {
          setResults(payload.classes ?? []);
        }
      } catch (searchError) {
        if (!cancelled) {
          setResults([]);
          setError(
            searchError instanceof Error
              ? searchError.message
              : "Failed to load matching courses.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accessToken, query]);

  const selectedIds = new Set(selectedCourses.map((course) => course.id));

  return (
    <div className="course-enrollment-picker">
      <label className="course-enrollment-picker__label" htmlFor="course-enrollment-search">
        Add courses
      </label>
      <input
        id="course-enrollment-search"
        type="search"
        className="course-enrollment-picker__input"
        placeholder="Search by course code or title"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        disabled={disabled || !accessToken}
      />
      <p className="course-enrollment-picker__hint">
        Search for human-readable course codes like `CSC 101` and add the classes you are taking.
      </p>
      {selectedCourses.length > 0 ? (
        <div className="course-enrollment-picker__chips">
          {selectedCourses.map((course) => (
            <button
              key={course.id}
              type="button"
              className="course-enrollment-picker__chip"
              onClick={() =>
                onChange(selectedCourses.filter((selected) => selected.id !== course.id))
              }
              disabled={disabled}
            >
              <span>{course.code ?? course.name}</span>
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="course-enrollment-picker__empty">No enrolled courses selected yet.</p>
      )}
      {loading ? <p className="course-enrollment-picker__status">Searching…</p> : null}
      {error ? <p className="course-enrollment-picker__error">{error}</p> : null}
      {!loading && query.trim() && results.length > 0 ? (
        <div className="course-enrollment-picker__results">
          {results.map((course) => {
            const selected = selectedIds.has(course.id);
            return (
              <button
                key={course.id}
                type="button"
                className={`course-enrollment-picker__result ${selected ? "is-selected" : ""}`}
                onClick={() => {
                  if (selected) return;
                  onChange([...selectedCourses, course]);
                }}
                disabled={disabled || selected}
              >
                <span className="course-enrollment-picker__result-code">
                  {course.code ?? course.name}
                </span>
                {course.name && course.name !== (course.code ?? "") ? (
                  <span className="course-enrollment-picker__result-name">{course.name}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
