# Validation Requirements - P13n Response Quality E2E Eval, projects 941 (es-419) and 942 (zh-CN)

**Status:** requirements ledger, pre-build. Nothing here is code. Every check carries an anchor, a severity, non-fire conditions, and a verification status. Checks marked UNPROVEN rest on a runtime assumption that only a live task export can settle; they ship at warning tier with a loud log until the first-task table (section 9) is worked.

**Fork base:** project 939 build (0824-v1.1.1-continuity-en-us = continuity F1-F7 layer + embedded 903 v3.2.33 debug/HTML/identity pipeline). Not raw v3.2.4.

**Sources of requirement (in order of authority):**
- R1 Client doc: Internal Turing copy, [MT Chat] Personalization Response Quality E2E Eval (0P + 1P), Template 0701 sections: Setup Instructions [1P], Additional Instruction (debug sharing), Rater Guidelines, Task (Pre-Conversation, Post-Conversation, SxS, Global raters), Submission Guidelines, Note on Privacy, Cleanup Instructions.
- R2 Client flow diagram (embedded image in the doc): Pre-Conversation questions -> Conversation A (up to 5 turns) -> Post-Conversation questions -> Clean up -> Conversation B -> Post-Conversation questions -> Clean up -> SxS Questions. Test/Base mapped to A/B evenly at random.
- R3 project-config-id-941.json (review-criteria 3780, 65 fields). 942 declared identical by the lead; to be machine-diffed on receipt.
- R4 The 939 production artifacts (validator v1.1.1 and QD pack) as a source of paid-for learnings, never as a source of requirements.

**Document date:** 9 Sep 2026 (v1.1 - client-example audit applied; see client-coverage-audit.md).

---

## 1. Facts the build stands on

| # | Fact | Source | Status |
|---|---|---|---|
| 1 | Two-sided SxS, 1 to 5 turns per side, same starting prompt on both sides, single Pre-Conversation block per task | R1 Task Overview, R2 | Proven (doc) |
| 2 | Side A completes fully (conversation, rubric, cleanup) before side B starts; cleanup = delete the previous model's chat | R2, R3 `secondModelLock` description | Proven (doc + config) |
| 3 | Pre-conversation answers are locked by `preQuestionsBreakpoint` before the conversation | R3 | Proven (config) |
| 4 | Per-side fields arrive namespaced `compareModels.<model name>.<key>`; 51 per-side keys; 13 top-level keys | R3, R4 payload shape | Config proven; runtime bytes UNPROVEN until first export |
| 5 | Model names, byte-exact: model_A = `Mode 23 -> Ramen (top-20) - Fast` (Test), model_B = `Mode 23 -> Prod Frozen - Fast` (Base). Both ASCII arrow, no leading or trailing spaces | R3 sideBySide; Test/Base roles from the 0824 tab | Names proven; roles consistent-but-unproven (Model ID strings blank in the tab) |
| 6 | Debug and HTML fields hold Google Drive file links to files uploaded into batch destination folders; content is fetched at validation time | R4 (939 runs this protocol); R3 description text "DESTINATION FOLDER"; R3 `privacyGate` wording "The HTML preview is rendering correctly" (a link that previews) | Consistent on three signals, UNPROVEN until the first export |
| 7 | Partial debug is client-sanctioned unless the rater selected Very dissatisfied or Somewhat dissatisfied on 7a or 7b; sanctioned slices differ by routing path (Agency vs ALS) | R1 Additional Instruction | Proven (doc); slice contents UNPROVEN on Mode 23 |
| 8 | PII redaction is allowed with placeholder replacement (e.g. "[full name]"), never bare deletion | R1 What You'll Assess, Note on Privacy | Proven (doc) |
| 9 | All 10 severity heads are always shown (no Q1 gate); Minor/Major unlocks category, turns, detraction, i18n explanation | R3 displayConditions | Proven (config) |
| 10 | i18n block (8a to 11b) is per-side, required for every rater; 8a has no N/A option | R3 | Proven (config) |
| 11 | The 50:50 Test/Base flip is a presentation behavior; how it lands in exported data is unknown | R1 New Eval Job Template note | UNPROVEN |
| 12 | `formData.ratings` holds only answered fields; unanswered keys are missing or null. filled() is the only valid presence test | R4 | Proven on 939 runtime |
| 13 | Q1 = "Not Personalized" followed by N/A on the heads that offer it is the instructed compliant pattern (doc note: "You still need to read through the following questions even if you select Not Personalized"). No check may treat that pattern as a defect | R1 Q1 note; R3 heads always shown | Proven (doc + config) |

---

## 2. Payload adapter requirements (not checks; failures route to the lead)

