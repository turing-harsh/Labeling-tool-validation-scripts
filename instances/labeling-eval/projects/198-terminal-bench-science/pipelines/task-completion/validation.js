// Terminal-Bench-Science — Task Completion gate (labeling-eval project 198).
//
// GENERATED FILE — do not edit by hand. Rebuild with: node scripts/build-198-task-completion.mjs
// Composed, verbatim, from this project's pipeline scripts:
//   - pipelines/task-data-validation-1128/validation.js
//   - pipelines/oracle-validation-1183/validation.js
//   - pipelines/pass-at-1-reward-validation-1180/validation.js
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
  { title: "Task data validation (1128)", factory: taskDataValidation1128 },
  { title: "Oracle validation (1183)", factory: oracleValidation1183 },
  { title: "Pass eval reward validation (1180)", factory: passEvalValidation1180 }
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

// ===== task-data-validation-1128/validation.js (verbatim, except: var TEST_SH_STYLE_BLOCKS = false;) =====
function taskDataValidation1128(errors, warnings, infos, successes, logs) {
var PROFILE = 'upload';
var UPLOAD = 'upload';
var AUDIT = 'audit';
var DELIVERY = 'delivery';
var SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
var KEBAB_NAME = /^[a-z0-9]+(-[a-z0-9]+){0,2}$/;
var DUPLICATE_SUFFIX = /^(.+?)\s*\((\d+)\)(\..*)?$/;
var ROOT_REQUIRED_DIRS = ['environment', 'tests', 'solution'];
var ROOT_REQUIRED_FILES = ['task.toml', 'instruction.md'];
var ROOT_OPTIONAL_DIRS = [];
var ROOT_OPTIONAL_FILES = ['README.md'];
// What each task subfolder may hold. `required` paths must be present; any other file must
// end in one of the `allow` suffixes (null = anything clean). Subfolders are allowed; junk and
// caches are left to checkJunk, and an authoring/ folder is rejected wherever it sits.
var CODE_SUFFIXES = ['.py', '.sh', '.r', '.jl', '.c', '.h', '.cpp', '.hpp', '.f', '.f90', '.m'];
var CONTRACT_DATA_SUFFIXES = ['.csv', '.tsv', '.json', '.jsonl', '.ndjson', '.npy', '.npz', '.parquet',
'.parq', '.h5', '.hdf5', '.fits', '.pkl', '.txt', '.dat', '.nc', '.mat', '.xyz', '.pdb', '.cif',
'.fasta', '.fa', '.fastq', '.vcf', '.sdf', '.mol2', '.gz', '.wav', '.flac'];
var DIR_CONTRACT = {
'environment': { required: ['Dockerfile'], allow: null },
'solution': { required: ['solve.sh'], allow: CODE_SUFFIXES.concat(CONTRACT_DATA_SUFFIXES) },
'tests': { required: ['Dockerfile', 'test.sh'], requireOne: /^test_[^/]+\.py$/,
allow: CODE_SUFFIXES.concat(CONTRACT_DATA_SUFFIXES) }
};
var FORBIDDEN_SUBDIR = 'authoring';
var MATH_FILES = ['instruction.md', 'README.md'];
var MATH_SPACED_FILES = ['instruction.md'];   // $ ... $ and $$ ... $$ must carry inner whitespace
var MATH_ENVIRONMENT = /\\begin\{(equation|align|alignat|flalign|gather|multline|eqnarray|displaymath|math)\*?\}/;
var BARE_LATEX = /(^|[^\\A-Za-z])\\(frac|dfrac|tfrac|sqrt|sum|prod|int|iint|oint|lim|partial|nabla|infty|hbar|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|mathbf|mathrm|mathcal|mathbb|mathit|boldsymbol|text|cdot|cdots|ldots|times|leq|geq|neq|le|ge|ne|approx|equiv|propto|pm|mp|langle|rangle|left|right|exp|log|ln|sin|cos|tan|sinh|cosh|tanh|det|tr|operatorname|hat|bar|vec|dot|ddot|tilde|overline|underline|dagger|otimes|oplus|in|subset|forall|exists|to|rightarrow|leftarrow|mapsto)(?![A-Za-z])/;
var CACHE_DIRS = ['__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache'];
var CACHE_SUFFIXES = ['.pyc', '.pyo'];
var JUNK_NAMES = ['.DS_Store', 'Thumbs.db', 'desktop.ini', '.git', '.gitkeep-cache',
'.ipynb_checkpoints', 'node_modules', '.venv', 'venv', 'env', '.tox', '.idea', '.vscode'];
var VERIFIER_ENTRY = 'tests/test.sh';
var ORACLE_ENTRY = 'solution/solve.sh';
var DATA_SUFFIXES = ['.csv', '.tsv', '.json', '.jsonl', '.ndjson', '.npy', '.npz', '.parquet',
'.h5', '.hdf5', '.fits', '.pkl', '.parq', '.wav', '.flac'];
var CANARY = /\bharbor-canary\b/i;
var ANSWERISH = /^(held_?out|hold_?out|answers?|truth|ground_?truth|expected|solutions?|gold|labels?|targets?|key|keys)([._-]|$)/i;
var DOMAIN_FIELDS = {
'life-sciences': ['biology', 'ecology', 'medicine', 'neuroscience'],
'physical-sciences': ['astronomy', 'chemistry', 'materials-science', 'physics'],
'earth-sciences': ['atmospheric-sciences', 'environmental-sciences', 'geosciences', 'ocean-sciences'],
'mathematical-sciences': ['applied-mathematics', 'formal-mathematics', 'operations-research', 'statistics'],
'engineering-sciences': ['chemical-engineering', 'civil-engineering', 'electrical-engineering', 'mechanical-engineering']
};
var PYTEST_PINS = ['pytest==8.4.1', 'pytest-json-ctrf==0.3.5'];
var INSTRUCTION_TAIL =
/You have\s+(\d+)\s+seconds to complete this task\.\s*Do not cheat by using online solutions or hints specific to this task\.\s*$/;
var AGENT_TIMEOUT_CAP = 18000;
// The two task.toml structures. 'new' (schema 1.4): a turing/<task> name and [metadata]
// domain/category/subcategory/reward_type/source/public_overlap, where domain and category come
// from DOMAIN_FIELDS and subcategory is free text. 'old': a terminal-bench-science/<task>
// name and [metadata] domain/field/subfield/expert_time_estimate_hours. schema_version cannot
// tell them apart -- old-structure packages already say "1.4" -- so tomlSchema() reads the name.
// Both this pipeline and the task-completion gate accept only 'new'. The old-structure checks
// below are kept so a gate can re-admit old packages by adding 'old' to this list.
var ACCEPTED_TOML_SCHEMAS = ['new'];
// Two tests/test.sh style rules: the set -euo pipefail flags, and a literal 0/1 reward write in
// test.sh itself. Harbor and upstream Terminal-Bench Science accept verifiers without either
// (most merged upstream tasks omit errexit; upstream check-binary-reward accepts a literal write
// in a helper script), so they block here but are only warnings at task completion:
// scripts/build-198-task-completion.mjs flips this line to false there.
var TEST_SH_STYLE_BLOCKS = false;
var NEW_TOML = {
schemaVersion: '1.4',
namePrefix: 'turing/',
metadataKeys: ['domain', 'category', 'subcategory', 'reward_type', 'source', 'public_overlap'],
rewardType: 'binary'
};
var NEW_TOML_TEMPLATE = 'schema_version = "1.4"; artifacts at the top level; ' +
'[task] name = "turing/<task>", description, version, keywords; ' +
'[metadata] domain, category (one of that domain\'s categories), subcategory (free text), ' +
'reward_type = "binary", source, public_overlap; ' +
'[environment] network_mode = "public", cpus, memory_mb, storage_mb; ' +
'[agent] timeout_sec (at most 18000), network_mode = "public"; ' +
'[verifier] timeout_sec, network_mode = "no-network", environment_mode = "separate"; ' +
'[verifier.environment] network_mode = "no-network", cpus, memory_mb';
var OLD_TASK_NAME_PREFIX = 'terminal-bench-science/';
var RETIRED_TOML_FIELDS = ['difficulty_explanation', 'solution_explanation', 'verification_explanation'];
var BUDGET_REASON = /maximum of \d+ files per folder|folder byte budget of \d+|deadline reached|maximum folder depth of \d+/;
var FIXES = {
'T0.metadata-missing': 'fill the [metadata] block in task.toml (domain, field, subfield, expert time).',
'T0.network-mode-undeclared': 'declare network_mode explicitly in [verifier.environment] and [environment]; Harbor defaults it to "public".',
'T0.delivery-evaluations-missing': 'run the evaluations before submitting for delivery.',
'T1.folder-name-style': 'rename the task folder to kebab-case with at most three words, e.g. rainfall-return-levels.',
'T1.verifier-mode': 'set environment_mode = "separate" under [verifier]; this benchmark requires an isolated verifier.',
'T1.readme-missing': 'add README.md with ## Difficulty, ## Reference solution and ## Verification; it is the task\'s published card.',
'T1.readme-sections': 'fill in each README section; an HTML comment does not count as content.',
'T1.checksum-orphan': 'regenerate SHA256SUMS so it lists exactly the files that ship beside it.',
'T1.metadata-vocabulary': 'use one of the benchmark\'s declared domain/field pairs in task.toml [metadata].',
'T1.task-block-incomplete': 'fill in description and keywords under [task]; they are what the task publishes with.',
'T1.task-name-mismatch': 'set [task] name to the expected value shown, i.e. the name prefix followed by the task folder name.',
'T1.agent-timeout': 'set [agent] timeout_sec to at most 18000.',
'T1.retired-fields': 'move these into README.md sections and delete them from task.toml.',
'T1.network-mode-value': 'set [environment] network_mode = "public" and [verifier.environment] network_mode = "no-network".',
'T1.gpu-backend': 'set validate_env = "modal" under [environment] whenever gpus >= 1.'
};
var CRLF_FIX = 'convert the file(s) to Unix (LF) line endings and re-upload -- '+
"e.g. sed -i 's/\\r$//' <file>, or dos2unix <file>; set core.autocrlf=input (or a "+
'.gitattributes "*.sh text eol=lf") so Windows checkouts stop reintroducing them';
var PARTIAL = false;
var standDown = 0;
async function validate(conversationData) {
PARTIAL = false;   // module state: reset in case the sandbox reuses one loaded script across runs
standDown = 0;
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
if (meta.truncated === true) {
PARTIAL = true;
var cause = truncationCause(meta);
errors.push(
'Task Package — "task" | Problem: the linked Drive folder could not be read in full (' + cause.what +
'), so the package cannot be fully validated. | Fix: ' + cause.fix +
' | Why: ' + describeMeta(meta) + '; ' + cause.evidence + '.'
);
}
var skipped = isArray(meta.skipped) ? meta.skipped : [];
var workspace = skipped.filter(function (e) {
return /Workspace file has no binary content/.test(String(objectAt(e).reason || ''));
});
if (workspace.length) {
errors.push(
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
errors.push(
'Task Package — "task" | Problem: ' + unreadable.length + ' entr' + (unreadable.length === 1 ? 'y' : 'ies') +
' in the folder could not be read. | Fix: confirm the file is shared with the automation account and is not ' +
'a broken shortcut; re-upload it if it is corrupt. | Why: ' + listed(unreadable.map(describeSkipped)) + '.'
);
}
infos.push('Profile ' + PROFILE + ': read ' + pkg.paths.length + ' file(s) from the Drive folder (' + describeMeta(meta) + ').');
logFiles(pkg.paths);
checkRootStructure(pkg, skipped);
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
function validateTask(task, pkg) {
var name = labelOf(task, pkg);
var toml = parseToml(pkg.get(at(task, 'task.toml')));
infos.push(
scope(name) + ' | classification: ' + (pkg.isDir(at(task, 'evaluations')) ? 'with-runs' : 'task-only')
);
checkStructure(task, pkg, toml);
checkDirContract(task, pkg, toml);
checkGraderSpec(task, pkg, toml);
checkOracleEntryMechanics(task, pkg);
checkLineEndings(task, pkg);
checkModuleDrift(task, pkg);
checkTaskMetadata(task, pkg, toml);
checkArtifacts(task, pkg, toml);
checkLeakage(task, pkg);
checkEntryReferences(task, pkg);
checkBuildInputs(task, pkg);
checkNoEmbeddedCredentials(task, pkg);
checkVerifierContract(task, pkg, toml);
checkInstruction(task, pkg, toml);
checkReadme(task, pkg);
checkMathDelimiters(task, pkg);
checkNoCanary(task, pkg);
checkChecksums(task, pkg);
checkDuplicateNames(task, pkg);
checkJunk(task, pkg);              // P   -- working files that should not ship
if (!pkg.isDir(at(task, 'evaluations')) && PROFILE === DELIVERY) {
missingFinding(name, 'T0.delivery-evaluations-missing', 'evaluations/ is required for a delivery package');
}
}
function rootContract() {
var required = ROOT_REQUIRED_DIRS.map(function (d) { return d + '/'; }).concat(ROOT_REQUIRED_FILES);
var optional = ROOT_OPTIONAL_DIRS
.map(function (d) { return d + '/'; }).concat(ROOT_OPTIONAL_FILES);
return 'The task folder must contain ' + required.join(', ') +
(optional.length ? ', and may also contain ' + optional.join(', ') : '') +
' -- nothing else';
}
function checkRootStructure(pkg, skipped) {
var name = labelOf('', pkg);
var allowedDirs = ROOT_REQUIRED_DIRS.concat(ROOT_OPTIONAL_DIRS);
var allowedFiles = ROOT_REQUIRED_FILES.concat(ROOT_OPTIONAL_FILES);
var extraDirs = [];
var extraFiles = [];
var presentDirs = {};
var presentFiles = {};
pkg.children('').forEach(function (entry) {
if (isJunk(entry) || CACHE_DIRS.indexOf(entry) !== -1) return; // checkJunk owns these
if (pkg.isDir(entry)) {
presentDirs[entry] = true;
if (allowedDirs.indexOf(entry) === -1) extraDirs.push(entry + '/');
} else {
presentFiles[entry] = true;
if (allowedFiles.indexOf(entry) === -1) extraFiles.push(entry);
}
});
(skipped || []).forEach(function (e) {
var path = String(objectAt(e).path || '').replace(/^\/+/, '');
if (!path) return;
var top = path.split('/')[0];
if (isJunk(top) || CACHE_DIRS.indexOf(top) !== -1) return;
if (path.indexOf('/') !== -1) {
if (allowedDirs.indexOf(top) === -1 && extraDirs.indexOf(top + '/') === -1) extraDirs.push(top + '/');
} else if (allowedFiles.indexOf(top) === -1 && extraFiles.indexOf(top) === -1) {
extraFiles.push(top);
}
});
var absentDirs = ROOT_REQUIRED_DIRS.filter(function (d) { return !presentDirs[d]; });
var absentFiles = ROOT_REQUIRED_FILES.filter(function (f) { return !presentFiles[f]; });
if (!PARTIAL && (absentDirs.length || absentFiles.length)) {
var absent = absentDirs.map(function (d) { return d + '/'; }).concat(absentFiles);
var looksNested = extraDirs.length && !presentFiles['task.toml'];
hard(name,
'the task root is missing ' + listed(absent) + ', so the linked folder is not a complete task package',
looksNested
? 'link the task folder itself -- the package looks like it sits one level down, inside ' +
listed(extraDirs.sort(), 3) + '. ' + rootContract()
: 'add ' + listed(absent) + ' at the top level of the linked folder. ' + rootContract());
}
if (extraDirs.length) {
hard(name,
'the task root holds folder(s) that are not part of the agreed structure: ' + listed(extraDirs.sort()),
'move or remove ' + listed(extraDirs.sort()) + ', and check you linked the task folder itself ' +
'rather than a parent. ' + rootContract());
}
if (extraFiles.length) {
hard(name,
'the task root holds file(s) that are not part of the agreed structure: ' + listed(extraFiles.sort()),
'move or remove ' + listed(extraFiles.sort()) + '. ' + rootContract());
}
if (!extraDirs.length && !extraFiles.length &&
!absentDirs.length && !absentFiles.length) {
infos.push(scope(name) + ' | root structure: exactly the agreed entries, nothing extra.');
}
}
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
var expected = (tomlSchema(toml) === 'new' ? NEW_TOML.namePrefix : OLD_TASK_NAME_PREFIX) + base(task);
if (String(toml.task.name) !== expected) {
finding(name, 'T1.task-name-mismatch',
'[task] name is "' + toml.task.name + '" but the folder implies "' + expected + '"');
}
}
}
ROOT_REQUIRED_DIRS.forEach(function (dir) {
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
if (!pkg.isFile(at(task, 'instruction.md')) || !pkg.size(at(task, 'instruction.md'))) {
missingHard(name, 'instruction.md missing or empty, so the agent receives no task',
'add the task instruction the agent receives');
}
if (!pkg.isFile(at(task, 'environment/Dockerfile'))) {
missingHard(name, 'environment/Dockerfile missing, so the agent image cannot be built and every run fails',
'add the agent environment image definition');
}
}
// The per-folder allowlist (DIR_CONTRACT). Entry points with their own pointed message
// elsewhere (Dockerfile, solve.sh, test.sh) are only allowlisted here, not re-reported missing.
function checkDirContract(task, pkg, toml) {
var name = labelOf(task, pkg);
var reportedElsewhere = ['environment/Dockerfile', ORACLE_ENTRY, VERIFIER_ENTRY];
if (String(objectAt(objectAt(toml).verifier).environment_mode || '') === 'separate') {
reportedElsewhere.push('tests/Dockerfile');
}
var forbidden = [];
Object.keys(DIR_CONTRACT).forEach(function (dir) {
var spec = DIR_CONTRACT[dir];
var prefix = at(task, dir);
if (!pkg.isDir(prefix)) return; // checkStructure reports the folder itself
var files = pkg.under(prefix).filter(function (p) { return pkg.isFile(p); }).map(function (p) {
return rel(prefix, p);
});
var absent = spec.required.filter(function (r) {
return files.indexOf(r) === -1 && reportedElsewhere.indexOf(dir + '/' + r) === -1;
});
if (absent.length) {
missingHard(name, dir + '/ is missing ' + listed(absent.map(function (r) { return dir + '/' + r; })),
'add the missing file(s); ' + dirContractSentence(dir));
}
if (spec.requireOne && !files.some(function (r) { return spec.requireOne.test(r); })) {
missingHard(name, dir + '/ holds no file matching ' + spec.requireOne,
'add the pytest file the verifier runs, e.g. ' + dir + '/test_outputs.py');
}
var extra = [];
files.forEach(function (r) {
var segments = r.split('/');
if (segments.indexOf(FORBIDDEN_SUBDIR) !== -1 && segments.indexOf(FORBIDDEN_SUBDIR) < segments.length - 1) {
forbidden.push(dir + '/' + segments.slice(0, segments.indexOf(FORBIDDEN_SUBDIR) + 1).join('/') + '/');
return;
}
if (!notCache(r) || segments.some(isJunk)) return; // checkJunk owns these
if (spec.required.indexOf(r) !== -1 || !spec.allow) return;
if (spec.requireOne && spec.requireOne.test(r)) return;
if (!hasSuffix(r, spec.allow)) extra.push(dir + '/' + r);
});
if (extra.length) {
hard(name, dir + '/ holds file(s) outside the agreed structure: ' + listed(extra.sort(), 10),
'remove them, or convert them to a code or data format the task actually uses; ' + dirContractSentence(dir));
}
});
forbidden = forbidden.filter(function (path, i) { return forbidden.indexOf(path) === i; });
if (forbidden.length) {
hard(name, 'the package ships ' + FORBIDDEN_SUBDIR + '/ material: ' + listed(forbidden.sort()),
'remove every ' + FORBIDDEN_SUBDIR + '/ folder; authoring notes and evidence do not ship with the task');
}
}
function dirContractSentence(dir) {
var spec = DIR_CONTRACT[dir];
return dir + '/ must contain ' + spec.required.join(', ') +
(spec.requireOne ? ' and at least one test_*.py' : '') +
(spec.allow ? ', and any other file must be code or data (' + spec.allow.join(' ') + ')' : '');
}
function hasSuffix(path, suffixes) {
var lower = path.toLowerCase();
return suffixes.some(function (s) { return endsWith(lower, s); });
}
function checkGraderSpec(task, pkg, toml) {
var name = labelOf(task, pkg);
if (!pkg.isFile(at(task, VERIFIER_ENTRY)) || !pkg.size(at(task, VERIFIER_ENTRY))) {
missingHard(name, VERIFIER_ENTRY + ' missing or empty', 'add the verifier entry point so the task can be scored');
}
if (!pkg.isFile(at(task, ORACLE_ENTRY)) || !pkg.size(at(task, ORACLE_ENTRY))) {
missingHard(name, ORACLE_ENTRY + ' missing or empty', 'add the reference-solution entry point');
}
var verifier = objectAt(toml && toml.verifier);
if (String(verifier.environment_mode || '') === 'separate' && !pkg.isFile(at(task, 'tests/Dockerfile'))) {
missingHard(
name,
'task.toml declares [verifier] environment_mode = "separate" but tests/Dockerfile is missing',
'add tests/Dockerfile so the verifier image can be built'
);
}
}

function checkOracleEntryMechanics(task, pkg) {
  var name = labelOf(task, pkg);
  var entry = at(task, ORACLE_ENTRY);

  // Missing files are checked elsewhere.
  if (!pkg.isFile(entry) || !pkg.size(entry)) return;

  var text = fileText(pkg, entry);
  if (typeof text !== 'string') return;

  var lines = text.split(/\r?\n/);

  if (lines[0].indexOf('#!') !== 0) {
    hard(
      name,
      ORACLE_ENTRY + ' must start with a shebang on its first line',
      'put #!/bin/bash or another appropriate shebang on line 1'
    );
  }

}

// CRLF line endings on a script Linux executes. The shebang is the fatal case: the kernel
// takes the whole first line as the interpreter path, so "#!/bin/bash\r" asks for an
// interpreter that does not exist and the run dies before a single command executes. Inside
// a .sh body every line keeps a trailing \r that bash treats as part of the command, which
// silently corrupts quoting, variable values and path arguments.
function checkLineEndings(task, pkg) {
  var name = labelOf(task, pkg);
  var fatal = [];
  var body = [];

  pkg.under(task).forEach(function (path) {
    var text = fileText(pkg, path);
    if (!text || text.indexOf('\r\n') === -1) return;

    var isShell = endsWith(base(path).toLowerCase(), '.sh');
    var hasShebang = text.indexOf('#!') === 0;
    if (!isShell && !hasShebang) return;          // CRLF only breaks files Linux executes

    if (hasShebang && text.split('\n')[0].indexOf('\r') !== -1) {
      fatal.push(rel(task, path));
    } else if (isShell) {
      body.push(rel(task, path) + ':' + crlfLine(text));
    }
  });

  if (fatal.length) {
    hard(name,
      'Windows (CRLF) line endings on the shebang line of ' + listed(fatal.sort()) +
      ', so Linux reads the interpreter as "/bin/bash\\r" and the script fails immediately ' +
      'with "bad interpreter: No such file or directory"',
      CRLF_FIX);
  }
  if (body.length) {
    hard(name,
      'Windows (CRLF) line endings inside shell script(s) ' + listed(body.sort()) +
      ' (first at the line shown), so every command keeps a trailing carriage return and ' +
      'quoting, variable values and path arguments break at run time',
      CRLF_FIX);
  }
  if (!fatal.length && !body.length) {
    infos.push(scope(name) + ' | line endings: scripts are Unix (LF).');
  }
}

// 1-based line number of the first CRLF, for a pointed message.
function crlfLine(text) {
  return String(text).slice(0, text.indexOf('\r\n')).split('\n').length;
}
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
if (!hasSuffix(relative, CODE_SUFFIXES)) return; // e.g. two requirements.txt legitimately differ
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

function checkArtifacts(task, pkg, toml) {
  var name = labelOf(task, pkg);

  if (toml === null) {
    return;
  }

  var declared = isArray(toml.artifacts)
    ? toml.artifacts
    : null;

  if (!declared || !declared.length) {
    if (isArray(objectAt(toml.verifier).artifacts)) {
      hard(
        name,
        'artifacts is declared under [verifier] instead of at the top level of task.toml, so no agent output is transferred and every run scores 0',
        'move the artifacts = [...] list to the top level of task.toml'
      );
    } else {
      missingHard(
        name,
        'task.toml declares no artifacts, so no agent output reaches the verifier and every run -- the oracle included -- scores 0',
        'add artifacts = [...] at the top level of task.toml, listing every absolute path the verifier reads'
      );
    }

    return;
  }

  var relativeEntries = declared.filter(function (path) {
    return (
      typeof path !== 'string' ||
      path.charAt(0) !== '/'
    );
  });

  if (relativeEntries.length) {
    hard(
      name,
      'artifacts entries must be absolute container paths: ' +
        listed(relativeEntries.map(String)),
      'write each artifact as an absolute path, e.g. /root/results/out.csv'
    );
  }

  var traversalEntries = declared.filter(function (path) {
    if (typeof path !== 'string') {
      return false;
    }

    return path.split('/').some(function (segment) {
      return segment === '.' || segment === '..';
    });
  });

  if (traversalEntries.length) {
    hard(
      name,
      'artifact path(s) contain dot or parent-directory traversal segments: ' +
        listed(traversalEntries.sort()),
      'use normalized absolute artifact paths without /./ or /../ segments'
    );
  }

  var protectedArtifacts = declared.filter(function (path) {
    if (
      typeof path !== 'string' ||
      path.charAt(0) !== '/'
    ) {
      return false;
    }

    var normalized = normalizeArtifactPath(path);

    return (
      normalized === '/logs' ||
      normalized.indexOf('/logs/') === 0 ||
      normalized === '/tests' ||
      normalized.indexOf('/tests/') === 0
    );
  });

  if (protectedArtifacts.length) {
    hard(
      name,
      'artifact path(s) use verifier-protected namespaces: ' +
        listed(protectedArtifacts.sort()),
      'move agent-produced outputs outside /logs and /tests; those paths belong exclusively to verifier infrastructure'
    );
  }
}

function checkLeakage(task, pkg) {
var name = labelOf(task, pkg);
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
hard(name, 'file(s) under environment/ are named like grader truth: ' + listed(suspected.sort()),
'move grader-only data into tests/, or rename the file if it really is agent input');
}
}
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
if (/[*?[{$]/.test(text.charAt(pattern.lastIndex))) continue; // a glob or variable: not resolvable here
var target = match[1].replace(/[.,;:)\]'"]+$/, '').replace(/\/+$/, '');
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
function checkNoEmbeddedCredentials(task, pkg) {
  var name = labelOf(task, pkg);
  var candidates = {};

  ['environment/Dockerfile', 'tests/Dockerfile'].forEach(function (relative) {
    var path = at(task, relative);

    if (pkg.isFile(path)) {
      candidates[path] = true;
    }
  });

  ['solution', 'tests'].forEach(function (directory) {
    pkg.under(at(task, directory)).forEach(function (path) {
      if (
        !notCache(rel(task, path)) ||
        !credentialTextFile(path)
      ) {
        return;
      }

      candidates[path] = true;
    });
  });

  var findings = [];

  Object.keys(candidates)
    .sort()
    .forEach(function (path) {
      var text = fileText(pkg, path);

      if (!text) {
        return;
      }

      text.split(/\r?\n/).forEach(function (line, index) {
        var reason = credentialFinding(line);

        if (!reason) {
          return;
        }

        findings.push(
          rel(task, path) +
            ':' +
            (index + 1) +
            ' (' +
            reason +
            ')'
        );
      });
    });

  if (findings.length) {
    hard(
      name,
      'possible embedded credential(s) found: ' +
        listed(findings, 10),
      'remove literal secrets from the task package; inject credentials at runtime through the approved secret mechanism. ' +
        'The validator intentionally redacts the suspected values'
    );
  }
}

function credentialTextFile(path) {
  var leaf = base(path);

  if (leaf === 'Dockerfile') {
    return true;
  }

  return /\.(?:sh|bash|zsh|py|js|mjs|cjs|ts|tsx|jsx|rb|pl|php|R|r|jl|toml|ya?ml|json|ini|cfg|conf|env)$/i.test(
    leaf
  );
}

function credentialFinding(line) {
  var raw = String(line || '');

  if (
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/.test(
      raw
    )
  ) {
    return 'private key material';
  }

  if (/\bAKIA[0-9A-Z]{16}\b/.test(raw)) {
    return 'AWS access key literal';
  }

  if (/\bASIA[0-9A-Z]{16}\b/.test(raw)) {
    return 'AWS temporary access key literal';
  }

  if (/\bgh[pousr]_[A-Za-z0-9]{20,}\b/.test(raw)) {
    return 'GitHub token literal';
  }

  if (/\bgithub_pat_[A-Za-z0-9_]{20,}\b/.test(raw)) {
    return 'GitHub token literal';
  }

  if (/\bhf_[A-Za-z0-9]{20,}\b/.test(raw)) {
    return 'Hugging Face token literal';
  }

  if (/\bsk-[A-Za-z0-9_-]{20,}\b/.test(raw)) {
    return 'API-key-shaped literal';
  }

  if (/https?:\/\/[^\s\/:@]+:[^\s\/@]+@/.test(raw)) {
    return 'credential embedded in URL';
  }

  var cleaned = trim(
    raw.replace(/^\s*(?:export\s+)?/, '')
  );

  var docker = cleaned.match(
    /^(?:ENV|ARG)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:=|\s)\s*(.*)$/i
  );

  var assignment = cleaned.match(
    /^([A-Za-z_][A-Za-z0-9_]*)\s*[:=]\s*(.+?)(?:\s*(?:#|\/\/).*)?$/
  );

  var match = docker || assignment;

  if (!match || !secretName(match[1])) {
    return null;
  }

  var rawValue = trim(match[2] || '');
  var value = rawValue.replace(
    /^['"]|['"]$/g,
    ''
  );

  if (safeSecretValue(value)) {
    return null;
  }

  // An unquoted value is code (token = tokens[0], key = os.environ.get(...)) unless it looks
  // like a key: one long run of key characters with a digit in it.
  if (
    !/^['"]/.test(rawValue) &&
    !(/^[A-Za-z0-9_\-+\/=.]{8,}$/.test(value) && /\d/.test(value))
  ) {
    return null;
  }

  return (
    'literal assigned to secret-like variable ' +
    match[1]
  );
}

// Whole underscore-separated parts only: HF_TOKEN and OPENAI_API_KEY match, while tokens,
// max_tokens, HF_HOME and AWS_REGION do not.
function secretName(name) {
  return /(?:^|_)(?:TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|ACCESS_?KEY|PRIVATE_?KEY|CLIENT_?SECRET)(?:_|$)/i.test(
    String(name)
  );
}

function safeSecretValue(value) {
  var normalized = trim(value);

  if (!normalized) {
    return true;
  }

  // Environment-variable reference
  if (
    /^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?$/.test(
      normalized
    )
  ) {
    return true;
  }

  // Angle-bracket placeholder
  if (/^<[^>]+>$/.test(normalized)) {
    return true;
  }

  // Common non-secret placeholder values
  if (
    /^(?:none|null|nil|false|empty|unset|placeholder|changeme|change-me|your[-_ ].*|example.*|dummy.*|redacted|xxx+|todo)$/i.test(
      normalized
    )
  ) {
    return true;
  }

  return false;
}

// The verifier must be wired the canonical way: pinned pytest baked into tests/Dockerfile,
// test.sh running pytest under set -euo pipefail with a CTRF report, and a literal 0/1
// reward. Anything spelled differently fails rather than being left for review.
function checkVerifierContract(task, pkg, toml) {
  var name = labelOf(task, pkg);
  var verifier = objectAt(objectAt(toml).verifier);
  var mode = String(verifier.environment_mode || '');

  // The new structure requires it outright (checkNewToml); this advisory is the old rule.
  if (toml !== null && mode !== 'separate' && tomlSchema(toml) === 'old') {
    finding(
      name,
      'T1.verifier-mode',
      'task.toml does not declare [verifier] environment_mode = "separate"' +
      (mode ? ' (found "' + mode + '")' : '')
    );
  }

  var sources = pkg.under(at(task, 'tests')).filter(function (path) {
    return pkg.isFile(path) && /\.(py|sh)$/i.test(path) && notCache(rel(task, path));
  }).map(function (path) {
    return { path: rel(task, path), code: vcCode(fileText(pkg, path)) };
  });

  // 1. The pytest file(s) define at least one test.
  var testFiles = sources.filter(function (item) {
    return /^tests\/test_[^/]+\.py$/.test(item.path);
  });
  if (testFiles.length && !testFiles.some(function (item) {
    return /^\s*(?:async\s+)?def\s+test_[A-Za-z0-9_]*\s*\(/m.test(item.code);
  })) {
    hard(name,
      'no test function is defined in ' + listed(testFiles.map(function (item) { return item.path; })),
      'define at least one def test_...() for pytest to collect');
  }

  // 2. Every pip install in either image is pinned to an exact version.
  ['environment/Dockerfile', 'tests/Dockerfile'].forEach(function (relativePath) {
    var path = at(task, relativePath);
    if (!pkg.isFile(path)) return;
    var text = vcCode(fileText(pkg, path));
    var loose = unpinnedInstalls(text);
    if (loose.length) {
      hard(name, relativePath + ' installs unpinned package(s): ' + listed(loose.sort()),
        'pin every pip package to an exact version (name==x.y.z) so the image rebuilds identically');
    }
    if (pipInstallArgs(text).some(function (after) { return /(?:>=|<=|~=|!=|==[^\s]*\*)/.test(after); })) {
      hard(name, relativePath + ' installs a ranged or wildcard version',
        'replace every range (>=, <=, ~=, !=, ==x.*) with an exact == pin');
    }
  });

  // 3. tests/Dockerfile bakes the verifier: pins, the tests/ copy, and the output folders.
  if (pkg.isFile(at(task, 'tests/Dockerfile'))) {
    var image = vcCode(fileText(pkg, at(task, 'tests/Dockerfile')));
    var absentPins = PYTEST_PINS.filter(function (pin) { return image.indexOf(pin) === -1; });
    if (absentPins.length) {
      hard(name, 'tests/Dockerfile does not install ' + listed(absentPins),
        'add RUN pip install ' + PYTEST_PINS.join(' ') + ' to tests/Dockerfile');
    }
    if (!/^\s*COPY\s+(?:--\S+\s+)*\.\/?\s+\/tests\/?\s*$/im.test(image)) {
      hard(name, 'tests/Dockerfile does not COPY . /tests/',
        'add COPY . /tests/ so the verifier files are baked into the image');
    }
    var requiredDirs = ['/logs/verifier'];
    (toml && isArray(toml.artifacts) ? toml.artifacts : []).forEach(function (artifact) {
      if (typeof artifact !== 'string') return; // checkArtifacts rejects non-path entries
      var cut = artifact.lastIndexOf('/');
      var parent = cut <= 0 ? '/' : artifact.slice(0, cut);
      if (requiredDirs.indexOf(parent) === -1) requiredDirs.push(parent);
    });
    var unset = requiredDirs.filter(function (directory) {
      return !vcDirectorySetupMentioned(image, directory);
    });
    if (unset.length) {
      hard(name, 'tests/Dockerfile does not create ' + listed(unset),
        'add RUN mkdir -p ' + unset.join(' ') + ' to tests/Dockerfile');
    }
  }

  // 4. tests/test.sh: strict shell, pytest with the CTRF report, and a literal binary reward.
  var entry = vcCode(fileText(pkg, at(task, VERIFIER_ENTRY)));
  if (entry) {
    var unsetOptions = [['errexit', 'e'], ['nounset', 'u'], ['pipefail', null]].filter(function (option) {
      return !vcHasShellOption(entry, option[0], option[1]);
    }).map(function (option) { return option[0]; });
    if (unsetOptions.length) {
      testShStyle(name, VERIFIER_ENTRY + ' does not enable ' + listed(unsetOptions),
        'put set -euo pipefail at the top of ' + VERIFIER_ENTRY);
    }
    if (!/(?:^|[\s;&|(])(?:pytest|python(?:3(?:\.\d+)?)?\s+-m\s+pytest)(?:\s|$)/m.test(entry)) {
      hard(name, VERIFIER_ENTRY + ' does not run pytest',
        'run pytest -rA --ctrf /logs/verifier/ctrf.json from ' + VERIFIER_ENTRY);
    } else {
      var absentFlags = [];
      if (!/(?:^|\s)-rA(?=\s|$|["';&|)])/m.test(entry)) absentFlags.push('-rA');
      var ctrf = vcCtrfTarget(entry);
      if (ctrf.status === 'missing') absentFlags.push('--ctrf /logs/verifier/ctrf.json');
      if (absentFlags.length) {
        hard(name, VERIFIER_ENTRY + ' runs pytest without ' + listed(absentFlags),
          'run pytest -rA --ctrf /logs/verifier/ctrf.json');
      }
      if (ctrf.status === 'elsewhere') {
        hard(name, VERIFIER_ENTRY + ' writes the CTRF report to ' + ctrf.path + ', not /logs/verifier/ctrf.json',
          'pass --ctrf /logs/verifier/ctrf.json, or copy the report to /logs/verifier/ctrf.json after pytest; ' +
          'Harbor collects it only from /logs/verifier');
      } else if (ctrf.status === 'unconfirmed') {
        warnings.push('ADVISORY ' + scope(name) + ' | Problem: ' + VERIFIER_ENTRY + ' passes --ctrf ' + ctrf.path +
          ', which could not be confirmed as /logs/verifier/ctrf.json. | Fix: write the report to ' +
          '/logs/verifier/ctrf.json, literally or through a variable the script sets, so every eval bundle carries it.');
      }
    }
    var binaryWrite =
      /\becho\s+(?:-n\s+)?["']?[01]["']?\s*>{1,2}\s*["']?\/logs\/verifier\/reward\.txt\b/;
    if (!binaryWrite.test(entry)) {
      testShStyle(name, VERIFIER_ENTRY + ' never writes a literal 0 or 1 to /logs/verifier/reward.txt',
        'echo 1 > /logs/verifier/reward.txt when pytest passes and echo 0 > /logs/verifier/reward.txt otherwise');
    }
  }
  sources.forEach(function (item) {
    var pattern =
      /\becho\s+(?:-n\s+)?["']?([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)["']?\s*>{1,2}\s*["']?[^\s"'<>;]*reward\.txt\b/g;
    var match;
    while ((match = pattern.exec(item.code)) !== null) {
      var value = Number(match[1]);
      if (value !== 0 && value !== 1) {
        hard(name, item.path + ' contains a non-binary literal reward write: ' + match[1],
          'write numeric 0 or 1; Harbor gives no partial credit');
      }
    }
  });

  // 5. Nothing under tests/ installs at trial time: the verifier runs with no network.
  var installers = sources.filter(function (item) {
    return /\b(?:pip3?|uv\s+pip)\s+install\b/.test(item.code) ||
      /\bpython(?:3(?:\.\d+)?)?\s+-m\s+pip\s+install\b/.test(item.code) ||
      /\bapt(?:-get)?\s+install\b/.test(item.code) ||
      /\buv\s+run\b[^\n]*--with(?:\s|=)/.test(item.code) ||
      /\b(?:conda|mamba|npm|yarn)\s+(?:install|add)\b/.test(item.code) ||
      /\b(?:curl|wget)\b[^\n]*\|\s*(?:bash|sh)\b/.test(item.code);
  }).map(function (item) { return item.path; });
  if (installers.length) {
    hard(name, 'file(s) under tests/ install or download software at verification time: ' + listed(installers.sort()),
      'install every verifier dependency in tests/Dockerfile; the verifier phase has no network');
  }
}

function vcCode(value) {
  if (typeof value !== 'string') return '';

  // Join shell/Dockerfile continuations and discard full-line comments.
  // This is not a Python, shell, or Dockerfile parser.
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\\\n[ \t]*/g, ' ')
    .split('\n')
    .filter(function (line) {
      return !/^\s*#/.test(line);
    })
    .join('\n');
}

// Where tests/test.sh sends pytest's CTRF report. The path may be literal or built from shell
// variables the script assigns (LOG_DIR=/logs/verifier ... --ctrf "$LOG_DIR/ctrf.json"), and
// ${VAR:-default} falls back to its default. A report written to a private folder first and then
// published with cp, mv or install into /logs/verifier/ctrf.json (or the /logs/verifier folder)
// counts as written there. status: 'ok' when some --ctrf reaches /logs/verifier/ctrf.json,
// 'unconfirmed' when a variable cannot be resolved, 'elsewhere' when it resolves to another path
// that is never published, 'missing' when pytest gets no --ctrf at all.
function vcCtrfTarget(code) {
  var target = '/logs/verifier/ctrf.json';
  var flags = [];
  var pattern = /--ctrf(?:\s+|=)("[^"]*"|'[^']*'|[^\s;&|)]+)/g;
  var match;
  while ((match = pattern.exec(code)) !== null) flags.push(vcUnquote(match[1]));
  if (!flags.length) return { status: 'missing', path: null };
  var resolved = flags.map(function (raw) { return { raw: raw, path: vcResolvePath(code, raw) }; });
  var published = vcPublishedCopies(code);
  var reaches = function (path) {
    return path === target || published.some(function (copy) {
      return copy.from === path && (copy.to === target || copy.to.replace(/\/+$/, '') === '/logs/verifier');
    });
  };
  if (resolved.some(function (item) { return reaches(item.path); })) return { status: 'ok', path: target };
  var unresolved = resolved.filter(function (item) { return item.path.indexOf('$') !== -1; });
  if (unresolved.length) return { status: 'unconfirmed', path: unresolved[0].raw };
  return { status: 'elsewhere', path: resolved[0].path };
}

// Every cp/mv/install SOURCE DEST in the script, both paths resolved.
function vcPublishedCopies(code) {
  var copies = [];
  var token = '("[^"]*"|\'[^\']*\'|[^\\s;&|)]+)';
  var pattern = new RegExp('(?:^|[\\s;&|(])(?:cp|mv|install)\\s+(?:-{1,2}[A-Za-z][A-Za-z-]*(?:=\\S+)?\\s+)*' +
    token + '\\s+' + token, 'gm');
  var match;
  while ((match = pattern.exec(code)) !== null) {
    copies.push({ from: vcResolvePath(code, vcUnquote(match[1])), to: vcResolvePath(code, vcUnquote(match[2])) });
  }
  return copies;
}

function vcResolvePath(code, raw) {
  var value = raw;
  for (var pass = 0; pass < 3 && value.indexOf('$') !== -1; pass++) {
    value = value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}|\$([A-Za-z_][A-Za-z0-9_]*)/g,
      function (whole, braced, fallback, bare) {
        var assigned = vcShellAssignment(code, braced || bare);
        if (assigned !== null) return assigned;
        return fallback !== undefined ? fallback : whole;
      });
  }
  return value.replace(/\/{2,}/g, '/');
}

function vcUnquote(value) {
  return String(value).replace(/^["']|["']$/g, '');
}

// The value of the last plain assignment to a shell variable (NAME=..., export NAME=...), or null.
function vcShellAssignment(code, varName) {
  var pattern = new RegExp('(?:^|[\\s;&|(])(?:export\\s+|readonly\\s+|local\\s+)?' + vcEscapeRegex(varName) +
    '=("[^"]*"|\'[^\']*\'|[^\\s;&|)]*)', 'gm');
  var value = null;
  var match;
  while ((match = pattern.exec(code)) !== null) value = vcUnquote(match[1]);
  return value;
}

function vcEscapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function vcHasShellOption(code, longName, shortName) {
  var longPattern = new RegExp(
    '\\bset\\s+-o\\s+' + vcEscapeRegex(longName) + '\\b'
  );

  if (longPattern.test(code)) return true;

  if (shortName) {
    var shortPattern = new RegExp(
      '\\bset\\s+-[A-Za-z]*' + shortName + '[A-Za-z]*(?:\\s|$)'
    );

    if (shortPattern.test(code)) return true;
  }

  // Combined spelling: set -euo pipefail
  if (longName === 'pipefail') {
    return /\bset\s+-[A-Za-z]*o[A-Za-z]*\s+pipefail\b/.test(code);
  }

  return false;
}

function vcDirectorySetupMentioned(image, directory) {
  if (directory === '/') return true;

  var escaped = vcEscapeRegex(directory.replace(/\/+$/, ''));
  var pathPattern = new RegExp(
    '(^|[\\s"\'])' + escaped + '(?:/|(?=[\\s"\';&]|$))'
  );

  return image.split('\n').some(function (line) {
    var establishesDirectory =
      /^\s*WORKDIR\s+/i.test(line) ||
      /^\s*(?:COPY|ADD)\s+/i.test(line) ||
      (
        /^\s*RUN\s+/i.test(line) &&
        (
          /\bmkdir\b/.test(line) ||
          /\binstall\s+[^\n]*-d\b/.test(line)
        )
      );

    return establishesDirectory && pathPattern.test(line);
  });
}

function checkInstruction(task, pkg, toml) {
var name = labelOf(task, pkg);
var path = at(task, 'instruction.md');
if (!pkg.isFile(path)) return; // checkStructure already reported it
var text = fileText(pkg, path);
if (!text) return;
var tail = text.match(INSTRUCTION_TAIL);
if (!tail) {
hard(name, 'instruction.md does not end with the required timeout and anti-cheat sentence',
'end instruction.md with: You have X seconds to complete this task. Do not cheat by using online solutions or ' +
'hints specific to this task.');
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

function checkMathDelimiters(task, pkg) {
var name = labelOf(task, pkg);
var problems = [];
MATH_FILES.forEach(function (file) {
var path = at(task, file);
if (!pkg.isFile(path)) return;
var original = fileText(pkg, path);
if (!original) return;
original.replace(/\r\n?/g, '\n').split('\n').forEach(function (line, i) {
var fence = line.match(/^\s*(?:`{3,}|~{3,})\s*(math|latex|tex|katex)\b/i);
if (fence) problems.push(file + ':' + (i + 1) + ' (' + fence[1] + ' code fence; use $$...$$)');
});
var scan = mathScan(markdownProse(original), MATH_SPACED_FILES.indexOf(file) !== -1);
scan.problems.forEach(function (p) {
problems.push(file + ':' + p.line + ' (' + p.what + ')');
});
scan.outside.split('\n').forEach(function (line, i) {
var where = file + ':' + (i + 1);
if (/(^|[^\\])\\[()]/.test(line)) problems.push(where + ' (\\( ... \\) delimiter; use $...$)');
if (/(^|[^\\])\\[\[\]]/.test(line)) problems.push(where + ' (\\[ ... \\] delimiter; use $$...$$)');
var env = line.match(MATH_ENVIRONMENT);
if (env) problems.push(where + ' (\\begin{' + env[1] + '} outside $$...$$)');
var bare = line.match(BARE_LATEX);
if (bare) problems.push(where + ' (\\' + bare[2] + ' outside math delimiters)');
});
});
if (problems.length) {
hard(name,
'math is not written with the required delimiters: ' + listed(problems, 10),
'use $...$ for inline equations and $$...$$ for display equations -- in ' + MATH_SPACED_FILES.join(', ') +
' with a space inside each delimiter, as $ x $ and $$ x $$; do not use \\( \\), \\[ \\], ' +
'bare \\begin{...} environments, ```math fences, or LaTeX commands outside delimiters, and write a ' +
'literal dollar sign as \\$');
}
}
function markdownProse(text) {
var src = String(text).replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, function (m) {
return m.replace(/[^\n]/g, '');
});
var fence = null;
return src.split('\n').map(function (line) {
var marker = line.match(/^\s*(`{3,}|~{3,})/);
if (fence) {
if (marker && marker[1].charAt(0) === fence.charAt(0) && marker[1].length >= fence.length) fence = null;
return '';
}
if (marker) { fence = marker[1]; return ''; }
return line.replace(/(`+)[^\n]*?\1/g, function (m) { return m.replace(/./g, ' '); });
}).join('\n');
}
// `spaced`: every delimiter must have whitespace on its inner side ($ x $, $$ x $$; a newline
// counts, so $$ on its own line passes).
function mathScan(text, spaced) {
var out = '';
var problems = [];
var mode = null;
var openLine = 0;
var line = 1;
var i = 0;
var n = text.length;
function unclosed() {
problems.push({
line: openLine,
what: mode === '$$'
? 'unclosed $$ display equation'
: 'unclosed $ inline equation; close it, or write a literal dollar sign as \\$'
});
mode = null;
}
function unspaced(delimiter, inner) {
if (spaced && !/\s/.test(inner)) {
problems.push({ line: line, what: delimiter + ' without an inner space; write ' + delimiter + ' x ' + delimiter });
}
}
while (i < n) {
var c = text.charAt(i);
if (c === '\\' && i + 1 < n) {
var pair = text.substr(i, 2);
if (pair.charAt(1) === '\n') { line++; out += mode ? ' \n' : pair; }
else out += mode ? '  ' : pair;
i += 2;
continue;
}
if (c === '$') {
var dbl = text.charAt(i + 1) === '$';
if (!mode) {
mode = dbl ? '$$' : '$';
openLine = line;
unspaced(mode, text.charAt(i + mode.length));
out += dbl ? '  ' : ' ';
i += dbl ? 2 : 1;
} else if (mode === '$$' && dbl) {
unspaced(mode, text.charAt(i - 1));
mode = null; out += '  '; i += 2;
} else if (mode === '$') {
unspaced(mode, text.charAt(i - 1));
mode = null; out += ' '; i += 1;
} else {
out += ' '; i += 1;
}
continue;
}
if (c === '\n') {
line++;
out += '\n';
i++;
if (mode === '$' && /^[ \t]*(\n|$)/.test(text.slice(i, i + 200))) unclosed();
continue;
}
out += mode ? ' ' : c;
i++;
}
if (mode) unclosed();
return { outside: out, problems: problems };
}

function checkNoCanary(task, pkg) {
  var name = labelOf(task, pkg);
  var present = [];

  pkg.under(task).forEach(function (path) {
    var relative = rel(task, path);

    if (!notCache(relative)) {
      return;
    }

    var text = fileText(pkg, path);

    if (!text) {
      return;
    }

    if (CANARY.test(text)) {
      present.push(relative);
    }
  });

  if (present.length) {
    hard(
      name,
      'canary marker(s) are present in task file(s): ' +
        listed(present.sort()),
      'remove every harbor-canary marker from the task package'
    );
  }
}

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
function checkDuplicateNames(task, pkg) {
var name = labelOf(task, pkg);
var conflicting = [];   // original present, contents differ
var redundant = [];     // original present, byte-identical
var orphaned = [];      // numbered, but no original beside it
pkg.under(task).forEach(function (path) {
var relative = rel(task, path);
if (!notCache(relative)) return;
var leaf = base(relative);
var parsed = leaf.match(DUPLICATE_SUFFIX);
if (!parsed) return;
var original = parsed[1] + (parsed[3] || '');
var directory = relative.indexOf('/') === -1 ? '' : relative.slice(0, relative.lastIndexOf('/'));
var originalPath = at(task, at(directory, original));
if (!pkg.isFile(originalPath)) { orphaned.push(relative); return; }
if (sameContent(pkg.get(originalPath), pkg.get(path))) redundant.push(relative);
else conflicting.push(relative + ' differs from ' + at(directory, original));
});
if (conflicting.length) {
hard(name,
'the package carries two versions of the same file and they are not the same: ' + listed(conflicting.sort()),
'keep the one that is authoritative and delete the other -- while both are present nothing ' +
'in the package says which one the task is defined by');
}
if (redundant.length) {
hard(name,
'the package carries duplicate copies of file(s): ' + listed(redundant.sort()),
'delete the numbered copies; a folder uploaded twice leaves a second file with the same name');
}
if (orphaned.length) {
hard(name, 'file(s) are named like a duplicate but have no original beside them: ' + listed(orphaned.sort()),
'rename each to its real name, or delete it if it is not part of the task');
}
}
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
hard(name, 'the package ships working material: ' + listed(names.sort()),
'delete these from the Drive folder and re-run');
}
}
function checkTaskMetadata(task, pkg, toml) {
var name = labelOf(task, pkg);
if (toml === null) return; // C already reported it
if (!Object.keys(toml).length) return; // an empty task.toml: checkStructure reported it
var schema = tomlSchema(toml);
infos.push(scope(name) + ' | task.toml structure: ' + schema + '.');
if (ACCEPTED_TOML_SCHEMAS.indexOf(schema) === -1) {
var metadataKeys = Object.keys(objectAt(toml.metadata)).sort();
hard(name,
'task.toml uses the ' + schema + ' structure ([task] name "' + String(objectAt(toml.task).name || '') +
'", [metadata] ' + (metadataKeys.length ? listed(metadataKeys, 8) : 'empty') + '), but this gate accepts only the ' +
listed(ACCEPTED_TOML_SCHEMAS) + ' structure',
'rewrite task.toml to the schema ' + NEW_TOML.schemaVersion + ' template: ' + NEW_TOML_TEMPLATE);
return;
}
if (schema === 'new') {
checkNewToml(name, toml);
return;
}
// The old structure, checked exactly as before the schema 1.4 switch.
var metadata = objectAt(toml && toml.metadata);
var required = ['domain', 'field', 'subfield', 'expert_time_estimate_hours'];
var absent = required.filter(function (key) { return blank(metadata[key]); });
if (absent.length) {
missingFinding(name, 'T0.metadata-missing', 'task.toml [metadata] is missing ' + listed(absent));
}
var domain = String(metadata.domain || '');
var field = String(metadata.field || '');
if (domain && !DOMAIN_FIELDS[domain]) {
finding(name, 'T1.metadata-vocabulary',
'domain "' + domain + '" is not one of ' + listed(Object.keys(DOMAIN_FIELDS)));
} else if (domain && field && DOMAIN_FIELDS[domain].indexOf(field) === -1) {
finding(name, 'T1.metadata-vocabulary',
'field "' + field + '" is not a field of ' + domain + ' (' + listed(DOMAIN_FIELDS[domain]) + ')');
}
var taskBlock = objectAt(toml.task);
var incomplete = ['description', 'keywords'].filter(function (key) { return blank(taskBlock[key]); });
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
// The turing/ name is what marks the new structure. Everything else is 'old', including the
// pre-switch hybrids that already carry new-style [metadata] under a
// terminal-bench-science/ name (381552, schema 1.3), so every task authored before the switch is
// checked exactly as it was before.
function tomlSchema(toml) {
var taskName = String(objectAt(objectAt(toml).task).name || '');
return taskName.indexOf(NEW_TOML.namePrefix) === 0 ? 'new' : 'old';
}
// The schema 1.4 template, field by field. Every gap goes into one error, so the author can
// fix task.toml in a single pass.
function checkNewToml(name, toml) {
var problems = [];
var taskBlock = objectAt(toml.task);
var metadata = objectAt(toml.metadata);
var environment = objectAt(toml.environment);
var agent = objectAt(toml.agent);
var verifier = objectAt(toml.verifier);
var verifierEnvironment = objectAt(verifier.environment);
function need(block, keys, where) {
keys.forEach(function (key) { if (blank(block[key])) problems.push(where + ' ' + key + ' is missing'); });
}
function numbers(block, keys, where) {
keys.forEach(function (key) {
if (blank(block[key])) problems.push(where + ' ' + key + ' is missing');
else if (typeof block[key] !== 'number') problems.push(where + ' ' + key + ' is not a number');
});
}
function equal(block, key, value, where) {
if (blank(block[key])) problems.push(where + ' ' + key + ' is missing');
else if (String(block[key]) !== value) problems.push(where + ' ' + key + ' is "' + block[key] + '" (must be "' + value + '")');
}
if (String(toml.schema_version || '') !== NEW_TOML.schemaVersion) {
problems.push('schema_version is ' + (blank(toml.schema_version) ? 'missing' : '"' + toml.schema_version + '"') +
' (must be "' + NEW_TOML.schemaVersion + '")');
}
need(taskBlock, ['name', 'description', 'version', 'keywords'], '[task]');
if (!blank(taskBlock.name) && !/^turing\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(taskBlock.name))) {
problems.push('[task] name "' + taskBlock.name + '" is not ' + NEW_TOML.namePrefix + '<kebab-case task name>');
}
// [metadata] domain > category > subcategory. Two drafts recur, and each gets the exact edit that
// fixes it: the old field/subfield keys kept under a turing/ name (rename them), and the domain
// placed in category with no domain key (shift each value up one level).
var renames = [];
var renameProblems = 0;
var domain = String(metadata.domain || '');
var category = String(metadata.category || '');
if (blank(metadata.domain) && DOMAIN_FIELDS[category]) {
var shiftedCategory = String(metadata.subcategory || '');
problems.push('[metadata] domain is missing, and category holds the domain "' + category + '"');
renameProblems++;
renames.push('set domain = "' + category + '", category = ' +
(DOMAIN_FIELDS[category].indexOf(shiftedCategory) !== -1 ? '"' + shiftedCategory + '"' : 'one of ' + listed(DOMAIN_FIELDS[category])) +
' and subcategory = the free-text specialty' + (blank(metadata.subfield) ? '' : ' (e.g. "' + metadata.subfield + '")'));
} else {
if (blank(metadata.domain)) problems.push('[metadata] domain is missing');
[['category', 'field'], ['subcategory', 'subfield']].forEach(function (pair) {
if (!blank(metadata[pair[0]])) return;
if (blank(metadata[pair[1]])) {
problems.push('[metadata] ' + pair[0] + ' is missing');
return;
}
problems.push('[metadata] ' + pair[0] + ' is missing (found ' + pair[1] + ')');
renameProblems++;
renames.push('rename ' + pair[1] + ' to ' + pair[0]);
});
var effectiveCategory = blank(metadata.category) ? String(metadata.field || '') : category;
if (domain && !DOMAIN_FIELDS[domain]) {
problems.push('[metadata] domain "' + domain + '" is not one of ' + listed(Object.keys(DOMAIN_FIELDS)));
} else if (domain && effectiveCategory && DOMAIN_FIELDS[domain].indexOf(effectiveCategory) === -1) {
problems.push('[metadata] category "' + effectiveCategory + '" is not a category of ' + domain +
' (' + listed(DOMAIN_FIELDS[domain]) + ')');
}
}
if (!blank(metadata.subcategory) && typeof metadata.subcategory !== 'string') {
problems.push('[metadata] subcategory is not a string');
}
need(metadata, ['source', 'public_overlap'], '[metadata]');
equal(metadata, 'reward_type', NEW_TOML.rewardType, '[metadata]');
equal(environment, 'network_mode', 'public', '[environment]');
numbers(environment, ['cpus', 'memory_mb', 'storage_mb'], '[environment]');
if (Number(environment.gpus) >= 1 && String(environment.validate_env || '') !== 'modal') {
problems.push('[environment] requests a GPU but validate_env is not "modal"');
}
numbers(agent, ['timeout_sec'], '[agent]');
if (typeof agent.timeout_sec === 'number' && agent.timeout_sec > AGENT_TIMEOUT_CAP) {
problems.push('[agent] timeout_sec is ' + agent.timeout_sec + ' (at most ' + AGENT_TIMEOUT_CAP + ')');
}
equal(agent, 'network_mode', 'public', '[agent]');
numbers(verifier, ['timeout_sec'], '[verifier]');
equal(verifier, 'network_mode', 'no-network', '[verifier]');
equal(verifier, 'environment_mode', 'separate', '[verifier]');
equal(verifierEnvironment, 'network_mode', 'no-network', '[verifier.environment]');
numbers(verifierEnvironment, ['cpus', 'memory_mb'], '[verifier.environment]');
var retired = RETIRED_TOML_FIELDS.filter(function (key) { return !blank(metadata[key]) || !blank(toml[key]); });
if (retired.length) problems.push('retired field(s) ' + listed(retired) + ' must move into README.md');
if (problems.length) {
var fix = 'match the template: ' + NEW_TOML_TEMPLATE;
if (renames.length) {
fix = 'in [metadata], ' + renames.join(' and ') + (renames[0].indexOf('rename ') === 0 ? ', keeping the values' : '') +
(problems.length > renameProblems ? '; then ' + fix : '; nothing else in task.toml needs to change');
}
hard(name, 'task.toml does not match the schema ' + NEW_TOML.schemaVersion + ' structure: ' + listed(problems, 30), fix);
} else {
infos.push(scope(name) + ' | task.toml matches the schema ' + NEW_TOML.schemaVersion + ' structure.');
}
}
function sourceLines(text) {
return String(text).replace(/\\\r?\n/g, ' ').split(/\r?\n/);
}
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
// The argument list of every pip install command, one entry per command. A RUN line chains
// commands with && || ; or |, and only the words of the pip command itself are packages:
// `pip install numpy==2.1.3 && chmod 700 /logs/verifier` installs one pinned package.
function pipInstallArgs(text) {
var args = [];
sourceLines(text).forEach(function (line) {
line.split(/&&|\|\||[;|]/).forEach(function (command) {
var match = command.match(/\b(?:pip3?|uv\s+pip)\s+install\b/);
if (match) args.push(command.slice(match.index + match[0].length));
});
});
return args;
}
function unpinnedInstalls(text) {
var loose = [];
pipInstallArgs(text).forEach(function (after) {
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
var triple = value.slice(0, 3);
if (triple === '"""' || triple === "'''") {
var body = value.slice(3);
while (body.indexOf(triple) === -1 && ++i < lines.length) body += '\n' + lines[i];
table[key] = body.slice(0, body.indexOf(triple) === -1 ? body.length : body.indexOf(triple));
continue;
}
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
function scope(name) {
return 'Task Package ' + name + ' — "task"';
}
function hard(name, message, fix) {
errors.push(scope(name) + ' | Problem: ' + message + '. | Fix: ' + fix + '.');
}
function testShStyle(name, message, fix) {
if (TEST_SH_STYLE_BLOCKS) {
hard(name, message, fix);
return;
}
warnings.push('ADVISORY ' + scope(name) + ' | Problem: ' + message + ' (not blocking at task completion). | Fix: ' + fix + '.');
}
function finding(name, code, message) {
var rendered = scope(name) + ' | Problem: ' + code + ': ' + message + '. | Fix: ' +
(FIXES[code] || 'report this task to your lead.');
if (PROFILE === AUDIT || PROFILE === DELIVERY) errors.push(rendered);
else warnings.push('ADVISORY ' + rendered);
}
function missingHard(name, message, fix) {
if (PARTIAL) { standDown++; return; }
hard(name, message, fix);
}
function missingFinding(name, code, message) {
if (PARTIAL) { standDown++; return; }
finding(name, code, message);
}
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
var link = folderLinkOf(raw);
return link && trim(link) ? trim(link) : null;
}
function folderLinkOf(raw) {
if (typeof raw === 'string') return raw;
var field = objectAt(raw);
if (typeof field.googleDriveFolderLink === 'string') return field.googleDriveFolderLink;
if (typeof field.value === 'string') return field.value;
var value = objectAt(field.value);
if (typeof value.googleDriveFolderLink === 'string') return value.googleDriveFolderLink;
return null;
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

function normalizeArtifactPath(path) {
  var parts = [];

  String(path || '')
    .split('/')
    .forEach(function (segment) {
      if (!segment || segment === '.') {
        return;
      }

      if (segment === '..') {
        parts.pop();
        return;
      }

      parts.push(segment);
    });

  return '/' + parts.join('/');
}

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
return validate;
} // ===== end task-data-validation-1128 =====

// ===== oracle-validation-1183/validation.js (verbatim) =====
function oracleValidation1183(errors, warnings, infos, successes, logs) {
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
return validate;
} // ===== end oracle-validation-1183 =====

// ===== pass-at-1-reward-validation-1180/validation.js (verbatim) =====
function passEvalValidation1180(errors, warnings, infos, successes, logs) {
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
//   PASS only when EVERY model in the roster has a valid rollout and was
//   broken (reward 0). A single solved model (reward 1) fails the gate.
//
// A failed verifier test/reward 0 is an ordinary valid failure — that is what
// "broken" means. An invalid rollout cannot prove that its model was broken,
// so it fails the gate too, unless ALLOW_INVALID_EXCLUSION is set to true, in
// which case it is excluded with a warning; the script still checks that the
// bundle supports the exclusion.
// Scientific/fairness/causal judgments remain in the separate LLM QD and are
// not merged into this validator's result.

var RATING_KEY = 'pass5Eval';
var EXPECTED_ATTEMPTS = 1;
// false: an invalid rollout fails the gate (it cannot prove its model was broken).
// true:  an invalid rollout is excluded from the gate with a warning.
var ALLOW_INVALID_EXCLUSION = false;
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
      run.solved_models + ' solved, ' + run.invalid_models + ' invalid). Gate: every model must be broken ' +
      '(reward 0) in ' + EXPECTED_ATTEMPTS + ' attempt' +
      (ALLOW_INVALID_EXCLUSION ? '; invalid rollouts are excluded.' : ', and no rollout may be invalid.')
  );

  if (run.maximum_reward !== null) {
    infos.push(
      PREFIX + 'Note: customData rewardBlockCriteriaMaxReward is ' + displayNumber(run.maximum_reward) +
        '; this validator gates on the break-every-model rule, not on that value.'
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
        'internally consistent. All ' + run.broken_models + ' valid model rollout' +
        (run.broken_models === 1 ? '' : 's') + ' broken (' + listed(run.models.filter(isBroken).map(modelName)) +
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
  var solved = valid.filter(function (m) { return m.reward === 1; });
  var invalid = models.filter(function (m) { return m.valid !== true; });

  // Gate: every model must be broken (reward 0). One solved model fails the task.
  if (!valid.length) {
    findings.errors.push('no model has a valid rollout; the break count is undefined and the evaluation must be rerun');
  } else if (solved.length) {
    findings.errors.push(
      'not every model was broken: ' + listed(solved.map(modelName)) +
        ' reached reward 1, but the task must break every model in the ' +
        'roster (reward 0) in ' + EXPECTED_ATTEMPTS + ' attempt; ' + broken.length + ' of ' + models.length +
        ' model' + (models.length === 1 ? ' was' : 's were') + ' broken'
    );
  }

  if (invalid.length) {
    if (ALLOW_INVALID_EXCLUSION) {
      findings.warnings.push(
        listed(invalid.map(modelName)) + (invalid.length === 1 ? ' has an invalid rollout' : ' have invalid rollouts') +
          ' and ' + (invalid.length === 1 ? 'is' : 'are') + ' excluded from the break count; report the reduced roster ' +
          'explicitly to the client'
      );
    } else {
      findings.errors.push(
        listed(invalid.map(modelName)) + (invalid.length === 1 ? ' has an invalid rollout' : ' have invalid rollouts') +
          ', so ' + (invalid.length === 1 ? 'that model is' : 'those models are') + ' not proven broken; every model ' +
          'must have a valid rollout with reward 0 — rerun the evaluation for ' +
          (invalid.length === 1 ? 'that model' : 'those models')
      );
    }
  }

  return {
    ratings_source: located.name,
    run_id: result.run_id,
    models: models,
    valid_models: valid.length,
    broken_models: broken.length,
    solved_models: solved.length,
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
    return 'invalid rollout, ' + (ALLOW_INVALID_EXCLUSION ? 'excluded' : 'not proven broken') +
      (model.trial.invalid_reason_detail ? ' (' + model.trial.invalid_reason_detail + ')' : '');
  }
  if (model.reward === 0) return 'reward 0 — BROKEN';
  if (model.reward === 1) return 'reward 1 — SOLVED (fails the every-model-broken gate)';
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
return validate;
} // ===== end pass-at-1-reward-validation-1180 =====
