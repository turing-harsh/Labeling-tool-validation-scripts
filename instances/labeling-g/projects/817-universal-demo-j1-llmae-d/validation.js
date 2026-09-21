// Harbor task-package validation for project 817 (universal-demo-J1-LLMAE-D).
//
// Deterministic port of checks/deterministic_task_validation.py (itself the offline subset of
// infra/harbor_gce/validate_tasks.py). No semantic/LLM review, same as the source.
//
// Input: the package ZIP linked in ratings.taskFolder (a signed GCS URL), read with
// fetchDataFromGcsZip -> { "<path>": parsedJsonOrText, __sizes: { "<path>": bytes } }.
//
// Two deliberate divergences from the Python, both documented in requirements.md:
//   * sha256 comparisons (_sha256) become direct content comparisons -- there is no crypto in
//     the isolate, and equality is what the hashes were testing.
//   * symlink detection is not possible: the ZIP's external attributes do not survive the
//     fetcher, so a symlinked package cannot be distinguished here.

// Default profile for this project. A task may override it per-batch by carrying a
// "validationProfile" field ('upload' | 'audit' | 'delivery') in its form data.
var PROFILE = 'upload';

var UPLOAD = 'upload';
var AUDIT = 'audit';
var DELIVERY = 'delivery';

var SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
var REQUIRED_DIRS = ['solution', 'tests', 'environment'];
var SPEC_PATHS = ['tests/verifier.json', 'tests/manifest.json', 'verifier.json'];
var MIRROR_GRADED_FILES = ['task.toml', 'instruction.md'];
var MIRROR_GRADED_TREES = ['tests'];

var DIFFICULTY = 'difficulty';
var SOLVABILITY = 'solvability';
var STABILITY = 'stability';
var PLATFORM = 'platform';
var REQUIRED_FINAL_AXES = [SOLVABILITY, DIFFICULTY, STABILITY, PLATFORM];
var FINAL_ROOT_REQUIRED = [
  'review.csv', 'qc_report.html', 'client_qc_report.json', 'client_qc_status.json',
  'client_format_check.json', 'client_evaluations.csv', 'client_programmatic_evidence.csv',
  'client_trial_matrix.csv', 'evaluation_layout_repair.json', 'finalization_review_reconcile.json',
  'client_qc', 'task.toml', 'instruction.md', 'tests', 'environment', 'solution', 'evaluations'
];
var FINAL_ROOT_ALLOWED = FINAL_ROOT_REQUIRED.concat(['README.md', 'golden_trajectory.json']);
var CACHE_DIRS = ['__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache'];
var CACHE_SUFFIXES = ['.pyc', '.pyo'];
var CERTIFICATE_KEYS = ['schema', 'task', 'profile', 'status', 'release_eligible', 'package_digest'];

// Short remediation per finding-code family, so every message carries a Fix.
var FIXES = {
  'T0.evaluation-json': 're-export the package; the artifact was written truncated or non-JSON.',
  'T0.evaluation-reward': 're-run the verifier for that trial so verifier/reward.json is written.',
  'T0.root-missing': 're-run finalization so the client QC artifacts land in the package root.',
  'T0.root-extra': 'remove the stray entry, or add it to the agreed package contract.',
  'T0.evaluation-axis-missing': 'run the missing evaluation axis before submitting.',
  'T0.certificate-missing': 're-run finalization so qc_report.html carries the QC certificate.',
  'T0.certificate-invalid': 're-run finalization; the embedded certificate is malformed.',
  'T0.solvability': 'provide exactly one non-Oracle solvability run that scores reward 1.0 with its trajectory saved.',
  'T0.difficulty-count': 'run four or five difficulty trials.',
  'T0.difficulty-trials': 'redo the listed trials with GLM-5.2, a saved trajectory and full provenance.',
  'T2.difficulty-score': 'the task is too easy for delivery -- harden it, then re-run difficulty.',
  'T0.stability-count': 'run at least three frozen-answer regrades.',
  'T0.stability-reward': 're-run the regrades; a frozen answer must score identically every time.',
  'T0.stability-identity': 'regrade the same frozen trajectory in every stability run.',
  'T0.stability-config': 'use one identical config.json across the stability regrades.',
  'T0.stability-lock': 'use one identical lock.json across the stability regrades.',
  'T0.platform-layout': 'produce exactly one run for that platform role.',
  'T0.platform-reward': 're-run the verifier for that platform run.',
  'T0.platform-oracle-reward': 'the Oracle must score 1.0 on that platform -- fix the solution or the environment.',
  'T0.platform-trajectory': 'save the agent trajectory for that platform run.',
  'T0.platform-sanity-check': 'add the digest-bound sanity_check.md for that platform run.',
  'T0.delivery-evaluations-missing': 'run the evaluations before submitting for delivery.'
};

