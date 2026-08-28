// Local mirror of the labeling-tool sandbox (constants.ts `buildSandboxScript`).
// Runs a validation script exactly as the tool does: injects the global arrays +
// drive/gcs helper stubs, calls validate(conversationData), collects the results.
// Keep this in sync with the tool's buildSandboxScript so local == production.
import vm from "node:vm";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Optional local Drive fetch-mock: resolve a Drive link's file id to
// <fetchDir>/<id>.txt or <id>.html so the debug/HTML pipeline can run offline.
function makeDriveFetch(fetchDir) {
  if (!fetchDir) return undefined;
  const idOf = (link) => {
    let m = String(link).match(/\/file\/d\/([^/?#\s]+)/i); if (m) return m[1];
    m = String(link).match(/[?&]id=([^&#\s]+)/i); return m ? m[1] : null;
  };
  return (link) => {
    const id = idOf(link);
    if (!id) return null;
    for (const ext of ['txt', 'html', 'json']) {
      const p = join(fetchDir, `${id}.${ext}`);
      if (existsSync(p)) return readFileSync(p, 'utf8');
    }
    return null;
  };
}

function buildSandboxSource(userScript) {
  return `
  "use strict";
  const errors = [];
  const warnings = [];
  const infos = [];
  const successes = [];
  const logs = [];

  const fetchDataFromDriveLink = async (link) => {
    if (typeof __driveFetch === 'function') {
      const r = __driveFetch(String(link));
      if (r != null) return r;
      throw new Error('404 not found (no local artifact mapped for this link)');
    }
    throw new Error('fetchDataFromDriveLink is not available in local execution mode.');
  };
  const fetchDataFromDriveZip = async (link) => {
    throw new Error('fetchDataFromDriveZip is not available in local execution mode.');
  };
  const fetchDataFromGcsLink = async (link) => {
    throw new Error('fetchDataFromGcsLink is not available in local execution mode.');
  };

  ${userScript}

  (async () => {
    try {
      if (typeof validate === 'function') {
        const r = validate(conversationData);
        if (r && typeof r.then === 'function') await r;
      } else {
        errors.push('Validate function is not defined or is not a function. Type: ' + typeof validate);
      }
    } catch (error) {
      const msg = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
      errors.push('Validation error: ' + msg);
      if (error && typeof error === 'object' && 'stack' in error) logs.push('Error stack: ' + String(error.stack));
    }

    const sanitize = (arr) => Array.isArray(arr)
      ? arr.filter(i => typeof i === 'string').slice(0, 100).map(s => String(s).slice(0, 1000))
      : [];

    return JSON.stringify({
      errors: sanitize(errors),
      warnings: sanitize(warnings),
      infos: sanitize(infos),
      successes: sanitize(successes),
      logs: sanitize(logs),
    });
  })();
  `;
}

const EMPTY = { errors: [], warnings: [], infos: [], successes: [], logs: [] };

/**
 * Run a validation script against one conversationData object.
 * @returns {Promise<{errors,warnings,infos,successes,logs}>}
 */
export async function runValidation(userScript, conversationData, { timeoutMs = 30000, fetchDir } = {}) {
  const source = buildSandboxSource(userScript);
  const sandbox = {
    conversationData,
    __driveFetch: makeDriveFetch(fetchDir),
    console: { log: () => {}, error: () => {}, warn: () => {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    Promise, JSON,
    Object, Array, Map, Set, RegExp, Number, String, Math, Date, Error,
    parseInt, parseFloat, isNaN, isFinite,
    encodeURIComponent, decodeURIComponent, encodeURI, decodeURI,
  };
  vm.createContext(sandbox);
  try {
    const script = new vm.Script(source, { filename: "validation-sandbox.js" });
    const resultJson = await script.runInContext(sandbox, { timeout: timeoutMs });
    return { ...EMPTY, ...JSON.parse(resultJson) };
  } catch (err) {
    return { ...EMPTY, errors: [`Script execution failed: ${err.message}`], logs: [err.stack || ""] };
  }
}
