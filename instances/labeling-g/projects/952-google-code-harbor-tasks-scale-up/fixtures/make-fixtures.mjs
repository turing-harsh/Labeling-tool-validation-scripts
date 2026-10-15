#!/usr/bin/env node
// Regenerates fixtures/folders/<FOLDER_ID>/ and fixtures/cases.json for project 952.
//
// Each case gets a small SYNTHETIC Harbor package laid out like the real task folder verified
// in golden/folders/ (task.toml, instruction.md, environment/{Dockerfile,project/},
// solution/{solve.sh,reference/}, tests/{Dockerfile,test.sh,run_all.py,test_*.py}), plus the
// FormV2 "task" value the tool stores for it: { googleDriveFolderLink, lastModifiedAt,
// renderFolderData }. renderFolderData is derived from the same files with the tool's size
// rendering ("599 B", "1.3 KB"), so a case is in sync unless it deliberately skews the two.
//
// The real package is client data and stays in the gitignored golden/folders/; these fixtures
// carry the same shape with placeholder contents, so `npm test` needs no credentials.
//
// Also rebuilds golden/1287090.txt from the real export when both inputs are present.
//
// Run: node instances/labeling-g/projects/952-google-code-harbor-tasks-scale-up/fixtures/make-fixtures.mjs
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projDir = join(here, "..");
const outDir = join(here, "folders");

// ------------------------------------------------------------------ synthetic package

const TOML = `schema_version = "1.3"

[task]
name = "thcast/sample_debug_task"
description = "Repair a deterministic offline scoring engine."
authors = [{ name = "Sample Author", email = "author@example.com" }]
keywords = ["mle", "mle-debugging", "python"]

[metadata]
benchmark_type = "semi-open"
difficulty = "hard"
category = "MLE-debugging"
family = "MLE"
subdomain = "MLE Debugging"
task_type = "Semi-Open"
expert_time_estimate_hours = 12
difficulty_explanation = "Several interacting invariants."

[environment]
os = "linux"
network_mode = "no-network"
environment_mode = "separate"
build_timeout_sec = 1200
cpus = 2
memory_mb = 4096
storage_mb = 10240
gpus = 0
workdir = "/app/project"

[agent]
timeout_sec = 3600
user = "root"

[verifier]
timeout_sec = 600
user = "root"
`;

const ENV_DOCKERFILE = `FROM --platform=linux/amd64 python:3.11.9-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /app/project
COPY project/ /app/project/
CMD ["sh"]
`;

const TESTS_DOCKERFILE = `FROM --platform=linux/amd64 python:3.11.9-slim-bookworm
COPY . /tests/
RUN mkdir -p /logs/verifier
CMD ["sh","/tests/test.sh"]
`;

const TEST_SH = `#!/bin/sh
set -eu
PROJECT_ROOT="\${TASK_PROJECT_ROOT:-/app/project}"
TEST_ROOT="\${TASK_TEST_ROOT:-/tests}"
LOG_ROOT="\${HCAST_LOG_ROOT:-/logs/verifier}"
mkdir -p "$LOG_ROOT"
printf '0\\n' > "$LOG_ROOT/reward.txt"
if ! PYTHONPATH="$PROJECT_ROOT" python3 "$TEST_ROOT/run_all.py" --start-directory "$TEST_ROOT" > "$LOG_ROOT/unit.log" 2>&1; then
  cat "$LOG_ROOT/unit.log"
  exit 1
fi
printf '1\\n' > "$LOG_ROOT/reward.txt"
`;

const SOLVE_SH = `#!/bin/sh
set -eu
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="\${TASK_PROJECT_ROOT:-/app/project}"
cp "$SCRIPT_DIR/reference/engine.py" "$PROJECT_ROOT/engine.py"
`;

const RUN_ALL = `import argparse, sys, unittest
p = argparse.ArgumentParser(); p.add_argument("--start-directory", required=True)
a = p.parse_args()
r = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.discover(a.start_directory))
sys.exit(0 if r.wasSuccessful() else 1)
`;

const TEST_ENGINE = `import unittest
from engine import run


class TestEngine(unittest.TestCase):
    def test_returns_score(self):
        self.assertEqual(run({"x": 1})["score"], 1)

    def test_is_deterministic(self):
        self.assertEqual(run({"x": 2}), run({"x": 2}))
`;

