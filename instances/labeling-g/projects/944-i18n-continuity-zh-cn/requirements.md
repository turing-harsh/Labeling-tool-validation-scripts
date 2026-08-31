# Deterministic check requirements — i18n Continuity Quality E2E Eval (944)

**Purpose.** The generation contract for `i18n-continuity-validator-944`. Every check the script performs is specified here with its trigger, severity, non-fire conditions, rater-facing wording and anchor. A builder can emit the script from this file; a reviewer can audit the script against it. Where the two disagree, this file is wrong until updated — the script is never hand-edited away from it.

**Scope.** Layer L1 only (deterministic, computable from bytes). Semantic questions are listed in §10 and belong to the QD pack. Unverifiable items are declared in §11 and belong to nobody.

**Source of field truth.** `project-config-id-944` — 97 fields, 55 of them per side. Every key, enum value and gate condition below was generated from that export, not hand-typed.

---

## 1. Project shape

| | |
|---|---|
| Config id | 944 |
| Sides | 2, via `SIDE_BY_SIDE_COMPARISON` field `compareModels` |
| Model A | `07 Pizzi Gemelli --> Fast (paid) (prod default + notebook)` |
| Model B | `Pcontext Mode 23 (Nippon) > Ramen (top 20) - Fast` |
| Task types | Single Turn and Multi Turn, in one batch, on one form |
| Locales | 53 `targetLanguage` × 50 `dialect` options |
| Artifacts | Google Drive **links only** — debug, conversation HTML, thread HTML, Takeout |
| Per-side key shape | `compareModels.<model name>.<questionKey>` |
| Batch/input root | task-sheet columns: `Task Type`, `First Model`, `Conversation Track`, `Model A`, `Model B`, `Target Language`, `Dialect`, `Time Gap`, `Context Relevance`, `Prompt Explicitness` |

### 1.1 Namespace and spelling traps

- Model A's name contains `-->` (two hyphens, spaces either side). Model B's contains ` > ` and ends ` - Fast`. **Model B's name contains the same ` - ` separator the batch sheet uses between namespace and question key** — never parse a sheet column by splitting on ` - `; split per-side keys from the right, at the last `.`.
- Resolve model names by **exact canonical string only**. No substring, no prefix, no paren-stripping. No exact match → skip with a log.
- Namespaces are **discovered at runtime and logged in full** on every run. Never hardcode.
- Several enum values carry an em dash (`N/A — Cold Start`) or a curly apostrophe (`Doesn't Verify Stale Constraint`). Canonicalise dashes and quotes before comparison; never "correct" them in output.
- `internationalizationQuality` uses the **plural** forms `No Issues / Minor Issues / Major Issues` and plain `N/A`, while every other dimension uses singular and `N/A — Cold Start`. Per-field vocabularies, never one shared list.

---

## 2. Normalisation ladder

Applied in this fixed order by one shared function, used everywhere a comparison happens:

1. `NFC`
2. strip zero-width characters (`U+200B`–`U+200D`, `U+FEFF`)
3. curly quotes → straight
4. en/em/figure dashes → hyphen
5. collapse whitespace
6. trim

Then compare. For links, comparison is on the **extracted Drive file id**, never the raw string — `?usp=sharing` and `?usp=drive_link` are the same artifact.

---

## 3. Severity policy

> **Block** when the defect makes downstream validation meaningless or the data unusable, **and** the rater can fix it with certainty.
> **Warn** when the signal is probabilistic, the cause may be system-side, or the correct action depends on something only the rater knows.

Applied corollaries on this project:

- A prerequisite that silently disables other checks blocks (`turnType`, `numberOfTurns`, `numberOfThreadsAdded`).
- Exactly **one** satisfaction cell blocks (C-10), because it is the only one with a client sentence behind it. Everything softer warns.
- Assignment mismatches block only where the two sides state the same fact in the same vocabulary (`Task Type`, `Conversation Track`); language and first-model mismatches warn, because the batch sheet may be the stale side.
- Wording, formatting, length and non-native phrasing are **never** findings.

---

## 4. Check register — completeness (R)

