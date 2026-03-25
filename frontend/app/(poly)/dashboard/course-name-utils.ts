/**
 * Course subline (name + units) for display.
 * Uses ONLY the bolded portion from the 2026-2028 Cal Poly catalog (Name (N units)).
 */

import { CALPOLY_COURSE_TITLES } from "./calpoly-course-titles";

/**
 * Returns the official course title and units for display: "CourseName (N units)".
 * Sourced from the bolded line on catalog.calpoly.edu (2026-2028); no paragraph text.
 */
export function getCourseSubline(code: string | null): string {
  if (!code) return "";
  const raw = CALPOLY_COURSE_TITLES[code] ?? "";
  return raw.replace(/\(1\s*units\)/, "(1 unit)");
}
