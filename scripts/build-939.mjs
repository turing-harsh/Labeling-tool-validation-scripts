#!/usr/bin/env node
// Compose 939's deployable validation.js from two sources:
//   1. parts/continuity-checks.js   -> the F1–F7 continuity checks (validateContinuity)
//   2. 903-ko-kr/validation.js      -> the v3.2.32 debug/HTML/identity pipeline (verbatim)
// 939 is a duplicate of 903 that must ALSO verify 903's criteria, so the deployed script runs
// both. 903 is embedded byte-for-byte (validate -> validate903) so it stays a single source.
// Re-run this after editing either source:  node scripts/build-939.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const proj = join(root, "instances", "labeling-g", "projects", "939-continuity-en-us");
const src903Path = join(root, "instances", "labeling-g", "projects", "903-ko-kr", "validation.js");

const continuity = readFileSync(join(proj, "parts", "continuity-checks.js"), "utf8").trim();
const formSpec = readFileSync(join(proj, "config", "form-spec-3778.json"), "utf8").trim();
const specConst = `// Injected from config/form-spec-3778.json by build-939.mjs — the 939 form config (review-criteria 3778).\nconst FORM_SPEC = ${formSpec};`;

// 903, verbatim except: rename its entry point and drop the CommonJS export tail.
let s903 = readFileSync(src903Path, "utf8");
s903 = s903.replace("async function validate(conversationData) {", "async function validate903(conversationData) {");
s903 = s903.replace(/\nif \(typeof module !== 'undefined' && module\.exports\) \{[\s\S]*?\n\}\n?$/,"\n");
s903 = s903.trim();

// Verify that the shared fixes are present in the 903 source.
if (!s903.includes('aHtml.conversationId !== bHtml.conversationId')) throw new Error("build-939: cross-HTML conversationId guard not found in 903 source — apply it there first.");

const header = `// v1.1.0-continuity-en-us — 0824 Continuity (en-US) - Turing Duplicate (projectId 939).
//
// GENERATED FILE — do not edit by hand. Rebuild with: node scripts/build-939.mjs
// Composed from:
//   - parts/continuity-checks.js            (F1–F7 continuity checks -> validateContinuity)
//   - ../903-ko-kr/validation.js            (v3.2.32 debug/HTML/identity pipeline -> validate903, verbatim)
//
// 939 is a duplicate spun off from 903 and must verify BOTH:
//   (1) the F1–F7 form-completeness / gate / coherence criteria, AND
//   (2) 903's artifact-integrity, content-anchoring, Model-ID identity, footprints,
//       byte-identical, cross-conversation, full-share and HTML-pipeline criteria.
// Both push into the shared errors/warnings/infos/successes/logs; the entry point below runs
// each and then de-duplicates identical messages.

async function validate(conversationData) {
  // (1) F1–F7 continuity checks
  try {
    await validateContinuity(conversationData);
  } catch (e) {
    errors.push('Continuity-checks error: ' + (e && e.message ? e.message : String(e)));
  }
  // (2) 903 v3.2.32 pipeline (debug/HTML/identity). In the tool runtime this fetches the
  //     linked Drive artifacts; content/identity findings are raised on the fetched text.
  try {
    await validate903(conversationData);
  } catch (e) {
    errors.push('903-pipeline error: ' + (e && e.message ? e.message : String(e)));
  }
  // Suppress the 903 HTML model-identity FALSE POSITIVE for 939: the saved Gemini page shows
  // the Gemini-UI codename ("Nippon - …") while the form assigns the platform name
  // ("Mode 23 -> …"). Same model, different naming layer. Drop the finding ONLY when the
  // on-page and assigned names share the discriminating suffix (Ramen (top-20) / Prod Frozen)
  // — a genuine swap (suffix differs) still fires.
  {
    const stripPrefix = (s) => String(s).replace(/^\\s*[^-→⇒>]+?\\s*(?:->|→|⇒|>|-)\\s*/, '');
    const canon = (s) => stripPrefix(s).normalize('NFC').toLowerCase().replace(/[^a-z0-9]+/g, '');
    for (let i = errors.length - 1; i >= 0; i--) {
      const m = errors[i];
      if (!/uploaded HTML (?:doesn't match the model assigned|is actually the other model)/.test(m)) continue;
      const on = (m.match(/shows model "([^"]+)"/) || [])[1];
      const exp = (m.match(/(?:expected|was assigned) "([^"]+)"/) || [])[1];
      if (on && exp && canon(on) && canon(on) === canon(exp)) {
        logs.push('Suppressed HTML-identity mismatch (Gemini-UI codename vs form name; model suffix matches): ' + m.slice(0, 160));
        errors.splice(i, 1);
      }
    }
  }

  // Suppress the 903 prompt-mismatch FALSE POSITIVE for 939: in continuity tasks the "Prompt"
  // field is the FOLLOW-UP (Turn 2+) question, not the Turn 1 prompt. The 903 pipeline assumes
  // Prompt == Turn 1 and fires "first prompt doesn't match" / "from different conversations"
  // on every multi-turn task. These are structurally wrong for 939 — drop them.
  {
    const promptMismatchRe = /first prompt doesn't match the prompt you submitted|"Prompt" field and Turn \\d+ debug are from different conversations|uploaded HTML doesn't contain the prompt you submitted/;
    for (let i = errors.length - 1; i >= 0; i--) {
      if (promptMismatchRe.test(errors[i])) {
        logs.push('Suppressed prompt-mismatch (continuity: Prompt field is the follow-up turn, not Turn 1): ' + errors[i].slice(0, 160));
        errors.splice(i, 1);
      }
    }
  }

  // De-duplicate identical messages produced by both passes.
  for (const arr of [errors, warnings, infos, successes]) {
    const seen = new Set();
    const kept = arr.filter((x) => { const k = String(x); if (seen.has(k)) return false; seen.add(k); return true; });
    arr.length = 0;
    arr.push(...kept);
  }
}
`;

const out = `${header}\n// ======================================================================\n// FORM CONFIG (source: config/form-spec-3778.json)\n// ======================================================================\n${specConst}\n\n// ======================================================================\n// PART 1 — F1–F7 continuity checks (source: parts/continuity-checks.js)\n// ======================================================================\n${continuity}\n\n// ======================================================================\n// PART 2 — embedded 903 v3.2.32 pipeline (source: 903-ko-kr/validation.js, verbatim)\n// ======================================================================\n${s903}\n`;

const dest = join(proj, "validation.js");
writeFileSync(dest, out);
const kb = (Buffer.byteLength(out, "utf8") / 1024).toFixed(1);
console.log(`Wrote ${dest} (${kb}KB)`);
console.log("contains 'function validate(conversationData)':", out.includes("function validate(conversationData)"));
console.log("contains validateContinuity:", out.includes("async function validateContinuity(conversationData)"));
console.log("contains validate903:", out.includes("async function validate903(conversationData)"));
