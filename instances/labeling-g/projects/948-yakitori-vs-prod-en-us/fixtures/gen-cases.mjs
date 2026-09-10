// Generate fixtures/cases.json for project 948 from the two REAL golden tasks.
//
// This suite is deliberately not synthetic. 1271273 and 1271348 are a natural clean/defective
// pair from the same batch, and every check added in v1.1.0 was derived from the difference
// between them, so they are the regression suite:
//   1271273  a well-executed task  -> must stay PASS with ZERO warnings (requirements section 7's
//            "clean task" case, which is what catches the checker's own gaps surfacing as rater
//            fault -- it is the reason the F7-03 expected-source list was found to be wrong)
//   1271348  a defective task      -> must FAIL, naming the debug/page conversation mismatch
//   1271588  a clean SINGLE-TURN task -> must FAIL on the dialect ruling ALONE, nothing else
//
// fixtures/artifacts is a symlink to golden/artifacts, so both resolve against the real fetched
// captures rather than mocks.
//
// Regenerate with:  node fixtures/gen-cases.mjs fixtures/cases.json
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const golden = (id) => JSON.parse(readFileSync(join(here, "..", "golden", `${id}.txt`), "utf8"));

const cases = [
  {
    // A clean SINGLE-TURN task. It is the reason F6-05/F6-12 gained single-turn relief: both
    // rationales are accurate and substantive, nothing is flagged, and the only thing the script
    // had to say was that they lacked a "[Turn 1]" bracket on a conversation with one turn.
    // The remaining dialect warning is genuine and unresolved (see requirements section 6).
    // NOW BLOCKS on the dialect alone (severity review, 10 Sep 2026: the locale is a hard
    // per-project assignment). Everything else about this task is correct -- it is the standing
    // evidence that the ruling blocks otherwise-clean work whenever the batch ships a non-US
    // English task without a dialect column to arbitrate.
    name: "GOLDEN 1271588 (clean single-turn task): only the dialect blocks it",
    conversationData: golden("1271588"),
    expect: { pass: false, errorsContain: ["the dialect is not the dialect this project is assigned"] },
  },
  {
    name: "GOLDEN 1271273 (clean task) passes with zero warnings",
    conversationData: golden("1271273"),
    expect: { pass: true, warnings: [] },
  },
  {
    name: "GOLDEN 1271348 (defective task) fails: debug and saved page are different conversations",
    conversationData: golden("1271348"),
    expect: {
      pass: false,
      errorsContain: [
        "from two different conversations",   // F3-12, the decisive defect
        "holds the link plus other text",     // F3-01, commentary in the debug slots
        "never explains",                     // F6-12, promoted to error in the severity review
      ],
      warningsContain: [
        "in words, but not in the square-bracket form",              // F6-05 stays a warning (format only)
        "rated as about the same, but the per-model ratings differ", // F6-13 stays a warning (judgment)
      ],
    },
  },
];

const out = process.argv[2] || join(here, "cases.json");
writeFileSync(out, JSON.stringify(cases, null, 1));
console.log(`wrote ${out}: ${cases.length} cases (from the real golden payloads)`);
