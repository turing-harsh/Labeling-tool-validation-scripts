# Requirements — labeling-g / 0824 Continuity (en-US) - Turing Duplicate

- **Project ID:** 939
- **Instance:** labeling-g · **Language:** en-US
- **Tool URL:** https://labeling-g.turing.com/projects/939/view/quality
- **Status:** draft (no validation script deployed yet)

> This spec is the contract the `validation.js` for 939 must enforce. It is organized by the
> **F1–F7 taxonomy** (35 error classes, 14 warning classes + a declared-unverifiable set).
> Each rule lists **severity**, **fires when**, and **message intent**. Every rule here should
> get at least one case in `fixtures/cases.json` once the script exists.
>
> **Execution contract:** `async function validate(conversationData)`; push to `errors[]`
> (fails the task), `warnings[]`, `infos[]`, `successes[]`, `logs[]`. PASS = `errors.length === 0`.
> See [docs/CONVENTIONS.md](../../../../docs/CONVENTIONS.md).

---

## 0. Project-specific config (resolved from golden task 1260592)

- [x] **Field-key inventory** — resolved. Task-level: `setupCheck`, `privacyGate`, `prompt`,
      `conversationalGoal`, `personalizationExpectation`, `firstModel`, `targetLanguage`,
      `dialect`, `qualityComparisonSxS`(+`Rationale`), `bp1`/`bp2`/`preQuestionsBreakpoint`.
      Per-side under `compareModels.<ns>.`: `numberOfTurns`, `secondModelLock`,
      `model1PersonalizationTriggering` (Q1), `model1HtmlFileUpload`, `testResponse<N>DebugInfo`,
      `testModelOverallQuality`, `testModelOverallPersonalizationQuality`,
      `testModelOverallQualityRationale`, 10 rubric heads, and `MissedContext`/
      `OverPersonalization`/`PersonalDataErrors` `Category`/`Turns`(+`Detraction`) children.
- [x] **Model pair** — Model A = `Mode 23 -> Ramen (top-20) - Fast`, Model B =
      `Mode 23 -> Prod Frozen - Fast` (bound via csv `Model A`/`Model B`).
- [x] **Artifact protocol** — **debug-as-Drive-link**: debug slots and HTML hold Drive file
      links; batch-destination folders come in `input`. F3 link protocol applies; F4 content
      anchoring is fetch-based (runs in the tool; self-skips locally).
- [x] **Enum option sets** — RESOLVED. All option sets, field visibility (displayCondition), and
      required-ness now come from `config/form-spec-3778.json` (derived from the real review-criteria
      config 3778) and drive the validator. This removed the false positives from guessed enum sets,
      per-field `N/A` label variants (e.g. `MissedContext` uses `"N/A - No personalization needed"`),
      and requiring rubric fields that are hidden when the response is "Not Personalized".
- [x] **Turn bounds** — 1–5 enforced.
- [ ] **Verified Model-ID table** — still pending; **F5 identity stays dormant** until filled.
- [ ] **"Continuity"-specific rules** — none identified yet beyond F1–F7 + the inherited 903
      criteria; confirm from the 939 project doc.

## 0b. Inherited 903 criteria (this project = duplicate of 903)

939 is a duplicate spun off from **903** and must ALSO verify 903's `v3.2.32` criteria. The
deployable `validation.js` is **generated** (`node scripts/build-939.mjs`) by composing
`parts/continuity-checks.js` (F1–F7) with **903's script embedded verbatim** (as `validate903`).
So 939 additionally enforces, on the fetched debug/HTML: content anchoring (Check A/B/C),
Model-ID identity, footprints delta, byte-identical detection, cross-conversation checks,
LM-prefix completeness, full-share/`sian_profile`, and the HTML prompt/identity/coverage
pipeline. Do not hand-edit `validation.js`; edit a source and rebuild.

---

## F1 — Completeness (errors)

