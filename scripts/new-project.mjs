#!/usr/bin/env node
// Scaffold a new project script, or a pipeline script inside a project, from templates/.
// Usage:
//   node scripts/new-project.mjs <instance> <project-slug>                   # project-level script
//   node scripts/new-project.mjs <instance> <project-slug> <pipeline-slug>   # pipeline-level script
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { targetDir } from "./targets.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , instance, slug, pipeline] = process.argv;

if (!instance || !slug) {
  console.error("Usage: node scripts/new-project.mjs <instance> <project-slug> [pipeline-slug]");
  process.exit(1);
}
for (const name of pipeline ? [slug, pipeline] : [slug]) {
  if (!/^[a-z0-9-]+$/.test(name)) {
    console.error(`Bad slug "${name}": use kebab-case (a-z, 0-9, -).`);
    process.exit(1);
  }
}

const target = pipeline ? `${instance}/${slug}/${pipeline}` : `${instance}/${slug}`;
const dest = targetDir(root, target);
if (existsSync(dest)) {
  console.error(`Already exists: ${dest}`);
  process.exit(1);
}

const tpl = join(root, "templates");
mkdirSync(dest, { recursive: true });
cpSync(tpl, dest, { recursive: true });

// Fill in placeholders across the copied text files.
for (const rel of ["validation.js", "metadata.yml", "requirements.md", "golden/README.md"]) {
  const p = join(dest, rel);
  const filled = readFileSync(p, "utf8")
    .replaceAll("<INSTANCE>", instance)
    .replaceAll("<PROJECT>", pipeline ? `${slug}/${pipeline}` : slug);
  writeFileSync(p, filled);
}

console.log(`Created ${dest.slice(root.length + 1)}`);
console.log("Next: edit validation.js + requirements.md, add cases to fixtures/cases.json, then `npm test`.");
