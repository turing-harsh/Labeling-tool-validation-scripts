# Deterministic check requirements — i18n Continuity Quality E2E Eval (944)

**Purpose.** The generation contract for `i18n-continuity-validator-944`. Every check the script performs is specified here with its trigger, severity, non-fire conditions, rater-facing wording and anchor. A builder can emit the script from this file; a reviewer can audit the script against it. Where the two disagree, this file is wrong until updated — the script is never hand-edited away from it.

**Scope.** Layer L1 (deterministic, computable from the payload's own bytes) plus Layer L2 (deterministic, computable from the bytes of a Drive-linked artifact once fetched — §8–§9). Semantic questions are listed in §12 and belong to the QD pack. Unverifiable items are declared in §13 and belong to nobody.

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
| Artifacts | Google Drive links — debug, conversation HTML, thread HTML, Takeout — **fetched and content-checked**, not just link-shape-checked (§8–§9) |
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

## 8. Fetch layer (Layer L2)

**Added v2.0.0.** Every artifact field in scope for §6 (`topicConversationsHtml1..10`, `geminiConversationHistory`, and per side `model1HtmlFileUpload` and the five debug slots — up to 23 links on one task) is now retrieved, not just pattern-checked, using the sandbox-injected `fetchDataFromDriveLink`. This closes the gap the v1.x line left open ("no fetch layer in the script" — old §11) and matches the sibling 939/903 pipeline's approach to the same artifact family.

- **Precondition.** A field is only fetched once it has passed U-01–U-06 as exactly one clean `https://` link **on a host the fetch helper can actually read**. A field that already carries a U-family finding is not fetched — the link-shape error owns it. A U-07 link (non-Drive host, `docs.google.com` included) is **never fetched**: the tool's fetch helper hard-rejects every URL that is not a `drive.google.com` file link (its `isGoogleDriveUrl` gate — verified in `libs/google-drive`), so a "best-effort" attempt is a guaranteed failure that would escalate U-07's warn into an F-01 error. Skipped hosts are logged, never findings. *(v2.0.1 — the v2.0.0 "attempted best-effort" wording predated reading the helper's host gate.)*
- **Mechanism.** `await fetchDataFromDriveLink(url)`, one retry when the first read comes back empty or implausibly short (mirrors the inherited "incomplete read" defence) before a failure is treated as real. When the linked file is JSON, the helper hands over the **parsed value**, not text (it `JSON.parse`s internally — verified in `drive-fetcher.ts`); the script re-serialises before content checks.
- **Timeout enforcement is host-side, and the isolate has NO timers.** The production isolate (isolated-vm, `run-checks-api` script-executor) injects **only** `conversationData` and the fetch helpers — `setTimeout`/`clearTimeout`/`console` do not exist there, so an in-script timeout race or wall-clock budget is unimplementable (referencing `setTimeout` broke every fetch with a `ReferenceError` — the v2.0.1 incident). The real enforcement: the host drive-fetcher races each fetch against its own configured timeout (rejecting with "Drive fetch timed out after Nms", which surfaces as F-01), and the API aborts all outstanding fetches when the 30s script budget ends. The script's own obligations are **concurrency** — all fetches issued together via `Promise.allSettled`, never awaited one at a time in a loop (build-asserted) — and the one retry above. *(v2.0.1 — replaces the v2.0.0 "~18s in-script `[FETCH BUDGET]`" design, which assumed timers the sandbox does not provide.)*
- **Normalisation before content checks.** The same ladder as §2, plus: if the fetched bytes are HTML-shaped (head starts `<!doctype`/`<html`/`<head`/`<meta` in the first 400 characters, or the expected structural markers are entity-encoded), decode entities and strip tags line-wise before applying F-02's marker test — a Drive "export as HTML/Doc" of a plain debug file must still be readable. Literal `<ctrl99>`/`<ctrl100>` markers found as-is always mean "treat as plain text, never decode" (decoding would eat them, since they match a generic tag-stripping pattern).
- **Non-goals (still out of scope — see §17 items 6–7 and §14).** No verified Model-ID identity map exists for 944's Model A/B, so Model-ID consistency checks are not restored. No confirmed 944 debug sample exists yet, so content-anchoring (matching a debug's first turn against `prompt`/`keyContext`) is deliberately **not** attempted — 939's sibling pipeline found this exact doctrine wrong for continuity-shaped tasks (the "Prompt" field there is a follow-up turn, not the opening line; see 939's `validation.js` header comment), and 944 is a continuity project too. Do not add a Check-A-style anchor without a same-project sample proving `prompt` corresponds to the debug's Turn 1.

