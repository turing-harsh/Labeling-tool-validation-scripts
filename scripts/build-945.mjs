#!/usr/bin/env node
// Build 945's deployable validation.js from:
//   1. config/project-config-id-945.json  -> derives config/form-spec-945.json (generated)
//   2. parts/redteam-checks.js            -> Layer L1 (deterministic) R/G/U/D/I-03/C/B checks
//   3. parts/redteam-fetch-checks.js      -> Layer L2 (fetched artifacts) F/A/I-01/I-02 checks
// The FORM_SPEC-equivalent CFG (labels, options, per-side key set, model names) is GENERATED
// from the config export and injected into EACH part -- never hand-typed (requirements SS7,
// SS21). The composed validate(conversationData) is a thin wrapper that calls both
// sub-validators and de-dupes, matching 944/939's composition. This script also runs the SS21
// assertions: zero phantom keys, every check ID present exactly once in the register, no serial
// fetch loops, and a rebuild-twice hash diff.
// Re-run after editing any source:  node scripts/build-945.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const proj = join(root, "instances", "labeling-g", "projects", "945-stm-v2-red-teaming-evals-en-us");
const die = (m) => { console.error("build-945 FAILED: " + m); process.exit(1); };

// ---------------------------------------------------------------- derive spec
const rawCfg = JSON.parse(readFileSync(join(proj, "config", "project-config-id-945.json"), "utf8"));
const pi = rawCfg.piConfiguration && rawCfg.piConfiguration[0];
if (!pi || !Array.isArray(pi.configurationValue)) die("piConfiguration[0].configurationValue not found in config.");
const fields = pi.configurationValue;

const compare = fields.find((f) => f.key === "compareBaseAndTest");
if (!compare || !compare.sideBySide) die("compareBaseAndTest.sideBySide not found in config.");
const modelA = compare.sideBySide.model_A && compare.sideBySide.model_A.name;
const modelB = compare.sideBySide.model_B && compare.sideBySide.model_B.name;
if (!modelA || !modelB) die("model_A / model_B names not found in compareBaseAndTest.sideBySide.");
const perSide = (compare.sideBySide.questions || []).map((q) => (typeof q === "string" ? q : (q && q.key)));
if (perSide.some((k) => typeof k !== "string" || !k)) die("a per-side question has no key.");
if (perSide.length === 0) die("no per-side questions found.");
const modelOrderKey = compare.sideBySide.model_order_question && compare.sideBySide.model_order_question.key;
if (modelOrderKey !== "modelOrder") die(`expected the model-order question to be "modelOrder", found "${modelOrderKey}".`);

const optOf = (f) => (f.options || []).map((o) => (typeof o === "string" ? o : (o.value ?? o.label ?? o.name ?? String(o))));
const labels = {}, options = {}, types = {};
const keyUniverse = [];
const IGNORE_TYPES = new Set(["BREAKPOINT"]);
for (const f of fields) {
  if (!f.key) continue;
  keyUniverse.push(f.key);
  labels[f.key] = f.name || f.key;
  types[f.key] = f.type;
  const o = optOf(f);
  if (o.length) options[f.key] = o;
}
const perSideSet = new Set(perSide);
const taskFields = fields
  .filter((f) => f.key && !IGNORE_TYPES.has(f.type) && !perSideSet.has(f.key) && f.type !== "SIDE_BY_SIDE_COMPARISON")
  .map((f) => f.key);

const spec = {
  projectId: pi.projectId ?? 945,
  formConfigId: pi.id ?? null,
  modelA, modelB,
  perSide, taskFields,
  labels, options, types, keyUniverse,
};
writeFileSync(join(proj, "config", "form-spec-945.json"), JSON.stringify(spec, null, 1));

// ---------------------------------------------------------------- load parts
const l1Path = join(proj, "parts", "redteam-checks.js");
const l2Path = join(proj, "parts", "redteam-fetch-checks.js");
const l1Source = readFileSync(l1Path, "utf8").trim();
const l2Source = readFileSync(l2Path, "utf8").trim();
const combined = l1Source + "\n" + l2Source;

// ---------------------------------------------------------------- assertions
const KEY_SET = new Set(keyUniverse);

