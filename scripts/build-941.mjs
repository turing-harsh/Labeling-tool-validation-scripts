#!/usr/bin/env node
// Build the deployable validation.js for BOTH sibling projects:
//   941  P13n Response Quality E2E Eval (es-419)
//   942  P13n Response Quality E2E Eval (zh-CN)
//
// The two projects share ONE checks source (941/parts/*) and differ only in the injected
// locale constant that F7-01 compares against. 942's config is byte-diffed against 941's on
// receipt (requirements escalation 11); until it lands, 942 is built from 941's config with a
// loud note in its metadata.
//
// Everything the checks reference -- field keys, on-screen labels, option strings, the gate
// graph, the model names -- is DERIVED from the config export and injected at a marker inside
// each sub-validator. Nothing is hand-typed (requirements A-03, F2 "from R3 displayConditions",
// F6-09 "configured option set"). The build then ASSERTS the structure the requirements
// declare as proven facts, so a config revision that breaks an assumption fails the build
// instead of silently disabling a check.
//
// Re-run after editing any source:  node scripts/build-941.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const P941 = join(root, "instances", "labeling-g", "projects", "941-prq-e2e-eval-es-419");
const P942 = join(root, "instances", "labeling-g", "projects", "942-prq-e2e-eval-zh-cn");
const die = (m) => { console.error("build-941 FAILED: " + m); process.exit(1); };
const note = (m) => console.log("  note: " + m);

const VERSION = "1.0.0";