---

## 9. Check register — fetched-artifact content (F)

| ID | Scope | Sev | Trigger | Non-fire | Fields |
|---|---|---|---|---|---|
| F-01 | side/task | error | a fetchable link (§8 precondition) fails to fetch (error, host-side timeout, permission-denied) after one retry | the field already carries a U-family finding; the field is blank; the host is one the helper cannot read (U-07 owns it, logged not fetched) | all artifact fields in §8 |
| F-02 | side | error | fetched debug-slot content contains none of `<ctrl99>` `Model ID:` `LM Prefix:` `num_turns_read_from_footprints` (post-decode, §8) | the fetch itself failed (F-01 owns it) | `testResponse1DebugInfo` `testResponse2DebugInfo` `model1TestResponse3..5DebugInfo` |
| F-03 | side/task | error | fetched `model1HtmlFileUpload` / `topicConversationsHtmlK` content contains none of `<!doctype` `<html` `<head` `<body`; **or** fetched `geminiConversationHistory` content is not a Gemini Takeout export — JSON whose records carry ≥2 of the keys `header` / `title` / `products` / `activityControls` / `safeHtmlItem` on a majority of the first 5 records | the fetch itself failed | those fields |
| F-04 | task | warn | two fetched artifacts with **different** Drive file ids normalise (§2, plus HTML-decode) to byte-identical content | either side's fetch failed | all artifact fields in §8 |
| F-05 | side | error | the per-file counts of `<ctrl99>user` **turn-open markers** (`\b`-anchored, case-insensitive) in a side's fetched debug fit **neither** legitimate export shape — *flat* (one marker per file, summing to the number of fetched debug slots) nor *cumulative* (turn *t*'s capture replays turns 1..*t*, so it carries exactly *t* markers) | either shape fits; any contributing debug slot failed F-01/F-02; `numberOfTurns` unreadable (R-05 owns it) | debug slots, `numberOfTurns` |

**Why F-03 treats `geminiConversationHistory` differently (v2.0.1):** the v2.0.0 register assumed a Takeout export is HTML-shaped. The first real sample (golden task 1264318) proved it is a **JSON array of activity records** (`header`/`title`/`time`/`products`/`details`/`activityControls`/`safeHtmlItem`) — the HTML-marker test would have false-blocked every well-formed task. Some records omit a field, so the test requires ≥2 of the anchor keys on a majority of sampled records rather than an exact key set.

**Why F-04 is a warn, not the error D-01 already is:** D-01 (same Drive file **id**) is unconditional because no field pair on this form is a sanctioned duplicate. F-04 (same **content**, different id — e.g. a re-uploaded copy) has no equivalent client ruling for 944 yet, unlike 903's shared-template family where byte-identical debug across turns was confirmed as a real defect; keep it a warn until a first real hit is triaged.

**Why F-05 counts open markers, not whole blocks (v2.0.2 incident):** the first production run false-blocked both sides of a task with "0 turns counted, 1 declared" while F-02 passed on the same fetched bytes — the strict `<ctrl99>user\n…<ctrl100>` block regex demanded a bare LF after the role token, and real captures vary there (CRLF from Windows-saved files, tags in a Doc/HTML export, `\n` as two literal characters when the blob arrives JSON-encoded). The count is now anchored on the `<ctrl99>user` open marker alone (`\b` after `user` so `username` never counts; case-insensitive). On any count mismatch the run log carries an escaped byte-context snippet around each file's first marker, so a new export shape diagnoses itself from the tool's log.

