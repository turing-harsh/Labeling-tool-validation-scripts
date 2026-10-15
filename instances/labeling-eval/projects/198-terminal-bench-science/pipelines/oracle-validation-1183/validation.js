// Terminal-Bench-Science oracle reward gate.
//
// Blocks completion unless every oracle trial in the latest Oracle Check
// for the current task version completed successfully with reward 1.
//
// Supports:
// - Any number of oracle trials.
// - Multiple harbor_trial evaluations.
// - Current multi-trial payloads.
// - Older single-reward payloads.

function validate(conversationData) {
  var ratings = ratingsOf(conversationData);
  var oracleField = ratingByKey(ratings, "oracle_check");
  var oracle = unwrapValue(oracleField);

  if (!oracle || typeof oracle !== "object") {
    fail(
      "the Oracle Check is missing or has not been run",
      "run Oracle Check and confirm every oracle trial completes successfully with reward 1"
    );
    return;
  }

  var records = flattenRecords(oracle.versionsData);

  if (!records.length) {
    fail(
      "the Oracle Check has no recorded run result",
      "run Oracle Check and wait for all oracle trials to finish before completing the task"
    );
    return;
  }

  // Prevent a successful run from an older task version from satisfying
  // the validation gate.
  var versionIds = isArray(oracle.versionIds)
    ? oracle.versionIds.map(String)
    : [];

  if (versionIds.length) {
    var currentRecords = records.filter(function (record) {
      return (
        record &&
        versionIds.indexOf(String(record.versionId || "")) !== -1
      );
    });

    if (!currentRecords.length) {
      fail(
        "the available Oracle Check result belongs to an older task version",
        "rerun Oracle Check for the current task version"
      );
      return;
    }

    records = currentRecords;
  }

  var run = latestRecord(records);
  var runStatus = lower(run && run.status);
  var result = run && run.result;
  var resultStatus = lower(result && result.status);

  if (
    !result ||
    (runStatus && runStatus !== "success") ||
    (resultStatus && resultStatus !== "success")
  ) {
    fail(
      "the latest Oracle Check did not complete successfully" +
        statusDetails(run, result),
      "inspect the Oracle Check error, fix the task or infrastructure issue, and rerun it"
    );
    return;
  }

  var evaluations = oracleEvaluations(result.evaluations);

  if (!evaluations.length) {
    fail(
      "the latest Oracle Check contains no oracle harbor_trial evaluation",
      "rerun Oracle Check and verify that the Harbor evaluator returns oracle results"
    );
    return;
  }

  var totalTrials = 0;
  var fallbackEvaluations = 0;

  for (
    var evaluationIndex = 0;
    evaluationIndex < evaluations.length;
    evaluationIndex++
  ) {
    var evaluation = evaluations[evaluationIndex];
    var evaluationStatus = lower(evaluation && evaluation.status);

    if (evaluationStatus && evaluationStatus !== "success") {
      fail(
        "oracle harbor_trial evaluation " +
          (evaluationIndex + 1) +
          " did not succeed (status = " +
          evaluationStatus +
          ")",
        "inspect its fail_reason or error_code, fix the issue, and rerun Oracle Check"
      );
      return;
    }

    var trials = oracleTrials(evaluation);

    if (trials.length) {
      var declaredTrialCount = oracleDeclaredTrialCount(evaluation);

      if (
        declaredTrialCount !== null &&
        declaredTrialCount !== trials.length
      ) {
        fail(
          "oracle harbor_trial evaluation " +
            (evaluationIndex + 1) +
            " declares " +
            declaredTrialCount +
            " trials but contains " +
            trials.length +
            " trial records",
          "wait for every oracle trial to finish and rerun Oracle Check"
        );
        return;
      }

      for (
        var trialIndex = 0;
        trialIndex < trials.length;
        trialIndex++
      ) {
        var trial = trials[trialIndex] || {};
        var label = trialLabel(trial, totalTrials + 1);

        if (trial.valid === false) {
          fail(
            label + " is marked invalid",
            "inspect the oracle trial error or infrastructure failure and rerun Oracle Check"
          );
          return;
        }

        var trialRewardValue = trialReward(trial);

        if (trialRewardValue === null) {
          fail(
            label + " has no numeric reward",
            "verify that every oracle trial writes a Harbor reward, then rerun Oracle Check"
          );
          return;
        }

        if (
          trialRewardValue !== 0 &&
          trialRewardValue !== 1
        ) {
          fail(
            label +
              " has reward " +
              trialRewardValue +
              "; Harbor task rewards must be binary (0 or 1)",
            "fix the reward-writing logic and rerun Oracle Check"
          );
          return;
        }

        if (trialRewardValue !== 1) {
          fail(
            label +
              " has reward " +
              trialRewardValue +
              "; every oracle trial must have reward 1",
            "inspect that oracle trajectory and verifier logs, fix the solution or verifier, and rerun Oracle Check"
          );
          return;
        }

        if (trial.passed === false) {
          fail(
            label + " is marked failed even though its reward is 1",
            "fix the inconsistent Harbor result and rerun Oracle Check"
          );
          return;
        }

        totalTrials++;
      }

      continue;
    }

    // Backward compatibility for older Oracle Check payloads that contain
    // one direct reward and no trials array.
    var reward = oracleReward(evaluation, result);

    if (reward === null) {
      fail(
        "oracle harbor_trial evaluation " +
          (evaluationIndex + 1) +
          " contains neither trial rewards nor a numeric aggregate reward",
        "verify that the evaluator returns every oracle trial reward, then rerun Oracle Check"
      );
      return;
    }

    if (reward !== 0 && reward !== 1) {
      fail(
        "oracle harbor_trial evaluation " +
          (evaluationIndex + 1) +
          " has reward " +
          reward +
          "; Harbor task rewards must be binary (0 or 1)",
        "fix the reward-writing logic and rerun Oracle Check"
      );
      return;
    }

    if (reward !== 1) {
      fail(
        "oracle harbor_trial evaluation " +
          (evaluationIndex + 1) +
          " has reward " +
          reward +
          "; the required reward is 1",
        "inspect the oracle trajectory and verifier logs, fix the solution or verifier, and rerun Oracle Check"
      );
      return;
    }

    fallbackEvaluations++;
  }

  var checkedCount = totalTrials + fallbackEvaluations;

  if (!checkedCount) {
    fail(
      "the latest Oracle Check contains no oracle trial that can be validated",
      "rerun Oracle Check and verify that it returns one or more oracle trial rewards"
    );
    return;
  }

  infos.push(
    'Oracle Check — "oracle_check" | PASS: all ' +
      checkedCount +
      " oracle trial" +
      (checkedCount === 1 ? "" : "s") +
      " in the latest current-version run completed with reward 1."
  );
}