| ID | Scope | Sev | Trigger | Non-fire | Fields |
|---|---|---|---|---|---|
| R-01 | task | error | any of the 14 always-required task fields is blank | — | `p0CujCategory` `targetLanguage` `dialect` `turnType` `numberOfThreadsAdded` `myGoal` `keyContext` `targetLanguageVersion` `keyContextTargetLanguageVersion` `languageNuance` `prompt` `firstModel` `geminiConversationHistory` `dominantThreadLanguageMatching` |
| R-02 | task | error | `turnType` non-blank and not in {`Single Turn`,`Multi Turn`} | blank (R-01 owns it) | `turnType` |
| R-03 | task | error | `numberOfThreadsAdded = N`, slot `topicConversationsHtmlK` blank for some `K ≤ N` | `numberOfThreadsAdded` unreadable | `topicConversationsHtml1..10` |
| R-04 | task | error | slot `topicConversationsHtmlK` non-blank for some `K > N` (stale hidden slot) | `numberOfThreadsAdded` unreadable | `topicConversationsHtml1..10` |
| R-05 | side | error | `numberOfTurns` missing or unreadable | — | `numberOfTurns` |
| R-06 | side | error | `model1HtmlFileUpload` or `conversationFeedback` blank | — | those two |
| R-07 | side | error | `numberOfTurns = T`, debug slot for turn `k ≤ T` blank | `numberOfTurns` unreadable | `testResponse1DebugInfo` `testResponse2DebugInfo` `model1TestResponse3..5DebugInfo` |
| R-08 | side | error | debug slot for turn `k > T` non-blank (stale hidden slot) | `numberOfTurns` unreadable | same |
| R-09 | task | error | `qualityComparisonSxSRationale` blank | — | `qualityComparisonSxSRationale` |

**R-04 and R-08 fix text must un-hide, clear, re-hide.** The field is invisible to the rater at the current count, so "delete it" is unexecutable. Fix: temporarily raise the count to the highest stale slot, clear each, restore the count.

---

## 5. Check register — gate cascades (G)

Transcribed from the config's own `displayCondition` expressions. **Every gate is two checks: required-when-shown and empty-when-hidden.**

| ID | Sev | Shown when | Required-when-shown | Empty-when-hidden | Field |
|---|---|---|---|---|---|
| G-01 | error | `turnType = Multi Turn` | must be filled | must be clear (error, un-hide fix) | `trackType` |
| G-02 | error | `trackType = Track B` | must be filled | must be clear | `pivotToTopicTurnForTrackBOnly` |
| G-03 | error / warn | `turnType = Single Turn` | must be filled (error) | leftover warns only | `promptGoalAlignment` |
| G-04 | error / warn | `dominantThreadLanguageMatching` includes `Other(Please specify)` | must be filled (error) | leftover warns only | `dominantThreadLanguageMatchingOtherRationale` |
| G-05 | error | `turnType = Single Turn` | all 10 ST rating fields filled | any ST field filled on an MT task → clear (error) | `overallSatisfaction` `contextualContinuity` `contextualContinuityGate` `utilityRelevance` `constraintExpertiseAdherence` `stateEntityProgressTracking` `temporalAwareness` `granularityDepth` `targetLanguageMeaning` `internationalizationQuality` |
| G-06 | error | `turnType = Multi Turn` | `multiTurnSatisfaction` filled | any MT field filled on an ST task → clear (error) | `multiTurnSatisfaction` `turn1..5Continuity` `errorSeverityFirst/Second/Third` |
| G-07 | error | MT and `k ≤ numberOfTurns` | `turnKContinuity` filled | filled for `k > numberOfTurns` → clear | `turn1..5Continuity` |
| G-08 | error | MT, `k ≤ numberOfTurns`, `turnKContinuityErrorTypes` non-empty and does not contain `None` | all three detail fields filled | n/a | `turnKExpectedContext` `turnKContextSourceThreads` `turnKModelCorrectionOutcome` |
| G-09 | error | ST, `targetLanguageMeaning ∈ {Minor Issue, Major Issue}` | rationale filled | n/a | `targetLanguageMeaningRationale` |
| G-10 | error | ST, `internationalizationQuality = Minor Issues` | ≥1 pattern ticked | n/a | `internationalizationMinorIssues` |
| G-11 | error | ST, `internationalizationQuality = Major Issues` | ≥1 pattern ticked | n/a | `internationalizationMajorIssues` |
| G-12 | error | ST, `internationalizationQuality ∈ {Minor Issues, Major Issues}` | rationale filled | n/a | `internationalizationRationale` |
| G-13 | error | MT, `errorSeverityX ≠ No issues logged` and non-blank | rationale filled | n/a | `errorSeverityXRationale` |

---

## 6. Check register — artifact URL integrity (U)

**The project rule: every artifact field holds exactly one Google Drive file link and nothing else.** Applies to `topicConversationsHtml1..10`, `geminiConversationHistory`, and per side `model1HtmlFileUpload` and the five debug slots.

