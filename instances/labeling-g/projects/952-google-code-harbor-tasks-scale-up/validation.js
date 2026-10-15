// Harbor task-package validation for labeling-g project 952
// (Google-CODE-Harbor-Tasks-Scale-Up).
//
// Runs at the oracleEvaluationComplete stage. The "task" field is a FormV2 Drive-folder value:
//   { googleDriveFolderLink, lastModifiedAt, renderFolderData: [<tree of the folder's root entries>] }
//
// Sources of truth, in order:
//   1. STRUCTURE comes from the FormV2 tree (renderFolderData) -- it is what the form submitted.
//   2. The live Drive folder is then read with fetchDriveData(link, { as: 'folder' }) and must be
//      in sync with that tree: same paths, same sizes. Any drift is an error.
//   3. Only once the two agree does Drive become the source of truth for every content check
//      (task.toml, Dockerfiles, entry points). If they disagree, content checks stand
//      down -- reading a folder that is not the one submitted would validate the wrong package.
//
// Check families (see requirements.md for the full table):
//   A  link, fetch and form <-> Drive sync
//   B  folder structure (Harbor parser layout) on the form tree
//   C  task.toml
//   D  entry points and Dockerfiles
//
// Not checked (by decision): test discovery, grader/agent leakage, and the oracle and model-run
// evaluation results.
//
// The checks in B-D mirror the Harbor ingest parser (parse_harbor_task_directory): its errors
// stay errors here and its warnings stay warnings.

// ------------------------------------------------------------------ configuration

// [task] name is "<prefix>/<Task Name>". A different suffix means a different task was linked
// (error); a different prefix is only advisory.
var TASK_NAME_PREFIX = 'thcast';

// Harbor parser: a single task asset over this size marks the task ERROR at ingest.
var MAX_TASK_FILE_BYTES = 60 * 1024 * 1024;

var ROOT_SINGLE_REQUIRED_DIRS = ['environment', 'tests', 'solution'];
var ROOT_SINGLE_REQUIRED_FILES = ['task.toml', 'instruction.md'];
var ROOT_MULTI_REQUIRED_DIRS = ['environment', 'steps'];
var ROOT_MULTI_REQUIRED_FILES = ['task.toml'];
var ROOT_OPTIONAL_DIRS_SINGLE = [];
var ROOT_OPTIONAL_DIRS_MULTI = ['tests', 'solution'];
var ROOT_OPTIONAL_FILES = ['README.md'];

// Names the Harbor parser reports as "may not be relevant" (is_ignored_name).
var JUNK_NAMES = ['.DS_Store', 'Thumbs.db', 'desktop.ini', '.git', '.ipynb_checkpoints',
  'node_modules', '.venv', 'venv', '.tox', '.idea', '.vscode', '__pycache__', '.pytest_cache',
  '.mypy_cache', '.ruff_cache', '__MACOSX'];
var JUNK_SUFFIXES = ['.pyc', '.pyo', '~', '.swp'];

var METADATA_KEYS = ['difficulty', 'category', 'family', 'subdomain', 'task_type', 'expert_time_estimate_hours'];
var ENVIRONMENT_KEYS = ['network_mode', 'cpus', 'memory_mb', 'storage_mb', 'build_timeout_sec'];

// ------------------------------------------------------------------ entry point

async function validate(conversationData) {
  var ratings = ratingsOf(conversationData);
  var input = inputMetadata(conversationData);

  // ---------------------------------------------------------------- A: the task field
  var taskField = valueOf(ratings.task);
  var link = taskFolderLink(taskField);
  if (!link) {
    errors.push(
      'Task Folder — "task" | Problem: the task field holds no Google Drive folder link. ' +
        '| Fix: open the task field, select the task folder in Drive, and submit again.'
    );
    return;
  }
  if (!/\/folders\/[A-Za-z0-9_-]+/.test(link)) {
    errors.push(
      'Task Folder — "task" | Problem: the task link is not a Drive folder link' +
        (/\/file\/d\/|[?&]id=/.test(link) ? ' -- it points at a single file' : '') +
        '. | Fix: link the task FOLDER (its URL contains /drive/folders/). | Why: got "' + link.slice(0, 160) + '".'
    );
    return;
  }

  var form = flattenForm(taskField && taskField.renderFolderData);
  if (!form.paths.length) {
    errors.push(
      'Task Folder — "task" | Problem: the form has no folder snapshot (renderFolderData is empty), so the ' +
        'submitted structure is unknown. | Fix: re-select the task folder in the task field so the form ' +
        'captures its contents, then submit again.'
    );
  } else {
    infos.push('Form snapshot: ' + form.paths.length + ' file(s) in the submitted task folder.');
  }

  var driveLinkMeta = input['Drive Link'];
  if (driveLinkMeta && driveId(driveLinkMeta) && driveId(driveLinkMeta) !== driveId(link)) {
    infos.push('Task metadata "Drive Link" (' + driveId(driveLinkMeta) + ') is not the submitted task folder (' +
      driveId(link) + '); the submitted folder is the one validated.');
  }

  // ---------------------------------------------------------------- B: structure (form is SOT)
  var formPkg = index(form.files, form.sizes, form.dirs);
  if (form.paths.length) checkStructure(formPkg, 'form');

  // ---------------------------------------------------------------- A: Drive read + sync
  var drive = await readDrive(link);
  var synced = false;
  if (drive && form.paths.length) synced = checkSync(form, drive);

  if (synced) {
    infos.push('Form snapshot and Drive folder are in sync (' + drive.pkg.paths.length +
      ' files); Drive is now the source of truth for content checks.');
    logFiles(drive.pkg.paths);
    var toml = checkTaskToml(drive.pkg, input);
    checkEntryPoints(drive.pkg, toml);
    checkDockerfiles(drive.pkg, toml);
  } else {
    infos.push('Content checks (task.toml, Dockerfiles, entry points) were NOT run because the ' +
      'Drive folder could not be confirmed to match the submitted form. Fix the sync error and re-run.');
  }

  if (!errors.length) {
    successes.push('Harbor task package passes all checks' +
      (synced ? ' (' + drive.pkg.paths.length + ' files, form and Drive in sync).' : '.'));
  }
}

