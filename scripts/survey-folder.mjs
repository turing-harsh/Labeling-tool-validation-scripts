#!/usr/bin/env node
// Survey a Drive folder WITHOUT the reader's budgets, to diagnose a truncated validation.
//
// fetch-folder.mjs mirrors run-checks-api exactly, caps included, so it stops where the tool
// stops and cannot tell you how much you could not see. This walks the whole tree using only
// Drive's listing API -- no file contents are downloaded -- and reports what the caps would
// cut, so a `truncated` finding can be classified as junk / wrong-folder / genuinely-large.
//
// Usage:
//   node scripts/survey-folder.mjs <folderLinkOrId> [credPath]
import {
  DRIVE_FOLDER_MIME,
  SHORTCUT_MIME,
  driveFolderId,
  driveMetadata,
  listDriveFolder,
  loadCredentials,
} from "./drive-fetch.mjs";

const GOOGLE_APPS_PREFIX = "application/vnd.google-apps.";
// run-checks-api folderLimits, for reporting where each would bite.
const MAX_FILES = Number(process.env.MAX_FOLDER_FILES || 500);
const MAX_BYTES = Number(process.env.MAX_EXTRACTED_ZIP_BYTES || 134217728);
const MAX_DEPTH = Number(process.env.MAX_FOLDER_DEPTH || 10);

// Directories that should never ship inside a task package.
const JUNK = [
  "__pycache__", ".git", ".ipynb_checkpoints", "node_modules", ".venv", "venv",
  ".pytest_cache", ".mypy_cache", ".ruff_cache", ".tox", ".idea", ".vscode", "__MACOSX",
];
const JUNK_FILE = /\.(pyc|pyo|swp)$|^\.DS_Store$/i;

const [linkArg, credArg] = process.argv.slice(2);
if (!linkArg) {
  console.error("Usage: node scripts/survey-folder.mjs <folderLinkOrId> [credPath]");
  process.exit(1);
}
const credPath = credArg || process.env.LABELING_CREDENTIALS ||
  "/Users/harshagrawal/work/labeling-tool/apps/labeling-tool-api/credentials.json";

const folderId = driveFolderId(linkArg) || linkArg;
const cred = loadCredentials(credPath);

const meta = await driveMetadata(cred, folderId);
if (meta.mimeType !== DRIVE_FOLDER_MIME) {
  console.error(`${folderId} is not a folder (mimeType ${meta.mimeType}).`);
  process.exit(1);
}

const files = [];       // { path, bytes, depth, mimeType }
const workspace = [];
const cycles = [];
const visited = new Set([folderId]);
let maxDepth = 0;
let listCalls = 0;

async function walk(id, prefix, depth) {
  maxDepth = Math.max(maxDepth, depth);
  listCalls++;
  const rows = await listDriveFolder(cred, id);
  const subdirs = [];

  for (const row of rows) {
    let fileId = row.id ?? "";
    let mimeType = row.mimeType ?? "";
    let size = Number(row.size ?? 0);
    const name = row.name ?? "";
    if (mimeType === SHORTCUT_MIME && row.shortcutDetails?.targetId) {
      fileId = row.shortcutDetails.targetId;
      mimeType = row.shortcutDetails.targetMimeType ?? "";
      size = 0;
    }
    if (!fileId || !name) continue;
    const path = prefix ? `${prefix}/${name}` : name;

    if (mimeType === DRIVE_FOLDER_MIME) {
      if (visited.has(fileId)) { cycles.push(path); continue; }
      visited.add(fileId);
      subdirs.push({ id: fileId, path });
      continue;
    }
    if (mimeType.startsWith(GOOGLE_APPS_PREFIX)) { workspace.push({ path, mimeType }); continue; }
    files.push({ path, bytes: size, depth, mimeType });
  }
  // Serial on purpose: a survey should not hammer the API, and it is listing-only.
  for (const dir of subdirs) await walk(dir.id, dir.path, depth + 1);
}

console.log(`Surveying "${meta.name}" (${folderId}) — listing only, no downloads…\n`);
await walk(folderId, "", 0);