| ID | Severity | Fires when | Message intent |
|----|----------|-----------|----------------|
| F1-E1 | error → **lead** | Form answers not locatable in the payload | Route to lead (not rater); payload/schema problem, not a rater mistake |
| F1-E2 | error (abort) | Per-side namespace unbindable — **both** sides | Abort with a **key inventory** of what was seen so the config can be fixed |
| F1-E3 | error | Per-side namespace unbindable — **one** side | Name the unbindable side |
| F1-E4 | error | Task-level required empty: `setupCheck` | Complete the setup-check field |
| F1-E5 | error | `targetLanguage` empty | Required |
| F1-E6 | error | `dialect` empty | Required |
| F1-E7 | error | `prompt` empty | Paste the Turn-1 user prompt |
| F1-E8 | error | `conversationalGoal` empty | Required |
| F1-E9 | error | `personalizationExpectation` empty | Required |
| F1-E10 | error | `firstModel` empty | Select the first model |
| F1-E11 | error | `qualityComparisonSxS` empty | Select the SxS winner |
| F1-E12 | error | `qualityComparisonSxS` rationale empty | Enter the SxS rationale |
| F1-E13 | error | `privacyGate` empty | Complete the privacy gate |
| F1-E14 | error | Turn count missing **or outside 1–5** | Enter a turn count in range 1–5 |
| F1-E15 | error | Q1 triggering field empty | Answer the Q1 triggering question |
| F1-E16 | error | `7a` / `7b` / `7c` empty (per side) | Fill each per-side sub-answer |
| F1-E17 | error | `secondModelLock` unticked | Tick the second-model lock before submitting |
| F1-E18 | error | HTML link empty (per side) | Paste the exported conversation HTML link |

> **Note vs delivered 0804 script:** in `v3.2.32`, only F1-E7/E11/E12/E14(partial)/E18 existed.
> E1–E6, E8–E10, E13, E15–E17 and the 1–5 range half of E14 were **not verified** — implement all here.

## F2 — Gate cascades, both directions (errors)

| ID | Severity | Fires when | Message intent |
|----|----------|-----------|----------------|
| F2-E1 | error | Debug slot **visible but empty** (within declared turn range) | Paste the missing debug, or correct the turn count |
| F2-E2 | error | Debug slot **hidden but filled** (stale beyond declared range) | Reveal & clear the stale slot, then restore the count |
| F2-E3 | error | Rubric head **required under a Personalized Q1** but empty | Fill the rubric head |
| F2-E4 | error | Rubric head **filled under "Not Personalized"** | Clear the rubric head — it shouldn't apply |
| F2-E5 | error | Child field (Category / Turns / Detraction) **required on Minor-Major** but empty | Fill the child field |
| F2-E6 | error | Child field **filled while the parent isn't** Minor-Major | Clear the child field |

## F3 — Artifact integrity (the link protocol)

Applied **identically to all debug slots and the HTML field, per side**.

