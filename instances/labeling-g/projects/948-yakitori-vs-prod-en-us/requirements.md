# Validation Requirements — 948 "0909 Yakitori vs Prod" (en-US)

**Family spec:** [../941-prq-e2e-eval-es-419/requirements.md](../941-prq-e2e-eval-es-419/requirements.md).
948 is the same P13n Response Quality E2E Eval form with the **language block removed** and a
different model pair. Everything in the 941 ledger applies unless contradicted below.

**Document date:** 10 Sep 2026 (v1.2.0 — severity review; findings from golden tasks 1271273, 1271348 and 1271588 applied).

---

## 1. What this project is

| | |
|---|---|
| Project id / review criteria | 948 / 3787 (config export received 10 Sep 2026) |
| Locale | English / United States |
| Test = `model_A` | `Mode 23 -> Yakitori - Fast` |
| Base = `model_B` | `Mode 23 -> Prod Frozen - Fast` |
| Form shape | 43 per-side keys, 10 answerable task keys, 3 breakpoints, 10 severity heads, **0 i18n heads**, 5 debug slots, 27 gates |
| Debug protocol | one Google Drive **file link per slot, and nothing else** |
| Config fields | 57 = 43 per-side + 10 answerable task + 3 breakpoints + 1 `compareModels` |

The shared checks source is config-driven, so the missing language block needs no code branch:
948's `CFG.i18nHeads` is `[]` and F2-06 self-disables.

---

## 2. Facts PROVEN on real tasks (1271273, 1271348 and 1271588)

These supersede the corresponding UNPROVEN rows in the 941 ledger's §9 first-task table.

| # | Fact | Evidence |
|---|---|---|
| 1 | Ratings arrive at `conversation.ratings` as an object map; per-side keys namespaced `compareModels.<model name>.<key>`; `compareModels.__config__` also present and skipped | both tasks |
| 2 | Namespaces are byte-identical to the configured model names | both tasks |
| 3 | Batch metadata sits at `conversation.input` with `Model A`, `Model B`, `First Model`, `Prompt Type`, `Additional Rater Instruction`, `Model A/B HTML NAME`, and **separate** destination folders for debug and HTML | both tasks |
| 4 | Debug and HTML fields hold Drive **file links** — link protocol confirmed, so F3-01 is not inverted | both tasks |
| 5 | Hidden gate children are **absent**, not null | both tasks |
| 6 | Debug captures are **CUMULATIVE**: turn *t* replays turns 1..*t*, first user block = the starting prompt | both tasks |
| 7 | **There is no `Model ID:` line anywhere in a Mode 23 capture** | all 8 debug files |
| 8 | `Agency config id` is present in **both** debug and HTML and discriminates the pair: Yakitori `…0.2.170-…-token-budget-rm-rrf-listwise-top-20-…`, Prod Frozen `…0.2.171-prod-p13n-prod-frozen-baseline` | all 8 debug files + all 4 pages |
| 9 | Debug and page both embed `llmdebugger…agency?s=<token>` session ids; a side's debug tokens appear on that side's own page | 3 of 4 side-instances; the 4th is the defect below |
| 10 | The saved page **embeds the whole Debug Info panel**, so whole-page text containment is self-satisfying | all 4 pages |
| 11 | Personal context arrives as `Source Profile: source_name: "DATA_SOURCE_USER_PROFILE_<X>"`, observed `GMAIL`, `PHOTOS`, `BARD_SEARCH`, `GEMINI_CHAT`. **The set varies by task** — it reflects what the query retrieved, not what setup connected | 1271273 pulled 4, 1271348 pulled 1 |
| 12 | There is no `sian_profile` chapter and no `Personal Context` header. `enable_sian_profile: true` is a **config flag** present on every capture | all 8 debug files |
| 13 | Footprints increment by 1 per turn and are present on every FULL slice | all 8 debug files |
| 14 | `displayCondition` can be a **boolean** on this form (`setupCheck: false`), not only null or a clause object. A boolean means always/never shown and is not a gate | config export |
| 15 | Batch metadata carries **no Target Language / Dialect column**, so F7-01 has no assignment to compare against and falls back to the project-level expectation | all three tasks |
| 16 | The batch is **not uniformly en-US**: 1271273 and 1271348 declare `United States`, 1271588 declares `India` on an India-context prompt ("I live in Vadodara"). `India` is a valid dialect for English in this config | all three tasks |
| 17 | Single-turn tasks occur in this batch (`Additional Rater Instruction: "Single turn only"`, `numberOfTurns = 1`, four artifacts instead of six) | 1271588 |

