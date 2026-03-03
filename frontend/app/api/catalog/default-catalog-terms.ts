/**
 * Default catalog terms (2026-2028). Used when catalog_terms table is empty or unavailable.
 * Single source of truth for the backend; DB table overrides when populated.
 */
export type CatalogTermItem = {
  id: string;
  label: string;
  term: string;
  year: number;
};

export const DEFAULT_CATALOG_TERMS: CatalogTermItem[] = [
  { id: "default-fall-2026", label: "Fall 2026", term: "Fall", year: 2026 },
  { id: "default-winter-2027", label: "Winter 2027", term: "Winter", year: 2027 },
  { id: "default-spring-2027", label: "Spring 2027", term: "Spring", year: 2027 },
  { id: "default-summer-2027", label: "Summer 2027", term: "Summer", year: 2027 },
  { id: "default-fall-2027", label: "Fall 2027", term: "Fall", year: 2027 },
  { id: "default-winter-2028", label: "Winter 2028", term: "Winter", year: 2028 },
  { id: "default-spring-2028", label: "Spring 2028", term: "Spring", year: 2028 },
  { id: "default-summer-2028", label: "Summer 2028", term: "Summer", year: 2028 },
];
