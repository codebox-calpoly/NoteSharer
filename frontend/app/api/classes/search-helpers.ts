import { filterAndSortCoursesBySearchOrder } from "@/lib/course-search";

export type SearchableCourseRow = {
  id: string;
  title: string | null;
  department: string | null;
  course_number: number | null;
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
      code:
        [
          row.department,
          row.course_number != null ? String(row.course_number) : "",
        ]
          .filter((s) => s !== "")
          .join(" ")
          .trim() || null,
      name: row.title,
    })),
    normalizedQuery
  )
    .slice(0, limit)
    .map((item) => item.row);
}
