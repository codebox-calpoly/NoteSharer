import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const setupPath = path.join(rootDir, "scripts", "setup.mjs");

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: true,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("node", [setupPath, "--skip-supabase", "--skip-env", "--no-start"]);
run("npm", ["--prefix", "frontend", "run", "lint"], { cwd: rootDir });
run("npm", ["--prefix", "frontend", "run", "test"], { cwd: rootDir });
