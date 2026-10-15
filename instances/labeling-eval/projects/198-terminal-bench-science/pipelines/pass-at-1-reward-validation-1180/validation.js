// Terminal-Bench-Science post-evaluation deterministic validator — Pass5 Reward Validation.
//
// Live labeling-tool script. The platform calls validate(conversationData) and
// supplies these globals:
//   errors, warnings, infos, successes, logs, fetchGcsData
//
// The pass5Eval breakpoint no longer runs one model five times. It runs a model
// roster once each: the eval payload (customData[].defaultPayload) lists one
// input per model and n_attempts = 1, and the run returns one evaluation per
// input, named harbor_trial_1 … harbor_trial_N in payload order, each with its
// own single trial and its own Harbor GCS result ZIP.
//
// For every model the validator checks the recorded trial, downloads and
// expands that model's ZIP through fetchGcsData, and cross-checks the trial
// evidence. The gate is then:
//
//   PASS when at least one model with a valid rollout was broken (reward 0).
//
// A failed verifier test/reward 0 is an ordinary valid failure — that is what
// "broken" means. A rollout already marked invalid is excluded and never
// counts as a break; the script checks that the bundle supports exclusion.
// Scientific/fairness/causal judgments remain in the separate LLM QD and are
// not merged into this validator's result.

var RATING_KEY = 'pass5Eval';
var EXPECTED_ATTEMPTS = 1;
var MIN_BROKEN_MODELS = 1;
var EVALUATOR_PATTERN = /^harbor_trial(?:_(\d+))?$/;
// The breakpoint key actually read. Project 198 stores it as RATING_KEY; test projects
// that copy the breakpoint under another key (e.g. "bp1") are found by content instead,
// see findRatings. PREFIX follows whichever key was read.
var ratingKey = RATING_KEY;
var PREFIX = prefixFor(ratingKey);
var EPSILON = 1e-12;

async function validate(conversationData) {
  ratingKey = RATING_KEY;
  PREFIX = prefixFor(ratingKey);

  if (typeof fetchGcsData !== 'function') {
    fail(
      'this validator cannot read Harbor GCS result bundles because fetchGcsData is unavailable',
      'deploy the run-checks-api build that exposes fetchGcsData, then rerun the check'
    );
    return;
  }

  var findings = { errors: [], warnings: [] };
  var run;

  try {
    run = validateRun(conversationData, findings);
  } catch (e) {
    fail('the ' + ratingKey + ' result cannot be parsed: ' + msgOf(e), 'rerun the evaluation or repair its saved result');
    return;
  }

  flushFindings(findings);
  if (!run) return;

  run.models.forEach(function (model) {
    infos.push(PREFIX + model.label + ': ' + describeOutcome(model) + '.');
  });

  infos.push(
    PREFIX + 'Recorded outcome before LLM judgment: ' + run.broken_models + ' of ' + run.valid_models +
      ' valid model rollout' + (run.valid_models === 1 ? '' : 's') + ' broken (' +
      run.models.length + ' model' + (run.models.length === 1 ? '' : 's') + ' recorded, ' +
      run.invalid_models + ' invalid). Gate: at least ' + MIN_BROKEN_MODELS + ' model must be broken in ' +
      EXPECTED_ATTEMPTS + ' attempt.'
  );

  if (run.maximum_reward !== null) {
    infos.push(
      PREFIX + 'Note: customData rewardBlockCriteriaMaxReward is ' + displayNumber(run.maximum_reward) +
        '; this validator gates on the break-at-least-one-model rule, not on that value.'
    );
  }

  infos.push(
    PREFIX + 'Scope: this validator uses the valid/invalid classifications recorded in ' + ratingKey +
      '; the separate LLM trajectory judgment is not incorporated into this result.'
  );

  // Fetch every model's bundle in parallel: the GCS fetch budget is per call,
  // the script budget is shared.
  var withBundle = run.models.filter(function (model) { return !!model.bundle_url; });
  run.models.forEach(function (model) {
    if (!model.bundle_url) {
      fail(
        model.label + ' has no output.bundle_url, so its recorded trial cannot be independently checked',
        'store the Harbor GCS ZIP URI in output.bundle_url and rerun this validation'
      );
    }
  });

  var envelopes = await Promise.all(withBundle.map(function (model) {
    var url = consoleUrlToGs(model.bundle_url) || model.bundle_url;
    return fetchGcsData(url, { as: 'zip' }).then(
      function (envelope) { return { model: model, url: url, envelope: envelope }; },
      function (e) { return { model: model, url: url, error: e }; }
    );
  }));

  envelopes.forEach(function (fetched) {
    checkModelBundle(fetched.model, fetched.url, fetched.envelope, fetched.error);
  });

  crossModelChecks(run.models.filter(function (model) { return model.bundle_checked; }));

  infos.push(
    PREFIX + 'Archive note: expanded member paths and fetch completeness were checked; ' +
      'raw ZIP CRC and Unix file-mode checks remain the responsibility of fetchGcsData.'
  );

  if (!errors.length) {
    successes.push(
      PREFIX + 'DETERMINISTIC PASS: the recorded rollout validity, rewards, bundle evidence, and break count are ' +
        'internally consistent. ' + run.broken_models + ' of ' + run.valid_models + ' valid model rollout' +
        (run.valid_models === 1 ? '' : 's') + ' broken (' + listed(run.models.filter(isBroken).map(modelName)) +
        '). LLM trajectory judgment is reported separately.'
    );
  }
}

function checkModelBundle(model, bundleUrl, envelope, fetchError) {
  var tag = model.label + ' bundle';

  if (fetchError) {
    fail(
      tag + ' could not be downloaded or expanded: ' + msgOf(fetchError),
      'confirm the object exists, grant the automation account access, and rerun the check'
    );
    return;
  }

  var meta = objectAt(envelope && envelope.meta);
  var bundle = index(objectAt(envelope && envelope.files), objectAt(envelope && envelope.sizes));

  logs.push(model.label + ' — Harbor bundle URL: ' + bundleUrl);

  if (!bundle.paths.length) {
    fail(tag + ' contains no readable files', 'confirm output.bundle_url points to the completed Harbor run ZIP');
    return;
  }

  var zipObjects = bundle.paths.filter(function (p) { return /\.zip$/i.test(p); });
  var expandedEvidence = bundle.paths.filter(function (p) {
    return /(^|\/)result\.json$/i.test(p) || /(^|\/)reward\.(txt|json)$/i.test(p) || /(^|\/)ctrf\.json$/i.test(p);
  });

  if (zipObjects.length && !expandedEvidence.length) {
    logs.push('fetchGcsData returned unexpanded archive object(s): ' + listed(zipObjects) + '.');
    fail(
      'fetchGcsData accessed ' + tag + ' but returned the ZIP without expanding it: ' + listed(zipObjects),
      'confirm output.bundle_url points to a ZIP and fetch it with { as: "zip" }, then rerun validation'
    );
    return;
  }

  if (meta.truncated === true) {
    fail(
      tag + ' was only partially read, so missing evidence cannot be evaluated safely',
      'reduce the bundle below the fetch limits or increase the fetch limit and rerun validation'
    );
  }

  var skipped = isArray(meta.skipped) ? meta.skipped : [];
  if (skipped.length) {
    warnings.push(
      PREFIX + 'Warning: ' + tag + ': ' + skipped.length + ' entr' + (skipped.length === 1 ? 'y was' : 'ies were') +
        ' not readable: ' + listed(skipped.map(describeSkipped)) + '.'
    );
  }

  var unsafe = bundle.paths.filter(unsafePath);
  if (unsafe.length) {
    fail(
      tag + ' contains unsafe member paths: ' + listed(unsafe),
      'regenerate the ZIP without absolute paths, backslashes, or parent-directory traversal'
    );
  }

  var bundleFindings = { errors: [], warnings: [] };
  var report;

  try {
    report = validateBundle(bundle, model, bundleFindings);
  } catch (e) {
    bundleFindings.errors.push('bundle validation stopped: ' + msgOf(e));
  }

  flushFindings(bundleFindings, model.label);

  logs.push(model.label + ' — Harbor bundle contents: ' + bundle.paths.length + ' readable file(s).');
  logFiles(bundle.paths);

  if (report) {
    infos.push(
      PREFIX + model.label + ' bundle: ' + report.trial_count + ' trial director' + (report.trial_count === 1 ? 'y' : 'ies') +
        '; task ' + (report.task_names.length ? report.task_names.join(', ') : 'unknown') +
        '; checksum ' + (report.task_checksums.length ? report.task_checksums.join(', ') : 'unknown') + '.'
    );
  }

  model.task_names = report ? report.task_names : [];
  model.task_checksums = report ? report.task_checksums : [];
  model.bundle_checked = true;
}

