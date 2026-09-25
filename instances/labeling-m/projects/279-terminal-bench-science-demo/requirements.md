# Requirements — labeling-m / 279-terminal-bench-science-demo

Deterministic validation of the Terminal-Bench-Science task package linked in `ratings.task`
(a **Google Drive folder** URL). Sibling of
[`labeling-g/817-universal-demo-j1-llmae-d`](../../../labeling-g/projects/817-universal-demo-j1-llmae-d/requirements.md):
the same deterministic package-validation idea, a different transport and a different package
contract. No semantic/LLM review, by design.

Everything below was derived from the real package behind the sample task
(conversation 1961550, batch 4065 — folder `1aNCMUaRh4jLKevQhrcEHWlvhOYHIPaNs`, 25 files),
not from 817's layout. The differences that matter are in [§Divergences](#divergences-from-817).

## Transport

| | 817 | 279 |
|---|---|---|
| Field | `ratings.taskFolder` | `ratings.task` |
| Link | signed GCS ZIP URL | Drive folder URL (`/drive/folders/<id>`) |
| Read with | `fetchDataFromGcsZip(link)` | `fetchDriveData(link, { as: 'folder' })` |
| Keys | ZIP entry paths | paths **relative to the linked folder** |

Because the keys are relative, the linked folder is usually the package root itself —
`task.toml` sits at the top level. A package one folder down is handled too.

**The linked folder's own name is not part of the read**, so for a root-level package the
`SAFE_NAME` folder check cannot run and the script says so in `infos`. Findings are then filed
under the declared `[task] name`.

### Partial reads

The folder fetch has budgets (500 files / 50MB / depth 10 / 20s). When any of them bites,
`meta.truncated` is `true` and `files` is **partial** — so every "X is missing" check would
fire on files the package really has. The script raises one blocking error saying the package
cannot be fully validated and **stands the absence-based checks down**, reporting how many in
`infos`. Present-evidence checks (unparseable JSON, spec drift, canary drift, module drift)
still run. The real sample is 25 files, so this should be rare.

`meta.skipped` entries (Google Docs/Sheets, shortcut cycles, unreadable files) are reported as
one warning — they were in the folder but could not be read.

## Check families

`PROFILE` at the top of `validation.js` sets the default (`upload`); a task may override it with
a `validationProfile` form field (`upload` | `audit` | `delivery`), exactly as in 817.

| Profile | Behaviour |
|---|---|
| `upload` | Admission checks. Structural breaks fail; package-quality gaps are `ADVISORY` warnings. |
| `audit` | Same checks, package-quality gaps become blocking errors. |
| `delivery` | `audit` plus the `evaluations/` requirement. |

### A — transport (always blocking)

| Rule | Message |
|---|---|
| `ratings.task` present | the task package link is missing |
| It is a Drive **folder** link | is not a Drive folder link (says so explicitly when it is a *file* link) |
| The folder reads | the Drive folder could not be read |
| It holds ≥1 readable file | holds no readable files |
| `meta.truncated` is false | too large to read in full, so the package cannot be fully validated |
| The sandbox has `fetchDriveData` | this instance cannot read Drive folders |

### B — discovery (always blocking)

Some `task.toml` must exist; a second package must not sit inside the first (a copy under
`<task>/environment/` is a legitimate build-time mirror); folder identities must be unique.

### C — structure (always blocking)

`task.toml` present, non-empty, parses, has `[task] name`; folder name is a safe path segment
(subfolder packages only); `solution/`, `tests/`, `environment/` each exist and hold ≥1
non-empty, non-cache file.

Warnings (never blocking): `instruction.md` missing, `environment/Dockerfile` missing.

### D — grader spec (always blocking)

| Rule |
|---|
| `tests/test.sh` present and non-empty — the verifier entry point |
| `solution/solve.sh` present and non-empty — the oracle entry point |
| `tests/reference.json` present and parses — the bars the verifier grades against |
| `environment/data/spec.json` present and parses — the contract published to the agent |
| `task.toml` declaring `[verifier] environment_mode = "separate"` also ships `tests/Dockerfile` |

### F — the published contract must be the graded contract (always blocking)

The deterministic, offline half of the package's own
`authoring/evidence/spec_matches_verifier.py`. `environment/data/spec.json` is what the agent is
told; `tests/reference.json` is what the grader uses. They must not drift:

| spec.json | reference.json |
|---|---|
| `scoring.metrics.obs_fit.bar` | `fit_good` |
| `scoring.metrics.dyn.bar` | `dyn_good` |
| `scoring.metrics.forecast.bar` | `fore_good` |
| `scoring.metrics.forcing_structure.bar` | `fstruct_good` |
| `scoring.metrics.state_recovery.bar` | `rec_good` |
| `scoring.validity.{state_bound,degenerate_fit,tau_sum_tol}` | same keys |
| `noise_std`, `F_box` | same keys |

The mapping is the one that script asserts, not one inferred here. Also blocking:

- `scoring.staircase_diagnostic` / `partial_credit` / `weights` / `combination` published to the
  agent, or a metric still carrying a `bad` value — the reward is binary, the verifier runs in a
  separate container after the agent finishes, so a partial-credit surface is both unobservable
  and an invitation to trade metrics off.
- `task.toml`'s `artifacts` and `spec.json`'s `output.path` naming different files.

The **behavioural** half of `spec_matches_verifier.py` (grading probe submissions to prove the
reward is binary) needs numpy and the private instance, so it stays out of scope here.

