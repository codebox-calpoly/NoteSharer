import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const setupPath = path.join(rootDir, "scripts", "setup.mjs");

const result = spawnSync("node", [setupPath, "--skip-supabase"], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