// Every model must have attempted the same task package.
function crossModelChecks(models) {
  for (var i = 0; i < models.length; i++) {
    for (var j = i + 1; j < models.length; j++) {
      var a = models[i];
      var b = models[j];
      var aSum = a.task_checksums.join(',');
      var bSum = b.task_checksums.join(',');
      if (aSum && bSum && aSum !== bSum) {
        errors.push(
          PREFIX + 'Problem: ' + a.label + ' and ' + b.label + ' ran different task checksums (' + aSum + ' vs ' +
            bSum + '); every model must attempt the same task package.'
        );
      }
      var aName = a.task_names.join(',');
      var bName = b.task_names.join(',');
      if (aName && bName && aName !== bName) {
        errors.push(
          PREFIX + 'Problem: ' + a.label + ' and ' + b.label + ' disagree on task_name (' + aName + ' vs ' + bName + ').'
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Recorded result: roster, per-model trial, and the break gate.
// ---------------------------------------------------------------------------

function validateRun(conversationData, findings) {
  var located = findRatings(conversationData, findings);
  var ratings = located.ratings;
  var passValue = unwrapValue(ratingByKey(ratings, ratingKey));

  if (!passValue || typeof passValue !== 'object') {
    throw new Error('ratings.' + ratingKey + '.value is missing or is not an object');
  }

  var version = selectCurrentVersion(passValue, findings);
  var status = lower(version.status);
  if (status && !successStatus(status)) {
    findings.errors.push('current ' + ratingKey + ' version status is ' + String(version.status) + ', not success');
  }

  var result = objectAt(version.result);
  if (!Object.keys(result).length) {
    throw new Error('current ' + ratingKey + ' version has no result object');
  }

  var resultStatus = lower(result.status);
  if (resultStatus && !successStatus(resultStatus)) {
    findings.errors.push(ratingKey + ' result status is ' + String(result.status) + ', not success');
  }

  var failedCount = numeric(result.evaluations_failed);
  if (failedCount !== null && failedCount > 0) {
    findings.errors.push(
      'the run reports ' + failedCount + ' failed evaluation' + (failedCount === 1 ? '' : 's') +
        '; every model in the roster must complete its attempt'
    );
  }

  var roster = expectedRoster(passValue, version, findings);

  var evaluations = (isArray(result.evaluations) ? result.evaluations : []).filter(function (evaluation) {
    return evaluation && typeof evaluation.name === 'string' && EVALUATOR_PATTERN.test(evaluation.name) &&
      objectAt(evaluation.output) === evaluation.output;
  });

  if (!evaluations.length) {
    throw new Error('no harbor_trial evaluation with an output object was found');
  }

  var byName = {};
  evaluations.forEach(function (evaluation) {
    if (byName[evaluation.name]) {
      findings.errors.push('more than one ' + evaluation.name + ' evaluation was found');
    }
    byName[evaluation.name] = true;
  });

  var slots = assignRoster(evaluations, roster, findings);
  var models = [];
  var seenTrials = {};
  var seenBundles = {};

  slots.forEach(function (slot) {
    var model = validateModel(slot.evaluation, slot.input, slot.position, result, findings);

    if (model.trial && seenTrials[model.trial.trial_name]) {
      findings.errors.push(
        'trial_name ' + model.trial.trial_name + ' is recorded for both ' + seenTrials[model.trial.trial_name] +
          ' and ' + model.label
      );
    }
    if (model.trial) seenTrials[model.trial.trial_name] = model.label;

    if (model.bundle_url && seenBundles[model.bundle_url]) {
      findings.errors.push(
        model.label + ' and ' + seenBundles[model.bundle_url] + ' point to the same bundle_url ' + model.bundle_url
      );
    }
    if (model.bundle_url) seenBundles[model.bundle_url] = model.label;

    models.push(model);
  });

  var modelIds = {};
  models.forEach(function (model) {
    var key = lower(model.model) + '|' + lower(model.reasoning_effort);
    if (model.model && modelIds[key]) {
      findings.errors.push(
        model.label + ' repeats the model and reasoning effort of ' + modelIds[key] +
          '; each roster entry must be a distinct model configuration'
      );
    }
    if (model.model) modelIds[key] = model.label;
  });

  var valid = models.filter(function (m) { return m.valid === true && m.reward !== null; });
  var broken = valid.filter(isBroken);
  var invalid = models.filter(function (m) { return m.valid !== true; });

  if (!valid.length) {
    findings.errors.push('no model has a valid rollout; the break count is undefined and the evaluation must be rerun');
  } else if (broken.length < MIN_BROKEN_MODELS) {
    findings.errors.push(
      'no model was broken: every valid rollout (' + listed(valid.map(modelName)) + ') reached reward 1, but the ' +
        'task must break at least ' + MIN_BROKEN_MODELS + ' model in ' + EXPECTED_ATTEMPTS + ' attempt'
    );
  }

  if (invalid.length) {
    findings.warnings.push(
      listed(invalid.map(modelName)) + (invalid.length === 1 ? ' has an invalid rollout' : ' have invalid rollouts') +
        ' and ' + (invalid.length === 1 ? 'is' : 'are') + ' excluded from the break count; report the reduced roster ' +
        'explicitly to the client'
    );
  }

  return {
    ratings_source: located.name,
    run_id: result.run_id,
    models: models,
    valid_models: valid.length,
    broken_models: broken.length,
    invalid_models: invalid.length,
    maximum_reward: configuredThreshold(passValue, findings)
  };
}

// The models the breakpoint was configured to run, read from the payload the
// platform sent. Returns null when no payload can be read: the roster is then
// whatever the run returned, with a warning.
function expectedRoster(passValue, version, findings) {
  var custom = isArray(passValue.customData) ? passValue.customData.filter(isObject) : [];
  var matching = custom.filter(function (entry) { return version.apiId && entry.apiId === version.apiId; });
  var entries = matching.length ? matching : custom;
  var entry = entries.filter(function (e) { return typeof e.defaultPayload === 'string' || isObject(e.defaultPayload); })[0];

  if (!entry) {
    findings.warnings.push(
      'no customData defaultPayload is stored, so the model roster cannot be checked against the configuration; ' +
        'using the evaluations the run returned'
    );
    return null;
  }

  var payload = entry.defaultPayload;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      findings.errors.push('customData defaultPayload is not valid JSON: ' + msgOf(e));
      return null;
    }
  }
  payload = objectAt(payload);

  var harbor = (isArray(payload.evaluations) ? payload.evaluations : []).filter(function (e) {
    return isObject(e) && (e.name === 'harbor_trial' || e.evaluator_name === 'harbor_agent');
  });
  if (!harbor.length) {
    findings.errors.push('customData defaultPayload has no harbor_trial evaluation');
  }
  harbor.forEach(function (e) {
    var attempts = numeric(objectAt(e.config).n_attempts);
    if (attempts !== EXPECTED_ATTEMPTS) {
      findings.errors.push(
        'customData defaultPayload configures n_attempts=' + String(objectAt(e.config).n_attempts) +
          '; each model must get exactly ' + EXPECTED_ATTEMPTS + ' attempt'
      );
    }
  });

  var inputs = isArray(payload.inputs) ? payload.inputs.filter(isObject) : [];
  if (!inputs.length) {
    findings.errors.push('customData defaultPayload lists no model inputs');
    return null;
  }

  inputs.forEach(function (input, i) {
    if (lower(input.agent) === 'oracle') {
      findings.errors.push('customData defaultPayload input ' + (i + 1) + ' is an oracle run; model rollouts are required');
    }
  });

  return inputs;
}

// Pair each evaluation with its roster input: harbor_trial_N is inputs[N-1].
// An unnumbered harbor_trial (single-input runs) is matched by model.
function assignRoster(evaluations, roster, findings) {
  var slots = [];
  var used = {};

  evaluations.forEach(function (evaluation, i) {
    var match = EVALUATOR_PATTERN.exec(evaluation.name);
    var position = match[1] ? Number(match[1]) : null;
    var input = null;

    if (roster) {
      if (position !== null) {
        input = roster[position - 1] || null;
        if (!input) {
          findings.errors.push(
            evaluation.name + ' has no matching input in customData defaultPayload (' + roster.length + ' configured)'
          );
        }
      } else {
        for (var r = 0; r < roster.length; r++) {
          if (!used[r] && roster[r].model === objectAt(evaluation.output).model) {
            position = r + 1;
            input = roster[r];
            break;
          }
        }
        if (!input) {
          findings.errors.push(
            evaluation.name + ' (model ' + String(objectAt(evaluation.output).model) +
              ') matches no input in customData defaultPayload'
          );
        }
      }
      if (input) used[position - 1] = true;
    }

    slots.push({ evaluation: evaluation, input: input, position: position !== null ? position : i + 1 });
  });

  if (roster) {
    roster.forEach(function (input, r) {
      if (!used[r]) {
        findings.errors.push(
          'configured model ' + (r + 1) + ' (' + String(input.model) + ') has no harbor_trial evaluation in the run; ' +
            'every model in the roster must be attempted — a missing model cannot be silently skipped'
        );
      }
    });
  }

  slots.sort(function (a, b) { return a.position - b.position; });
  return slots;
}

function validateModel(evaluation, input, position, result, findings) {
  var output = objectAt(evaluation.output);
  var label = evaluation.name + ' (' + String(output.model || 'unknown model') + ')';
  var local = { errors: [], warnings: [] };

  var evaluationStatus = lower(evaluation.status);
  if (evaluationStatus && !successStatus(evaluationStatus)) {
    local.errors.push('evaluation status is ' + String(evaluation.status) + ', not success');
  }

  if (lower(output.agent) === 'oracle') {
    local.errors.push('points to an oracle run; a model rollout is required');
  }
  if (output.cheat_mode === true) {
    local.errors.push('points to a cheat-mode run; an ordinary model rollout is required');
  }

  if (input) {
    if (input.model !== undefined && output.model !== input.model) {
      local.errors.push('ran model ' + String(output.model) + ' but customData defaultPayload input ' + position +
        ' configures ' + String(input.model));
    }
    if (input.agent !== undefined && output.agent !== input.agent) {
      local.errors.push('ran agent ' + String(output.agent) + ' but customData defaultPayload input ' + position +
        ' configures ' + String(input.agent));
    }
    if (input.reasoning_effort !== undefined && output.reasoning_effort !== undefined &&
        lower(output.reasoning_effort) !== lower(input.reasoning_effort)) {
      local.errors.push('ran reasoning_effort ' + String(output.reasoning_effort) + ' but customData defaultPayload input ' +
        position + ' configures ' + String(input.reasoning_effort));
    }
  }

  var rewardObject = objectAt(output.reward);
  var topTrials = output.trials;
  var rewardTrials = rewardObject.trials;

  if (isArray(topTrials) && isArray(rewardTrials) && stable(topTrials) !== stable(rewardTrials)) {
    local.errors.push('output.trials and output.reward.trials disagree');
  }

  var trials = isArray(topTrials) ? topTrials : rewardTrials;
  if (!isArray(trials)) {
    local.errors.push('neither output.trials nor output.reward.trials is an array');
    trials = [];
  }

  if (trials.length !== EXPECTED_ATTEMPTS) {
    local.errors.push(
      'expected ' + EXPECTED_ATTEMPTS + ' recorded rollout but found ' + trials.length +
        '; each model gets exactly one attempt and a missing record cannot be treated as invalid'
    );
  }

  var trial = trials.length ? recordTrial(objectAt(trials[0]), local) : null;

  if (trial && typeof output.trial_name === 'string' && output.trial_name !== trial.trial_name) {
    local.errors.push('output.trial_name ' + output.trial_name + ' disagrees with the recorded trial ' + trial.trial_name);
  }

  var expectedStem = result.run_id !== undefined && evaluation.id !== undefined
    ? String(result.run_id) + '_' + String(evaluation.id)
    : null;

  if (expectedStem && typeof output.bundle_url === 'string' &&
      base(String(output.bundle_url).split(/[?#]/)[0]) !== expectedStem + '.zip') {
    local.warnings.push('bundle_url ' + output.bundle_url + ' is not named ' + expectedStem + '.zip for this run/evaluation');
  }
  if (expectedStem && trial && trial.trial_name.indexOf(expectedStem + '__') !== 0) {
    local.warnings.push('trial_name ' + trial.trial_name + ' does not start with ' + expectedStem + '__ for this run/evaluation');
  }

  var validTrial = trial && trial.valid === true && trial.reward !== null;
  var aggregate = {
    recorded_rollouts: trials.length,
    valid_rollouts: validTrial ? 1 : 0,
    correct_rollouts: validTrial && trial.reward === 1 ? 1 : 0,
    invalid_rollouts: trial && trial.valid !== true ? 1 : 0,
    pass_at_1: validTrial ? trial.reward : null
  };

  if (aggregate.pass_at_1 !== null) {
    checkAggregate('output', output, aggregate, local);
    if (Object.keys(rewardObject).length) {
      checkAggregate('output.reward', rewardObject, aggregate, local);
    }
  }

  ['reward', 'rewards'].forEach(function (field) {
    var source = field === 'reward' ? rewardObject.reward : objectAt(rewardObject.rewards).reward;
    if (source === undefined || source === null || !trial || trial.reward === null) return;
    if (binaryNumber(source) !== trial.reward) {
      local.errors.push('output.reward.' + (field === 'reward' ? 'reward' : 'rewards.reward') + '=' + String(source) +
        ' disagrees with the trial reward ' + String(trial.reward));
    }
  });

  local.errors.forEach(function (message) { findings.errors.push(label + ': ' + message); });
  local.warnings.forEach(function (message) { findings.warnings.push(label + ': ' + message); });

  return {
    label: label,
    position: position,
    evaluation_name: evaluation.name,
    evaluation_id: evaluation.id,
    agent: output.agent,
    model: output.model,
    reasoning_effort: output.reasoning_effort,
    bundle_url: output.bundle_url,
    trial: trial,
    valid: trial ? trial.valid : false,
    reward: trial ? trial.reward : null
  };
}

function recordTrial(trial, findings) {
  var name = typeof trial.trial_name === 'string' && trial.trial_name ? trial.trial_name : '<trial-1>';
  var label = 'trial ' + name;

  if (name === '<trial-1>') {
    findings.errors.push(label + ' has no non-empty trial_name');
  }

  var valid = trial.valid;
  if (typeof valid !== 'boolean') {
    findings.errors.push(label + ' has no boolean valid field');
    valid = false;
  }

  var reward = trialReward(trial, findings, label);
  var passed = trial.passed;

  if (passed !== undefined && passed !== null && typeof passed !== 'boolean') {
    findings.errors.push(label + ' passed must be boolean when present');
    passed = null;
  }

  var reason = { category: null, detail: null };

  if (valid) {
    if (reward === null) {
      findings.errors.push(label + ' is valid but has no binary reward');
    } else if (passed !== undefined && passed !== null && passed !== (reward === 1)) {
      findings.errors.push(label + ' passed conflicts with its binary reward');
    }
  } else {
    reason = invalidReason(trial);

    if (reward === 1 || passed === true) {
      findings.errors.push(label + ' is invalid but is marked passed/reward 1');
    }
    if (reason.category === 'unspecified') {
      findings.warnings.push(
        label + ' is excluded by valid=false, but the eval output has no per-rollout invalidity reason; ' +
          'the bundle must supply termination evidence'
      );
    } else if (reason.category === 'other') {
      findings.warnings.push(label + ' has an unclassified invalidity reason: ' + reason.detail);
    }
  }

  return {
    trial_name: name,
    valid: valid,
    passed: passed,
    reward: reward,
    invalid_reason_category: reason.category,
    invalid_reason_detail: reason.detail
  };
}

function isBroken(model) {
  return model.valid === true && model.reward === 0;
}

function modelName(model) {
  return String(model.model || model.evaluation_name) +
    (model.reasoning_effort ? ' [' + model.reasoning_effort + ']' : '');
}

function describeOutcome(model) {
  if (!model.trial) return 'no recorded rollout';
  if (model.valid !== true) {
    return 'invalid rollout, excluded' +
      (model.trial.invalid_reason_detail ? ' (' + model.trial.invalid_reason_detail + ')' : '');
  }
  if (model.reward === 0) return 'reward 0 — BROKEN';
  if (model.reward === 1) return 'reward 1 — solved';
  return 'valid rollout with no binary reward';
}

function findRatings(data, findings) {
  var candidates = [
    { name: 'task_data.formData.ratings', value: data && data.task_data && data.task_data.formData && data.task_data.formData.ratings },
    { name: 'raw_data.formData.ratings', value: data && data.raw_data && data.raw_data.formData && data.raw_data.formData.ratings },
    { name: 'conversation.ratings', value: data && data.conversation && data.conversation.ratings },
    { name: 'formData.ratings', value: data && data.formData && data.formData.ratings },
    { name: 'ratings', value: data && data.ratings }
  ];

  var hasKey = function (key) {
    return candidates.filter(function (candidate) {
      var field = ratingByKey(candidate.value, key);
      return field !== null && field !== undefined;
    });
  };

  var present = hasKey(RATING_KEY);

  if (!present.length) {
    var key = discoverRatingKey(candidates);
    if (key) {
      ratingKey = key;
      PREFIX = prefixFor(key);
      present = hasKey(key);
      infos.push(
        PREFIX + 'Note: no "' + RATING_KEY + '" rating exists; validating the model-eval breakpoint stored as "' +
          key + '" instead.'
      );
    }
  }

  if (!present.length) {
    throw new Error('ratings.' + RATING_KEY + ' could not be located, and no other rating holds a model harbor_trial evaluation');
  }

  var chosen = present[0];
  var fingerprint = stable(unwrapValue(ratingByKey(chosen.value, ratingKey)));

  for (var i = 1; i < present.length; i++) {
    if (stable(unwrapValue(ratingByKey(present[i].value, ratingKey))) !== fingerprint) {
      findings.errors.push('duplicated ' + ratingKey + ' data disagree between ' + chosen.name + ' and ' + present[i].name);
    }
  }

  return { name: chosen.name, ratings: chosen.value };
}

// A rating is the model-eval breakpoint when its stored payload runs a harbor_trial
// evaluation over model inputs with no oracle among them — which tells it apart from
// the oracle_check breakpoint, which stores the same evaluation shape.
function discoverRatingKey(candidates) {
  var found = {};

  candidates.forEach(function (candidate) {
    var ratings = candidate.value;
    if (!ratings || typeof ratings !== 'object') return;

    var entries = isArray(ratings)
      ? ratings.map(function (item) {
          item = item || {};
          return { key: item.key || item.name || item.ratingKey || item.id, field: item };
        })
      : Object.keys(ratings).map(function (key) { return { key: key, field: ratings[key] }; });

    entries.forEach(function (entry) {
      if (typeof entry.key === 'string' && isModelEvalRating(unwrapValue(entry.field))) {
        found[entry.key] = true;
      }
    });
  });

  var keys = Object.keys(found).sort();
  if (keys.length > 1) {
    throw new Error(
      'no "' + RATING_KEY + '" rating exists and several ratings hold a model harbor_trial evaluation (' +
        keys.join(', ') + '); cannot tell which one to validate'
    );
  }
  return keys.length ? keys[0] : null;
}

function isModelEvalRating(value) {
  if (!isObject(value) || !isArray(value.versionsData) || !isArray(value.customData)) return false;

  return value.customData.some(function (entry) {
    if (!isObject(entry)) return false;
    var payload = entry.defaultPayload;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        return false;
      }
    }
    payload = objectAt(payload);
    var inputs = isArray(payload.inputs) ? payload.inputs.filter(isObject) : [];
    var harbor = (isArray(payload.evaluations) ? payload.evaluations : []).some(function (e) {
      return isObject(e) && (e.name === 'harbor_trial' || e.evaluator_name === 'harbor_agent');
    });
    return harbor && inputs.length > 0 && !inputs.some(function (input) { return lower(input.agent) === 'oracle'; });
  });
}

function prefixFor(key) {
  return 'Post Evaluation — "' + key + '" | ';
}

function selectCurrentVersion(passValue, findings) {
  var versions = isArray(passValue.versionsData) ? passValue.versionsData.filter(isObject) : [];

  if (!versions.length) {
    throw new Error(ratingKey + '.value.versionsData has no object entries');
  }

  var ids = isArray(passValue.versionIds) ? passValue.versionIds.map(String) : [];
  var active = versions.filter(function (version) { return ids.indexOf(String(version.versionId)) !== -1; });

  if (active.length === 1) return active[0];

  if (active.length > 1) {
    findings.errors.push('more than one ' + ratingKey + ' version is marked current');
  } else {
    findings.warnings.push('no versionsData entry matched versionIds; using the most recent record');
  }

  var choices = active.length ? active : versions;
  choices.sort(function (a, b) { return recordTime(a) - recordTime(b); });
  return choices[choices.length - 1];
}

function trialReward(trial, findings, label) {
  var directPresent = trial.reward !== undefined && trial.reward !== null;
  var nestedPresent = isObject(trial.rewards) && trial.rewards.reward !== undefined && trial.rewards.reward !== null;
  var direct = directPresent ? binaryNumber(trial.reward) : null;
  var nested = nestedPresent ? binaryNumber(trial.rewards.reward) : null;

  if (directPresent && direct === null) {
    findings.errors.push(label + ' has non-binary reward ' + String(trial.reward));
  }
  if (nestedPresent && nested === null) {
    findings.errors.push(label + ' has non-binary rewards.reward ' + String(trial.rewards.reward));
  }
  if (direct !== null && nested !== null && direct !== nested) {
    findings.errors.push(label + ' reward and rewards.reward disagree');
  }

  return direct !== null ? direct : nested;
}

function invalidReason(trial) {
  var keys = ['invalid_reason', 'termination_reason', 'fail_reason', 'error_code', 'status', 'reason', 'error'];
  var raw = null;

  for (var i = 0; i < keys.length; i++) {
    var value = trial[keys[i]];
    if (!emptyValue(value)) {
      raw = typeof value === 'string' ? value : stable(value);
      break;
    }
  }

  if (raw === null) return { category: 'unspecified', detail: null };

  var text = raw.toLowerCase();
  if (/429|rate.?limit/.test(text)) return { category: 'rate_limited', detail: raw };
  if (/refus|policy/.test(text)) return { category: 'refused', detail: raw };
  if (/token/.test(text) && /cap|limit|max|trunc|length/.test(text)) return { category: 'token_cap', detail: raw };
  if (/incomplete|timeout|timed out|gateway|provider|container|crash|killed|oom|out of memory|no space|artifact|permission|missing reward/.test(text)) {
    return { category: 'incomplete', detail: raw };
  }
  return { category: 'other', detail: raw };
}

function checkAggregate(containerName, container, expected, findings) {
  var aliases = {
    recorded_rollouts: ['n_trials', 'n_attempts'],
    valid_rollouts: ['n_valid_trials', 'valid_rollouts'],
    correct_rollouts: ['n_passed', 'correct_rollouts'],
    invalid_rollouts: ['n_invalid_trials', 'invalid_rollouts'],
    pass_at_1: ['pass_at_1']
  };

  Object.keys(aliases).forEach(function (expectedName) {
    aliases[expectedName].forEach(function (fieldName) {
      if (Object.prototype.hasOwnProperty.call(container, fieldName) &&
          !numberEqual(container[fieldName], expected[expectedName])) {
        findings.errors.push(
          containerName + '.' + fieldName + '=' + String(container[fieldName]) + ' does not match recomputed ' +
            expectedName + '=' + String(expected[expectedName])
        );
      }
    });
  });

  if (isObject(container.pass_at_k)) {
    var stored = container.pass_at_k['1'];
    if (stored !== undefined && stored !== null && !numberEqual(stored, expected.pass_at_1)) {
      findings.errors.push(containerName + '.pass_at_k[1] does not match recomputed pass@1');
    }
  }
}

function configuredThreshold(passValue, findings) {
  var custom = isArray(passValue.customData) ? passValue.customData : [];
  var values = [];

  custom.forEach(function (entry) {
    if (!entry || entry.rewardBlockCriteria !== true) return;
    var maximum = numeric(entry.rewardBlockCriteriaMaxReward);
    if (maximum === null) {
      findings.errors.push('rewardBlockCriteriaMaxReward must be numeric when enabled');
    } else {
      values.push(maximum);
    }
  });

  if (!values.length) return null;

  for (var i = 1; i < values.length; i++) {
    if (!numberEqual(values[i], values[0])) {
      findings.errors.push('enabled rewardBlockCriteriaMaxReward values disagree');
    }
  }

  return values[0];
}

// ---------------------------------------------------------------------------
// Bundle evidence: one Harbor ZIP per model, one trial per ZIP.
// ---------------------------------------------------------------------------

function validateBundle(bundle, model, findings) {
  var trialRoots = {};
  var jobResults = [];

  bundle.paths.forEach(function (filePath) {
    if (base(filePath) !== 'result.json') return;

    var data = jsonAt(bundle.get(filePath), filePath, findings);
    if (!data) return;

    if (typeof data.trial_name === 'string' && data.trial_name) {
      if (trialRoots[data.trial_name]) {
        findings.errors.push('duplicate result.json found for trial ' + data.trial_name);
      }
      trialRoots[data.trial_name] = { root: dirname(filePath), result: data };
    } else if (data.n_total_trials !== undefined || data.stats !== undefined) {
      jobResults.push(data);
    }
  });

  var expected = {};
  if (model.trial) expected[model.trial.trial_name] = model.trial;

  var expectedNames = Object.keys(expected).sort();
  var bundleNames = Object.keys(trialRoots).sort();
  var missing = expectedNames.filter(function (name) { return !trialRoots[name]; });
  var extras = bundleNames.filter(function (name) { return !expected[name]; });

  if (missing.length) {
    findings.errors.push('bundle is missing the recorded trial ' + listed(missing));
  }
  if (extras.length) {
    findings.errors.push('bundle contains unexpected trials: ' + listed(extras));
  }
  if (bundleNames.length !== EXPECTED_ATTEMPTS) {
    findings.errors.push(
      'bundle has ' + bundleNames.length + ' trial directories but each model gets exactly ' + EXPECTED_ATTEMPTS
    );
  }

  jobResults.forEach(function (job) {
    if (job.n_total_trials !== undefined && !numberEqual(job.n_total_trials, bundleNames.length)) {
      findings.errors.push('job result n_total_trials disagrees with the discovered bundle trial count');
    }
  });

  var taskNames = {};
  var taskChecksums = {};

  bundleNames.forEach(function (trialName) {
    if (!expected[trialName]) return;

    var record = trialRoots[trialName];
    var local = { errors: [], warnings: [] };

    validateBundleTrial(trialName, record.root, record.result, expected[trialName], model, bundle, local);

    if (typeof record.result.task_name === 'string') taskNames[record.result.task_name] = true;
    if (typeof record.result.task_checksum === 'string') taskChecksums[record.result.task_checksum] = true;

    local.errors.forEach(function (message) { findings.errors.push(trialName + ': ' + message); });
    local.warnings.forEach(function (message) { findings.warnings.push(trialName + ': ' + message); });
  });

  var taskNameList = Object.keys(taskNames).sort();
  var checksumList = Object.keys(taskChecksums).sort();

  if (taskNameList.length > 1) {
    findings.errors.push('bundle trials disagree on task_name: ' + taskNameList.join(', '));
  }
  if (checksumList.length > 1) {
    findings.errors.push('bundle trials use different task checksums: ' + checksumList.join(', '));
  }

  return { trial_count: bundleNames.length, task_names: taskNameList, task_checksums: checksumList };
}

function validateBundleTrial(trialName, root, result, expected, model, bundle, findings) {
  var valid = expected.valid === true;
  var label = 'trial ' + trialName;

  if (root && base(root) !== trialName) {
    findings.errors.push('trial directory basename does not match trial_name');
  }
  if (result.trial_name !== trialName) {
    findings.errors.push('result.json trial_name disagrees with the eval output');
  }
  if (typeof result.task_name !== 'string' || !result.task_name) {
    findings.errors.push('result.json has no task_name');
  }
  if (typeof result.task_checksum !== 'string' || !result.task_checksum) {
    findings.errors.push('result.json has no task_checksum');
  }

  ['config.json', 'lock.json', 'trial.log', 'artifacts/manifest.json'].forEach(function (relative) {
    if (!bundle.isFile(at(root, relative))) {
      findings.errors.push('bundle is missing ' + relative);
    }
  });

  var resultAgent = objectAt(objectAt(result.config).agent);
  var agentName = resultAgent.name;
  var modelName = resultAgent.model_name;
  var effort = objectAt(resultAgent.kwargs).reasoning_effort;

  if (model.agent && agentName !== model.agent) {
    findings.errors.push('result agent ' + String(agentName) + ' does not match the eval output ' + String(model.agent));
  }
  if (model.model && modelName !== model.model) {
    findings.errors.push('result model ' + String(modelName) + ' does not match the eval output ' + String(model.model));
  }
  if (model.reasoning_effort !== undefined && effort !== undefined && lower(effort) !== lower(model.reasoning_effort)) {
    findings.errors.push(
      'result reasoning_effort ' + String(effort) + ' does not match the eval output ' + String(model.reasoning_effort)
    );
  }
  if (lower(agentName) === 'oracle') {
    findings.errors.push('bundle trial is an oracle run, not a model evaluation');
  }

  ['config.json', 'lock.json'].forEach(function (relative) {
    var sourcePath = at(root, relative);
    if (!bundle.isFile(sourcePath)) return;

    var source = jsonAt(bundle.get(sourcePath), sourcePath, findings);
    var sourceAgent = objectAt(source && source.agent);

    if (agentName && sourceAgent.name !== agentName) {
      findings.errors.push(relative + ' agent name disagrees with result.json');
    }
    if (modelName && sourceAgent.model_name !== modelName) {
      findings.errors.push(relative + ' model name disagrees with result.json');
    }
    var sourceEffort = objectAt(sourceAgent.kwargs).reasoning_effort;
    if (effort !== undefined && sourceEffort !== undefined && lower(sourceEffort) !== lower(effort)) {
      findings.errors.push(relative + ' reasoning_effort disagrees with result.json');
    }
  });

  var rewardSources = {
    eval_output: expected.reward === 0 || expected.reward === 1 ? expected.reward : null,
    result_json: binaryNumber(result.verifier_result && result.verifier_result.rewards && result.verifier_result.rewards.reward),
    reward_txt: null
  };

  // Harbor writes verifier/reward.txt; reward.json is accepted as the same evidence.
  var rewardPath = at(root, 'verifier/reward.txt');
  var rewardJsonPath = at(root, 'verifier/reward.json');
  if (bundle.isFile(rewardPath)) {
    rewardSources.reward_txt = binaryNumber(numeric(bundle.get(rewardPath)));
    if (rewardSources.reward_txt === null) {
      findings.errors.push('verifier/reward.txt is not a binary number');
    }
  } else if (bundle.isFile(rewardJsonPath)) {
    var rewardJson = jsonAny(bundle.get(rewardJsonPath), rewardJsonPath, findings);
    rewardSources.reward_txt = binaryNumber(isObject(rewardJson) ? rewardJson.reward : rewardJson);
    if (rewardSources.reward_txt === null) {
      findings.errors.push('verifier/reward.json has no binary reward');
    }
  }

  // A solved rollout must prove its pass everywhere. A broken one is an ordinary
  // failure: when the model never produced its output, the verifier often exits
  // before writing CTRF/stdout and artifact collection finds nothing, so missing
  // evidence there is reported for review instead of failing the task.
  var solved = valid && rewardSources.eval_output === 1;
  var evidence = function (message) {
    (solved ? findings.errors : findings.warnings).push(
      solved ? message : message + ' (broken rollout, reward 0; review only)'
    );
  };

  if (valid) {
    if (rewardSources.eval_output === null) {
      findings.errors.push('valid rollout has no binary reward in the eval output');
    }
    if (rewardSources.result_json === null && rewardSources.reward_txt === null) {
      findings.errors.push('valid rollout has no binary reward in result.json or verifier/reward.txt');
    } else if (solved && (rewardSources.result_json === null || rewardSources.reward_txt === null)) {
      findings.errors.push(
        'solved rollout must carry its reward in both result.json and verifier/reward.txt'
      );
    }

    var rewardValues = unique(Object.keys(rewardSources).map(function (source) {
      return rewardSources[source];
    }).filter(function (value) { return value !== null; }));

    if (rewardValues.length > 1) {
      findings.errors.push('the eval output, result.json, and reward.txt disagree on the reward');
    }
  } else if (rewardSources.result_json === 1 || rewardSources.reward_txt === 1) {
    findings.errors.push('invalid rollout has reward 1 in its result bundle');
  }

  var ctrfPath = at(root, 'verifier/ctrf.json');
  if (valid && !bundle.isFile(ctrfPath)) {
    evidence('valid rollout has no verifier/ctrf.json');
  } else if (bundle.isFile(ctrfPath)) {
    var ctrf = jsonAt(bundle.get(ctrfPath), ctrfPath, findings);
    if (ctrf) validateCtrf(ctrf, rewardSources.eval_output, label, findings);
  }

  var stdoutPath = at(root, 'verifier/test-stdout.txt');
  if (valid && (!bundle.isFile(stdoutPath) || !trim(textAt(bundle.get(stdoutPath))))) {
    evidence('valid rollout has no non-empty verifier/test-stdout.txt');
  }

  var manifestPath = at(root, 'artifacts/manifest.json');
  if (bundle.isFile(manifestPath)) {
    validateManifest(bundle, root, jsonAny(bundle.get(manifestPath), manifestPath, findings), valid, evidence, findings);
  }

  var trajectoryPath = at(root, 'agent/trajectory.json');
  if (valid && !bundle.isFile(trajectoryPath)) {
    evidence('valid model rollout has no agent/trajectory.json');
  } else if (bundle.isFile(trajectoryPath)) {
    var trajectory = jsonAt(bundle.get(trajectoryPath), trajectoryPath, findings);
    if (trajectory) validateTrajectory(trajectory, agentName, modelName, findings);
  }

  var started = timestamp(result.started_at, 'result.started_at', findings);
  var finished = timestamp(result.finished_at, 'result.finished_at', findings);
  if (started !== null && finished !== null && finished < started) {
    findings.errors.push('result finished_at precedes started_at');
  }

  if (isObject(result.agent_execution)) {
    var agentStarted = timestamp(result.agent_execution.started_at, 'agent_execution.started_at', findings);
    var agentFinished = timestamp(result.agent_execution.finished_at, 'agent_execution.finished_at', findings);

    if (agentStarted !== null && agentFinished !== null) {
      if (agentFinished < agentStarted) {
        findings.errors.push('agent execution finished before it started');
      }
      var duration = (agentFinished - agentStarted) / 1000;
      var timeout = numeric(resultAgent.override_timeout_sec);
      if (timeout !== null && duration > timeout + 1) {
        evidence('agent execution duration exceeds its configured timeout');
      }
    }
  }

  var exceptionPresent = !emptyValue(result.exception_info);
  if (valid && exceptionPresent) {
    evidence('valid rollout contains exception_info: ' + exceptionSummary(result.exception_info));
  }

  var logPath = at(root, 'trial.log');
  var logText = bundle.isFile(logPath) ? textAt(bundle.get(logPath)) : '';
  var termination = terminationSignals(logText + '\n' + stable(result.exception_info));

  if (valid && termination.length) {
    findings.warnings.push('possible termination signals require review: ' + termination.join(', '));
  }

  if (!valid && !exceptionPresent && !termination.length && expected.invalid_reason_category === 'unspecified') {
    findings.errors.push(
      'invalid rollout has no eval-output reason, exception_info, or recognizable termination signal; exclusion is unsupported'
    );
  } else if (!valid && !exceptionPresent && !termination.length) {
    findings.warnings.push('invalid rollout reason exists only in the eval output and is not corroborated by result/log evidence');
  }
}

function validateCtrf(data, reward, label, findings) {
  var results = objectAt(data.results);
  var summary = objectAt(results.summary);
  var tests = isArray(results.tests) ? results.tests : null;

  if (!Object.keys(summary).length || tests === null) {
    findings.errors.push(label + ' CTRF must contain results.summary and results.tests');
    return;
  }

  var counts = {};
  ['tests', 'passed', 'failed', 'skipped', 'pending', 'other'].forEach(function (field) {
    var value = summary[field];
    if (typeof value !== 'number' || value < 0 || Math.floor(value) !== value) {
      findings.errors.push(label + ' CTRF summary.' + field + ' must be a non-negative integer');
      counts[field] = 0;
    } else {
      counts[field] = value;
    }
  });

  if (counts.tests !== tests.length) {
    findings.errors.push(label + ' CTRF test count disagrees with results.tests');
  }
  if (counts.passed + counts.failed + counts.skipped + counts.pending + counts.other !== counts.tests) {
    findings.errors.push(label + ' CTRF status counts do not sum to tests');
  }

  var observed = { passed: 0, failed: 0, skipped: 0, pending: 0, other: 0 };
  tests.forEach(function (test, i) {
    if (!isObject(test)) {
      findings.errors.push(label + ' CTRF test[' + (i + 1) + '] is not an object');
      observed.other++;
      return;
    }
    var status = lower(test.status);
    if (!Object.prototype.hasOwnProperty.call(observed, status)) status = 'other';
    observed[status]++;
    if (typeof test.name !== 'string' || !test.name) {
      findings.errors.push(label + ' CTRF test has no name');
    }
  });

  if (Object.keys(observed).some(function (status) { return observed[status] !== counts[status]; })) {
    findings.errors.push(label + ' CTRF listed statuses disagree with summary');
  }

  var allPassed = counts.tests > 0 && counts.passed === counts.tests;
  if (reward === 1 && !allPassed) {
    findings.errors.push(label + ' reward is 1 but CTRF is not all-passing');
  }
  if (reward === 0 && allPassed) {
    findings.errors.push(label + ' reward is 0 but CTRF is all-passing');
  }
}

function validateManifest(bundle, root, manifest, valid, evidence, findings) {
  if (!isArray(manifest)) {
    findings.errors.push('artifacts/manifest.json must be an array');
    return;
  }

  var declaredFiles = {};
  var declaredDirectories = [];

  manifest.forEach(function (entry, i) {
    if (!isObject(entry)) {
      findings.errors.push('artifact manifest entry[' + (i + 1) + '] is not an object');
      return;
    }

    var destination = entry.destination;
    if (typeof destination !== 'string' || !destination) {
      findings.errors.push('artifact manifest entry[' + (i + 1) + '] has no destination');
      return;
    }
    if (unsafePath(destination)) {
      findings.errors.push('artifact destination is unsafe: ' + destination);
      return;
    }
    if (entry.status !== 'ok') {
      if (valid) evidence('artifact ' + destination + ' has collection status ' + String(entry.status));
    }

    if (entry.type === 'file') {
      declaredFiles[stripSlash(destination)] = true;
      // A file that failed collection is already reported by its status.
      if (entry.status === 'ok' && !bundle.isFile(at(root, destination))) {
        findings.errors.push('collected artifact is absent from ZIP: ' + destination);
      }
    } else if (entry.type === 'directory') {
      declaredDirectories.push(stripSlash(destination));
    } else {
      findings.errors.push('artifact ' + destination + ' has unknown type ' + String(entry.type));
    }
  });

  var manifestPath = at(root, 'artifacts/manifest.json');
  var actual = bundle.under(at(root, 'artifacts')).filter(function (filePath) {
    return bundle.isFile(filePath) && filePath !== manifestPath;
  }).map(function (filePath) {
    return rel(root, filePath);
  });

  if (valid && !actual.length) {
    evidence('valid rollout contains no submitted artifact files');
  }

  var extras = actual.filter(function (filePath) {
    if (declaredFiles[filePath]) return false;
    return !declaredDirectories.some(function (directory) {
      return filePath === directory || filePath.indexOf(directory + '/') === 0;
    });
  });

  if (extras.length) {
    findings.warnings.push('artifact files are not covered by the manifest: ' + listed(extras));
  }
}

function validateTrajectory(data, agentName, modelName, findings) {
  if (typeof data.schema_version !== 'string' || data.schema_version.indexOf('ATIF-') !== 0) {
    findings.errors.push('trajectory has an invalid schema_version');
  }
  if (typeof data.session_id !== 'string' || !data.session_id) {
    findings.errors.push('trajectory has no session_id');
  }

  var agent = objectAt(data.agent);
  if (!Object.keys(agent).length) {
    findings.errors.push('trajectory has no agent object');
  } else {
    if (agentName && agent.name !== agentName) {
      findings.errors.push('trajectory agent disagrees with result.json');
    }
    if (modelName && agent.model_name !== modelName) {
      findings.errors.push('trajectory model disagrees with result.json');
    }
  }

  var steps = isArray(data.steps) ? data.steps : [];
  if (!steps.length) {
    findings.errors.push('trajectory steps must be a non-empty array');
    return;
  }

  var ids = {};
  var sources = {};
  var messages = [];
  var previous = null;

  steps.forEach(function (step, i) {
    if (!isObject(step)) {
      findings.errors.push('trajectory step[' + (i + 1) + '] is not an object');
      return;
    }

    var key = typeof step.step_id + ':' + String(step.step_id);
    if (ids[key]) {
      findings.errors.push('trajectory contains duplicate step_id ' + String(step.step_id));
    }
    ids[key] = true;

    if (typeof step.source === 'string') sources[step.source.toLowerCase()] = true;

    var current = timestamp(step.timestamp, 'trajectory step[' + (i + 1) + '].timestamp', findings);
    if (current !== null && previous !== null && current < previous) {
      findings.errors.push('trajectory timestamps are not monotonic');
    }
    if (current !== null) previous = current;

    // The user step is the task instruction, which itself carries the harbor canary and
    // may name /tests or the solution; only text the agent produced is evidence.
    var source = lower(step.source);
    if (source === 'agent' || source === 'assistant') {
      if (typeof step.message === 'string') messages.push(step.message);
      if (isArray(step.tool_calls)) messages.push(stable(step.tool_calls));
    }
  });

  if (!sources.user) {
    findings.errors.push('trajectory has no user instruction step');
  }
  if (!sources.agent && !sources.assistant) {
    findings.errors.push('trajectory has no agent/assistant step');
  }

  var joined = messages.join('\n').toLowerCase();
  var indicators = [];

  if (joined.indexOf('/logs/verifier/reward.txt') !== -1 || joined.indexOf('reward.json') !== -1) {
    indicators.push('reward-file reference');
  }
  if (joined.indexOf('/solution/') !== -1 || joined.indexOf('solution/solve.sh') !== -1) {
    indicators.push('solution-path reference');
  }
  if (joined.indexOf('/tests/') !== -1 || joined.indexOf('private.npz') !== -1 || joined.indexOf('reference.json') !== -1) {
    indicators.push('private-test reference');
  }
  if (joined.indexOf('harbor-canary') !== -1) {
    indicators.push('canary reference');
  }

  if (indicators.length) {
    findings.warnings.push('trajectory integrity indicators require LLM review: ' + indicators.join(', '));
  }
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

function index(files, sizes) {
  var paths = Object.keys(files).sort();

  return {
    paths: paths,
    get: function (filePath) { return files[filePath]; },
    size: function (filePath) {
      if (typeof sizes[filePath] === 'number') return sizes[filePath];
      var value = files[filePath];
      return typeof value === 'string' ? value.length : value === undefined ? 0 : 1;
    },
    isFile: function (filePath) { return Object.prototype.hasOwnProperty.call(files, filePath); },
    under: function (prefix) {
      return paths.filter(function (candidate) {
        return candidate === prefix || candidate.indexOf(prefix + '/') === 0;
      });
    }
  };
}

function jsonAny(value, filePath, findings) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      findings.errors.push(filePath + ' is invalid JSON: ' + msgOf(e));
      return null;
    }
  }
  return value;
}

function jsonAt(value, filePath, findings) {
  var parsed = jsonAny(value, filePath, findings);
  if (!isObject(parsed)) {
    findings.errors.push(filePath + ' must contain a JSON object');
    return null;
  }
  return parsed;
}

function flushFindings(findings, scope) {
  var lead = scope ? scope + ': ' : '';
  findings.errors.forEach(function (message) {
    errors.push(PREFIX + 'Problem: ' + lead + message + '.');
  });
  findings.warnings.forEach(function (message) {
    warnings.push(PREFIX + 'Warning: ' + lead + message + '.');
  });
}

function fail(problem, fix) {
  errors.push(PREFIX + 'Problem: ' + problem + '. | Fix: ' + fix + '.');
}

function logFiles(paths) {
  logs.push('Bundle contents (' + paths.length + ' files):');
  var line = '';
  paths.forEach(function (filePath) {
    var next = line ? line + ' | ' + filePath : filePath;
    if (next.length > 900) {
      logs.push(line);
      line = filePath;
    } else {
      line = next;
    }
  });
  if (line) logs.push(line);
}

function consoleUrlToGs(value) {
  if (typeof value !== 'string') return null;

  var marker = '/storage/browser/_details/';
  var position = value.indexOf(marker);
  if (value.indexOf('console.cloud.google.com') === -1 || position === -1) return null;

  var remainder = value.slice(position + marker.length).split(/[;?]/)[0].replace(/^\/+/, '');
  try {
    remainder = decodeURIComponent(remainder);
  } catch (e) {
    // Keep original value.
  }

  var slash = remainder.indexOf('/');
  return slash > 0 ? 'gs://' + remainder.slice(0, slash) + '/' + remainder.slice(slash + 1) : null;
}

function ratingByKey(ratings, key) {
  if (!ratings) return null;
  if (!isArray(ratings)) return ratings[key];

  for (var i = 0; i < ratings.length; i++) {
    var item = ratings[i] || {};
    var itemKey = item.key || item.name || item.ratingKey || item.id;
    if (itemKey === key) return item;
  }
  return null;
}

function unwrapValue(field) {
  if (!field || typeof field !== 'object') return field;
  return Object.prototype.hasOwnProperty.call(field, 'value') ? field.value : field;
}

function recordTime(record) {
  if (!record || typeof record !== 'object') return 0;
  var raw = record.updatedAt || record.lastSuccessAt || record.lastAttemptAt || record.createdAt;
  var parsed = raw ? Date.parse(raw) : NaN;
  return isFinite(parsed) ? parsed : 0;
}

function timestamp(value, label, findings) {
  if (typeof value !== 'string' || !value) {
    findings.errors.push(label + ' is missing or is not an ISO timestamp');
    return null;
  }
  var parsed = Date.parse(value);
  if (!isFinite(parsed)) {
    findings.errors.push(label + ' is not a valid ISO timestamp');
    return null;
  }
  return parsed;
}

function terminationSignals(text) {
  text = String(text || '').toLowerCase();

  var patterns = {
    rate_limited: /429|rate.?limit/,
    token_cap: /token cap|max tokens|maximum context|context length|truncated/,
    timeout: /timed out|timeout|deadline exceeded/,
    out_of_memory: /oomkilled|out of memory|memoryerror|exit 137/,
    storage_exhausted: /no space left on device|disk quota/,
    provider_or_gateway: /gateway|provider error|api error|connection reset/,
    permission: /permission denied/,
    container_or_harness: /container crash|failed to start|artifact collection/
  };

  return Object.keys(patterns).filter(function (name) { return patterns[name].test(text); });
}

function exceptionSummary(info) {
  if (typeof info === 'string') return info.slice(0, 200);
  info = objectAt(info);
  var text = [info.exception_type, info.exception_message].filter(function (part) {
    return typeof part === 'string' && part;
  }).join(': ');
  return (text || stable(info)).slice(0, 200);
}

function describeSkipped(entry) {
  entry = objectAt(entry);
  return String(entry.path || '?') + ' (' + String(entry.reason || 'unreadable') + ')';
}

function binaryNumber(value) {
  value = numeric(value);
  if (value === 0) return 0;
  if (value === 1) return 1;
  return null;
}

function numeric(value) {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string' && trim(value) !== '') {
    var parsed = Number(value);
    if (isFinite(parsed)) return parsed;
  }
  return null;
}

function numberEqual(actual, expected) {
  actual = numeric(actual);
  expected = numeric(expected);
  return actual !== null && expected !== null && Math.abs(actual - expected) <= EPSILON;
}

function successStatus(status) {
  return status === 'success' || status === 'succeeded' || status === 'completed';
}

function lower(value) {
  return value === undefined || value === null ? '' : String(value).toLowerCase();
}

function emptyValue(value) {
  return value === undefined || value === null || value === '' ||
    (isArray(value) && !value.length) || (isObject(value) && !Object.keys(value).length);
}

function unsafePath(filePath) {
  if (typeof filePath !== 'string') return true;
  if (/^[\\/]/.test(filePath) || filePath.indexOf('\\') !== -1) return true;
  return filePath.split('/').indexOf('..') !== -1;
}

function stable(value) {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (isArray(value)) return '[' + value.map(stable).join(',') + ']';
  return '{' + Object.keys(value).sort().map(function (key) {
    return JSON.stringify(key) + ':' + stable(value[key]);
  }).join(',') + '}';
}

function unique(values) {
  var seen = {};
  return values.filter(function (value) {
    var key = typeof value + ':' + String(value);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function objectAt(value) {
  return isObject(value) ? value : {};
}

function isObject(value) {
  return !!value && typeof value === 'object' && !isArray(value);
}

function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}

function textAt(value) {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  return stable(value);
}

function trim(value) {
  return String(value).replace(/^\s+|\s+$/g, '');
}

function at(prefix, relative) {
  return prefix ? prefix + '/' + relative : relative;
}

function dirname(filePath) {
  var position = filePath.lastIndexOf('/');
  return position === -1 ? '' : filePath.slice(0, position);
}

function base(filePath) {
  var position = filePath.lastIndexOf('/');
  return position === -1 ? filePath : filePath.slice(position + 1);
}

function rel(prefix, filePath) {
  return prefix && filePath.indexOf(prefix + '/') === 0 ? filePath.slice(prefix.length + 1) : filePath;
}

function stripSlash(value) {
  return String(value).replace(/\/+$/, '');
}

function displayNumber(value) {
  if (value === null || value === undefined) return 'undefined';
  return String(Math.round(value * 1000000000000) / 1000000000000);
}

function listed(values, limit) {
  limit = limit || 8;
  var shown = values.slice(0, limit).join(', ');
  return values.length > limit ? shown + ', … +' + (values.length - limit) : shown;
}

function msgOf(error) {
  return error && typeof error === 'object' && error.message ? String(error.message) : String(error);
}