### G — the canary

Every file that defines the task carries `harbor-canary GUID <uuid>`; the real package has one
GUID across 20 of its 25 files.

| Rule | Tier |
|---|---|
| All files that carry a canary agree on **one** GUID | error |
| `task.toml`, `instruction.md`, `tests/test.sh`, `solution/solve.sh` carry it | error |
| Any other `.py`/`.sh`/`.md`/`.toml`/`Dockerfile` carries it | **warning** |

`environment/data/**` is exempt: it is copied into the agent's container, so a canary there
would be visible to the agent rather than protecting anything. The real package ships
`environment/data/check_outputs.py` without one, and `spec.json` is JSON and cannot carry a
comment at all. Binaries (`.npz`) and parsed JSON are not scanned.

### H — package quality (profile-gated)

| Code | Rule |
|---|---|
| `T0.authoring-missing` | `authoring/provenance/` and `authoring/evidence/` present and non-empty |
| `T0.metadata-missing` | `task.toml [metadata]` carries `author_name`, `author_email`, `author_organization`, `domain`, `field`, `subfield`, `expert_time_estimate_hours` |
| `T0.network-mode-undeclared` | `network_mode` declared in both `[verifier.environment]` and `[environment]` — Harbor defaults it to `public`, which the package's own comment says must not be left implicit |
| `T0.delivery-evaluations-missing` | a `delivery` package has `evaluations/` |

### I — module drift (always blocking)

A module shipped to both `tests/` and `solution/` is one module: the real package ships
`kitf.py` (25,401 bytes) to both, byte-identical. Drift between the copies means the oracle and
the grader no longer share their arithmetic.

## Divergences from 817

1. **Grader spec paths.** 817 looks for `tests/verifier.json`, `tests/manifest.json` or
   `verifier.json`. This benchmark has none of them — it grades through `tests/test.sh` reading
   `tests/reference.json`. Porting 817's rule unchanged would fail every valid task, so D checks
   this project's real entry points instead.
2. **The mirror check.** 817 compares `environment/_app` against the task root. This package has
   no `_app`; its real duplication is `kitf.py` in `tests/` and `solution/`, so I checks that.
3. **The evaluations audit is not ported.** 817's per-axis machinery
   (`T0.solvability`, `T0.difficulty-*`, `T2.difficulty-score`, `T0.stability-*`,
   `T0.platform-*`, `T0.root-missing`/`-extra`, `T0.certificate-*`) reads an `evaluations/` tree
   and a finalized package root. **This project's packages carry neither** — the sample is
   `task-only`, with no `evaluations/`, no `qc_report.html` and no `client_qc*`. Writing those
   checks now would mean guessing a layout, so only 817's task-only classification and the
   `delivery` gate are kept. Adding the axis checks later is purely additive: port
   `checkSolvability` / `checkDifficulty` / `checkStability` / `checkPlatform` / `checkFinalRoot`
   / `checkCertificate` from 817 and call them from `validateTask` under
   `pkg.isDir(at(task, 'evaluations'))`.
4. **New for 279:** the canary family (G), the spec-agreement family (F) and the
   `[metadata]`/`network_mode` checks (H) have no 817 equivalent — they are this benchmark's own
   contract, taken from the package and its README.
5. **Symlinks and file modes** are not checkable, as in 817: a Drive folder read carries neither.
   Drive *shortcuts* are followed by the fetcher, and a shortcut cycle arrives in `meta.skipped`.
6. **TOML is parsed by a subset reader** (tables, dotted keys, quoted/bare scalars, inline
   tables, single- and multi-line arrays, triple-quoted strings) — enough for `[task] name`,
   `[metadata]`, `artifacts` and the `network_mode` declarations. It handles the real
   `task.toml`, including its multi-paragraph `relevant_experience` block and the
   `authors = [{ name = … }]` inline-table array. Exotic TOML that `tomllib` accepts could still
   be reported as unparseable.

## Testing

```bash
npm test -- labeling-m/279-terminal-bench-science-demo    # 36 synthetic cases
npm run golden -- labeling-m/279-terminal-bench-science-demo
```

`fixtures/folders/` holds 28 synthetic packages (one per case), generated by
`fixtures/make-folders.mjs` and laid out exactly like the real folder. They are synthetic on
purpose: the real package is client data and lives only in the gitignored `golden/folders/`, so
the committed fixtures carry the same filenames and the same cross-file contract with
placeholder contents and `npm test` needs no credentials.

Refresh the golden copy of the real folder with:

```bash
node scripts/fetch-folder.mjs labeling-m/279-terminal-bench-science-demo <folder-link>
```

**Verified against the real package:** 0 errors and 0 warnings at `upload` and `audit`; at
`delivery`, one `T0.delivery-evaluations-missing` (it is a task-only package). Mutating two
published values in a copy of the real `spec.json` produces exactly one spec-drift error naming
both.

## Open questions before deploying

1. **Which profile should this project gate on?** The sample is task-only, so `delivery` fails
   it. `upload` and `audit` both pass it today.
2. **Does labeling-m's `run-checks-api` have `fetchDriveData`?** It arrived in the
   2026-09-21 rewrite. The script fails with an actionable message if not, but confirm before
   deploying rather than finding out on a batch.
3. **Is `authoring/` required at submission, or only at audit?** It is treated as package
   quality (advisory at `upload`), which is a guess about this project's workflow.
4. **Should `evaluations/` checks be ported?** See divergence 3 — needs one real package that
   has an `evaluations/` tree.
