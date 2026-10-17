# Requirements — labeling-eval / 198-terminal-bench-science / task-data-validation-1128

> Started as a copy of `labeling-m/279-terminal-bench-science-demo`, where this script was
> written; "279" below names this script. **The two have diverged:** only this copy enforces the
> new task.toml structure (see [§task.toml](#tasktoml)). 279 keeps the old rules.

Deterministic validation of the Terminal-Bench-Science task package linked in `ratings.task`
(a **Google Drive folder** URL).

**This is a pre-oracle gate.** The author drops a raw, unrun folder; neither the oracle nor an
agent has touched it. Nothing here builds an image or runs a container, so every check is
decidable from the bytes of the folder alone. Its job is to reject a package that cannot
survive an oracle run — or whose oracle run would prove nothing — before that run is paid for.

Sibling of [`labeling-g/817-universal-demo-j1-llmae-d`](../../../../../labeling-g/projects/817-universal-demo-j1-llmae-d/requirements.md):
same idea, different transport and a different package contract. See
[§Divergences](#divergences-from-817).

Written and verified against three real packages — 379988 (`rainfall-return-levels`),
380030 (`contact-response`) and 380196 (`dilute-ising-tc`) — plus the demo package behind
conversation 1961550. Where a rule and a real package disagreed, the package won.

## Transport

| | 817 | 279 |
|---|---|---|
| Field | `ratings.taskFolder` | `ratings.task` |
| Link | signed GCS ZIP URL | Drive folder URL (`/drive/folders/<id>`) |
| Read with | `fetchDataFromGcsZip(link)` | `fetchDriveData(link, { as: 'folder' })` |
| Keys | ZIP entry paths | paths **relative to the linked folder** |

Because keys are relative, the linked folder *is* the package root — `task.toml` sits at the
top level. The folder's own name is not part of the read, so the `SAFE_NAME` / kebab-case
folder checks cannot run for a root-level package and the script says so in `infos`.

### Partial reads

The folder fetch has budgets (file count, total bytes, depth, a wall-clock deadline). When any
bites, `meta.truncated` is `true` and `files` is **partial** — so every "X is missing" check
would fire on files the package really has. Absence-based findings route through
`missingHard()` / `missingFinding()`, which stand down and report how many in `infos`.
Present-evidence checks still run. `validate()` resets that partial-read state at the start of
every run, so a truncated read cannot silence the absence checks of the next one when the
sandbox reuses a loaded script.

The truncation finding names **which** budget fired, read out of `meta.skipped` — never a
hardcoded number, because the reader's budgets are deployment config and drift. Four causes are
distinguished (file count, byte budget, wall-clock deadline, depth), each with advice that
fits: the deadline one says retry, the byte one says raise the budget rather than trim a
compliant package.

## Profiles

`PROFILE` at the top of `validation.js` sets the default (`upload`); a task may override it with
a `validationProfile` form field.

| Profile | Behaviour |
|---|---|
| `upload` | Admission. Structural breaks fail; quality gaps are `ADVISORY` warnings. |
| `audit` | Same checks, quality gaps become blocking errors. |
| `delivery` | `audit` plus `T0.delivery-evaluations-missing`: a delivery package must carry an `evaluations/` tree. Every package seen so far is `task-only`, so `delivery` fails them all on this one finding. |

The profile only moves the remaining `T0`/`T1` codes, which are now all **task.toml** and
**README** rules (plus `T1.folder-name-style`, `T1.checksum-orphan`). Every package-shape rule —
folder contracts, junk, the verifier wiring, the instruction ending, math delimiters — is a
`hard()` error in every profile: the gate passes only the ideal structure.

## The task-root contract

**The linked folder must contain exactly these entries and nothing else:**

```
environment/     required
tests/           required
solution/        required
task.toml        required
instruction.md   required
README.md        optional
```

Checked against the **linked** root, not wherever a `task.toml` turns up. That distinction is
what catches a parent folder being linked instead of the task folder — the 380090 failure mode,
where the linked folder held four copies of the task and 1217 files.

Every root finding ends with the full contract sentence, built from the constants so it cannot
drift from what is enforced, because a labeler reading one needs the whole shape rather than
just the part they got wrong.

> **`authoring/` is rejected — decided.** Upstream Harbor treats it as a valid optional folder,
> but authoring notes and evidence do not ship with this benchmark's tasks. It is rejected at
> the root and, through the folder contracts below, at any depth inside `environment/`,
> `solution/` and `tests/` (379987 ships `tests/authoring/`).

## The folder contracts

`DIR_CONTRACT` in `validation.js` is an allowlist for each task subfolder:

| Folder | Must contain | Any other file must be |
|---|---|---|
| `environment/` | `Dockerfile` | anything (it is the agent's input), as long as it is not junk or `authoring/` |
| `solution/` | `solve.sh` | code or data |
| `tests/` | `Dockerfile`, `test.sh`, and at least one `test_*.py` | code or data |

*Code* is `CODE_SUFFIXES` (`.py .sh .r .jl .c .h .cpp .hpp .f .f90 .m`); *data* is
`CONTRACT_DATA_SUFFIXES` (`.csv .tsv .json .jsonl .ndjson .npy .npz .parquet .parq .h5 .hdf5 .fits
.pkl .txt .dat .nc .mat .xyz .pdb .cif .fasta .fa .fastq .vcf .sdf .mol2 .gz .wav .flac`; the audio
formats were added for frequency and signal tasks that grade against recordings). Extend those
lists when a task genuinely needs another format. Subfolders are allowed (379987 keeps its
held-out cases in `tests/hidden/`); `.md` notes, logs, notebooks, `SHA256SUMS` and the like are
not.

`test_outputs.py` is **not** required by name. Harbor only requires `tests/test.sh` writing
`/logs/verifier/reward.txt`; this benchmark grades with pytest, so the contract requires *a*
`test_*.py` (379987 uses `test_tt.py`).

`environment/Dockerfile`, `solve.sh` and `test.sh` keep their own pointed "missing" messages;
the contract only allowlists them. `tests/Dockerfile` is reported missing by the contract unless
`environment_mode = "separate"` already reported it.

## Check families

Always blocking (`hard`), in every profile, unless marked.

### A — transport

`ratings.task` present · it is a Drive **folder** link (says so explicitly when it is a *file*
link) · the folder reads · it holds ≥1 readable file · `meta.truncated` is false · the sandbox
has `fetchDriveData` at all. Unreadable entries **block**, grouped by reason — Google
Workspace files (which need exporting) separately from genuinely unreadable ones. A file the
gate could not read is a file it cannot vouch for.

### B — discovery

Some `task.toml` exists · no package nested inside another (a copy under
`<task>/environment/` is a legitimate build-time mirror) · folder identities are unique.

### C — structure

`task.toml` present, non-empty, parses, has `[task] name` · `solution/`, `tests/`,
`environment/` each hold ≥1 non-empty, non-cache file · `instruction.md` present and non-empty
· `environment/Dockerfile` present.

The last two **block**. They were warnings when nothing depended on this gate; as a pre-oracle
gate they must block, or the run is paid for and dies on a missing file.

| Advisory | Rule |
|---|---|
| `T1.folder-name-style` | subfolder packages: kebab-case, ≤3 words |
| `T1.task-name-mismatch` | `[task] name` is `terminal-bench-science/<folder name>` |

### D — grader and oracle entry points

`tests/test.sh` and `solution/solve.sh` present and non-empty · `tests/Dockerfile` present when
`[verifier] environment_mode = "separate"`.

### I — module drift

A module shipped to **both** `tests/` and `solution/` must be byte-identical, at every depth.
Drift means the oracle and the grader no longer share their arithmetic. (379988 ships
`kitf.py` to both; 817 checks the same idea against `environment/_app`.) Only code files
(`CODE_SUFFIXES`) are compared: two `requirements.txt` files legitimately differ.

### L — leakage into the agent's tree

| Rule | Tier |
|---|---|
| `environment/Dockerfile` must not `COPY` from `solution/`, `tests/` or outside the context | error |
| A data file in both `environment/` and `tests/` must hold identical content | error |
| An answer-shaped name present in **both** `environment/` and `tests/` | error |
| An answer-shaped name (`expected*`, `truth*`, `labels*`, `answers*`, …) under `environment/` at all | error |

The data comparison matches by **file name**, not full path, on purpose: 380056 ships
`environment/data/problem.json` and its grader copy `tests/problem.json`, and a path comparison
would never pair them. Two unrelated files that share a name must be renamed.

The answer-shaped rule is a name heuristic, so an ML task that ships `labels.csv` as genuine
agent input must rename it. That is the price of passing only the ideal structure.

### R — runnability

`solve.sh` and `test.sh` reference only files that are in the package · every Dockerfile `COPY`
source exists. A hand-assembled folder's commonest defect is a file nobody dragged in, and both
break the run before it starts. A referenced folder (`/tests/hidden/`) resolves to the folder;
a glob or variable (`/tests/hidden/*.json`, `/tests/$name`) is not resolvable here and is skipped.
`solve.sh` must start with a shebang.

Line endings are checked on the same grounds. A `.sh` file, or any file whose first line is a
shebang, must not carry CRLF:

| Rule | Tier |
|---|---|
| CRLF on the shebang line (line 1) | error |
| CRLF anywhere inside a `.sh` file | error |

The shebang case is fatal and silent — the kernel takes the whole first line as the interpreter
path, so `#!/bin/bash\r` asks for a binary that does not exist and the task fails with `bad
interpreter: No such file or directory` before a command runs. In a body, each `\r` stays part
of the command and corrupts quoting, variable values and path arguments. CRLF in files Linux
does not execute (`.py` imported as a module, `.md`, `.json`) is harmless and is not reported.

### V — the verifier can build and will score

The verifier must be wired the canonical way. Each of these was a "please review" warning; a
package spelled differently now fails instead of being left for a reviewer.

| Rule | Tier |
|---|---|
| Every `pip install` in `environment/Dockerfile` and `tests/Dockerfile` is `==`-pinned, no ranges or wildcards. Only the pip command's own words are packages: a `RUN` line is split at `&&`, `\|\|`, `;` and `\|`, so `pip install numpy==2.1.3 && chmod 700 /logs/verifier` is pinned, and a second `pip install` later on the line is checked too | error |
| `tests/Dockerfile` installs `pytest==8.4.1` and `pytest-json-ctrf==0.3.5` | error |
| `tests/Dockerfile` does `COPY . /tests/` | error |
| `tests/Dockerfile` creates `/logs/verifier` and the parent folder of every artifact (`mkdir`, `WORKDIR` or `COPY` destination) | error |
| `tests/test.sh` enables `errexit`, `nounset` and `pipefail` (`set -euo pipefail`) | error (warning at task completion) |
| `tests/test.sh` runs pytest with `-rA` and `--ctrf /logs/verifier/ctrf.json`. The path may be built from a variable the script assigns (`LOG_DIR=/logs/verifier` … `--ctrf "$LOG_DIR/ctrf.json"`, or `${VAR:-/logs/verifier}`) | error |
| `--ctrf` resolves to a path other than `/logs/verifier/ctrf.json` and the script never publishes it there. Writing the report to a private folder while submitted code runs and then `cp`/`mv`/`install`-ing it to `/logs/verifier/ctrf.json` (or into `/logs/verifier/`) counts as writing it there | error |
| `--ctrf` goes through a variable the script never assigns, so the path cannot be confirmed | advisory |
| `tests/test.sh` writes a literal `0` or `1` to `/logs/verifier/reward.txt` | error (warning at task completion) |
| Any literal reward write under `tests/` other than `0` or `1` | error |
| Nothing under `tests/` installs or downloads software (`pip`, `apt`, `conda`, `npm`, `uv run --with`, `curl \| sh`) — the verifier has no network | error |
| Every `test_*.py` together define at least one `def test_...()` | error |
| `T1.verifier-mode` — `environment_mode = "separate"` declared (a task.toml rule) | advisory |

Artifacts: declared at the **top level** of `task.toml` (under `[verifier]` is an error — no
output transfers and every run scores 0), non-empty, and absolute container paths.

### X — cross-file agreement

Its number equals `[agent] timeout_sec` (error if they disagree) · every declared artifact is
named in `instruction.md` (error) — a verifier reading a file the instruction never asked for
grades work nobody requested.

| Rule | Tier |
|---|---|
| `instruction.md` **ends** with `You have X seconds to complete this task. Do not cheat by using online solutions or hints specific to this task.` (only trailing whitespace may follow) | error |

### M — math delimiters

In `instruction.md` and `README.md`: math is written as `$...$` (inline) or `$$...$$` (display)
— no `\( \)`, `\[ \]`, bare `\begin{...}`, ```` ```math ```` fences, or LaTeX commands outside
delimiters, and a literal dollar is `\$`. **Error.**

In `instruction.md` only (`MATH_SPACED_FILES`), every delimiter also needs whitespace on its
inner side: `$ x $` and `$$ x $$` pass, `$x$` and `$$x$$` fail. A newline counts, so `$$` on its
own line passes. A LaTeX spacing command is not whitespace: 380056 line 24 ends an equation with
`\,$` and fails. `README.md` is deliberately left on the plain rule.

### P — provenance and hygiene

| Rule | Tier |
|---|---|
| Any `harbor-canary` marker anywhere in the package — canaries are **forbidden** | error |
| Two versions of one file under a numbered name, **differing** | error |
| Duplicate copies under a numbered name, identical | error |
| A numbered name with no original beside it | error |
| Junk anywhere: `.DS_Store`, `.git`, `__pycache__`/`*.pyc`, `.venv`, `node_modules`, `.ipynb_checkpoints`, `.idea`, `.vscode`, … | error |
| No hard-coded secret: key-shaped literals (AWS, GitHub, Hugging Face, `sk-`), private keys, credentials in URLs, or a literal assigned to a secret-named variable | error |
| `T1.checksum-orphan` — `SHA256SUMS` lists a file that is not there (only reachable in `environment/`; the contract rejects it elsewhere) | advisory |
| `T1.readme-missing` / `T1.readme-sections` — README is optional and stays advisory | advisory |

**Secret names** match whole underscore-separated parts — `TOKEN`, `SECRET`, `PASSWORD`,
`API_KEY`, `ACCESS_KEY`, `PRIVATE_KEY`, `CLIENT_SECRET` — so `HF_TOKEN` and `OPENAI_API_KEY`
match while `tokens`, `max_tokens`, `HF_HOME` and `AWS_REGION` do not. An unquoted value counts
only when it looks like a key (8+ key characters including a digit), so `token = tokens[0]` is
code, not a secret.

**Duplicate names.** Drive permits two files with one name in a folder. They arrive numbered —
`task (2).toml` from run-checks-api's reader (`folder-loader.ts` `uniquePath`), or
`task(1).toml` from a downloaded copy re-uploaded. Both spellings are matched. Differing copies
are reported separately from identical ones, because differing means the package carries two
versions of its own definition and nothing says which is authoritative. 380196 has 11 such
files, four of them differing — including two different `instruction.md` (7070 vs 5038 bytes).

### task.toml

There are two task.toml structures, told apart by the `[task] name` prefix alone.
`schema_version` cannot separate them: old-structure packages already say `"1.4"`.

| | **New** (schema 1.4) | **Old** |
|---|---|---|
| `[task] name` | `turing/<task>` | anything else, e.g. `terminal-bench-science/<task>` |
| `[metadata]` | `domain`, `category`, `subcategory`, `reward_type`, `source`, `public_overlap` | `domain`, `field`, `subfield`, `expert_time_estimate_hours` (+ author fields) |
| Accepted by this pipeline | **yes** | **no:** one error, "uses the old structure" |
| Accepted at task completion | yes | **no:** the same "uses the old structure" error |

`ACCEPTED_TOML_SCHEMAS = ['new']` at the top of `validation.js` is the switch, and the
task-completion gate uses it unchanged, so an old-structure package fails at both. A pre-switch
hybrid such as 381552 (schema `"1.3"`, new-style `[metadata]` under a `terminal-bench-science/`
name) is **old** and fails too: rename it to `turing/<task>` and finish the template.

#### New structure — every gap blocks, listed in one error

The template:

```toml
schema_version = "1.4"
artifacts = ["/app/solve.py"]

[task]
name = "turing/<task>"          # kebab-case
description = "…"
version = "1.0.0"
keywords = ["…"]

[metadata]
domain = "physical-sciences"    # a domain from DOMAIN_FIELDS
category = "chemistry"          # one of that domain's categories
subcategory = "…"               # free text, e.g. "spectroscopy"
reward_type = "binary"
source = "…"
public_overlap = "…"

[environment]
network_mode = "public"
cpus = 1
memory_mb = 2048
storage_mb = 10240

[agent]
timeout_sec = 18000.0           # at most 18000
network_mode = "public"

[verifier]
timeout_sec = 5400.0
network_mode = "no-network"
environment_mode = "separate"

[verifier.environment]
network_mode = "no-network"
cpus = 1
memory_mb = 2048
```

The `[metadata]` vocabulary:

| `domain` | `category` |
|---|---|
| `life-sciences` | `biology`, `ecology`, `medicine`, `neuroscience` |
| `physical-sciences` | `astronomy`, `chemistry`, `materials-science`, `physics` |
| `earth-sciences` | `atmospheric-sciences`, `environmental-sciences`, `geosciences`, `ocean-sciences` |
| `mathematical-sciences` | `applied-mathematics`, `formal-mathematics`, `operations-research`, `statistics` |
| `engineering-sciences` | `chemical-engineering`, `civil-engineering`, `electrical-engineering`, `mechanical-engineering` |

`subcategory` is a free-form string. The new `domain`/`category`/`subcategory` keys are the old
`domain`/`field`/`subfield`, renamed, with the same values. Two drafts recur, and the error's
Fix names the exact edit instead of repeating the template:

- the old `field`/`subfield` keys under a `turing/` name → "rename field to category and rename
  subfield to subcategory";
- the domain written into `category`, with no `domain` key → "set domain = …, category = … and
  subcategory = the free-text specialty".

When other gaps remain, the Fix adds "then match the template: …".

`checkNewToml` checks every field shown, by type or exact value. It also enforces
`validate_env = "modal"` when `gpus >= 1`, and the absence of the retired `*_explanation`
fields. All gaps go into **one** error, `task.toml does not match the schema 1.4 structure: …`,
so the author fixes the file in one pass. `T1.verifier-mode` is not raised for a new-structure
package, since the template already requires `environment_mode = "separate"`.

#### Old structure — currently applied nowhere

Kept so a gate can re-admit old packages by adding `'old'` to `ACCEPTED_TOML_SCHEMAS`. No
pipeline does today.

| Code | Rule | Tier |
|---|---|---|
| `T0.metadata-missing` | `domain`, `field`, `subfield`, `expert_time_estimate_hours` | profile-gated |
| `T0.network-mode-undeclared` | `network_mode` declared in both env blocks | profile-gated |
| `T1.metadata-vocabulary` | `domain`/`field` from the benchmark's vocabulary | advisory |
| `T1.task-block-incomplete` | `[task] description` and `keywords` | advisory |
| `T1.retired-fields` | `*_explanation` fields moved to README | advisory |
| `T1.agent-timeout` | `[agent] timeout_sec` ≤ 18000 | advisory |
| `T1.network-mode-value` | `[environment] network_mode` is `public` | advisory |
| `T1.gpu-backend` | `gpus >= 1` requires `validate_env = "modal"` | advisory |
| — | `[verifier.environment] network_mode = "public"` | **error** |

That last one is an integrity break, not a style gap: egress on the verifier phase lets the
submission phone out and lets the verifier reach a hosted answer key.

## Checks deliberately NOT implemented

Each was removed after a real package proved it wrong. Recorded so they are not re-added.

| Check | Why it is gone |
|---|---|
| Artifact-named file under `environment/` | TB-Science tasks legitimately ship a **starter scaffold** at the artifact path, with the instruction telling the agent to complete it. Telling a scaffold from a precomputed answer needs the file to be *run* — undecidable here. Belongs to the oracle/nop stage, which answers it exactly. |
| `T1.artifact-in-package` (artifact name anywhere else) | `solution/` is mounted only into the oracle container; `tests/` only into the verifier image; `authoring/` and the root never. None can leak. 380030's oracle is literally `cp /solution/response.py /root/results/response.py` — the collision is structurally required. |
| `T1.artifact-dirs-uncreated` (as an advisory on `environment/`) | `mkdir -p /app/data` already creates `/app`, as does `WORKDIR /app`, as can the base image. Note the strict gate *does* require `tests/Dockerfile` to create each artifact's parent folder explicitly (§V) — deliberately, as part of the canonical shape. |
| "Please review" warnings: reward control flow, possible LLM-judge calls, relative script calls / heredocs in `solve.sh` | None of them can be decided without running the task, and a warning nobody can act on is noise. Removed. |
| `T1.metadata-authorship` | Author and disclosure details are not gated here. |
| `[task] authors` | Same. Upstream `check-task-fields` still enforces it at PR time, where an empty list publishes the task crediting nobody. |
| Spec/verifier agreement (`spec.json` ↔ `reference.json`) | Specific to one task's contract, not universal across the benchmark. |
| Symlinks, file modes | A Drive folder read carries neither. Shortcuts are followed by the fetcher; a shortcut cycle arrives in `meta.skipped`. |
| Anything needing execution | The image builds, the oracle scores 1, nop scores 0, wrong answers score 0, reformatted correct answers still score 1. Stated in `infos` on every run. |

## Divergences from 817

1. **Grader spec paths.** 817 looks for `tests/verifier.json` / `tests/manifest.json` /
   `verifier.json`. This benchmark has none — it grades through `tests/test.sh`. Porting 817's
   rule unchanged would fail every valid task.
2. **The mirror check.** 817 compares `environment/_app` against the task root. These packages
   have no `_app`; the real duplication is a module shipped to both `tests/` and `solution/`.
3. **The evaluations audit is not ported.** 817's per-axis machinery (`T0.solvability`,
   `T0.difficulty-*`, `T2.difficulty-score`, `T0.stability-*`, `T0.platform-*`,
   `T0.root-missing`/`-extra`, `T0.certificate-*`) reads an `evaluations/` tree and a finalized
   package root. **No package here carries either** — all are `task-only`. Adding them later is
   additive: port them from 817 and call them from `validateTask` under
   `pkg.isDir(at(task, 'evaluations'))`.
4. **New for 279:** the root contract, duplicate names, canary, leakage, runnability, verifier
   and cross-file families have no 817 equivalent. 817 validates Harbor *finalization*
   packages (the output of running trials); 279 validates *authoring* packages (the input).
5. **TOML is parsed by a subset reader** — tables, dotted keys, quoted/bare scalars, inline
   tables, single- and multi-line arrays, triple-quoted strings. Enough for every block used
   here, and it handles the real packages including multi-paragraph `relevant_experience` and
   `authors = [{ name = … }]`. Exotic TOML that `tomllib` accepts could be reported as
   unparseable.

## Testing

```bash
npm test -- labeling-eval/198-terminal-bench-science/task-data-validation-1128
npm run golden -- labeling-eval/198-terminal-bench-science/task-data-validation-1128
```

Mirror a real folder with:

```bash
node scripts/fetch-folder.mjs labeling-eval/198-terminal-bench-science/task-data-validation-1128 <folder-link>
```

Survey one **without** the reader's budgets, to diagnose a truncation:

```bash
node scripts/survey-folder.mjs <folder-link>
```

**The fixture suite (74 cases).** `fixtures/make-folders.mjs` builds `COMPLETE`, a synthetic
package in exactly the ideal structure (with a schema 1.4 task.toml), which must pass at `upload` and `audit` with **no errors
and no warnings**. Every other fixture folder is `COMPLETE` with one defect, so each case pins
one rule. The near-miss cases (`OTHERTESTNAME`, `SECRETNAMESOK`, `GLOBREF`, `READMEMATH`,
`NOREADME`) pin what must stay quiet. `OLDTOML`, `OLDNOMETADATA`, `OLDVERIFIERPUBLIC` and
`HYBRIDTOML` carry the old task.toml structure: this pipeline rejects them, and the task-completion
suite (which shares these folders) checks that it rejects them too. After changing a rule, change the generator, re-run it,
then `npm test`. When writing a mutation with `String.replace`, pass a function as the
replacement whenever it contains `$$` — in a replacement *string* `$$` means one literal `$`.

**Verification performed.** The fixture suite passes 74/74. The real packages under
`golden/folders/` were run against the strict gate. Since the schema 1.4 switch, all four
(1961550, 379987, 380056, 381552) are old-structure: rejected here and at completion. Every finding was traced to the package
itself, and each false positive found that way (`-rA;` before a `;`) was fixed in the script.

> **CRLF warning for anyone writing tests here.** 380030 and 380196 use CRLF line endings.
> JavaScript's `.` does not match `\r`, so a mutation regex like `/^foo = .*\n/m` silently does
> nothing and the test reports a false "silent". Use `\r?\n`. The validation script itself is
> CRLF-safe — it splits on `/\r?\n/` throughout — but two test harnesses were wrong this way
> before it was caught.

## Open questions before deploying

1. **Which profile should this project gate on?** All packages are task-only, so `delivery`
   fails them. `upload` and `audit` both work; they differ only on the task.toml and README
   advisories, since every package-shape rule blocks in both.
2. **Does labeling-eval's `run-checks-api` have `fetchDriveData`?** It arrived in the 2026-09-21
   rewrite. The script fails with an actionable message if not, but confirm before a batch.

Settled: `authoring/` is rejected everywhere; canaries are forbidden; pytest is mandatory, so
its pins are required unconditionally; junk such as `.DS_Store` blocks in every profile.

**Expect real packages to fail until their authors adjust.** Against the strict gate,
1961550 fails on `authoring/`, canaries, a missing shebang and a non-pytest verifier; 379987 on
`tests/authoring/` and a `.DS_Store`; 380056 on one unspaced math delimiter.
