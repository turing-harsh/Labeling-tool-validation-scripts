#!/usr/bin/env node
// Scaffold a new project from templates/.
// Usage: node scripts/new-project.mjs <instance> <project-slug>
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , instance, slug] = process.argv;

if (!instance || !slug) {
  console.error("Usage: node scripts/new-project.mjs <instance> <project-slug>");
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`Bad slug "${slug}": use kebab-case (a-z, 0-9, -).`);
  process.exit(1);
}

const dest = join(root, "instances", instance, "projects", slug);
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
    .replaceAll("<PROJECT>", slug);
  writeFileSync(p, filled);
}

console.log(`Created ${join("instances", instance, "projects", slug)}`);
console.log("Next: edit validation.js + requirements.md, add cases to fixtures/cases.json, then `npm test`.");
