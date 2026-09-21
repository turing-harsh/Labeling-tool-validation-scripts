# Conventions

These match how the labeling tool actually runs validation scripts. The tool wraps your
script in a sandbox (`buildSandboxScript` in the labeling-tool API), injects a set of
globals, then calls your `validate` function. Our local test wrapper
([scripts/wrapper.mjs](../scripts/wrapper.mjs)) mirrors that sandbox exactly, so a script
that passes here behaves the same when pasted into the tool.

## The validation script contract

Every `validation.js` is a **plain script** (not an ES module — no `import`/`export`) that
defines:

```js
async function validate(conversationData) {
  // push messages into the injected global arrays; do not return anything
}
```

> **The script text must literally contain `function validate(conversationData)`.** The tool
> rejects a script at save time if that exact substring is missing — so use the named-function
> form above (an arrow like `const validate = (conversationData) => {}` would be rejected).
> `async function validate(conversationData)` is fine (it contains the substring).

### Injected globals (provided by the sandbox — do NOT declare them yourself)

| Global | Type | Purpose |
|--------|------|---------|
| `conversationData` | object | The task data. Locally: `{ ratings }`. |
| `errors` | string[] | Push here to **FAIL** the task. |
| `warnings` | string[] | Non-blocking issues. Do not affect pass/fail. |
| `infos` | string[] | Informational notes. |
| `successes` | string[] | Positive confirmations ("X checks out"). |
| `logs` | string[] | Debug logs. |
| `fetchDriveData(link, options)` | async fn | Read a Google Drive link as a file, a ZIP, or a folder. See [Fetching linked files](#fetching-linked-files). |
| `fetchGcsData(link, options)` | async fn | Same for a GCS link (`gs://`, `storage.googleapis.com`, `storage.cloud.google.com`). |
| `fetchDataFromDriveLink/Zip`, `fetchDataFromGcsLink/Zip` | async fn | Retained aliases over the two above — still supported, see [Retained aliases](#retained-aliases). |

### Rules

- **PASS = `errors.length === 0`.** Warnings never fail a task.
- `validate` may be `async`; the wrapper awaits it.
- Push **strings only**. The sandbox keeps max 100 items per array, each truncated to 1000
  chars — keep messages concise.
- Standard JS built-ins are available (`Object`, `Array`, `Map`, `Set`, `RegExp`, `Math`,
  `Date`, `JSON`, `parseInt`, …). No Node built-ins, no npm packages, no `require`/`import`.
- Don't rely on `console.*` — it's stubbed to no-ops. Use `logs.push(...)`.
- **Limits:** script ≤ 100KB, runtime ≤ 30s, memory ≤ 256MB (enforced by the tool).

> **Sandbox note.** In production the tool runs scripts in an `isolated-vm` isolate inside a
> standalone `run-checks-api` service; the main API stores the script, builds
> `conversationData`, and calls that service over HTTP. Our local wrapper uses Node's built-in
> `vm` with the same injected globals and the same result-collection logic, so behavior matches
> for ordinary validation logic.

## `conversationData` shape

The exact shape **depends on project type** (RLHF, SFT, FORM, Video, …) — in the tool it's
built as `{ task_data, ...metadata }`, where `task_data` is project-type-specific. Batch
exports used for local testing expose the form fields under `ratings`. Because of this, real
scripts locate their fields defensively, e.g.:

```js
const ratings =
  conversationData?.ratings ||
  conversationData?.task_data?.formData?.ratings ||
  conversationData?.raw_data?.formData?.ratings || [];
```

For form/ratings projects, `conversationData.ratings` is an array of form fields:

```js
{
  key: "targetLanguage",        // stable field id — read values by this
  question: "Target Language",  // human label
  input_type: "SINGLE_CHOICE",
  value_options: [...],
  human_input_value: "Turkish"  // what the labeler entered
}
```

Read values by key:

```js
const byKey = {};
for (const r of conversationData.ratings || []) byKey[r.key] = r.human_input_value;
const lang = byKey.targetLanguage;
```

## fixtures/cases.json

Each case is a `conversationData` plus expectations on the collected arrays:

```json
[
  {
    "name": "valid task passes",
    "conversationData": { "ratings": [ { "key": "targetLanguage", "human_input_value": "Turkish" } ] },
    "expect": { "errors": [] }
  },
  {
    "name": "missing language fails",
    "conversationData": { "ratings": [] },
    "expect": { "errorsContain": ["Target Language is required"] }
  }
]
```

- `expect.errors: []` asserts the task passes (zero errors).
- `expect.errorsContain: [...]` asserts each substring appears in some error.
- `expect.warningsContain: [...]` / `expect.successesContain: [...]` work the same way.
- Add a case per rule in `requirements.md`, plus real edge cases you've hit in batches.

## Fetching linked files

Two functions cover every source and shape:

```js
await fetchDriveData(link, { as: 'file' | 'zip' | 'folder' })   // Google Drive
await fetchGcsData(link,   { as: 'file' | 'zip' | 'folder' })   // GCS
```

**Pass the shape explicitly.** Nothing is guessed — not even from a `.zip` suffix — because
detecting it would cost an extra metadata round trip and gets ambiguous mime types wrong.
An omitted `as` reads a **single file**; pointing that at a folder link fails with an error
telling you to pass `{ as: 'folder' }`.

Both return the same envelope:

```js
{
  sourceType,  // 'drive_file' | 'drive_zip' | 'drive_folder' | 'gcs_file' | 'gcs_zip' | 'gcs_folder'
  files,       // { "<path>": parsedJsonOrText } — one key for a single file
  data,        // single-file shapes only: the one parsed value
  sizes,       // { "<path>": bytes }
  meta: {
    fileCount, totalBytes,
    truncated,   // true = a cap or the deadline stopped us; `files` is partial
    skipped,     // [{ path, reason, mimeType }]
    mimeTypes,   // { "<path>": mimeType }
  },
}
```

### Rules that bite

- **Always check `meta.truncated`** before concluding a file is missing — a large folder may
  have been cut short at the time or size budget. Report it as a warning, not as a defect.
- **A single file's one key is not its name:** the Drive file id for Drive, the object's
  basename for GCS (reading the real Drive name would cost another API call). Use `data`.
- **`.json` is auto-parsed**; a malformed `.json` arrives as **raw text** so the script can
  report it instead of crashing. A single file is JSON-parsed whatever its extension, with the
  same raw-text fallback.
- **Everything is decoded as UTF-8**, so binary files (`.npz`, images, …) arrive as mojibake.
  Use `meta.mimeTypes` to skip them rather than asserting on their contents.
- **Folder keys are paths relative to the folder**, so `tests/kitf.py` and `solution/kitf.py`
  stay distinct.
- Drive folder walks follow shortcuts, skip Google Workspace files (no binary content) and
  record both in `meta.skipped`.
- Drive files must be shared with `beling-tool-g-svc@turing-gpt.iam.gserviceaccount.com`.
- Wrap fetches in `try`/`catch` and turn a failure into a finding — a throw that escapes
  `validate` becomes one opaque `Validation error:` line.
- **Don't `await` fetches serially in a loop.** One task can carry 20+ links against a 30s
  script budget; issue them together with `Promise.allSettled`.

**Limits** (run-checks-api defaults): extracted ZIP/folder bytes ≤ 50MB · ≤ 500 files per
folder · Drive folder depth ≤ 10 (GCS keys are flat) · Drive fetch 30s, GCS fetch 10s, folder
walk 20s · 8 downloads in parallel.

### Retained aliases

The four older helpers still work — they pin `as` and unwrap the envelope, so existing scripts
need no edit:

| Alias | Equivalent to | Returns |
|-------|---------------|---------|
| `fetchDataFromDriveLink(link)` | `fetchDriveData(link, { as: 'file' })` | `result.data` |
| `fetchDataFromDriveZip(link)` | `fetchDriveData(link, { as: 'zip' })` | `{ ...result.files, __sizes: result.sizes }` |
| `fetchDataFromGcsLink(link)` | `fetchGcsData(link, { as: 'file' })` | `result.data` |
| `fetchDataFromGcsZip(link)` | `fetchGcsData(link, { as: 'zip' })` | `{ ...result.files, __sizes: result.sizes }` |

New code should use `fetchDriveData` / `fetchGcsData`: only they expose `meta.truncated`,
`meta.skipped` and `meta.mimeTypes`, and only they can read a folder.

## Local fetch mocks

These folders stand in for the tool's fetch layer so cases and golden runs work offline. Put
them under a project's `fixtures/` (for `npm test`) or `golden/` (for `npm run golden`):

| Folder | Serves | Lookup key |
|--------|--------|------------|
| `artifacts/` | `fetchDriveData` as `'file'` | `<driveFileId>.txt` / `.html` / `.json` (any extension works) |
| `artifacts/` | `fetchDriveData` as `'zip'` | `<driveFileId>.zip` |
| `gcs/` | `fetchGcsData` as `'file'` | `<objectBasename>` — `form-v2/abc123.json?Expires=…` → `abc123.json` |
| `zips/` | `fetchGcsData` as `'zip'` | `<objectBasename>.zip` — `form-v2/abc123.zip?Expires=…` → `abc123.zip` |
| `folders/<key>/…` | either, as `'folder'` | the Drive folder id, or a GCS prefix's last segment (`gs://b/runs/r42` → `r42`) |

A folder fixture is walked recursively and keyed the same way production keys it. An optional
`folders/<key>/.mimetypes.json` (`{ "<relative path>": "<mimeType>" }`) fills `meta.mimeTypes`
for a **Drive** folder, and a `application/vnd.google-apps.*` entry there lands in
`meta.skipped` exactly as a real Workspace file does. GCS prefix listings carry no mime types
in production either, so the sidecar is ignored for them.

A folder that doesn't exist leaves that shape **unavailable**: the call throws, rather than
quietly reading nothing. `scripts/wrapper.mjs` unpacks zips with `node:zlib` (stored +
deflate, no Zip64) and mirrors `drive-fetcher.ts` / `gcs-fetcher.ts` / `folder-loader.ts` —
envelope shape, `sizes`, `skipped` reasons, size/file/depth caps and error text included.

**Two deliberate local divergences**, both documented at their definition in the wrapper:

- Drive link parsing is permissive, so fixtures can use short synthetic ids
  (`file/d/DBG_A1`, `drive/folders/FOLDER1`). The tool needs a real 25+ character Drive id.
- There is no network, so the wall-clock budgets (fetch timeouts, folder deadline) and
  `concurrency` have no local effect. Only the size, file-count and depth caps are enforced,
  so `meta.truncated` is reproducible but never time-driven.

## Testing against real batches

Beyond unit fixtures, run a script against a full batch export to get a quality report:

```bash
npm run report -- <batch.json> instances/labeling-g/projects/<slug>/validation.js
```

This runs every task in the batch through the same sandbox and writes an `.xlsx` with a
pass/fail summary and per-task detail. See [scripts/report.mjs](../scripts/report.mjs).

## Naming

- **Instances**: real name, lowercase — `labeling-g`, `labeling-m`.
- **Project slugs**: `kebab-case`, stable, unique within an instance.

## Status values (metadata.yml)

`draft` → in progress · `active` → live in the tool · `deprecated` → no longer used.

## Deploy discipline

`validation.js` here is the source of truth. After pasting into the live tool, record it in
`metadata.yml`: bump `deployed.version`, set `deployed.date`, `deployed.by`, `deployed.commit`.
That's how we tell the working copy apart from what's actually running.