// ---------------------------------------------------------------- derive spec
function deriveSpec(configPath, expectProjectId) {
  const raw = JSON.parse(readFileSync(configPath, "utf8"));
  const pi = raw.piConfiguration && raw.piConfiguration[0];
  if (!pi || !Array.isArray(pi.configurationValue)) die(`piConfiguration[0].configurationValue not found in ${configPath}`);
  const fields = pi.configurationValue;

  const cm = fields.find((f) => f.key === "compareModels");
  if (!cm || !cm.sideBySide) die("compareModels.sideBySide not found.");
  const modelA = cm.sideBySide.model_A && cm.sideBySide.model_A.name;
  const modelB = cm.sideBySide.model_B && cm.sideBySide.model_B.name;
  if (!modelA || !modelB) die("model_A / model_B names not found.");
  // Fact 5: ASCII arrow, no leading/trailing space. Assert the bytes rather than trusting them.
  for (const [tag, n] of [["model_A", modelA], ["model_B", modelB]]) {
    if (n !== n.trim()) die(`${tag} name has leading/trailing whitespace: ${JSON.stringify(n)}`);
    // Report every separator/dash style in the name: each one is load-bearing downstream.
    // canonModel unifies arrow spellings AND a bare ">"; the ladder folds en/em dashes to
    // hyphen-minus; F3-09's discriminator splits on {"->", ">", " - "}. A style this build has
    // not seen before is worth a human look, so say so rather than assuming it is handled.
    const styles = [];
    if (/[→⇒]/.test(n)) styles.push("non-ASCII arrow");
    if (/(^|[^-])>/.test(n)) styles.push("bare '>' separator");
    if (/[–—]/.test(n)) styles.push("en/em dash");
    if (/->/.test(n)) styles.push("ASCII '->' arrow");
    if (styles.length) note(`${tag} name ${JSON.stringify(n)} uses: ${styles.join(", ")} -- canonModel and the F3-09 discriminator both handle these.`);
  }
  const perSide = (cm.sideBySide.questions || []).map((q) => q.key);
  if (!perSide.length) die("no per-side questions found.");

  const optOf = (f) => (f.options || []).map((o) => (typeof o === "string" ? o : (o.value ?? o.name ?? String(o))));
  const labels = {}, options = {}, types = {}, keyUniverse = [];
  const IGNORE = new Set(["BREAKPOINT", "SIDE_BY_SIDE_COMPARISON"]);
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
    .filter((f) => f.key && !IGNORE.has(f.type) && !perSideSet.has(f.key))
    .map((f) => f.key);

  // ---- gate graph, transcribed from displayCondition (never hand-written).
  // Shape in this config: {or:[{"==":[{var:PARENT}, "VALUE"]}, ...]}. Anything else fails the
  // build loudly -- a gate shape we cannot read is a silently-disabled F2 check.
  const gates = [];
  for (const f of fields) {
    const dc = f.displayCondition;
    if (!dc || !f.key) continue;
    const clauses = Array.isArray(dc.or) ? dc.or : (dc["=="] ? [dc] : null);
    if (!clauses) die(`unreadable displayCondition on "${f.key}": ${JSON.stringify(dc)}`);
    let parent = null; const values = [];
    for (const c of clauses) {
      const eq = c && c["=="];
      if (!Array.isArray(eq) || eq.length !== 2 || !eq[0] || typeof eq[0].var !== "string") {
        die(`unreadable displayCondition clause on "${f.key}": ${JSON.stringify(c)}`);
      }
      if (parent === null) parent = eq[0].var;
      else if (parent !== eq[0].var) die(`displayCondition on "${f.key}" mixes parents (${parent} / ${eq[0].var}) -- the F2 cascade model assumes one parent.`);
      values.push(String(eq[1]));
    }
    gates.push({ child: f.key, parent, values: [...new Set(values)] });
  }

  // ---- head families, derived from the option vocabularies (not from key names).
  const has = (k, v) => (options[k] || []).some((o) => o === v);
  const heads = perSide.filter((k) => types[k] === "SINGLE_CHOICE" && has(k, "Minor issues") && has(k, "Major issues"));
  const i18nHeads = perSide.filter((k) => types[k] === "SINGLE_CHOICE" && has(k, "Minor Issue(s)") && has(k, "Major Issue(s)"));

  // ---- children per head, from the gate graph + child role from the option vocabulary.
  //  turns      -> options are turn numbers plus N/A
  //  detraction -> Not at all / Somewhat / Completely
  //  category   -> anything else that is a choice field  (6a's "Direction" lands here, as the
  //                requirements' F2-01 family intends)
  //  explanation-> FREE_TEXT, or the i18n 10b SINGLE_CHOICE explanation
  const TURNSET = new Set(["1", "2", "3", "4", "5", "N/A"]);
  const DETRACT = ["Not at all", "Somewhat", "Completely"];
  const roleOf = (k) => {
    const o = options[k] || [];
    if (o.length && o.every((v) => TURNSET.has(v)) && o.some((v) => /^[1-5]$/.test(v))) return "turns";
    if (DETRACT.every((v) => o.includes(v)) && o.length === DETRACT.length) return "detraction";
    if (types[k] === "FREE_TEXT") return "explanation";
    return o.length ? "category" : "explanation";
  };
  const childrenOf = {};
  for (const g of gates) {
    if (!perSideSet.has(g.child)) continue;
    if (!heads.includes(g.parent) && !i18nHeads.includes(g.parent)) continue;
    const role = i18nHeads.includes(g.parent) ? "explanation" : roleOf(g.child);
    childrenOf[g.parent] = childrenOf[g.parent] || {};
    if (childrenOf[g.parent][role]) die(`head "${g.parent}" has two "${role}" children (${childrenOf[g.parent][role]}, ${g.child}) -- the F2 model assumes at most one of each role.`);
    childrenOf[g.parent][role] = g.child;
  }

  // ---- debug slots, in turn order, from the gate graph: slot for turn t is the field whose
  // displayCondition admits exactly the turn counts >= t.
  const turnsKey = perSide.find((k) => types[k] === "SINGLE_CHOICE" && (options[k] || []).join(",") === "1,2,3,4,5");
  if (!turnsKey) die("could not identify the turn-count field (a per-side SINGLE_CHOICE with options 1..5).");
  const slotGates = gates.filter((g) => g.parent === turnsKey && perSideSet.has(g.child) && types[g.child] === "FREE_TEXT");
  const debugSlots = slotGates
    .map((g) => ({ key: g.child, min: Math.min(...g.values.map(Number)) }))
    .sort((a, b) => a.min - b.min);
  for (let i = 0; i < debugSlots.length; i++) {
    if (debugSlots[i].min !== i + 1) die(`debug slot order derived from the gate graph is not 1..N (slot ${i + 1} gates at >=${debugSlots[i].min}).`);
  }
  const debugSlotKeys = debugSlots.map((s) => s.key);

  // ---- named semantic anchors. Each is asserted to exist; a rename fails the build.
  const anchors = {
    turns: turnsKey,
    q1: perSide.find((k) => types[k] === "MULTIPLE_CHOICE" && has(k, "Not Personalized")),
    html: perSide.find((k) => types[k] === "FREE_TEXT" && /html/i.test(labels[k] || "")),
    sat7a: perSide.find((k) => /Overall Personalization Quality$/.test(labels[k] || "")),
    sat7b: perSide.find((k) => /Overall Quality$/.test(labels[k] || "")),
    rationale7c: perSide.find((k) => /Overall Quality Rationale$/.test(labels[k] || "")),
    secondModelLock: perSide.find((k) => types[k] === "CHECKBOX"),
    setupCheck: "setupCheck",
    privacyGate: "privacyGate",
    prompt: "prompt",
    conversationalGoal: "conversationalGoal",
    personalizationExpectation: "personalizationExpectation",
    firstModel: "firstModel",
    targetLanguage: "targetLanguage",
    dialect: "dialect",
    sxs: "qualityComparisonSxS",
    sxsRationale: "qualityComparisonSxSRationale",
  };
  // F6-07's two ends, located by option text (the config carries a CURLY apostrophe here).
  const attrCat = perSide.find((k) => (options[k] || []).some((v) => /ground\/attribute for sensitive info/i.test(v)));
  if (!attrCat) die("F6-07: could not find the 'ground/attribute for sensitive info' category option.");
  anchors.f6_07_category = attrCat;
  anchors.f6_07_option = (options[attrCat] || []).find((v) => /ground\/attribute for sensitive info/i.test(v));
  anchors.f6_07_crossHead = perSide.find((k) => heads.includes(k) && /Trust & Safety$/.test(labels[k] || ""));
  if (!anchors.f6_07_crossHead) die("F6-07: could not find the Trust & Safety head.");
  // F6-08: the two heads whose N/A means "the response wasn't personalized" -- exactly the two
  // that carry a Detraction child (2c Over-Personalization, 4b Over-Transparency).
  anchors.f6_08_heads = heads.filter((k) => childrenOf[k] && childrenOf[k].detraction);

  for (const [k, v] of Object.entries(anchors)) {
    if (k === "f6_08_heads" || k === "f6_07_option") continue;
    if (!v) die(`semantic anchor "${k}" did not resolve against this config -- a field was renamed; fix the derivation, never hand-type the key.`);
    if (!keyUniverse.includes(v)) die(`semantic anchor "${k}" resolved to "${v}", which is not a config key.`);
  }

  const spec = {
    projectId: expectProjectId, formConfigId: pi.id ?? null,
    modelA, modelB, perSide, taskFields, labels, options, types,
    gates, heads, i18nHeads, childrenOf, debugSlotKeys, anchors, keyUniverse,
  };
  if ((pi.projectId ?? expectProjectId) !== expectProjectId) {
    note(`config declares projectId ${pi.projectId}, building for ${expectProjectId}.`);
  }
  return spec;
}

