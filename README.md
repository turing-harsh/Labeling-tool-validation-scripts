# Labeling Tool — Validation Scripts

Single source of truth for the **validation scripts** ("run checks") used across every
labeling-tool instance (`labeling-g`, `labeling-m`, …) and every project inside them.

Each project's script lives here, is version-controlled, testable locally against the **same
sandbox the tool uses**, and paired with its requirements doc, metadata, and test fixtures.
When a script is updated here and its tests pass, it's pasted/deployed into the live tool.

## How the tool runs these scripts (the contract)

The labeling tool wraps each script in an `isolated-vm` sandbox (in the `run-checks-api`
service), injects globals, and calls your function. A script must:

```js
async function validate(conversationData) {
  // read fields off conversationData, push messages into the injected arrays:
  //   errors[]  -> pushing here FAILS the task
  //   warnings[] infos[] successes[] logs[]
  // do not return anything. PASS = errors.length === 0.
}
```

The script text **must literally contain** `function validate(conversationData)` (the tool
rejects it at save time otherwise). Full contract, globals, and data shapes:
[docs/CONVENTIONS.md](docs/CONVENTIONS.md). Our local wrapper
([scripts/wrapper.mjs](scripts/wrapper.mjs)) mirrors the tool's sandbox so local == production.

## Layout

```
instances/
  <instance>/                  e.g. labeling-g, labeling-m
    README.md                  instance notes + index of its projects
    projects/
      <project-slug>/
        validation.js          THE script — single source of truth
        requirements.md        what the validation must enforce (the spec)
        metadata.yml           owner, tool URL/id, task type, status, deploy info
        fixtures/cases.json    conversationData samples + expected errors/warnings
        golden/                sample task payloads (.txt) to run & eyeball — no assertions
templates/                     scaffold copied when creating a new project
scripts/
  new-project.mjs              scaffold a new project
  wrapper.mjs                  local mirror of the tool's sandbox
  run-tests.mjs                run all fixtures through the wrapper
  run-golden.mjs               run a project's golden/*.txt samples & print findings
  report.mjs                   run a script over a full batch export -> .xlsx report
docs/CONVENTIONS.md            the script contract + workflow rules
```

## Setup

```bash
npm install    # only needed for `npm run report` (xlsx). Tests need no deps.
```

## Daily workflow

1. **New project** — scaffold it:
   ```bash
   node scripts/new-project.mjs labeling-g my-project-slug
   ```
2. **Edit** `validation.js`, keep `requirements.md` in sync, add cases to `fixtures/cases.json`.
3. **Test** before deploying:
   ```bash
   npm test                              # all projects
   npm test -- labeling-g/my-project     # one project
   ```
4. **Eyeball sample data** — paste a task payload into `golden/*.txt` and run it:
   ```bash
   npm run golden -- labeling-g/my-project
   ```
5. **Test against a real batch** (optional, deeper coverage):
   ```bash
   npm run report -- path/to/batch.json instances/labeling-g/projects/my-project/validation.js
   ```
6. **Commit** — the git history *is* the change history (see below).
7. **Deploy** — paste the tested `validation.js` into the live tool, then bump
   `deployed.version` / `deployed.date` / `deployed.commit` in `metadata.yml` and commit.

## Tracking history

- Per-project folders mean each script has a clean, isolated `git log` / `git blame`.
- Full history of one script:
  ```bash
  git log --follow -p -- instances/labeling-g/projects/my-project/validation.js
  ```
- What's live vs. working copy: the `deployed` block in `metadata.yml` records the version /
  commit last pasted into the tool.

See [docs/CONVENTIONS.md](docs/CONVENTIONS.md) for the full contract and rules.