async function validate(conversationData) {
  PROFILE = profileOf(conversationData);
  var link = taskFolderLink(conversationData);
  if (!link) {
    errors.push(
      'Task Metadata — "taskFolder" | Problem: the task package link is missing. ' +
        '| Fix: re-export the task so taskFolder holds the package ZIP URL.'
    );
    return;
  }
  if (link.indexOf('storage.googleapis.com') === -1 &&
      link.indexOf('storage.cloud.google.com') === -1 &&
      link.indexOf('gs://') !== 0) {
    errors.push(
      'Task Metadata — "taskFolder" | Problem: taskFolder is not a GCS link, so the package cannot be read. ' +
        '| Fix: report this task to your lead. | Why: got "' + link.slice(0, 200) + '".'
    );
    return;
  }

  var raw;
  try {
    raw = await fetchDataFromGcsZip(link);
  } catch (e) {
    errors.push(
      'Task Package — "taskFolder" | Problem: the package ZIP could not be downloaded or extracted. ' +
        '| Fix: report this task to your lead. | Why: ' + msgOf(e) + '.'
    );
    return;
  }

  var pkg = index(raw);
  if (!pkg.paths.length) {
    errors.push(
      'Task Package — "taskFolder" | Problem: the package ZIP holds no files. ' +
        '| Fix: re-upload the package.'
    );
    return;
  }
  infos.push('Profile ' + PROFILE + ': read ' + pkg.paths.length + ' files from the package ZIP.');
  logFiles(pkg.paths);

  var discovered = discover(pkg);
  if (!discovered.roots.length) {
    errors.push(
      'Task Package — "taskFolder" | Problem: no task package found -- there is no task.toml anywhere in the ZIP. ' +
        '| Fix: upload the Harbor task folder itself, not a partial export.'
    );
    return;
  }
  discovered.nested.forEach(function (path) {
    errors.push(
      scope(base(path)) + ' | Problem: this task package sits inside another package. ' +
        '| Fix: upload one task per package. | Why: nested at ' + path + '.'
    );
  });

  var counts = {};
  discovered.roots.forEach(function (root) {
    counts[base(root)] = (counts[base(root)] || 0) + 1;
  });

  discovered.roots.forEach(function (task) {
    if (counts[base(task)] > 1) {
      errors.push(
        scope(base(task)) + ' | Problem: duplicate task folder identity. ' +
          '| Fix: give each task package a unique folder name.'
      );
    }
    validateTask(task, pkg);
  });

  infos.push(
    'Not enforced here (needs data the package ZIP does not carry): symbolic-link detection.'
  );

  if (!errors.length) {
    successes.push(
      'Task package passes the deterministic ' + PROFILE + ' checks (' +
        discovered.roots.map(base).join(', ') + ').'
    );
  }
}

// ------------------------------------------------------------------ per-task checks