// ---------------------------------------------------------------- assertions
function assertFacts(spec) {
  const a = (cond, msg) => { if (!cond) die(msg); };
  // Fact 4 / §9 row 1
  a(spec.perSide.length === 51, `expected 51 per-side keys (Fact 4), found ${spec.perSide.length}.`);
  // Fact 4 counts 13 top-level keys: the 10 ANSWERABLE task fields plus the 3 breakpoints
  // (bp1, preQuestionsBreakpoint, bp2), with compareModels excluded. taskFields holds only the
  // answerable ten -- breakpoints carry no answer and are never checked for presence.
  a(spec.taskFields.length === 10, `expected 10 answerable task-level keys, found ${spec.taskFields.length}: ${spec.taskFields.join(", ")}`);
  const bpCount = spec.keyUniverse.filter((k) => spec.types[k] === "BREAKPOINT").length;
  a(spec.taskFields.length + bpCount === 13, `expected 13 top-level keys besides compareModels (Fact 4), found ${spec.taskFields.length} answerable + ${bpCount} breakpoints.`);
  a(spec.perSide.length + spec.taskFields.length + bpCount + 1 === spec.keyUniverse.length,
    `field accounting does not close: ${spec.perSide.length} per-side + ${spec.taskFields.length} task + ${bpCount} breakpoints + 1 compareModels != ${spec.keyUniverse.length} total.`);
  // Fact 9 / F1-03
  a(spec.heads.length === 10, `expected 10 rubric severity heads (Fact 9), found ${spec.heads.length}: ${spec.heads.join(", ")}`);
  // Fact 10 / F2-06
  a(spec.i18nHeads.length === 4, `expected 4 i18n heads (Fact 10), found ${spec.i18nHeads.length}: ${spec.i18nHeads.join(", ")}`);
  // Fact 9: NO Q1 gate on any head (the 939 condRef:triggering cascade is REMOVED-ON-FORK §4).
  const q1Gated = spec.gates.filter((g) => g.parent === spec.anchors.q1);
  a(q1Gated.length === 0, `a head is gated on Q1 (${q1Gated.map((g) => g.child).join(", ")}) -- §4 removed that cascade; re-add the check before shipping.`);
  // F2-01: 9 category children (3a has none); F2-02: all 10 heads carry a Turns child;
  // F2-03: exactly 2 detraction children.
  const withRole = (r) => spec.heads.filter((k) => spec.childrenOf[k] && spec.childrenOf[k][r]);
  a(withRole("category").length === 9, `expected 9 category children (F2-01), found ${withRole("category").length}.`);
  a(withRole("turns").length === 10, `expected a Turns child on all 10 heads (F2-02), found ${withRole("turns").length}.`);
  a(withRole("detraction").length === 2, `expected 2 detraction children (F2-03), found ${withRole("detraction").length}.`);
  // F2-06: every i18n head carries exactly one explanation child.
  for (const h of spec.i18nHeads) {
    a(spec.childrenOf[h] && spec.childrenOf[h].explanation, `i18n head "${h}" has no explanation child (F2-06).`);
  }
  // Fact 10: 8a has no N/A option.
  const h8a = spec.i18nHeads.find((k) => (spec.options[k] || []).length === 3);
  a(h8a, "expected one i18n head with no N/A option (Fact 10: 8a).");
  // F1-04 / F2-05
  a(spec.debugSlotKeys.length === 5, `expected 5 debug slots, found ${spec.debugSlotKeys.length}.`);
  // F5-04: firstModel enum is exactly the two configured names.
  const fm = spec.options[spec.anchors.firstModel] || [];
  a(fm.length === 2 && fm.includes(spec.modelA) && fm.includes(spec.modelB),
    `firstModel options are not exactly the two model names (F5-04): ${JSON.stringify(fm)}`);
  // Requirements note the config has no allowOptional field; if one appears, F1's
  // required-when-shown derivation is wrong.
  // F2-07
  a(spec.gates.some((g) => g.child === "bp2" && g.parent === spec.anchors.turns),
    "bp2 no longer references the turn count (F2-07) -- update the log line.");
  console.log(`  facts asserted: 51 per-side / 13 task / 10 heads / 4 i18n heads / 9+10+2 children / 5 debug slots / firstModel enum`);
}