// ------------------------------------------------------------------ A: Drive read

async function readDrive(link) {
  if (typeof fetchDriveData !== 'function') {
    errors.push(
      'Task Folder — "task" | Problem: this instance cannot read Drive folders (no fetchDriveData in the sandbox). ' +
        '| Fix: report this to your lead -- run-checks-api needs the build with fetchDriveData.'
    );
    return null;
  }
  var envelope;
  try {
    envelope = await fetchDriveData(link, { as: 'folder' });
  } catch (e) {
    errors.push(
      'Task Folder — "task" | Problem: the Drive folder could not be read, so it cannot be checked against the form. ' +
        '| Fix: share the folder with the automation account (Share settings) and re-run. | Why: ' + msgOf(e) + '.'
    );
    return null;
  }
  var meta = objectAt(envelope && envelope.meta);
  var files = objectAt(envelope && envelope.files);
  var sizes = objectAt(envelope && envelope.sizes);
  var pkg = index(files, sizes, null);

  if (!pkg.paths.length) {
    errors.push(
      'Task Folder — "task" | Problem: the linked Drive folder holds no readable files. ' +
        '| Fix: check the folder still exists, holds the task, and is shared with the automation account. ' +
        '| Why: ' + describeMeta(meta) + '.'
    );
    return null;
  }
  if (meta.truncated === true) {
    var cause = truncationCause(meta);
    errors.push(
      'Task Folder — "task" | Problem: the Drive folder could not be read in full (' + cause.what + '), so it ' +
        'cannot be confirmed to match the form. | Fix: ' + cause.fix + ' | Why: ' + describeMeta(meta) + '; ' + cause.evidence + '.'
    );
    return null;
  }
  return { pkg: pkg, meta: meta };
}

// A -- the form snapshot and the live folder must describe the same package.
function checkSync(form, drive) {
  var pkg = drive.pkg;
  var skippedReason = {};
  (isArray(drive.meta.skipped) ? drive.meta.skipped : []).forEach(function (entry) {
    var item = objectAt(entry);
    if (item.path) skippedReason[String(item.path)] = String(item.reason || 'unreadable');
  });

  var missingInDrive = [];
  var unreadable = [];
  var sizeDrift = [];
  form.paths.forEach(function (path) {
    if (!pkg.isFile(path)) {
      if (skippedReason[path]) unreadable.push(path + ' (' + skippedReason[path] + ')');
      else missingInDrive.push(path);
      return;
    }
    var declared = form.sizeText[path];
    if (declared && !sizeMatches(declared, pkg.size(path))) {
      sizeDrift.push(path + ' (form ' + declared + ', Drive ' + formatBytes(pkg.size(path)) + ')');
    }
  });
  var extraInDrive = pkg.paths.filter(function (path) { return !form.files.hasOwnProperty(path); });

  var fix = 'refresh the task field (re-select the Drive folder) so the form captures the folder as it is now, ' +
    'then re-run the checks';
  var ok = true;
  if (missingInDrive.length) {
    ok = false;
    errors.push('Form ↔ Drive sync — "task" | Problem: ' + missingInDrive.length + ' file(s) in the submitted form are ' +
      'no longer in the Drive folder: ' + listed(missingInDrive.sort()) + '. | Fix: ' + fix + '.');
  }
  if (extraInDrive.length) {
    ok = false;
    errors.push('Form ↔ Drive sync — "task" | Problem: ' + extraInDrive.length + ' file(s) in the Drive folder were ' +
      'not in the submitted form: ' + listed(extraInDrive.sort()) + '. | Fix: ' + fix + '.');
  }
  if (sizeDrift.length) {
    ok = false;
    errors.push('Form ↔ Drive sync — "task" | Problem: ' + sizeDrift.length + ' file(s) changed size since the form ' +
      'was submitted: ' + listed(sizeDrift.sort(), 4) + '. | Fix: ' + fix + '.');
  }
  if (unreadable.length) {
    ok = false;
    errors.push('Form ↔ Drive sync — "task" | Problem: ' + unreadable.length + ' file(s) in the form could not be read ' +
      'from Drive: ' + listed(unreadable, 4) + '. | Fix: export Google Docs/Sheets to real files (.md, .csv, .py), ' +
      'confirm each file is shared with the automation account, then refresh the task field.');
  }
  return ok;
}

// ------------------------------------------------------------------ B: structure

