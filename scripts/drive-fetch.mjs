// Google Drive fetch via a service-account key — no npm deps (node:crypto JWT).
// Used to resolve Drive file links to their content for local testing, the same way the
// tool's run-checks-api fetches. Credentials are read locally and never printed/committed.
import crypto from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

const b64url = (x) => Buffer.from(x).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let _cache = null; // { token, exp, credPath }
async function getToken(cred) {
  const now = Math.floor(Date.now() / 1000);
  if (_cache && _cache.exp > now + 60) return _cache.token;
  const jwt = [
    b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    b64url(JSON.stringify({ iss: cred.client_email, scope: "https://www.googleapis.com/auth/drive.readonly", aud: cred.token_uri, iat: now, exp: now + 3600 })),
  ].join(".");
  const assertion = jwt + "." + b64url(crypto.sign("RSA-SHA256", Buffer.from(jwt), cred.private_key));
  const r = await fetch(cred.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`token error: ${j.error || r.status} ${j.error_description || ""}`);
  _cache = { token: j.access_token, exp: now + (j.expires_in || 3600) };
  return _cache.token;
}

export const driveFileId = (link) => {
  let m = String(link).match(/\/file\/d\/([^/?#\s]+)/i); if (m) return m[1];
  m = String(link).match(/[?&]id=([^&#\s]+)/i); return m ? m[1] : null;
};

export const driveFolderId = (link) => {
  const m = String(link).match(/\/folders\/([^/?#\s]+)/i);
  return m ? m[1] : null;
};

export const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
export const SHORTCUT_MIME = "application/vnd.google-apps.shortcut";

export function loadCredentials(credPath) {
  if (!credPath || !existsSync(credPath)) throw new Error(`credentials not found at ${credPath}`);
  return JSON.parse(readFileSync(credPath, "utf8"));
}

// Fetch a Drive file's content as text (works for shared-drive files too).
export async function fetchDriveFile(cred, fileId) {
  const token = await getToken(cred);
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (r.status !== 200) {
    const body = await r.text();
    throw new Error(`drive ${r.status}: ${body.slice(0, 200)}`);
  }
  return await r.text();
}

// Fetch a Drive file's raw bytes — needed for binaries the tool would hand over as mojibake.
export async function fetchDriveBytes(cred, fileId) {
  const token = await getToken(cred);
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (r.status !== 200) {
    const body = await r.text();
    throw new Error(`drive ${r.status}: ${body.slice(0, 200)}`);
  }
  return Buffer.from(await r.arrayBuffer());
}

// One directory listing, same fields run-checks-api's DriveFetcher#walk asks for.
export async function listDriveFolder(cred, folderId) {
  const token = await getToken(cred);
  const rows = [];
  let pageToken;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: "1000",
      fields: "nextPageToken, files(id, name, mimeType, size, shortcutDetails)",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await r.json();
    if (r.status !== 200) {
      throw new Error(`drive list ${r.status}: ${JSON.stringify(body.error?.message || body).slice(0, 200)}`);
    }
    for (const row of body.files || []) rows.push(row);
    pageToken = body.nextPageToken;
  } while (pageToken);
  return rows;
}

// Metadata for one id, so a link can be classified (folder vs file) before walking it.
export async function driveMetadata(cred, fileId) {
  const token = await getToken(cred);
  const params = new URLSearchParams({
    fields: "id, name, mimeType, size, driveId",
    supportsAllDrives: "true",
  });
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?${params}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await r.json();
  if (r.status !== 200) {
    throw new Error(`drive meta ${r.status}: ${JSON.stringify(body.error?.message || body).slice(0, 200)}`);
  }
  return body;
}

// CLI: node scripts/drive-fetch.mjs <credPath> <fileIdOrLink>  (prints metadata only)
if (import.meta.url === `file://${process.argv[1]}`) {
  const [credPath, arg] = process.argv.slice(2);
  const cred = loadCredentials(credPath);
  const id = driveFileId(arg) || arg;
  try {
    const txt = await fetchDriveFile(cred, id);
    console.log(`OK ${id}: ${txt.length} bytes; looksLikeDebug=${txt.includes("Agency config id") || txt.includes("<ctrl99>")}; looksLikeHtml=${/<html/i.test(txt.slice(0, 500))}`);
  } catch (e) {
    console.log(`FAIL ${id}: ${e.message}`);
  }
}
