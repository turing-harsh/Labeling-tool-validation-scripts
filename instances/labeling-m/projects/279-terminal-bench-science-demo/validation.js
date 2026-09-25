// Terminal-Bench-Science task-package validation for labeling-m project 279.
//
// Sibling of labeling-g/817-universal-demo-j1-llmae-d: the same deterministic package checks,
// but the task package arrives as a Google DRIVE FOLDER (ratings.task) instead of a signed GCS
// ZIP, and the package contract is this benchmark's rather than Harbor's finalization contract.
// Read with fetchDriveData(link, { as: 'folder' }) ->
//   { sourceType, files: { "<relative path>": parsedJsonOrText }, sizes, meta }.
//
// This gate runs BEFORE any execution: the author drops a raw, unrun folder and neither the
// oracle nor an agent has touched it. Nothing here builds an image or runs a container, so
// every check below is decidable from the bytes of the folder alone. Its job is to reject a
// package that cannot survive an oracle run -- or whose oracle run would prove nothing --
// before that run is paid for.
//
// Checks are grouped so every finding is traceable to something in the package:
//   A  transport      link shape, fetch, empty folder, partial read, unreadable entries
//   B  discovery      some task.toml exists; no package nested inside another
//   C  structure      task.toml parses and names the task; solution/ tests/ environment/ hold content
//   D  grader spec    tests/test.sh, solution/solve.sh, verifier image
//   E  oracle         solution/solve.sh
//   I  module drift   a module shipped to both tests/ and solution/ must be byte-identical
//   L  leakage        the agent's tree must not carry answers, grader data or expected output
//   R  runnability    every path the oracle and verifier reference must be in the package
//   V  verifier       artifacts declared, image bakes its deps, a reward is actually written
//   X  cross-file     instruction, task.toml and artifacts must agree with each other
//   P  provenance     canary GUIDs, checksum manifests, junk that should not ship
//
// Three deliberate divergences from 817, all documented in requirements.md:
//   * 817's grader spec is tests/verifier.json|tests/manifest.json|verifier.json. This benchmark
//     grades through tests/test.sh, so D checks that entry point instead.
//   * 817 mirrors environment/_app against the task root. This package has no _app; its real
//     duplication is kitf.py shipped to both tests/ and solution/, so I checks that.
//   * 817's per-axis evaluations audit (solvability/difficulty/stability/platform) is NOT ported:
//     these packages carry no evaluations/ tree. The task-only classification and the delivery
//     gate are kept, so adding the axis checks later is additive.
//
// Absence-based findings are unsound when meta.truncated is true -- `files` is then partial and
// every "X is missing" check would fire on files the package really has. Those findings route
// through missingFinding()/missingHard(), which stand down in that case and say so.

// Default profile. A task may override it per-batch with a "validationProfile" form field.
var PROFILE = 'upload';

var UPLOAD = 'upload';
var AUDIT = 'audit';
var DELIVERY = 'delivery';

var SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
// The benchmark names task folders in kebab-case with at most three words.
var KEBAB_NAME = /^[a-z0-9]+(-[a-z0-9]+){0,2}$/;
var REQUIRED_DIRS = ['solution', 'tests', 'environment'];
var CACHE_DIRS = ['__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache'];
var CACHE_SUFFIXES = ['.pyc', '.pyo'];

// Working material that should never ship inside a task package.
var JUNK_NAMES = ['.DS_Store', 'Thumbs.db', 'desktop.ini', '.git', '.gitkeep-cache',
  '.ipynb_checkpoints', 'node_modules', '.venv', 'venv', 'env', '.tox', '.idea', '.vscode'];

// The verifier and oracle entry points.
var VERIFIER_ENTRY = 'tests/test.sh';
var ORACLE_ENTRY = 'solution/solve.sh';

// Files whose content is data: a name collision across the agent/grader boundary with
// different bytes on each side means the agent fits one dataset and is marked against another.
var DATA_SUFFIXES = ['.csv', '.tsv', '.json', '.jsonl', '.ndjson', '.npy', '.npz', '.parquet',
  '.h5', '.hdf5', '.fits', '.pkl', '.parq'];

// Files that can carry a leading comment, so the canary requirement applies to them.
var CANARY_SUFFIXES = ['.md', '.py', '.sh', '.toml', '.yaml', '.yml', '.cfg', '.ini'];
var CANARY_NAMES = ['Dockerfile'];
var CANARY = /harbor-canary GUID ([0-9a-fA-F][0-9a-fA-F-]{7,})/;

// Names that look like grader truth rather than agent input.
var ANSWERISH = /^(held_?out|hold_?out|answers?|truth|ground_?truth|expected|solutions?|gold|labels?|targets?|key|keys)([._-]|$)/i;

// The benchmark's domain -> field vocabulary. A typo here routes the task to no reviewer.
var DOMAIN_FIELDS = {
  'life-sciences': ['biology', 'ecology', 'medicine', 'neuroscience'],
  'physical-sciences': ['astronomy', 'chemistry', 'materials-science', 'physics'],
  'earth-sciences': ['atmospheric-sciences', 'environmental-sciences', 'geosciences', 'ocean-sciences'],
  'mathematical-sciences': ['applied-mathematics', 'formal-mathematics', 'operations-research', 'statistics'],
  'engineering-sciences': ['chemical-engineering', 'civil-engineering', 'electrical-engineering', 'mechanical-engineering']
};

// Pinned benchmark-wide; the verifier image must bake exactly these.
var PYTEST_PINS = ['pytest==8.4.1', 'pytest-json-ctrf==0.3.5'];

// The closing sentence every instruction must carry, with the agent budget in it.
var INSTRUCTION_TAIL =
  /You have\s+(\d+)\s+seconds to complete this task\.\s*Do not cheat by using online solutions or hints specific to this task\./;

// The authoring cap: /run trials execute on a runner whose job limit is six hours.
var AGENT_TIMEOUT_CAP = 18000;

// Fields that moved out of task.toml into README.md sections.
var RETIRED_TOML_FIELDS = ['difficulty_explanation', 'solution_explanation', 'verification_explanation'];

// A skipped entry whose reason matches this was dropped by one of the reader's budgets, not
// because the file itself is unreadable. truncationCause() reports those; the per-entry
// warning leaves them alone so one truncation is not also reported as N unreadable files.
var BUDGET_REASON = /maximum of \d+ files per folder|folder byte budget of \d+|deadline reached|maximum folder depth of \d+/;