function checkStructure(pkg, source) {
  var scope = 'Task Folder — "task"';
  var multi = pkg.isDir('steps');
  var requiredDirs = multi ? ROOT_MULTI_REQUIRED_DIRS : ROOT_SINGLE_REQUIRED_DIRS;
  var requiredFiles = multi ? ROOT_MULTI_REQUIRED_FILES : ROOT_SINGLE_REQUIRED_FILES;
  var optionalDirs = multi ? ROOT_OPTIONAL_DIRS_MULTI : ROOT_OPTIONAL_DIRS_SINGLE;
  var optionalFiles = ROOT_OPTIONAL_FILES.concat(multi ? ['instruction.md'] : []);
  var contract = 'The task folder must contain ' +
    requiredDirs.map(function (d) { return d + '/'; }).concat(requiredFiles).join(', ') +
    ', and may also contain ' + optionalDirs.map(function (d) { return d + '/'; }).concat(optionalFiles).join(', ') +
    ' -- nothing else';

  var extraDirs = [];
  var extraFiles = [];
  pkg.children('').forEach(function (entry) {
    if (isJunk(entry)) return; // reported below
    if (pkg.isDir(entry)) {
      if (requiredDirs.indexOf(entry) === -1 && optionalDirs.indexOf(entry) === -1) extraDirs.push(entry + '/');
    } else if (requiredFiles.indexOf(entry) === -1 && optionalFiles.indexOf(entry) === -1) {
      extraFiles.push(entry);
    }
  });

  var absent = requiredDirs.filter(function (d) { return !pkg.isDir(d); }).map(function (d) { return d + '/'; })
    .concat(requiredFiles.filter(function (f) { return !pkg.isFile(f); }));

  if (absent.length) {
    var nestedRoot = pkg.paths.filter(function (p) { return /^[^/]+\/task\.toml$/.test(p); })[0];
    errors.push(scope + ' | Problem: the task folder is missing ' + listed(absent) + '. | Fix: ' +
      (!pkg.isFile('task.toml') && nestedRoot
        ? 'link the task folder itself -- the package sits one level down, inside ' + nestedRoot.split('/')[0] + '/. '
        : 'add ' + listed(absent) + ' at the top level of the task folder. ') + contract + '.');
  }
  if (extraDirs.length) {
    errors.push(scope + ' | Problem: the task folder holds folder(s) outside the Harbor layout: ' + listed(extraDirs.sort()) +
      '. | Fix: move or remove them, and check you linked the task folder rather than a parent. ' + contract + '.');
  }
  if (extraFiles.length) {
    errors.push(scope + ' | Problem: the task folder holds file(s) outside the Harbor layout: ' + listed(extraFiles.sort()) +
      '. | Fix: move or remove them. ' + contract + '.');
  }

  // A task.toml below the root (outside environment/, where a build-time mirror may live). When
  // the root has none and it sits one level down, the "missing" finding above already says so.
  var nested = pkg.paths.filter(function (p) {
    if (!endsWith(p, '/task.toml') || p.indexOf('environment/') === 0) return false;
    return pkg.isFile('task.toml') || !/^[^/]+\/task\.toml$/.test(p);
  });
  if (nested.length) {
    errors.push(scope + ' | Problem: another task package sits inside this one (nested task.toml at ' + listed(nested) +
      '). | Fix: link one task folder per task.');
  }

  // Required entry points (parser: Missing environment/Dockerfile, tests/test.sh, solution/solve.sh).
  var required = ['environment/Dockerfile'];
  if (!multi) required.push('tests/test.sh', 'solution/solve.sh');
  var emptyOrMissing = required.filter(function (p) { return !pkg.isFile(p) || pkg.size(p) === 0; });
  if (emptyOrMissing.length) {
    errors.push(scope + ' | Problem: required file(s) are missing or empty: ' + listed(emptyOrMissing) +
      '. | Fix: add them -- environment/Dockerfile builds the agent image, tests/test.sh scores the run, ' +
      'solution/solve.sh is the oracle.');
  }
  ['task.toml', 'instruction.md'].forEach(function (p) {
    if (pkg.isFile(p) && pkg.size(p) === 0) {
      errors.push(scope + ' | Problem: ' + p + ' is empty. | Fix: fill in ' + p + '.');
    }
  });

  // Parser _validate_file_sizes.
  var oversized = pkg.paths.filter(function (p) { return !hasJunkSegment(p) && pkg.size(p) > MAX_TASK_FILE_BYTES; });
  if (oversized.length) {
    errors.push(scope + ' | Problem: file(s) exceed ' + formatBytes(MAX_TASK_FILE_BYTES) + ': ' +
      listed(oversized.map(function (p) { return p + ' (' + formatBytes(pkg.size(p)) + ')'; })) +
      '. | Fix: store large assets with DVC instead of committing them into the task (/docs/dvc-large-files).');
  }

  // Parser _validate_ignored_names.
  var junk = {};
  pkg.paths.forEach(function (p) {
    var parts = p.split('/');
    for (var i = 0; i < parts.length; i++) {
      if (isJunk(parts[i])) { junk[parts.slice(0, i + 1).join('/')] = true; break; }
    }
  });
  var junkList = Object.keys(junk).sort();
  if (junkList.length) {
    warnings.push(scope + ' | Problem: the task contains files or folders that may not be relevant: ' + listed(junkList) +
      '. | Fix: delete them from the Drive folder and refresh the task field.');
  }

  infos.push('Structure checked on the ' + source + ' snapshot (' + (multi ? 'multi-step' : 'single-step') + ' layout).');
}

// ------------------------------------------------------------------ C: task.toml

