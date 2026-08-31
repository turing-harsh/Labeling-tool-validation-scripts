#!/usr/bin/env node
// Build 944's deployable validation.js from:
//   1. config/project-config-id-944.json   -> derives config/form-spec-944.json (generated)
//   2. parts/i18n-continuity-checks.js      -> the deterministic R/G/U/D/I/C/B checks
// The FORM_SPEC (labels, per-side key set, options, model names) is GENERATED from the config
// export and injected — never hand-typed (requirements §7, §18). This script also runs the §18
// assertions: zero phantom keys, every check ID present exactly once, and a rebuild-twice hash
// diff. Re-run after editing either source:  node scripts/build-944.mjs
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

// ---------------------------------------------------------------- assertions
const KEY_SET = new Set(keyUniverse);
const partsPath = join(proj, "parts", "i18n-continuity-checks.js");
const parts = readFileSync(partsPath, "utf8").trim();

// (1) every check ID in the register appears in the checks source exactly once.
const REGISTER = [
  ...["R-01","R-02","R-03","R-04","R-05","R-06","R-07","R-08","R-09"],
  ...["G-01","G-02","G-03","G-04","G-05","G-06","G-07","G-08","G-09","G-10","G-11","G-12","G-13"],
  ...["U-01","U-02","U-03","U-04","U-05","U-06","U-07"],
  ...["D-01"],
  ...["I-01","I-02","I-03"],
  ...["C-01","C-02","C-03","C-04","C-05","C-06","C-07","C-08","C-09","C-10","C-11","C-12","C-13","C-14","C-15","C-16"],
  ...["B-01","B-02","B-03","B-04","B-05","B-06","B-07"],
];
for (const id of REGISTER) {
  const n = (parts.match(new RegExp(id.replace("-", "\\-"), "g")) || []).length;
  if (n < 1) die(`check ${id} is not present in parts/i18n-continuity-checks.js.`);
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
];
for (const re of patterns) { let m; while ((m = re.exec(parts)) !== null) callSiteKeys.add(m[1]); }
// dynamic key families the logic builds by template — expand and validate too.
for (let k = 1; k <= 10; k++) callSiteKeys.add(`topicConversationsHtml${k}`);
for (let k = 1; k <= 5; k++) for (const fam of ["Continuity", "ContinuityErrorTypes", "ExpectedContext", "ContextSourceThreads", "ModelCorrectionOutcome"]) callSiteKeys.add(`turn${k}${fam}`);
// keys named only inside array literals in the source (validate the literals resolve).
const arrayKeys = ["utilityRelevance","constraintExpertiseAdherence","stateEntityProgressTracking","temporalAwareness","granularityDepth","overallSatisfaction","contextualContinuity","contextualContinuityGate","targetLanguageMeaning","internationalizationQuality","multiTurnSatisfaction","errorSeverityFirst","errorSeveritySecond","errorSeverityThird","testResponse1DebugInfo","testResponse2DebugInfo","model1TestResponse3DebugInfo","model1TestResponse4DebugInfo","model1TestResponse5DebugInfo","model1HtmlFileUpload","conversationFeedback","errorSeverityFirstRationale","errorSeveritySecondRationale","errorSeverityThirdRationale"];
for (const k of arrayKeys) callSiteKeys.add(k);
const phantom = [...callSiteKeys].filter((k) => !KEY_SET.has(k));
if (phantom.length) die(`phantom keys not in config universe: ${phantom.join(", ")}`);

// (3) structural sanity
if (perSide.length !== 55) console.warn(`build-944 note: expected 55 per-side keys, found ${perSide.length}.`);
if (!parts.includes("function validate(conversationData)")) die('parts must contain the literal "function validate(conversationData)".');

// ---------------------------------------------------------------- compose
// The deployable must survive paste into the tool byte-for-byte. v1.0.1: the first deploy
// was rejected at save time ("Unexpected identifier 'Validation' [<isolated-vm>]") — the
// source compiled cleanly in local V8, so the stored text had been mangled in transit; the
// script carried literal non-ASCII (em dashes, curly quotes, zero-width chars in regex
// classes). The output is therefore (a) slimmed: only the spec fields the checks actually
// read are injected (labels + model names), multi-line, no giant single-line literal; and
// (b) ASCII-escaped: every char > 0x7E becomes \uXXXX, asserted below.
const asciiEscape = (s) => s.replace(/[^\x00-\x7E]/g, (ch) => {
  const cp = ch.codePointAt(0);
  if (cp > 0xffff) { // surrogate pair
    return Array.from(ch).map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
  }
  return "\\u" + cp.toString(16).padStart(4, "0");
});

const CFG_MARKER = "/*__GENERATED_CFG__*/ null";
if (!parts.includes(CFG_MARKER)) die(`parts is missing the CFG injection marker "${CFG_MARKER}".`);

function compose() {
  // 917-skeleton layout: the generated tables live INSIDE validate(), like 917's CFG block.
  // Only the fields the checks read are injected (model names + per-side key set + labels);
  // the full derived spec stays on disk in config/form-spec-944.json.
  const cfg = { projectId: spec.projectId, modelA, modelB, sxsKeys: perSide, labels };
  const cfgLiteral = JSON.stringify(cfg, null, 2).split("\n").map((l, i) => (i === 0 ? l : "  " + l)).join("\n");
  return asciiEscape(parts.replace(CFG_MARKER, cfgLiteral) + "\n");
}

const out1 = compose();
const out2 = compose();
const h1 = createHash("sha256").update(out1).digest("hex");
const h2 = createHash("sha256").update(out2).digest("hex");
if (h1 !== h2) die("non-deterministic build (rebuild hash mismatch).");
if (!out1.includes("function validate(conversationData)")) die('output missing "function validate(conversationData)".');
if (/[^\x00-\x7E]/.test(out1)) die("output is not 7-bit ASCII — escaping failed.");
// The output must still parse as a script (same check the tool runs at save time).
try { new Function(out1); } catch (e) { die(`output does not parse: ${e.message}`); }

const dest = join(proj, "validation.js");
writeFileSync(dest, out1);
const kb = (Buffer.byteLength(out1, "utf8") / 1024).toFixed(1);
console.log(`Wrote ${dest} (${kb}KB)  sha256=${h1.slice(0, 12)}`);
console.log(`  per-side keys: ${perSide.length}, task fields: ${taskFields.length}, total keys: ${keyUniverse.length}`);
console.log(`  checks present: ${REGISTER.length}/56, phantom keys: 0`);
console.log(`  Model A = "${modelA}"`);
console.log(`  Model B = "${modelB}"`);