var FIXES = {
  'T0.metadata-missing': 'fill the [metadata] block in task.toml (domain, field, subfield, expert time).',
  'T0.network-mode-undeclared': 'declare network_mode explicitly in [verifier.environment] and [environment]; Harbor defaults it to "public".',
  'T0.delivery-evaluations-missing': 'run the evaluations before submitting for delivery.',

  'T1.folder-name-style': 'rename the task folder to kebab-case with at most three words, e.g. rainfall-return-levels.',
  'T1.answer-shaped-input': 'move grader-only data into tests/, or rename the file if it really is agent input.',
  'T1.verifier-mode': 'set environment_mode = "separate" under [verifier]; this benchmark requires an isolated verifier.',
  'T1.artifact-dirs-uncreated': 'add a RUN mkdir -p to tests/Dockerfile for every artifact parent directory and /logs/verifier.',
  'T1.pytest-pin': 'bake the benchmark-wide pinned versions into tests/Dockerfile.',
  'T1.unpinned-install': 'pin every pip package to an exact version so the image rebuilds identically.',
  'T1.reward-unwritten': 'write a binary reward (0 or 1) to /logs/verifier/reward.txt from tests/test.sh.',
  'T1.reward-fractional': 'collapse the score to a literal 0 or 1 at the write site; Harbor gives no partial credit.',
  'T1.instruction-suffix': 'end instruction.md with: You have X seconds to complete this task. Do not cheat by using online solutions or hints specific to this task.',
  'T1.readme-missing': 'add README.md with ## Difficulty, ## Reference solution and ## Verification; it is the task\'s published card.',
  'T1.readme-sections': 'fill in each README section; an HTML comment does not count as content.',
  'T1.canary-missing': 'add the canary comment as line 1 of every text file, including everything under authoring/.',
  'T1.checksum-orphan': 'regenerate SHA256SUMS so it lists exactly the files that ship beside it.',
  'T1.junk-shipped': 'delete the working files from the package and re-upload.',
  'T1.metadata-vocabulary': 'use one of the benchmark\'s declared domain/field pairs in task.toml [metadata].',
  'T1.task-block-incomplete': 'fill in description, authors and keywords under [task]; they are what the task publishes with.',
  'T1.task-name-mismatch': 'set [task] name to "terminal-bench-science/<task folder name>".',
  'T1.agent-timeout': 'set [agent] timeout_sec to at most 18000.',
  'T1.retired-fields': 'move these into README.md sections and delete them from task.toml.',
  'T1.network-mode-value': 'set [environment] network_mode = "public" and [verifier.environment] network_mode = "no-network".',
  'T1.gpu-backend': 'set validate_env = "modal" under [environment] whenever gpus >= 1.'
};

var PARTIAL = false;
var standDown = 0;

async function validate(conversationData) {
  PROFILE = profileOf(conversationData);

  if (typeof fetchDriveData !== 'function') {
    errors.push(
      'Task Metadata — "task" | Problem: this instance cannot read Drive folders: the sandbox has no fetchDriveData. ' +
        '| Fix: report this to your lead -- run-checks-api needs the build that added fetchDriveData/fetchGcsData.'
    );
    return;
  }

  var link = taskLink(conversationData);
  if (!link) {
    errors.push(
      'Task Metadata — "task" | Problem: the task package link is missing. ' +
        '| Fix: re-export the task so the "task" field holds the Drive folder URL.'
    );
    return;
  }
  if (!/\/folders\/[A-Za-z0-9_-]+/.test(link)) {
    var isFileLink = /\/file\/d\/|[?&]id=/.test(link);
    errors.push(
      'Task Metadata — "task" | Problem: the "task" link is not a Drive folder link' +
        (isFileLink ? ' -- it points at a single Drive file' : '') + ', so the package cannot be read. ' +
        '| Fix: paste the link to the task FOLDER (its URL contains /drive/folders/), not to a file inside it. ' +
        '| Why: got "' + link.slice(0, 160) + '".'
    );
    return;
  }

  var envelope;
  try {
    envelope = await fetchDriveData(link, { as: 'folder' });
  } catch (e) {
    errors.push(
      'Task Package — "task" | Problem: the Drive folder could not be read. ' +
        '| Fix: in Drive open the folder\'s Share settings and give access to the automation account, then re-run. ' +
        'If it still fails, report this task to your lead. | Why: ' + msgOf(e) + '.'
    );
    return;
  }

  var meta = objectAt(envelope && envelope.meta);
  var pkg = index(objectAt(envelope && envelope.files), objectAt(envelope && envelope.sizes));

  if (!pkg.paths.length) {
    errors.push(
      'Task Package — "task" | Problem: the linked Drive folder holds no readable files. ' +
        '| Fix: check you linked the task folder itself and that its contents are shared, then re-run. ' +
        '| Why: ' + describeMeta(meta) + '.'
    );
    return;
  }

  // A partial read cannot prove anything absent, so say so loudly and stand the absence checks
  // down rather than emitting a page of findings about files the package may well contain.
  // The message names the limit that actually fired, read out of meta.skipped -- never a
  // hardcoded number, because the reader's budgets are deployment config and drift. "Too
  // large" was wrong as often as right: a package can be truncated by the file-count cap at a
  // fifth of the byte budget, and by the wall-clock deadline at any size.
  if (meta.truncated === true) {
    PARTIAL = true;
    var cause = truncationCause(meta);
    errors.push(
      'Task Package — "task" | Problem: the linked Drive folder could not be read in full (' + cause.what +
        '), so the package cannot be fully validated. | Fix: ' + cause.fix +
        ' | Why: ' + describeMeta(meta) + '; ' + cause.evidence + '.'
    );
  }

  // Report the entries the reader could not take, grouped by why: a Workspace file needs
  // exporting, a budget hit is already covered by the truncation finding above. Reporting
  // them all as "export your Google Docs" is wrong the moment a cap is what skipped them.
  var skipped = isArray(meta.skipped) ? meta.skipped : [];
  var workspace = skipped.filter(function (e) {
    return /Workspace file has no binary content/.test(String(objectAt(e).reason || ''));
  });
  if (workspace.length) {
    warnings.push(
      'Task Package — "task" | Problem: ' + workspace.length + ' Google Workspace file(s) in the folder carry no ' +
        'file content, so they could not be read. | Fix: export each to a real file (.md, .csv, .py) and re-upload it. ' +
        '| Why: ' + listed(workspace.map(describeSkipped)) + '.'
    );
  }
  var unreadable = skipped.filter(function (e) {
    var reason = String(objectAt(e).reason || '');
    return !/Workspace file has no binary content/.test(reason) && !BUDGET_REASON.test(reason);
  });
  if (unreadable.length) {
    warnings.push(
      'Task Package — "task" | Problem: ' + unreadable.length + ' entr' + (unreadable.length === 1 ? 'y' : 'ies') +
        ' in the folder could not be read. | Fix: confirm the file is shared with the automation account and is not ' +
        'a broken shortcut; re-upload it if it is corrupt. | Why: ' + listed(unreadable.map(describeSkipped)) + '.'
    );
  }

  infos.push('Profile ' + PROFILE + ': read ' + pkg.paths.length + ' file(s) from the Drive folder (' + describeMeta(meta) + ').');
  logFiles(pkg.paths);

  var discovered = discover(pkg);
  if (!discovered.roots.length) {
    missingHard(
      'Task Package',
      'no task package found -- there is no task.toml anywhere in the linked folder',
      'link the task folder itself (the one holding task.toml), not a parent or a partial copy'
    );
    if (!PARTIAL) return;
  }

  discovered.nested.forEach(function (path) {
    errors.push(
      scope(base(path)) + ' | Problem: this task package sits inside another package. ' +
        '| Fix: link one task folder per task. | Why: nested task.toml at ' + path + '/task.toml.'
    );
  });

  var counts = {};
  discovered.roots.forEach(function (root) {
    var name = labelOf(root, pkg);
    counts[name] = (counts[name] || 0) + 1;
  });

  discovered.roots.forEach(function (root) {
    var name = labelOf(root, pkg);
    if (counts[name] > 1) {
      errors.push(
        scope(name) + ' | Problem: duplicate task folder identity. ' +
          '| Fix: give each task package a unique folder name.'
      );
    }
    validateTask(root, pkg);
  });

  infos.push(
    'Not enforced here (needs data a Drive folder read does not carry): file modes and symbolic links. ' +
      'Drive shortcuts are followed by the fetcher, and a shortcut cycle is reported as a skipped entry.'
  );
  infos.push(
    'Not enforced here (needs execution, so it belongs to the oracle stage): the image builds, the oracle ' +
      'scores 1, an empty submission scores 0, deliberately wrong answers score 0, and reformatted correct ' +
      'answers still score 1.'
  );
  if (standDown) {
    infos.push(
      standDown + ' absence check(s) stood down because the folder read was partial -- ' +
        're-run once the package is readable in full before trusting a PASS.'
    );
  }

  if (!errors.length) {
    successes.push(
      'Task package passes the deterministic ' + PROFILE + ' checks (' +
        discovered.roots.map(function (r) { return labelOf(r, pkg); }).join(', ') + ').'
    );
  }
}