function checkTaskToml(pkg, input) {
  var scope = 'task.toml — "task"';
  var text = fileText(pkg, 'task.toml');
  if (!text) {
    errors.push(scope + ' | Problem: task.toml is missing or empty. | Fix: add the Harbor task definition.');
    return null;
  }
  var toml = parseToml(text);
  if (toml === null) {
    errors.push(scope + ' | Problem: task.toml is not valid TOML. | Fix: correct the syntax (check quotes, brackets and table headers).');
    return null;
  }

  if (blank(toml.schema_version)) {
    warnings.push(scope + ' | Problem: schema_version is not set. | Fix: add schema_version = "1.3" at the top of task.toml.');
  }

  var task = objectAt(toml.task);
  if (blank(task.name)) {
    errors.push(scope + ' | Problem: [task] name is missing. | Fix: add name = "' + TASK_NAME_PREFIX + '/<task name>" under [task].');
  } else {
    var name = String(task.name);
    var slash = name.lastIndexOf('/');
    var prefix = slash === -1 ? '' : name.slice(0, slash);
    var suffix = slash === -1 ? name : name.slice(slash + 1);
    var expectedName = trim(String(input['Task Name'] || ''));
    if (expectedName && suffix !== expectedName) {
      errors.push(scope + ' | Problem: [task] name is "' + name + '" but this task is "' + expectedName +
        '", so the linked folder holds a different task. | Fix: link the folder for "' + expectedName +
        '", or correct [task] name to "' + TASK_NAME_PREFIX + '/' + expectedName + '".');
    }
    if (TASK_NAME_PREFIX && prefix !== TASK_NAME_PREFIX) {
      warnings.push(scope + ' | Problem: [task] name "' + name + '" does not start with "' + TASK_NAME_PREFIX +
        '/". | Fix: set name = "' + TASK_NAME_PREFIX + '/' + suffix + '".');
    }
  }
  var taskBlanks = ['description', 'keywords'].filter(function (k) { return blank(task[k]); });
  if (taskBlanks.length) {
    warnings.push(scope + ' | Problem: [task] is missing ' + listed(taskBlanks) + '. | Fix: fill them in; the task publishes with them.');
  }
  // [task] authors and [metadata] benchmark_type are deliberately NOT checked: no task in this
  // project fills them (batch 1: 24/24 blank), and neither blocks ingest.

  var metadata = objectAt(toml.metadata);
  var metaBlanks = METADATA_KEYS.filter(function (k) { return blank(metadata[k]); });
  if (metaBlanks.length) {
    warnings.push(scope + ' | Problem: [metadata] is missing ' + listed(metaBlanks) + '. | Fix: fill them in under [metadata].');
  }
  if (!blank(metadata.expert_time_estimate_hours) && !(Number(metadata.expert_time_estimate_hours) > 0)) {
    warnings.push(scope + ' | Problem: [metadata] expert_time_estimate_hours is not a positive number. | Fix: set it in hours, e.g. 16.');
  }
  var crossChecks = [['family', 'Task Domain'], ['subdomain', 'Task Sub-Domain']];
  crossChecks.forEach(function (pair) {
    var declared = metadata[pair[0]];
    var expected = input[pair[1]];
    if (!blank(declared) && !blank(expected) && norm(declared) !== norm(expected)) {
      warnings.push(scope + ' | Problem: [metadata] ' + pair[0] + ' is "' + declared + '" but the task\'s ' + pair[1] +
        ' is "' + expected + '". | Fix: make them agree.');
    }
  });

  var environment = objectAt(toml.environment);
  var envBlanks = ENVIRONMENT_KEYS.filter(function (k) { return blank(environment[k]); });
  if (envBlanks.length) {
    warnings.push(scope + ' | Problem: [environment] does not set ' + listed(envBlanks) +
      ', so Harbor defaults apply. | Fix: declare them explicitly.');
  }
  ['cpus', 'memory_mb', 'storage_mb', 'build_timeout_sec'].forEach(function (k) {
    if (!blank(environment[k]) && !(typeof environment[k] === 'number' && environment[k] > 0)) {
      errors.push(scope + ' | Problem: [environment] ' + k + ' = ' + JSON.stringify(environment[k]) +
        ' is not a positive number. | Fix: set a positive number.');
    }
  });
  if (!blank(environment.gpus) && !(typeof environment.gpus === 'number' && environment.gpus >= 0)) {
    errors.push(scope + ' | Problem: [environment] gpus is not a non-negative number. | Fix: set gpus = 0 unless the task needs a GPU.');
  } else if (Number(environment.gpus) >= 1) {
    warnings.push(scope + ' | Problem: the task requests ' + environment.gpus + ' GPU(s). | Fix: confirm a GPU is genuinely required.');
  }

  [['agent', objectAt(toml.agent)], ['verifier', objectAt(toml.verifier)]].forEach(function (pair) {
    var t = pair[1].timeout_sec;
    if (blank(t)) {
      warnings.push(scope + ' | Problem: [' + pair[0] + '] timeout_sec is not set. | Fix: declare it explicitly.');
    } else if (!(typeof t === 'number' && t > 0)) {
      errors.push(scope + ' | Problem: [' + pair[0] + '] timeout_sec = ' + JSON.stringify(t) +
        ' is not a positive number. | Fix: set a positive number of seconds.');
    }
  });

  if (!isArray(toml.steps)) return toml;
  // Multi-step task: each declared step owns steps/<name>/ with its instruction and tests.
  toml.steps.forEach(function (step, i) {
    var stepName = objectAt(step).name;
    if (blank(stepName)) {
      errors.push(scope + ' | Problem: step ' + (i + 1) + ' in [[steps]] has no name. | Fix: add name = "…" to every [[steps]] entry.');
      return;
    }
    var dir = 'steps/' + stepName;
    if (!pkg.isDir(dir)) {
      errors.push(scope + ' | Problem: [[steps]] declares "' + stepName + '" but ' + dir + '/ does not exist. | Fix: add the step folder.');
      return;
    }
    var gaps = [];
    if (!fileText(pkg, dir + '/instruction.md')) gaps.push(dir + '/instruction.md');
    if (!pkg.isFile(dir + '/tests/test.sh') && !pkg.isFile('tests/test.sh')) gaps.push(dir + '/tests/test.sh');
    if (!pkg.isFile(dir + '/solution/solve.sh') && !pkg.isFile('solution/solve.sh')) gaps.push(dir + '/solution/solve.sh');
    if (gaps.length) {
      errors.push(scope + ' | Problem: step "' + stepName + '" is missing ' + listed(gaps) +
        '. | Fix: add them (tests/test.sh and solution/solve.sh may instead live at the task root).');
    }
  });
  return toml;
}

