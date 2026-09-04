# Deterministic check requirements — STM v2 Red Teaming Evals (945)

**Purpose.** The generation contract for `redteam-stm-validator-945`. Every check the script performs is specified here with its trigger, severity, non-fire conditions and anchor. A builder can emit the script from this file; a reviewer can audit the script against it. Where the two disagree, this file is wrong until updated — the script is never hand-edited away from it.

**Scope.** Layer L1 (deterministic, computable from the payload's own bytes) plus Layer L2 (deterministic, computable from a Drive-linked artifact once fetched — §8–§10). Semantic questions are routed in §13 and belong to the QD pack. Unverifiable items are declared in §14 and belong to nobody.

**Source of field truth.** `config/project-config-id-945.json` (final: `lossCategory.displayCondition = false`) — 38 fields, 27 of them per side via `compareBaseAndTest`. Every key, enum value and gate below was generated from that export, not hand-typed.

**Evidence base.** Client doc (`Copy_of_STM_v2`), Turing internal doc, QA-lead workflow rules 1–13, batch sheet, and one completed task (1267698). As of v1.0.1 **all nine of that task's artifacts are in `golden/artifacts/`** — five Test debug captures, the Base debug capture, both saved HTML pages and the Takeout export — so the Test-side assumptions that v1.0.0 could only mark **[unproven]** are now measured. Facts confirmed on that sample are marked **[proven]**; §18 records what each verification returned.

---

## 1. Project shape

| | |
|---|---|
| Config id | 945 |
| Fork base | Personalization `v3.2.4` (engine line A), with the 944 fetch-layer (F-family) pattern |
| Sides | 2, via `SIDE_BY_SIDE_COMPARISON` field `compareBaseAndTest`, progressive per-model form |
| model_A | `Nippon (PContext mode 23) - Mochi Fast` — **Test** |
| model_B | `Nippon (PContext mode 23) - Prod Frozen Fast` — **Base** |
| Study shape | Red teaming: every submitted task is a **loss by construction**. **Ruled 2026-09-03 (closes E-8):** *always* start the conversation on **Model A (Mochi) = Test** and continue until the model makes a mistake — that turn is the bait prompt — then **branch the bait prompt and the conversation history to Model B (Prod Frozen) = Base**. The roles are fixed; they never rotate with display order. Test runs turns 1..N; Base is a branch from Test's R(N−1) receiving only the bait prompt P(N). Bait turn ≡ Test's `numberOfTurns` (workflow rules 3 & 5: stop immediately on failure, no post-bait prompts) |
| Artifacts | Google Drive **file links** in every debug slot, `htmlExport`, and `geminiTakeout` — fetched and content-checked (§8–§10), despite the fields being `FREE_TEXT` |
| Per-side key shape (sheet layer) | `<model name> - <key>` |
| Batch/input root | `First Model`, `Model A`, `Model B`, `Model A HTML NAME`, `Model B HTML NAME`, Drive folder links, `prompt` |

### 1.1 Namespace and spelling traps

- **Both model names contain ` - `** (`Nippon (PContext mode 23) - Mochi Fast`), and the batch sheet uses the same ` - ` to join namespace and key. Never split a sheet column on ` - `; split at the **last** ` - ` (keys are camelCase, no spaces or hyphens).
- Resolve model names by **exact canonical string only**. No substring, no prefix. No exact match → skip with a log. (A8; the 900 prefix incident.)
- Role mapping is **Test = model_A = Mochi Fast**, per the config. The internal doc's Model A/B table says the opposite (registered escalation E-3); the validator anchors on the config, never on either doc's constant.
- **`First Model` / `modelOrder` never selects a role.** The roles come from the config (§1), and under the ruling the conversation always starts on model_A, so `First Model` *should* read model_A on every task — but a spreadsheet column is not evidence of how the task was run. A disagreement gets a **warning** (I-03); the block for a genuinely inverted run is **F-09**, which reads the debug captures. That split matters: on task 1267733 the column said Prod Frozen *and* the run really was inverted, but the two failure modes are independent, and a wrong column on its own is a batch fix rather than rater rework. The write-up fields' labels ("First Model Side", "Second Model Side") are order-named for the same fork-residue reason the rubric labels are (above); do not read a role out of them either.
- Rubric field display names carry fork residue: `lossCategory` renders as `model - Loss Category`; `baseSideFeedback` renders as `Second Model Side (Bait Prompt & Beyond)`. Name fields by their on-screen label as-is; never "correct" them in output.

---

## 2. Normalisation ladder

Fixed order, one shared function, used everywhere a comparison happens:

1. strip pipeline-injected omission markers *(inherited pattern; 945's own marker strings unconfirmed — see §18 item 7; strip is a no-op until confirmed)*
2. Unicode `NFC`
3. strip zero-width characters (`U+200B`–`U+200D`, `U+FEFF`)
4. curly quotes → straight; en/em dashes → hyphen
5. collapse whitespace
6. trim

Links compare on the **extracted Drive file id** (`/d/<id>` → `?id=<id>` → `/folders/<id>` prefixed `folder:` → canonicalised raw), never the raw string — `?usp=sharing` ≡ `?usp=drive_link`.

Debug user blocks extract on the `<ctrl99>user` **open marker** (`\b`-anchored, case-insensitive), block content up to the next `<ctrl99>` role marker or `<ctrl100>` — the loosened v2.0.2/944 rule, because the strict `\n`-anchored block regex false-blocked on CRLF and export re-encodings. **[proven — the real capture uses `\<ctrl99\>` escaping in Drive's text rendering; decode `\<`/`\>` escapes and entity-encoded variants before marker tests.]**

---

## 3. Severity policy

> **Block** when the defect makes downstream validation meaningless or the data unusable, and the rater can fix it with certainty.
> **Warn** when the signal is probabilistic, the cause may be system-side, or the correct action depends on something only the rater knows.

Applied corollaries on this project:

- Prerequisites that silently disable other checks block: `prompt`, per-side `numberOfTurns`, unfetchable/unparseable debug.
- **No check ever fires on the Base-side rubric fields** (`testCoreTaskCompletion`, `lossCategory`, `leakage*`, `general*`, `didTurnKHaveIssue`, `turnKMemorySection` under the Prod Frozen namespace). The config forces the rater to fill them, but a loss is Test-only by definition, so any value there is forced noise — flagging it punishes compliance with a broken form (A5, F8). Values are **logged, never judged**, until escalation E-1 lands. The three exceptions that DO run on Base: R-family completeness for `numberOfTurns` / `debugInfoTurn1` / `htmlExport`, the U/D/F artifact checks, and A-family content anchoring — those are about the artifacts, not the rubric.
- Footprints delta: **dead by design** — the protocol requires deleting the Test chat before Base runs, and the counter had already drifted (v3.2.3). Not ported. Deleted, not self-skipping (§15).
- MT/ST eval-type shape: **dead** — no eval-type field on 945. Its successor is the bait-turn shape family (C-01..C-03).
- Wording, formatting, length, non-native phrasing: never findings.

---

## 4. Check register — completeness (R)

Task level unless marked *side*. "Test side" = the namespace matching batch `First Model`; "Base side" = the other.

| ID | Scope | Sev | Trigger | Non-fire | Fields |
|---|---|---|---|---|---|
| R-01 | task | error | `prompt` blank | — | `prompt` |
| R-02 | task | error | `geminiTakeout` blank | — | `geminiTakeout` |
| R-03 | task | error | `modelOrder` blank or not one of the two config model strings (exact canonical) | — | `modelOrder` |
| R-04 | side | error | `numberOfTurns` missing or not in `{1..5}` | — | `numberOfTurns` |
| R-05 | side | error | `debugInfoTurnK` blank for some `K ≤ numberOfTurns` | R-04 fired | `debugInfoTurn1..5` |
| R-06 | side | error | `debugInfoTurnK` non-blank for some `K > numberOfTurns` (stale hidden slot) | R-04 fired | same — fix text must un-hide → clear → re-hide (raise the count, clear, restore) |
| R-07 | side | error | `htmlExport` blank | — | `htmlExport` |
| R-08 | task | error | `baseSideFeedback` or `testSideTurnBreakdown` blank | — | those two |
| R-09 | Test side | error | every `didTurnKHaveIssue` (K ≤ N) = `No` | R-04 fired; any `didTurnKHaveIssue` blank (G-01 owns it) | `didTurn1..5HaveIssue` — a submitted task is a loss by construction (doc: "For each successful Leakage loss or General loss…"); zero issue turns means no loss was recorded |

`setupChecksRequired`, `criticalRequirement`, `privacyGate` are platform progression gates with zero-option checkbox bodies — unbound (§16), with a render-verification row in §18.

---

## 5. Check register — gate cascades (G)

Transcribed from the config's own `displayCondition` expressions. Every gate is two checks: **required-when-shown** and **empty-when-hidden**. All G-checks run on the **Test side only** (§3: Base rubric is inert).

| ID | Sev | Shown when | Required-when-shown | Empty-when-hidden | Fields |
|---|---|---|---|---|---|
| G-01 | error | `numberOfTurns ≥ K` | `didTurnKHaveIssue` filled | filled for `K > numberOfTurns` → clear (un-hide fix) | `didTurn1..5HaveIssue` |
| G-02 | error | `didTurnKHaveIssue = Yes` | `turnKMemorySection` filled | filled while the gate answer is `No` → clear | `turn1..5MemorySection` |
| G-03 | error | `lossCategory = Leakage Loss` | `leakageCategorization` and `leakageEgregiousness` filled | either filled while `lossCategory = General Loss` → clear | `leakageCategorization` `leakageEgregiousness` |
| G-04 | error | `lossCategory = General Loss` | `generalLossCategorization` and `generalLossSeverity` filled | either filled while `lossCategory = Leakage Loss` → clear | `generalLossCategorization` `generalLossSeverity` |
| G-05 | error | `leakageCategorization = Other` | `leakageOtherDetails` filled | leftover clears | `leakageOtherDetails` |
| G-06 | error | `generalLossCategorization = Other General Loss` | `generalOtherDetails` filled | leftover clears | `generalOtherDetails` |

Enum membership (value not in the config's option list) is an error on any Test-side `SINGLE_CHOICE` above; blank is owned by the gate check.

---

## 6. Check register — artifact URL integrity (U)

Applies to `geminiTakeout`, and per side `htmlExport` and `debugInfoTurn1..5` — up to 14 links per task. Ported from 944 §6 unchanged except targets.

| ID | Sev | Trigger | Fix |
|---|---|---|---|
| U-01 | error | value contains any of `<ctrl99>` `LM prefix` `Agency config id` `Recipe ID` `num_turns_read_from_footprints` `BAS->` `reagent_trace` | pasted debug — upload the capture to the task's Drive folder, paste only the file link |
| U-02 | error | value contains any of `<!doctype` `<html` `<head` `<body` `<div` | pasted page source — upload the saved page, paste only the file link |
| U-03 | error | no `https?://` substring | paste the Drive share link |
| U-04 | error | more than one URL | keep one link per field |
| U-05 | warn | one URL with surrounding non-whitespace text | a bare link is easier to open; the link is still read |
| U-06 | error | URL matches `drive.google.com/.../folders/` | a folder cannot be tied to one turn — paste the file's own link |
| U-07 | warn | URL not on `drive.google.com` | not fetched (helper hard-rejects); logged, never escalated to F-01 |

Silent normalisation, never a finding: whitespace/newlines around a link.

---

## 7. Check register — Drive-id identity (D)

| ID | Sev | Trigger | Non-fire |
|---|---|---|---|
| D-01 | error | two or more artifact slots resolve to the same Drive file id | none — no field pair on this form is a sanctioned duplicate: per-turn debug are distinct captures, the two `htmlExport`s are distinct conversations, `geminiTakeout` is a third artifact. **Re-audit on any fork.** |

When the collision is per-turn debug on one side, the evidence line adds: *two different turns cannot produce the same debug capture.* When it is Test `htmlExport` vs Base `htmlExport`: *the Base branch is a separate conversation and exports separately, even though it contains the shared history.*

---

## 8. Fetch layer (L2)

Every §6-clean Drive file link is retrieved via the sandbox helper, all fetches issued concurrently (`Promise.allSettled`, build-asserted — no serial await loops), one retry on an empty/implausibly-short read. Timeout enforcement is host-side; the isolate has no timers (944 v2.0.1 incident — do not reintroduce `setTimeout`). HTML-shaped or escape-encoded fetches are decoded (entities, `\<`→`<`, backslash-escapes) before marker tests; literal markers found as-is mean *never decode*.

`geminiTakeout` is fetched but only classified (F-04) — a Takeout archive is a zip; content checks stop at "is it plausibly an archive / not a text paste".

---

## 9. Check register — fetched-artifact content (F)

| ID | Scope | Sev | Trigger | Non-fire |
|---|---|---|---|---|
| F-01 | any | error | a fetchable link fails to fetch (error / host timeout / permission) after one retry | U-family finding owns the field; blank field; U-07 host (logged, not fetched) |
| F-02 | side | error | fetched debug content contains **none** of `BAS->` `Agency config id` `Recipe ID` `<ctrl99>` `LM prefix` `num_turns_read_from_footprints` (post-decode) | fetch failed (F-01 owns it). **Note: no `Model ID:` marker on 945's execution path [proven]** — the v3.2.4 marker list is stale here |
| F-03 | side | error | fetched `htmlExport` contains none of `<!doctype` `<html` `<head` `<body` | fetch failed |
| F-04 | task | warn | fetched `geminiTakeout` is readable text that looks like neither an archive nor a Takeout JSON export | fetch failed |
| F-05 | side | error | Test side: per-file `<ctrl99>user` open-marker counts fit **neither** the flat shape (1 per file) nor the cumulative shape (turn *t* carries *t* markers). When a slot's count is **≤ the previous slot's**, the message says so directly — that slot documents no additional turn (v1.0.2; task 1267733's turn-2 capture held the same four prompts and the same role sequence as turn 1, differing only in latency telemetry, because the turn was cancelled). Role-independent: it compares a side's slots against each other | any contributing slot failed F-01/F-02; R-04 fired. Cumulative **[proven on both sides — §18 item 3: task 1267698's Test captures count 1/2/3/4/5]** |
| F-06 | task | error | Base debug's user-block count ≠ Test `numberOfTurns` | either side's debug failed F-01/F-02; R-04 fired. **[proven]:** the Base capture is the branch of turns 1..N−1 plus the bait prompt, so it carries exactly N user blocks — this replaces the retired eval-type shape check as the structural bait-turn invariant |
| F-07 | task | warn | two fetched artifacts with different Drive ids normalise to byte-identical content | either fetch failed. Warn, not D-01's error — a re-uploaded copy has no client ruling yet |
| F-09 | task | error | the debug captures show the sides **swapped**: the Base side holds a real multi-capture ladder (≥2 slots, turn *t* carrying *t* user blocks) while the Test side holds no ladder of its own and every Test capture carries exactly the Base side's full history. The conversation was run on the frozen baseline and the test model was merely baited, which measures nothing — the regression under test is in Mochi's memory build. **[proven on task 1267733]:** Prod Frozen 1/2/3/4, Mochi 4/4. Narrow by construction — a correct task has one Base capture, so the ladder clause alone rules it out. When it fires, F-05, F-06, A-04 and A-05 stand down (their findings would restate it); C-01 sits in Layer L1, which cannot see artifacts, so it may still report | either side's debug failed F-01/F-02; Base has fewer than 2 captures |
| F-08 | side | warn | `wasPContextTriggered = Yes` but the side's fetched debug nowhere contains `personal_context.retrieve_personal_data` **as a call** (outside declaration blocks); or `= No` but a call is present | fetch failed. QA rule 9 anchors the marker string and the call≠declaration rule; the call-marker's exact syntax on this execution path is unconfirmed (§18 item 5) — **promote to error once one triggered sample confirms the syntax** |

---

## 10. Check register — content anchoring (A)

**Restored on 945.** 944 removed Check A–D because its `prompt` field was a follow-up turn; on 945 the doctrine is re-proven: task 1267698's `prompt` field equals the first user block of the fetched Base debug byte-for-byte **[proven]**. All comparisons post-ladder (§2), containment omission-stripped.

| ID | Scope | Sev | Rule |
|---|---|---|---|
| A-01 | side | error | A fetched debug capture's first user block = form `prompt`. (Check A lineage; both sides — the Base branch replays the same turn 1.) Symmetric wording: either the form or the paste could be the wrong side. **Scope (v1.0.1 false-block guard):** applied to turn-1 captures, to every Test capture once F-05 has confirmed the cumulative shape, and always to the Base branch capture. On a FLAT export turn *t*'s file starts at prompt *t*, and applying A-01 there would false-block every later turn — the same shape tolerance F-05 already grants. Skipped captures are logged |
| A-02 | task | error | Test turn-N debug's **last** user block = Base debug's **last** user block (the bait prompt P(N); QA rule 4: "send only the exact same P(i)"). Normalised compare with a ≥90 % word-overlap tolerance tier that prints the percentage when it fires — the two captures re-render the same text (S3 defence) |
| A-03 | task | error | every user block of Test turn-N's capture **except the bait prompt itself** appears (containment) in the Base capture — the branch carries the whole shared history **[proven]**. Cross-side Check-C lineage. **The bait prompt is excluded (v1.0.1):** A-02 owns it and grants it a ≥90 % overlap tolerance tier; re-testing it here as hard containment would take that tolerance straight back. With Test N = 1 there is no shared history and A-03 is vacuous |
| A-04 | Test side | error | for turns t < N on the Test side: turn-t capture's user blocks appear in turn-N's capture (within-side history containment, cumulative shape) — fires only if F-05 confirmed the cumulative shape on that side |
| A-05 | side | error | Turn-1 capture's first user block = its last user block (Check D — a turn-1 capture holds one logical prompt). On the Base side this fires only when Test N = 1 |

## 11. Check register — identity (I) and coherence (C)

Identity anchor on 945 is the **`Agency config id`** string, not `Model ID:` (absent on this path — F-02 note).

| ID | Scope | Sev | Rule |
|---|---|---|---|
| I-01 | task | error | Base-side fetched debug's `Agency config id` contains `prod-frozen` **[proven: `…-prod-p13n-prod-frozen-baseline`]**; Test-side's does not. Either violation = a side pasted from the wrong model |
| I-02 | task | error | Test and Base `Agency config id` values are not equal (cross-side distinctness — v3.2.1 lineage). Test's string is now pinned (§18 item 4): `bard/gemini_chat/0.2.170-prod-p13n-memory-strike-0828-stm-v2p5-token-budget-rm-rrf-listwise-top-20`. The check tests `prod-frozen` presence and cross-side inequality, never the pinned literal, so a routine version bump does not false-block |
| I-03 | task | warn | `modelOrder` ≠ batch `First Model` (exact canonical). Warn, not error — the batch sheet may be the stale side (B-02 precedent) |
| C-01 | Test side | error | `didTurnNHaveIssue` (N = `numberOfTurns`) = `No` while some earlier turn = `Yes` — the protocol stops at the loss turn (rules 3 & 5), so a loss before N with clean turns after it means the rater kept prompting past the failure |
| C-02 | Test side | warn | `didTurnKHaveIssue = Yes` for some K < N while `didTurnNHaveIssue = Yes` too — legal (minor issue before the loss) but names the rule-5 question so the rater confirms the earlier Yes was not the loss itself |
| C-03 | Base side | warn | Base `numberOfTurns > 1` — QA rule 7 says "usually one turn"; more than one means prompts were sent after the comparison response (rule 5). Warn with self-confirm wording |
| C-04 | Test side | warn | `turnKMemorySection` offers **no** recognisable section among `Long Term Memory` / `Short Term Memory` / `Retrieved Memory` / `Explicit Memory` / `PContext tool output` (`Other`-shaped text allowed with a log). Two conventions are live and both must pass: **(a)** bare names one per line (`Retrieved Memory\nShort Term Memory`, task 1267698) and **(b)** a bracketed header followed by prose (`[Turn 1] - [Retrieved Memory]. The issue was caused by ...`, task 1267733). Candidates are the **bracketed tokens** minus the `[Turn K]` label, plus standalone lines short enough not to be prose (≤48 chars); rationale text is never a candidate. v1.0.1 split on newlines *and commas* and tested every fragment, warning on six prose pieces of a correctly-filled field — the check now fires only when a value names no section at all. Promote the field to a MULTI_SELECT via escalation E-5 |
| C-05 | Test side | warn | `testSideTurnBreakdown` lacks a `[Turn K]` label for some K ≤ N (client: "You **must** label each turn using the format [Turn X]"). Warn not error only because the label test is regex-loose (`\[Turn\s*K\]`, case-insensitive) and prose variants may be legitimate; promote after one batch of evidence |
| C-06 | Test side | warn | `lossCategory = Leakage Loss` and `leakageCategorization = Intent Hijack` while `testCoreTaskCompletion = Yes`; or `leakageCategorization = Harmless Callback` while `testCoreTaskCompletion = No` — the category definitions embed the core-task answer ("answered the completely wrong question" / "without derailing the prompt's intent"). Warn until the client confirms the implication is definitional (escalation E-6); do not promote without that sentence |
| C-07 | Test side | warn | `leakageCategorization = Harmless Callback` and `leakageEgregiousness = Not Egregious` — reachable combination that may not constitute a countable loss (open ruling E-6). Flag for the lead, never as a rater error |

**Deliberately absent:** any check comparing Base-side rubric values to Test's, or judging Base rubric coherence — §3's inert rule. When E-1 lands (rubric stripped from the SxS block or made Base-optional), delete the inert rule and this paragraph together.

---

## 12. Check register — assignment vs submission (B)

Self-skips with a **loud log** if the batch/input root does not resolve.

| ID | Sev | Rule | Comparison |
|---|---|---|---|
| B-01 | error | Both per-side namespaces must equal batch `Model A` / `Model B` in some order | exact canonical |
| B-02 | warn | form `prompt` should equal batch `prompt` when the batch carries one | normalised |
| — | — | **Withdrawn in v1.0.2:** B-01 no longer requires the Test namespace to equal batch `First Model`. That clause encoded the §1.1 display-order error and fired on task 1267733, a task whose namespaces were both correct. Display order is I-03's business, at warn. | — |
| B-03 | warn | batch `Model A HTML NAME` / `Model B HTML NAME` present but unverifiable against fetched content (see §14 item 1) — log-only reminder line, no finding | — |

---

## 13. Not this layer — routed to the QD pack

| Question | Owner |
|---|---|
| Is the claimed loss actually present in the Test response and absent from the Base response | QD-1 (loss evidence) |
| Does content from the named memory section appear in the Test debug **and** account for the difference (retrieval-present ≠ causal) | QD-1 |
| Does the chosen leakage / general-loss category fit its embedded client definition | QD-2 (taxonomy & severity fit) |
| Is the egregiousness / severity call consistent with the definitions and the evidence | QD-2 |
| Does the [Turn X] breakdown match the per-turn clicks; does the Base rationale address the same constraint the Test loss is about (like-for-like) | QD-3 (rationale coherence) |
| Does the rationale contradict any selection (e.g. rationale says Base clean while the forced Base rubric says loss — until E-1 lands, the QD reads only the Test rubric) | QD-3 |

## 14. Declared unverifiable — nobody can check these

| Item | Blocker | What would unblock it |
|---|---|---|
| `M1_D1_xxx` / `_Debuginfo_turnK` filename conventions | the fetch helper returns content, not Drive metadata | a metadata-capable helper (then: filename turn index vs slot, HTML NAME vs batch — both become errors) |
| Attempt count before the loss (leakage-first gating, "up to 5 attempts") | no field records attempts (escalation E-2) | an `attemptsBeforeLoss` field |
| Whether the leaked fact is genuinely from the rater's real memory / genuinely unrelated to the chat | ground truth is the rater's private account state | nothing — L0 by construction; the verifiability principle's ceiling |
| Fidelity of privacy substitutions/redactions in debug or HTML | hand-edited evidence is indistinguishable from original | a redaction policy that protects values but never section labels/structure (escalation E-4) |
| Whether the Test chat was deleted before the Base run | footprints counter drifted; deletion behaviour inconsistent | nothing deterministic; `criticalRequirement` checkbox is the self-attestation |

## 15. Removed on fork — deleted outright, never left to self-skip

| Inherited item (v3.2.4) | Status | Why |
|---|---|---|
| Footprints delta (Check 6 / W5–W6) | deleted | protocol **requires** inter-side deletion; the signal is dead by design, not merely drifted |
| MT/ST eval-type shape | deleted → replaced by F-06 | no eval-type field; the bait-turn invariant is the project's real shape rule |
| `Model ID:` extraction, within-side consistency, W2/W4 declared-identity | deleted → replaced by I-01/I-02 | no `Model ID:` line on this execution path **[proven]**; identity anchor is `Agency config id` |
| Check B (Turn N>1 last ≠ form prompt) | deleted | subsumed: A-02 pins the last block to the bait prompt directly; on a 1-turn Base side Check B's premise doesn't exist |
| Byte-identical culprit-selection heuristic | deleted | D-01/F-07 name the collision; with links not pastes, "which slot is wrong" is answered by A-01..A-05, not a heuristic |
| Omission-marker warning W1 | deleted, strip retained as no-op | marker strings unconfirmed for this export (§18 item 7) |

## 16. Coverage

50 checks over 38 writable fields. Bound: all except — `setupChecksRequired`, `criticalRequirement`, `privacyGate` (platform gates, zero-option render risk → §18 item 6), `bp1..bp3` (breakpoints, no value), and the 15 Base-side rubric fields (deliberately inert per §3 / E-1 — logged every run). Zero phantom keys: every key above exists in the 945 export.

## 17. Escalations — open

| # | Issue | Owner | Blocking? |
|---|---|---|---|
| E-1 | The 18 rubric fields sit inside the SxS block and are **mandatory on the Base side**, forcing every task to record a false "Base had a loss" (observed on task 1267698, where the Base record contradicts the Base rationale). Strip them from the SxS block or make them Base-optional | config owner | **yes** — every completed task carries forced-garbage fields until fixed |
| E-2 | No attempt-count field; the leakage-first rule (doc: 5 attempts; internal doc: 2; QA guidance: unnumbered) is unverifiable and self-contradictory | config + doc owner | no — declared L0 meanwhile |
| E-3 | Internal doc's Model A/B table inverts the config's mapping; plus fork residue (Personalization-only branching note, partial-debug redaction rule that would strip the memory sections, "15 days?" drafting question, "Model Ad on / Model Al" rename artifacts) | doc owner | no — QA guidance overrides it operationally, but the doc will keep re-teaching the inversion |
| E-4 | Privacy: free-form redaction (rule 12) vs memory-section attribution (rule 10) collide; Takeout upload of full account history sits beside the privacy note | doc owner / client | no — needs a "redact values, never section labels/structure" ruling |
| E-5 | `turnKMemorySection` is free text; convert to MULTI_SELECT with option strings copied **byte-exact from the Test debug's section labels** (pending §18 item 2) | config owner | no — C-04 canonicalises meanwhile |
| E-6 | Two rubric rulings: (a) is Core-Task↔category implication definitional (licenses promoting C-06); (b) does Harmless Callback + Not Egregious count toward the 50 losses | client | no — both warn meanwhile |
| E-7 | `wasPContextTriggered` should be derived from debug, not asked (F-08 already computes it) | config owner | no |
| ~~E-8~~ | **CLOSED 2026-09-03.** **Which model runs turns 1..N?** §1 fixes it (Test = model_A runs the conversation, Base is the bait branch), and task 1267698 follows that. Task 1267733 inverts it: the frozen baseline ran the 4-turn conversation and the test model took the bait branch, with the rater's own write-ups consistent throughout — i.e. this is not a slip in one field but a whole task run the other way round. Either it is a protocol violation (the E-3 inversion landing in production, and the validator must block it) or the study rotates which model is baited (and §1/§1.1/§3 all need rewriting onto order-derived roles). **Ruling: the roles are fixed** — always start on Model A (Mochi), always branch the bait prompt and history to Model B (Prod Frozen). Task 1267733 is therefore a genuine protocol violation. Registered as **F-09** (§9), which detects it from the debug captures rather than from the batch sheet; §3's inert-Base-rubric rule stands as written, and 1267733's differentiated Base rubric is a symptom of the inversion, not a counterexample to E-1 | QA lead | closed |

## 18. First-task verification — RESULTS

All nine artifacts of task 1267698 were fetched and read (`golden/artifacts/`). Every row below
is now measured, not assumed. The validator still logs each of these on every run, so a change of
shape self-diagnoses from the tool's run log instead of needing a local repro.

| # | Assumption | Result |
|---|---|---|
| 1 | Per-side key shape, split-at-last-`.` safe | **CONFIRMED.** The runtime shape is `compareBaseAndTest.<model name>.<key>` under `conversation.ratings` (object map key → `{value}`); the model names carry ` - ` but no `.`, so splitting at the last `.` is safe. Batch axes sit at `conversation.input`. The run logs every discovered namespace |
| 2 | Test-side debug carries labelled Memory-Block sections (the G12 question) | **PARTIAL.** The Test captures carry `# User Summary`, `# User Correction Ledger`, `# User Recent Conversations` and `# Retrieved Memory`; the Base capture carries only the first two. There is no literal `Short Term Memory` / `Long Term Memory` section header on this path, though the rater's answer on 1267698 names both. C-04's canonical list is therefore the CLIENT taxonomy, not the debug labels, and stays at warn; E-5's option strings must be settled with the client before the field becomes a MULTI_SELECT |
| 3 | Test debug is cumulative (turn *t* carries *t* user blocks) | **CONFIRMED.** 1/2/3/4/5 across `debugInfoTurn1..5`; the Base capture carries 5 for Test N = 5. F-05 still accepts the flat shape as well, and A-01/A-04 are scoped to the confirmed shape (§10) so a flat export cannot false-block |
| 4 | Test `Agency config id` string | **PINNED.** Test `bard/gemini_chat/0.2.170-prod-p13n-memory-strike-0828-stm-v2p5-token-budget-rm-rrf-listwise-top-20`; Base `bard/gemini_chat/0.2.149-prod-p13n-prod-frozen-baseline`. I-01 tests only for `prod-frozen`, I-02 only for cross-side inequality — neither pins the literal, so a version bump is not a finding |
| 5 | PContext **call** marker syntax | **REFINED, still warn.** The path spells the tool `personal_context:retrieve_personal_data` (colon, not the dot QA rule 9 quotes). Both occurrences on 1267698 are non-calls: one backticked mention in the system prefix's "When to call" prose, one `<ctrl40>declaration:` block. F-08 accepts either separator and discards backticked and `declaration:`-prefixed occurrences; it counted 0 calls against a declared "No" on both sides. It stays **warn** until one genuinely triggered task shows the call form |
| 6 | Zero-option checkboxes (`setupChecksRequired`, `criticalRequirement`, `privacyGate`) render and gate | **NON-BLOCKING.** Task 1267698 submitted with all three `true`. They stay unbound (§16); escalate same day if one ever locks |
| 7 | Omission-marker strings for this export family | **NONE OBSERVED** across all nine artifacts. §2 step 1 stays a no-op strip; if A-03 ever fires with a marker visible in the evidence line, add the string there |
| 8 | Fetch stage inside the 30 s script budget | **BOUNDED, unmeasured live.** Nine concurrent fetches, of which two are 4 MB HTML pages and one a 1.1 MB Takeout JSON. No fetched artifact's full text is retained: debug captures reduce to their user blocks plus two scalars, HTML and Takeout to a bounded prefix and a fingerprint (the 944 v2.0.4 memory incident) |

## 19. Regression cases

| Task / fixture | Class | Checks |
|---|---|---|
| `golden/1267698.txt` + `golden/artifacts/` | first completed task, all nine artifacts fetched; forced Base rubric contradiction (inert rule produces **zero** Base-rubric findings); Base debug = 5 user blocks vs Test N=5 (F-06 non-fire); `prompt` = first user block byte-for-byte (A-01 non-fire); cumulative Test export 1/2/3/4/5 (F-05 non-fire); memory-section multi-line free text (C-04 non-fire) — **runs clean, 0 errors, 0 warnings** | §3 inert rule, F-05, F-06, A-01..A-05, I-01, I-02, C-04 |
| fixture `DBG_B3` | Base debug user-count ≠ Test N | F-06 fire |
| fixture `DBG_B_TYPO` | bait prompt retyped with a typo on the Base side | A-02 warn tier, overlap % printed, no error |
| fixture `DBG_T5_PCTX` | a PContext call present against a declared "No" (and the reverse) | F-08 both directions, §18 item 5 |
| fixtures `DBG_F1..DBG_F5` | a FLAT Test export | F-05 non-fire, A-01 scoped out, A-04 skipped |
| `golden/1267733.txt` + its artifacts | second completed task, and a **genuine protocol violation**: run on the frozen baseline and baited on the test model. Expected to FAIL, on F-09 plus C-01. Also pins display order flipped (B-01 silent, I-03 warns), the `[Turn K] - [Section]` memory-section convention (C-04 non-fire), and F-05/F-06/A-05 standing down behind F-09 | F-09, I-03, B-01, C-04 |
| fixture `DBG_T4B` | a slot holding the previous slot's prompt set, telemetry-only byte difference | F-05 "no additional turn" fire |
| fixture `DBG_ESC` | Drive text rendering with `\<ctrl99\>` escapes — must parse | §2 decode, F-02/F-05 non-fire |

A real triggered-PContext task and a real flat-export task are still wanted; the fixtures above
stand in for them until one arrives.

## 20. Message contract

```
[<side label> — "<on-screen field label>"]
  Problem: one sentence naming what is wrong
  Fix:     verb-first, executable with zero knowledge of how validation works
  Why:     the evidence — the two values, the file id, the counts, the overlap %
```

On-screen labels from the payload (including the residue labels §1.1 notes), never keys. Per-field merge with `Also:`, actions fuzzy-deduped on the first 40 chars. No internal language in output. Never advise deleting something another rule requires; never demand a state the platform refuses. The Problem sentence is the triage identifier — the rater-facing error reference is generated from these sentences and versioned with them.

## 21. Build discipline

Assertion-guarded builder from this file; zero phantom keys against the 945 universe; every check ID present exactly once; every skip logs; version string in the completion log; all fetches concurrent (build-asserted, no serial await loops); rebuild twice, diff hashes; one registrable file in outputs; smoke scenario per family + adversarial per check + the near-miss non-fire for every check where a false block is plausible (A-02's overlap tier, C-02, F-05's cumulative shape, the §3 inert rule). Changelog entries name the incident that forced them.

## 21.1 Build and layout

```
config/project-config-id-945.json   the form config export -- the source of field truth
config/form-spec-945.json           GENERATED from it by the builder (labels, options, key sets)
parts/redteam-checks.js             Layer L1  -> validateRedTeamL1        (R G U D I-03 C B)
parts/redteam-fetch-checks.js       Layer L2  -> validateRedTeamFetchLayer (F A I-01 I-02)
validation.js                       GENERATED -- the one registrable file. Never hand-edited
fixtures/gen-cases.mjs              generates fixtures/cases.json AND fixtures/artifacts/
golden/1267698.txt + golden/artifacts/   the first completed task and its nine real artifacts
```

### 21.2 WAF-safe output

The tool's save endpoint sits behind a web application firewall that scores request bodies for
HTML-injection signatures, and it rejects a deployable whose bytes carry HTML tag openers
(`<body`, `<html`, …), HTML entities (`&lt;`, `&#39;`, …) or a mixed quote run. The parts write
every such marker with `\x3c` / `\x26` escapes — identical strings once JS parses them,
invisible to a signature engine — and the builder asserts the composed output carries none of the
raw sequences, comments included. Do not "tidy" those escapes back into plain literals.

Rebuild with `node scripts/build-945.mjs`; test with `npm test` (65 fixtures) and
`node scripts/run-golden.mjs labeling-g/945-stm-v2-red-teaming-evals-en-us`. The builder asserts:
every register ID present and owned by exactly one part, zero phantom keys, zero uncovered
writable keys, concurrent fetches with no serial await loop, no in-script timers, 7-bit ASCII
output under 100 KB that survives `new Function`, and a rebuild-twice hash diff.

## 22. Changelog

- **v1.0.9** — Two rater-reported false warnings on live tasks, one root cause: both compared
  against the batch sheet's `First Model` column, which is randomised display order (§1.1, proven
  on 1267733), while policy fixes the form's "First model shown" to the Test model — so the column
  disagrees with correct work about half the time by construction. **I-03 is demoted to a log**
  (it compares run order against display order: different quantities, no rater action). **The
  protocol first-model warning is removed outright** -- both arms. "First model shown" records
  what the tool displayed, in the batch column and the form alike, and never asserted run order:
  task 1267704 is a textbook-correct submission (Mochi ran and lost, the bait branched to Prod
  Frozen, Base at Loss Category N/A) whose rater truthfully set that field to Prod Frozen because
  that is what the platform showed. Third fix, from task 1267723: the v1.0.6
  injected-block rule ate a rater's only real prompt, because the model forwarded the 26-character
  bait to `google:search` verbatim and it therefore appeared as a tool argument. The drop is now
  **positional — the first surviving user block is never dropped** — which can neither zero out a
  capture nor inflate one, where a content-based "keep it if it equals the typed prompt" rule
  would leave the mirror-image hole. This bug selectively hit short turn-1 baits, which the guide
  encourages. A genuinely inverted run
  remains F-09's, on the debug captures. Separately, v1.0.4–v1.0.8 were re-imported into `parts/`
  — they had been edited into the built file only, so any rebuild would have reverted them — and
  C-12/C-13/C-14 gained the ID labels their v1.0.7 logic shipped without (register now 53).
- **v1.0.3** — **E-8 ruled: the roles are fixed.** Always start the conversation on Model A
  (Mochi) and continue until it makes the mistake — that is the bait prompt — then branch the
  bait prompt and the history to Model B (Prod Frozen). Task 1267733 is therefore a genuine
  protocol violation, not a legitimate rotation, and §1 now states the rule outright. New check
  **F-09** blocks it, detected from the cross-side shape of the debug captures (Base holding a
  real 1/2/3/… ladder while every Test capture carries the whole history) rather than from a
  spreadsheet column, so a wrong batch column alone cannot cause rework. F-05, F-06, A-04 and
  A-05 stand down when it fires. I-03 gains a warning when `First Model` is not model_A, at warn
  for the same reason. §3's inert-Base-rubric rule stands: 1267733's substantive Base rubric is a
  symptom of the inversion, not a counterexample to E-1. Register is now 50 checks.
- **v1.0.2** — Second completed task (1267733) read end to end against its artifacts. Three
  corrections, all forced by that evidence. (1) **§1.1: `First Model` is display order, not a
  role.** v1.0.0 treated it as a second anchor on the Test role because task 1267698 happened to
  have them agree; 1267733 assigns the frozen baseline first, so B-01's "Test must equal First
  Model" clause is withdrawn — it fired on a task whose namespaces were both correct, and as
  written would block every task whose display order flipped. I-03 keeps display order, at warn.
  (2) **C-04 no longer shreds prose**: `[Turn K] - [Section]. rationale` is a live convention and
  the v1.0.1 comma-split warned on six fragments of a correctly-filled field; candidates are now
  bracketed tokens plus short standalone lines. (3) **F-05 names its commonest sub-case**: a slot
  whose capture holds no prompt the previous slot lacks documents no additional turn — 1267733's
  turn-2 capture repeated turn 1's four prompts and role sequence, differing only in latency
  telemetry, because the turn was cancelled. Registered **E-8**: 1267733 runs the conversation on
  the frozen baseline and baits the test model, inverting §1's study shape; the validator keeps
  the fixed mapping until the QA lead rules, so that task still reports the inversion's
  consequences. Also: all HTML tag/entity byte sequences moved to `\x3c`/`\x26` escapes after
  the tool's WAF blocked the deployable (§21.2), builder-asserted.
- **v1.0.1** — First build (`redteam-stm-validator-945` v1.0.0) plus the §18 verification pass
  against all nine of task 1267698's artifacts. Results in §18: cumulative Test export confirmed,
  both `Agency config id` strings pinned, PContext call syntax refined to accept `:` as well as
  `.` (still warn), no omission markers on this export family, and the Memory-Block section
  labels found to differ from the client taxonomy C-04 canonicalises against (E-5 stays open).
  Two scoping refinements forced by the same evidence, both false-block guards: A-01 applies only
  where a capture actually replays turn 1 (turn-1 files, a confirmed-cumulative Test side, the
  Base branch), and A-03 excludes the bait prompt so A-02's ≥90 % overlap tolerance is not undone
  by a hard containment test on the same bytes. Per-side field count corrected to 27.
- **v1.0.0 (spec)** — Initial register: R×9, G×6, U×7, D×1, F×8, A×5, I×3, C×7, B×3 (49 checks), derived from config 945 final, the client + internal docs, QA rules 1–13, and task 1267698 with a fetched real Base debug. Content-anchoring restored (A-family) on same-project proof; identity re-anchored on `Agency config id` (no `Model ID:` on this path); eval-type shape replaced by the bait-turn invariant F-06; footprints deleted as dead-by-design; Base rubric declared inert pending E-1.
