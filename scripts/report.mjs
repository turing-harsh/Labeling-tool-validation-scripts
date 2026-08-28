#!/usr/bin/env node
// Batch quality report: run a validation script over a full batch export and write an .xlsx.
// Usage:
//   node scripts/report.mjs <batch.json> <path/to/validation.js> [output.xlsx]
// Batch export shape: { sft: [...], form: { <idx>: { taskId, formData: { ratings } } } }
import { readFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { createRequire } from "node:module";
import { runValidation } from "./wrapper.mjs";

const require = createRequire(import.meta.url);
let XLSX;
try {
  XLSX = require("xlsx");
} catch {
  console.error('The "xlsx" package is required. Run: npm install');
  process.exit(1);
}

const [batchArg, scriptArg, outArg] = process.argv.slice(2);
if (!batchArg || !scriptArg) {
  console.error("Usage: node scripts/report.mjs <batch.json> <validation.js> [output.xlsx]");
  process.exit(1);
}

const batchPath = resolve(batchArg);
const scriptPath = resolve(scriptArg);
const outputPath = outArg ? resolve(outArg) : batchPath.replace(/\.json$/i, "") + "_Quality.xlsx";

const batch = JSON.parse(readFileSync(batchPath, "utf8"));
const userScript = readFileSync(scriptPath, "utf8");
const sftById = {};
for (const s of batch.sft || []) sftById[s.id] = s;
const formKeys = Object.keys(batch.form || {}).sort((a, b) => Number(a) - Number(b));

console.log(`Batch:  ${batchPath}`);
console.log(`Script: ${scriptPath}`);
console.log(`Tasks:  ${formKeys.length}\n`);

const results = [];
let n = 0;
for (const idx of formKeys) {
  const task = batch.form[idx];
  const sft = sftById[task.taskId];
  const conversationData = { ratings: task.formData?.ratings, task_data: task.formData };
  const r = await runValidation(userScript, conversationData);
  results.push({
    taskId: task.taskId,
    status: r.errors.length > 0 ? "FAIL" : "PASS",
    trainer: sft?.currentUser?.name || sft?.humanUser?.name || "—",
    trainerEmail: sft?.currentUser?.turingEmail || sft?.humanUser?.turingEmail || "—",
    errorCount: r.errors.length,
    warningCount: r.warnings.length,
    colabLink: sft?.colabLink || "—",
    errorDetail: r.errors.join("\n\n"),
    warningDetail: r.warnings.join("\n"),
  });
  if (++n % 25 === 0) console.log(`  ${n}/${formKeys.length}...`);
}

const total = results.length;
const passed = results.filter((r) => r.status === "PASS").length;
const failed = total - passed;
const passRate = total ? ((passed / total) * 100).toFixed(1) + "%" : "—";

const wb = XLSX.utils.book_new();
const project = batch.sft?.[0]?.project?.name || basename(batchPath, ".json");
const summary = [
  ["Validation Report — " + basename(batchPath, ".json")],
  ["Project", project],
  ["Script", basename(scriptPath)],
  [],
  ["Metric", "Value"],
  ["Total tasks", total],
  ["Passed", passed],
  ["Failed", failed],
  ["Pass rate", passRate],
  ["Total errors", results.reduce((s, r) => s + r.errorCount, 0)],
  ["Total warnings", results.reduce((s, r) => s + r.warningCount, 0)],
  [],
  ["Note: PASS = 0 errors. Warnings do not affect pass/fail."],
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

const header = ["Task ID", "Status", "Trainer", "Trainer email", "Errors", "Warnings", "Colab link", "Error detail", "Warning detail"];
const rows = (filter) => [header, ...results.filter(filter).map((r) => [r.taskId, r.status, r.trainer, r.trainerEmail, r.errorCount, r.warningCount, r.colabLink, r.errorDetail, r.warningDetail])];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows((r) => r.status === "FAIL")), "Failed Tasks");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows(() => true)), "All Tasks");

XLSX.writeFile(wb, outputPath);
console.log(`\nReport: ${outputPath}`);
console.log(`Total ${total} | Passed ${passed} | Failed ${failed} | Pass rate ${passRate}`);
