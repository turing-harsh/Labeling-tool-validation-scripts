#!/usr/bin/env node
// Build 944's deployable validation.js from:
//   1. config/project-config-id-944.json     -> derives config/form-spec-944.json (generated)
//   2. parts/i18n-continuity-checks.js       -> Layer L1 (deterministic) R/G/U/D/I/C/B checks
//   3. parts/i18n-continuity-fetch-checks.js -> Layer L2 (fetched-artifact) F checks
// The FORM_SPEC-equivalent CFG (labels, per-side key set, model names) is GENERATED from the
// config export and injected into EACH part -- never hand-typed (requirements §7, §20). The
// composed validate(conversationData) is a thin wrapper that calls both sub-validators and
// de-dupes, matching 939-continuity-en-us's validate/validateContinuity/validate903 pattern
// (requirements §8 provenance). This script also runs the §20 assertions: zero phantom keys,
// every check ID present, no serial fetch loops, and a rebuild-twice hash diff.
// Re-run after editing any source:  node scripts/build-944.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const proj = join(root, "instances", "labeling-g", "projects", "944-i18n-continuity-zh-cn");
const die = (m) => { console.error("build-944 FAILED: " + m); process.exit(1); };

// ---------------------------------------------------------------- derive spec
const rawCfg = JSON.parse(readFileSync(join(proj, "config", "project-config-id-944.json"), "utf8"));
const pi = rawCfg.piConfiguration && rawCfg.piConfiguration[0];
if (!pi || !Array.isArray(pi.configurationValue)) die("piConfiguration[0].configurationValue not found in config.");
const fields = pi.configurationValue;

const compare = fields.find((f) => f.key === "compareModels");
if (!compare || !compare.sideBySide) die("compareModels.sideBySide not found in config.");
const modelA = compare.sideBySide.model_A && compare.sideBySide.model_A.name;
const modelB = compare.sideBySide.model_B && compare.sideBySide.model_B.name;
if (!modelA || !modelB) die("model_A / model_B names not found in compareModels.sideBySide.");
const perSide = (compare.sideBySide.questions || []).map((q) => q.key);
if (perSide.length === 0) die("no per-side questions found.");

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
  projectId: rawCfg.piConfiguration[0].projectId ?? 944,
  formConfigId: pi.id ?? null,
  modelA, modelB,
  perSide,
  taskFields,
  labels, options, types,
  keyUniverse,
};
writeFileSync(join(proj, "config", "form-spec-944.json"), JSON.stringify(spec, null, 1));

// ---------------------------------------------------------------- load parts
const l1Path = join(proj, "parts", "i18n-continuity-checks.js");
const fetchPath = join(proj, "parts", "i18n-continuity-fetch-checks.js");
const l1Source = readFileSync(l1Path, "utf8").trim();
const fetchSource = readFileSync(fetchPath, "utf8").trim();
const combined = l1Source + "\n" + fetchSource;

// ---------------------------------------------------------------- assertions
const KEY_SET = new Set(keyUniverse);

// (1) every check ID in the register appears somewhere in the combined checks source.
const REGISTER = [
  ...["R-01","R-02","R-03","R-04","R-05","R-06","R-07","R-08","R-09"],
  ...["G-01","G-02","G-03","G-04","G-05","G-06","G-07","G-08","G-09","G-10","G-11","G-12","G-13"],
  ...["U-01","U-02","U-03","U-04","U-05","U-06","U-07"],
  ...["D-01"],
  ...["F-01","F-02","F-03","F-04","F-05"],
  ...["I-01","I-02","I-03"],
  ...["C-01","C-02","C-03","C-04","C-05","C-06","C-07","C-08","C-09","C-10","C-11","C-12","C-13","C-14","C-15","C-16"],
  ...["B-01","B-02","B-03","B-04","B-05","B-06","B-07"],
];
for (const id of REGISTER) {
  const n = (combined.match(new RegExp(id.replace("-", "\\-"), "g")) || []).length;
  if (n < 1) die(`check ${id} is not present in the checks sources.`);
}

