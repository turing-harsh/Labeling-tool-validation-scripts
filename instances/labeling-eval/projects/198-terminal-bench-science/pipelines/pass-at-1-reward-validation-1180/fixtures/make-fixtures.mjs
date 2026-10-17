#!/usr/bin/env node
// Regenerates fixtures/zips/*.zip and fixtures/cases.json — synthetic copies of the real
// Harbor single-trial bundle layout (run 6637059, 2026-10-02), one ZIP per model evaluation.
// Run from anywhere:  node instances/labeling-eval/projects/198-terminal-bench-science/pipelines/pass-at-1-reward-validation-1180/fixtures/make-fixtures.mjs
// Needs the system `zip` CLI. The committed zips + cases.json are the test input; this script
// only exists so a case can be adjusted without hand-editing binaries.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const zipDir = join(here, "zips");
const json = (value) => JSON.stringify(value, null, 2);

const RUN_ID = 7000001;
const CHECKSUM = "0f".repeat(32);
const ROSTER = [
  { model: "openai/gpt-6-sol", agent: "terminus-2", reasoning_effort: "xhigh" },
  { model: "anthropic/claude-opus-5-5", agent: "terminus-2", reasoning_effort: "low" },
  { model: "qwen/qwen3.8-max-0902", agent: "terminus-2", reasoning_effort: "high" },
];

// --- bundles ---------------------------------------------------------------

function bundleFiles({ trialName, model, effort, reward = 0, rewardTxt, checksum = CHECKSUM, drop = [], manifestStatus = "ok", agentMessage = "Inspecting files.", exception = null }) {
  const agent = { name: "terminus-2", model_name: model, override_timeout_sec: 28800.0, kwargs: { reasoning_effort: effort } };
  const passed = reward === 1 ? 7 : 1;
  const tests = Array.from({ length: 7 }, (_, i) => ({
    name: `test_flux.py::test_${i}`,
    status: i < passed ? "passed" : "failed",
    duration: 0.001,
  }));
  return {
    "result.json": json({
      task_name: "terminal-bench-science/demo-task",
      trial_name: trialName,
      task_checksum: checksum,
      config: { trial_name: trialName, agent },
      agent_info: { name: "terminus-2", version: "2.0.0" },
      verifier_result: { rewards: { reward: reward + 0.0 } },
      exception_info: exception,
      started_at: "2026-10-02T04:00:58.746646Z",
      finished_at: "2026-10-02T04:52:57.516518Z",
      agent_execution: { started_at: "2026-10-02T04:01:22.883809Z", finished_at: "2026-10-02T04:43:03.272331Z" },
    }),
    "config.json": json({ trial_name: trialName, agent }),
    "lock.json": json({ agent: { ...agent, skills: [] } }),
    "trial.log": "Selected strategy: _DaytonaDirect\nTrajectory dumped to agent/trajectory.json\n",
    "artifacts/manifest.json": json([
      { source: "/app/solver.py", destination: "artifacts/app/solver.py", type: "file", status: manifestStatus, service: null },
    ]),
    "artifacts/app/solver.py": "print('solve')\n",
    "agent/trajectory.json": json({
      schema_version: "ATIF-v1.7",
      session_id: "00000000-0000-0000-0000-000000000000",
      agent: { name: "terminus-2", version: "2.0.0", model_name: model },
      steps: [
        // The real instruction carries the harbor canary and names the hidden tests.
        { step_id: 1, timestamp: "2026-10-02T04:01:23+00:00", source: "user",
          message: "Solve the task in /app. Hidden tests live in /tests/. harbor-canary GUID 00000000-0000-0000-0000-000000000000" },
        { step_id: 2, timestamp: "2026-10-02T04:01:28+00:00", source: "agent", message: agentMessage },
      ],
    }),
    "verifier/reward.txt": String(rewardTxt ?? reward),
    "verifier/test-stdout.txt": `${passed} passed, ${7 - passed} failed\n`,
    "verifier/ctrf.json": json({
      results: {
        tool: { name: "pytest" },
        summary: { tests: 7, passed, failed: 7 - passed, skipped: 0, pending: 0, other: 0 },
        tests,
      },
    }),
  };
}

