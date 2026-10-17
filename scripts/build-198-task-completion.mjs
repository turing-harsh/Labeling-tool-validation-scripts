#!/usr/bin/env node
// Compose labeling-eval/198-terminal-bench-science/pipelines/task-completion/validation.js, the
// script that runs once at task completion, from the project's three pipeline scripts:
//   1. task-data-validation-1128        the task package in the Drive folder (ratings.task)
//   2. oracle-validation-1183           the Oracle Check result (ratings.oracle_check)
//   3. pass-at-1-reward-validation-1180 the model-eval result + Harbor GCS bundles (ratings.pass5Eval)
//
// Each source is embedded byte-for-byte inside its own factory function whose parameters shadow
// the sandbox's errors/warnings/infos/successes/logs, so the three scripts keep their own
// top-level names and their own "PASS only when errors is empty" logic. The composed validate()
// runs all three in parallel (they share the tool's 30s budget) and merges each stage's findings
// into the real globals in pipeline order.
//
// Re-run after editing any of the three sources:  node scripts/build-198-task-completion.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pipelines = join(root, "instances", "labeling-eval", "projects", "198-terminal-bench-science", "pipelines");

// `overrides` are the only edits made to a source: exact one-line swaps, each of which must
// match exactly once. Task completion accepts only the new task.toml structure, exactly as task
// data validation does; the one difference is that the two test.sh style rules (shell flags, a
// literal reward write in test.sh) are warnings there, not errors.
const STAGES = [
  {
    dir: "task-data-validation-1128",
    factory: "taskDataValidation1128",
    title: "Task data validation (1128)",
    overrides: [["var TEST_SH_STYLE_BLOCKS = true;", "var TEST_SH_STYLE_BLOCKS = false;"]],
  },
  { dir: "oracle-validation-1183", factory: "oracleValidation1183", title: "Oracle validation (1183)" },
  { dir: "pass-at-1-reward-validation-1180", factory: "passEvalValidation1180", title: "Pass eval reward validation (1180)" },
];

const ENTRY = /^(async )?function validate\(conversationData\) \{$/m;

const embedded = STAGES.map(({ dir, factory, overrides = [] }) => {
  let source = readFileSync(join(pipelines, dir, "validation.js"), "utf8").replace(/\s+$/, "");
  if (!ENTRY.test(source)) throw new Error(`build-198-task-completion: ${dir}/validation.js has no top-level validate(conversationData)`);
  if (/module\.exports/.test(source)) throw new Error(`build-198-task-completion: ${dir}/validation.js has a CommonJS tail; drop it first`);
  for (const [from, to] of overrides) {
    const count = source.split(from).length - 1;
    if (count !== 1) throw new Error(`build-198-task-completion: expected exactly one "${from}" in ${dir}/validation.js, found ${count}`);
    source = source.replace(from, () => to);
  }
  return [
    `// ===== ${dir}/validation.js (verbatim${overrides.length ? `, except: ${overrides.map(([, to]) => to).join(" ")}` : ""}) =====`,
    `function ${factory}(errors, warnings, infos, successes, logs) {`,
    source,
    "return validate;",
    `} // ===== end ${dir} =====`,
  ].join("\n");
});

const stageTable = STAGES.map(({ factory, title }) => `  { title: ${JSON.stringify(title)}, factory: ${factory} }`).join(",\n");

const out = `// Terminal-Bench-Science — Task Completion gate (labeling-eval project 198).
//
// GENERATED FILE — do not edit by hand. Rebuild with: node scripts/build-198-task-completion.mjs
// Composed, verbatim, from this project's pipeline scripts:
${STAGES.map(({ dir }) => `//   - pipelines/${dir}/validation.js`).join("\n")}
// The one edit: task data validation's TEST_SH_STYLE_BLOCKS is set to false, so the test.sh
// shell-flag and literal-reward rules warn instead of blocking. task.toml must use the new
// structure here too.
//
// Runs once, at task completion, and blocks unless all three gates pass:
//   1. the task package (ratings.task, a Drive folder) has the ideal structure, with task.toml in
//      the new structure (schema 1.4, turing/<task>, [metadata] domain/category/subcategory);
//   2. every oracle trial of the latest Oracle Check (ratings.oracle_check) scored reward 1;
//   3. every model in the pass eval (ratings.pass5Eval) has a valid, broken rollout, and its
//      Harbor GCS bundle backs the recorded result.
// Each stage runs in its own scope with its own message arrays, so one stage's failure never
// hides another stage's findings or its PASS. All three run in parallel and report in this order.

var TASK_COMPLETION_STAGES = [
${stageTable}
];

async function validate(conversationData) {
  var outcomes = await Promise.all(TASK_COMPLETION_STAGES.map(function (stage) {
    var bucket = { errors: [], warnings: [], infos: [], successes: [], logs: [] };
    return Promise.resolve()
      .then(function () {
        var run = stage.factory(bucket.errors, bucket.warnings, bucket.infos, bucket.successes, bucket.logs);
        return run(conversationData);
      })
      .then(
        function () { return { stage: stage, bucket: bucket, crash: null }; },
        function (e) { return { stage: stage, bucket: bucket, crash: e }; }
      );
  }));

  var failed = [];
  outcomes.forEach(function (outcome) {
    var bucket = outcome.bucket;
    if (outcome.crash) {
      bucket.errors.push(
        'Task Completion — "' + outcome.stage.title + '" | Problem: the check stopped unexpectedly: ' +
          completionMessage(outcome.crash) + '. | Fix: report this task to your lead with this message.'
      );
    }
    ['errors', 'warnings', 'infos', 'successes', 'logs'].forEach(function (kind) {
      var target = { errors: errors, warnings: warnings, infos: infos, successes: successes, logs: logs }[kind];
      bucket[kind].forEach(function (message) { target.push(message); });
    });
    infos.push(
      'Task Completion — ' + outcome.stage.title + ': ' +
        (bucket.errors.length
          ? 'FAIL (' + bucket.errors.length + ' error' + (bucket.errors.length === 1 ? '' : 's') + ')'
          : 'PASS') + '.'
    );
    if (bucket.errors.length) failed.push(outcome.stage.title);
  });

  if (!failed.length) {
    successes.push('Task Completion — all ' + outcomes.length + ' gates pass: task data, oracle, and pass eval.');
  }
}

function completionMessage(e) {
  return e && typeof e === 'object' && e.message ? String(e.message) : String(e);
}

${embedded.join("\n\n")}
`;

const dest = join(pipelines, "task-completion", "validation.js");
writeFileSync(dest, out);
console.log(`wrote ${dest.slice(root.length + 1)} (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