// (2) zero phantom keys: every field key referenced at a call site exists in the config universe.
const callSiteKeys = new Set();
const patterns = [
  /\bT\('([^']+)'\)/g,
  /\bsv\('([^']+)'\)/g,
  /\bside\.get\('([^']+)'\)/g,
  /\bside\.keyOf\('([^']+)'\)/g,
  /\bside\.lbl\('([^']+)'\)/g,
  /\blabelOf\('([^']+)'\)/g,
  /\bclassifyDim\('([^']+)'/g,
  /\bbyKey\['([^']+)'\]/g,
];
for (const re of patterns) { let m; while ((m = re.exec(combined)) !== null) callSiteKeys.add(m[1]); }
for (let k = 1; k <= 10; k++) callSiteKeys.add(`topicConversationsHtml${k}`);
for (let k = 1; k <= 5; k++) for (const fam of ["Continuity", "ContinuityErrorTypes", "ExpectedContext", "ContextSourceThreads", "ModelCorrectionOutcome"]) callSiteKeys.add(`turn${k}${fam}`);
const arrayKeys = ["utilityRelevance","constraintExpertiseAdherence","stateEntityProgressTracking","temporalAwareness","granularityDepth","overallSatisfaction","contextualContinuity","contextualContinuityGate","targetLanguageMeaning","internationalizationQuality","multiTurnSatisfaction","errorSeverityFirst","errorSeveritySecond","errorSeverityThird","testResponse1DebugInfo","testResponse2DebugInfo","model1TestResponse3DebugInfo","model1TestResponse4DebugInfo","model1TestResponse5DebugInfo","model1HtmlFileUpload","conversationFeedback","errorSeverityFirstRationale","errorSeveritySecondRationale","errorSeverityThirdRationale","geminiConversationHistory","numberOfTurns"];
for (const k of arrayKeys) callSiteKeys.add(k);
const phantom = [...callSiteKeys].filter((k) => !KEY_SET.has(k));
if (phantom.length) die(`phantom keys not in config universe: ${phantom.join(", ")}`);

// (3) structural sanity
if (perSide.length !== 55) console.warn(`build-944 note: expected 55 per-side keys, found ${perSide.length}.`);
if (!l1Source.includes("async function validateI18nContinuityL1(conversationData)")) die('L1 part must define "async function validateI18nContinuityL1(conversationData)".');
if (!fetchSource.includes("async function validateFetchLayer(conversationData)")) die('fetch part must define "async function validateFetchLayer(conversationData)".');

// (4) fetch-layer discipline (requirements §20): concurrent fetches, never a serial
// await-in-loop over fetchDataFromDriveLink.
if (!fetchSource.includes("fetchDataFromDriveLink")) die("fetch part never calls fetchDataFromDriveLink.");
if (!fetchSource.includes("Promise.allSettled")) die("fetch part must fetch concurrently via Promise.allSettled.");
const loopAwaitFetchRe = /for\s*\([^)]*\)\s*\{[^}]*await\s+fetchDataFromDriveLink/s;
if (loopAwaitFetchRe.test(fetchSource)) die("fetch part appears to await fetchDataFromDriveLink serially inside a for-loop -- fetch concurrently instead.");

// ---------------------------------------------------------------- compose
// The deployable must survive paste into the tool byte-for-byte (v1.0.1 lesson: a first deploy
// was rejected at save time because the stored text carried literal non-ASCII that a paste layer
// mangled in transit). The output stays 7-bit ASCII (every char > 0x7E escaped as \uXXXX).
const asciiEscape = (s) => s.replace(/[^\x00-\x7E]/g, (ch) => {
  const cp = ch.codePointAt(0);
  if (cp > 0xffff) return Array.from(ch).map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
  return "\\u" + cp.toString(16).padStart(4, "0");
});

const CFG_MARKER = "/*__GENERATED_CFG__*/ null";
if (!l1Source.includes(CFG_MARKER)) die(`L1 part is missing the CFG injection marker "${CFG_MARKER}".`);
if (!fetchSource.includes(CFG_MARKER)) die(`fetch part is missing the CFG injection marker "${CFG_MARKER}".`);

const cfg = { projectId: spec.projectId, modelA, modelB, sxsKeys: perSide, labels };
const cfgLiteral = JSON.stringify(cfg, null, 2).split("\n").map((l, i) => (i === 0 ? l : "  " + l)).join("\n");