---

## 3. Why v1.1.0 exists — the defect that passed

Golden task **1271348** returned `PASS — 0 errors, 8 warnings` under v1.2.0 while carrying a
blocking defect, and golden task **1271273** — a well-executed task — got the same verdict. Both
being indistinguishable is the failure.

**The defect: the Prod Frozen debug files and its uploaded HTML are two different conversations.**
Their `llmdebugger` session tokens are completely disjoint, while Yakitori's match exactly:

| Side | debug tokens | own page tokens | subset? |
|---|---|---|---|
| Yakitori | `ChBmNWM2…`, `ChA2YTQ2…` | identical pair | yes |
| Prod Frozen | `ChBkNzBm…`, `ChA5NDI4…` | `ChBlMjA1…`, `ChBmY2Q5…` | **no — zero overlap** |

Same model, same two questions, different session: the conversation was re-run and the page saved
from the second run, so the uploaded debug does not document the submitted conversation. All four
side-instances on the clean task match perfectly, which is what makes this an anomaly rather than
capture drift — and what justified shipping it at **error** rather than warning.

### Three root causes in the script

1. **No session-token check existed.** `llmdebugger` appeared 0 times in the script.
2. **Identity was 100% dormant.** F5 keyed on `Model ID:`, which Mode 23 never emits (Fact 7), so a
   swapped debug pair passed silently. `Agency config id` was in the script — but only in marker
   lists, never used for identity.
3. **F3-08 / F3-10 could not fail.** They tested containment against `stripTags(whole 2.3 MB page)`,
   and the page embeds the debug dump (Fact 10), so the needle was always inside the haystack.

---

## 4. Checks added or changed in v1.1.0

All live in the shared parts, so 941 and 942 gain them too.