// ------------------------------------------------------------------ per-task checks

function validateTask(task, pkg) {
  var name = labelOf(task, pkg);
  var toml = parseToml(pkg.get(at(task, 'task.toml')));

  infos.push(
    scope(name) + ' | classification: ' + (pkg.isDir(at(task, 'evaluations')) ? 'with-runs' : 'task-only')
  );

  checkStructure(task, pkg, toml);
  checkGraderSpec(task, pkg, toml);
  checkModuleDrift(task, pkg);
  checkTaskMetadata(task, pkg, toml);

  // Pre-oracle gate: everything below decides whether an oracle run can succeed, and whether
  // its result would mean anything.
  checkArtifacts(task, pkg, toml);        // L/V -- declared outputs, and none of them shipped
  checkLeakage(task, pkg);                // L   -- answers must not reach the agent's tree
  checkEntryReferences(task, pkg);        // R   -- solve.sh / test.sh run files that exist
  checkBuildInputs(task, pkg);            // R   -- Dockerfiles copy paths that exist
  checkVerifierContract(task, pkg, toml); // V   -- the verifier image can build and will score
  checkInstruction(task, pkg, toml);      // X   -- instruction agrees with task.toml
  checkReadme(task, pkg);                 // P   -- the published card
  checkCanary(task, pkg);                 // P   -- one GUID, on every text file
  checkChecksums(task, pkg);              // P   -- a manifest that matches what shipped
  checkJunk(task, pkg);                   // P   -- working files that should not ship

  if (!pkg.isDir(at(task, 'evaluations')) && PROFILE === DELIVERY) {
    missingFinding(name, 'T0.delivery-evaluations-missing', 'evaluations/ is required for a delivery package');
  }
}

// C -- structure. The folder name is only checkable for a package in a SUBFOLDER: when the
// linked folder is itself the package root, the read carries no name for it.
function checkStructure(task, pkg, toml) {
  var name = labelOf(task, pkg);

  if (task) {
    if (!SAFE_NAME.test(base(task))) {
      hard(name, 'folder name is not a safe path segment', 'rename the folder to letters, digits, dot, dash or underscore');
    } else if (!KEBAB_NAME.test(base(task))) {
      finding(name, 'T1.folder-name-style', 'folder name "' + base(task) + '" is not kebab-case with at most three words');
    }
  } else {
    infos.push(scope(name) + ' | the linked folder is the package root, so its own name is not part of the read and is not checked.');
  }

  var tomlPath = at(task, 'task.toml');
  if (!pkg.isFile(tomlPath) || !pkg.size(tomlPath)) {
    missingHard(name, 'task.toml missing or empty', 'add the task definition');
  } else if (toml === null) {
    hard(name, 'task.toml does not parse', 're-check the TOML syntax');
  } else if (!toml.task || !toml.task.name) {
    hard(name, 'task.toml has no [task] name', 'add name = "…" under [task]');
  } else {
    infos.push(scope(name) + ' | declared name: ' + toml.task.name);
    if (task) {
      var expected = 'terminal-bench-science/' + base(task);
      if (String(toml.task.name) !== expected) {
        finding(name, 'T1.task-name-mismatch',
          '[task] name is "' + toml.task.name + '" but the folder implies "' + expected + '"');
      }
    }
  }

  REQUIRED_DIRS.forEach(function (dir) {
    var prefix = at(task, dir);
    if (!pkg.isDir(prefix)) {
      missingHard(name, dir + '/ missing', 'add the ' + dir + '/ folder');
      return;
    }
    var content = pkg.under(prefix).filter(function (p) {
      return notCache(rel(task, p)) && pkg.size(p) > 0;
    });
    if (!content.length) {
      missingHard(name, dir + '/ holds no content', 'populate ' + dir + '/ with the real files');
    }
  });

  // Both are required files, and both stop a run dead: without instruction.md the agent is
  // given no task, and without environment/Dockerfile the agent image cannot be built. They
  // were warnings when nothing downstream depended on this gate; as a pre-oracle gate they
  // have to block, or the run is paid for and fails on a missing file.
  if (!pkg.isFile(at(task, 'instruction.md')) || !pkg.size(at(task, 'instruction.md'))) {
    missingHard(name, 'instruction.md missing or empty, so the agent receives no task',
      'add the task instruction the agent receives');
  }
  if (!pkg.isFile(at(task, 'environment/Dockerfile'))) {
    missingHard(name, 'environment/Dockerfile missing, so the agent image cannot be built and every run fails',
      'add the agent environment image definition');
  }
}

// D -- the grader and oracle entry points, plus any separately built verifier image.
function checkGraderSpec(task, pkg, toml) {
  var name = labelOf(task, pkg);

  if (!pkg.isFile(at(task, VERIFIER_ENTRY)) || !pkg.size(at(task, VERIFIER_ENTRY))) {
    missingHard(name, VERIFIER_ENTRY + ' missing or empty', 'add the verifier entry point so the task can be scored');
  }
  if (!pkg.isFile(at(task, ORACLE_ENTRY)) || !pkg.size(at(task, ORACLE_ENTRY))) {
    missingHard(name, ORACLE_ENTRY + ' missing or empty', 'add the reference-solution entry point');
  }

  // [verifier] environment_mode = "separate" means the verifier runs in its own image, which
  // must therefore be in the package.
  var verifier = objectAt(toml && toml.verifier);
  if (String(verifier.environment_mode || '') === 'separate' && !pkg.isFile(at(task, 'tests/Dockerfile'))) {
    missingHard(
      name,
      'task.toml declares [verifier] environment_mode = "separate" but tests/Dockerfile is missing',
      'add tests/Dockerfile so the verifier image can be built'
    );
  }
}

// I -- a module shipped to both tests/ and solution/ is one module; drift between the copies
// means the oracle and the grader no longer share their arithmetic. (817 checks this against
// environment/_app; this package's duplication is kitf.py.) Compared at every depth, because
// a shared helper moved into tests/lib/ and solution/lib/ drifts exactly as easily.
function checkModuleDrift(task, pkg) {
  var name = labelOf(task, pkg);
  var inTests = {};
  pkg.under(at(task, 'tests')).forEach(function (path) {
    var relative = rel(at(task, 'tests'), path);
    if (notCache(relative)) inTests[relative] = path;
  });

  var drifted = [];
  pkg.under(at(task, 'solution')).forEach(function (path) {
    var relative = rel(at(task, 'solution'), path);
    if (!notCache(relative)) return;
    if (!inTests[relative]) return;
    if (!sameContent(pkg.get(inTests[relative]), pkg.get(path))) drifted.push(relative);
  });

  if (drifted.length) {
    hard(
      name,
      'module(s) shipped to both tests/ and solution/ have drifted apart: ' + listed(drifted.sort()),
      're-copy the module so tests/ and solution/ hold byte-identical files'
    );
  }
}