| ID | Requirement | On failure |
|---|---|---|
| A-01 | Resolve ratings root through the fallback chain: `conversation.ratings`, `task_data.formData.ratings`, `raw_data.formData.ratings`, `ratings`. Accept object shape (keyed) and array shape (`{key, human_input_value}`) | Error `[ROUTE TO LEAD] Form answers not locatable` and stop |
| A-02 | Resolve metadata root (`conversation.input`, `task_data.formData.input`, `raw_data.formData.input`, `csv_data`) and log which resolved. Batch-layer checks (F7) self-skip with a loud log when absent | Log, never a rater error |
| A-03 | Enumerate every `compareModels.<ns>.<key>` namespace and log `ALL COMPARE MODEL NAMESPACES` on every run | Log |
| A-04 | Bind Test and Base sides by exact canonical match of namespace to the two configured model names (arrow variants `->`, `→`, `⇒` unified, whitespace collapsed, case-folded). Never bind from csv `Model A` / `Model B` (run-order columns on 939). Never bind by position | Neither bound: `[ABORT]` error listing namespaces. One bound: `[BINDING]` error, use leftover, continue |
| A-05 | Unwrap `{value}` objects; treat null, "", [], bare "None" as unanswered | - |
| A-06 | Normalize fetched text at ingestion: CRLF to LF, strip UTF-8 BOM, decode order utf-8 strict then cp1252 then latin-1 (never errors=replace into a comparator); count and log U+FFFD occurrences per slot | Log per slot |
| A-07 | Version string in the completion log line; changelog names the incident behind every change | - |
| A-08 | Every finding anchored on a linked field appends `| File: <full Drive URL as submitted>` so a QA can act without opening the task | - |

---

## 3. Check catalog

Severity policy: **Error** blocks when the defect makes downstream validation meaningless or the data unusable and the rater can fix it with certainty. **Warning** informs when the signal is probabilistic, may be system-side, or the right action depends on something only the rater knows. Prerequisites that would silently disable other checks are errors.

Status codes: CARRY (from 939 unchanged), ADAPT (from 939 with a named change), NEW (941/942 only), REMOVED (see section 4).

### F1 Completeness

| ID | Check | Severity | Anchor | Non-fire / notes | Status |
|---|---|---|---|---|---|
| F1-01 | Task-level required fields present: `prompt`, `conversationalGoal`, `personalizationExpectation`, `firstModel`, `targetLanguage`, `dialect`, `qualityComparisonSxS`, `qualityComparisonSxSRationale` | Error | R1 Pre-1, Pre-2, SxS 1a/1b; R3 required | One finding per empty field, on-screen label | CARRY |
| F1-02 | Attestation checkboxes true: `setupCheck`, `privacyGate` (task), `secondModelLock` (per side) | Error | R3 descriptions; R2 cleanup step | Fix text quotes the checkbox's own wording | CARRY |
| F1-03 | Per-side required heads present: `numberOfTurns`, Q1 triggering, all 10 severity heads, 7a, 7b, 7c, 8a, 9a, 10a, 11a, HTML link | Error | R1 rubric; R3 (no Q1 gate) | 939 gated heads on Q1; 941/942 do not | ADAPT |
| F1-04 | Turn count present and in 1..5 | Error | R1 Task Overview; R3 options | Prerequisite for F1-05, F2-05, F6-02 | CARRY |
| F1-05 | Declared N turns but debug slots 1..N not all filled: one consolidated per-side error listing the empty turns | Error | R1 "Debug Info for each turn" | Turn 1 is required (939 spec had it optional; not carried) | ADAPT |
| F1-06 | SxS winner or SxS rationale empty | Error | R1 SxS 1a/1b | - | CARRY |
| F1-07 | 7c rationale empty on a side | Error | R1 7c | Length is never checked; emptiness only | CARRY |

### F2 Gate cascades (both directions, from R3 displayConditions)

| ID | Check | Severity | Anchor | Non-fire / notes | Status |
|---|---|---|---|---|---|
| F2-01 | Parent head = Minor issues or Major issues and Category child empty (2a, 2b, 2c, 2d, 3b, 4a, 4b, 5a, 6a) | Error | R3 | 3a has no category child | CARRY |
| F2-02 | Parent head = Minor/Major and Turns child empty (all 10 heads) | Error | R3 | - | CARRY |
| F2-03 | Parent head = Minor/Major and Detraction child empty (2c, 4b only) | Error | R3 | - | CARRY |
| F2-04 | Child filled while parent is not Minor/Major (hidden-and-non-empty). One finding per child, with the un-hide, clear, re-hide fix | Error | R3; Validator Guide F2 | The rater cannot see the stale value; fix text must walk them through it | CARRY |
| F2-05 | Debug slot filled beyond declared N (stale hidden slot); consolidated per side | Error | R3 slot conditions | Fix: set count up, clear, set back | CARRY |
| F2-06 | i18n head = Minor Issue(s) or Major Issue(s) and explanation child empty (8b, 9b, 10b, 11b); and the reverse (explanation filled while head is No Issues, Not relevant, or N/A) | Error | R3 | Spelling differs from the rubric heads: `Minor Issue(s)` not `Minor issues`. 10b is SINGLE_CHOICE, the other three are FREE_TEXT | NEW |
| F2-07 | `bp2` (top-level) references per-side `numberOfTurns`. Log whether it resolved; no finding | Log | R3 | First-task row | NEW |

