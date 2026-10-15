# 198 — Terminal Bench Science · Pass5 Reward Validation

Runs at the `pass5RewardValidation` breakpoint (trigger 1180) and validates the result the
`pass5Eval` breakpoint (CUSTOM_API_CHECKS → `llm-as-eval/start-run`) stored on the task.

## What changed (2026-10-02)

`pass5Eval` used to run **one model five times** (`n_attempts: 5`, one `harbor_trial`
evaluation, five trials, gate on pass@1 ≤ `rewardBlockCriteriaMaxReward`).

It now runs a **roster of models once each**: the payload lists one input per model, with `n_attempts: 1`.
The run returns one evaluation per input, named `harbor_trial_1 … harbor_trial_N` in payload order.
Each evaluation has a single trial and its own Harbor ZIP
(`gs://llm-as-evaluator-prod/harbor_runs/<run_id>_<evaluation_id>.zip`). Target roster:
GPT-6 Sol, Claude Opus 5.5 (low), and Qwen3.8 Max (0902). The script reads the roster from the
stored payload instead of hard-coding it.

**Gate: the task passes when at least one model with a valid rollout is broken (reward 0).**

Everything else (rating location, version selection, task data shape) is unchanged.

## Checks

Recorded result (`ratings.pass5Eval.value`):
- the current version (from `versionIds`) and `result.status` are success, and `evaluations_failed` is 0
- `customData[].defaultPayload` parses, configures `n_attempts = 1`, and lists no oracle input
- every payload input has exactly one `harbor_trial_N` evaluation and no evaluation is unmatched
  (a missing model is an error, never a silent skip)
- each evaluation's model, agent and reasoning_effort match its payload slot
- no two slots share a model and reasoning effort; trial names and bundle URLs are unique across models
- per model: exactly 1 trial; `output.trials` == `output.reward.trials`; `valid` is boolean; the
  reward is binary and agrees with `rewards.reward`, `passed` and `output.reward.reward`;
  aggregates (`n_trials`, `n_passed`, `pass_at_1`, `pass_at_k[1]`, …) match the trial
- not oracle, not cheat mode
- warning when the bundle or trial name does not follow `<run_id>_<evaluation_id>`
- **gate**: at least 1 valid model has reward 0. Invalid rollouts are excluded and never count as a
  break. An error when no model is valid.

Bundle (one per model, all fetched in parallel with `fetchGcsData(url, { as: 'zip' })`):
- readable, not truncated, safe member paths, exactly one trial, matching the recorded trial
- `result.json` / `config.json` / `lock.json` / trajectory agent, model and reasoning_effort agree
- the reward in the eval output, `result.json` and `verifier/reward.txt` agree; CTRF is consistent with the reward
- a valid rollout has CTRF, non-empty test stdout, submitted artifacts, a trajectory, and no `exception_info`
- artifact manifest, trajectory schema/steps/timestamps, agent timeout, termination signals,
  and integrity indicators (warnings for LLM review)
- across models: every bundle carries the same `task_checksum` and `task_name`

## Not enforced

`rewardBlockCriteriaMaxReward` (still 0.4) is only reported as info. With per-model 0/1 rewards
and the break-one rule, it no longer defines the gate.

## False-positive fixes (2026-10-02, conversation 380342 / run 6637703)

- Trajectory integrity scan (canary, `/tests/`, solution, reward-file references) reads only
  agent steps (message + tool calls). The user step is the task instruction, which itself
  carries the harbor canary, so it fired on every task.
- The "duplicated pass5Eval branches" warning is gone: the tool always stores three copies.
  Copies that disagree are still an error.
- Missing evidence on a **broken** rollout (reward 0) is a warning, not an error: no CTRF,
  empty test stdout, no trajectory, an artifact with a non-`ok` collection status, no
  submitted artifacts, `exception_info` (e.g. AgentTimeoutError), or a duration past the timeout.
  A model that never wrote its output is an ordinary break. On a **solved** rollout (reward 1)
  each of these is still an error.
- A broken rollout needs its reward in result.json or verifier/reward.txt (reward.json is
  accepted too). A solved rollout needs it in both, and all present sources must agree.
