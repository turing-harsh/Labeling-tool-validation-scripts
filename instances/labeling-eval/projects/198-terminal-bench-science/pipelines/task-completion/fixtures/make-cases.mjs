#!/usr/bin/env node
// Regenerates fixtures/cases.json for the task-completion gate by composing the sibling
// pipelines' own fixtures, so the three stay in step:
//   ratings.task        -> a Drive folder from ../task-data-validation-1128/fixtures/folders/
//   ratings.pass5Eval   -> a case from ../pass-at-1-reward-validation-1180/fixtures/cases.json
//   ratings.oracle_check -> built here (the oracle pipeline has no fixtures of its own)
// fixtures/folders and fixtures/zips are symlinks to those siblings' mock data.
//
// Run: node instances/labeling-eval/projects/198-terminal-bench-science/pipelines/task-completion/fixtures/make-cases.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const passCases = JSON.parse(readFileSync(join(here, "../../pass-at-1-reward-validation-1180/fixtures/cases.json"), "utf8"));

const passEval = (name) => {
  const found = passCases.find((c) => c.name === name);
  if (!found) throw new Error(`make-cases: no pass-at-1 case named "${name}"`);
  return found.conversationData.ratings.pass5Eval;
};
const PASS_EVAL_OK = passEval("two models, both broken: passes");
const PASS_EVAL_SOLVED = passEval("every model solved: fails the break gate");

const oracle = (reward) => ({
  value: {
    locked: true,
    versionIds: ["o1"],
    versionsData: [{
      versionId: "o1",
      status: "SUCCESS",
      updatedAt: "2026-10-02T07:48:16.000Z",
      result: {
        status: "success",
        evaluations: [{
          name: "harbor_trial",
          status: "success",
          output: {
            agent: "oracle",
            n_trials: 1,
            trials: [{ valid: true, passed: reward === 1, reward, rewards: { reward }, trial_name: "7000001__task__oracle" }],
          },
        }],
      },
    }],
  },
});

const folder = (id) => `https://drive.google.com/drive/folders/${id}`;
const ratings = (overrides) => ({
  task: folder("COMPLETE"),
  oracle_check: oracle(1),
  pass5Eval: PASS_EVAL_OK,
  ...overrides,
});
for (const value of Object.values(ratings({}))) if (value === undefined) throw new Error("make-cases: unset rating");

const TASK_PASS = "passes the deterministic upload checks";
const ORACLE_PASS = "oracle trial in the latest current-version run completed with reward 1";
const EVAL_PASS = "DETERMINISTIC PASS";

const strip = (r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null));