// ------------------------------------------------------------------ D: entry points

function checkEntryPoints(pkg, toml) {
  var scope = 'Entry points — "task"';
  if (!isArray(objectAt(toml).steps) && !fileText(pkg, 'instruction.md')) {
    errors.push(scope + ' | Problem: instruction.md is missing or empty, so the agent receives no task. | Fix: add the instruction.');
  }

  var testSh = fileText(pkg, 'tests/test.sh');
  var rewardkit = testSh.indexOf('rewardkit') !== -1;
  if (testSh && !rewardkit) {
    var rewardWritten = pkg.under('tests').some(function (p) { return /reward\.(txt|json)/.test(fileText(pkg, p)); });
    if (!rewardWritten) {
      errors.push(scope + ' | Problem: nothing under tests/ writes reward.txt or reward.json, so the run finishes without ' +
        'a verdict. | Fix: write 0 or 1 to /logs/verifier/reward.txt from tests/test.sh.');
    }
  }
  if (testSh && networkOff(toml)) {
    var installs = [];
    if (/\b(pip3?|uv\s+pip)\s+install\b/.test(testSh)) installs.push('pip install');
    if (/\bapt(-get)?\s+install\b/.test(testSh)) installs.push('apt-get install');
    if (/\bcurl\b[^\n]*\|\s*(ba)?sh\b/.test(testSh)) installs.push('curl | sh');
    if (installs.length) {
      errors.push(scope + ' | Problem: tests/test.sh installs dependencies at run time (' + listed(installs) +
        ') but network_mode is "no-network". | Fix: bake them into tests/Dockerfile.');
    }
  }

  [['solution/solve.sh', 'solution'], ['tests/test.sh', 'tests']].forEach(function (pair) {
    var text = fileText(pkg, pair[0]);
    if (!text) return;
    var absent = unresolvedReferences(text, pair[1], pkg);
    if (absent.length) {
      warnings.push(scope + ' | Problem: ' + pair[0] + ' uses file(s) that are not in the package: ' + listed(absent.sort()) +
        '. | Fix: upload them, or correct the path in ' + pair[0] + ' (ignore this if the script creates them at run time).');
    }
  });
}

// Paths an entry script reaches inside its own directory: "/tests/x", "$TEST_ROOT/x", or a
// variable bound to the script's own directory (dirname "$0").
function unresolvedReferences(text, dir, pkg) {
  var vars = [];
  text.split(/\r?\n/).forEach(function (line) {
    var m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && (m[2].indexOf('/' + dir) !== -1 || /dirname/.test(m[2]))) vars.push(m[1]);
  });
  var alternatives = ['/' + dir].concat(vars.map(function (v) { return '\\$\\{?' + v + '\\}?'; }));
  var pattern = new RegExp('(?:' + alternatives.join('|') + ')/([A-Za-z0-9._][A-Za-z0-9._/-]*)', 'g');
  var seen = {};
  var absent = [];
  var match;
  while ((match = pattern.exec(text)) !== null) {
    var target = match[1].replace(/[.,;:)\]'"]+$/, '').replace(/\/+$/, '');
    if (!target || seen[target] || /[*?]/.test(target)) continue;
    // "$TEST_ROOT/../environment/x" is a container path outside this directory, and cache
    // folders are created at run time -- neither is a package file.
    if (/(^|\/)\.\.(\/|$)/.test(target) || hasJunkSegment(target)) continue;
    seen[target] = true;
    if (!pkg.has(dir + '/' + target)) absent.push(dir + '/' + target);
  }
  return absent;
}

// ------------------------------------------------------------------ D: Dockerfiles