function basePackage() {
  return {
    "task.toml": TOML,
    "instruction.md": "# Sample Debug Task\n\nRepair engine.run(payload) so it returns a stable score.\n",
    "environment/Dockerfile": ENV_DOCKERFILE,
    "environment/.dockerignore": "__pycache__/\n",
    "environment/project/engine.py": "def run(payload):\n    raise NotImplementedError\n",
    "environment/project/SPEC.md": "# Spec\n\nengine.run(payload) returns {\"score\": int}.\n",
    "solution/solve.sh": SOLVE_SH,
    "solution/reference/engine.py": "def run(payload):\n    return {\"score\": 1}\n",
    "tests/Dockerfile": TESTS_DOCKERFILE,
    "tests/test.sh": TEST_SH,
    "tests/run_all.py": RUN_ALL,
    "tests/test_engine.py": TEST_ENGINE,
  };
}

// ------------------------------------------------------------------ FormV2 tree

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MIME = { ".py": "text/x-python-script", ".md": "text/markdown", ".sh": "text/x-sh", ".json": "application/json", ".txt": "text/plain" };
const mimeOf = (path) => MIME[(path.match(/\.[^./]+$/) || [""])[0]] || "";

let nodeSeq = 0;
// { "<path>": content | { size } } -> renderFolderData (the folder's root entries).
function renderTree(entries, mimeTypes = {}) {
  const root = { children: [] };
  for (const path of Object.keys(entries).sort()) {
    const parts = path.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      let child = node.children.find((c) => c.type === "folder" && c.name === parts[i]);
      if (!child) {
        child = { children: [], id: `node-${++nodeSeq}`, name: parts[i], type: "folder" };
        node.children.push(child);
      }
      node = child;
    }
    const value = entries[path];
    const bytes = typeof value === "object" ? value.size : Buffer.byteLength(value, "utf8");
    const fileId = `FILE${String(++nodeSeq).padStart(30, "0")}`;
    node.children.push({
      driveFileId: fileId,
      id: `node-${nodeSeq}`,
      mimeType: mimeTypes[path] ?? mimeOf(path),
      modified: "10/1/2026",
      name: parts[parts.length - 1],
      size: formatSize(bytes),
      type: "file",
      url: `https://drive.google.com/uc?export=download&id=${fileId}`,
    });
  }
  return root.children;
}

const MODIFIED_AT = "2026-10-01T14:20:48.414Z";

function conversation({ folderId, task, taskName = "sample_debug_task" }) {
  return {
    conversation: {
      input: {
        metadata: {
          "Drive Link": `https://drive.google.com/open?id=${folderId}&usp=drive_copy`,
          "Programming Language": "Python",
          "Task Domain": "MLE",
          "Task Name": taskName,
          "Task Sub-Domain": "MLE Debugging",
          projectId: 952,
        },
      },
      ratings: task === undefined ? {} : { task },
    },
  };
}

// ------------------------------------------------------------------ cases

const cases = [];
let folderSeq = 0;

// One case: `drive` is what Drive holds; `form` defaults to the same files. Folders are
// collected here and written once at the end, after the output directory is cleaned.
const savedFolders = [];
function add(name, { drive, form, formMimes, task, taskName, expect }) {
  const folderId = `FOLDER952${String(++folderSeq).padStart(20, "0")}`;
  if (drive) savedFolders.push({ folderId, drive });
  const taskValue = task !== undefined ? task : drive === undefined ? undefined : {
    value: {
      googleDriveFolderLink: `https://drive.google.com/drive/folders/${folderId}`,
      lastModifiedAt: MODIFIED_AT,
      renderFolderData: renderTree(form || drive, formMimes),
    },
  };
  cases.push({ name, conversationData: conversation({ folderId, task: taskValue, taskName }), expect });
}

const pkg = (mutate) => { const p = basePackage(); mutate?.(p); return p; };

add("valid package -> pass, no warnings", {
  drive: pkg(),
  expect: {
    errors: [], warnings: [],
    infosContain: ["in sync"],
    successesContain: ["passes all checks"],
  },
});

add("Drive holds a file the form never submitted -> sync error, content checks stand down", {
  drive: pkg((p) => { p["tests/test_extra.py"] = "x = 1\n"; p["task.toml"] = "not = [valid"; }),
  form: pkg(),
  expect: {
    errorsContain: ["were not in the submitted form: tests/test_extra.py"],
    errorsNotContain: ["task.toml is not valid TOML"],
    infosContain: ["Content checks (task.toml, Dockerfiles, entry points) were NOT run"],
  },
});

add("form lists a file that is gone from Drive -> sync error", {
  drive: pkg((p) => { delete p["environment/project/SPEC.md"]; }),
  form: pkg(),
  expect: { errorsContain: ["no longer in the Drive folder: environment/project/SPEC.md"] },
});

add("file edited after submission (size drift) -> sync error", {
  drive: pkg((p) => { p["solution/reference/engine.py"] += "# a much longer edit that changes the size of this file\n".repeat(3); }),
  form: pkg(),
  expect: { errorsContain: ["changed size since the form was submitted: solution/reference/engine.py"] },
});

