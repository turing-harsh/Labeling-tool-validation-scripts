// Where validation scripts live. A script sits either at project level or, mirroring
// agentic-reviewer-qd, at pipeline level -- one script per review pipeline of a project:
//
//   instances/<instance>/projects/<project>/validation.js                      id: instance/project
//   instances/<instance>/projects/<project>/pipelines/<pipeline>/validation.js  id: instance/project/pipeline
//
// Every per-script tool (run-tests, run-golden, fetch-folder, fetch-artifacts) addresses a
// script by that id.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const TARGET_USAGE = "<instance>/<project>[/<pipeline>]";

// The directory holding the script for `target`, or null when the id is malformed.
export function targetDir(root, target) {
  const parts = String(target || "").split("/").filter(Boolean);
  if (parts.length === 2) return join(root, "instances", parts[0], "projects", parts[1]);
  if (parts.length === 3) return join(root, "instances", parts[0], "projects", parts[1], "pipelines", parts[2]);
  return null;
}

const subdirs = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory()) : [];

// Every script location in the repo: each project, and each pipeline under a project's pipelines/.
export function discoverTargets(root) {
  const found = [];
  const instancesDir = join(root, "instances");
  for (const instance of subdirs(instancesDir)) {
    const projectsDir = join(instancesDir, instance, "projects");
    for (const project of subdirs(projectsDir)) {
      const projectDir = join(projectsDir, project);
      const pipelinesDir = join(projectDir, "pipelines");
      const pipelines = subdirs(pipelinesDir);
      // A project with a pipelines/ folder is a grouping folder only, as in agentic-reviewer-qd.
      if (!pipelines.length) found.push({ id: `${instance}/${project}`, dir: projectDir });
      for (const pipeline of pipelines) {
        found.push({ id: `${instance}/${project}/${pipeline}`, dir: join(pipelinesDir, pipeline) });
      }
    }
  }
  return found;
}
