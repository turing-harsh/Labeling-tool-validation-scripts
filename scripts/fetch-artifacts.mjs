#!/usr/bin/env node
// Pre-fetch all Drive file links referenced by a golden task into <project>/golden/artifacts/
// using a service-account key, so the offline fetch-mock can serve them to the validator.
// Content is written straight to disk (never echoed). Artifacts are gitignored.
// Usage:
//   node scripts/fetch-artifacts.mjs <instance/project[/pipeline]> <golden-file> [credPath]
// credPath defaults to $LABELING_CREDENTIALS or the labeling-tool dev credentials.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCredentials, fetchDriveFile } from "./drive-fetch.mjs";
import { TARGET_USAGE, targetDir } from "./targets.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [target, goldenArg, credArg] = process.argv.slice(2);
const projDir = targetDir(root, target);
if (!projDir || !goldenArg) {
  console.error(`Usage: node scripts/fetch-artifacts.mjs ${TARGET_USAGE} <golden-file> [credPath]`);
  process.exit(1);
}
const credPath = credArg || process.env.LABELING_CREDENTIALS ||
  "/Users/harshagrawal/work/labeling-tool/apps/labeling-tool-api/credentials.json";

const goldenPath = goldenArg.includes("/") ? join(root, goldenArg) : join(projDir, "golden", goldenArg);
const artifactsDir = join(projDir, "golden", "artifacts");

const raw = readFileSync(goldenPath, "utf8");
// Collect unique Drive FILE ids (skip folder links).
const ids = new Set();
for (const m of raw.matchAll(/\/file\/d\/([A-Za-z0-9_-]+)/g)) ids.add(m[1]);
for (const m of raw.matchAll(/[?&]id=([A-Za-z0-9_-]+)/g)) ids.add(m[1]);

if (ids.size === 0) { console.log("No Drive file links found in", basename(goldenPath)); process.exit(0); }
mkdirSync(artifactsDir, { recursive: true });
const cred = loadCredentials(credPath);
console.log(`Fetching ${ids.size} file(s) as ${cred.client_email} -> ${artifactsDir}\n`);

let ok = 0, fail = 0;
for (const id of ids) {
  try {
    const txt = await fetchDriveFile(cred, id);
    const ext = /<html/i.test(txt.slice(0, 500)) ? "html" : (txt.trim().startsWith("{") || txt.trim().startsWith("[") ? "json" : "txt");
    const dest = join(artifactsDir, `${id}.${ext}`);
    writeFileSync(dest, txt);
    console.log(`  ok   ${id}.${ext}  (${txt.length.toLocaleString()} bytes)`);
    ok++;
  } catch (e) {
    console.log(`  FAIL ${id}: ${e.message}`);
    fail++;
  }
}
console.log(`\n${ok} fetched, ${fail} failed.`);