add("Google Doc in the folder -> form lists it, Drive cannot read it", {
  drive: pkg(),
  form: pkg((p) => { p["NOTES"] = { size: 0 }; }),
  formMimes: { NOTES: "application/vnd.google-apps.document" },
  expect: { errorsContain: ["no longer in the Drive folder: NOTES"] },
});

add("task field has no folder link -> error", {
  task: { value: { lastModifiedAt: MODIFIED_AT, renderFolderData: [] } },
  expect: { errorsContain: ["holds no Google Drive folder link"] },
});

add("task field missing entirely -> error", {
  task: undefined,
  expect: { errorsContain: ["holds no Google Drive folder link"] },
});

add("structure: stray root file, missing solve.sh, junk -> errors + warning", {
  drive: pkg((p) => { p["notes.txt"] = "todo\n"; delete p["solution/solve.sh"]; p["tests/.DS_Store"] = "junk"; }),
  expect: {
    errorsContain: ["file(s) outside the Harbor layout: notes.txt", "required file(s) are missing or empty: solution/solve.sh"],
    warningsContain: ["may not be relevant: tests/.DS_Store"],
  },
});

add("parent folder linked -> package one level down", {
  drive: Object.fromEntries(Object.entries(basePackage()).map(([k, v]) => [`sample_debug_task/${k}`, v])),
  expect: { errorsContain: ["the package sits one level down, inside sample_debug_task/"] },
});

add("Dockerfiles: non-root USER, missing COPY source, leak, runtime pip with no network -> errors", {
  drive: pkg((p) => {
    p["environment/Dockerfile"] = ENV_DOCKERFILE.replace("CMD", "COPY data/ /app/data/\nCOPY ../solution /solution\nRUN pip install numpy\nUSER agent\nCMD");
    p["tests/test.sh"] = TEST_SH.replace("mkdir -p", "pip install pytest\nmkdir -p");
  }),
  expect: {
    errorsContain: [
      "non-root USER (agent)",
      "copies path(s) that are in neither environment/ nor the task root: data (checked against environment/)",
      "copies material the agent must not see: ../solution",
      "installs dependencies at run time (pip install)",
    ],
    warningsContain: ["pip-installs unpinned package(s): numpy"],
  },
});

add("tests/Dockerfile without COPY . /tests/ and solve.sh pointing at a missing file -> errors", {
  drive: pkg((p) => {
    p["tests/Dockerfile"] = TESTS_DOCKERFILE.replace("COPY . /tests/\n", "");
    p["solution/solve.sh"] = SOLVE_SH + 'cp -R "$SCRIPT_DIR/reference/lib" "$PROJECT_ROOT/lib"\n';
  }),
  expect: {
    errorsContain: ["tests/Dockerfile copies nothing into /tests"],
    warningsContain: ["solution/solve.sh uses file(s) that are not in the package: solution/reference/lib"],
  },
});

// The verifier image built from the TASK ROOT (seen in batch 1): named files copied into /tests,
// the project copied from environment/project/. Both are valid -- no finding.
add("tests/Dockerfile built from the task root -> no finding", {
  drive: pkg((p) => {
    p["tests/Dockerfile"] = `FROM --platform=linux/amd64 node:22.14.0-bookworm-slim
WORKDIR /app/project
COPY environment/project/ /app/project/
COPY tests/test_engine.py tests/run_all.py tests/test.sh /tests/
RUN chmod 0500 /tests/test.sh
CMD ["/bin/bash"]
`;
    p["environment/Dockerfile"] = ENV_DOCKERFILE.replace("COPY project/ /app/project/", "COPY environment/project/ /app/project/");
  }),
  expect: { errors: [], warnings: [] },
});

add("agent image built from the task root copies tests/ -> leak error", {
  drive: pkg((p) => {
    p["environment/Dockerfile"] = ENV_DOCKERFILE.replace("COPY project/ /app/project/", "COPY environment/project/ /app/project/\nCOPY tests/ /app/tests/");
  }),
  expect: { errorsContain: ["copies material the agent must not see: tests/"] },
});

add("root-context verifier image with a missing file -> error names the task root", {
  drive: pkg((p) => {
    p["tests/Dockerfile"] = "FROM python:3.11\nCOPY tests/test.sh tests/missing.py /tests/\n";
  }),
  expect: { errorsContain: ["tests/Dockerfile copies path(s) that are in neither tests/ nor the task root: tests/missing.py (checked against the task root)"] },
});