function fail(problem, fix) {
  errors.push(
    'Oracle Check — "oracle_check" | Problem: ' +
      problem +
      ". | Fix: " +
      fix +
      "."
  );
}

function ratingsOf(conversationData) {
  var data = conversationData || {};

  var candidates = [
    data.task_data &&
      data.task_data.formData &&
      data.task_data.formData.ratings,

    data.task_data && data.task_data.ratings,

    data.conversation && data.conversation.ratings,

    data.conversation &&
      data.conversation.formData &&
      data.conversation.formData.ratings,

    data.raw_data &&
      data.raw_data.formData &&
      data.raw_data.formData.ratings,

    data.raw_data && data.raw_data.ratings,

    data.formData && data.formData.ratings,

    data.ratings
  ];

  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];

    if (
      candidate &&
      (typeof candidate === "object" || isArray(candidate))
    ) {
      return candidate;
    }
  }

  return {};
}

function ratingByKey(ratings, key) {
  if (!ratings) {
    return null;
  }

  if (!isArray(ratings) && typeof ratings === "object") {
    if (Object.prototype.hasOwnProperty.call(ratings, key)) {
      return ratings[key];
    }
  }

  if (isArray(ratings)) {
    for (var i = 0; i < ratings.length; i++) {
      var item = ratings[i] || {};
      var itemKey =
        item.key ||
        item.name ||
        item.ratingKey ||
        item.id;

      if (String(itemKey || "") === String(key)) {
        return item;
      }
    }
  }

  return null;
}

function unwrapValue(field) {
  if (!field || typeof field !== "object") {
    return field;
  }

  return Object.prototype.hasOwnProperty.call(field, "value")
    ? field.value
    : field;
}

function flattenRecords(value) {
  var output = [];

  function visit(item) {
    if (isArray(item)) {
      for (var i = 0; i < item.length; i++) {
        visit(item[i]);
      }

      return;
    }

    if (item && typeof item === "object") {
      output.push(item);
    }
  }

  visit(value);
  return output;
}