function validateTask(task, pkg) {
  var name = base(task);
  var toml = parseToml(pkg.get(task + '/task.toml'));
  var gyms = toml && toml.metadata ? toml.metadata.mcp_servers_extended : null;
  infos.push(
    scope(name) + ' | family: ' + (isArray(gyms) && gyms.length ? 'connector' : 'native') +
      ' | classification: ' + (pkg.isDir(task + '/evaluations') ? 'with-runs' : 'task-only')
  );

  checkCommon(task, pkg, toml);
  checkSpecs(task, pkg);
  checkMirror(task, pkg);
  checkEvaluationShape(task, pkg);

  if (pkg.has(task + '/evaluations')) {
    checkFinalRoot(task, pkg);
    checkCertificate(task, pkg);
    checkSolvability(task, pkg);
    checkDifficulty(task, pkg);
    checkStability(task, pkg);
    if (PROFILE === DELIVERY) checkPlatform(task, pkg);
  } else if (PROFILE === DELIVERY) {
    finding(name, 'T0.delivery-evaluations-missing', 'evaluations/ is required for a delivery package');
  }
}

function checkCommon(task, pkg, toml) {
  var name = base(task);

  if (!SAFE_NAME.test(name)) {
    hard(name, 'folder name is not a safe path segment', 'rename the folder to letters, digits, dot, dash or underscore');
  }

  if (!pkg.isFile(task + '/task.toml') || !pkg.size(task + '/task.toml')) {
    hard(name, 'task.toml missing or empty', 'add the task definition');
  } else if (toml === null) {
    hard(name, 'task.toml does not parse', 're-check the TOML syntax');
  } else if (!toml.task || !toml.task.name) {
    hard(name, 'task.toml has no [task] name', 'add name = "…" under [task]');
  } else {
    infos.push(scope(name) + ' | declared name: ' + toml.task.name);
  }

  REQUIRED_DIRS.forEach(function (dir) {
    var prefix = task + '/' + dir;
    if (!pkg.isDir(prefix)) {
      hard(name, dir + '/ missing', 'add the ' + dir + '/ folder');
      return;
    }
    var content = pkg.under(prefix).filter(function (p) {
      return notCache(rel(task, p)) && pkg.size(p) > 0;
    });
    if (!content.length) {
      hard(name, dir + '/ holds no content', 'populate ' + dir + '/ with the real files');
    }
  });

  if (!pkg.isFile(task + '/instruction.md')) {
    warnings.push(scope(name) + ' | Problem: instruction.md missing. | Fix: add the task instruction.');
  }
  if (!pkg.isFile(task + '/environment/Dockerfile')) {
    warnings.push(scope(name) + ' | Problem: environment/Dockerfile missing. | Fix: add the environment image definition.');
  }
}

function checkSpecs(task, pkg) {
  var specs = SPEC_PATHS.filter(function (p) { return pkg.isFile(task + '/' + p); });
  if (!specs.length) {
    hard(
      base(task),
      'no grader spec: expected tests/verifier.json, tests/manifest.json, or verifier.json',
      'add the grader spec so the task can be scored'
    );
  } else {
    infos.push(scope(base(task)) + ' | grader specs: ' + specs.join(', '));
  }
}

// filecmp in the Python; here an exact content comparison of the graded paths.
function checkMirror(task, pkg) {
  var mirror = task + '/environment/_app';
  if (!pkg.isDir(mirror)) return;

  var drifted = [];
  pkg.under(mirror).forEach(function (copied) {
    var relative = rel(mirror, copied);
    if (!notCache(relative)) return;
    var origin = task + '/' + relative;
    if (!pkg.isFile(origin)) return;
    var graded =
      MIRROR_GRADED_FILES.indexOf(relative) !== -1 ||
      MIRROR_GRADED_TREES.indexOf(relative.split('/')[0]) !== -1;
    if (graded && !sameContent(pkg.get(origin), pkg.get(copied))) drifted.push(relative);
  });
  if (drifted.length) {
    hard(
      base(task),
      'environment/_app mirror disagrees with the root in graded paths: ' + listed(drifted.sort()),
      're-sync environment/_app from the task root'
    );
  }

  ['tests/manifest.json', 'tests/verifier.json'].forEach(function (spec) {
    if (pkg.isFile(task + '/' + spec) && pkg.isDir(mirror + '/tests') && !pkg.isFile(mirror + '/' + spec)) {
      hard(base(task), 'environment/_app carries tests/ but not ' + spec, 'copy ' + spec + ' into environment/_app/tests/');
    }
  });
}