| ID | Sev | Trigger | Fix | Notes |
|---|---|---|---|---|
| U-01 | error | value contains any of `<ctrl99>` `<ctrl100>` `LM Prefix` `Model ID:` `num_turns_read_from_footprints` `BAS->` `reagent_trace` | upload the capture to the task folder, paste only the file link | pasted debug |
| U-02 | error | value contains any of `<!doctype` `<html` `<head` `<body` `<div` `<span class` | upload the saved page, paste only the file link | pasted page source |
| U-03 | error | no `https?://` substring found | paste the Drive share link | |
| U-04 | error | more than one URL found | keep one link, move the others to their own field | |
| U-05 | warn | exactly one URL but non-whitespace text surrounds it | a bare link is easier to open | link is still read and used |
| U-06 | error | URL matches `drive.google.com/drive/.../folders/` | open the folder, paste the individual file's link | a folder cannot be tied to one turn |
| U-07 | warn | URL is not on `drive.google.com` or `docs.google.com` | re-upload to the shared Drive folder if that is the team convention | other hosts may be legitimate |

**Silent normalisation, never a finding:** leading/trailing whitespace and newlines inside a link field. Observed live on task 1264311; flagging it would be a wording finding.

**Drive id extraction, in order:** `/d/<id>` → `?id=<id>` → `/folders/<id>` (prefixed `folder:`) → canonicalised raw string.

---

## 7. Check register — artifact identity (D)

| ID | Sev | Trigger | Non-fire |
|---|---|---|---|
| D-01 | error | two or more artifact slots resolve to the same Drive file id | none — no field pair on this form is a sanctioned duplicate |

Message names every slot in the collision group. When all colliding slots are per-turn debug on one side, the evidence line adds: *two different turns cannot produce the same debug capture.*

**Why unconditional here:** the sanctioned-duplicate trap (a form that deliberately asks for the same artifact twice) does not apply — thread HTMLs are distinct conversations, per-turn debug are distinct turns, per-side HTML are distinct conversations. Re-audit this claim on any fork.

---

## 8. Check register — identity and coherence (I, C)

| ID | Scope | Sev | Rule |
|---|---|---|---|
| I-01 | task | error | `firstModel` must exactly equal one of the discovered per-side namespaces |
| I-02 | task | error | `firstPlaceEnvironment ≠ secondPlaceEnvironment` |
| I-03 | task | error | `firstPlaceEnvironment` and `secondPlaceEnvironment` must each exactly equal a discovered namespace |
| C-01 | task | error | `qualityComparisonSxS` naming *Conversation A* must agree with `firstPlaceEnvironment = Model A`; same for B |
| C-02 | side (ST) | error | `contextualContinuity = Major Issue` ⟺ `contextualContinuityGate = Yes` — checked in **both** directions |
| C-03 | side (ST) | error | `contextualContinuityGate = Yes` ⇒ each of the five memory dimensions and `targetLanguageMeaning` = `N/A — Cold Start` |
| C-04 | side (ST) | error | `contextualContinuityGate = Yes` ⇒ `internationalizationQuality = N/A` |
| C-05 | side (ST) | error | `contextualContinuityGate = No` ⇒ none of the **five memory dimensions** is `N/A — Cold Start` |
| C-06 | side (ST) | **warn** | `contextualContinuityGate = No` ⇒ `targetLanguageMeaning` not cold-start and `internationalizationQuality` not `N/A` — **unless** `dominantThreadLanguageMatching` includes `Dominant threads language is English`, in which case no finding and a log line |
| C-07 | side (MT) | error | `turnKContinuityErrorTypes` contains `None` **and** any other value |
| C-08 | side (MT) | error | a ranking slot names a failure while a higher slot is `No issues logged` |
| C-09 | side (MT) | error | the same failure is named in two ranking slots |
| C-10 | side (MT) | error | a ranked failure does not appear in any turn's error list on that side |
| C-11 | side (ST) | **error** | `contextualContinuity = Major Issue` ⇒ `overallSatisfaction = Very dissatisfied` |
| C-12 | side (ST) | warn | ≥1 Major dimension with satisfaction *Very / Somewhat satisfied* |
| C-13 | side (ST) | warn | ≥2 Minor dimensions with satisfaction *Very satisfied* |
| C-14 | side (ST) | warn | satisfaction dissatisfied while every dimension is *No Issue* |
| C-15 | side (MT) | warn | `turnKContextSourceThreads` names neither a thread nor a turn |
| C-16 | side (MT) | warn | cited `Thread N` exceeds `numberOfThreadsAdded` |

