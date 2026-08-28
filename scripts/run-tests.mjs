#!/usr/bin/env node
// Run every project's fixtures through the sandbox wrapper (same one the tool uses).
// Usage:
//   node scripts/run-tests.mjs                     # all projects
//   node scripts/run-tests.mjs labeling-g          # one instance
//   node scripts/run-tests.mjs labeling-g/my-proj  # one project
import { readdirSync, existsSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runValidation } from "./wrapper.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const filter = process.argv[2] || "";

// Discover instances/<instance>/projects/<slug>.
const projects = [];
const instancesDir = join(root, "instances");
for (const instance of readdirSync(instancesDir)) {
  const projectsDir = join(instancesDir, instance, "projects");
  if (!existsSync(projectsDir)) continue;
  for (const slug of readdirSync(projectsDir)) {
    const dir = join(projectsDir, slug);
    if (!statSync(dir).isDirectory()) continue;
    const id = `${instance}/${slug}`;
    if (filter && !id.startsWith(filter)) continue;
    projects.push({ id, dir });
  }
}

if (projects.length === 0) {
  console.log(filter ? `No projects match "${filter}".` : "No projects yet.");
  process.exit(0);
}

const containsAll = (arr, wants) =>
  wants.filter((w) => !arr.some((x) => String(x).includes(w)));

let failed = 0, totalCases = 0;
for (const { id, dir } of projects) {
  const scriptPath = join(dir, "validation.js");
  const casesPath = join(dir, "fixtures", "cases.json");
  if (!existsSync(scriptPath) || !existsSync(casesPath)) {
    console.log(`SKIP  ${id} (missing validation.js or fixtures/cases.json)`);
    continue;
  }

  const userScript = readFileSync(scriptPath, "utf8");

  // Mirror the tool's save-time gates so a script that passes here is acceptable there.
  if (!userScript.includes("function validate(conversationData)")) {
    failed++;
    console.log(`FAIL  ${id}: script must contain the literal "function validate(conversationData)" (the tool rejects it otherwise)`);
    continue;
  }
  const sizeKb = Buffer.byteLength(userScript, "utf8") / 1024;
  if (sizeKb > 100) {
    // The default run-checks-api maxScriptSize is 100KB, but instances raise it
    // (labeling-g stores scripts well over this). Warn, don't fail.
    console.log(`warn  ${id}: script is ${sizeKb.toFixed(1)}KB (over the 100KB default; ensure this instance's limit allows it)`);
  }

  let cases;
  try {
    cases = JSON.parse(readFileSync(casesPath, "utf8"));
  } catch (e) {
    failed++;
    console.log(`ERROR ${id}: bad cases.json — ${e.message}`);
    continue;
  }

  for (const c of cases) {
    totalCases++;
    const got = await runValidation(userScript, c.conversationData ?? {});
    const exp = c.expect || {};
    const problems = [];

    if (Array.isArray(exp.errors)) {
      if (exp.errors.length === 0 && got.errors.length > 0)
        problems.push(`expected PASS but got errors: ${JSON.stringify(got.errors)}`);
      if (exp.errors.length > 0) {
        const missing = containsAll(got.errors, exp.errors);
        if (missing.length) problems.push(`missing errors: ${JSON.stringify(missing)}`);
      }
    }
    for (const [field, key] of [["errorsContain", "errors"], ["warningsContain", "warnings"], ["successesContain", "successes"], ["infosContain", "infos"]]) {
      if (Array.isArray(exp[field])) {
        const missing = containsAll(got[key], exp[field]);
        if (missing.length) problems.push(`${key} missing: ${JSON.stringify(missing)} (got ${JSON.stringify(got[key])})`);
      }
    }
    if (exp.pass === true && got.errors.length > 0)
      problems.push(`expected PASS but got errors: ${JSON.stringify(got.errors)}`);
    if (exp.pass === false && got.errors.length === 0)
      problems.push(`expected FAIL but got no errors`);

    if (problems.length) {
      failed++;
      console.log(`FAIL  ${id} › ${c.name}: ${problems.join("; ")}`);
    } else {
      console.log(`ok    ${id} › ${c.name}`);
    }
  }
}

console.log(`\n${totalCases} cases, ${failed} failed across ${projects.length} project(s).`);
process.exit(failed ? 1 : 0);