function checkEvaluationShape(task, pkg) {
  var evaluations = task + '/evaluations';
  if (!pkg.has(evaluations)) return;
  if (!pkg.isDir(evaluations)) {
    hard(base(task), 'evaluations must be a directory when present', 'remove the stray evaluations file');
    return;
  }

  // The fetcher hands back a string instead of an object when a .json does not parse.
  var invalid = pkg.under(evaluations).filter(function (p) {
    return endsWith(p, '.json') && typeof pkg.get(p) === 'string';
  }).map(function (p) { return rel(task, p); });
  if (invalid.length) {
    finding(base(task), 'T0.evaluation-json', 'unparseable evaluation artifact(s): ' + listed(invalid));
  }

  var bad = [];
  [SOLVABILITY, DIFFICULTY, STABILITY].forEach(function (axis) {
    trialDirs(evaluations + '/' + axis, pkg).forEach(function (run) {
      if (reward(run, pkg) === null) bad.push(rel(task, run));
    });
  });
  if (bad.length) {
    finding(base(task), 'T0.evaluation-reward', 'canonical run(s) lack a readable reward: ' + listed(bad));
  }
}

function checkFinalRoot(task, pkg) {
  var actual = pkg.children(task).filter(notCache);
  FINAL_ROOT_REQUIRED.forEach(function (entry) {
    if (actual.indexOf(entry) === -1) finding(base(task), 'T0.root-missing', 'final package is missing ' + entry);
  });
  actual.forEach(function (entry) {
    if (FINAL_ROOT_ALLOWED.indexOf(entry) === -1) {
      finding(base(task), 'T0.root-extra', 'final package has unexpected root entry ' + entry);
    }
  });
  var axes = pkg.children(task + '/evaluations');
  REQUIRED_FINAL_AXES.forEach(function (axis) {
    if (axes.indexOf(axis) === -1) {
      finding(base(task), 'T0.evaluation-axis-missing', 'evaluations/' + axis + '/ missing');
    }
  });
}

