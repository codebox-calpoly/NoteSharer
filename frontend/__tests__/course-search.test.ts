import {
  filterAndSortCoursesBySearchOrder,
  getCourseSearchMatchType,
  normalizeCourseSearchQuery,
  type CourseSearchable,
} from "@/lib/course-search";
import { getMatchingDepartmentCodes } from "@/lib/department-search";
import { CALPOLY_DEPARTMENTS } from "@/lib/calpoly-departments";

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

  it("matches natural-language department queries to Cal Poly abbreviations", () => {
    const normalized = normalizeCourseSearchQuery("computer science");
    const matchedDepartmentCodes = new Set(
      getMatchingDepartmentCodes([...CALPOLY_DEPARTMENTS], "computer science"),
    );

    expect(
      getCourseSearchMatchType(
        makeCourse({ code: "CSC 101", department: "CSC", name: "Intro to Programming" }),
        normalized,
        { matchedDepartmentCodes },
      ),
    ).toBe("department_alias");

    expect(
      getCourseSearchMatchType(
        makeCourse({ code: "BUS 214", department: "BUS", name: "Financial Accounting" }),
        normalizeCourseSearchQuery("business"),
        {
          matchedDepartmentCodes: new Set(
            getMatchingDepartmentCodes([...CALPOLY_DEPARTMENTS], "business"),
          ),
        },
      ),
    ).toBe("department_alias");
  });

  it("matches typo-tolerant department queries through fuzzy aliases", () => {
    expect(
      getCourseSearchMatchType(
        makeCourse({ code: "BUS 214", department: "BUS", name: "Financial Accounting" }),
        normalizeCourseSearchQuery("buisness"),
        {
          matchedDepartmentCodes: new Set(
            getMatchingDepartmentCodes([...CALPOLY_DEPARTMENTS], "buisness"),
          ),
        },
      ),
    ).toBe("department_alias");
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

  it("ranks department alias matches before title-only matches", () => {
    const normalized = normalizeCourseSearchQuery("computer science");
    const matchedDepartmentCodes = new Set(
      getMatchingDepartmentCodes([...CALPOLY_DEPARTMENTS], "computer science"),
    );

    const courses = [
      makeCourse({ code: "MATH 141", department: "MATH", name: "Computer Science for Scientists" }),
      makeCourse({ code: "CSC 101", department: "CSC", name: "Intro to Programming" }),
    ];

    const sorted = filterAndSortCoursesBySearchOrder(courses, normalized, {
      matchedDepartmentCodes,
    });
    expect(sorted.map((c) => c.code)).toEqual(["CSC 101", "MATH 141"]);
  });
});