function latestRecord(records) {
  var latest = records[0];
  var latestTime = recordTime(latest);

  for (var i = 1; i < records.length; i++) {
    var candidateTime = recordTime(records[i]);

    if (candidateTime >= latestTime) {
      latest = records[i];
      latestTime = candidateTime;
    }
  }

  return latest;
}

function recordTime(record) {
  if (!record || typeof record !== "object") {
    return 0;
  }

  var raw =
    record.updatedAt ||
    record.lastSuccessAt ||
    record.lastAttemptAt ||
    record.createdAt;

  var parsed = raw ? Date.parse(raw) : NaN;

  return isFinite(parsed) ? parsed : 0;
}

function oracleEvaluations(evaluations) {
  if (!isArray(evaluations)) {
    return [];
  }

  var exactMatches = [];
  var agentMatches = [];
  var harborMatches = [];

  for (var i = 0; i < evaluations.length; i++) {
    var evaluation = evaluations[i] || {};
    var output = evaluation.output || {};

    if (
      lower(output.agent) === "oracle" &&
      lower(evaluation.name) === "harbor_trial"
    ) {
      exactMatches.push(evaluation);
    } else if (lower(output.agent) === "oracle") {
      agentMatches.push(evaluation);
    } else if (lower(evaluation.name) === "harbor_trial") {
      harborMatches.push(evaluation);
    }
  }

  if (exactMatches.length) {
    return exactMatches;
  }

  if (agentMatches.length) {
    return agentMatches;
  }

  return harborMatches;
}

function oracleTrials(evaluation) {
  var output = (evaluation && evaluation.output) || {};
  var rewardBlock = output.reward;

  if (isArray(output.trials) && output.trials.length) {
    return output.trials;
  }

  if (
    rewardBlock &&
    typeof rewardBlock === "object" &&
    isArray(rewardBlock.trials) &&
    rewardBlock.trials.length
  ) {
    return rewardBlock.trials;
  }

  return [];
}

function trialReward(trial) {
  if (!trial || typeof trial !== "object") {
    return null;
  }

  var candidates = [
    trial.reward,
    trial.rewards && trial.rewards.reward
  ];

  for (var i = 0; i < candidates.length; i++) {
    var parsed = numeric(candidates[i]);

    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function oracleDeclaredTrialCount(evaluation) {
  var output = (evaluation && evaluation.output) || {};
  var rewardBlock = output.reward;

  var candidates = [
    output.n_trials,
    rewardBlock && rewardBlock.n_trials
  ];

  for (var i = 0; i < candidates.length; i++) {
    var parsed = numeric(candidates[i]);

    if (
      parsed !== null &&
      parsed >= 0 &&
      Math.floor(parsed) === parsed
    ) {
      return parsed;
    }
  }

  return null;
}

function trialLabel(trial, position) {
  var name =
    trial &&
    (trial.trial_name || trial.name || trial.id);

  return name
    ? 'oracle trial "' + String(name) + '"'
    : "oracle trial " + position;
}

function oracleReward(evaluation, result) {
  var output = (evaluation && evaluation.output) || {};
  var rewardBlock = output.reward;

  var candidates = [
    rewardBlock && rewardBlock.reward,

    rewardBlock &&
      rewardBlock.rewards &&
      rewardBlock.rewards.reward,

    output.rewards && output.rewards.reward,

    typeof rewardBlock === "number" ||
    typeof rewardBlock === "string"
      ? rewardBlock
      : null,

    result &&
      result.harbor &&
      result.harbor.summary &&
      result.harbor.summary.reward
  ];

  for (var i = 0; i < candidates.length; i++) {
    var parsed = numeric(candidates[i]);

    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function numeric(value) {
  if (
    typeof value === "number" &&
    isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.replace(/^\s+|\s+$/g, "") !== ""
  ) {
    var parsed = Number(value);

    if (isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function statusDetails(run, result) {
  var details = [];

  if (run && run.status) {
    details.push("run status = " + run.status);
  }

  if (result && result.status) {
    details.push("result status = " + result.status);
  }

  if (result && result.error_code) {
    details.push("error_code = " + result.error_code);
  }

  if (result && result.fail_reason) {
    details.push("fail_reason = " + result.fail_reason);
  }

  return details.length
    ? " (" + details.join(", ") + ")"
    : "";
}

function lower(value) {
  return value === undefined || value === null
    ? ""
    : String(value).toLowerCase();
}

function isArray(value) {
  return (
    Object.prototype.toString.call(value) ===
    "[object Array]"
  );
}