// V -- artifacts are how the agent's output reaches the verifier. An undeclared list means no
// output is transferred at all and every run, oracle included, scores 0.
// L -- and an artifact that ALREADY exists in the package is expected output shipped by
// mistake; under environment/ the agent can simply read its own answer.
function checkArtifacts(task, pkg, toml) {
  var name = labelOf(task, pkg);
  if (toml === null) return; // C already reported it

  var declared = isArray(toml.artifacts) ? toml.artifacts : null;

  if (!declared || !declared.length) {
    if (isArray(objectAt(toml.verifier).artifacts)) {
      hard(name,
        'artifacts is declared under [verifier] instead of at the top level of task.toml, so no agent output is transferred and every run scores 0',
        'move the artifacts = [...] list to the top level of task.toml');
    } else {
      missingHard(name,
        'task.toml declares no artifacts, so no agent output reaches the verifier and every run -- the oracle included -- scores 0',
        'add artifacts = [...] at the top level of task.toml, listing every absolute path the verifier reads');
    }
    return;
  }

  var relativeEntries = declared.filter(function (p) {
    return typeof p !== 'string' || p.charAt(0) !== '/';
  });
  if (relativeEntries.length) {
    hard(name, 'artifacts entries must be absolute container paths: ' + listed(relativeEntries.map(String)),
      'write each artifact as an absolute path, e.g. /root/results/out.csv');
  }

  var artifactNames = {};
  declared.forEach(function (p) {
    if (typeof p === 'string' && p) artifactNames[base(p)] = true;
  });

  // Only environment/ matters. Harbor builds that tree into the AGENT's image, so a file
  // there carrying a declared artifact's name hands the agent the output it is supposed to
  // produce. Nowhere else can leak: solution/ is mounted only into the oracle container,
  // tests/ only into the verifier image, and authoring/ and the task root are never mounted
  // at all. An oracle that writes /app/response.py is naturally implemented in
  // solution/response.py, so flagging that reports the normal case as a defect.
  var leaked = [];
  pkg.under(at(task, 'environment')).forEach(function (path) {
    var relative = rel(task, path);
    if (notCache(relative) && artifactNames[base(relative)]) leaked.push(relative);
  });

  if (leaked.length) {
    hard(name,
      'file(s) under environment/ carry declared artifact names, so the agent can read the output it is supposed to produce: ' + listed(leaked.sort()),
      'delete the pre-computed output from environment/; the agent must generate these files itself');
  }
}

// L -- what the agent's tree may contain. Three independent ways grader material leaks into it.
function checkLeakage(task, pkg) {
  var name = labelOf(task, pkg);

  // The agent image must not be built out of grader or solution material.
  var dockerfile = at(task, 'environment/Dockerfile');
  if (pkg.isFile(dockerfile)) {
    var forbidden = copySources(fileText(pkg, dockerfile)).filter(function (src) {
      return /^(\.\.|\/|solution(\/|$)|tests(\/|$))/.test(src);
    });
    if (forbidden.length) {
      hard(name, 'environment/Dockerfile copies material the agent must not see: ' + listed(forbidden),
        'copy only paths inside environment/ into the agent image');
    }
  }

  // A data file present in both trees under one name must hold one content, or the agent is
  // fitting one dataset while the verifier marks against another.
  var environmentData = {};
  pkg.under(at(task, 'environment')).forEach(function (path) {
    if (dataLike(base(path))) environmentData[base(path)] = path;
  });
  var mismatched = [];
  pkg.under(at(task, 'tests')).forEach(function (path) {
    var leaf = base(path);
    if (!dataLike(leaf) || !environmentData[leaf]) return;
    if (!sameContent(pkg.get(environmentData[leaf]), pkg.get(path))) mismatched.push(leaf);
  });
  if (mismatched.length) {
    hard(name,
      'data file(s) shipped to both environment/ and tests/ hold different content: ' + listed(mismatched.sort()),
      're-copy the file so both trees ship identical data, or rename one side if the two are genuinely meant to differ');
  }

  // Grader truth that ended up on the agent's side usually still carries its name. A name
  // alone is a heuristic -- an ML task may legitimately ship labels.csv as agent input -- so
  // it only advises. But an answer-shaped name that ALSO exists under tests/ is grader-only
  // data present on both sides of the boundary, which is never legitimate.
  var graderNames = {};
  pkg.under(at(task, 'tests')).forEach(function (path) { graderNames[base(path)] = true; });

  var certain = [];
  var suspected = [];
  pkg.under(at(task, 'environment')).forEach(function (path) {
    var leaf = base(path);
    if (!ANSWERISH.test(leaf)) return;
    (graderNames[leaf] ? certain : suspected).push(rel(task, path));
  });

  if (certain.length) {
    hard(name,
      'grader-only file(s) are present in the agent\'s tree as well as under tests/: ' + listed(certain.sort()),
      'delete them from environment/; data the verifier holds back must never ship to the agent');
  }
  if (suspected.length) {
    finding(name, 'T1.answer-shaped-input',
      'file(s) under environment/ are named like grader truth: ' + listed(suspected.sort()));
  }
}

// R -- the commonest failure of a hand-assembled folder is a file nobody dragged in. Both
// entry points name the files they run, so the references can be resolved against the package.
function checkEntryReferences(task, pkg) {
  var name = labelOf(task, pkg);

  [[ORACLE_ENTRY, 'solution'], [VERIFIER_ENTRY, 'tests']].forEach(function (pair) {
    var entry = at(task, pair[0]);
    var dir = pair[1];
    if (!pkg.isFile(entry)) return;

    var text = fileText(pkg, entry);
    if (!text) return;

    var pattern = new RegExp('/' + dir + '/([A-Za-z0-9._][A-Za-z0-9._/-]*)', 'g');
    var seen = {};
    var absent = [];
    var match;
    while ((match = pattern.exec(text)) !== null) {
      var target = match[1].replace(/[.,;:)\]'"]+$/, '');
      if (!target || seen[target]) continue;
      seen[target] = true;
      if (!pkg.has(at(at(task, dir), target))) absent.push('/' + dir + '/' + target);
    }
    if (absent.length) {
      missingHard(name, pair[0] + ' runs file(s) that are not in the package: ' + listed(absent.sort()),
        'upload the missing file(s), or correct the path inside ' + pair[0]);
    }
  });
}