### 8.1 The two rules that carry the most risk

**C-06 — the English-thread exception.** The predecessor engine's rule is "a stray N/A without the gate is flagged." Dimensions 8 and 9 offer N/A for *cold start **or** contextual material is in English*, and Step 2 explicitly permits English-dominant threads. Inheriting the rule unchanged blocks every English-thread task. C-06 therefore warns rather than blocks, names the checkbox that resolves it, and is suppressed entirely when the English declaration is present. **This is the single highest-value false-block prevention in the spec.** Two near-miss scenarios in the suite lock it.

**C-11 — the only anchored satisfaction cell.** Anchor: client feedback on b/542164666 — *"if a prompt requires context from an ongoing project and the model responds like a generic web search, the score must be 1/5 and Major Issue."* That sentence licenses exactly this one cell at blocking severity. C-12 to C-14 have no client sentence on this project and stay warnings. Do not promote them without one.

---

## 9. Check register — assignment vs submission (B)

All of §9 **self-skips with a loud log** if the batch/input root does not resolve. Silence there is silent blindness.

| ID | Sev | Rule | Comparison |
|---|---|---|---|
| B-01 | error | `turnType` must match batch `Task Type` | strip non-letters before comparing — `Single-Turn` vs `Single Turn` |
| B-02 | warn | `firstModel` should match batch `First Model` | exact canonical |
| B-03 | error | `trackType` must match batch `Conversation Track` | skipped when the batch value is `N/A` |
| B-04 | warn | `targetLanguage` should match batch `Target Language` | exact canonical |
| B-05 | warn | `dialect` should match batch `Dialect` | exact canonical |
| B-06 | error | ST ⇒ each side declares exactly 1 turn | ports v3.2.4's eval-type shape check |
| B-07 | error | MT ⇒ each side declares ≥2 turns | asymmetric counts allowed (e.g. 3 and 2) |

---

## 10. Not this layer — routed to the QD pack

Listed so the reverse coverage pass closes. A judge that re-raises any of these produces a duplicate finding.

| Question | Owner |
|---|---|
| Does the prompt satisfy its assigned Explicitness and Relevance levels | QD — prompt × assignment |
| Do the linked threads support a continuity test (depth, continuation reason, CUJ fit) | QD — threads × task fit |
| Does the rating match what the conversation actually shows | QD — ratings × response |
| Is the logged error the right category for what happened | QD — error-log fit |
| Does `keyContext` state facts the threads actually establish | QD — ground truth grounding |
| Is the target-language version a faithful rendering of the English one | QD — i18n fidelity |
| Is `Minor Issue` the right call where `Major` was warranted | QD — the amnesia boundary (see the client feedback) |

---

## 11. Declared unverifiable — nobody can check these

Reported as such, never silently passed, never blamed on the rater.

| Item | Blocker | What would unblock it |
|---|---|---|
| The 20-turn-per-thread cap | saved pages carry no reliable turn delimiters | a per-thread turn-count field |
| The 12-turn floor for a single-thread topic | same | same |
| Thread recency vs the assigned Time Gap | saved pages carry no timestamps | a per-thread date field |
| The 06/21–07/12 exclusion window | same | same |
| Accuracy of any `Thread X, Turn Y` citation | no turn delimiters; format is checkable, correctness is not | same |
| The `M1_D1_001` file-naming convention | a Drive link does not carry the filename | a filename field, or fetch-and-inspect |
| Whether a Drive link resolves at all | no fetch layer in the script | a fetch layer, with classified failures |

---

## 12. Removed on fork — deleted outright, never left to self-skip

The predecessor engine read the debug **blob** from the form. On 944 the blob never enters the payload. A check that can never fire is indistinguishable from a broken one.

`looksLikeDebug` · Check A (first user block = form prompt) · Check B (Turn N>1 last block ≠ form prompt) · Check C (cross-turn containment) · Check D (Turn 1 first = last) · omission-marker handling · footprints delta · Model ID consistency within a side · cross-side same-Model-ID · declared-identity · byte-identical blob comparison.

Replaced by §6 (URL discipline) and §7 (Drive id identity), which are the only forms of those questions the payload can still answer.

---

## 13. Coverage

93 writable fields. 86 bound by at least one check. The 7 unbound, each with a named reason:

| Field | Why unbound |
|---|---|
| `setupCheck`, `secondModelLock`, `privacyGate` | platform progression gates; the form enforces them |
| `temporalTag`, `sensitiveTopicTag` | optional by config, no client rule to enforce |
| `accountAge`, `recordings` | optional by config, explicitly "if possible" in the doc |

