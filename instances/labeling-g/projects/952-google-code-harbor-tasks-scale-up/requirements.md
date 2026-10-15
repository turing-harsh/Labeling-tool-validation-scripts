# Requirements — labeling-g / 952-google-code-harbor-tasks-scale-up

Harbor task-package validation for Google-CODE-Harbor-Tasks-Scale-Up: the submitted Drive
folder's structure, its sync with the form, `task.toml`, entry points and Dockerfiles. It runs at
the `oracleEvaluationComplete` stage.

**Not checked, by decision:** test discovery, grader/agent leakage, and the oracle and model-run
evaluation results (`oracleEvaluation`, `modelRunEvaluation`, `additionalModelRunEvaluations`).

Written against conversation 1287090 (`speech_diarization_overlap_debug`, folder
`1IhG9sG9Gses3zmZtmKOm0WojRXM-v4aJ`, 95 files), mirrored into the gitignored `golden/folders/`.
The structure checks follow the Harbor ingest parser (`parse_harbor_task_directory`): its errors
stay errors here and its warnings stay warnings.

## Sources of truth

The `task` field is a FormV2 Drive-folder value:

```json
{ "value": { "googleDriveFolderLink": "https://drive.google.com/drive/folders/<id>",
             "lastModifiedAt": "2026-10-01T14:20:48.414Z",
             "renderFolderData": [ /* the folder's root entries; folders carry children */ ] } }
```

1. **Structure comes from the form** (`renderFolderData`): it is what was submitted.
2. The live folder is read with `fetchDriveData(link, { as: 'folder' })` and **must be in sync**
   with the form: same file paths, same sizes. Any difference is an **error**.
3. **Once they are in sync, Drive is the source of truth** for every content check. If they are
   not in sync, the content checks don't run (and `infos` says so). Checking the contents of a
   folder that isn't the one submitted would validate the wrong package.

Form sizes are rendered 1024-based with one decimal (`"599 B"`, `"1.3 KB"`, `"16.6 KB"`),
which was checked against the real bytes. `B` sizes must match exactly; `KB`/`MB` must match
within that rounding.

## Checks

### A — link, fetch, sync
| Check | Level |
|---|---|
| `task` has no `googleDriveFolderLink` (a plain-string URL from older tasks is accepted) | Error |
| Link is not a `/drive/folders/` link | Error |
| `renderFolderData` empty | Error |
| Sandbox has no `fetchDriveData`; folder unreadable; folder empty | Error |
| Drive read truncated (`meta.truncated`): sync can't be confirmed; message names the budget that ran out | Error |
| File in form but not in Drive | Error |
| File in Drive but not in form | Error |
| File size differs between form and Drive | Error |
| File in form that Drive could not read (Google Doc/Sheet, unreadable) | Error |
| `metadata["Drive Link"]` ≠ the submitted folder | Info |

### B — structure (on the form tree)
| Check | Level |
|---|---|
| Missing root entries. Single-step: `task.toml`, `instruction.md`, `environment/`, `tests/`, `solution/`. Multi-step (`steps/` present): `task.toml`, `environment/`, `steps/`. If the package sits one level down, the message says the parent folder was linked | Error |
| Folders or files at the root outside the layout (only `README.md` is optional), e.g. `task_idea.md` | Error |
| Nested `task.toml` (outside `environment/`) | Error |
| `environment/Dockerfile`, `tests/test.sh`, `solution/solve.sh` missing or 0 bytes; `task.toml`/`instruction.md` empty | Error |
| Any file over 60 MB (parser `MAX_TASK_FILE_BYTES`; use DVC) | Error |
| Ignored/junk names (`.DS_Store`, `__pycache__`, `*.pyc`, `.git`, `.venv`, …) | Warning |

Dropped by request: duplicate-name copies (`x (2).py`). Not checkable here: the linked folder's
own name (the Drive read is keyed relative to it), file modes, symlinks.

