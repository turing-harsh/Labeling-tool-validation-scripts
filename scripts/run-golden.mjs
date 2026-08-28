#!/usr/bin/env node
// Run a project's golden sample data through its validation script and print findings.
// Golden files are sample task payloads (no assertions) — see <project>/golden/README.md.
// Usage:
//   node scripts/run-golden.mjs <instance/slug>            # all golden files
//   node scripts/run-golden.mjs <instance/slug> <file>     # one file (path or golden/<name>)
import { readdirSync, existsSync, readFileSync, statSync } from "node:fs";
import { join, dirname, basename, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { runValidation } from "./wrapper.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];
const oneFile = process.argv[3];

if (!target || !target.includes("/")) {
  console.error("Usage: node scripts/run-golden.mjs <instance/slug> [file]");
  process.exit(1);
}

const [instance, slug] = target.split("/");
const projDir = join(root, "instances", instance, "projects", slug);
const scriptPath = join(projDir, "validation.js");
const goldenDir = join(projDir, "golden");

if (!existsSync(scriptPath)) {
  console.error(`No validation.js at ${scriptPath}`);
  process.exit(1);
}
if (!existsSync(goldenDir)) {
  console.error(`No golden/ folder at ${goldenDir}`);
  process.exit(1);
}

const userScript = readFileSync(scriptPath, "utf8");
const artifactsDir = join(goldenDir, "artifacts");
const fetchDir = existsSync(artifactsDir) ? artifactsDir : undefined;
if (fetchDir) console.log(`(fetch-mock active: resolving Drive links from ${artifactsDir})`);

// Collect golden files (skip README and dotfiles), or the one requested.
let files;
if (oneFile) {
  const p = isAbsolute(oneFile) ? oneFile : join(projDir, oneFile);
  files = [existsSync(p) ? p : join(goldenDir, basename(oneFile))];
} else {
  files = readdirSync(goldenDir)
    .filter((f) => /\.(txt|json)$/i.test(f) && !/^readme/i.test(f))
    .map((f) => join(goldenDir, f));
}

if (files.length === 0) {
  console.log("No golden files yet. Add a .txt with one conversationData JSON — see golden/README.md.");
  process.exit(0);
}

// Turn one file's parsed JSON into a list of { label, conversationData }.
function toTasks(name, data) {
  if (data && typeof data === "object" && data.form && typeof data.form === "object") {
    // Batch export.
    return Object.keys(data.form).map((idx) => {
      const t = data.form[idx];
      return {
        label: `${name}#${t.taskId ?? idx}`,
        conversationData: { ratings: t.formData?.ratings, task_data: t.formData, ...t.formData },
      };
    });
  }
  if (Array.isArray(data)) {
    return data.map((cd, i) => ({ label: `${name}[${i}]`, conversationData: cd }));
  }
  return [{ label: name, conversationData: data }];
}

function fmt(arr) {
  return arr.length === 0 ? "  (none)" : arr.map((x) => `  - ${x}`).join("\n");
}

let ran = 0, failed = 0;
for (const file of files) {
  if (!existsSync(file) || statSync(file).isDirectory()) {
    console.log(`SKIP ${file} (not found)`);
    continue;
  }
  const name = basename(file);
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.log(`\n=== ${name} ===\n  PARSE ERROR: ${e.message} (file must contain one JSON object/array)`);
    failed++;
    continue;
  }

  for (const task of toTasks(name, data)) {
    ran++;
    const r = await runValidation(userScript, task.conversationData ?? {}, { fetchDir });
    const status = r.errors.length === 0 ? "PASS" : "FAIL";
    if (status === "FAIL") failed++;
    console.log(`\n=== ${task.label} — ${status} (${r.errors.length} error, ${r.warnings.length} warning) ===`);
    console.log("errors:\n" + fmt(r.errors));
    if (r.warnings.length) console.log("warnings:\n" + fmt(r.warnings));
    if (r.successes.length) console.log("successes:\n" + fmt(r.successes));
  }
}

console.log(`\n${ran} task(s) run, ${failed} with errors.`);
