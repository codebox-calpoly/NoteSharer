export type CourseSearchMatchType = "code_prefix" | "title_contains" | "none";

export type CourseSearchable = {
  code: string | null;
  name: string | null;
};

function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeField(value: string | null | undefined): string {
  if (!value) return "";
  return normalizeSpaces(value).toUpperCase();
}

export function normalizeCourseSearchQuery(query: string): string {
  return normalizeField(query);
}

export function getCourseSearchMatchType(
  course: CourseSearchable,
  normalizedQuery: string
): CourseSearchMatchType {
  if (!normalizedQuery) return "none";

  const normalizedCode = normalizeField(course.code);
  if (normalizedCode && normalizedCode.startsWith(normalizedQuery)) {
    return "code_prefix";
  }

  const normalizedName = normalizeField(course.name);
  if (normalizedName && normalizedName.includes(normalizedQuery)) {
    return "title_contains";
  }

  return "none";
}

export function getCourseSearchRank(
  course: CourseSearchable,
  normalizedQuery: string
): 0 | 1 | 2 {
  const type = getCourseSearchMatchType(course, normalizedQuery);
  if (type === "code_prefix") return 0;
  if (type === "title_contains") return 1;
  return 2;
}

export function isCourseSearchMatch(
  course: CourseSearchable,
  normalizedQuery: string
): boolean {
  return getCourseSearchRank(course, normalizedQuery) < 2;
}

export function compareCourseSearchOrder(
  a: CourseSearchable,
  b: CourseSearchable,
  normalizedQuery: string
): number {
  const rankDiff = getCourseSearchRank(a, normalizedQuery) - getCourseSearchRank(b, normalizedQuery);
  if (rankDiff !== 0) return rankDiff;

  const aKey = normalizeField(a.code) || normalizeField(a.name);
  const bKey = normalizeField(b.code) || normalizeField(b.name);
  return aKey.localeCompare(bKey);
}

export function sortCoursesBySearchOrder<T extends CourseSearchable>(
  courses: T[],
  normalizedQuery: string
): T[] {
  return [...courses].sort((a, b) => compareCourseSearchOrder(a, b, normalizedQuery));
}

export function filterAndSortCoursesBySearchOrder<T extends CourseSearchable>(
  courses: T[],
  normalizedQuery: string
): T[] {
  return sortCoursesBySearchOrder(
    courses.filter((course) => isCourseSearchMatch(course, normalizedQuery)),
    normalizedQuery
  );
}