| ID | Check | Severity |
|---|---|---|
| **F3-12** *(new)* | Each side's debug session tokens must appear on that side's own page. Names the other side's page when the tokens are found there instead (swap). Self-skips when either artifact has no tokens. Ref `903:1348` | Error |
| **F3-13** *(new)* | Visible questions on the page vs declared `numberOfTurns`. Generalises `903:1333` | Error |
| **F5-06** *(new)* | A side's debug agency id must equal its page's agency id. Ref `903:1352` | Error |
| **F5-07** *(new)* | Decisive swap — each page reports the other side's debug model. Ref `903:1482` | Error |
| **F6-12** *(new)* | Every turn flagged on a head's Turns child must be cited as `[Turn N]` in that side's rationale. Turn coverage is the decidable proxy for "explain what you flagged" — length is never checked (941 F1-07) | Warning |
| **F6-13** *(new)* | SxS says "about the same" while the per-model rating profiles differ. Scoped to that verdict only, so it needs no Conversation-A/B ↔ Model-A/B mapping (still unresolved) | Warning |
| **F7-05** *(new)* | Logs the expected page filenames from metadata. **Genuinely unverifiable in-script** — the fetch helper exposes content, never a filename | Log |
| **F7-06** *(new)* | Logs the SxS verdict against each side's severity profile and the batch Model A/B columns, so the A/B mapping question can be settled from a batch | Log |
| **F3-01** | Link + extra text raised from warning to error — 1271273 holds link-only in all four slots, settling that commentary is a rater deviation | Warning → **Error** |
| **F3-08 / F3-10** | Now compare against the **visible conversation** (`<user-query>` / `<model-response>` elements), not whole-page text | Error |
| **F3-11** | Cross-side sameness now uses the first visible prompt + response, not ≥99% whole-page overlap | Error |
| **F5-01 / F5-02** | Re-keyed onto `Agency config id`, falling back to `Model ID` / `Recipe ID` where a batch emits them | Error |
| **F6-05** | Reworded: a turn referenced in prose is reported as a **format** problem, not "does not reference any turn" (which was false on both 1271348 rationales and invites dismissal) | Warning |
| **F6-05 / F6-12** | **Single-turn relief.** Both self-skip when a side declares exactly one turn: a `[Turn N]` citation exists to say *which* turn a point refers to, and with one turn there is nothing to disambiguate. Found on 1271588, a clean single-turn task that warned on both sides purely for a missing bracket. F6-04 (a citation *above* the declared count) is deliberately **not** relieved | Warning (narrowed) |
| **F7-01** | Evidence now states when the expectation came from the project rather than a batch column, since this batch ships no dialect assignment (Fact 15) | Warning |
| **F7-03** | **Re-derived.** The inherited expected list (`SEARCH`/`GMAIL`/`PHOTOS`/`BARD_NOT_PERSONALIZED_USING_FIRST_PARTY_DATA`) appears in **no** Mode 23 capture, and the set that does appear varies by task (Fact 11). Only "a FULL share with no personal context at all" is now a finding; which sources appeared is logged | Warning (narrowed) |
| *slice* | `FULL_MARKERS` no longer matches `sian_profile`, which hit the config flag `enable_sian_profile: true` on every capture (Fact 12) | — |

---

## 5. Severity model (review of 10 Sep 2026)

**Errors block a task; warnings are non-blocking suggestions.** A check blocks only when all
three hold: the signal is deterministic, the rater can fix it with certainty, and the data is
otherwise contradictory or unusable. Every warning site was reviewed against that bar.

### Promoted to ERROR

| Check | What it catches | Why it blocks |
|---|---|---|
| F7-01 (×4) | language / dialect vs the project or batch assignment | Lead ruling: the locale is a hard per-project assignment. Settles 941 escalation 6 |
| F6-03 | `N/A` selected *alongside* turn numbers | Straight contradiction — nothing downstream can tell which turns the issue was on. (`N/A` **alone** remains legal and unchecked) |
| F6-04 | rationale cites a turn above the declared count | The turn does not exist; the rater fixes the number or the count |
| F6-12 | a flagged turn is never explained in the rationale | The doc requires it: "If you selected Minor or Major issue(s) … please also explain in this question" |
| F6-07 | 4a sensitive-info category set while 5a reports no issue | The form's own instruction: "(If you select this, also flag the issue in 5a.)" |
| F6-08 | Q1 "Not Personalized" only, yet 2c/4b flags over-personalization | Self-contradictory in the form's own vocabulary |
| F3-01 | link is not a Google Drive link | The artifact cannot be read at all, so every content check on that slot is dead |
| F3-12 (partial) | page missing *some* of the turns the debug covers | Same defect as the fully-disjoint case, smaller |

### Deliberately still WARNING

| Check | Why it does not block |
|---|---|
| F6-05 | Format only — the explanation IS present, just not in `[Turn N]` notation. F6-12 blocks the case that actually loses information |
| F6-13 | A rater can legitimately judge two conversations equal despite differing minor issues |
| F6-10 | The doc explicitly allows stopping once the conversational goal is met |
| F6-11 | Regex **tightened** to the bracketed substitution form only — the old pattern fired on legitimate prompts such as "How do I redact a PDF?" (verified). Kept non-blocking: a rater could still be discussing redaction inside brackets |
| F4-B | Probabilistic — the rater may legitimately have retyped the question |
| F4-G / F4-H | Footprints deltas are a *drifted* signal and may be system-side |
| F3-04 | RTF file — the content was read successfully, so the data is usable |
| F5-03 | Identity table ships empty; promote only after a batch proves it |
| F6-06 | Rests on unresolved escalations 7/13 (which dissatisfaction levels trigger the full-share rule; the doc cites stale field labels) |
| F7-03 | Has never fired on a real task; promote once one proves it fires correctly |

