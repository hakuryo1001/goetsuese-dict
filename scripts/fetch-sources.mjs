#!/usr/bin/env node
/**
 * Shallow-clone importable / reading_only sources from awesome-wu-dicts
 * into vendor/<id> at the pinned upstream_commit.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cataloguePath =
  process.env.WULAM_CATALOGUE ||
  join(root, "../awesome-wu-dicts/data/sources.json");
const vendorRoot = join(root, "vendor");

mkdirSync(vendorRoot, { recursive: true });

const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"));
const targets = catalogue.sources.filter(
  (s) =>
    (s.status === "importable" || s.status === "reading_only") &&
    s.repo &&
    s.upstream_commit,
);

console.log(`Fetching ${targets.length} sources into ${vendorRoot}`);

for (const src of targets) {
  const dest = join(vendorRoot, src.id);
  const commit = src.upstream_commit;
  const url = `https://github.com/${src.repo}.git`;

  if (existsSync(join(dest, ".git"))) {
    try {
      const head = execSync("git rev-parse HEAD", {
        cwd: dest,
        encoding: "utf8",
      }).trim();
      if (head === commit) {
        console.log(`= ${src.id} already at ${commit.slice(0, 7)}`);
        continue;
      }
    } catch {
      /* reclone */
    }
    rmSync(dest, { recursive: true, force: true });
  }

  console.log(`+ ${src.id} ← ${src.repo}@${commit.slice(0, 7)}`);
  mkdirSync(dest, { recursive: true });
  execSync(`git init`, { cwd: dest, stdio: "ignore" });
  execSync(`git remote add origin ${url}`, { cwd: dest, stdio: "ignore" });
  try {
    execSync(`git fetch --depth 1 origin ${commit}`, {
      cwd: dest,
      stdio: "inherit",
    });
    execSync(`git checkout FETCH_HEAD`, { cwd: dest, stdio: "ignore" });
  } catch (e) {
    console.warn(`  fetch by commit failed, trying default branch…`);
    execSync(`git fetch --depth 1 origin HEAD`, {
      cwd: dest,
      stdio: "inherit",
    });
    execSync(`git checkout FETCH_HEAD`, { cwd: dest, stdio: "ignore" });
  }
  writeFileSync(
    join(dest, ".wulam-source.json"),
    JSON.stringify(
      {
        id: src.id,
        repo: src.repo,
        commit,
        fetched_at: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
}

console.log("Done.");