// ---------------------------------------------------------------- compose
const CFG_MARKER = "/*__GENERATED_CFG__*/ null";
const L1_ENTRY = "async function validatePrqL1(conversationData)";
const L2_ENTRY = "async function validatePrqFetch(conversationData)";

const CHECK_REGISTER = [
  "F1-01","F1-02","F1-03","F1-04","F1-05","F1-06","F1-07",
  "F2-01","F2-02","F2-03","F2-04","F2-05","F2-06","F2-07",
  "F3-01","F3-02","F3-03","F3-04","F3-05","F3-06","F3-07","F3-08","F3-09","F3-10","F3-11",
  "F4-A","F4-B","F4-C","F4-D","F4-E","F4-F","F4-G","F4-H",
  "F5-01","F5-02","F5-03","F5-04","F5-05",
  "F6-01","F6-02","F6-03","F6-04","F6-05","F6-06","F6-07","F6-08","F6-09","F6-10","F6-11",
  "F7-01","F7-02","F7-03","F7-04",
];

const asciiEscape = (s) => s.replace(/[^\x00-\x7E]/g, (ch) => {
  const cp = ch.codePointAt(0);
  if (cp > 0xffff) return Array.from(ch).map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
  return "\\u" + cp.toString(16).padStart(4, "0");
});

