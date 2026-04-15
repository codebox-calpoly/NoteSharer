import { CALPOLY_DEPARTMENTS } from "@/lib/calpoly-departments";
import { getMatchingDepartmentCodes } from "@/lib/department-search";

describe("department search helpers", () => {
  it("maps natural-language department names to Cal Poly codes", () => {
    expect(getMatchingDepartmentCodes([...CALPOLY_DEPARTMENTS], "computer science")).toContain("CSC");
    expect(getMatchingDepartmentCodes([...CALPOLY_DEPARTMENTS], "business")).toContain("BUS");
    expect(getMatchingDepartmentCodes([...CALPOLY_DEPARTMENTS], "psychology")).toContain("PSY");
  });

  it("handles common misspellings via fuzzy search", () => {
    expect(getMatchingDepartmentCodes([...CALPOLY_DEPARTMENTS], "buisness")).toContain("BUS");
    expect(getMatchingDepartmentCodes([...CALPOLY_DEPARTMENTS], "compter science")).toContain("CSC");
  });
});