// R -- a COPY whose source is not in the package fails the image build, so the run never starts.
function checkBuildInputs(task, pkg) {
  var name = labelOf(task, pkg);

  [['environment', 'environment/Dockerfile'], ['tests', 'tests/Dockerfile']].forEach(function (pair) {
    var context = pair[0];
    var dockerfile = at(task, pair[1]);
    if (!pkg.isFile(dockerfile)) return;

    var absent = [];
    copySources(fileText(pkg, dockerfile)).forEach(function (src) {
      if (!src || src.indexOf('*') !== -1 || src.indexOf('?') !== -1) return; // globs: not resolvable here
      if (src.charAt(0) === '/' || src.indexOf('..') === 0) return;           // reported by checkLeakage
      var clean = src.replace(/^\.\//, '').replace(/\/+$/, '');
      if (!clean || clean === '.') return;
      if (!pkg.has(at(at(task, context), clean))) absent.push(pair[1] + ': ' + src);
    });
    if (absent.length) {
      missingHard(name, 'Dockerfile copies path(s) that are not in the package: ' + listed(absent.sort()),
        'upload the missing path, or correct the COPY line');
    }
  });
}

// V -- the verifier image has to build, hold its own dependencies, and end by writing a verdict.
function checkVerifierContract(task, pkg, toml) {
  var name = labelOf(task, pkg);

  var mode = String(objectAt(objectAt(toml).verifier).environment_mode || '');
  if (toml !== null && mode !== 'separate') {
    finding(name, 'T1.verifier-mode',
      'task.toml does not declare [verifier] environment_mode = "separate"' + (mode ? ' (found "' + mode + '")' : ''));
  }

  var dockerfile = at(task, 'tests/Dockerfile');
  if (pkg.isFile(dockerfile)) {
    var image = fileText(pkg, dockerfile);

    if (!/^\s*COPY\s+(--\S+\s+)*\.\s+\/tests\/?\s*$/im.test(image)) {
      hard(name, 'tests/Dockerfile does not COPY . /tests/, so the test files never reach the verifier image',
        'add COPY . /tests/ to tests/Dockerfile');
    }

    var created = madeDirectories(image);
    var needed = { '/logs/verifier': true };
    (isArray(objectAt(toml).artifacts) ? toml.artifacts : []).forEach(function (p) {
      if (typeof p !== 'string' || p.charAt(0) !== '/') return;
      var cut = p.lastIndexOf('/');
      if (cut > 0) needed[p.slice(0, cut)] = true;
    });
    var uncreated = Object.keys(needed).filter(function (dir) { return !covered(created, dir); });
    if (uncreated.length) {
      finding(name, 'T1.artifact-dirs-uncreated',
        'tests/Dockerfile does not mkdir -p ' + listed(uncreated.sort()));
    }

    PYTEST_PINS.forEach(function (pin) {
      if (image.indexOf(pin) === -1) {
        finding(name, 'T1.pytest-pin', 'tests/Dockerfile does not pin ' + pin);
      }
    });
  }

  ['environment/Dockerfile', 'tests/Dockerfile'].forEach(function (relativePath) {
    var path = at(task, relativePath);
    if (!pkg.isFile(path)) return;
    var loose = unpinnedInstalls(fileText(pkg, path));
    if (loose.length) {
      finding(name, 'T1.unpinned-install',
        relativePath + ' installs unpinned package(s): ' + listed(loose.sort()));
    }
  });

  var entry = at(task, VERIFIER_ENTRY);
  if (pkg.isFile(entry)) {
    var script = fileText(pkg, entry);
    var installs = [];
    if (/\b(pip3?|uv\s+pip)\s+install\b/.test(script)) installs.push('pip install');
    if (/\bapt(-get)?\s+install\b/.test(script)) installs.push('apt-get install');
    if (/\bcurl\b[^\n]*\|\s*(ba)?sh\b/.test(script)) installs.push('curl | sh');
    if (installs.length) {
      hard(name,
        VERIFIER_ENTRY + ' installs dependencies at trial time (' + listed(installs) + ') but the verifier runs with no network',
        'bake every verifier dependency into tests/Dockerfile instead');
    }
  }

  // Something under tests/ has to write the reward, or the run produces no verdict at all.
  // Checked across the whole tree because a task may write it from Python rather than test.sh.
  if (pkg.isDir(at(task, 'tests'))) {
    var rewardText = null;
    pkg.under(at(task, 'tests')).forEach(function (path) {
      var text = fileText(pkg, path);
      if (text && /reward\.(txt|json)/.test(text)) rewardText = rewardText === null ? text : rewardText + '\n' + text;
    });
    if (rewardText === null) {
      missingFinding(name, 'T1.reward-unwritten',
        'nothing under tests/ mentions reward.txt or reward.json, so the run may finish without a verdict');
    } else if (/(echo|write|print)[^\n]*\b0?\.\d+[^\n]*reward\.(txt|json)/.test(rewardText)) {
      finding(name, 'T1.reward-fractional',
        'a fractional value appears to be written to the reward file; Harbor scores a pass only at reward >= 1.0');
    }
  }
}

// X -- the instruction, the declared budget and the declared artifacts have to agree. A
// verifier that reads a file the instruction never asked for grades work nobody requested.
function checkInstruction(task, pkg, toml) {
  var name = labelOf(task, pkg);
  var path = at(task, 'instruction.md');
  if (!pkg.isFile(path)) return; // checkStructure already reported it

  var text = fileText(pkg, path);
  if (!text) return;

  var tail = text.match(INSTRUCTION_TAIL);
  if (!tail) {
    finding(name, 'T1.instruction-suffix', 'instruction.md does not carry the required timeout and anti-cheat sentence');
  } else {
    var declared = objectAt(objectAt(toml).agent).timeout_sec;
    if (typeof declared === 'number' && Number(tail[1]) !== declared) {
      hard(name,
        'instruction.md tells the agent it has ' + tail[1] + ' seconds but task.toml sets agent.timeout_sec = ' + declared,
        'make the two numbers match');
    }
  }

  var unmentioned = (isArray(objectAt(toml).artifacts) ? toml.artifacts : []).filter(function (p) {
    return typeof p === 'string' && p && text.indexOf(p) === -1;
  });
  if (unmentioned.length) {
    hard(name,
      'artifact(s) the verifier reads are never named in instruction.md: ' + listed(unmentioned),
      'name every declared artifact in the instruction, or remove it from the artifacts list');
  }
}

// P -- README.md is the task's published card and carries the three prose sections.
function checkReadme(task, pkg) {
  var name = labelOf(task, pkg);
  var path = at(task, 'README.md');

  if (!pkg.isFile(path) || !pkg.size(path)) {
    missingFinding(name, 'T1.readme-missing', 'README.md is missing or empty');
    return;
  }

  var text = fileText(pkg, path);
  var thin = [];
  ['Difficulty', 'Reference solution', 'Verification'].forEach(function (heading) {
    var match = text.match(new RegExp('^##\\s+' + heading + '\\s*$', 'im'));
    if (!match) { thin.push(heading + ' (missing)'); return; }
    var after = text.slice(match.index + match[0].length);
    var next = after.search(/^##\s+/m);
    var body = (next === -1 ? after : after.slice(0, next)).replace(/<!--[\s\S]*?-->/g, '');
    if (!trim(body)) thin.push(heading + ' (empty)');
  });
  if (thin.length) {
    finding(name, 'T1.readme-sections', 'README.md sections incomplete: ' + listed(thin));
  }
}

// P -- one canary GUID across the package. More than one means files were pasted in from
// another task, which is worth blocking on its own.
function checkCanary(task, pkg) {
  var name = labelOf(task, pkg);
  var guids = {};
  var absent = [];

  pkg.under(task).forEach(function (path) {
    var relative = rel(task, path);
    if (!notCache(relative) || !canaryApplies(relative)) return;
    var text = fileText(pkg, path);
    if (!text) return;
    var head = text.split(/\r?\n/).slice(0, 3).join('\n');
    var match = head.match(CANARY);
    if (match) guids[match[1].toLowerCase()] = true;
    else absent.push(relative);
  });

  var distinct = Object.keys(guids);
  if (distinct.length > 1) {
    hard(name,
      'the package carries more than one canary GUID (' + listed(distinct) + '), so files came from different task packages',
      'regenerate the package so every file carries the same canary GUID');
  }
  if (absent.length) {
    finding(name, 'T1.canary-missing',
      absent.length + ' text file(s) carry no canary string: ' + listed(absent.sort()));
  }
}

// P -- a checksum manifest that lists a file nobody uploaded means the data was regenerated
// or renamed after the manifest was written. Digests themselves need a hash the sandbox does
// not expose, so only the file list is reconciled here.
function checkChecksums(task, pkg) {
  var name = labelOf(task, pkg);

  pkg.under(task).forEach(function (path) {
    if (base(path) !== 'SHA256SUMS') return;
    var text = fileText(pkg, path);
    if (!text) return;
    var directory = path.slice(0, path.lastIndexOf('/'));
    var orphans = [];
    text.split(/\r?\n/).forEach(function (line) {
      var entry = line.match(/^[0-9a-fA-F]{64}\s+\*?(.+)$/);
      if (!entry) return;
      var listedFile = trim(entry[1]);
      if (!listedFile) return;
      if (!pkg.has(at(directory, listedFile))) orphans.push(listedFile);
    });
    if (orphans.length) {
      missingFinding(name, 'T1.checksum-orphan',
        rel(task, path) + ' lists file(s) that are not in the package: ' + listed(orphans.sort()));
    }
  });
}

// P -- working material that should have been left behind.
function checkJunk(task, pkg) {
  var name = labelOf(task, pkg);
  var found = {};

  pkg.paths.forEach(function (path) {
    if (!under(path, task) && path !== task) return;
    var relative = rel(task, path);
    relative.split('/').forEach(function (segment) {
      if (isJunk(segment)) found[segment] = true;
    });
    if (!notCache(relative)) found['python cache files'] = true;
  });

  var names = Object.keys(found);
  if (names.length) {
    finding(name, 'T1.junk-shipped', 'the package ships working material: ' + listed(names.sort()));
  }
}

// task.toml's [metadata] block and the explicit network-mode declarations: both are package
// quality rather than structure, so they follow the profile.
function checkTaskMetadata(task, pkg, toml) {
  var name = labelOf(task, pkg);
  if (toml === null) return; // C already reported it

  var metadata = objectAt(toml && toml.metadata);
  var required = ['domain', 'field', 'subfield', 'expert_time_estimate_hours'];
  var absent = required.filter(function (key) { return blank(metadata[key]); });
  if (absent.length) {
    missingFinding(name, 'T0.metadata-missing', 'task.toml [metadata] is missing ' + listed(absent));
  }

  // A key that is present but not from the benchmark's vocabulary routes the task nowhere.
  var domain = String(metadata.domain || '');
  var field = String(metadata.field || '');
  if (domain && !DOMAIN_FIELDS[domain]) {
    finding(name, 'T1.metadata-vocabulary',
      'domain "' + domain + '" is not one of ' + listed(Object.keys(DOMAIN_FIELDS)));
  } else if (domain && field && DOMAIN_FIELDS[domain].indexOf(field) === -1) {
    finding(name, 'T1.metadata-vocabulary',
      'field "' + field + '" is not a field of ' + domain + ' (' + listed(DOMAIN_FIELDS[domain]) + ')');
  }

  // Authorship and disclosure fields (author_name, author_email, author_organization,
  // relevant_experience, conflicts_of_interest) are deliberately NOT checked here. They are
  // reviewer-facing paperwork rather than anything that decides whether the package runs, and
  // they are enforced upstream at PR time.

  var taskBlock = objectAt(toml.task);
  var incomplete = ['description', 'authors', 'keywords'].filter(function (key) { return blank(taskBlock[key]); });
  if (incomplete.length) {
    missingFinding(name, 'T1.task-block-incomplete', 'task.toml [task] is missing ' + listed(incomplete));
  }

  var retired = RETIRED_TOML_FIELDS.filter(function (key) { return !blank(metadata[key]) || !blank(toml[key]); });
  if (retired.length) {
    finding(name, 'T1.retired-fields', 'task.toml still carries ' + listed(retired) + ', which moved into README.md');
  }

  var environment = objectAt(toml.environment);
  var verifierEnvironment = objectAt(objectAt(toml.verifier).environment);

  var undeclared = [];
  if (!verifierEnvironment.network_mode) undeclared.push('[verifier.environment]');
  if (!environment.network_mode) undeclared.push('[environment]');
  if (undeclared.length) {
    missingFinding(name, 'T0.network-mode-undeclared', 'network_mode is not declared in ' + listed(undeclared));
  }

  // Egress on the verifier phase is an integrity break, not a style gap: the submission can
  // phone out and the verifier can reach a hosted answer key. An agent phase that is merely
  // more restrictive than "public" only risks a dependency install, so that one advises.
  if (String(verifierEnvironment.network_mode || '') === 'public') {
    hard(name,
      '[verifier.environment] network_mode = "public", so the verifier grades agent code with network access',
      'set it to "no-network", or to "allowlist" with allowed_hosts if one host is genuinely needed');
  }
  if (environment.network_mode && String(environment.network_mode) !== 'public') {
    finding(name, 'T1.network-mode-value',
      '[environment] network_mode = "' + environment.network_mode + '" (agents normally need egress to install dependencies)');
  }

  var timeout = objectAt(toml.agent).timeout_sec;
  if (typeof timeout === 'number' && timeout > AGENT_TIMEOUT_CAP) {
    finding(name, 'T1.agent-timeout',
      '[agent] timeout_sec is ' + timeout + ', above the ' + AGENT_TIMEOUT_CAP + '-second authoring cap');
  }

  if (Number(environment.gpus) >= 1 && String(environment.validate_env || '') !== 'modal') {
    finding(name, 'T1.gpu-backend', 'the task requests a GPU but [environment] validate_env is not "modal"');
  }
}

// ------------------------------------------------------------------ dockerfile and shell helpers

// Physical lines with backslash continuations folded in, so a wrapped COPY or RUN reads as one.
function sourceLines(text) {
  return String(text).replace(/\\\r?\n/g, ' ').split(/\r?\n/);
}

// Every build-context path a Dockerfile copies in. --from= stages reference another image
// rather than the context, so they are not package paths and are skipped.
function copySources(text) {
  var sources = [];
  sourceLines(text).forEach(function (line) {
    var instruction = line.match(/^\s*(COPY|ADD)\s+(.*)$/i);
    if (!instruction) return;
    var rest = instruction[2];
    if (/--from=/i.test(rest)) return;
    rest = trim(rest.replace(/--[A-Za-z][A-Za-z-]*(=\S+)?/g, ' '));
    if (!rest) return;

    var parts;
    if (rest.charAt(0) === '[') {
      var close = rest.lastIndexOf(']');
      parts = rest.slice(1, close === -1 ? rest.length : close).split(',').map(function (part) {
        return trim(part).replace(/^["']|["']$/g, '');
      });
    } else {
      parts = rest.split(/\s+/).map(function (part) {
        return part.replace(/^["']|["']$/g, '');
      });
    }
    parts = parts.filter(function (part) { return part; });
    if (parts.length < 2) return;
    parts.slice(0, parts.length - 1).forEach(function (src) { sources.push(src); });
  });
  return sources;
}

// Absolute directories a Dockerfile creates with mkdir.
function madeDirectories(text) {
  var made = {};
  sourceLines(text).forEach(function (line) {
    var call = line.match(/mkdir\s+((?:-\S+\s+)*)(.+)$/i);
    if (!call) return;
    call[2].split(/[\s&;|]+/).forEach(function (token) {
      var clean = trim(token).replace(/["']/g, '').replace(/\/+$/, '');
      if (clean.charAt(0) === '/') made[clean] = true;
    });
  });
  return made;
}

function covered(made, directory) {
  for (var key in made) {
    if (!Object.prototype.hasOwnProperty.call(made, key)) continue;
    if (key === directory || directory.indexOf(key + '/') === 0) return true;
  }
  return false;
}

// pip installs with no == pin. Flags, requirement files and local paths are not packages.
function unpinnedInstalls(text) {
  var loose = [];
  sourceLines(text).forEach(function (line) {
    if (!/\b(pip3?|uv\s+pip)\s+install\b/.test(line)) return;
    var after = line.slice(line.search(/\binstall\b/) + 'install'.length);
    after.split(/\s+/).forEach(function (token) {
      var clean = trim(token).replace(/["'\\]/g, '');
      if (!clean || clean.charAt(0) === '-' || clean.charAt(0) === '.' || clean.charAt(0) === '/') return;
      if (clean === '&&' || clean === '\\' || clean.indexOf('$') === 0) return;
      if (/[=<>~!@]/.test(clean)) return;      // pinned, ranged, or a direct URL reference
      if (/\.txt$/.test(clean)) return;         // a requirements file
      loose.push(clean);
    });
  });
  return loose;
}

// ------------------------------------------------------------------ package helpers

// Task roots hold task.toml. "" is the linked folder itself, which is the usual layout here.
// A root inside another package's environment/ is a build-time mirror, not a separate package.
function discover(pkg) {
  var candidates = pkg.paths
    .filter(function (p) { return p === 'task.toml' || endsWith(p, '/task.toml'); })
    .map(function (p) { return p === 'task.toml' ? '' : p.slice(0, p.length - '/task.toml'.length); })
    .sort(function (a, b) {
      return depth(a) - depth(b) || (a < b ? -1 : a > b ? 1 : 0);
    });

  var roots = [];
  var nested = [];
  candidates.forEach(function (candidate) {
    var parent = null;
    for (var i = 0; i < roots.length; i++) {
      if (under(candidate, roots[i])) { parent = roots[i]; break; }
    }
    if (parent === null) roots.push(candidate);
    else if (!under(candidate, at(parent, 'environment'))) nested.push(candidate);
  });
  return { roots: roots, nested: nested };
}

// TOML subset reader: tables, quoted/bare scalars, single- and multi-line arrays, and triple-
// quoted strings -- enough for [task] name, [metadata] and the network_mode declarations.
// Returns null on a syntax error.
function parseToml(text) {
  if (typeof text !== 'string') return null;
  var out = {};
  var table = out;
  var lines = text.split(/\r?\n/);

  for (var i = 0; i < lines.length; i++) {
    var line = trim(lines[i]);
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
    var key = trim(line.slice(0, eq)).replace(/^["']|["']$/g, '');
    var value = trim(line.slice(eq + 1));
    if (!key) return null;

    // Triple-quoted string: consume until the closing delimiter.
    var triple = value.slice(0, 3);
    if (triple === '"""' || triple === "'''") {
      var body = value.slice(3);
      while (body.indexOf(triple) === -1 && ++i < lines.length) body += '\n' + lines[i];
      table[key] = body.slice(0, body.indexOf(triple) === -1 ? body.length : body.indexOf(triple));
      continue;
    }
    // Multi-line array or inline table: consume until the brackets balance.
    if ((value.charAt(0) === '[' || value.charAt(0) === '{') && !balanced(value)) {
      while (++i < lines.length) {
        value += ' ' + trim(lines[i]);
        if (balanced(value)) break;
      }
    }
    table[key] = tomlValue(stripComment(value));
  }
  return out;
}

function balanced(text) {
  var square = 0;
  var curly = 0;
  var quote = null;
  for (var i = 0; i < text.length; i++) {
    var c = text.charAt(i);
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '[') square++;
    else if (c === ']') square--;
    else if (c === '{') curly++;
    else if (c === '}') curly--;
  }
  return square <= 0 && curly <= 0;
}

// Strip a trailing comment, but not a '#' inside a quoted string.
function stripComment(value) {
  var quote = null;
  for (var i = 0; i < value.length; i++) {
    var c = value.charAt(i);
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '#') return trim(value.slice(0, i));
  }
  return value;
}

function tableAt(root, parts) {
  var node = root;
  for (var i = 0; i < parts.length; i++) {
    var part = trim(parts[i]).replace(/^["']|["']$/g, '');
    if (!part) return null;
    if (!node[part] || typeof node[part] !== 'object') node[part] = {};
    node = node[part];
  }
  return node;
}

function tomlValue(value) {
  if (value.charAt(0) === '[') {
    var inner = value.slice(1, value.lastIndexOf(']'));
    if (!trim(inner)) return [];
    return splitTop(inner).map(function (item) { return tomlValue(trim(item)); })
      .filter(function (item) { return item !== ''; });
  }
  if (value.charAt(0) === '{') {
    var table = {};
    splitTop(value.slice(1, value.lastIndexOf('}'))).forEach(function (pair) {
      var eq = pair.indexOf('=');
      if (eq === -1) return;
      table[trim(pair.slice(0, eq)).replace(/^["']|["']$/g, '')] = tomlValue(trim(pair.slice(eq + 1)));
    });
    return table;
  }
  if (/^["']/.test(value)) return value.replace(/^["']|["']$/g, '');
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(value)) return Number(value);
  return value;
}

// Split on commas that are not inside quotes, brackets or braces.
function splitTop(text) {
  var parts = [];
  var buffer = '';
  var square = 0;
  var curly = 0;
  var quote = null;
  for (var i = 0; i < text.length; i++) {
    var c = text.charAt(i);
    if (quote) { buffer += c; if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; buffer += c; continue; }
    if (c === '[') square++;
    if (c === ']') square--;
    if (c === '{') curly++;
    if (c === '}') curly--;
    if (c === ',' && !square && !curly) { parts.push(buffer); buffer = ''; continue; }
    buffer += c;
  }
  if (trim(buffer)) parts.push(buffer);
  return parts;
}

// ------------------------------------------------------------------ package index

// Paths are relative to the linked folder, so "" is the root directory.
function index(files, sizes) {
  var paths = [];
  for (var key in files) {
    if (Object.prototype.hasOwnProperty.call(files, key)) paths.push(key);
  }
  paths.sort();

  var dirs = {};
  var kids = {};
  paths.forEach(function (path) {
    var parts = path.split('/');
    for (var i = 0; i < parts.length; i++) {
      var dir = parts.slice(0, i).join('/');
      dirs[dir] = true;
      if (!kids[dir]) kids[dir] = {};
      kids[dir][parts[i]] = true;
    }
  });

  return {
    paths: paths,
    get: function (path) { return files[path]; },
    isFile: function (path) { return Object.prototype.hasOwnProperty.call(files, path); },
    isDir: function (path) { return !!dirs[path]; },
    has: function (path) { return !!dirs[path] || Object.prototype.hasOwnProperty.call(files, path); },
    size: function (path) {
      if (typeof sizes[path] === 'number') return sizes[path];
      var value = files[path];
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
  return 'Task Package ' + name + ' — "task"';
}

// Structural breaks: always blocking, in every profile.
function hard(name, message, fix) {
  errors.push(scope(name) + ' | Problem: ' + message + '. | Fix: ' + fix + '.');
}

// Package-quality gaps: advisory at upload, blocking under audit/delivery.
function finding(name, code, message) {
  var rendered = scope(name) + ' | Problem: ' + code + ': ' + message + '. | Fix: ' +
    (FIXES[code] || 'report this task to your lead.');
  if (PROFILE === AUDIT || PROFILE === DELIVERY) errors.push(rendered);
  else warnings.push('ADVISORY ' + rendered);
}

// Absence-based variants: a partial read cannot prove a file is missing.
function missingHard(name, message, fix) {
  if (PARTIAL) { standDown++; return; }
  hard(name, message, fix);
}

function missingFinding(name, code, message) {
  if (PARTIAL) { standDown++; return; }
  finding(name, code, message);
}

// Every entry name, packed a few per line so the 100-entry / 1000-char log limits hold.
function logFiles(paths) {
  logs.push('Folder contents (' + paths.length + ' files):');
  var line = '';
  for (var i = 0; i < paths.length; i++) {
    var next = line ? line + ' | ' + paths[i] : paths[i];
    if (next.length > 900) { logs.push(line); line = paths[i]; } else { line = next; }
  }
  if (line) logs.push(line);
}

function describeMeta(meta) {
  var parts = ['fileCount ' + (meta.fileCount === undefined ? '?' : meta.fileCount)];
  if (meta.totalBytes !== undefined) parts.push(meta.totalBytes + ' bytes');
  if (meta.truncated === true) parts.push('truncated');
  if (isArray(meta.skipped) && meta.skipped.length) parts.push(meta.skipped.length + ' skipped');
  return parts.join(', ');
}

function describeSkipped(entry) {
  var item = objectAt(entry);
  return String(item.path || '?') + ' (' + String(item.reason || 'unreadable') + ')';
}

// Which reader budget stopped the walk. The reasons come from the fetch layer
// (folder-loader.ts / drive-fetcher.ts) and carry the live limit values, so a finding quotes
// the deployment's real numbers rather than a copy of them that goes stale the next time ops
// retunes a cap.
function truncationCause(meta) {
  var reasons = (isArray(meta.skipped) ? meta.skipped : [])
    .map(function (entry) { return String(objectAt(entry).reason || ''); });
  var firstMatching = function (pattern) {
    for (var i = 0; i < reasons.length; i++) {
      if (pattern.test(reasons[i])) return reasons[i];
    }
    return null;
  };

  var hit = firstMatching(/maximum of \d+ files per folder/);
  if (hit) {
    return {
      what: 'it holds more files than the reader will walk',
      fix: 'check the folder for material that should not ship with the task -- a committed ' +
        '__pycache__, .ipynb_checkpoints, .git or virtualenv, or a parent folder linked by ' +
        'mistake instead of the task folder itself. If every file genuinely belongs to the ' +
        'task, report this to your lead: the reader\'s file-count budget has to be raised, ' +
        'not the package cut.',
      evidence: hit
    };
  }

  hit = firstMatching(/folder byte budget of \d+/);
  if (hit) {
    return {
      what: 'it is larger than the reader\'s byte budget',
      fix: 'report this task to your lead -- the reader\'s byte budget has to be raised. Do not ' +
        'trim a compliant package to fit it: data files up to ~100MB legitimately ship with a task.',
      evidence: hit
    };
  }

  hit = firstMatching(/deadline reached/);
  if (hit) {
    return {
      what: 'the read ran out of time',
      fix: 're-run the checks once -- that budget is wall-clock, so a slower-than-usual Drive ' +
        'response can cause it and a retry often succeeds. If it repeats, report it to your lead.',
      evidence: hit
    };
  }

  hit = firstMatching(/maximum folder depth of \d+/);
  if (hit) {
    return {
      what: 'it is nested more deeply than the reader will walk',
      fix: 'flatten the deepest folders, or check you linked the task folder rather than a ' +
        'parent several levels above it.',
      evidence: hit
    };
  }

  return {
    what: 'the reader stopped early',
    fix: 're-run the checks once; if it repeats, report this task to your lead with this message.',
    evidence: reasons.length ? 'first reason: ' + reasons[0] : 'the reader reported no reason'
  };
}

// ------------------------------------------------------------------ small utilities

function profileOf(conversationData) {
  var ratings = ratingsOf(conversationData);
  var value = isArray(ratings) ? valueByKey(ratings, 'validationProfile') : ratings.validationProfile;
  value = typeof value === 'string' ? value : value && value.value;
  value = typeof value === 'string' ? value.toLowerCase() : '';
  return value === AUDIT || value === DELIVERY || value === UPLOAD ? value : PROFILE;
}

function taskLink(conversationData) {
  var ratings = ratingsOf(conversationData);
  var raw = isArray(ratings) ? valueByKey(ratings, 'task') : ratings.task;
  var link = typeof raw === 'string' ? raw : raw && typeof raw.value === 'string' ? raw.value : null;
  return link && trim(link) ? trim(link) : null;
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

// The label a finding is filed under: a subfolder package uses its folder name; the linked
// folder itself has no name in the read, so fall back to its declared task name.
function labelOf(root, pkg) {
  if (root) return base(root);
  var toml = parseToml(pkg.get('task.toml'));
  var declared = toml && toml.task && toml.task.name;
  return declared ? String(declared) : 'linked folder';
}

function sameContent(a, b) {
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  return stable(a) === stable(b);
}

// Key-order-independent serialisation, so two equal JSON artifacts compare equal.
function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value === undefined ? null : value);
  if (isArray(value)) return '[' + value.map(stable).join(',') + ']';
  return '{' + Object.keys(value).sort().map(function (key) {
    return JSON.stringify(key) + ':' + stable(value[key]);
  }).join(',') + '}';
}

function objectAt(value) {
  return value && typeof value === 'object' && !isArray(value) ? value : {};
}

// A non-string entry is a parsed JSON document or an unreadable binary; neither is text to scan.
function fileText(pkg, path) {
  var value = pkg.get(path);
  return typeof value === 'string' ? value : '';
}

function blank(value) {
  return value === undefined || value === null || value === '' || (isArray(value) && !value.length);
}

function dataLike(leaf) {
  var lower = leaf.toLowerCase();
  for (var i = 0; i < DATA_SUFFIXES.length; i++) {
    if (endsWith(lower, DATA_SUFFIXES[i])) return true;
  }
  return false;
}

// Only files that can carry a leading comment. A .csv or a .json cannot, so requiring a
// canary on them would report every data file in every package.
function canaryApplies(path) {
  var leaf = base(path);
  if (isJunk(leaf)) return false;
  if (CANARY_NAMES.indexOf(leaf) !== -1) return true;
  var lower = leaf.toLowerCase();
  for (var i = 0; i < CANARY_SUFFIXES.length; i++) {
    if (endsWith(lower, CANARY_SUFFIXES[i])) return true;
  }
  return false;
}

function isJunk(segment) {
  return JUNK_NAMES.indexOf(segment) !== -1;
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

// "" is the root: everything is under it.
function under(path, prefix) {
  return prefix === '' ? path !== '' : path.indexOf(prefix + '/') === 0;
}

function at(prefix, sub) {
  return prefix ? prefix + '/' + sub : sub;
}

function depth(path) {
  return path === '' ? 0 : path.split('/').length;
}

function base(path) {
  var parts = path.split('/');
  return parts[parts.length - 1];
}

function rel(prefix, path) {
  if (prefix === '') return path;
  return under(path, prefix) ? path.slice(prefix.length + 1) : path;
}

function endsWith(text, suffix) {
  return text.length >= suffix.length && text.slice(text.length - suffix.length) === suffix;
}

function trim(text) {
  return String(text).replace(/^\s+|\s+$/g, '');
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
