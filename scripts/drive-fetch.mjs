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