function checkDockerfiles(pkg, toml) {
  var scope = 'Dockerfiles — "task"';
  var envDockerfile = fileText(pkg, 'environment/Dockerfile');

  if (envDockerfile) {
    // Parser _has_non_root_dockerfile_user.
    var users = [];
    var re = /^\s*USER\s+(\S+)/gim;
    var m;
    while ((m = re.exec(envDockerfile)) !== null) {
      if (!/^(root|0)(:(root|0))?$/i.test(m[1])) users.push(m[1]);
    }
    if (users.length) {
      errors.push(scope + ' | Problem: environment/Dockerfile sets a non-root USER (' + listed(users) + '). ' +
        '| Fix: remove the USER line and set [agent].user in task.toml instead (https://www.harborframework.com/docs/tasks).');
    }

    // Built from environment/, only "../" escapes it; built from the task root, any source
    // under solution/ or tests/ puts grader or oracle material in the agent image.
    var envContext = buildContext(pkg, 'environment', envDockerfile);
    var leaking = copySources(envDockerfile).filter(function (src) {
      var path = contextPath(src) || '';
      if (/^\.\.(\/|$)/.test(path)) return true;
      return envContext.dir === '' && /^(solution|tests)(\/|$)/.test(path);
    });
    if (leaking.length) {
      errors.push(scope + ' | Problem: environment/Dockerfile copies material the agent must not see: ' + listed(leaking) +
        '. | Fix: copy only paths inside environment/ into the agent image.');
    }
  }

  var separate = String(objectAt(objectAt(toml).environment).environment_mode || '') === 'separate' ||
    String(objectAt(objectAt(toml).verifier).environment_mode || '') === 'separate';
  var testsDockerfile = fileText(pkg, 'tests/Dockerfile');
  if (separate && !pkg.isFile('tests/Dockerfile')) {
    warnings.push(scope + ' | Problem: environment_mode = "separate" but tests/Dockerfile is missing, so the verifier ' +
      'image cannot be built. | Fix: add tests/Dockerfile.');
  }
  // Any COPY/ADD into /tests counts: "COPY . /tests/" from tests/, or named files from the root.
  var copiesIntoTests = copyInstructions(testsDockerfile).some(function (c) { return /^\/tests(\/|$)/.test(c.dest); });
  if (testsDockerfile && !copiesIntoTests) {
    errors.push(scope + ' | Problem: tests/Dockerfile copies nothing into /tests, so the test files never reach the ' +
      'verifier image. | Fix: add COPY . /tests/ (or COPY tests/ /tests/ when the image is built from the task root).');
  }

  [['environment', 'environment/Dockerfile', envDockerfile], ['tests', 'tests/Dockerfile', testsDockerfile]].forEach(function (t) {
    if (!t[2]) return;
    var context = buildContext(pkg, t[0], t[2]);
    if (context.missing.length) {
      errors.push(scope + ' | Problem: ' + t[1] + ' copies path(s) that are in neither ' + t[0] + '/ nor the task root: ' +
        listed(context.missing.sort()) + ' (checked against ' + context.label + '). | Fix: upload them, or correct the ' +
        'COPY line -- the image build fails otherwise.');
    }
    var loose = unpinnedInstalls(t[2]);
    if (loose.length) {
      warnings.push(scope + ' | Problem: ' + t[1] + ' pip-installs unpinned package(s): ' + listed(loose.sort()) +
        '. | Fix: pin each to an exact version (pkg==1.2.3) so the image rebuilds identically.');
    }
  });
}

// ------------------------------------------------------------------ form tree

// renderFolderData is the list of the task folder's root entries; folders carry children.
function flattenForm(nodes) {
  var out = { files: {}, sizes: {}, sizeText: {}, dirs: {}, paths: [] };
  function walk(list, prefix) {
    (isArray(list) ? list : []).forEach(function (node) {
      node = objectAt(node);
      if (blank(node.name)) return;
      var path = prefix ? prefix + '/' + node.name : String(node.name);
      if (node.type === 'folder' || isArray(node.children)) {
        out.dirs[path] = true;
        walk(node.children, path);
      } else {
        out.files[path] = { mimeType: node.mimeType, driveFileId: node.driveFileId };
        out.sizeText[path] = node.size ? String(node.size) : '';
        out.sizes[path] = parseSize(node.size);
        out.paths.push(path);
      }
    });
  }
  // The entries are the linked folder's own children, exactly as Drive keys its paths. They are
  // never unwrapped: a lone folder at the root is a parent folder linked by mistake, which the
  // structure check must see.
  walk(nodes, '');
  out.paths.sort();
  return out;
}

// The form renders sizes 1024-based with one decimal: "599 B", "1.3 KB", "16.6 KB".
function parseSize(text) {
  var m = String(text || '').match(/^\s*([\d.]+)\s*(B|KB|MB|GB)\s*$/i);
  if (!m) return null;
  var mult = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 }[m[2].toUpperCase()];
  return Math.round(parseFloat(m[1]) * mult);
}

function sizeMatches(text, bytes) {
  var m = String(text || '').match(/^\s*([\d.]+)\s*(B|KB|MB|GB)\s*$/i);
  if (!m) return true; // unparseable: nothing to compare
  var unit = m[2].toUpperCase();
  if (unit === 'B') return Number(m[1]) === bytes;
  var mult = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 }[unit];
  return Math.abs(bytes / mult - parseFloat(m[1])) <= 0.051;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// ------------------------------------------------------------------ dockerfile helpers

function sourceLines(text) {
  return String(text).replace(/\\\r?\n/g, ' ').split(/\r?\n/);
}

function copySources(text) {
  var sources = [];
  copyInstructions(text).forEach(function (c) { sources = sources.concat(c.sources); });
  return sources;
}