**Why F-05 accepts two export shapes (v2.0.3 incident):** the first completed Multi-Turn task (1264388) showed that Gemini debug captures are **cumulative** — the turn-2 capture replays turn 1, the turn-3 capture replays turns 1-2. Model A's two files carried 1+2 = 3 markers against `numberOfTurns=2`, Model B's three carried 1+2+3 = 6 against `numberOfTurns=3`, and v2.0.2's sum-across-files rule blocked both sides of a correct submission. F-05 now computes the marker count **per file** and fires only when the counts fit neither the flat shape (every file 1 marker; the sum equals the number of fetched slots — what every Single-Turn task looks like) nor the cumulative shape (turn *t* carries *t*). Counts that fit neither — captures exported for the wrong turns, e.g. 1/1/4 — still block. The flat sum is compared against the number of **fetched slots**, not `declared`, because the form caps debug slots at 5: a 6-turn side legitimately contributes 5 files.

**Why content-anchoring (Check A–D) and Model-ID identity are not F-checks:** see §8's non-goals paragraph and §14.

---

## 10. Check register — identity and coherence (I, C)

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

### 10.1 The two rules that carry the most risk

**C-06 — the English-thread exception.** The predecessor engine's rule is "a stray N/A without the gate is flagged." Dimensions 8 and 9 offer N/A for *cold start **or** contextual material is in English*, and Step 2 explicitly permits English-dominant threads. Inheriting the rule unchanged blocks every English-thread task. C-06 therefore warns rather than blocks, names the checkbox that resolves it, and is suppressed entirely when the English declaration is present. **This is the single highest-value false-block prevention in the spec.** Two near-miss scenarios in the suite lock it.

**C-11 — the only anchored satisfaction cell.** Anchor: client feedback on b/542164666 — *"if a prompt requires context from an ongoing project and the model responds like a generic web search, the score must be 1/5 and Major Issue."* That sentence licenses exactly this one cell at blocking severity. C-12 to C-14 have no client sentence on this project and stay warnings. Do not promote them without one.

---

## 11. Check register — assignment vs submission (B)

All of §11 **self-skips with a loud log** if the batch/input root does not resolve. Silence there is silent blindness.

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

## 12. Not this layer — routed to the QD pack

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

## 13. Declared unverifiable — nobody can check these

Reported as such, never silently passed, never blamed on the rater.

| Item | Blocker | What would unblock it |
|---|---|---|
| The 20-turn-per-thread cap | fetched thread pages (§8) still carry no reliable turn delimiters — only Gemini debug does (F-05) | a per-thread turn-count field, or confirmation the thread pages carry a countable structure |
| The 12-turn floor for a single-thread topic | same | same |
| Thread recency vs the assigned Time Gap | fetched thread pages carry no confirmed timestamps | a per-thread date field, or confirmation the page HTML embeds one |
| The 06/21–07/12 exclusion window | same | same |
| Accuracy of any `Thread X, Turn Y` citation | thread pages have no confirmed turn delimiters; the citation's *format* is checkable (C-15/C-16), its *correctness* is not | same |
| The `M1_D1_001` file-naming convention | a Drive link does not carry the filename, and `fetchDataFromDriveLink` returns content, not Drive metadata | a filename field, or a fetch helper that also returns the file's name |

**Resolved in v2.0.0:** "Whether a Drive link resolves at all" — the fetch layer (§8–§9) now attempts every artifact link and classifies the failure (F-01).

---

## 14. Removed on fork — deleted outright, never left to self-skip

The predecessor engine read the debug **blob** directly off the form. On 944 the blob never enters the payload as a value — it lives behind a Drive link. A check that can never fire is indistinguishable from a broken one, so v1.x deleted the whole content-anchored family rather than ship dead code.

v2.0.0 adds a fetch layer (§8) and restores the two items that are generic structural sanity, not content semantics — everything else stays removed because it depends on a doctrine or an identity map that has not been confirmed for 944 specifically:

