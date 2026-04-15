export type CourseSearchMatchType =
  | "code_prefix"
  | "department_alias"
  | "title_contains"
  | "none";

export type CourseSearchable = {
  code: string | null;
  name: string | null;
  department?: string | null;
};

export type CourseSearchOptions = {
  matchedDepartmentCodes?: ReadonlySet<string>;
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
  normalizedQuery: string,
  options: CourseSearchOptions = {}
): CourseSearchMatchType {
  if (!normalizedQuery) return "none";

  const normalizedCode = normalizeField(course.code);
  if (normalizedCode && normalizedCode.startsWith(normalizedQuery)) {
    return "code_prefix";
  }

  if (
    course.department &&
    options.matchedDepartmentCodes &&
    options.matchedDepartmentCodes.has(course.department)
  ) {
    return "department_alias";
  }

  const normalizedName = normalizeField(course.name);
  if (normalizedName && normalizedName.includes(normalizedQuery)) {
    return "title_contains";
  }

  return "none";
}

export function getCourseSearchRank(
  course: CourseSearchable,
  normalizedQuery: string,
  options: CourseSearchOptions = {}
): 0 | 1 | 2 | 3 {
  const type = getCourseSearchMatchType(course, normalizedQuery, options);
  if (type === "code_prefix") return 0;
  if (type === "department_alias") return 1;
  if (type === "title_contains") return 2;
  return 3;
}

export function isCourseSearchMatch(
  course: CourseSearchable,
  normalizedQuery: string,
  options: CourseSearchOptions = {}
): boolean {
  return getCourseSearchRank(course, normalizedQuery, options) < 3;
}

export function compareCourseSearchOrder(
  a: CourseSearchable,
  b: CourseSearchable,
  normalizedQuery: string,
  options: CourseSearchOptions = {}
): number {
  const rankDiff =
    getCourseSearchRank(a, normalizedQuery, options) -
    getCourseSearchRank(b, normalizedQuery, options);
  if (rankDiff !== 0) return rankDiff;

  const aKey = normalizeField(a.code) || normalizeField(a.name);
  const bKey = normalizeField(b.code) || normalizeField(b.name);
  return aKey.localeCompare(bKey);
}

export function sortCoursesBySearchOrder<T extends CourseSearchable>(
  courses: T[],
  normalizedQuery: string,
  options: CourseSearchOptions = {}
): T[] {
  return [...courses].sort((a, b) => compareCourseSearchOrder(a, b, normalizedQuery, options));
}

export function filterAndSortCoursesBySearchOrder<T extends CourseSearchable>(
  courses: T[],
  normalizedQuery: string,
  options: CourseSearchOptions = {}
): T[] {
  return sortCoursesBySearchOrder(
    courses.filter((course) => isCourseSearchMatch(course, normalizedQuery, options)),
    normalizedQuery,
    options
  );
}
