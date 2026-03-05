import { filterAndSortCoursesBySearchOrder } from "@/lib/course-search";

export type SearchableCourseRow = {
  id: string;
  title: string | null;
  department: string | null;
  course_number: string | null;
  term: string | null;
  year: number | null;
};

export function rankAndLimitCourseRows(
  rows: SearchableCourseRow[],
  normalizedQuery: string,
  limit: number
): SearchableCourseRow[] {
  return filterAndSortCoursesBySearchOrder(
    rows.map((row) => ({
      row,
      code: [row.department, row.course_number].filter(Boolean).join(" ").trim() || null,
      name: row.title,
    })),
    normalizedQuery
  )
    .slice(0, limit)
    .map((item) => item.row);
}
