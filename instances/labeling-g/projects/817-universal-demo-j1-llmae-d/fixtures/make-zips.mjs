#!/usr/bin/env node
// Regenerates fixtures/zips/*.zip — small synthetic Harbor packages, one per fixture case.
// Run from anywhere:  node instances/labeling-g/projects/817-universal-demo-j1-llmae-d/fixtures/make-zips.mjs
// Needs the system `zip` CLI (macOS/Linux) — the committed zips are the test input, this
// script only exists so a case can be adjusted without hand-editing binaries.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "zips");
const TASK = "root/pkg/demo-task";

const json = (value) => JSON.stringify(value, null, 2);
const trajectory = json({ steps: [{ role: "assistant", content: "solve" }] });
const certificate = json({
  schema: "harbor.qc/1",
  task: "demo-task",
  profile: "delivery",
  status: "PASS",
  release_eligible: true,
  package_digest: "sha256:demo",
});

// One passing run directory: result.json makes it a terminal trial dir.
function run(prefix, { reward = 1, model = "glm/glm-5.2", frozen = false, extra = {} } = {}) {
  const files = {
    [`${prefix}/result.json`]: json({
      trial_name: "workspace__demo",
      reward,
      agent_info: { name: "opencode", model_info: { name: model } },
    }),
    [`${prefix}/config.json`]: json({
      trial_name: "workspace__demo",
      agent: { name: "opencode", model_name: model },
      environment: { type: "docker" },
    }),
    [`${prefix}/verifier/reward.json`]: json({ reward }),
    [`${prefix}/verifier/reward.txt`]: String(reward),
  };
  files[`${prefix}/agent/${frozen ? "frozen_trajectory.json" : "trajectory.json"}`] = trajectory;
  return { ...files, ...extra };
}

function basePackage() {
  const taskToml = 'schema_version = "1.3"\nartifacts = []\n\n[task]\nname = "demo-task"\n';
  const files = {
    [`${TASK}/task.toml`]: taskToml,
    [`${TASK}/instruction.md`]: "# Demo task\nDo the thing.\n",
    [`${TASK}/README.md`]: "# demo-task\n",
    [`${TASK}/review.csv`]: "field,value\nreviewer,demo\n",
    [`${TASK}/qc_report.html`]:
      `<html><body><h1>QC</h1>\n<script id="qc-certificate" type="application/json">${certificate}</script>\n</body></html>\n`,
    [`${TASK}/client_qc_report.json`]: json({ status: "PASS" }),
    [`${TASK}/client_qc_status.json`]: json({ status: "PASS" }),
    [`${TASK}/client_format_check.json`]: json({ status: "PASS" }),
    [`${TASK}/client_evaluations.csv`]: "axis,result\ndifficulty,2/4\n",
    [`${TASK}/client_programmatic_evidence.csv`]: "check,result\nverifier,pass\n",
    [`${TASK}/client_trial_matrix.csv`]: "trial,reward\nr1,1\n",
    [`${TASK}/evaluation_layout_repair.json`]: json({ repaired: [] }),
    [`${TASK}/finalization_review_reconcile.json`]: json({ reconciled: true }),
    [`${TASK}/client_qc/notes.txt`]: "reviewed\n",
    [`${TASK}/tests/verifier.json`]: json({ verifiers: [{ id: "v1", weight: 1 }] }),
    [`${TASK}/tests/manifest.json`]: json({ tests: ["test_outputs.py"] }),
    [`${TASK}/tests/test.sh`]: "#!/bin/sh\npytest\n",
    [`${TASK}/environment/Dockerfile`]: "FROM python:3.12-slim\n",
    [`${TASK}/environment/_app/task.toml`]: taskToml,
    [`${TASK}/environment/_app/instruction.md`]: "# Demo task\nDo the thing.\n",
    [`${TASK}/solution/solve.sh`]: "#!/bin/sh\necho solved\n",
    [`${TASK}/solution/golden_results.json`]: json({ ok: true }),
  };

  Object.assign(files, run(`${TASK}/evaluations/solvability/r1`));
  // 2/4 difficulty passes: exactly at the deterministic delivery limit.
  [1, 1, 0, 0].forEach((reward, i) => {
    Object.assign(files, run(`${TASK}/evaluations/difficulty/r${i + 1}`, { reward }));
  });
  ["repeat-01", "repeat-02", "repeat-03"].forEach((name) => {
    Object.assign(
      files,
      run(`${TASK}/evaluations/stability/${name}`, {
        frozen: true,
        extra: { [`${TASK}/evaluations/stability/${name}/lock.json`]: json({ frozen: "sha256:demo" }) },
      })
    );
  });
  Object.assign(files, run(`${TASK}/evaluations/platform/e2b/oracle/r1`));
  Object.assign(
    files,
    run(`${TASK}/evaluations/platform/e2b/codex/r1`, {
      extra: { [`${TASK}/evaluations/platform/e2b/codex/r1/sanity_check.md`]: "digest ok\n" },
    })
  );
  Object.assign(files, run(`${TASK}/evaluations/platform/modal/oracle/r1`));
  Object.assign(
    files,
    run(`${TASK}/evaluations/platform/modal/run/r1`, {
      extra: { [`${TASK}/evaluations/platform/modal/run/r1/sanity_check.md`]: "digest ok\n" },
    })
  );
  return files;
}

