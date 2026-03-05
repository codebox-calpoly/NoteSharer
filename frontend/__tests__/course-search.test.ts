import {
  filterAndSortCoursesBySearchOrder,
  getCourseSearchMatchType,
  normalizeCourseSearchQuery,
  type CourseSearchable,
} from "@/lib/course-search";

function makeCourse(overrides: Partial<CourseSearchable>): CourseSearchable {
  return {
    code: null,
    name: null,
    ...overrides,
  };
}

describe("course search helpers", () => {
  it("normalizes query with uppercase and collapsed spaces", () => {
    expect(normalizeCourseSearchQuery("  data   structures  ")).toBe("DATA STRUCTURES");
  });

  it("detects code prefix before title contains", () => {
    const normalized = normalizeCourseSearchQuery("csc 1");

    expect(
      getCourseSearchMatchType(
        makeCourse({ code: "CSC 101", name: "Intro to Programming" }),
        normalized,
      ),
    ).toBe("code_prefix");

    expect(
      getCourseSearchMatchType(
        makeCourse({ code: "MATH 141", name: "CSC 1 for non-majors" }),
        normalized,
      ),
    ).toBe("title_contains");
  });

  it("sorts code-prefix matches before title-only matches", () => {
    const normalized = normalizeCourseSearchQuery("csc 1");

    const courses = [
      makeCourse({ code: "MATH 141", name: "CSC 1 for non-majors" }),
      makeCourse({ code: "CSC 101", name: "Intro to Programming" }),
    ];

    const sorted = filterAndSortCoursesBySearchOrder(courses, normalized);
    expect(sorted.map((c) => c.code)).toEqual(["CSC 101", "MATH 141"]);
  });
});