### F3 Artifact integrity (links and fetched content)

| ID | Check | Severity | Anchor | Non-fire / notes | Status |
|---|---|---|---|---|---|
| F3-01 | Each debug and HTML field holds exactly one Google Drive file link and nothing else. Variants: no link; more than one link; link plus extra text; Drive folder link (detect "batch destination folder pasted unchanged" when it equals the csv folder); Drive URL without a file id | Error | Fact 6 (UNPROVEN) | Non-Drive host: Warning only. If ops confirms a paste protocol instead, this family inverts (paste expected, link is the violation) | ADAPT |
| F3-02 | Same Drive file id in two places: two turns of one side; the two sides; a debug slot and an HTML slot | Error | Submission protocol | Canonical id compared, full URL displayed | CARRY |
| F3-03 | Fetch failure classified: sharing/permission/404 = Error with the share-with-service-account fix (address held in one constant, verified on the harness before deploy); auth/OAuth/platform failure = routed to lead, never a rater finding. Content checks for that slot skip | Error / Log | Validator Guide 7.6 | - | CARRY |
| F3-04 | Fetched debug carries Gemini debug markers. Marker set re-derived from Mode 23 captures at first task; must not require `Model ID:` (Mode 23 may emit `Recipe ID:` / `Agency config id:`). Zero markers = wrong file | Error | R1 debug sharing sections | Formats: RTF detected and decoded (format error, content still analysed); HTML/Doc export that decodes silently passes; .docx/binary = error. Read-if-readable | ADAPT |
| F3-05 | Debug has header markers but zero `<ctrl99>user` blocks: re-fetch once; if reproduced, error worded for both causes (truncated file / incomplete download) | Error | 903 v3.2.31 | Both sanctioned slices contain the LM prefix, so user blocks are expected in every legal slice | CARRY |
| F3-06 | Classify every fetched debug as FULL / AGENCY-SLICE / ALS-SLICE / UNKNOWN by its markers; log per slot. Drives F6-06 and F5 availability | Log | R1 Additional Instruction | Three states everywhere downstream: present / absent-from-artifact / out-of-sanctioned-slice. Only the first two are reportable | NEW |
| F3-07 | HTML file fetches and is a saved Gemini conversation page (HTML content present; Gemini page markers present) | Error | R1 Submission "Conversation Link (HTML)" | - | CARRY |
| F3-08 | HTML page contains the form prompt (normalized ladder, section 5), with a word-overlap tolerance tier of at least 90% whose percentage is printed when it fires | Error | R1 (HTML is a copy of the conversation) | Redaction placeholders tolerated (Fact 8) | ADAPT |
| F3-09 | Mode-selector label on the saved page identifies the side's model. Compare the discriminating suffix after the codename layer is stripped (Gemini UI shows "Nippon - Prod Frozen - Fast"; form shows "Mode 23 -> Prod Frozen - Fast"). Fire only when suffixes differ (genuine swap). Both HTMLs swapped = one finding naming both | Error | 903 v3.2.33; 939 v1.1.1 | Extractor prefers the trailing quoted segment of the aria-label sentence (straight, curly, CJK quotes) | CARRY |
| F3-10 | Each turn's user question from the debug appears in that side's HTML (multi-turn coverage) | Error | Same-chat requirement | Overlap tier as F3-08 | CARRY |
| F3-11 | Both sides' HTML carry the same prompt and the same response text = one chat submitted for both sides | Error | R2 (two conversations) | Text identity is suggestive; a different conversation id or mode label on the page is decisive and suppresses | CARRY |

### F4 Content anchoring (fetched debug text; all compares through the ladder in section 5)