const cases = [
  {
    name: "all three gates pass",
    conversationData: { ratings: ratings({}) },
    expect: {
      errors: [],
      successesContain: [TASK_PASS, EVAL_PASS, "all 3 gates pass"],
      infosContain: [ORACLE_PASS, "Task data validation (1128): PASS", "Oracle validation (1183): PASS",
        "Pass eval reward validation (1180): PASS"],
    },
  },
  {
    name: "the real task shape -- ratings read from conversation.ratings",
    conversationData: { conversation: { ratings: ratings({}) } },
    expect: { errors: [], successesContain: ["all 3 gates pass"] },
  },
  {
    name: "task data fails alone: the other two still report PASS",
    conversationData: { ratings: ratings({ task: folder("JUNK") }) },
    expect: {
      errorsContain: ["ships working material: .DS_Store"],
      successesContain: [EVAL_PASS],
      infosContain: [ORACLE_PASS, "Task data validation (1128): FAIL (1 error)", "Pass eval reward validation (1180): PASS"],
      errorsNotContain: ["Oracle Check", "pass5Eval"],
    },
  },
  {
    name: "oracle fails alone: an oracle trial scored 0",
    conversationData: { ratings: ratings({ oracle_check: oracle(0) }) },
    expect: {
      errorsContain: ["every oracle trial must have reward 1"],
      successesContain: [TASK_PASS, EVAL_PASS],
      infosContain: ["Oracle validation (1183): FAIL (1 error)"],
    },
  },
  {
    name: "pass eval fails alone: every model solved the task",
    conversationData: { ratings: ratings({ pass5Eval: PASS_EVAL_SOLVED }) },
    expect: {
      errorsContain: ["not every model was broken"],
      successesContain: [TASK_PASS],
      infosContain: [ORACLE_PASS, "Pass eval reward validation (1180): FAIL"],
    },
  },
  {
    name: "task.toml: the new structure (schema 1.4) is accepted",
    conversationData: { ratings: ratings({}) },
    expect: { errors: [], infosContain: ["task.toml structure: new", "task.toml matches the schema 1.4 structure"] },
  },
  {
    name: "task.toml: the old structure is rejected at completion, as in task data validation",
    conversationData: { ratings: ratings({ task: folder("OLDTOML") }) },
    expect: {
      errorsContain: ["task.toml uses the old structure", "accepts only the new structure"],
      infosContain: ["task.toml structure: old", "Task data validation (1128): FAIL"],
    },
  },
  {
    name: "task.toml: an old package without metadata is rejected as old",
    conversationData: { ratings: ratings({ task: folder("OLDNOMETADATA") }) },
    expect: { errorsContain: ["task.toml uses the old structure", "[metadata] empty"] },
  },
  {
    name: "task.toml: a pre-switch hybrid (new metadata, old name) is old and rejected",
    conversationData: { ratings: ratings({ task: folder("HYBRIDTOML") }) },
    expect: { errorsContain: ["task.toml uses the old structure"], infosContain: ["task.toml structure: old"] },
  },
  {
    name: "task.toml: the new schema (domain, category, free-text subcategory) passes",
    conversationData: { ratings: ratings({}) },
    expect: { errors: [], successesContain: ["all 3 gates pass"], infosContain: ["task.toml matches the schema 1.4 structure"] },
  },
  {
    name: "task.toml: a turing/ name with the old field/subfield keys fails with the rename",
    conversationData: { ratings: ratings({ task: folder("OLDKEYSNEWNAME") }) },
    expect: {
      errorsContain: ["[metadata] category is missing (found field)", "rename field to category and rename subfield to subcategory"],
      infosContain: ["Task data validation (1128): FAIL (1 error)"],
    },
  },
  {
    name: "task.toml: the domain written into category fails with the shift",
    conversationData: { ratings: ratings({ task: folder("SHIFTEDMETADATA") }) },
    expect: { errorsContain: ["category holds the domain \"earth-sciences\"", "set domain = \"earth-sciences\""] },
  },
  {
    name: "task.toml: a category outside the domain's vocabulary fails",
    conversationData: { ratings: ratings({ task: folder("BADCATEGORY") }) },
    expect: { errorsContain: ["[metadata] category \"botany\" is not a category of earth-sciences"] },
  },
  {
    name: "task.toml: a new-structure package is still held to the template",
    conversationData: { ratings: ratings({ task: folder("TOMLGAPS") }) },
    expect: { errorsContain: ["does not match the schema 1.4 structure", "[task] version is missing"] },
  },
  {
    name: "test.sh: missing errexit only warns at completion",
    conversationData: { ratings: ratings({ task: folder("NOERREXIT") }) },
    expect: {
      errors: [],
      warningsContain: ["tests/test.sh does not enable errexit (not blocking at task completion)"],
      successesContain: [TASK_PASS, "all 3 gates pass"],
    },
  },
  {
    name: "test.sh: missing pipefail only warns at completion",
    conversationData: { ratings: ratings({ task: folder("NOPIPEFAIL") }) },
    expect: { errors: [], warningsContain: ["does not enable pipefail (not blocking at task completion)"] },
  },
  {
    name: "test.sh: no literal reward write in test.sh only warns at completion",
    conversationData: { ratings: ratings({ task: folder("NOLITERALREWARD") }) },
    expect: {
      errors: [],
      warningsContain: ["never writes a literal 0 or 1 to /logs/verifier/reward.txt (not blocking at task completion)"],
    },
  },
  {
    name: "test.sh: a non-binary literal reward still blocks at completion",
    conversationData: { ratings: ratings({ task: folder("PARTIALCREDIT") }) },
    expect: { errorsContain: ["non-binary literal reward write"] },
  },
  {
    name: "Dockerfile: commands chained after a pinned pip install pass at completion",
    conversationData: { ratings: ratings({ task: folder("PIPCHAIN") }) },
    expect: { errors: [], successesContain: [TASK_PASS, "all 3 gates pass"] },
  },
  {
    name: "test.sh: a CTRF path built from a script variable passes at completion",
    conversationData: { ratings: ratings({ task: folder("CTRFVAR") }) },
    expect: { errors: [], successesContain: [TASK_PASS, "all 3 gates pass"] },
  },
  {
    name: "the Oracle Check was never run",
    conversationData: { ratings: strip(ratings({ oracle_check: null })) },
    expect: { errorsContain: ["the Oracle Check is missing or has not been run"], successesContain: [TASK_PASS, EVAL_PASS] },
  },
  {
    name: "an empty submission fails all three gates",
    conversationData: { ratings: {} },
    expect: {
      errorsContain: ["the task package link is missing", "the Oracle Check is missing or has not been run", "pass5Eval"],
      infosContain: ["Task data validation (1128): FAIL", "Oracle validation (1183): FAIL", "Pass eval reward validation (1180): FAIL"],
    },
  },
];

writeFileSync(join(here, "cases.json"), JSON.stringify(cases, null, 2) + "\n");
console.log(`wrote fixtures/cases.json (${cases.length} cases)`);