### C — task.toml
| Check | Level |
|---|---|
| Missing, empty or invalid TOML | Error |
| `[task] name` missing | Error |
| `[task] name` suffix ≠ `metadata["Task Name"]` (a different task was linked) | Error |
| `[task] name` prefix ≠ `thcast/` (`TASK_NAME_PREFIX`) | Warning |
| `schema_version` missing | Warning |
| `[task]` `description`/`keywords` empty | Warning |
| `[metadata]` missing `difficulty`, `category`, `family`, `subdomain`, `task_type`, `expert_time_estimate_hours` | Warning |
| `family`/`subdomain` ≠ `Task Domain`/`Task Sub-Domain` | Warning |
| `[environment]` doesn't set `network_mode`, `cpus`, `memory_mb`, `storage_mb`, `build_timeout_sec` | Warning |
| `cpus`/`memory_mb`/`storage_mb`/`build_timeout_sec` not positive numbers; `gpus` negative or not a number | Error |
| `gpus ≥ 1` | Warning |
| `[agent]`/`[verifier]` `timeout_sec` missing | Warning |
| `[agent]`/`[verifier]` `timeout_sec` set but not a positive number | Error |
| `[[steps]]`: unnamed step; `steps/<name>/` missing; step has no `instruction.md`, or no `tests/test.sh`/`solution/solve.sh` in the step or at the root | Error |

### D — entry points and Dockerfiles

**Build context.** A Dockerfile is built either from its own folder (`COPY project/ …`,
`COPY . /tests/`) or from the task root (`COPY environment/project/ …`,
`COPY tests/test.sh /tests/`). The context is whichever of the two holds every `COPY` source;
if neither does, missing sources are reported against the one with fewer gaps.

| Check | Level |
|---|---|
| `instruction.md` empty (single-step) | Error |
| Nothing under `tests/` writes `reward.txt`/`reward.json` (skipped for rewardkit) | Error |
| `tests/test.sh` runs `pip install`/`apt-get install`/`curl \| sh` when `network_mode = "no-network"` | Error |
| `solve.sh`/`test.sh` use files not in the package (`/tests/x`, `$TEST_ROOT/x`, `$SCRIPT_DIR/x`); paths with `..` and cache folders are skipped | Warning |
| `environment/Dockerfile` has a non-root `USER` (parser rule; set `[agent].user`) | Error |
| `environment/Dockerfile` copies `../`, or (when built from the task root) anything under `solution/` or `tests/` | Error |
| `environment_mode = "separate"` but no `tests/Dockerfile` | Warning |
| `tests/Dockerfile` copies nothing into `/tests` (`COPY . /tests/`, or named files from the task root) | Error |
| A `COPY`/`ADD` source is missing from the build context | Error |
| `pip install` without a pinned version in either Dockerfile | Warning |

## Removed or downgraded after batch 1 (`Batch-Batch-1-Existing-dofiT.csv`, 24 tasks)

| Check | Fired | Now | Why |
|---|---|---|---|
| `tests/Dockerfile` missing while `environment_mode = "separate"` | 15 | Warning | By request; those oracles still scored 1 |
| `[task] authors` blank, `[metadata] benchmark_type` missing | 24 / 24 | Removed | By request; not filled anywhere in this project |
| Entry script uses a missing file | 3 | Warning, skips `..` and caches | Matched `$TEST_ROOT/../environment/…` and `$TEST_ROOT/__pycache__` |
| `[environment] workdir` not set | 3 | Removed | Harbor default applies |

Later removed entirely, by decision: test discovery and leakage (E), the oracle result (F) and
the model-run results (G), including the stale-oracle and difficulty checks.

## Configuration (top of `validation.js`)

- `TASK_NAME_PREFIX = 'thcast'`
- `MAX_TASK_FILE_BYTES = 60 MB`: Harbor parser limit.

## Golden result (1287090)

PASS with no warnings; the form and Drive are in sync (95 files). `golden/1287090.txt` rebuilds
the `task` field from the mirrored folder (`fixtures/make-fixtures.mjs`), so its node ids and
dates are synthetic, while names, sizes and mime types are real.

## Fixtures

`fixtures/make-fixtures.mjs` regenerates `fixtures/folders/` and `fixtures/cases.json`
(15 cases). The packages are synthetic and laid out like the real one; each case's form tree
is derived from the same files, so a case is in sync unless it deliberately differs.
