#!/usr/bin/env node
// Mirror a Drive folder into <project>/<golden|fixtures>/folders/<folderId>/ so the offline
// fetch-mock can serve it to `fetchDriveData(link, { as: 'folder' })`.
//
// The walk copies run-checks-api's DriveFetcher#walk: it follows shortcuts, guards shortcut
// cycles, skips Google Workspace files (they have no binary content) and dedupes duplicate
// names the way Drive's own UI does. It also writes the `.mimetypes.json` sidecar the wrapper
// reads, so a Workspace file lands in `meta.skipped` locally exactly as it does in the tool.
//
// Content is written straight to disk (never echoed) and golden/folders/ is gitignored.
// Usage:
//   node scripts/fetch-folder.mjs <instance/slug> <folderLinkOrId> [--fixtures] [credPath]
// credPath defaults to $LABELING_CREDENTIALS or the labeling-tool dev credentials.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DRIVE_FOLDER_MIME,
  SHORTCUT_MIME,
  driveFolderId,
  driveMetadata,
  fetchDriveBytes,
  listDriveFolder,
  loadCredentials,
} from "./drive-fetch.mjs";

const GOOGLE_APPS_PREFIX = "application/vnd.google-apps.";
// run-checks-api's folderLimits — mirrored so a fixture cannot hide a real truncation.
const MAX_FILES = 500;
const MAX_BYTES = 50 * 1024 * 1024;
const MAX_DEPTH = 10;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const intoFixtures = args.includes("--fixtures");
const [target, linkArg, credArg] = args.filter((a) => a !== "--fixtures");

if (!target || !target.includes("/") || !linkArg) {
  console.error("Usage: node scripts/fetch-folder.mjs <instance/slug> <folderLinkOrId> [--fixtures] [credPath]");
  process.exit(1);
}

const credPath = credArg || process.env.LABELING_CREDENTIALS ||
  "/Users/harshagrawal/work/labeling-tool/apps/labeling-tool-api/credentials.json";

const [instance, slug] = target.split("/");
const projDir = join(root, "instances", instance, "projects", slug);
if (!existsSync(projDir)) {
  console.error(`No project at ${projDir}`);
  process.exit(1);
}

const folderId = driveFolderId(linkArg) || linkArg;
const outDir = join(projDir, intoFixtures ? "fixtures" : "golden", "folders", folderId);
const cred = loadCredentials(credPath);

const meta = await driveMetadata(cred, folderId);
if (meta.mimeType !== DRIVE_FOLDER_MIME) {
  console.error(`${folderId} is not a folder (mimeType ${meta.mimeType}) — use fetch-artifacts.mjs for files.`);
  process.exit(1);
}
console.log(`folder: ${meta.name} (${folderId})`);

const entries = [];
const skipped = [];
const visited = new Set([folderId]);
const usedPaths = new Set();
let truncated = false;

// Drive permits two files with the same name in one directory: `report.json` -> `report (2).json`.
function uniquePath(path) {
  if (!usedPaths.has(path)) { usedPaths.add(path); return path; }
  const slash = path.lastIndexOf("/");
  const dir = slash === -1 ? "" : path.slice(0, slash + 1);
  const base = path.slice(slash + 1);
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  for (let n = 2; ; n++) {
    const candidate = `${dir}${stem} (${n})${ext}`;
    if (!usedPaths.has(candidate)) { usedPaths.add(candidate); return candidate; }
  }
}

async function walk(id, prefix, depth) {
  if (truncated) return;
  if (depth > MAX_DEPTH) {
    truncated = true;
    skipped.push({ path: prefix || "/", reason: `maximum folder depth of ${MAX_DEPTH} exceeded` });
    return;
  }

  const rows = await listDriveFolder(cred, id);
  const subdirs = [];

  for (const row of rows) {
    let fileId = row.id ?? "";
    let mimeType = row.mimeType ?? "";
    let listedSize = Number(row.size ?? 0);
    const name = row.name ?? "";

    // A shortcut stands in for its target; follow it before classifying.
    if (mimeType === SHORTCUT_MIME && row.shortcutDetails?.targetId) {
      fileId = row.shortcutDetails.targetId;
      mimeType = row.shortcutDetails.targetMimeType ?? "";
      listedSize = 0;
    }
    if (!fileId || !name) continue;

    const path = prefix ? `${prefix}/${name}` : name;

    if (mimeType === DRIVE_FOLDER_MIME) {
      if (visited.has(fileId)) {
        skipped.push({ path, reason: "folder already visited (shortcut cycle)", mimeType });
        continue;
      }
      visited.add(fileId);
      subdirs.push({ id: fileId, path });
      continue;
    }
    if (mimeType.startsWith(GOOGLE_APPS_PREFIX)) {
      skipped.push({ path, reason: "Google Workspace file has no binary content", mimeType });
      continue;
    }
    if (entries.length >= MAX_FILES) {
      truncated = true;
      skipped.push({ path, reason: `maximum of ${MAX_FILES} files per folder reached`, mimeType });
      return;
    }
    entries.push({ id: fileId, path: uniquePath(path), mimeType, listedSize });
  }

  for (const dir of subdirs) await walk(dir.id, dir.path, depth + 1);
}

await walk(folderId, "", 0);

let totalBytes = 0;
const mimeTypes = {};
let written = 0;

for (const entry of entries) {
  if (entry.listedSize > 0 && totalBytes + entry.listedSize > MAX_BYTES) {
    truncated = true;
    skipped.push({ path: entry.path, reason: `folder byte budget of ${MAX_BYTES} would be exceeded`, mimeType: entry.mimeType });
    break;
  }
  let bytes;
  try {
    bytes = await fetchDriveBytes(cred, entry.id);
  } catch (e) {
    skipped.push({ path: entry.path, reason: e.message, mimeType: entry.mimeType });
    continue;
  }
  if (bytes.length > 0 && totalBytes + bytes.length > MAX_BYTES) {
    truncated = true;
    skipped.push({ path: entry.path, reason: `folder byte budget of ${MAX_BYTES} exceeded`, mimeType: entry.mimeType });
    break;
  }
  totalBytes += bytes.length;
  const full = join(outDir, entry.path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, bytes);
  if (entry.mimeType) mimeTypes[entry.path] = entry.mimeType;
  written++;
  console.log(`  ${entry.path} (${bytes.length} bytes)`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, ".mimetypes.json"), JSON.stringify(mimeTypes, null, 2) + "\n");

console.log(`\nwrote ${written} file(s), ${totalBytes} bytes -> ${outDir.replace(root + "/", "")}`);
if (skipped.length) {
  console.log(`skipped ${skipped.length}:`);
  for (const s of skipped) console.log(`  ${s.path} — ${s.reason}`);
}
if (truncated) console.log("TRUNCATED: a cap stopped the walk; the tool would report meta.truncated = true.");
