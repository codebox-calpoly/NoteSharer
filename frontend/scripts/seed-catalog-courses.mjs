#!/usr/bin/env node
/**
 * Seeds the courses table from the Cal Poly catalog (all 8 catalog terms).
 * Loads SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local if present.
 * Run from frontend: npm run db:seed-catalog
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  raw.split("\n").forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
}
loadEnvLocal();
const CATALOG_TERMS = [
  { term: "Fall", year: 2026 },
  { term: "Winter", year: 2027 },
  { term: "Spring", year: 2027 },
  { term: "Summer", year: 2027 },
  { term: "Fall", year: 2027 },
  { term: "Winter", year: 2028 },
  { term: "Spring", year: 2028 },
  { term: "Summer", year: 2028 },
];

function loadCatalog() {
  const catalogPath = path.join(__dirname, "../app/dashboard/calpoly-catalog.ts");
  const raw = fs.readFileSync(catalogPath, "utf8");
  const startMarker = "export const CALPOLY_PLACEHOLDER_COURSES";
  const start = raw.indexOf(startMarker);
  if (start === -1) throw new Error("CALPOLY_PLACEHOLDER_COURSES not found");
  const arrayStart = raw.indexOf("[", start);
  const arrayEnd = raw.lastIndexOf("];") + 1;
  let json = raw.slice(arrayStart, arrayEnd);
  json = json.replace(/\b(department|code|name):/g, '"$1":');
  json = json.replace(/,(\s*)\]/, "$1]");
  let catalog = JSON.parse(json);
  const codesInCatalog = new Set(catalog.map((c) => c.code));

  // Merge in any course from calpoly-course-titles.ts that is not in the placeholder catalog (e.g. missing AERO courses).
  const titlesPath = path.join(__dirname, "../app/dashboard/calpoly-course-titles.ts");
  if (fs.existsSync(titlesPath)) {
    const titlesRaw = fs.readFileSync(titlesPath, "utf8");
    const re = /"([A-Z0-9]+ [0-9A-Z]+)"\s*:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(titlesRaw)) !== null) {
      const code = m[1];
      const title = m[2];
      if (codesInCatalog.has(code)) continue;
      const department = code.split(/\s+/)[0] || "";
      if (!department) continue;
      catalog.push({ department, code, name: title });
      codesInCatalog.add(code);
    }
  }

  return catalog;
}

function codeToCourseNumber(code) {
  const m = String(code).match(/^\s*[A-Z0-9]+\s+(.+)$/);
  return m ? m[1].trim() : String(code);
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const catalog = loadCatalog();
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let total = 0;
  const batchSize = 100;

  for (const { term, year } of CATALOG_TERMS) {
    for (let i = 0; i < catalog.length; i += batchSize) {
      const chunk = catalog.slice(i, i + batchSize);
      const rows = chunk.map((c) => ({
        department: c.department,
        course_number: codeToCourseNumber(c.code),
        title: c.name,
        term,
        year,
      }));
      const { error } = await supabase.from("courses").upsert(rows, {
        onConflict: "department,course_number,term,year",
      });
      if (error) {
        console.error("Upsert error:", error.message);
        process.exit(1);
      }
      total += rows.length;
      process.stderr.write(".");
    }
  }

  console.error("\nCatalog seed done. Rows upserted:", total);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