| Item | Status | Why |
|---|---|---|
| `looksLikeDebug` | **restored** → F-02 | pure marker sniffing, no semantic assumption |
| footprints / turn-count cross-check | **restored** → F-05 | counts `<ctrl99>` blocks against the declared turn count; no assumption about *what* the turns say |
| byte-identical blob comparison | **restored, loosened** → F-04 (warn, not error) | same mechanism, but 944 has no client ruling yet that a duplicate is a defect (903's shared-template ruling doesn't transfer without evidence) |
| Check A (first user block = form prompt) | still removed | 939's sibling pipeline found this doctrine **wrong** for continuity-shaped tasks — the "Prompt" field is a follow-up turn, not the opening line. 944 is a continuity project too; do not restore without a 944 sample proving otherwise (§17 item 6) |
| Check B (Turn N>1 last block ≠ form prompt) · Check C (cross-turn containment) · Check D (Turn 1 first = last) | still removed | same reason — all three assume the same prompt-anchoring doctrine as Check A |
| omission-marker handling | still removed | the marker strings are inherited from 903's project family; unconfirmed that 944's Gemini export uses the same ones |
| Model ID consistency within a side · cross-side same-Model-ID · declared-identity | still removed | requires an exact Model-ID map for `07 Pizzi Gemelli --> Fast …` / `Pcontext Mode 23 (Nippon) > Ramen (top 20) - Fast`, which does not exist yet (§17 item 6) |

Everything in this table that is *not* marked restored is still covered only by §6 (URL discipline) and §7 (Drive id identity) — the forms of these questions the payload could already answer without a fetch.

---

## 15. Coverage

93 writable fields. 86 bound by at least one check. The 7 unbound, each with a named reason:

| Field | Why unbound |
|---|---|
| `setupCheck`, `secondModelLock`, `privacyGate` | platform progression gates; the form enforces them |
| `temporalTag`, `sensitiveTopicTag` | optional by config, no client rule to enforce |
| `accountAge`, `recordings` | optional by config, explicitly "if possible" in the doc |

Zero phantom keys: every key the script names exists in the config export.

---

## 16. Escalations — open, and they gate work downstream

| # | Issue | Owner | Blocking? |
|---|---|---|---|
| E1 | Eval Configuration says `ST: 2 turns per env`; ST Step 4 asks for one prompt; the sibling single-sided tab says 1 turn. 901 already ruled the equivalent row wrong. B-06 assumes 1. | doc owner | no — guarded, but the guard is a known assumption |
| E2 | The Contextual Continuity **loss label** field (`complete_amnesia` / `incomplete_context_connection` / `hallucinated_context_link`) exists in the 7/24 generation and is **absent from the 944 config**. The client's amnesia calibration, Rubrics V2's labelling instruction, and three inherited judges all consume it. | doc + config owner | yes for the QD pack |
| E3 | Dimensions 8 and 9 carry the qualifier *"[Choose only if triggered by Question 2a]"* on an option with two legitimate triggers. C-06 works around it; the doc should be corrected. | doc owner | no |
| E4 | `turnKContinuityErrorTypes` gates the three detail fields on `!in("None", …)`. Ticking None beside a real error hides required detail. C-07 catches it after the fact; the config should make the options mutually exclusive. | config owner | no |
| E5 | No required CUJ distribution. The client feedback asks for balance across Planning / Recommendation / Advice; the balancing axes table has no CUJ quota, so it is rater-chosen — the same freedom that produced 57.5% Planning on the sibling batch. | client | no |
| E6 | `qualityComparisonSxS` (7-point) exists in the config but not in the 8/27 rater doc. C-01 uses it. Confirm it is intended. | doc owner | no |

---

## 17. First-task verification

Blocking at deploy. One row per assumption that could not be proved offline.