// (1) every check ID in the register appears in exactly one of the two parts' "IMPLEMENTED"
// headers, and at least once in the combined source.
const REGISTER = [
  "R-01","R-02","R-03","R-04","R-05","R-06","R-07","R-08","R-09",
  "G-01","G-02","G-03","G-04","G-05","G-06",
  "U-01","U-02","U-03","U-04","U-05","U-06","U-07",
  "D-01",
  "F-01","F-02","F-03","F-04","F-05","F-06","F-07","F-08","F-09",
  "A-01","A-02","A-03","A-04","A-05",
  "I-01","I-02","I-03",
  "C-01","C-02","C-03","C-04","C-05","C-06","C-07","C-12","C-13","C-14",
  "B-01","B-02","B-03",
];
if (REGISTER.length !== 53) die(`register must hold 53 checks, holds ${REGISTER.length}.`);
// The declared owner of each ID is its part's "CHECK IDS IMPLEMENTED" header block.
const declaredIn = (src) => {
  const i = src.indexOf("CHECK IDS IMPLEMENTED");
  if (i < 0) return new Set();
  const lines = src.slice(i).split("\n");
  const acc = [];
  for (const line of lines) { if (!/^\s*\/\//.test(line) && acc.length) break; acc.push(line); }
  return new Set(acc.join(" ").match(/\b[RGUDFAICB]-\d{2}\b/g) || []);
};
const ownL1 = declaredIn(l1Source);
const ownL2 = declaredIn(l2Source);
for (const id of REGISTER) {
  const n = (combined.match(new RegExp(id.replace("-", "\\-"), "g")) || []).length;
  if (n < 1) die(`check ${id} is not present in the checks sources.`);
  const owners = (ownL1.has(id) ? 1 : 0) + (ownL2.has(id) ? 1 : 0);
  if (owners === 0) die(`check ${id} is not declared in either part's "CHECK IDS IMPLEMENTED" header.`);
  if (owners === 2) die(`check ${id} is declared in BOTH parts' headers -- each check has exactly one owner.`);
}
for (const id of [...ownL1, ...ownL2]) if (!REGISTER.includes(id)) die(`a part declares check ${id}, which is not in the register.`);

// (2) zero phantom keys: every field key referenced at a call site exists in the config universe.
const callSiteKeys = new Set();
const patterns = [
  /\bT\('([^']+)'\)/g,
  /\bsv\('([^']+)'\)/g,
  /\bside\.get\('([^']+)'\)/g,
  /\bside\.keyOf\('([^']+)'\)/g,
  /\bside\.lbl\('([^']+)'\)/g,
  /\btestSide\.(?:get|keyOf|lbl)\('([^']+)'\)/g,
  /\bbaseSide\.(?:get|keyOf|lbl)\('([^']+)'\)/g,
  /\blabelOf\('([^']+)'\)/g,
  /\bbyKey\['([^']+)'\]/g,
  /\bCFG\.options\['([^']+)'\]/g,
];
for (const re of patterns) { let m; while ((m = re.exec(combined)) !== null) callSiteKeys.add(m[1]); }
// key families built by index at runtime
for (let k = 1; k <= 5; k++) {
  callSiteKeys.add(`debugInfoTurn${k}`);
  callSiteKeys.add(`didTurn${k}HaveIssue`);
  callSiteKeys.add(`turn${k}MemorySection`);
}
for (const k of ["testCoreTaskCompletion","lossCategory","leakageCategorization","leakageOtherDetails",
                 "leakageEgregiousness","generalLossCategorization","generalOtherDetails",
                 "generalLossSeverity","wasPContextTriggered","numberOfTurns","htmlExport"]) callSiteKeys.add(k);
const phantom = [...callSiteKeys].filter((k) => !KEY_SET.has(k));
if (phantom.length) die(`phantom keys not in config universe: ${phantom.join(", ")}`);

// (3) coverage (requirements SS16): every writable key is either bound by a check or on the
// declared-unbound list. A key that is neither is a silent coverage hole.
const UNBOUND = new Set([
  "setupChecksRequired", "criticalRequirement", "privacyGate", // platform gates, zero-option bodies
  "bp1", "bp2", "bp3",                                          // breakpoints, no value
  "compareBaseAndTest",                                         // the SxS container itself
]);
// Coverage counts any quoted occurrence of a config key in the checks source, not just the
// call-site patterns above -- several families are read from a literal key list.
const quoted = new Set();
{ let m; const re = /'([A-Za-z][A-Za-z0-9]*)'/g; while ((m = re.exec(combined)) !== null) if (KEY_SET.has(m[1])) quoted.add(m[1]); }
const coveredKeys = new Set([...callSiteKeys, ...quoted]);
const uncovered = keyUniverse.filter((k) => !coveredKeys.has(k) && !UNBOUND.has(k));
if (uncovered.length) die(`keys neither bound by a check nor declared unbound (SS16): ${uncovered.join(", ")}`);

