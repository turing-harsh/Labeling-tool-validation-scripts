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
| `fetchDataFromDriveLink(link)` | async fn | Available in the tool; **throws locally**. |
| `fetchDataFromDriveZip(link)` | async fn | Available in the tool; **throws locally**. |
| `fetchDataFromGcsLink(link)` | async fn | Available in the tool; **throws locally**. |

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