const l1Source = readFileSync(join(P941, "parts", "prq-checks.js"), "utf8").trim();
const l2Source = readFileSync(join(P941, "parts", "prq-fetch-checks.js"), "utf8").trim();
const combined = l1Source + "\n" + l2Source;

if (!l1Source.includes(L1_ENTRY)) die(`L1 part must define "${L1_ENTRY}".`);
if (!l2Source.includes(L2_ENTRY)) die(`L2 part must define "${L2_ENTRY}".`);
if (!l1Source.includes(CFG_MARKER)) die(`L1 part is missing the CFG injection marker "${CFG_MARKER}".`);
if (!l2Source.includes(CFG_MARKER)) die(`L2 part is missing the CFG injection marker "${CFG_MARKER}".`);

// every register ID is implemented (tagged in a comment at its call site)
for (const id of CHECK_REGISTER) {
  if (!combined.includes(id)) die(`check ${id} is not present in the checks sources.`);
}
// Sandbox reality (944 v2.0.1 incidents, carried as build gates). Run against the sources with
// comments STRIPPED: the file headers document these incidents by name, and a gate that greps
// its own rationale is a gate that can never pass.
const codeOnly = combined
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .split("\n").map((l) => l.replace(/(^|[^:'"\\])\/\/.*$/, "$1")).join("\n");
if (/\bsetTimeout\b|\bsetInterval\b/.test(codeOnly)) die("the production isolate injects NO timers -- remove setTimeout/setInterval.");
if (/\bconsole\./.test(codeOnly)) die("the production isolate injects no console -- use logs.push().");
if (!l2Source.includes("Promise.allSettled")) die("fetch layer must fetch concurrently via Promise.allSettled.");
if (/for\s*\([^)]*\)\s*\{[^}]*await\s+fetchDataFromDriveLink/s.test(l2Source)) die("fetch layer awaits fetchDataFromDriveLink serially inside a loop -- fetch concurrently.");

// zero phantom keys: every literal key referenced at a call site exists in the config universe.
function assertNoPhantomKeys(spec) {
  const KEY_SET = new Set(spec.keyUniverse);
  const seen = new Set();
  const patterns = [/\bT\('([^']+)'\)/g, /\bside\.get\('([^']+)'\)/g, /\bside\.keyOf\('([^']+)'\)/g, /\bA\.([a-zA-Z0-9_]+)\b/g];
  let m;
  for (const re of patterns.slice(0, 3)) { while ((m = re.exec(combined)) !== null) seen.add(m[1]); }
  const phantom = [...seen].filter((k) => !KEY_SET.has(k));
  if (phantom.length) die(`phantom keys not in the config universe: ${phantom.join(", ")}`);
  // Anchor names used as A.<name> must all exist in the generated anchors table.
  const anchorNames = new Set(Object.keys(spec.anchors));
  const usedAnchors = new Set();
  const are = /\bA\.([a-zA-Z0-9_]+)\b/g;
  while ((m = are.exec(combined)) !== null) usedAnchors.add(m[1]);
  const badAnchors = [...usedAnchors].filter((k) => !anchorNames.has(k));
  if (badAnchors.length) die(`unknown anchor name(s) referenced as A.<name>: ${badAnchors.join(", ")}`);
  console.log(`  phantom keys: 0 (${seen.size} literal keys, ${usedAnchors.size} anchors referenced)`);
}

function buildOne({ dir, projectId, slug, displayName, locale, configPath, parityNote }) {
  const spec = deriveSpec(configPath, projectId);
  assertFacts(spec);
  assertNoPhantomKeys(spec);
  writeFileSync(join(dir, "config", `form-spec-${projectId}.json`), JSON.stringify(spec, null, 1));

  const cfg = {
    version: VERSION, projectId,
    modelA: spec.modelA, modelB: spec.modelB,
    perSide: spec.perSide, taskFields: spec.taskFields,
    labels: spec.labels, options: spec.options, types: spec.types,
    gates: spec.gates, heads: spec.heads, i18nHeads: spec.i18nHeads,
    childrenOf: spec.childrenOf, debugSlotKeys: spec.debugSlotKeys,
    anchors: spec.anchors,
    locale,                       // F7-01: supplied, never derived (no locale marker in config)
  };
  // Emitted as a JS OBJECT LITERAL (JSON is valid object-literal syntax), NOT as a JSON string
  // to parse: wrapping it in a string doubles every quote under escaping and, after the 7-bit
  // ASCII pass, tripled the deployable's size. One-space indent keeps any single line short --
  // 944 v1.0.1 learned that a giant single line is a paste-layer risk.
  const cfgLiteral = JSON.stringify(cfg, null, 1);

  const HEADER = `// prq-validator-${projectId} v${VERSION} -- ${displayName} (project ${projectId}).
//
// GENERATED FILE -- do not edit by hand. Rebuild with: node scripts/build-941.mjs
// Composed from (both live in 941-prq-e2e-eval-es-419/, shared by 941 and 942):
//   - parts/prq-checks.js        Layer L1, payload-only  -> validatePrqL1
//   - parts/prq-fetch-checks.js  Layer L2, fetched Drive artifacts -> validatePrqFetch
// Config tables (keys, labels, option vocabularies, gate graph, model names) are DERIVED from
// config/project-config-id-${projectId === 942 ? 941 : 941}.json and injected here -- never hand-typed.
//
// ARCHITECTURE: validate() is a thin wrapper running both sub-validators independently and
// de-duplicating, matching 939-continuity-en-us's validateContinuity/validate903 composition
// and 944's L1/L2 pair. Each sub-validator resolves the payload shape for itself.
//
// CHECKS IMPLEMENTED (build-asserted, one call site each):
//   F1-01..F1-07  completeness           F2-01..F2-07  gate cascades (from displayConditions)
//   F3-01..F3-11  artifact integrity     F4-A..F4-H    content anchoring (fetched debug)
//   F5-01..F5-05  identity               F6-01..F6-11  coherence matrices
//   F7-01..F7-04  batch / metadata
// F5-06 and the four §4 REMOVED-ON-FORK items are deliberately absent, not self-skipping.
//
// Locale assignment for this build: ${locale.language} / ${locale.dialect} (F7-01 warns on drift).
${parityNote ? `// ${parityNote}\n` : ""}//
// Available globals: conversationData, fetchDataFromDriveLink, fetchDataFromDriveZip,
// fetchDataFromGcsLink. Injected arrays: errors, warnings, infos, successes, logs.
`;

  const WRAPPER = `
async function validate(conversationData) {
  try {
    await validatePrqL1(conversationData);
  } catch (e) {
    errors.push('[ROUTE TO LEAD] Form-check layer error: ' + (e && e.message ? e.message : String(e)));
  }
  try {
    await validatePrqFetch(conversationData);
  } catch (e) {
    errors.push('[ROUTE TO LEAD] Artifact-check layer error: ' + (e && e.message ? e.message : String(e)));
  }
  for (const arr of [errors, warnings, infos, successes]) {
    const seen = new Set();
    const kept = arr.filter((x) => { const k = String(x); if (seen.has(k)) return false; seen.add(k); return true; });
    arr.length = 0;
    arr.push(...kept);
  }
}
`;

  const compose = () => asciiEscape(
    HEADER + "\n" + l1Source.replace(CFG_MARKER, cfgLiteral) + "\n\n" +
    l2Source.replace(CFG_MARKER, cfgLiteral) + "\n" + WRAPPER
  );
  const out1 = compose(), out2 = compose();
  const h1 = createHash("sha256").update(out1).digest("hex");
  if (h1 !== createHash("sha256").update(out2).digest("hex")) die("non-deterministic build (rebuild hash mismatch).");
  if (!out1.includes("function validate(conversationData)")) die('output missing "function validate(conversationData)".');
  if (/[^\x00-\x7E]/.test(out1)) die("output is not 7-bit ASCII -- escaping failed.");
  try { new Function(out1); } catch (e) { die(`output does not parse (the tool runs this same gate at save time): ${e.message}`); }

  writeFileSync(join(dir, "validation.js"), out1);
  console.log(`Wrote ${join(dir, "validation.js")} (${(Buffer.byteLength(out1, "utf8") / 1024).toFixed(1)}KB) sha256=${h1.slice(0, 12)}`);
  return spec;
}

// ---------------------------------------------------------------- run
const cfg941 = join(P941, "config", "project-config-id-941.json");
const cfg942own = join(P942, "config", "project-config-id-942.json");

console.log("== 941 (es-419) ==");
const s941 = buildOne({
  dir: P941, projectId: 941, slug: "941-prq-e2e-eval-es-419",
  displayName: "P13n Response Quality E2E Eval (es-419)",
  locale: { language: "Spanish", dialect: "LatAm (All Variants)" },
  configPath: cfg941,
});

console.log("== 942 (zh-CN) ==");
let parityNote = null;
let cfg942 = cfg941;
if (existsSync(cfg942own)) {
  cfg942 = cfg942own;
  // Escalation 11: machine-diff 942's config against 941's on receipt.
  const strip = (p) => {
    const s = deriveSpec(p, 0);
    return JSON.stringify({ modelA: s.modelA, modelB: s.modelB, perSide: s.perSide, taskFields: s.taskFields,
      options: s.options, types: s.types, gates: s.gates, heads: s.heads, i18nHeads: s.i18nHeads,
      childrenOf: s.childrenOf, debugSlotKeys: s.debugSlotKeys });
  };
  const same = strip(cfg941) === strip(cfg942own);
  parityNote = same
    ? "942 config machine-diffed against 941: IDENTICAL in keys, options, gate graph and model names."
    : "942 config DIFFERS from 941 (see build output) -- checks are built from 942's own config.";
  console.log(`  parity vs 941: ${same ? "IDENTICAL" : "DIFFERS -- review the diff before deploying"}`);
} else {
  parityNote = "942's own config export has NOT been received (escalation 11); this build uses 941's config. Re-run the build and re-diff when it lands.";
  console.log("  note: no project-config-id-942.json -- built from 941's config (escalation 11 open).");
}
buildOne({
  dir: P942, projectId: 942, slug: "942-prq-e2e-eval-zh-cn",
  displayName: "P13n Response Quality E2E Eval (zh-CN)",
  locale: { language: "Chinese", dialect: "Mainland (Simplified)" },
  configPath: cfg942, parityNote,
});

console.log(`\nchecks implemented: ${CHECK_REGISTER.length}`);
console.log(`Model A (Test) = "${s941.modelA}"`);
console.log(`Model B (Base) = "${s941.modelB}"`);
