// Local mirror of the labeling-tool sandbox and its fetch layer. Sources mirrored, all under
// labeling-tool/apps/run-checks-api/src/app/run-checks/:
//   constants.ts (buildSandboxScript) · drive-fetcher.ts · gcs-fetcher.ts
//   drive-source-resolver.ts · gcs-source-resolver.ts · folder-loader.ts
// Keep this in sync with those so local == production.
//
// The tool gives a script two fetch entry points, one per source:
//   await fetchDriveData(link, { as: 'file' | 'zip' | 'folder' })
//   await fetchGcsData(link,   { as: 'file' | 'zip' | 'folder' })
// Nothing is auto-detected: an omitted `as` reads a single file. Both return one envelope
//   { sourceType, files, data?, sizes, meta: { fileCount, totalBytes, truncated, skipped, mimeTypes } }
// The four older helpers (fetchDataFromDriveLink/Zip, fetchDataFromGcsLink/Zip) are retained
// aliases in production: they pin `as` and unwrap the envelope, so existing scripts keep working.
//
// Local fixture folders (under a project's fixtures/ or golden/) stand in for the network:
//   artifacts/<driveFileId>.<ext>   fetchDriveData as 'file'   (any extension; .txt/.html/.json first)
//   artifacts/<driveFileId>.zip     fetchDriveData as 'zip'
//   gcs/<objectBasename>[.ext]      fetchGcsData   as 'file'
//   zips/<objectBasename>.zip       fetchGcsData   as 'zip'
//   folders/<driveFileId>/…         fetchDriveData as 'folder'  (walked recursively)
//   folders/<prefixBasename>/…      fetchGcsData   as 'folder'
import vm from "node:vm";
import zlib from "node:zlib";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Production limits (run-checks-api config.service.ts defaults). The wall-clock
// budgets (fetch timeouts, folder deadline) and `concurrency` have no local
// analogue -- there is no network -- so only the size/shape caps are mirrored.
// ---------------------------------------------------------------------------
const MAX_EXTRACTED_ZIP_BYTES = 50 * 1024 * 1024; // MAX_EXTRACTED_ZIP_BYTES
const MAX_FOLDER_FILES = 500;                     // MAX_FOLDER_FILES
const MAX_FOLDER_BYTES = MAX_EXTRACTED_ZIP_BYTES; // folderLimits.maxBytes reuses the zip cap
const MAX_DRIVE_FOLDER_DEPTH = 10;                // MAX_FOLDER_DEPTH (GCS keys are flat)

const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
const GOOGLE_APPS_PREFIX = "application/vnd.google-apps.";

// Optional sidecar inside a folders/<key>/ fixture: { "<relative path>": "<mimeType>" }.
// Drive folders carry mime types in production (and skip Workspace files by them); GCS
// prefixes do not, so the sidecar is read for Drive fixtures only.
const MIME_SIDECAR = ".mimetypes.json";