add("task.toml: wrong task linked, blank authors, no benchmark_type, bad timeout", {
  drive: pkg((p) => {
    p["task.toml"] = TOML
      .replace('name = "thcast/sample_debug_task"', 'name = "other/another_task"')
      .replace('[{ name = "Sample Author", email = "author@example.com" }]', '[{ name = "", email = "" }]')
      .replace('benchmark_type = "semi-open"\n', "")
      .replace("timeout_sec = 600", 'timeout_sec = "ten minutes"');
  }),
  expect: {
    errorsContain: ['[task] name is "other/another_task" but this task is "sample_debug_task"', "[verifier] timeout_sec"],
    warningsContain: ['does not start with "thcast/"'],
    warningsNotContain: ["authors", "benchmark_type"],
  },
});

add("task.toml does not parse -> error", {
  drive: pkg((p) => { p["task.toml"] = '[task\nname = "x"\n'; }),
  expect: { errorsContain: ["task.toml is not valid TOML"] },
});

add("multi-step task: declared step folder missing -> error", {
  drive: pkg((p) => {
    p["task.toml"] = TOML + '\n[[steps]]\nname = "first"\n\n[[steps]]\nname = "second"\n';
    p["steps/first/instruction.md"] = "Do the first part.\n";
    p["steps/first/tests/test.sh"] = TEST_SH;
    delete p["instruction.md"];
  }),
  expect: {
    errorsContain: ['[[steps]] declares "second" but steps/second/ does not exist'],
    errorsNotContain: ['step "first"'],
  },
});

add("batch-1 patterns: task_idea.md blocks; no tests/Dockerfile, runtime paths, no workdir only warn", {
  drive: pkg((p) => {
    delete p["tests/Dockerfile"];
    p["task_idea.md"] = "Idea.\n";
    p["task.toml"] = TOML.replace('workdir = "/app/project"\n', "").replace(/authors = .*\n/, "").replace('benchmark_type = "semi-open"\n', "");
    p["tests/test.sh"] = TEST_SH.replace("mkdir -p", 'rm -rf "$TEST_ROOT/__pycache__"\ncp -R "$TEST_ROOT/../environment/app" /tmp/app\nmkdir -p');
  }),
  expect: {
    errorsContain: ["file(s) outside the Harbor layout: task_idea.md"],
    errorsNotContain: ["tests/Dockerfile"],
    warningsContain: ['environment_mode = "separate" but tests/Dockerfile is missing'],
    warningsNotContain: ["workdir", "authors", "benchmark_type", "uses file(s) that are not in the package"],
  },
});

// ------------------------------------------------------------------ write

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const { folderId, drive } of savedFolders) {
  for (const [path, content] of Object.entries(drive)) {
    const p = join(outDir, folderId, path);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
}
writeFileSync(join(here, "cases.json"), JSON.stringify(cases, null, 2) + "\n");
console.log(`wrote ${cases.length} case(s) and ${savedFolders.length} folder fixture(s)`);

// ------------------------------------------------------------------ golden

// golden/1287090.txt: the real export (conversation 1287090) with its task field rebuilt as the
// FormV2 value from the mirrored folder, so `npm run golden` exercises the real package. Needs
// the export at $GOLDEN_EXPORT (default ~/Downloads/1287090.json) and golden/folders/<id>/.
const GOLDEN_FOLDER = "1IhG9sG9Gses3zmZtmKOm0WojRXM-v4aJ";
const exportPath = process.env.GOLDEN_EXPORT || join(process.env.HOME || "", "Downloads", "1287090.json");
const goldenFolder = join(projDir, "golden", "folders", GOLDEN_FOLDER);
if (existsSync(exportPath) && existsSync(goldenFolder)) {
  const sidecar = join(goldenFolder, ".mimetypes.json");
  const mimes = existsSync(sidecar) ? JSON.parse(readFileSync(sidecar, "utf8")) : {};
  const entries = {};
  (function walk(dir, prefix) {
    for (const name of readdirSync(dir)) {
      if (name === ".mimetypes.json") continue;
      const p = join(dir, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      if (statSync(p).isDirectory()) walk(p, rel);
      else entries[rel] = { size: statSync(p).size };
    }
  })(goldenFolder, "");
  const data = JSON.parse(readFileSync(exportPath, "utf8"));
  const task = {
    value: {
      googleDriveFolderLink: `https://drive.google.com/drive/folders/${GOLDEN_FOLDER}`,
      lastModifiedAt: "2026-10-01T14:20:48.414Z",
      renderFolderData: renderTree(entries, Object.fromEntries(Object.keys(entries).map((k) => [k, mimes[k] ?? mimeOf(k)]))),
    },
  };
  data.conversation.ratings.task = task;
  writeFileSync(join(projDir, "golden", "1287090.txt"), JSON.stringify(data, null, 2) + "\n");
  console.log(`wrote golden/1287090.txt (${Object.keys(entries).length} files in the form tree)`);
}
