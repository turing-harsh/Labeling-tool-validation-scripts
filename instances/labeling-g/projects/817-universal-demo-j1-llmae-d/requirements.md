# Requirements — labeling-g / 817-universal-demo-j1-llmae-d

Deterministic validation of the Harbor task package linked in `ratings.taskFolder` (a signed
GCS ZIP URL). This is a port of [`reference/deterministic_task_validation.py`](reference/deterministic_task_validation.py),
which is itself the offline subset of `infra/harbor_gce/validate_tasks.py`. No semantic/LLM
review, by design.

## Profiles

`PROFILE` at the top of `validation.js` sets the default (`upload`). A task may override it by
carrying a `validationProfile` form field with `upload`, `audit` or `delivery`.

| Profile | Behaviour |
|---|---|
| `upload` | Admission checks. Structural breaks fail; package-quality gaps are `ADVISORY` warnings. |
| `audit` | Same checks, package-quality gaps become blocking errors. |
| `delivery` | `audit` plus the `evaluations/platform` contract. |

## Always blocking (structural)

| Rule | Message |
|---|---|
| Some `task.toml` must exist in the ZIP | no task package found |
| One package must not sit inside another (a copy under `<task>/environment/` is a legitimate mirror) | this task package sits inside another package |
| Task folder names must be unique | duplicate task folder identity |
| Folder name matches `^[A-Za-z0-9][A-Za-z0-9._-]*$` | folder name is not a safe path segment |
| `task.toml` present, non-empty, parses, has `[task] name` | task.toml missing or empty / does not parse / has no `[task]` name |
| `solution/`, `tests/`, `environment/` exist and hold ≥1 non-empty, non-cache file | `<dir>/` missing / holds no content |
| A grader spec exists: `tests/verifier.json`, `tests/manifest.json` or `verifier.json` | no grader spec |
| `environment/_app` agrees with the task root on graded paths (`task.toml`, `instruction.md`, `tests/**`) | environment/_app mirror disagrees … |
| `environment/_app` carrying `tests/` also carries the spec | environment/_app carries tests/ but not … |
| `evaluations` is a directory when present | evaluations must be a directory when present |

Warnings (never blocking, any profile): `instruction.md` missing, `environment/Dockerfile` missing.

## Profile-gated findings

| Code | Rule |
|---|---|
| `T0.evaluation-json` | every `.json` under `evaluations/` parses |
| `T0.evaluation-reward` | every canonical run (solvability/difficulty/stability) has a readable reward |
| `T0.root-missing` / `T0.root-extra` | final package root holds exactly the agreed entries (extras allowed: `README.md`, `golden_trajectory.json`) |
| `T0.evaluation-axis-missing` | `evaluations/{solvability,difficulty,stability,platform}` all present |
| `T0.certificate-missing` / `T0.certificate-invalid` | `qc_report.html` embeds a QC certificate carrying `schema`, `task`, `profile`, `status`, `release_eligible`, `package_digest` |
| `T0.solvability` | exactly one reward-1.0 non-Oracle run with a saved trajectory |
| `T0.difficulty-count` | four or five difficulty trials |
| `T0.difficulty-trials` | each trial: readable reward, saved trajectory, non-Oracle, agent+model+environment provenance, GLM-5.2 |
| `T2.difficulty-score` | at most 2 of the first 4 difficulty trials may pass |
| `T0.stability-count` | at least three frozen-answer regrades |
| `T0.stability-reward` / `-identity` / `-config` / `-lock` | the regrades agree on reward, frozen trajectory, `config.json` and `lock.json` |
| `T0.platform-*` (delivery) | `e2b/{oracle,codex}` and `modal/{oracle,run}`: exactly one run each, readable reward, Oracle reward 1.0, trajectory + `sanity_check.md` for the non-Oracle roles |
| `T0.delivery-evaluations-missing` | a delivery package has `evaluations/` |

Reward lookup order matches the Python `_reward`: `verifier/reward.json`, `verifier/reward.txt`,
`verifier/verifier_summary.json`, `reward.json`, `result.json` — reading `reward`,
`verifier_result.rewards.reward`, then `verification_summary.weighted_pass_rate`.
A run directory is a *terminal* directory holding `result.json` (Harbor job directories above
one are not trials), same as `_trial_dirs`.

## Deliberate divergences from the Python

1. **sha256 → content comparison.** There is no `crypto` in the isolate, so the stability
   identity checks compare the artifacts themselves (key-order-independent for parsed JSON).
   Equality is what the hashes were testing, so this is at least as strict.
2. **Symlinks are not checked.** `package contains symbolic links` cannot be reproduced: the
   ZIP's external attributes do not survive `fetchDataFromGcsZip`. The script says so in
   `infos` on every run.
3. **TOML is parsed by a subset reader** (tables, dotted keys, quoted/bare scalars, arrays) —
   enough for `[task] name` and `metadata.mcp_servers_extended`. Exotic TOML that `tomllib`
   accepts could be reported as unparseable.
4. **Nesting is blocking in every profile.** The Python reports nested packages through its
   `nested` list and a non-zero exit rather than a per-task error; the script raises an error so
   the tool actually fails the task.

## Parity

`reference/parity.mjs` runs every fixture ZIP through both implementations in all three
profiles and prints any finding raised by only one of them:

```bash
node instances/labeling-g/projects/817-universal-demo-j1-llmae-d/reference/parity.mjs
```

Last run: 13 packages × 3 profiles, **0 mismatches**. The real batch-8647 package
(`golden/zips/e22a62e3-…zip`) also matches one-for-one: 14 findings at `upload` (PASS),
14 errors at `audit`, 18 at `delivery`.