// Drive's walk order is what the reader sees; the cap cuts at file N in that order.
const totalBytes = files.reduce((a, f) => a + f.bytes, 0);
const isJunk = (p) => p.split("/").some((seg) => JUNK.includes(seg)) || JUNK_FILE.test(p.split("/").pop());
const junk = files.filter((f) => isJunk(f.path));
const real = files.filter((f) => !isJunk(f.path));
const taskTomls = files.filter((f) => f.path === "task.toml" || f.path.endsWith("/task.toml"));

const MB = (b) => (b / 1024 / 1024).toFixed(1) + " MB";
const bar = "─".repeat(72);

console.log(bar);
console.log("TOTALS");
console.log(bar);
console.log(`  files              ${files.length}`);
console.log(`  bytes              ${totalBytes.toLocaleString()} (${MB(totalBytes)})`);
console.log(`  max depth          ${maxDepth}`);
console.log(`  directories listed ${listCalls}`);
console.log(`  Workspace files    ${workspace.length} (skipped by the reader — no binary content)`);
if (cycles.length) console.log(`  shortcut cycles    ${cycles.length}`);

console.log(`\n${bar}\nAGAINST THE READER'S BUDGETS\n${bar}`);
const verdict = (hit, label) => `  ${hit ? "TRUNCATES" : "ok       "}  ${label}`;
console.log(verdict(files.length > MAX_FILES, `files ${files.length} vs MAX_FOLDER_FILES ${MAX_FILES}`));
console.log(verdict(totalBytes > MAX_BYTES, `bytes ${MB(totalBytes)} vs MAX_EXTRACTED_ZIP_BYTES ${MB(MAX_BYTES)}`));
console.log(verdict(maxDepth > MAX_DEPTH, `depth ${maxDepth} vs MAX_FOLDER_DEPTH ${MAX_DEPTH}`));
if (files.length > MAX_FILES) {
  console.log(`\n  -> ${files.length - MAX_FILES} file(s) never reach the validator.`);
  console.log(`     MAX_FOLDER_FILES would need to be >= ${Math.ceil(files.length / 500) * 500} to read this package.`);
}

console.log(`\n${bar}\nWHAT IS EATING THE SLOTS (top-level)\n${bar}`);
const byTop = {};
for (const f of files) {
  const top = f.path.includes("/") ? f.path.split("/")[0] + "/" : "(root)";
  byTop[top] = byTop[top] || { n: 0, bytes: 0, junk: 0 };
  byTop[top].n++; byTop[top].bytes += f.bytes;
  if (isJunk(f.path)) byTop[top].junk++;
}
for (const [top, s] of Object.entries(byTop).sort((a, b) => b[1].n - a[1].n)) {
  console.log(`  ${String(s.n).padStart(5)} files  ${MB(s.bytes).padStart(9)}  ${top}` +
    (s.junk ? `   (${s.junk} junk)` : ""));
}

console.log(`\n${bar}\nDIAGNOSIS\n${bar}`);
if (junk.length) {
  console.log(`  JUNK: ${junk.length} file(s) that should not ship with a task package.`);
  const dirs = [...new Set(junk.map((f) => f.path.split("/").filter((s) => JUNK.includes(s))[0] || "loose"))];
  console.log(`        offending: ${dirs.join(", ")}`);
  console.log(`        without them: ${real.length} files — ` +
    (real.length <= MAX_FILES ? `FITS under MAX_FOLDER_FILES. Fix the package, not the cap.`
                              : `still over the ${MAX_FILES} cap.`));
} else {
  console.log(`  No cache/VCS junk found — every file looks deliberate.`);
}
if (taskTomls.length === 0) console.log(`  No task.toml found at any depth — is this the right folder?`);
else if (taskTomls.length === 1) console.log(`  One task.toml (${taskTomls[0].path}) — a single task package.`);
else {
  console.log(`  ${taskTomls.length} task.toml files — this looks like a PARENT folder holding several tasks:`);
  for (const t of taskTomls.slice(0, 10)) console.log(`        ${t.path}`);
}

console.log(`\n${bar}\nLARGEST FILES\n${bar}`);
for (const f of [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 10)) {
  console.log(`  ${MB(f.bytes).padStart(9)}  ${f.path}`);
}