// Every COPY/ADD from the build context: { sources: [...], dest }. --from= stages copy from
// another image, not the context, so they are left out.
function copyInstructions(text) {
  var out = [];
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
      parts = rest.split(/\s+/).map(function (part) { return part.replace(/^["']|["']$/g, ''); });
    }
    parts = parts.filter(function (part) { return part; });
    if (parts.length < 2) return;
    out.push({ sources: parts.slice(0, parts.length - 1), dest: parts[parts.length - 1] });
  });
  return out;
}

// A context-relative COPY source, or null when it cannot be resolved statically (globs, URLs,
// "." itself).
function contextPath(src) {
  if (!src || /[*?]/.test(src) || /^https?:/.test(src)) return null;
  var clean = src.replace(/^\.?\/+/, '').replace(/^\.\//, '').replace(/\/+$/, '');
  return clean && clean !== '.' ? clean : null;
}

// Which folder a Dockerfile is built from. Harbor tasks use both layouts: the Dockerfile's own
// folder ("COPY project/ ...", "COPY . /tests/") or the task root ("COPY environment/project/ ...",
// "COPY tests/test.sh /tests/"). The context is the candidate that holds every COPY source; when
// neither does, the one missing fewer is reported against.
function buildContext(pkg, dir, text) {
  var sources = copySources(text).map(contextPath).filter(function (p) { return p && p.indexOf('..') !== 0; });
  var candidates = [dir, ''].map(function (ctx) {
    return {
      dir: ctx,
      label: ctx ? ctx + '/' : 'the task root',
      missing: sources.filter(function (p) { return !pkg.has(ctx ? ctx + '/' + p : p); })
    };
  });
  if (!candidates[0].missing.length) return candidates[0];
  if (!candidates[1].missing.length) return candidates[1];
  return candidates[1].missing.length < candidates[0].missing.length ? candidates[1] : candidates[0];
}

function unpinnedInstalls(text) {
  var loose = [];
  sourceLines(text).forEach(function (line) {
    if (!/\b(pip3?|uv\s+pip)\s+install\b/.test(line)) return;
    var after = line.slice(line.search(/\binstall\b/) + 'install'.length);
    var stop = after.search(/&&|;|\|/);
    if (stop !== -1) after = after.slice(0, stop);
    after.split(/\s+/).forEach(function (token) {
      var clean = trim(token).replace(/["'\\]/g, '');
      if (!clean || clean.charAt(0) === '-' || clean.charAt(0) === '.' || clean.charAt(0) === '/') return;
      if (clean.indexOf('$') === 0) return;
      if (/[=<>~!@]/.test(clean)) return;
      if (/\.txt$/.test(clean)) return;
      loose.push(clean);
    });
  });
  return loose;
}

function networkOff(toml) {
  var env = objectAt(objectAt(toml).environment);
  var ver = objectAt(objectAt(objectAt(toml).verifier).environment);
  var mode = String(ver.network_mode || env.network_mode || '');
  return mode === 'no-network' || mode === 'none';
}

// ------------------------------------------------------------------ TOML subset reader

// Tables, arrays of tables ([[steps]]), quoted/bare scalars, single- and multi-line arrays,
// inline tables and triple-quoted strings. Returns null on a syntax error.
function parseToml(text) {
  if (typeof text !== 'string') return null;
  var out = {};
  var table = out;
  var lines = text.split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    var line = trim(lines[i]);
    if (!line || line.charAt(0) === '#') continue;
    if (line.charAt(0) === '[') {
      var arrayHeader = line.match(/^\[\[\s*([^\]]+?)\s*\]\]\s*(#.*)?$/);
      var header = arrayHeader || line.match(/^\[\s*([^\]]+?)\s*\]\s*(#.*)?$/);
      if (!header) return null;
      var parts = header[1].split('.');
      if (arrayHeader) {
        var parent = tableAt(out, parts.slice(0, -1));
        var leaf = trim(parts[parts.length - 1]).replace(/^["']|["']$/g, '');
        if (parent === null || !leaf) return null;
        if (!isArray(parent[leaf])) parent[leaf] = [];
        table = {};
        parent[leaf].push(table);
      } else {
        table = tableAt(out, parts);
        if (table === null) return null;
      }
      continue;
    }
    var eq = line.indexOf('=');
    if (eq === -1) return null;
    var key = trim(line.slice(0, eq)).replace(/^["']|["']$/g, '');
    var value = trim(line.slice(eq + 1));
    if (!key) return null;
    var triple = value.slice(0, 3);
    if (triple === '"""' || triple === "'''") {
      var body = value.slice(3);
      while (body.indexOf(triple) === -1 && ++i < lines.length) body += '\n' + lines[i];
      if (body.indexOf(triple) === -1) return null;
      table[key] = body.slice(0, body.indexOf(triple)).replace(/^\n/, '');
      continue;
    }
    if ((value.charAt(0) === '[' || value.charAt(0) === '{') && !balanced(value)) {
      while (++i < lines.length) {
        value += ' ' + stripComment(trim(lines[i]));
        if (balanced(value)) break;
      }
      if (!balanced(value)) return null;
    }
    value = stripComment(value);
    if (/^["']/.test(value) && (value.length < 2 || value.charAt(value.length - 1) !== value.charAt(0))) return null;
    table[key] = tomlValue(value);
  }
  return out;
}

function balanced(text) {
  var square = 0, curly = 0, quote = null;
  for (var i = 0; i < text.length; i++) {
    var c = text.charAt(i);
    if (quote) { if (c === '\\' && quote === '"') { i++; continue; } if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '#') break;
    if (c === '[') square++; else if (c === ']') square--;
    else if (c === '{') curly++; else if (c === '}') curly--;
  }
  return square <= 0 && curly <= 0;
}

function stripComment(value) {
  var quote = null;
  for (var i = 0; i < value.length; i++) {
    var c = value.charAt(i);
    if (quote) { if (c === '\\' && quote === '"') { i++; continue; } if (c === quote) quote = null; continue; }
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
    if (isArray(node[part])) { node = node[part][node[part].length - 1]; continue; }
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
  if (/^["']/.test(value)) return value.slice(1, -1);
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^[-+]?\d[\d_]*(\.\d+)?([eE][-+]?\d+)?$/.test(value)) return Number(value.replace(/_/g, ''));
  return value;
}

function splitTop(text) {
  var parts = [], buffer = '', square = 0, curly = 0, quote = null;
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

function index(files, sizes, extraDirs) {
  var paths = [];
  for (var key in files) {
    if (Object.prototype.hasOwnProperty.call(files, key)) paths.push(key);
  }
  paths.sort();
  var dirs = {};
  var kids = {};
  function addChain(path) {
    var parts = path.split('/');
    for (var i = 0; i < parts.length; i++) {
      var dir = parts.slice(0, i).join('/');
      dirs[dir] = true;
      if (!kids[dir]) kids[dir] = {};
      kids[dir][parts[i]] = true;
    }
  }
  paths.forEach(addChain);
  for (var d in (extraDirs || {})) {
    if (Object.prototype.hasOwnProperty.call(extraDirs, d)) { addChain(d); dirs[d] = true; }
  }
  return {
    paths: paths,
    get: function (path) { return files[path]; },
    isFile: function (path) { return Object.prototype.hasOwnProperty.call(files, path); },
    isDir: function (path) { return !!dirs[path] && !Object.prototype.hasOwnProperty.call(files, path); },
    has: function (path) { return !!dirs[path] || Object.prototype.hasOwnProperty.call(files, path); },
    size: function (path) {
      if (typeof sizes[path] === 'number') return sizes[path];
      var value = files[path];
      return typeof value === 'string' ? value.length : value === undefined ? 0 : 1;
    },
    children: function (path) { return kids[path] ? Object.keys(kids[path]).sort() : []; },
    under: function (path) { return paths.filter(function (c) { return c.indexOf(path + '/') === 0; }); }
  };
}

// ------------------------------------------------------------------ conversation accessors

function ratingsOf(conversationData) {
  var data = conversationData || {};
  return objectAt(
    (data.conversation && data.conversation.ratings) ||
    (data.task_data && data.task_data.formData && data.task_data.formData.ratings) ||
    (data.raw_data && data.raw_data.formData && data.raw_data.formData.ratings) ||
    data.ratings
  );
}

function inputMetadata(conversationData) {
  var data = conversationData || {};
  return objectAt(
    (data.conversation && data.conversation.input && data.conversation.input.metadata) ||
    (data.task_data && data.task_data.formData && data.task_data.formData.input && data.task_data.formData.input.metadata) ||
    (data.raw_data && data.raw_data.formData && data.raw_data.formData.input && data.raw_data.formData.input.metadata)
  );
}

function valueOf(field) {
  if (field && typeof field === 'object' && !isArray(field) && Object.prototype.hasOwnProperty.call(field, 'value')) {
    return field.value;
  }
  return field;
}

// The FormV2 folder value, or a plain URL from older tasks.
function taskFolderLink(value) {
  if (typeof value === 'string') return trim(value) || null;
  var link = objectAt(value).googleDriveFolderLink;
  return typeof link === 'string' && trim(link) ? trim(link) : null;
}

function driveId(link) {
  var m = String(link || '').match(/\/folders\/([A-Za-z0-9_-]+)|\/file\/d\/([A-Za-z0-9_-]+)|[?&]id=([A-Za-z0-9_-]+)/);
  return m ? (m[1] || m[2] || m[3]) : null;
}

// ------------------------------------------------------------------ reporting helpers

function logFiles(paths) {
  logs.push('Drive folder contents (' + paths.length + ' files):');
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

function truncationCause(meta) {
  var reasons = (isArray(meta.skipped) ? meta.skipped : []).map(function (e) { return String(objectAt(e).reason || ''); });
  function first(pattern) {
    for (var i = 0; i < reasons.length; i++) if (pattern.test(reasons[i])) return reasons[i];
    return null;
  }
  var hit = first(/maximum of \d+ files per folder/);
  if (hit) return { what: 'it holds more files than the reader will walk', evidence: hit,
    fix: 'remove material that should not ship (__pycache__, .git, virtualenvs, a parent folder linked by mistake); ' +
      'if every file belongs to the task, report this to your lead.' };
  hit = first(/folder byte budget of \d+/);
  if (hit) return { what: 'it is larger than the reader\'s byte budget', evidence: hit,
    fix: 'report this task to your lead -- the reader budget has to be raised; store very large assets with DVC.' };
  hit = first(/deadline reached/);
  if (hit) return { what: 'the read ran out of time', evidence: hit,
    fix: 're-run the checks once; if it repeats, report it to your lead.' };
  hit = first(/maximum folder depth of \d+/);
  if (hit) return { what: 'it is nested more deeply than the reader will walk', evidence: hit,
    fix: 'flatten the deepest folders, or check you linked the task folder itself.' };
  return { what: 'the reader stopped early', evidence: reasons.length ? 'first reason: ' + reasons[0] : 'no reason reported',
    fix: 're-run the checks once; if it repeats, report this task to your lead.' };
}

// ------------------------------------------------------------------ small utilities

function fileText(pkg, path) {
  var value = pkg.get(path);
  if (typeof value === 'string') return value;
  return value && typeof value === 'object' ? JSON.stringify(value) : '';
}

function isJunk(segment) {
  if (JUNK_NAMES.indexOf(segment) !== -1) return true;
  for (var i = 0; i < JUNK_SUFFIXES.length; i++) if (endsWith(segment, JUNK_SUFFIXES[i])) return true;
  return false;
}

function hasJunkSegment(path) {
  return path.split('/').some(isJunk);
}

function norm(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function objectAt(value) {
  return value && typeof value === 'object' && !isArray(value) ? value : {};
}

function blank(value) {
  return value === undefined || value === null || (typeof value === 'string' && !trim(value)) ||
    (isArray(value) && !value.length);
}

function base(path) {
  var parts = path.split('/');
  return parts[parts.length - 1];
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