Zero phantom keys: every key the script names exists in the config export.

---

## 14. Escalations — open, and they gate work downstream

| # | Issue | Owner | Blocking? |
|---|---|---|---|
| E1 | Eval Configuration says `ST: 2 turns per env`; ST Step 4 asks for one prompt; the sibling single-sided tab says 1 turn. 901 already ruled the equivalent row wrong. B-06 assumes 1. | doc owner | no — guarded, but the guard is a known assumption |
| E2 | The Contextual Continuity **loss label** field (`complete_amnesia` / `incomplete_context_connection` / `hallucinated_context_link`) exists in the 7/24 generation and is **absent from the 944 config**. The client's amnesia calibration, Rubrics V2's labelling instruction, and three inherited judges all consume it. | doc + config owner | yes for the QD pack |
| E3 | Dimensions 8 and 9 carry the qualifier *"[Choose only if triggered by Question 2a]"* on an option with two legitimate triggers. C-06 works around it; the doc should be corrected. | doc owner | no |
| E4 | `turnKContinuityErrorTypes` gates the three detail fields on `!in("None", …)`. Ticking None beside a real error hides required detail. C-07 catches it after the fact; the config should make the options mutually exclusive. | config owner | no |
| E5 | No required CUJ distribution. The client feedback asks for balance across Planning / Recommendation / Advice; the balancing axes table has no CUJ quota, so it is rater-chosen — the same freedom that produced 57.5% Planning on the sibling batch. | client | no |
| E6 | `qualityComparisonSxS` (7-point) exists in the config but not in the 8/27 rater doc. C-01 uses it. Confirm it is intended. | doc owner | no |

---

## 15. First-task verification

Blocking at deploy. One row per assumption that could not be proved offline.

| # | Assumption | Expected | If it fails |
|---|---|---|---|
| 1 | Per-side key shape | `compareModels.<model name>.<questionKey>` | adapter fix; the run logs every namespace found, so one run answers it |
| 2 | Batch/input root resolves | `Task Type`, `First Model`, `Conversation Track`, `Model A/B` present | §9 self-skips with a loud log — expected behaviour, but record it |
| 3 | Artifact fields hold one Drive **file** link | confirmed on 5 completed ST tasks | re-confirm on the first MT task |
| 4 | **MT branch behaviour** | no completed MT task exists in the sample; every MT check is structurally verified and **behaviourally unproven** | replay one MT task before trusting any MT finding |
| 5 | Model-name bytes | exactly as in §1, including `-->` and ` - Fast` | exact-match resolution fails → A/B checks skip with a log; fix the identity table, never loosen the match |

---

## 16. Regression cases

Named permanently. Re-run after any edit touching their checks.

| Task | Class | Check |
|---|---|---|
| 1264303 | thread HTML and model HTML are the same Drive file | D-01 |
| 1264308 | ST task, one side declares 2 turns | B-06 |
| 1264311 | trailing newlines inside link fields — must **not** fire | U-05 non-fire |
| *(needed)* | first completed Multi-Turn task | G-06 to G-08, C-07 to C-10 |

---

## 17. Message contract

Every finding renders as:

```
[<side label> — "<on-screen field label>"]
  Problem: one sentence naming what is wrong
  Fix:     verb-first, executable with zero knowledge of how validation works
  Why:     the evidence — the two values, the file id, the counts
```

- Fields are named by their **on-screen label**, resolved from the payload, never by key.
- Multiple problems on one field merge into one block, joined by `Also:`, with actions fuzzy-de-duplicated on the first 40 characters.
- **No internal language anywhere in rater-facing output** — no check IDs, no rule names, no "script / validator / pipeline / gate condition".
- Never advise deleting something another rule requires. Never demand a state the platform refuses.
- The Problem sentence is the **triage identifier**: changing its wording without updating the rater-facing error reference breaks lead triage.

---

## 18. Build discipline

- Generated by an assertion-guarded builder from this file; the `.js` is never hand-edited.
- Assertions: zero phantom keys against the 944 key universe · every check ID in §4–§9 present exactly once · every skip logs · version string in the completion log · rebuild twice and diff hashes.
- Suites: one smoke scenario per check family, one adversarial per check, plus the **near-miss that must not fire** for every check where a false block is plausible.
- Outputs folder holds exactly one registrable file.
- Changelog entries name the incident that forced the change.

*END OF REQUIREMENTS — 944 deterministic layer v1.0.0*