const HEADER = `// i18n-continuity-validator-944 -- I18n Continuity Quality E2E Eval (zh-CN), PROJECT 944.
//
// GENERATED FILE -- do not edit by hand. Rebuild with: node scripts/build-944.mjs
// Composed from:
//   - parts/i18n-continuity-checks.js       (Layer L1 -> validateI18nContinuityL1)
//   - parts/i18n-continuity-fetch-checks.js (Layer L2 -> validateFetchLayer)
// ARCHITECTURE (requirements §8 provenance): validate() is a thin wrapper that runs both
// sub-validators independently and de-dupes identical messages, matching
// 939-continuity-en-us's validate/validateContinuity/validate903 composition.
//
// CHECK IDS IMPLEMENTED (build-asserted):
//   R-01..R-09  G-01..G-13  U-01..U-07  D-01  F-01..F-05  I-01..I-03  C-01..C-16  B-01..B-07
//
// CHANGELOG:
//   v2.0.2 -- F-05 false-block fix (first production run): turn counting is anchored on the
//     "<ctrl99>user" open marker (\\b, /i) instead of the strict "<ctrl99>user\\n...<ctrl100>"
//     block, which counted 0 on captures whose role token is followed by CRLF / tags / escaped
//     newlines. Count mismatches now log an escaped byte-context snippet per debug file.
//   v2.0.1 -- sandbox-reality fixes to the fetch layer: (1) removed the in-script setTimeout
//     race -- the production isolate injects NO timers, so it threw "setTimeout is not defined"
//     and turned every fetch into a false F-01; the host drive-fetcher's own per-fetch timeout
//     plus the 30s script abort are the real enforcement. (2) Only drive.google.com file links
//     are fetched -- the tool's fetch helper hard-rejects every other host, so "best-effort"
//     fetching a U-07 (warn-only) link guaranteed an F-01 error. (3) Fields carrying pasted
//     debug/HTML text (U-01/U-02) are no longer fetched. (4) The fetch helper returns PARSED
//     JSON for JSON files (the host JSON.parses before handing over) -- handled explicitly.
//   v2.0.0 -- added Layer L2 (F-01..F-05, real Drive-content fetching via
//     fetchDataFromDriveLink) and rebuilt the wrapper to match 939's two-sub-validator
//     composition, per requirements.md v2.0.0 (see its §21 changelog for the full rationale).
//   v1.0.0-1.0.2 -- initial Layer L1 build (56 checks), see git history for details.
//
// Available globals: conversationData, fetchDataFromDriveLink, fetchDataFromDriveZip,
// fetchDataFromGcsLink
// const errors = []; warnings = []; infos = []; successes = []; logs = [];
`;

const WRAPPER = `
async function validate(conversationData) {
  try {
    await validateI18nContinuityL1(conversationData);
  } catch (e) {
    errors.push('Layer L1 (deterministic) check error: ' + (e && e.message ? e.message : String(e)));
  }
  try {
    await validateFetchLayer(conversationData);
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
  const fetchWithCfg = fetchSource.replace(CFG_MARKER, cfgLiteral);
  return asciiEscape(HEADER + "\n" + l1WithCfg + "\n\n" + fetchWithCfg + "\n" + WRAPPER);
}

const out1 = compose();
const out2 = compose();
const h1 = createHash("sha256").update(out1).digest("hex");
const h2 = createHash("sha256").update(out2).digest("hex");
if (h1 !== h2) die("non-deterministic build (rebuild hash mismatch).");
if (!out1.includes("function validate(conversationData)")) die('output missing "function validate(conversationData)".');
if (/[^\x00-\x7E]/.test(out1)) die("output is not 7-bit ASCII -- escaping failed.");
try { new Function(out1); } catch (e) { die(`output does not parse: ${e.message}`); }

const dest = join(proj, "validation.js");
writeFileSync(dest, out1);
const kb = (Buffer.byteLength(out1, "utf8") / 1024).toFixed(1);
console.log(`Wrote ${dest} (${kb}KB)  sha256=${h1.slice(0, 12)}`);
console.log(`  per-side keys: ${perSide.length}, task fields: ${taskFields.length}, total keys: ${keyUniverse.length}`);
console.log(`  checks present: ${REGISTER.length}/61, phantom keys: 0`);
console.log(`  Model A = "${modelA}"`);
console.log(`  Model B = "${modelB}"`);