// ---------------------------------------------------------------------------
// Link resolution (drive-source-resolver.ts / gcs-source-resolver.ts). Pure and
// offline in production too: the caller states the shape, so nothing is probed.
// ---------------------------------------------------------------------------
// Deliberate divergence: production reaches GoogleDriveService, which demands a
// drive.google.com/colab URL in one of three exact forms and then takes the first path
// segment of 25+ characters as the id. Fixtures here use short synthetic ids
// (folders/FOLDER1, file/d/DBG_A1), so the pattern match stays permissive locally -- a real
// task link satisfies both. The error messages and the id charset gate are production's.
function extractDriveId(link) {
  const s = String(link);
  if (!/(drive|docs)\.google\.com|colab\.research\.google\.com/i.test(s)) {
    throw new Error("Invalid link: URL must be a valid Google Drive link");
  }
  const m =
    s.match(/\/file\/d\/([^/?#\s]+)/i) ||
    s.match(/\/folders\/([^/?#\s]+)/i) ||
    s.match(/\/d\/([^/?#\s]+)/i) ||
    s.match(/[?&]id=([^&#\s]+)/i);
  if (!m) throw new Error(`Could not extract file ID from drive link: ${s}`);
  const id = m[1];
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`Malformed Google Drive id in link: ${s}`);
  return id;
}

function extractGcsInfo(link) {
  const s = String(link);
  const gs = s.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (gs) return { bucket: decodeURIComponent(gs[1]), path: decodeURIComponent(gs[2]) };

  try {
    const url = new URL(s);
    if (url.hostname !== "storage.googleapis.com" && url.hostname !== "storage.cloud.google.com") {
      return null;
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    return {
      bucket: decodeURIComponent(segments[0]),
      path: segments.slice(1).map(decodeURIComponent).join("/"),
    };
  } catch {
    return null;
  }
}

function resolveGcs(link) {
  const info = extractGcsInfo(link);
  if (!info) {
    throw new Error(
      "Invalid link: URL must be a valid GCS link (gs://, storage.googleapis.com, or storage.cloud.google.com)"
    );
  }
  return info;
}

const gcsNotFoundMessage = (link) =>
  `No object found at "${link}". ` +
  `If this is a folder prefix rather than a single object, pass { as: 'folder' }.`;

const driveNotDownloadableMessage = (id) =>
  `"${id}" has no downloadable content. ` +
  `If the link points at a folder, pass { as: 'folder' }; ` +
  `if it is a Google Doc or Sheet, export it to a regular file and link that.`;

// ---------------------------------------------------------------------------
// Decoding + envelope builders (folder-loader.ts)
// ---------------------------------------------------------------------------
function safeJsonParse(content) {
  try { return JSON.parse(content); } catch { return content; }
}

// Binary files (.npz, images, …) become mojibake here exactly as they do in the tool;
// scripts are expected to consult meta.mimeTypes rather than assume readable text.
function decodeContent(path, buffer) {
  const text = buffer.toString("utf8");
  return path.endsWith(".json") ? safeJsonParse(text) : text;
}

/** A single file: the same envelope with exactly one key, plus `data`. */
function singleFileEnvelope(sourceType, name, value, byteLength, mimeType) {
  return {
    sourceType,
    files: { [name]: value },
    data: value,
    sizes: { [name]: byteLength },
    meta: {
      fileCount: 1,
      totalBytes: byteLength,
      truncated: false,
      skipped: [],
      mimeTypes: mimeType ? { [name]: mimeType } : {},
    },
  };
}

function zipEnvelope(sourceType, files, sizes, totalBytes) {
  return {
    sourceType,
    files,
    sizes,
    meta: {
      fileCount: Object.keys(files).length,
      totalBytes,
      truncated: false,
      skipped: [],
      mimeTypes: {},
    },
  };
}

function folderEnvelope(sourceType, collected, skipped) {
  return {
    sourceType,
    files: collected.files,
    sizes: collected.sizes,
    meta: {
      fileCount: Object.keys(collected.files).length,
      totalBytes: collected.totalBytes,
      truncated: collected.truncated,
      skipped,
      mimeTypes: collected.mimeTypes,
    },
  };
}

// ---------------------------------------------------------------------------
// Minimal ZIP reader (central directory + stored/deflate entries) so local testing
// needs no npm deps. Mirrors the adm-zip use in drive-fetcher/gcs-fetcher: entries keyed
// by entry path, `sizes` are UNCOMPRESSED bytes, .json auto-parsed with a raw-text
// fallback. Zip64 archives (>4GB / >65535 entries) are not supported here.
// ---------------------------------------------------------------------------
function readZipEntries(buf) {
  const EOCD = 0x06054b50, CEN = 0x02014b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65536; i--) {
    if (buf.readUInt32LE(i) === EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a zip file (no end-of-central-directory record)");

  const count = buf.readUInt16LE(eocd + 10);
  let pos = buf.readUInt32LE(eocd + 16);
  const entries = [];

  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(pos) !== CEN) throw new Error("corrupt central directory");
    const method = buf.readUInt16LE(pos + 10);
    const compressedSize = buf.readUInt32LE(pos + 20);
    const size = buf.readUInt32LE(pos + 24);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const localOffset = buf.readUInt32LE(pos + 42);
    const name = buf.toString("utf8", pos + 46, pos + 46 + nameLen);
    pos += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith("/")) continue; // directory entry, skipped like adm-zip's isDirectory
    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLen + localExtraLen;
    const raw = buf.subarray(start, start + compressedSize);
    entries.push({ name, size, data: method === 0 ? raw : zlib.inflateRawSync(raw) });
  }

  return entries;
}

/** Mirrors DriveFetcher#extractZip / GcsFetcher#loadZip, including the cumulative size cap. */
function loadZipEnvelope(sourceType, buf) {
  const files = {};
  const sizes = {};
  let extractedBytes = 0;

  for (const entry of readZipEntries(buf)) {
    extractedBytes += entry.size;
    if (extractedBytes > MAX_EXTRACTED_ZIP_BYTES) {
      throw new Error(
        `Extracted ZIP size exceeds ${MAX_EXTRACTED_ZIP_BYTES / 1024 / 1024} MB limit`
      );
    }
    const content = entry.data.toString("utf8");
    sizes[entry.name] = entry.size;
    // A malformed .json reaches the script as raw text so it can be reported,
    // instead of failing the whole fetch.
    files[entry.name] = entry.name.endsWith(".json") ? safeJsonParse(content) : content;
  }

  return zipEnvelope(sourceType, files, sizes, extractedBytes);
}

// ---------------------------------------------------------------------------
// Local folder fixtures: walk folders/<key>/ the way DriveFetcher#walk +
// downloadFolderEntries do, against the same file/byte/depth budgets. Keys are paths
// relative to the fixture root, so tests/kitf.py and solution/kitf.py stay distinct.
// ---------------------------------------------------------------------------
function readMimeSidecar(rootDir) {
  const p = join(rootDir, MIME_SIDECAR);
  if (!existsSync(p)) return {};
  const parsed = safeJsonParse(readFileSync(p, "utf8"));
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function loadFolderEnvelope(sourceType, rootDir, maxDepth) {
  // Production reads mime types from the Drive listing; a GCS prefix listing carries none,
  // so meta.mimeTypes stays empty there and the sidecar is ignored.
  const declaredMimes = sourceType === "drive_folder" ? readMimeSidecar(rootDir) : {};
  const files = {}, sizes = {}, mimeTypes = {}, skipped = [];
  let totalBytes = 0, fileCount = 0, truncated = false, stop = false;

  const walk = (dir, prefix, depth) => {
    if (stop) return;

    if (depth > maxDepth) {
      truncated = true;
      skipped.push({ path: prefix || "/", reason: `maximum folder depth of ${maxDepth} exceeded` });
      return;
    }

    const subdirs = [];
    for (const name of readdirSync(dir).sort()) {
      if (stop) return;
      // Only the sidecar is ours to hide. Production's DriveFetcher#walk skips nothing by
      // name -- it filters on mimeType alone -- so a blanket dotfile skip here would hide
      // .DS_Store, .git/ and .ipynb_checkpoints from checks that exist to find them.
      if (name === MIME_SIDECAR) continue;

      const abs = join(dir, name);
      const path = prefix ? `${prefix}/${name}` : name;

      if (statSync(abs).isDirectory()) { subdirs.push([abs, path]); continue; }

      const mimeType = typeof declaredMimes[path] === "string" ? declaredMimes[path] : undefined;

      if (mimeType === DRIVE_FOLDER_MIME || (mimeType && mimeType.startsWith(GOOGLE_APPS_PREFIX))) {
        skipped.push({ path, reason: "Google Workspace file has no binary content", mimeType });
        continue;
      }

      if (fileCount >= MAX_FOLDER_FILES) {
        truncated = true;
        stop = true;
        skipped.push({
          path,
          reason: `maximum of ${MAX_FOLDER_FILES} files per folder reached`,
          ...(mimeType ? { mimeType } : {}),
        });
        return;
      }

      const buffer = readFileSync(abs);
      if (buffer.length > 0 && totalBytes + buffer.length > MAX_FOLDER_BYTES) {
        truncated = true;
        stop = true;
        skipped.push({
          path,
          reason: `folder byte budget of ${MAX_FOLDER_BYTES} would be exceeded`,
          ...(mimeType ? { mimeType } : {}),
        });
        return;
      }

      totalBytes += buffer.length;
      fileCount++;
      sizes[path] = buffer.length;
      if (mimeType) mimeTypes[path] = mimeType;
      files[path] = decodeContent(path, buffer);
    }

    for (const [abs, path] of subdirs) walk(abs, path, depth + 1);
  };

  walk(rootDir, "", 0);
  return folderEnvelope(sourceType, { files, sizes, mimeTypes, totalBytes, truncated }, skipped);
}

// ---------------------------------------------------------------------------
// Fixture lookup
// ---------------------------------------------------------------------------
/** `<dir>/<name>` exactly, then `<dir>/<name>.<ext>` for each ext, then any `<name>.*`. */
function resolveFixture(dir, name, exts, loose = true) {
  if (!dir || !existsSync(dir)) return null;
  const isFile = (p) => existsSync(p) && statSync(p).isFile();

  const exact = join(dir, name);
  if (isFile(exact)) return exact;
  for (const ext of exts) {
    const p = join(dir, `${name}.${ext}`);
    if (isFile(p)) return p;
  }
  if (!loose) return null;
  const hit = readdirSync(dir).find((f) => f.startsWith(`${name}.`) && isFile(join(dir, f)));
  return hit ? join(dir, hit) : null;
}

function folderFixture(foldersDir, key) {
  if (!foldersDir) return null;
  const p = join(foldersDir, key);
  return existsSync(p) && statSync(p).isDirectory() ? p : null;
}

const missingDirMessage = (what, dir) =>
  `${what} is not available locally: no ${dir}/ fixtures configured for this project ` +
  `(add fixtures/${dir}/ or golden/${dir}/ — see docs/CONVENTIONS.md).`;

/**
 * Host-side fetch for one source. Returns the same envelope the tool's fetchers return.
 * `dirs` holds the project's fixture folders: { drive, gcs, zips, folders }.
 */
function fetchDriveFixture(link, as, dirs) {
  const id = extractDriveId(link);

  if (as === "folder") {
    const root = folderFixture(dirs.folders, id);
    if (root) return loadFolderEnvelope("drive_folder", root, MAX_DRIVE_FOLDER_DEPTH);
    if (!dirs.folders) throw new Error(missingDirMessage("fetchDriveData({ as: 'folder' })", "folders"));
    throw new Error(`No local Drive folder fixture for id "${id}" (expected ${join(dirs.folders, id)}/).`);
  }

  if (as === "zip") {
    const path = resolveFixture(dirs.drive, id, ["zip"], false);
    if (path) return loadZipEnvelope("drive_zip", readFileSync(path));
    if (!dirs.drive) throw new Error(missingDirMessage("fetchDriveData({ as: 'zip' })", "artifacts"));
    throw new Error(`No local Drive zip fixture for id "${id}" (expected ${join(dirs.drive, `${id}.zip`)}).`);
  }

  const path = resolveFixture(dirs.drive, id, ["txt", "html", "json"]);
  if (path) {
    const buffer = readFileSync(path);
    // Both fetchers JSON-parse a single file regardless of its extension, and hand the
    // script the parsed value when it parses -- the raw text otherwise.
    return singleFileEnvelope("drive_file", id, safeJsonParse(buffer.toString("utf8")), buffer.length);
  }
  // Aiming the default at a folder is the likeliest mistake; production says what to do.
  if (folderFixture(dirs.folders, id)) throw new Error(driveNotDownloadableMessage(id));
  if (!dirs.drive) throw new Error(missingDirMessage("fetchDriveData", "artifacts"));
  throw new Error(`No local Drive fixture for id "${id}" (looked for ${id}.txt/.html/.json in ${dirs.drive}).`);
}

function fetchGcsFixture(link, as, dirs) {
  const source = resolveGcs(link);
  // Objects are keyed locally by basename; a prefix by its last segment.
  const key = source.path.replace(/\/+$/, "").split("/").pop() || source.path;

  if (as === "folder") {
    const root = folderFixture(dirs.folders, key);
    if (root) return loadFolderEnvelope("gcs_folder", root, Number.MAX_SAFE_INTEGER);
    if (!dirs.folders) throw new Error(missingDirMessage("fetchGcsData({ as: 'folder' })", "folders"));
    throw new Error(`No local GCS prefix fixture for "${key}" (expected ${join(dirs.folders, key)}/).`);
  }

  if (as === "zip") {
    const path = resolveFixture(dirs.zips, key, ["zip"], false);
    if (path) return loadZipEnvelope("gcs_zip", readFileSync(path));
    if (!dirs.zips) throw new Error(missingDirMessage("fetchGcsData({ as: 'zip' })", "zips"));
    throw new Error(`No local GCS zip fixture for "${key}" (expected ${join(dirs.zips, `${key}.zip`)}).`);
  }

  const path = resolveFixture(dirs.gcs, key, ["json", "txt"]);
  if (path) {
    const buffer = readFileSync(path);
    return singleFileEnvelope("gcs_file", key, safeJsonParse(buffer.toString("utf8")), buffer.length);
  }
  if (folderFixture(dirs.folders, key)) throw new Error(gcsNotFoundMessage(link));
  if (!dirs.gcs) throw new Error(missingDirMessage("fetchGcsData", "gcs"));
  throw new Error(`No local GCS fixture for "${key}" (looked for ${key} in ${dirs.gcs}). ` + gcsNotFoundMessage(link));
}

/**
 * The bridge the sandbox calls. Results cross as JSON so the script gets
 * context-native objects -- the same copy semantics as production's
 * `result: { copy: true }` -- and so a host Error arrives as a plain message.
 */
function makeHostFetch(dirs) {
  return (sourceName, link, as) => {
    try {
      const envelope = sourceName === "drive"
        ? fetchDriveFixture(link, as, dirs)
        : fetchGcsFixture(link, as, dirs);
      return JSON.stringify({ ok: true, envelope });
    } catch (err) {
      return JSON.stringify({ ok: false, message: err && err.message ? err.message : String(err) });
    }
  };
}

// ---------------------------------------------------------------------------
// The sandbox itself (constants.ts buildSandboxScript)
// ---------------------------------------------------------------------------
function buildSandboxSource(userScript) {
  return `
  "use strict";
  const errors = [];
  const warnings = [];
  const infos = [];
  const successes = [];
  const logs = [];

  const __checkLink = (link, label) => {
    if (typeof link !== 'string') {
      throw new Error(label + ' link must be a string');
    }
    if (!link.trim()) {
      throw new Error(label + ' link cannot be empty');
    }
  };

  const __errorMessage = (error) =>
    error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : String(error);

  // Unknown or omitted shapes fall through to 'file', as they do in the tool.
  const __loadData = (source, link, options) => {
    const as = options && typeof options === 'object' && options.as != null
      ? String(options.as)
      : 'file';
    const res = JSON.parse(__hostFetch(source, String(link), as));
    if (!res.ok) throw new Error(res.message);
    return res.envelope;
  };

  // Fetch a Google Drive link as a file, a zip, or a folder.
  // Say which with { as: 'file' | 'zip' | 'folder' }; omitting it reads a single file.
  // Returns { sourceType, files, data, sizes, meta }.
  const fetchDriveData = async (link, options) => {
    __checkLink(link, 'Drive');
    try {
      return __loadData('drive', link, options || {});
    } catch (error) {
      throw new Error(\`Failed to fetch Drive data from "\${link}": \${__errorMessage(error)}\`);
    }
  };

  // Fetch a GCS link as an object, a zip, or a folder prefix.
  // Say which with { as: 'file' | 'zip' | 'folder' }; omitting it reads a single object.
  // Returns { sourceType, files, data, sizes, meta }.
  const fetchGcsData = async (link, options) => {
    __checkLink(link, 'GCS');
    try {
      return __loadData('gcs', link, options || {});
    } catch (error) {
      throw new Error(\`Failed to fetch GCS data from "\${link}": \${__errorMessage(error)}\`);
    }
  };

  // --- Retained aliases -----------------------------------------------------
  // These pin \`as\`, so their return shapes are exactly what they always were.

  const fetchDataFromDriveLink = async (link) => {
    __checkLink(link, 'Drive');
    try {
      return __loadData('drive', link, { as: 'file' }).data;
    } catch (error) {
      throw new Error(\`Failed to fetch data from link "\${link}": \${__errorMessage(error)}\`);
    }
  };

  const fetchDataFromDriveZip = async (link) => {
    __checkLink(link, 'Drive');
    try {
      const result = __loadData('drive', link, { as: 'zip' });
      return Object.assign({}, result.files, { __sizes: result.sizes });
    } catch (error) {
      throw new Error(\`Failed to fetch zip from link "\${link}": \${__errorMessage(error)}\`);
    }
  };

  const fetchDataFromGcsLink = async (link) => {
    __checkLink(link, 'GCS');
    try {
      return __loadData('gcs', link, { as: 'file' }).data;
    } catch (error) {
      throw new Error(\`Failed to fetch data from GCS link "\${link}": \${__errorMessage(error)}\`);
    }
  };

  const fetchDataFromGcsZip = async (link) => {
    __checkLink(link, 'GCS');
    try {
      const result = __loadData('gcs', link, { as: 'zip' });
      return Object.assign({}, result.files, { __sizes: result.sizes });
    } catch (error) {
      throw new Error(\`Failed to fetch zip from GCS link "\${link}": \${__errorMessage(error)}\`);
    }
  };

  ${userScript}

  (async () => {
    try {
      if (typeof validate === 'function') {
        const r = validate(conversationData);
        if (r && typeof r.then === 'function') await r;
      } else {
        errors.push('Validate function is not defined or is not a function. Type: ' + typeof validate);
      }
    } catch (error) {
      const msg = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
      errors.push('Validation error: ' + msg);
      if (error && typeof error === 'object' && 'stack' in error) logs.push('Error stack: ' + String(error.stack));
    }

    const sanitize = (arr) => Array.isArray(arr)
      ? arr.filter(i => typeof i === 'string').slice(0, 100).map(s => String(s).slice(0, 1000))
      : [];

    return JSON.stringify({
      errors: sanitize(errors),
      warnings: sanitize(warnings),
      infos: sanitize(infos),
      successes: sanitize(successes),
      logs: sanitize(logs),
    });
  })();
  `;
}

/**
 * Map a project's `fixtures/` or `golden/` folder to the fetch-mock options `runValidation`
 * takes. Only folders that actually exist are reported, so a shape with no fixtures stays
 * unavailable and a script that reaches for it fails loudly instead of reading nothing.
 */
export function fetchMockDirs(baseDir) {
  const pick = (name) => {
    const p = join(baseDir, name);
    return existsSync(p) && statSync(p).isDirectory() ? p : undefined;
  };
  return {
    driveDir: pick("artifacts"),
    gcsDir: pick("gcs"),
    zipDir: pick("zips"),
    folderDir: pick("folders"),
  };
}

const EMPTY = { errors: [], warnings: [], infos: [], successes: [], logs: [] };

/**
 * Run a validation script against one conversationData object.
 *
 * Fixture folders (all optional — an unconfigured one makes that shape throw, the way the
 * tool throws on a link it cannot read):
 *   driveDir  artifacts/  Drive files and zips, keyed by Drive file id
 *   gcsDir    gcs/        GCS objects, keyed by object basename
 *   zipDir    zips/       GCS zips, keyed by object basename
 *   folderDir folders/    Drive folders (by id) and GCS prefixes (by last segment)
 * `fetchDir` is kept as the older name for `driveDir`.
 *
 * @returns {Promise<{errors,warnings,infos,successes,logs}>}
 */
export async function runValidation(
  userScript,
  conversationData,
  { timeoutMs = 30000, fetchDir, driveDir, gcsDir, zipDir, folderDir } = {}
) {
  const source = buildSandboxSource(userScript);
  // Mirror the production isolate (run-checks-api script-executor): it injects ONLY
  // conversationData and the fetch bridge -- no console, no setTimeout/timers. Scripts that
  // reference those would break at runtime in the tool, so they must break here too. Language
  // intrinsics (Object, Promise, JSON, Date, ...) exist natively in the fresh context.
  const sandbox = {
    conversationData,
    __hostFetch: makeHostFetch({
      drive: driveDir ?? fetchDir,
      gcs: gcsDir,
      zips: zipDir,
      folders: folderDir,
    }),
  };
  vm.createContext(sandbox);
  try {
    const script = new vm.Script(source, { filename: "validation-sandbox.js" });
    const resultJson = await script.runInContext(sandbox, { timeout: timeoutMs });
    return { ...EMPTY, ...JSON.parse(resultJson) };
  } catch (err) {
    return { ...EMPTY, errors: [`Script execution failed: ${err.message}`], logs: [err.stack || ""] };
  }
}