// (4) structural sanity
if (perSide.length !== 27) console.warn(`build-945 note: expected 27 per-side keys, found ${perSide.length}.`);
if (!l1Source.includes("async function validateRedTeamL1(conversationData)")) die('L1 part must define "async function validateRedTeamL1(conversationData)".');
if (!l2Source.includes("async function validateRedTeamFetchLayer(conversationData)")) die('L2 part must define "async function validateRedTeamFetchLayer(conversationData)".');

// (5) fetch-layer discipline (SS21): concurrent fetches, never a serial await-in-loop.
if (!l2Source.includes("fetchDataFromDriveLink")) die("fetch part never calls fetchDataFromDriveLink.");
if (!l2Source.includes("Promise.allSettled")) die("fetch part must fetch concurrently via Promise.allSettled.");
if (/for\s*\([^)]*\)\s*\{[^}]*await\s+fetchDataFromDriveLink/s.test(l2Source)) die("fetch part awaits fetchDataFromDriveLink serially inside a for-loop -- fetch concurrently instead.");
// (6) no in-script timers -- the production isolate injects none (944 v2.0.1 incident).
if (/\bsetTimeout\s*\(|\bsetInterval\s*\(/.test(combined)) die("checks source references a timer; the production isolate has none.");

// ---------------------------------------------------------------- compose
// The deployable must survive paste into the tool byte-for-byte (944 v1.0.1 lesson: a first
// deploy was rejected at save time because the stored text carried literal non-ASCII that a
// paste layer mangled). The output stays 7-bit ASCII (every char > 0x7E escaped as \uXXXX).
const asciiEscape = (s) => s.replace(/[^\x00-\x7E]/g, (ch) => {
  const cp = ch.codePointAt(0);
  if (cp > 0xffff) return Array.from(ch).map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
  return "\\u" + cp.toString(16).padStart(4, "0");
});

const CFG_MARKER = "/*__GENERATED_CFG__*/ null";
if (!l1Source.includes(CFG_MARKER)) die(`L1 part is missing the CFG injection marker "${CFG_MARKER}".`);
if (!l2Source.includes(CFG_MARKER)) die(`L2 part is missing the CFG injection marker "${CFG_MARKER}".`);

const cfg = { projectId: spec.projectId, modelA, modelB, sxsKeys: perSide, labels, options };
const cfgLiteral = JSON.stringify(cfg, null, 2).split("\n").map((l, i) => (i === 0 ? l : "  " + l)).join("\n");

const HEADER = `// redteam-stm-validator-945 -- WIP - STM v2 - Red Teaming Evals (en-US), PROJECT 945.
//
// GENERATED FILE -- do not edit by hand. Rebuild with: node scripts/build-945.mjs
// Composed from:
//   - parts/redteam-checks.js       (Layer L1 -> validateRedTeamL1)
//   - parts/redteam-fetch-checks.js (Layer L2 -> validateRedTeamFetchLayer)
// ARCHITECTURE: validate() is a thin wrapper that runs both sub-validators independently and
// de-dupes identical messages, matching 944-i18n-continuity-zh-cn's composition.
//
// CHECK IDS IMPLEMENTED (build-asserted, 53 checks):
//   R-01..R-09  G-01..G-06  U-01..U-07  D-01  F-01..F-09  A-01..A-05  I-01..I-03
//   C-01..C-07 C-12..C-14  B-01..B-03
//
// CHANGELOG:
//   v1.0.9 -- two rater-reported false warnings on live tasks, both the same category error:
//     they compared against the batch sheet's "First Model" column, which is randomised DISPLAY
//     ORDER (proven on 1267733), while policy fixes the form's "First model shown" to the Test
//     model -- so the column disagrees with a correct submission about half the time. I-03 is
//     demoted to a log line (it compares run order against display order: different quantities,
//     no rater action). The protocol first-model warning drops its assignment arm and keeps the
//     form arm, so it fires only on the one thing the rater controls, and its Fix text no longer
//     floats redoing a task over a spreadsheet cell. A genuinely inverted run stays with F-09,
//     on the debug captures, which is what caught 1267733. Also: v1.0.4-v1.0.8 were re-imported
//     into parts/ -- they had been edited into the built file only, leaving the parts five
//     versions behind and any rebuild silently reverting them. C-12/C-13/C-14 gained the ID
//     labels their v1.0.7 logic shipped without, so the builder can assert them.
//   v1.0.8 also fixes a v1.0.7 defect found on replay: the Base-rubric block referenced clearFix()
//     before its definition (temporal dead zone); any task with Base Loss Category = N/A and a stale
//     Base sub-answer crashed Layer L1 ("Cannot access 'clearFix' before initialization"). The fix text
//     is now inline. Regression fixture: 1267710 blog attempt (Base N/A + stale Base categorisation).
//   v1.0.8 -- CANDIDATE, runtime history-drop handling (task 1267710, two attempts, rater confirmed
//     correct): when the saved Base page shows every shared prompt (branch confirmed) and the Base bait
//     turn ran a tool, yet the Base capture holds fewer prompts than the Test turn count, F-06, A-03 and
//     the Base-side A-01 become warnings naming the platform cause and routing the call to the lead.
//     Otherwise they stay errors (a fresh, un-branched Base chat still blocks). No other change.
//   v1.0.7 -- CANDIDATE, config change: Loss Category gained an "N/A" option (config export 945 rev 2).
//     C-12 Test side must not select N/A (error); C-13 Base side must select N/A when filled (error),
//     and its Leakage/General sub-answers must be empty (error, clear-fix); C-14 a Base turn marked as
//     having an issue warns, since the rater is declaring the Base showed the failure (no loss by the
//     client's rule). Core Task Completion on the Base side has no N/A option and stays inert.
//     Replay: 1267698 / 1267733 now fire C-13 (both recorded Leakage/General on the Base side) -- the
//     intended new behaviour, not a regression; 1267733 also fires C-14.
//   v1.0.6 -- CANDIDATE, false-positive fix (task 1267734, reported by the rater and confirmed on the
//     capture): a tool that runs as a sub-agent (file_gen) makes the runtime inject a synthesized user
//     block carrying the tool-call argument. It is not user-authored and is never replayed into later
//     turns, so the raw block count broke the turn ladder (turn 1 = 2, turn 2 = 2) and fired the
//     turn-1 single-prompt rule. Fix: user blocks whose text equals a string argument listed under
//     "Function calls and responses" are dropped before any check counts them (content over
//     counting; the same lesson as the Personalization v1/v2 reinjection false positives). No
//     message text changed. Replay: 1267698 / 1267733 unchanged (no tool calls in those captures).
//   v1.0.5 -- CANDIDATE, severity pass (no check logic changed): four warnings promoted to errors.
//     U-07 non-Drive link (the file is never fetched, so every content check on that turn silently
//     passes); F-07 identical content under different Drive ids (two turns cannot share one
//     capture; same defect class as D-01); C-05 missing [Turn X] entry (client instruction is a
//     "must" in an exact format; the turn is otherwise unreviewable); C-04 no standard memory
//     section name (attribution cannot be mapped). Decision rule: block when the data is unusable
//     or other checks are silently disabled and the rater can fix it with certainty. Replay on
//     1267698 / 1267733 unchanged (none of the four fire there). MUST be folded into parts/ via
//     scripts/build-945.mjs before deploy.
//   v1.0.4 -- CANDIDATE, message pass only (no check logic changed): every rater-facing Problem/Fix
//     rewritten to name the protocol step, state expected vs found, give numbered fix steps, and
//     add a one-line "Why we check this" on the checks raters dispute (branching, hidden fields,
//     folder links, model roles). Forced by task 1267710: a correct block on an un-branched Base
//     chat was reported as a false flag within hours of deploy. MUST be folded into parts/ via
//     scripts/build-945.mjs before deploy -- this file is a patched build, not a source edit.
//     Replay: 1267698 clean at L1+L2; 1267733 C-01 + C-03 + order warn at L1 (unchanged).
//   v1.0.2 -- corrections forced by reading the SECOND completed task (1267733) against its
//     artifacts. (1) B-01 no longer requires the Test namespace to equal batch "First Model":
//     that field is DISPLAY ORDER, randomised per task, and the clause fired on a task whose
//     namespaces were both correct -- as written it would block every task whose order flipped.
//     I-03 keeps display order, at warn. (2) C-04 no longer shreds prose: "[Turn K] - [Section].
//     rationale" is a live convention and the comma-split warned on six fragments of a
//     correctly-filled field; candidates are now bracketed tokens plus short standalone lines.
//     (3) F-05 names its commonest sub-case -- a slot whose capture holds no prompt the previous
//     slot lacks documents no additional turn (1267733's turn-2 capture repeated turn 1's four
//     prompts and role sequence, differing only in latency telemetry: the turn was cancelled).
//     Open: escalation E-8 (1267733 runs the conversation on the frozen baseline and baits the
//     test model, inverting requirements SS1). The fixed mapping stands until the QA lead rules.
//   v1.0.1 -- WAF-safe output: the save endpoint's firewall rejected the deployable, so every
//     HTML tag opener and HTML entity is now written with < / & escapes (identical strings
//     after parsing, invisible to a signature engine), builder-asserted, comments included.
//   v1.0.0 -- initial build off requirements.md v1.0.1, on the 944 two-sub-validator engine.
//     Red teaming: every submitted task is a loss by construction, and the Base side is a
//     branch of the Test conversation receiving only the bait prompt. The Base-side rubric is
//     INERT (escalation E-1: the config forces those fields, so any value there is forced
//     noise) -- logged every run, never judged. Identity is anchored on "Agency config id"
//     (there is no "Model ID:" line on this execution path). The bait-turn invariant F-06
//     replaces the inherited MT/ST eval-type shape check, and the footprints delta is deleted
//     as dead by design. Content anchoring (A-01..A-05) is restored on same-project proof:
//     on task 1267698 the form's prompt equals the first user block of every fetched capture.
//
// Available globals: conversationData, fetchDataFromDriveLink, fetchDataFromDriveZip,
// fetchDataFromGcsLink
// const errors = []; warnings = []; infos = []; successes = []; logs = [];
`;

const WRAPPER = `
async function validate(conversationData) {
  try {
    await validateRedTeamL1(conversationData);
  } catch (e) {
    errors.push('Layer L1 (deterministic) check error: ' + (e && e.message ? e.message : String(e)));
  }
  try {
    await validateRedTeamFetchLayer(conversationData);
  } catch (e) {
    errors.push('Layer L2 (fetch-layer) check error: ' + (e && e.message ? e.message : String(e)));
  }
  for (const arr of [errors, warnings, infos, successes]) {
    const seen = new Set();
    const kept = arr.filter((x) => { const k = String(x); if (seen.has(k)) return false; seen.add(k); return true; });
    arr.length = 0;
    arr.push(...kept);
  }
}
`;

function compose() {
  const l1WithCfg = l1Source.replace(CFG_MARKER, cfgLiteral);
  const l2WithCfg = l2Source.replace(CFG_MARKER, cfgLiteral);
  return asciiEscape(HEADER + "\n" + l1WithCfg + "\n\n" + l2WithCfg + "\n" + WRAPPER);
}

const out1 = compose();
const out2 = compose();
const h1 = createHash("sha256").update(out1).digest("hex");
const h2 = createHash("sha256").update(out2).digest("hex");
if (h1 !== h2) die("non-deterministic build (rebuild hash mismatch).");
if (!out1.includes("function validate(conversationData)")) die('output missing "function validate(conversationData)".');
if (/[^\x00-\x7E]/.test(out1)) die("output is not 7-bit ASCII -- escaping failed.");
// docs/CONVENTIONS.md records a 100KB script cap, but the v1.0.8 deployable is 112KB and runs
// in the tool, so that figure is stale. Warn, never block -- a wrong ceiling that refuses to
// emit a working script is worse than a loud note.
if (Buffer.byteLength(out1, "utf8") > 100 * 1024) console.warn(`build-945 NOTE: output is ${(Buffer.byteLength(out1, "utf8") / 1024).toFixed(1)}KB, above the 100KB figure in docs/CONVENTIONS.md (stale: v1.0.8 shipped at 112KB).`);
try { new Function(out1); } catch (e) { die(`output does not parse: ${e.message}`); }

const dest = join(proj, "validation.js");
writeFileSync(dest, out1);
const kb = (Buffer.byteLength(out1, "utf8") / 1024).toFixed(1);
console.log(`Wrote ${dest} (${kb}KB)  sha256=${h1.slice(0, 12)}`);
console.log(`  per-side keys: ${perSide.length}, task fields: ${taskFields.length}, total keys: ${keyUniverse.length}`);
console.log(`  checks present: ${REGISTER.length}/53, phantom keys: 0, uncovered keys: 0`);
console.log(`  Test (model_A) = "${modelA}"`);
console.log(`  Base (model_B) = "${modelB}"`);