function checkCertificate(task, pkg) {
  var name = base(task);
  var html = pkg.get(task + '/qc_report.html');
  if (typeof html !== 'string') {
    finding(name, 'T0.certificate-missing', 'qc_report.html is missing');
    return;
  }
  var match = html.match(
    /<script\b[^>]*\bid=["'](?:qc-certificate|harbor-qc-certificate|harbor-client-qc-certificate)["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match) {
    finding(name, 'T0.certificate-missing', 'embedded QC certificate is missing');
    return;
  }
  var certificate;
  try {
    certificate = JSON.parse(match[1]);
  } catch (e) {
    finding(name, 'T0.certificate-invalid', 'embedded QC certificate is invalid JSON');
    return;
  }
  var missing = CERTIFICATE_KEYS.filter(function (key) {
    return !certificate || typeof certificate !== 'object' || !(key in certificate);
  });
  if (missing.length) {
    finding(name, 'T0.certificate-invalid', 'embedded QC certificate lacks ' + missing.join(', '));
  }
}

function checkSolvability(task, pkg) {
  var runs = trialDirs(task + '/evaluations/' + SOLVABILITY, pkg);
  var passing = runs.filter(function (run) {
    return reward(run, pkg) === 1 && trajectory(run, pkg) !== null && !isOracle(run, pkg);
  });
  if (passing.length !== 1) {
    finding(
      base(task),
      'T0.solvability',
      'requires exactly one reward-1.0 non-Oracle run with a saved trajectory; found ' +
        passing.length + ' of ' + runs.length + ' run(s)'
    );
  }
}

function checkDifficulty(task, pkg) {
  var name = base(task);
  var runs = trialDirs(task + '/evaluations/' + DIFFICULTY, pkg);
  if (runs.length !== 4 && runs.length !== 5) {
    finding(name, 'T0.difficulty-count', 'requires four or five difficulty trials; found ' + runs.length);
    return;
  }

  var invalid = [];
  runs.forEach(function (run) {
    var id = runIdentity(run, pkg);
    if (reward(run, pkg) === null || trajectory(run, pkg) === null || isOracle(run, pkg)) {
      invalid.push(base(run));
    } else if (!id.agent || !id.model || !id.environment) {
      invalid.push(base(run) + ' (missing provenance)');
    } else if (id.model.toLowerCase().indexOf('glm-5.2') === -1 && id.model.toLowerCase().indexOf('glm-5p2') === -1) {
      invalid.push(base(run) + ' (not GLM-5.2)');
    }
  });
  if (invalid.length) {
    finding(name, 'T0.difficulty-trials', 'invalid difficulty trials: ' + listed(invalid));
    return;
  }

  var passes = 0;
  runs.slice(0, 4).forEach(function (run) {
    if (reward(run, pkg) === 1) passes++;
  });
  if (passes > 2) {
    finding(
      name,
      'T2.difficulty-score',
      passes + '/4 difficulty trials passed; deterministic delivery limit is 2/4'
    );
  } else {
    infos.push(scope(name) + ' | difficulty: ' + passes + '/4 trials passed (limit 2/4).');
  }
}

function checkStability(task, pkg) {
  var name = base(task);
  var runs = trialDirs(task + '/evaluations/' + STABILITY, pkg);
  if (runs.length < 3) {
    finding(name, 'T0.stability-count', 'requires at least three frozen-answer regrades; found ' + runs.length);
    return;
  }

  var rewards = runs.map(function (run) { return reward(run, pkg); });
  var trajectories = runs.map(function (run) {
    var path = trajectory(run, pkg);
    return path === null ? null : pkg.get(path);
  });
  var configs = runs.map(function (run) { return pkg.get(run + '/config.json'); });
  var locks = runs.map(function (run) { return pkg.get(run + '/lock.json'); });

  if (!identical(rewards)) {
    finding(name, 'T0.stability-reward', 'stability regrade rewards disagree or are missing');
  }
  if (!identical(trajectories)) {
    finding(name, 'T0.stability-identity', 'stability regrades do not use one frozen trajectory');
  }
  if (!identical(configs)) {
    finding(name, 'T0.stability-config', 'stability config.json files are missing or differ');
  }
  if (!identical(locks)) {
    finding(name, 'T0.stability-lock', 'stability lock.json files are missing or differ');
  }
}

function checkPlatform(task, pkg) {
  var name = base(task);
  var providers = [['e2b', ['oracle', 'codex']], ['modal', ['oracle', 'run']]];
  providers.forEach(function (entry) {
    var provider = entry[0];
    entry[1].forEach(function (role) {
      var label = 'platform ' + provider + '/' + role;
      var runs = trialDirs(task + '/evaluations/' + PLATFORM + '/' + provider + '/' + role, pkg);
      if (runs.length !== 1) {
        finding(
          name, 'T0.platform-layout',
          'evaluations/' + PLATFORM + '/' + provider + '/' + role + ' requires exactly one run; found ' + runs.length
        );
        return;
      }
      var run = runs[0];
      var value = reward(run, pkg);
      if (value === null) finding(name, 'T0.platform-reward', label + ' has no readable reward');
      if (role === 'oracle' && value !== 1) {
        finding(name, 'T0.platform-oracle-reward', 'platform ' + provider + ' Oracle reward must be 1.0');
      }
      if (role !== 'oracle' && trajectory(run, pkg) === null) {
        finding(name, 'T0.platform-trajectory', label + ' has no saved agent trajectory');
      }
      if (role !== 'oracle' && !pkg.isFile(run + '/sanity_check.md')) {
        finding(name, 'T0.platform-sanity-check', label + ' lacks digest-bound sanity_check.md');
      }
    });
  });
}

// ------------------------------------------------------------------ Harbor helpers

// discover(): task roots hold task.toml; a root inside another package's environment/ is a
// build-time mirror, not an independent package.
function discover(pkg) {
  var candidates = pkg.paths
    .filter(function (p) { return endsWith(p, 'task.toml'); })
    .map(function (p) { return p.slice(0, p.length - '/task.toml'.length); })
    .sort(function (a, b) {
      return a.split('/').length - b.split('/').length || (a < b ? -1 : a > b ? 1 : 0);
    });

  var roots = [];
  var nested = [];
  candidates.forEach(function (candidate) {
    var parent = null;
    for (var i = 0; i < roots.length; i++) {
      if (under(candidate, roots[i])) { parent = roots[i]; break; }
    }
    if (parent === null) roots.push(candidate);
    else if (!under(candidate, parent + '/environment')) nested.push(candidate);
  });
  return { roots: roots, nested: nested };
}

// Terminal run directories, not the parent Harbor job directories above them.
function trialDirs(root, pkg) {
  var parents = pkg
    .under(root)
    .filter(function (p) { return endsWith(p, '/result.json'); })
    .map(function (p) { return p.slice(0, p.length - '/result.json'.length); })
    .sort();
  return parents.filter(function (parent) {
    for (var i = 0; i < parents.length; i++) {
      if (parents[i] !== parent && under(parents[i], parent)) return false;
    }
    return true;
  });
}

function reward(run, pkg) {
  var candidates = [
    run + '/verifier/reward.json',
    run + '/verifier/reward.txt',
    run + '/verifier/verifier_summary.json',
    run + '/reward.json',
    run + '/result.json'
  ];
  for (var i = 0; i < candidates.length; i++) {
    var path = candidates[i];
    if (!pkg.isFile(path)) continue;
    var payload = pkg.get(path);

    if (endsWith(path, '.txt')) {
      var parsed = parseFloat(String(payload).trim());
      if (isFinite(parsed)) return parsed;
      continue;
    }
    if (!payload || typeof payload !== 'object') continue;

    var values = [
      payload.reward,
      (payload.verifier_result || {}).rewards ? payload.verifier_result.rewards.reward : undefined,
      (payload.verification_summary || {}).weighted_pass_rate
    ];
    for (var j = 0; j < values.length; j++) {
      var value = values[j];
      if (typeof value === 'boolean') return value ? 1 : 0;
      if (typeof value === 'number' && isFinite(value)) return value;
    }
  }
  return null;
}

function trajectory(run, pkg) {
  var candidates = [
    run + '/agent/trajectory.json',
    run + '/agent/frozen_trajectory.json',
    run + '/trajectory.json'
  ];
  for (var i = 0; i < candidates.length; i++) {
    if (pkg.isFile(candidates[i])) return candidates[i];
  }
  return null;
}

function runIdentity(run, pkg) {
  var config = objectAt(pkg.get(run + '/config.json'));
  var result = objectAt(pkg.get(run + '/result.json'));
  var configAgent = objectAt(config.agent);
  var resultAgent = objectAt(result.agent_info);
  var environment = objectAt(config.environment);
  return {
    agent: String(configAgent.name || resultAgent.name || ''),
    model: String(configAgent.model_name || objectAt(resultAgent.model_info).name || ''),
    environment: String(environment.type || environment.import_path || '')
  };
}

function isOracle(run, pkg) {
  var result = objectAt(pkg.get(run + '/result.json'));
  var id = runIdentity(run, pkg);
  return (
    pkg.isFile(run + '/agent/oracle.txt') ||
    run.toLowerCase().indexOf('oracle') !== -1 ||
    id.agent.toLowerCase().indexOf('oracle') !== -1 ||
    id.model.toLowerCase().indexOf('oracle') !== -1 ||
    String(result.trial_name || '').toLowerCase().indexOf('oracle') !== -1
  );
}

// TOML subset reader: tables, dotted keys, quoted/bare scalars and single-line arrays --
// enough for [task] name and metadata.mcp_servers_extended. Returns null on a syntax error.
function parseToml(text) {
  if (typeof text !== 'string') return null;
  var out = {};
  var table = out;
  var lines = text.split(/\r?\n/);

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/^\s+|\s+$/g, '');
    if (!line || line.charAt(0) === '#') continue;

    if (line.charAt(0) === '[') {
      var header = line.match(/^\[\[?([^\]]+)\]\]?$/);
      if (!header) return null;
      table = tableAt(out, header[1].split('.'));
      if (table === null) return null;
      continue;
    }

    var eq = line.indexOf('=');
    if (eq === -1) return null;
    var key = line.slice(0, eq).replace(/^\s+|\s+$/g, '').replace(/^["']|["']$/g, '');
    var value = line.slice(eq + 1).replace(/^\s+|\s+$/g, '').replace(/\s*#.*$/, '');
    if (!key) return null;
    if (value.charAt(0) === '[' && value.indexOf(']') === -1) {
      // Multi-line array: consume until the closing bracket.
      while (++i < lines.length && value.indexOf(']') === -1) value += lines[i].replace(/^\s+|\s+$/g, '');
    }
    table[key] = tomlValue(value);
  }
  return out;
}

function tableAt(root, parts) {
  var node = root;
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i].replace(/^\s+|\s+$/g, '').replace(/^["']|["']$/g, '');
    if (!part) return null;
    if (!node[part] || typeof node[part] !== 'object') node[part] = {};
    node = node[part];
  }
  return node;
}

function tomlValue(value) {
  if (value.charAt(0) === '[') {
    var inner = value.slice(1, value.lastIndexOf(']'));
    if (!inner.replace(/^\s+|\s+$/g, '')) return [];
    return inner.split(',').map(function (item) {
      return tomlValue(item.replace(/^\s+|\s+$/g, ''));
    }).filter(function (item) { return item !== ''; });
  }
  if (/^"""|^'''/.test(value)) return value.replace(/^("""|''')|("""|''')$/g, '');
  if (/^["']/.test(value)) return value.replace(/^["']|["']$/g, '');
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

// ------------------------------------------------------------------ package index

function index(raw) {
  var sizes = raw && typeof raw.__sizes === 'object' && raw.__sizes ? raw.__sizes : {};
  var paths = [];
  for (var key in raw) {
    if (key === '__sizes') continue;
    if (Object.prototype.hasOwnProperty.call(raw, key)) paths.push(key);
  }
  paths.sort();

  var dirs = {};
  var kids = {};
  paths.forEach(function (path) {
    var parts = path.split('/');
    for (var i = 1; i < parts.length; i++) {
      var dir = parts.slice(0, i).join('/');
      dirs[dir] = true;
      if (!kids[dir]) kids[dir] = {};
      kids[dir][parts[i]] = true;
    }
  });

  return {
    paths: paths,
    get: function (path) { return raw[path]; },
    isFile: function (path) { return Object.prototype.hasOwnProperty.call(raw, path); },
    isDir: function (path) { return !!dirs[path]; },
    has: function (path) { return !!dirs[path] || Object.prototype.hasOwnProperty.call(raw, path); },
    size: function (path) {
      if (typeof sizes[path] === 'number') return sizes[path];
      var value = raw[path];
      return typeof value === 'string' ? value.length : value === undefined ? 0 : 1;
    },
    children: function (path) { return kids[path] ? Object.keys(kids[path]).sort() : []; },
    under: function (path) {
      return paths.filter(function (candidate) { return under(candidate, path); });
    }
  };
}

// ------------------------------------------------------------------ reporting

function scope(name) {
  return 'Task Package ' + name + ' — "taskFolder"';
}

// Structural breaks: always blocking, in every profile (the Python appends these straight to
// report.errors rather than routing them through _add_finding).
function hard(name, message, fix) {
  errors.push(scope(name) + ' | Problem: ' + message + '. | Fix: ' + fix + '.');
}

// Package-quality gaps: advisory at upload, blocking under audit/delivery (_add_finding).
function finding(name, code, message) {
  var rendered = scope(name) + ' | Problem: ' + code + ': ' + message + '. | Fix: ' +
    (FIXES[code] || 'report this task to your lead.');
  if (PROFILE === AUDIT || PROFILE === DELIVERY) errors.push(rendered);
  else warnings.push('ADVISORY ' + rendered);
}

// Every entry name, packed a few per line so the 100-entry / 1000-char log limits hold.
function logFiles(paths) {
  logs.push('Package contents (' + paths.length + ' files):');
  var line = '';
  for (var i = 0; i < paths.length; i++) {
    var next = line ? line + ' | ' + paths[i] : paths[i];
    if (next.length > 900) { logs.push(line); line = paths[i]; } else { line = next; }
  }
  if (line) logs.push(line);
}

// ------------------------------------------------------------------ small utilities

function profileOf(conversationData) {
  var ratings = ratingsOf(conversationData);
  var value = isArray(ratings) ? valueByKey(ratings, 'validationProfile') : ratings.validationProfile;
  value = typeof value === 'string' ? value : value && value.value;
  value = typeof value === 'string' ? value.toLowerCase() : '';
  return value === AUDIT || value === DELIVERY || value === UPLOAD ? value : PROFILE;
}

function taskFolderLink(conversationData) {
  var ratings = ratingsOf(conversationData);
  var raw = isArray(ratings) ? valueByKey(ratings, 'taskFolder') : ratings.taskFolder;
  var link = typeof raw === 'string' ? raw : raw && typeof raw.value === 'string' ? raw.value : null;
  return link && link.replace(/^\s+|\s+$/g, '') ? link : null;
}

function ratingsOf(conversationData) {
  var data = conversationData || {};
  var ratings =
    (data.task_data && data.task_data.formData && data.task_data.formData.ratings) ||
    (data.conversation && data.conversation.ratings) ||
    (data.raw_data && data.raw_data.formData && data.raw_data.formData.ratings) ||
    data.ratings ||
    {};
  return ratings;
}

function valueByKey(ratings, key) {
  for (var i = 0; i < ratings.length; i++) {
    if (ratings[i] && ratings[i].key === key) {
      return ratings[i].human_input_value !== undefined ? ratings[i].human_input_value : ratings[i].value;
    }
  }
  return null;
}

function sameContent(a, b) {
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  return stable(a) === stable(b);
}

function identical(values) {
  for (var i = 0; i < values.length; i++) {
    if (values[i] === null || values[i] === undefined) return false;
    if (i && !sameContent(values[i], values[0])) return false;
  }
  return values.length > 0;
}

// Key-order-independent serialisation, so two equal JSON artifacts compare equal.
function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value === undefined ? null : value);
  if (isArray(value)) {
    return '[' + value.map(stable).join(',') + ']';
  }
  return '{' + Object.keys(value).sort().map(function (key) {
    return JSON.stringify(key) + ':' + stable(value[key]);
  }).join(',') + '}';
}

function objectAt(value) {
  return value && typeof value === 'object' && !isArray(value) ? value : {};
}

function notCache(path) {
  for (var i = 0; i < CACHE_SUFFIXES.length; i++) {
    if (endsWith(path.toLowerCase(), CACHE_SUFFIXES[i])) return false;
  }
  var parts = path.split('/');
  for (var j = 0; j < parts.length; j++) {
    if (CACHE_DIRS.indexOf(parts[j]) !== -1) return false;
  }
  return true;
}

function under(path, prefix) {
  return path.indexOf(prefix + '/') === 0;
}

function base(path) {
  var parts = path.split('/');
  return parts[parts.length - 1];
}

function rel(prefix, path) {
  return under(path, prefix) ? path.slice(prefix.length + 1) : path;
}

function endsWith(text, suffix) {
  return text.length >= suffix.length && text.slice(text.length - suffix.length) === suffix;
}

function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}

function listed(values, limit) {
  limit = limit || 6;
  var shown = values.slice(0, limit).join(', ');
  return values.length > limit ? shown + ', … +' + (values.length - limit) : shown;
}

function msgOf(e) {
  return e && typeof e === 'object' && e.message ? String(e.message) : String(e);
}