| ID | Check | Severity | Anchor | Non-fire / notes | Status |
|---|---|---|---|---|---|
| F4-A | Every turn's first `<ctrl99>user` block equals the form prompt. Symmetric wording (either side could be wrong). **Live on 941/942** - the 939 v1.1.1 blanket suppression is not carried | Error | R1 Pre-Conversation ("after you put down your first prompt"); R2 single Pre-Conversation node | Enforces cross-side Turn 1 identity transitively. If ops confirms a follow-up-prompt protocol for these batches, this becomes a ruling, not a suppression | ADAPT |
| F4-B | Turn N>1 last user block equals the form prompt | Warning | R1 (rater may retype); Error Reference W3 | 898's error severity is not inherited | ADAPT |
| F4-C | Turn N-1 last user block appears in Turn N's debug (containment after omission-marker strip AND whitespace normalization - the H5 fix; U+FFFD stripped; overlap tier at least 90% with the percentage printed) | Error | Conversation continuity | Skips when either slot is unreadable | ADAPT |
| F4-D | Turn 1 first user block equals its last user block | Error | Turn 1 is single-prompt | - | CARRY |
| F4-E | Two debug slots with byte-identical fetched content (any side, any turn); culprit chosen by content (which slot's last user block matches its expected position) | Error | Each turn is its own export | - | CARRY |
| F4-F | Both sides' Turn 1 debug identical in prompt and response = one chat used for both sides | Error | R2 | Same suppression rule as F3-11 | CARRY |
| F4-G | Footprints delta between the first-run side's Turn 1 and the second-run side's Turn 1 (run order from `firstModel`) greater than 0 | Warning | R2 cleanup step; `secondModelLock` attestation | Drifted signal (v3.2.3). Wording quotes the attestation the rater signed and asks them to confirm. Only when both slices carry footprints. Planned replacement: side B Turn 1 prefix carrying side A later-turn content, context-qualified (never the shared starting prompt) | CARRY |
| F4-H | Footprints delta less than 0 | Warning | - | "First Model" may be reversed; one-field fix | CARRY |

### F5 Identity

| ID | Check | Severity | Anchor | Non-fire / notes | Status |
|---|---|---|---|---|---|
| F5-01 | Model ID lines within one side consistent across turns | Error | One model per side | Only when the sanctioned slice carries a Model ID line (F3-06). Otherwise log "identity dormant on this slot" | CARRY |
| F5-02 | Test and Base report the same Model ID | Error | Two variants by definition | Same availability rule | CARRY |
| F5-03 | Side's Model ID vs the identity table entry for its platform name | Warning until the table is proven on the first batch, then Error | 0824 tab (Model ID cells blank) | Table ships EMPTY, marked unconfirmed; populated from the first task's captures; every unexpected value logged with the observed string | ADAPT |
| F5-04 | `firstModel` value is one of the two configured names (enum) | Error | R3 | Config drift otherwise; route to lead | CARRY |
| F5-05 | `firstModel` vs assigned First Model in batch metadata, when present | Error | 903 v3.2.12 | Self-skips with log when metadata lacks it | CARRY |
| F5-06 | Namespace vs csv Model A / Model B | Log only | 939 learning: those columns follow run order | Never a finding | REMOVED as a check |

### F6 Coherence matrices (byte-decidable, by the client's own vocabulary)

| ID | Check | Severity | Anchor | Non-fire / notes | Status |
|---|---|---|---|---|---|
| F6-01 | Q1 selects "Not Personalized" together with any Personalized option | Error | R1 Q1 option definitions | Contradictory by definition | CARRY |
| F6-02 | Turns multi-select cites a turn greater than the declared count | Error | R1 "Which turns"; R3 | - | CARRY |
| F6-03 | Turns multi-select mixes "N/A" with turn numbers | Warning | R3 offers N/A | N/A alone on a Minor/Major head is legal until the client rules otherwise | CARRY |
| F6-04 | 7c cites [Turn N] with N greater than the declared count | Warning | R1 7c | Citation regex generous: half- and full-width brackets, case-insensitive "turn"; localized tokens pending ruling (section 8) | ADAPT |
| F6-05 | 7c is non-empty and contains zero turn citations. Wording differs by context: when a head is at Minor/Major, the fix says the flagged issue must be explained under its turn; otherwise it quotes the doc's "for each point ... start with the turn number in square brackets" | Warning | R1 7c: every point, positive or negative, starts with [Turn N] | Format only; substance is QD territory. Never checks how many points or whether each has a citation, only zero-vs-some | ADAPT |
| F6-06 | 7a or 7b is Very dissatisfied or Somewhat dissatisfied and any debug slot on that side is classified as a partial slice (F3-06) | Warning | R1 Additional Instruction (full debug when dissatisfied) | Doc wording says "Dissatisfied"; the scale says "Somewhat dissatisfied" - ruling needed before promotion. Doc references "Holistic 1a/1b", stale labels for 7a/7b | ADAPT |
| F6-07 | 4a category "Didn't ground/attribute for sensitive info" selected and 5a is not Minor/Major | Warning | R1 4a: "(If you select this, also flag the issue in 5a.)" | Quote the doc instruction in the Why. Moved from the QD layer (byte-decidable) | NEW |
| F6-08 | Q1 = Not Personalized only, and 2c or 4b is Minor/Major (both define N/A as "the response wasn't personalized") | Warning | R1 2c and 4b N/A text | Symmetric wording: Q1 or the head may be the wrong one | NEW |
| F6-09 | Enum value not in the configured option set. Canonical variants (whitespace, case, straight vs curly apostrophe, short "N/A" vs long label) are equal and logged, never flagged. Genuinely unknown values route to the lead (config drift) | Error (lead) | R3 | Parse on our side; never rework a rater for a quote glyph | ADAPT |
| F6-10 | Turn-count shape from batch rater instruction when present: multi-turn instruction with 1 turn = Warning (doc allows stopping when the goal is met); single-turn instruction with more than 1 turn = Error | Warning / Error | R1 Task Overview; batch metadata | Self-skips when metadata lacks the instruction. No Eval Type field exists (see section 4) | CARRY |
| F6-11 | The literal token "redacted" (any case, bracketed or not) appears in the prompt, goal, a rationale, or a fetched artifact | Warning | R1 PII redaction: "replace it with what it was (e.g. [full name]) - not just delete it or put 'redacted'" | Quote the doc rule in the Why. Never fires on descriptive placeholders such as [full name], [city], [granddaughter's name]. The rater decides what to redact; only the bare token is the violation | NEW |

### F7 Batch and metadata

| ID | Check | Severity | Anchor | Non-fire / notes | Status |
|---|---|---|---|---|---|
| F7-01 | `targetLanguage` / `dialect` vs the project's assigned locale (941: Spanish, LatAm variants; 942: Chinese, Mainland Simplified) | Warning | Project assignment (external constant, header-marked) | No locale marker exists in the config; the expected value is supplied, not derived. Promotion to Error only on a client ruling that the field is a hard assignment | NEW |
| F7-02 | Prompt Type present in metadata (presence only; fit is QD territory) | Log | R1 "You'll be assigned one type per task" | Missing = platform/metadata issue | NEW |
| F7-03 | **Test side only**, Turn-1 FULL share: `sian_profile` chapter present with the sources the doc's verification step names: `SEARCH`, `GMAIL`, `PHOTOS`, `BARD_NOT_PERSONALIZED_USING_FIRST_PARTY_DATA` (Gemini history). YouTube is enabled as a toggle but is not in the doc's verification list: log its presence, never require it | Warning | R1 Setup "Verify for the Test model" | Only on FULL slices; never on the Base side (the doc verifies the Test model only). Exact chapter and source spellings re-confirmed on the first capture | ADAPT |
| F7-04 | Attribution branch mode (metadata L2 or rater instruction indicating branch + second-turn scope): the branched side has no Turn 1 of its own; Turn 1 checks exempt on that side | Conditional | R1 Additional Instruction ("branch ... only used for Personal Info Retrieval -> Attribution Prompt") | Data-driven; dormant unless metadata triggers it; logged when active | CARRY |

---

## 4. REMOVED-ON-FORK (deleted, not left to self-skip)

| Item | Why it cannot fire on 941/942 |
|---|---|
| Q1-gated visibility of the 10 severity heads (939 `condRef: triggering`), both directions | No such displayCondition in the 941/942 config |
| Eval Type MT/ST field check | No Eval Type field. Rater-instruction shape check (F6-10) retained, data-driven |
| Blanket suppression of prompt-mismatch findings (939 v1.1.1) | Client doc: Prompt = starting prompt = Turn 1 on both sides. Suppression removes a real detection class |
| Side binding from csv Model A / Model B | Run-order columns; sides come from the config names |
| 898 identity map, KNOWN_PAIRS, Bosko/Snowball/Spider/GOAT namespace tokens | Different model pair; identity table rebuilt empty |
| Maps as a featured source (898 sources note) | 0701 wires Gemini, Gmail, Photos, Search, YouTube |
| Turn 1 debug optional | Doc requires debug for each turn; config gates slot 1 on N >= 1 |

---

## 5. Normalization ladder (one function, used by every equality and containment compare)

Applied in this order:

1. CRLF and CR to LF
2. Strip UTF-8 BOM
3. Strip the Gemini omission marker: `[Content of all requested items is omitted here because it may be found above or below.]`
4. Strip inline citation tokens `[cite: ...]`
5. Unicode NFC
6. Strip zero-width characters (U+200B to U+200D, U+FEFF) and U+FFFD (decoder replacement character; count logged separately by A-06)
7. Typographic canonicalization: curly to straight quotes and apostrophes; en/em dashes and U+2212 to hyphen-minus
8. Collapse all Unicode whitespace to one space (covers NBSP and U+3000), trim
9. Equality on the result; containment on the result; overlap tier (word-level Jaccard at least 90%) as the tolerance fallback, printing the percentage as evidence when it fires

**Locale notes**

- es-419: fully covered by the ladder above. Step 7 is load-bearing (apostrophe-dense prose).
- zh-CN: full-width vs half-width forms (U+FF01 to U+FF5E, ideographic punctuation) are **not** unified by NFC. Do not pre-add NFKC or width folding. Requirement: (a) a named near-miss test case (same prompt, width-form variant) in the suite, asserted as KNOWN-OPEN; (b) a measure-only probe on the first zh-CN batch classifying every form-prompt vs first-user-block inequality by character class. Width folding is added only if the probe shows it in real data, with the probe as the incident citation.
- Value reading: config option strings carry decorations that the doc does not show: `N/A - No personalization needed`, `N/A — Not applicable, because the contextual source material is in English or another language.`, `Not relevant — The language(s) do not have grammatical first person gender agreement.`; one 4a category carries a curly apostrophe (`Didn’t ground/attribute for sensitive info`). Compare after step 7; treat a short value (`N/A`) and its long label as the same answer.
- Redaction placeholders: a bracketed token of 1 to 40 characters on one side of a compare is tolerated through the overlap tier, not by special-casing. If the first batch shows placeholder-driven false fires above the tier, add explicit placeholder masking with the task id as the incident.

---

## 6. Message contract

- `[<Side> model Turn N - "<on-screen label>"] | Problem: ... | Fix: ... | Why: ... | File: <URL when linked>`
- Side names are the platform model names, never A/B letters; roles (Test/Base) appear in logs only until the identity table is proven.
- Field names by on-screen label from the config. Fix is verb-first and says what to type or change. Why carries the two values, the percentage, the hash, the count.
- One block per field; multiple problems joined by "Also:"; actions fuzzy-deduplicated.
- Never leak internal language (check ids, "script", "pipeline").
- Problem sentences are identifiers: the rater-facing Error Reference is regenerated from them on every release.

---

## 7. Suite requirements

Smoke: one scenario per family asserting exact error and warning counts.

Adversarial (one per check, plus the near-miss that must not fire):
- Wrong conversation in Turn 2 (F4-A, F4-C fire) vs same conversation with omission marker and CRLF (zero findings)
- Turn 1 debug pasted in Turn 2 slot (F4-E, F4-B)
- Turn 2 debug in Turn 1 slot (F4-D)
- Stale hidden category after parent flipped to No issues (F2-04) vs legal N/A on Turns (no finding)
- Folder link pasted unchanged (F3-01) vs valid file link with `?usp=sharing` suffix (no finding)
- Same file id across sides (F3-02)
- Q1 Not Personalized plus Personalized (F6-01)
- Dissatisfied with partial slice (F6-06) vs dissatisfied with full share (no finding)
- 4a sensitive-attribution category with 5a No issues (F6-07)
- NBSP prompt vs U+FFFD debug (zero findings, one encoding log) vs genuinely different first message (F4-A fires) - the 939 regression pair, permanent
- zh-CN width-form variant pair - KNOWN-OPEN, result recorded not asserted
- Clean task: zero warnings (catches a checker's own missing capability surfacing as rater fault)

Batch replay: first real batch per locale; hand-adjudicate every distinct finding class; uniform counts across tasks are a script defect until proven otherwise.

---

## 8. Rulings and escalations required before or at launch

| # | Question | Blocks | Owner |
|---|---|---|---|
| 1 | Debug and HTML: Drive file links (939 protocol) or pastes? | F3 family direction | Ops / tab owner |
| 2 | Is the Prompt field the Turn 1 starting prompt on both sides (doc) or a follow-up (939 v1.1.1 claim)? | F4-A live or ruled | Tab owner (Sabrina Chen / Matt Barnes) |
| 3 | Where does the 50:50 Test/Base flip happen, and does the export record which model was shown as Conversation A? 941 and 942 configs share one fixed A/B order | SxS de-randomization; QD direction checks | Platform / tab owner |
| 4 | 7c citation format: literal English `[Turn N]` required, or localized / full-width forms accepted? | F6-04, F6-05 regex | Client |
| 5 | Rationale language: English, target language, or either? | Nothing in the script; QD proportionality | Client |
| 6 | `targetLanguage` / `dialect`: hard per-project assignment or rater-dependent? | F7-01 severity | Client |
| 7 | "Dissatisfied" in the full-debug rule: does "Somewhat dissatisfied" trigger it? Doc references "Holistic 1a/1b" (stale labels) | F6-06 promotion | Client (doc owner) |
| 8 | 2b Clarification direction is SINGLE_CHOICE while the doc says "check all that apply (both may appear in different turns)" | Config defect | Config owner |
| 9 | Global raters source-language questionnaire (2a/2b) has no fields in the config | Doc/config gap | Doc + config owner |
| 10 | Real Model ID strings for Ramen (top-20) and Prod Frozen on Mode 23 Fast; whether Model ID survives the sanctioned slices | F5 family | First task |
| 11 | 942 config file for the byte diff against 941 | Parity assertion | Lead |
| 12 | 9a asks raters to "also note whether the chatbot used grammatical gender inconsistently" and the examples table says raters "will then select whether the issues always happened or only sometimes" - no such field exists in the config | Doc/config gap | Doc + config owner |
| 13 | The doc's debug-sharing rule says "Dissatisfied" on "Holistic assessment 1a) or 1b)"; the form has 7a/7b with "Somewhat dissatisfied" / "Very dissatisfied" - confirm the trigger set and update the stale labels | F6-06 promotion | Doc owner |

---

## 9. First-task verification table (blocking at deploy)

| # | Assumption | Expected | If it fails |
|---|---|---|---|
| 1 | Ratings root and shape | object keyed `compareModels.<name>.<key>` under `conversation.ratings` | Adapter fix; capture the export |
| 2 | Namespace bytes | exactly the two config names, ASCII arrows, no stray spaces | Extend arrow/space canonicalization; log the observed bytes |
| 3 | Metadata root and columns | `conversation.input` with Model A / Model B / First Model / Prompt Type / Additional Rater Instruction / Drive folder links | F7 and F5-05 self-skip loudly; ask for the batch sheet |
| 4 | Debug fields | Drive file links | Invert F3-01 to paste protocol |
| 5 | Mode 23 debug anatomy | marker set present in both sanctioned slices; which of `Model ID:` / `Recipe ID:` / `Agency config id:` appear | Re-derive F3-04 markers; decide F5 availability |
| 6 | Real Model IDs per side | two distinct strings | Populate the identity table; promote F5-03 after N clean tasks |
| 7 | Footprints presence | present on FULL slices only | F4-G stays warning; confirm skip logic |
| 8 | `sian_profile` source names | five sources named as in the capture | Update F7-03 expected list |
| 9 | A/B in export | some field or metadata records which model was Conversation A | If absent, escalation 3 is a launch blocker for SxS analysis |
| 10 | `bp2` resolution | resolves per side or is ignored by the platform | Log only |
| 11 | i18n keys resolve per side | 8 keys per namespace present when answered | Adapter fix |
| 12 | zh-CN width forms (942 only) | probe result recorded | Add width folding with the probe as incident |
| 13 | Service-account address in fix text | equals the harness credential `client_email` | One-constant fix |

---

## 10. Build notes (added at implementation, v1.0.0 — 9 Sep 2026)

This section records what the build actually did, where it departed from the sections above, and
what the config export proved. It is an addendum to the ledger, not a revision of it.

**Where the build lives.** Both projects share ONE checks source, under
`941-prq-e2e-eval-es-419/`, and `scripts/build-prq.mjs` emits BOTH deployables:

- `parts/prq-checks.js` -> `validatePrqL1` — F1, F2, F5-04, F5-05, F6 (payload-decidable), F7-01/02/04
- `parts/prq-fetch-checks.js` -> `validatePrqFetch` — F3, F4, F5-01..03, F6-06, F7-03
- `validate(conversationData)` is a thin wrapper running both and de-duplicating

**Fork base changed, with reason.** The fork base is the **944** harness (config-derived CFG
generation, L1/L2 part split, 7-bit-ASCII deterministic build, memory discipline, no in-script
timers), with 903's v3.2.32 algorithms **ported** rather than embedded: ctrl99 block extraction,
Model ID and footprints extraction, the mode-selector aria-label extractor, RTF detection. 939
embedded 903 wholesale and then had to blanket-suppress two whole finding families; section 4
already removes one of those suppressions, which makes wholesale embedding the wrong base.
898's identity map, KNOWN_PAIRS and namespace tokens are gone, as section 4 requires.

**Everything is derived, nothing is typed.** Field keys, on-screen labels, option vocabularies,
the gate graph (from `displayCondition`), head families and the two model names are all emitted
from the config export. The build asserts, and FAILS on: 51 per-side keys; 10 answerable task
fields + 3 breakpoints = 13 top-level; 10 severity heads; 4 i18n heads; 9 category + 10 turns +
2 detraction children; 5 debug slots in gate order; `firstModel` enum equal to the two model
names; **no head gated on Q1 anywhere**; the field count closing at 65. Zero phantom keys is
asserted too.

### 10.1 What the config export PROVED (R3 received)

Every fact in section 1 that the config could settle, it settled. Byte-exact confirmations:

- Model names as stated in Fact 5, ASCII arrows, no stray whitespace.
- 51 per-side keys, 65 fields, review-criteria 3780.
- The 2a–6a / 7a–7c / 8a–11b letter mapping is exactly as the ledger assumed. 3a
  (`modelFeelsLikeItGetsMe1SpeaksMyLanguage`) has no Category child; 6a's category-role child is
  `...CorrectionsDirection`; 2c and 4b are the only Detraction heads.
- No Q1 gate exists (F1-03's ADAPT and section 4's first removal are both correct).
- The i18n heads really do spell it `Minor Issue(s)` / `Major Issue(s)`, 10b's explanation really
  is SINGLE_CHOICE, and 8a (`modelLanguageAdherence`) really has no N/A option (Fact 10).
- `bp2` gates on `numberOfTurns` (F2-07).
- The decorated option strings in section 5 are confirmed verbatim, curly apostrophe included
  (`Didn’t ground/attribute for sensitive info`).
- **No field carries `allowOptional`**, so "shown" == "required" and F1 can derive its required
  sets rather than listing them.

Escalation 8 is confirmed as a config defect: 2b's `...ClarificationCategory` is SINGLE_CHOICE
while the doc says check-all-that-apply. It is logged, never checked, pending the config owner.

### 10.2 Named deviations from the text above (each wants a ruling)

1. **F4-A / F4-B / F4-C are scoped by debug export shape**, detected per side and logged. Stated
   unconditionally, each false-fires on one of the two legitimate Gemini export shapes: F4-A and
   F4-C on a FLAT export (turn *t*'s file holds only turn *t*), F4-B on a CUMULATIVE one (turn
   *t* replays turns 1..*t*, so its last block is turn *t*'s question, not the starting prompt).
   944 v2.0.2 and v2.0.3 were both production false blocks from assuming one shape, and v2.0.3
   proved real captures are cumulative. So F4-A runs on turn 1 always and on later turns only
   when cumulative; F4-B only when flat; F4-C only when cumulative. **Turn 1 anchoring is
   unconditional under every shape**, so a wrong Turn 1 conversation is caught either way.
   Settle with the first real export (section 9 row 5).
2. **F6-09 option equality is narrower than "short N/A vs long label" implies.** The short-form
   rule applies only when one side carries no separator. A looser shared-first-segment reading
   made `Mode 23 -> Something Else - Fast` equal to `Mode 23 -> Ramen (top-20) - Fast` and
   silently disabled F5-04 — caught by that check's own fixture. Model names never go through
   option equality; they use the arrow/whitespace/case canonicalizer.
3. **Fact 4's "13 top-level keys"** counts 10 answerable fields plus 3 breakpoints, with
   `compareModels` excluded. Recorded so the assertion cannot drift.

### 10.3 Blocking at deploy

- **The service-account address is suspect.** The sharing fix text carries
  `beling-tool-g-svc@turing-gpt.iam.gserviceaccount.com`, verbatim from the deployed 903 and 939
  scripts. It looks like a truncation of `labeling-tool-g-svc@...`. If it is wrong, every F3-03
  fix sends raters to a dead end. It lives in ONE constant per part
  (`FETCH_SERVICE_ACCOUNT`); verify against the harness credential's `client_email` and correct
  both parts. Deliberately not guessed here — section 9 row 13.
- **942's own config export has not arrived** (escalation 11). 942 is currently built from 941's
  config. Drop it at `942-prq-e2e-eval-zh-cn/config/project-config-id-942.json` and re-run the
  build: the builder machine-diffs the two and stamps IDENTICAL or DIFFERS into 942's header.
- **The deployable is ~176KB**, over run-checks-api's 100KB default `maxScriptSize`. labeling-g
  already stores 903/939 above that; confirm this instance's limit before pasting.
- **Every section 9 row is still UNPROVEN** — no task export exists. `golden/README.md` in each
  project maps each section 9 row to the exact log line that closes it.

### 10.4 Suite status (section 7)

65 fixtures green per project (130 total). Every check has an adversarial fire case; the
section 7 near-misses that must NOT fire are all present, including the permanent 939 regression
pair (NBSP prompt vs U+FFFD debug) and the Fact 13 compliant pattern ("Not Personalized" plus
N/A on every head that offers it). The zh-CN width-form pair is carried as KNOWN-OPEN: the
measure-only probe records its result in the run log and asserts nothing. Batch replay is
outstanding — it needs the first real batch per locale.

### 10.5 Config revision: model rename (9 Sep 2026) — SUPERSEDES Fact 5

A revised export renamed the Test model. **Fact 5 in section 1 is now stale**; the current
byte-exact names are:

| Role | Config slot | Name |
|---|---|---|
| Test | `model_A` | `PContext Mode 23 (Nippon) > Mochi – Fast` — bare `>` separator, **EN DASH** before "Fast" |
| Base | `model_B` | `Mode 23 -> Prod Frozen - Fast` — unchanged, ASCII arrow and hyphen |

A machine diff of the two exports confirms the name is the **only** change: all 65 fields, the
full gate graph, every option vocabulary, `allowOptional` everywhere, and the field ordering are
byte-identical. It moves in exactly two places — `compareModels.sideBySide.model_A` and the
`firstModel` enum. Because every table is derived from the export, swapping the file carried the
rename through by itself; no check needed rewriting.

**But the new name's shape broke two helpers, and one of them silently.** Both are fixed:

1. **F3-09's discriminator** split only on `->` and `" - "`. The ladder folds the en dash to a
   hyphen, so `PContext Mode 23 (Nippon) > Mochi – Fast` split first at the `" - "` before
   "Fast" — reducing the form name to `"fast"` while the saved Gemini page
   (`Nippon - Mochi - Fast`) reduced to `"mochifast"`. That is an **error on every correct
   Test-side task**. A bare `>` is now a separator. Pinned by a permanent two-direction
   regression case; reverting the one-character fix fails 23 of the 67 fixtures, including every
   clean-task case, which is what makes the case worth keeping.
2. **`canonModel`** (A-04 side binding, F5-04, run-order resolution) now collapses either `->`
   or a bare `>` in **one** pass, so arrow-style variants of one name canonicalize equal. One
   pass and not two: replacing `>` first also eats the `>` inside `->` and mangles every
   ASCII-arrow name — caught while writing the fix, before it reached the parts.

The builder now reports every separator and dash style it sees in each configured model name, so
the next rename in an unseen style gets a human look rather than silent handling. The superseded
export is retained at `config/project-config-id-941.superseded-ramen.json`.

**Consequence for section 9 row 6 and F5-03:** the identity table still ships EMPTY, and the
Model ID strings to collect on the first task are now **Mochi's** (not Ramen's). Any Ramen-era
`Model ID` value observed in a capture means the wrong model was run.

Suite: 67 fixtures green per project (134 total), up from 65 — the two additions are the F3-09
name-shape regression pair.
