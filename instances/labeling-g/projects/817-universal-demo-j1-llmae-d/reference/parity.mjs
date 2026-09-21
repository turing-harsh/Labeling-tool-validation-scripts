// Parity harness: runs every fixture zip through BOTH the Python checker in this folder and
// validation.js, in all three profiles, and reports any finding either one raises alone.
// Usage: node instances/labeling-g/projects/817-universal-demo-j1-llmae-d/reference/parity.mjs
// Needs python3 (3.11+ for tomllib) and the system `unzip`.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runValidation } from "../../../../../scripts/wrapper.mjs";

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const proj = dirname(dirname(fileURLToPath(import.meta.url)));
const zipDir = `${proj}/fixtures/zips`;
const script = readFileSync(`${proj}/validation.js`, "utf8");
const PY = `${proj}/reference/deterministic_task_validation.py`;

const norm = (s) =>
  s.replace(/^ADVISORY /, "").replace(/^.*\| Problem: /, "").replace(/\. \| Fix:.*$/, "").replace(/\.$/, "").trim();

let mismatches = 0;
for (const zip of readdirSync(zipDir).filter((f) => f.endsWith(".zip")).sort()) {
  const staging = mkdtempSync(join(tmpdir(), "parity-"));
  try {
    execFileSync("unzip", ["-qq", join(zipDir, zip), "-d", staging]);
    const target = join(staging, "root");
    for (const profile of ["upload", "audit", "delivery"]) {
      // The checker exits 1 whenever a task fails, so read stdout either way.
      let raw;
      try {
        raw = execFileSync("python3", [PY, target, "--profile", profile, "--json"], { encoding: "utf8" });
      } catch (e) {
        if (!e.stdout) throw e;
        raw = String(e.stdout);
      }
      const payload = JSON.parse(raw);
      const pyMsgs = payload.tasks
        .flatMap((t) => [...t.errors, ...t.warnings])
        .map((m) => m.replace(/^ADVISORY /, "").trim())
        .concat(payload.nested.map(() => "NESTED"))
        .sort();
      const got = await runValidation(
        script,
        { ratings: { taskFolder: `https://storage.googleapis.com/b/p/${zip}`, validationProfile: profile } },
        { zipDir }
      );
      const jsMsgs = [...got.errors, ...got.warnings]
        .map(norm)
        .map((m) => (m.includes("sits inside another package") ? "NESTED" : m))
        .sort();
      const onlyPy = pyMsgs.filter((m) => !jsMsgs.includes(m));
      const onlyJs = jsMsgs.filter((m) => !pyMsgs.includes(m));
      const status = onlyPy.length || onlyJs.length ? "DIFF" : "same";
      if (status === "DIFF") {
        mismatches++;
        console.log(`\n${status}  ${zip} [${profile}]`);
        if (onlyPy.length) console.log("  only python:\n    " + onlyPy.join("\n    "));
        if (onlyJs.length) console.log("  only script:\n    " + onlyJs.join("\n    "));
      } else {
        console.log(`same  ${zip} [${profile}] — ${pyMsgs.length} finding(s), py err ${payload.tasks.reduce((n, t) => n + t.errors.length, 0)} / js err ${got.errors.length}`);
      }
    }
  } catch (e) {
    console.log(`ERROR ${zip}: ${e.stdout ? String(e.stdout).slice(0, 400) : e.message}`);
    mismatches++;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}
console.log(`\n${mismatches} mismatch(es)`);