| ID | Severity | Fires when | Message intent |
|----|----------|-----------|----------------|
| F3-E1 | error | Field holds **neither a link nor debug output** | Provide the Drive link (or debug, per protocol) |
| F3-E2 | error | **More than one link** in the field | One artifact per field |
| F3-E3 | error | **Link plus stray text** | Field must contain only the link |
| F3-E4 | error | A **folder instead of the file** (extra evidence when it's the batch-destination folder pasted unchanged) | Link the specific file, not the folder |
| F3-E5 | error | **Binary container** (e.g., `.docx`/zip) | Export as plain-text `.txt` |
| F3-E6 | error | **Long blob with zero parseable user blocks** | Re-capture the full debug |
| F3-E7 | error | Same Drive file id reused **across two turns** | Each turn its own export |
| F3-E8 | error | Same Drive file id reused **across the two sides** | Each side its own export |
| F3-E9 | error | Same Drive file id reused **between HTML and debug** | Debug field must link the debug text, not the page |
| F3-W1 | warning | **Non-Drive host** | Prefer the shared Drive; confirm access |

## F4 — Content anchoring (paste mode only; **self-skips loudly under links**)

| ID | Severity | Fires when | Message intent |
|----|----------|-----------|----------------|
| F4-E1 | error | **Check A** — first user block ≠ form prompt | Debug and prompt are from different conversations |
| F4-E2 | error | **Check C** — turn N missing turn N-1's newest message | Turn N is from a different conversation |
| F4-E3 | error | Byte-identical captures **within a side** | Re-copy the actual turn's debug |
| F4-E4 | error | Byte-identical captures **across sides** | One side holds the other's debug |
| F4-W1 | warning | **Check B** — turn N repeats the Turn-1 prompt | Later turns must introduce a new follow-up |
| F4-W2 | warning | Contamination — Turn 1 holds multiple distinct user messages | Clear prior chat before Turn 1 |
| F4-W3 | warning | Branch-shape relief — prompt present but not first | Expected for branch tasks; confirm |

> The whole family must **self-skip with a log line** when a slot was resolved from a link
> (so link tasks don't get spurious paste-mode findings). In the delivered 0804 script this
> was not the design (it ran content checks on fetched text) and F4-E4 was absent — fix here.

## F5 — Identity (warnings)

Dormant until the **verified Model-ID table** (§0) is filled.

| ID | Severity | Fires when | Message intent |
|----|----------|-----------|----------------|
| F5-W1 | warning | Multiple Model IDs in one capture | Mixed models in one paste |
| F5-W2 | warning | Both sides reporting the **same** Model ID | One slot holds the other model |
| F5-W3 | warning | Observed ID **outside the verified table** | Report to POC; possible new variant |

## F6 — Coherence matrices

| ID | Severity | Fires when | Message intent |
|----|----------|-----------|----------------|
| F6-E1 | error | Enum value **not a configured option**, with canonical-variant diagnosis | Pick a valid option (suggest the near-match) |
| F6-E2 | error | Q1 contradiction — "Not Personalized" **plus** a Personalized option | Resolve the contradictory Q1 answer |
| F6-E3 | error | Cited turns **exceed the declared count** | Cite only turns that exist |
| F6-W1 | warning | Turns mixing "N/A" with numbers | Use either N/A or turn numbers, not both |
| F6-W2 | warning | "N/A" alone under Minor-Major | Minor-Major needs cited turns |
| F6-W3 | warning | Rationale cites **no turns** when issues are flagged | Cite the turns behind the issue |
| F6-W4 | warning | Rationale cites a turn **beyond the count** | Fix the citation |
| F6-W5 | warning | **N1** — dissatisfied rating without a full share | Provide the full debug for diagnosis |

## F7 — Batch metadata

| ID | Severity | Fires when | Message intent |
|----|----------|-----------|----------------|
| F7-W1 | warning | `firstModel` contradicts the assigned First Model (arrow-canonicalized); **self-skips loudly if the metadata root is absent** | Select the assigned first model / rerun in that order |

---

## Declared unverifiable (logged, never a finding)

Things the script should **note in `logs[]`** but never flag — no payload signal to decide them:
- (to enumerate from the 939 doc — e.g., subjective quality judgments, off-payload setup steps,
  anything requiring opening the live task that the validator cannot see.)

---

## Severity philosophy

- **error** = blocks submission (must be a defect the payload proves).
- **warning** = surfaced for the rater/QA but never blocks; use when the payload is suggestive
  but not conclusive (identity drift, shape hints, coherence smells).
- Prefer **warning over error** when a legitimate task could trip the rule — the delivered 0804
  script over-escalated several F4/F5 checks to errors; keep those as warnings here.

## Test coverage expectation

`fixtures/cases.json` must include, per class: one **passing** case and one **failing** case
that exercises exactly that rule, plus the known real-task edge cases once 939 batches exist.

## Change notes

- 2026-08-28 — initial requirements, designed on the F1–F7 taxonomy; project-specific config (§0) pending.