| # | Assumption | Expected | If it fails |
|---|---|---|---|
| 1 | Per-side key shape | `compareModels.<model name>.<questionKey>` | adapter fix; the run logs every namespace found, so one run answers it |
| 2 | Batch/input root resolves | `Task Type`, `First Model`, `Conversation Track`, `Model A/B` present | §11 self-skips with a loud log — expected behaviour, but record it |
| 3 | Artifact fields hold one Drive **file** link | confirmed on 5 completed ST tasks | re-confirm on the first MT task |
| 4 | **MT branch behaviour** | no completed MT task exists in the sample; every MT check is structurally verified and **behaviourally unproven** | replay one MT task before trusting any MT finding |
| 5 | Model-name bytes | exactly as in §1, including `-->` and ` - Fast` | exact-match resolution fails → A/B checks skip with a log; fix the identity table, never loosen the match |
| 6 | Fetched debug format is Gemini-native (`<ctrl99>`, `Model ID:` markers) | **confirmed** on golden task 1264318 — both sides' debug carry `<ctrl99>user…<ctrl100>` blocks (1 each, matching `numberOfTurns=1`) and `Model ID:` lines (`bard_paid_fast_uft90` on side A, `pcontext_1p_paid_fast_prod_notebook_eval` on side B — the first observed pair for a future Model-ID identity map, one sample is not yet a map) | if F-02 starts firing broadly on other tasks, the export format varies — re-check before touching the marker list |
| 7 | Fetch stage fits the 30s script timeout | fetches are concurrent and each is bounded by the host fetcher's own timeout (§8) — the script cannot add timers of its own | if real tasks time out at 30s, drop fetch/content-checking for the lowest-value targets (start with `topicConversationsHtml1..10`, keep per-side debug/HTML) |

---

## 18. Regression cases

Named permanently. Re-run after any edit touching their checks.

| Task | Class | Check |
|---|---|---|
| 1264303 | thread HTML and model HTML are the same Drive file | D-01 |
| 1264308 | ST task, one side declares 2 turns | B-06 |
| 1264311 | trailing newlines inside link fields — must **not** fire | U-05 non-fire |
| 1264388 | first completed Multi-Turn task (Model A 2 turns, Model B 3 turns); also the v2.0.3 F-05 cumulative-debug case — must **not** fire | G-06 to G-08, C-07 to C-10, F-05 non-fire |
| *(needed)* | a well-formed link whose share was revoked (fetch fails) | F-01 |
| *(needed)* | a debug slot linking a file that fetches but isn't a Gemini debug capture | F-02 non-fire boundary |
| *(needed)* | a side's fetched debug whose marker counts fit neither export shape, on a real task | F-05 |
| fixture `DBG_CUMUL2` | cumulative MT debug (turn 2 replays turn 1) — must **not** fire; locks the v2.0.3 production false-block | F-05 non-fire |
| fixture `DBG_CRLF` | Windows-saved debug (CRLF after `<ctrl99>user`) — must **not** fire; locks the v2.0.2 production false-block | F-05 non-fire |

---

## 19. Message contract

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

## 20. Build discipline

- Generated by an assertion-guarded builder from this file; the `.js` is never hand-edited.
- Assertions: zero phantom keys against the 944 key universe · every check ID in §4 (R), §5 (G), §6 (U), §7 (D), §9 (F), §10 (I/C), §11 (B) present exactly once · every skip logs · version string in the completion log · rebuild twice and diff hashes.
- Suites: one smoke scenario per check family, one adversarial per check, plus the **near-miss that must not fire** for every check where a false block is plausible.
- **Fetch-family (F) fixtures run offline** against `scripts/wrapper.mjs`'s `fetchDir` mock — local `<driveFileId>.txt`/`.html` files (mirroring `939-continuity-en-us/golden/artifacts/`) stand in for `fetchDataFromDriveLink`, so F-01..F-05's success/failure/malformed-content paths are exercised without a live network call.
- **No serial fetch loops.** The builder asserts the compiled script never `await`s `fetchDataFromDriveLink` inside a `for`/`for-of`/`.forEach` over artifact fields — all fetches for one task must be issued concurrently (`Promise.allSettled`), per §8's budget.
- Outputs folder holds exactly one registrable file.
- Changelog entries (§21) name the incident or decision that forced the change.