const drop = (files, ...paths) => {
  for (const path of paths) delete files[`${TASK}/${path}`];
  return files;
};
const dropTree = (files, prefix) => {
  for (const path of Object.keys(files)) {
    if (path.startsWith(`${TASK}/${prefix}`)) delete files[path];
  }
  return files;
};

const CASES = {
  // Delivery-complete package: passes every profile.
  "complete.zip": () => basePackage(),

  // Structural breaks (blocking in every profile).
  "no-grader-spec.zip": () => drop(basePackage(), "tests/verifier.json", "tests/manifest.json"),
  "empty-solution.zip": () => {
    const files = dropTree(basePackage(), "solution/");
    files[`${TASK}/solution/solve.sh`] = "";
    return files;
  },
  "mirror-drift.zip": () => {
    const files = basePackage();
    files[`${TASK}/environment/_app/task.toml`] = 'schema_version = "1.3"\n\n[task]\nname = "other-task"\n';
    return files;
  },
  "nested-package.zip": () => {
    const files = basePackage();
    files[`${TASK}/subtask/task.toml`] = '[task]\nname = "nested"\n';
    return files;
  },

  // Package-quality gaps (advisory at upload, blocking at audit/delivery).
  "bad-evaluation-json.zip": () => {
    const files = basePackage();
    files[`${TASK}/evaluations/difficulty/r1/verifier/reward_detail.json`] = '{"weights": ';
    return files;
  },
  "three-difficulty-trials.zip": () => dropTree(basePackage(), "evaluations/difficulty/r4"),
  "too-easy.zip": () => {
    const files = basePackage();
    // 3/4 passes -> over the 2/4 deterministic delivery limit.
    Object.assign(files, run(`${TASK}/evaluations/difficulty/r3`, { reward: 1 }));
    return files;
  },
  "wrong-model.zip": () => {
    const files = basePackage();
    Object.assign(files, run(`${TASK}/evaluations/difficulty/r2`, { reward: 0, model: "anthropic/claude" }));
    return files;
  },
  "stability-lock-drift.zip": () => {
    const files = basePackage();
    files[`${TASK}/evaluations/stability/repeat-03/lock.json`] = json({ frozen: "sha256:different" });
    return files;
  },
  "no-certificate.zip": () => drop(basePackage(), "qc_report.html"),
  "no-platform-axis.zip": () => dropTree(basePackage(), "evaluations/platform/"),
  "task-only.zip": () => dropTree(basePackage(), "evaluations/"),
};

mkdirSync(outDir, { recursive: true });
for (const [name, build] of Object.entries(CASES)) {
  const staging = mkdtempSync(join(tmpdir(), "harbor-fixture-"));
  try {
    for (const [path, content] of Object.entries(build())) {
      const full = join(staging, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    const target = join(outDir, name);
    rmSync(target, { force: true });
    execFileSync("zip", ["-rqX", target, "root"], { cwd: staging });
    console.log(`wrote zips/${name}`);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}