function writeZip(name, files, drop = []) {
  for (const rel of drop) delete files[rel];
  const work = mkdtempSync(join(tmpdir(), "fx198-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(work, rel)), { recursive: true });
    writeFileSync(join(work, rel), body);
  }
  const out = join(zipDir, name);
  rmSync(out, { force: true });
  execFileSync("zip", ["-q", "-r", "-X", out, "."], { cwd: work });
  rmSync(work, { recursive: true, force: true });
}

// --- conversation data -----------------------------------------------------

// Each scenario writes its zips as it is built, so clear the folder first.
rmSync(zipDir, { recursive: true, force: true });
mkdirSync(zipDir, { recursive: true });

// One case = a roster (payload) plus one entry per evaluation the run returned.
function scenario(slug, { roster = ROSTER.slice(0, 2), attempts = 1, evals }) {
  const evaluations = evals.map((e, i) => {
    const stem = `${RUN_ID}_${slug}${i + 1}`;
    const trialName = `${stem}__task__Ab${i}`;
    const reward = e.reward ?? 0;
    const valid = e.valid ?? true;
    const zipName = `${stem}.zip`;
    if (e.bundle !== false) {
      writeZip(zipName, bundleFiles({
        trialName, model: e.model, effort: e.effort, reward: valid ? reward : 0,
        rewardTxt: e.rewardTxt, checksum: e.checksum, manifestStatus: e.manifestStatus,
        agentMessage: e.agentMessage, exception: e.exception,
      }), e.drop);
    }
    const trial = { valid, passed: valid ? reward === 1 : false, reward: valid ? reward : 0, rewards: { reward: valid ? reward : 0 }, trial_name: trialName };
    if (!valid) trial.invalid_reason = e.invalidReason || "rate limit (429) from provider";
    const vr = valid ? 1 : 0;
    const cr = valid && reward === 1 ? 1 : 0;
    const agg = {
      n_passed: cr, n_trials: 1, pass_at_1: valid ? reward : 0, pass_at_k: { 1: valid ? reward : 0 },
      n_attempts: 1, n_valid_trials: vr, valid_rollouts: vr, correct_rollouts: cr,
      invalid_rollouts: 1 - vr, n_invalid_trials: 1 - vr, pass_threshold: 1,
    };
    if (!valid) { delete agg.pass_at_1; delete agg.pass_at_k; }
    return {
      // run_id + evaluation id form the bundle stem in production; the fixtures use the
      // slug so each case's zips stay distinct, hence a string id here.
      id: `${slug}${i + 1}`,
      name: `harbor_trial_${i + 1}`,
      status: e.status || "success",
      output: {
        agent: "terminus-2", model: e.model, reasoning_effort: e.effort, cheat_mode: false,
        reward: { reward: trial.reward, source: "result.json", trials: [trial], rewards: { reward: trial.reward }, ...agg },
        trials: [trial], ...agg, trial_name: trialName,
        bundle_url: `gs://llm-as-evaluator-prod/harbor_runs/${zipName}`,
      },
    };
  });

  const payload = {
    input_type: "parsed_json_args",
    inputs: roster.map((r) => ({ ...r, verifier_env: { OPENAI_BASE_URL: "https://api.openai.com/v1" } })),
    evaluations: [{ evaluator_name: "harbor_agent", name: "harbor_trial", config: { n_attempts: attempts } }],
    parse: false,
  };

  const ratings = {
    pass5Eval: { value: {
      locked: true,
      versionIds: ["v1"],
      versionsData: [{
        versionId: "v1", status: "SUCCESS", apiId: "api-1", updatedAt: "2026-10-02T05:08:42.000Z",
        result: { run_id: RUN_ID, status: "success", evaluations, evaluations_failed: 0 },
      }],
      customData: [{
        apiId: "api-1", apiName: "meta", defaultPayload: JSON.stringify(payload, null, 2),
        rewardBlockCriteria: true, rewardBlockCriteriaMaxReward: 0.4,
      }],
    } },
    task: "https://drive.google.com/drive/folders/synthetic-task-folder-0000000000",
  };
  return { ratings };
}

function renameKey(data, key) {
  data.ratings[key] = data.ratings.pass5Eval;
  delete data.ratings.pass5Eval;
  return data;
}

function oracleOnly() {
  const data = renameKey(scenario("oracleonly", { evals: [m(g)] }), "oracle_check");
  const custom = data.ratings.oracle_check.value.customData[0];
  const payload = JSON.parse(custom.defaultPayload);
  payload.inputs = [{ model: "openai/gpt-5.6-sol", agent: "oracle" }];
  custom.defaultPayload = JSON.stringify(payload);
  return data;
}

const g = ROSTER[0], c = ROSTER[1], q = ROSTER[2];
const m = (r, extra = {}) => ({ model: r.model, effort: r.reasoning_effort, ...extra });

const cases = [
  {
    name: "two models, both broken: passes",
    conversationData: scenario("allbroken", { evals: [m(g), m(c)] }),
    expect: { errors: [], successesContain: ["All 2 valid model rollouts broken (openai/gpt-6-sol [xhigh], anthropic/claude-opus-5-5 [low])"] },
  },
  {
    name: "three models, all broken: passes",
    conversationData: scenario("threebroken", { roster: ROSTER, evals: [m(g), m(c), m(q)] }),
    expect: { errors: [], successesContain: ["All 3 valid model rollouts broken"], infosContain: ["3 of 3 valid model rollouts broken"] },
  },
  {
    name: "three models, one broken: fails the every-model gate",
    conversationData: scenario("onebroken", { roster: ROSTER, evals: [m(g, { reward: 1 }), m(c, { reward: 1 }), m(q)] }),
    expect: {
      errorsContain: ["not every model was broken: openai/gpt-6-sol [xhigh], anthropic/claude-opus-5-5 [low] reached reward 1", "1 of 3 models were broken"],
      infosContain: ["reward 0 — BROKEN", "reward 1 — SOLVED (fails the every-model-broken gate)"],
    },
  },
  {
    name: "one solved model among two fails the every-model gate",
    conversationData: scenario("onesolved", { evals: [m(g), m(c, { reward: 1 })] }),
    expect: { errorsContain: ["not every model was broken: anthropic/claude-opus-5-5 [low] reached reward 1", "1 of 2 models were broken"] },
  },
  {
    name: "every model solved: fails the break gate",
    conversationData: scenario("nonebroken", { roster: ROSTER, evals: [m(g, { reward: 1 }), m(c, { reward: 1 }), m(q, { reward: 1 })] }),
    expect: { errorsContain: ["not every model was broken", "0 of 3 models were broken"] },
  },
  {
    name: "invalid rollout never counts as a break",
    conversationData: scenario("invalidonly", { evals: [m(g, { reward: 1 }), m(c, { valid: false })] }),
    expect: { errorsContain: ["not every model was broken: openai/gpt-6-sol [xhigh] reached reward 1", "anthropic/claude-opus-5-5 [low] has an invalid rollout, so that model is not proven broken"] },
  },
  {
    name: "invalid rollout alongside a broken model fails: not proven broken",
    conversationData: scenario("invalidplus", { evals: [m(g), m(c, { valid: false })] }),
    expect: {
      errorsContain: ["anthropic/claude-opus-5-5 [low] has an invalid rollout, so that model is not proven broken"],
      infosContain: ["invalid rollout, not proven broken", "and no rollout may be invalid"],
    },
  },
  {
    name: "no model with a valid rollout fails",
    conversationData: scenario("allinvalid", { evals: [m(g, { valid: false }), m(c, { valid: false })] }),
    expect: { errorsContain: ["no model has a valid rollout", "have invalid rollouts, so those models are not proven broken"] },
  },
  {
    name: "configured model missing from the run fails",
    conversationData: scenario("missingmodel", { roster: ROSTER, evals: [m(g), m(c)] }),
    expect: { errorsContain: ["configured model 3 (qwen/qwen3.8-max-0902) has no harbor_trial evaluation"] },
  },
  {
    name: "payload still configured for five attempts fails",
    conversationData: scenario("fiveattempts", { attempts: 5, evals: [m(g), m(c)] }),
    expect: { errorsContain: ["configures n_attempts=5"] },
  },
  {
    name: "evaluation ran a different model than its payload slot",
    conversationData: scenario("wrongmodel", { evals: [m(g), m(q)] }),
    expect: { errorsContain: ["ran model qwen/qwen3.8-max-0902 but customData defaultPayload input 2 configures anthropic/claude-opus-5-5"] },
  },
  {
    name: "bundle reward.txt disagrees with the recorded reward",
    conversationData: scenario("rewarddrift", { evals: [m(g), m(c, { rewardTxt: 1 })] }),
    expect: { errorsContain: ["disagree on the reward"] },
  },
  {
    name: "models ran different task packages",
    conversationData: scenario("checksumdrift", { evals: [m(g), m(c, { checksum: "ab".repeat(32) })] }),
    expect: { errorsContain: ["ran different task checksums"] },
  },
  {
    name: "missing bundle for one model fails",
    conversationData: scenario("nobundle", { evals: [m(g), m(c, { bundle: false })] }),
    expect: { errorsContain: ["bundle could not be downloaded or expanded"] },
  },
  {
    name: "test project stores the breakpoint as bp1: found by content",
    conversationData: renameKey(scenario("bp1key", { evals: [m(g), m(c)] }), "bp1"),
    expect: { errors: [], infosContain: ['validating the model-eval breakpoint stored as "bp1"'], successesContain: ["All 2 valid model rollouts broken"] },
  },
  {
    name: "oracle breakpoint is never mistaken for the model eval",
    conversationData: oracleOnly(),
    expect: { errorsContain: ["could not be located, and no other rating holds a model harbor_trial evaluation"] },
  },
  {
    name: "instruction canary and /tests mention raise no integrity warning",
    conversationData: scenario("cleaninstr", { evals: [m(g), m(c)] }),
    expect: { errors: [], warnings: [] },
  },
  {
    name: "agent reading the hidden tests is flagged for review",
    conversationData: scenario("agentpeek", { evals: [m(g, { agentMessage: "cat /tests/test_outputs.py" }), m(c)] }),
    expect: { errors: [], warningsContain: ["trajectory integrity indicators require LLM review: private-test reference"] },
  },
  {
    name: "broken rollout that never wrote its output: warnings, not errors",
    conversationData: scenario("nooutput", { evals: [m(g, {
      manifestStatus: "failed",
      drop: ["artifacts/app/solver.py", "verifier/ctrf.json", "verifier/test-stdout.txt"],
      exception: { exception_type: "AgentTimeoutError", exception_message: "Agent execution timed out after 28800 seconds" },
    }), m(c)] }),
    expect: {
      errors: [],
      warningsContain: [
        "has collection status failed (broken rollout, reward 0; review only)",
        "no verifier/ctrf.json (broken rollout",
        "no submitted artifact files (broken rollout",
        "exception_info: AgentTimeoutError",
      ],
      successesContain: ["All 2 valid model rollouts broken"],
    },
  },
  {
    name: "solved rollout missing its verifier evidence still fails",
    conversationData: scenario("solvednoctrf", { evals: [m(g), m(c, { reward: 1, drop: ["verifier/ctrf.json"] })] }),
    expect: { errorsContain: ["valid rollout has no verifier/ctrf.json"] },
  },
];

writeFileSync(join(here, "cases.json"), json(cases) + "\n");
console.log(`wrote ${cases.length} cases and their zips to ${here}`);