---

## 21. Changelog

- **v2.0.3** — F-05 false-block fix #2, from the first completed Multi-Turn task (1264388): Gemini debug captures are **cumulative** (turn *t* replays turns 1..*t*), so v2.0.2's sum-across-a-side's-files rule counted 3 markers against `numberOfTurns=2` and 6 against `numberOfTurns=3` and blocked both sides of a correct submission. F-05 now counts markers per file and fires only when they fit neither the flat nor the cumulative shape; the flat sum is compared against the number of fetched slots (the form caps debug at 5). §17 item 4 (Multi-Turn branch) closes on this task. New regression fixture `DBG_CUMUL2` (F-05 non-fire) plus a fits-neither fire case.
- **v2.0.2** — F-05 false-block fix from the first production run: both sides of a task were blocked with "0 turns counted, 1 declared" although the fetched debug carried the markers (F-02 passed on the same bytes). The strict `<ctrl99>user\n…<ctrl100>` block regex required a bare LF after the role token; turn counting is now anchored on the `<ctrl99>user` open marker alone (`\b`-anchored, case-insensitive — tolerant of CRLF, Doc/HTML-export separators, and JSON-encoded blobs). Any count mismatch now also writes an escaped byte-context snippet per debug file to the run log, so an unexpected export shape self-diagnoses in production. New regression fixture `DBG_CRLF` (F-05 non-fire).
- **v2.0.1** — Sandbox-reality corrections to the fetch layer, from reading the tool's actual executor (`run-checks-api`) and the first real golden task (1264318). (1) The production isolate injects **no timers** — the v2.0.0 in-script timeout/`[FETCH BUDGET]` design threw `setTimeout is not defined` and turned every fetch into a false F-01; §8 now names host-side timeout + 30s abort as the enforcement, and the script keeps only concurrency + one retry. (2) The fetch helper hard-rejects every non-`drive.google.com` host, so U-07 links are now skipped-with-log, never fetched (the "best-effort" attempt guaranteed an error out of a warn). (3) F-03 splits `geminiConversationHistory`: a real Takeout export is a JSON array of activity records, not HTML — the HTML-marker test would have false-blocked every task. (4) The helper returns parsed JSON for JSON files; the script re-serialises before content checks. (5) Fields carrying pasted debug/HTML text (U-01/U-02) are excluded from fetching, completing the §8 precondition. §17 items 6 (Gemini-native debug) and 7 (timeout fit) updated with golden-task evidence. Local mirror (`scripts/wrapper.mjs`) aligned to the isolate: no timers/console injected, JSON parsed like the host.
- **v2.0.0** — Added Layer L2: a real fetch layer (`fetchDataFromDriveLink`) over the artifact fields already governed by §6/§7, per an explicit decision to bring 944 in line with the sibling 939/903 pipeline instead of staying link-shape-only. New check register §9 (F-01..F-05). Restored, in scoped form, three items from the v1.0.0 "removed on fork" list (§14: `looksLikeDebug` → F-02, footprints/turn-count cross-check → F-05, byte-identical blob comparison → F-04, loosened to warn). Resolved one v1.0.0 "declared unverifiable" item (§13: Drive-link resolution → F-01). Explicitly did **not** restore content-anchoring (Check A–D) or Model-ID identity — both require a doctrine or identity map not yet confirmed for 944 (§8 non-goals, §17 items 6–7). Sections renumbered throughout (old §8→10, §9→11, §10→12, §11→13, §12→14, §13→15, §14→16, §15→17, §16→18, §17→19, §18→20); `metadata.yml` and `golden/README.md` cross-references updated to match.
- **v1.0.0** — Initial deterministic (Layer L1) release: 56 checks (R/G/U/D/I/C/B), no fetch layer.

*END OF REQUIREMENTS — 944 deterministic + fetched-artifact layer v2.0.1*
