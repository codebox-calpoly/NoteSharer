import { normalizeCourseSearchQuery } from "@/lib/course-search";
import {
  rankAndLimitCourseRows,
  type SearchableCourseRow,
} from "@/app/api/classes/search-helpers";

function makeRow(overrides: Partial<SearchableCourseRow>): SearchableCourseRow {
  return {
    id: "course-id",
    title: "Untitled",
    department: "CSC",
    course_number: 100,
    term: "Fall",
    year: 2026,
    ...overrides,
  };
}

describe("classes search helper", () => {
  it("returns title-only matches", () => {
    const rows = [
      makeRow({ id: "1", department: "CSC", course_number: 101, title: "Intro to Programming" }),
      makeRow({ id: "2", department: "MATH", course_number: 141, title: "Data Structures for Scientists" }),
    ];

    const result = rankAndLimitCourseRows(rows, normalizeCourseSearchQuery("structures"), 10);
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("ranks code-prefix matches above title-only matches", () => {
    const rows = [
      makeRow({ id: "title", department: "MATH", course_number: 141, title: "CSC 1 for non-majors" }),
      makeRow({ id: "code", department: "CSC", course_number: 101, title: "Intro to Programming" }),
    ];

    const result = rankAndLimitCourseRows(rows, normalizeCourseSearchQuery("csc 1"), 10);
    expect(result.map((r) => r.id)).toEqual(["code", "title"]);
  });

  it("returns no rows for empty query", () => {
    const rows = [makeRow({ id: "1" })];
    expect(rankAndLimitCourseRows(rows, "", 10)).toEqual([]);
  });

  it("applies limit after ranking", () => {
    const rows = [
      makeRow({ id: "title-1", department: "MATH", course_number: 141, title: "CSC 1 for non-majors" }),
      makeRow({ id: "code", department: "CSC", course_number: 101, title: "Intro to Programming" }),
      makeRow({ id: "title-2", department: "PHIL", course_number: 101, title: "CSC 1 ethics" }),
    ];

    const result = rankAndLimitCourseRows(rows, normalizeCourseSearchQuery("csc 1"), 1);
    expect(result.map((r) => r.id)).toEqual(["code"]);
  });
});
