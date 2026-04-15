import Fuse from "fuse.js";
import { CALPOLY_DEPARTMENTS, type DepartmentRecord } from "@/lib/calpoly-departments";

function normalizeDepartmentText(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function getDepartmentTerms(department: DepartmentRecord): string[] {
  return [department.code, department.name, ...department.aliases].map(normalizeDepartmentText);
}

function matchesDepartmentExactly(department: DepartmentRecord, normalizedQuery: string): boolean {
  if (!normalizedQuery) return false;

  return getDepartmentTerms(department).some((term, index) =>
    index === 0 ? term.startsWith(normalizedQuery) : term.includes(normalizedQuery)
  );
}

function sortExactDepartmentMatches(
  departments: DepartmentRecord[],
  normalizedQuery: string
): DepartmentRecord[] {
  return [...departments].sort((a, b) => {
    const aCode = normalizeDepartmentText(a.code);
    const bCode = normalizeDepartmentText(b.code);
    const aCodeMatch = aCode.startsWith(normalizedQuery) ? 0 : 1;
    const bCodeMatch = bCode.startsWith(normalizedQuery) ? 0 : 1;
    if (aCodeMatch !== bCodeMatch) return aCodeMatch - bCodeMatch;

    return a.code.localeCompare(b.code);
  });
}

function getFuzzyMatches(
  departments: DepartmentRecord[],
  normalizedQuery: string
): DepartmentRecord[] {
  if (normalizedQuery.length < 4) return [];

  const indexedDepartments = departments.map((department) => ({
    ...department,
    searchCode: normalizeDepartmentText(department.code),
    searchName: normalizeDepartmentText(department.name),
    searchAliases: department.aliases.map(normalizeDepartmentText),
  }));

  const fuse = new Fuse(indexedDepartments, {
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    keys: ["searchCode", "searchName", "searchAliases"],
  });

  return fuse.search(normalizedQuery).map((result) => ({
    code: result.item.code,
    name: result.item.name,
    aliases: result.item.aliases,
  }));
}

export function normalizeDepartmentSearchQuery(query: string): string {
  return normalizeDepartmentText(query);
}

export function getMatchingDepartments(
  departments: DepartmentRecord[],
  query: string
): DepartmentRecord[] {
  const normalizedQuery = normalizeDepartmentSearchQuery(query);
  if (!normalizedQuery) return [];

  const exactMatches = departments.filter((department) =>
    matchesDepartmentExactly(department, normalizedQuery)
  );
  if (exactMatches.length > 0) {
    return sortExactDepartmentMatches(exactMatches, normalizedQuery);
  }

  return getFuzzyMatches(departments, normalizedQuery);
}

export function getMatchingDepartmentCodes(
  departments: DepartmentRecord[],
  query: string
): string[] {
  return getMatchingDepartments(departments, query).map((department) => department.code);
}

export function doesDepartmentMatchQuery(
  department: DepartmentRecord,
  query: string
): boolean {
  return getMatchingDepartments([department], query).length > 0;
}

export function getDefaultMatchingDepartmentCodes(query: string): string[] {
  return getMatchingDepartmentCodes([...CALPOLY_DEPARTMENTS], query);
}