### Known consequence of the F7-01 ruling

Golden task **1271588 now FAILS on the dialect alone** (1 error, 0 warnings). Everything else
about that task is correct work: it declares `dialect = India` on an en-US-named project, with an
India-context prompt, and the batch ships **no dialect column** to arbitrate (Facts 15-16). Across
the three sampled tasks the batch is not uniformly US. If it legitimately spans English dialects,
widen `CFG.locale` for the project in `scripts/build-prq.mjs` rather than softening the check —
that keeps a genuinely wrong *language* blocking while letting valid dialects through.

---

## 6. Verification

```bash
node scripts/build-prq.mjs                                  # builds 941, 942 and 948
npm test -- labeling-g/948-yakitori-vs-prod-en-us            # 2 real-data cases
npm run golden -- labeling-g/948-yakitori-vs-prod-en-us 1271273.txt   # PASS, 0 warnings
npm run golden -- labeling-g/948-yakitori-vs-prod-en-us 1271348.txt   # FAIL, 5 errors
```

The fixture suite is the two real golden tasks (`fixtures/artifacts` symlinks `golden/artifacts`),
not synthetic mocks. **1271273 passing with zero warnings is the load-bearing assertion** — it is
what surfaced the wrong F7-03 source list, and requirements §7 keeps it for exactly that purpose:
a finding that fires on every task is a script defect until proven otherwise.

Reversion-checked: neutering F3-12 fails both the 948 real-data fixture and the 941 synthetic one.

---

## 7. Open

- ~~No config export.~~ **CLOSED.** `config/project-config-id-948.json` (review-criteria 3787,
  57 fields) is in the repo and the tables are derived from it. The bootstrap that had been
  recovered from the pasted script was machine-diffed against it and came back **IDENTICAL** in
  model names, per-side keys, task fields, heads, children, debug slots, gates, options and
  types. The recovered tables are kept at `config/form-spec-948.bootstrap.json` as an auditable
  provenance record, and the builder re-runs that diff on every build.
- **Identity table ships EMPTY.** The two agency ids are logged on every task (F5-03); populate
  after a clean batch, then promote F5-03 from log to warning.
- **`beling-tool-g-svc@…`** in the sharing fix text is still the suspected truncation of
  `labeling-tool-g-svc@…`, inherited from 903/939. One constant per part. Note the local fetch
  helper authenticates as `labeling-local-dev@…`, which is a *different* account and not evidence
  either way.
- **A/B ↔ Model A/B mapping** (941 escalation 3) unresolved. On 1271273 the mapping holds; F7-06
  now logs the evidence each run so a batch can settle it.
- **F4-G/H fired on 1271348**: footprints 26 vs 23 suggest Prod Frozen ran second while the form
  and metadata both say it ran first. Still a warning; it may be the same re-run that F3-12 caught.
- Which personal-context sources a task *should* show is unruled — see Fact 11 and F7-03.
- **Dialect scope (941 escalation 6) is now live, not theoretical.** This project is named en-US
  but 1271588 legitimately evaluates an India-context prompt with `dialect = India`, and the
  batch ships no dialect column to arbitrate (Facts 15-16). F7-01 warns and names where the
  expectation came from. Either the project constant should widen to "any English dialect" or
  the batch should carry the assignment — a lead needs to rule. Until then this warning will
  recur on every non-US task in the batch.
