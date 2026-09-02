// i18n-continuity-validator-944 -- Layer L2 (fetched-artifact content): the F check register
// from requirements.md §8-§9 (F-01..F-05). Added v2.0.0.
//
// ARCHITECTURE: a second sub-validator alongside validateI18nContinuityL1 (parts/
// i18n-continuity-checks.js), called independently by the top-level `validate(conversationData)`
// wrapper in validation.js -- mirrors 939-continuity-en-us's validateContinuity/validate903 pair.
// This file re-resolves the payload shape for itself rather than sharing state with L1, exactly
// like 939's two sub-validators do.
//
// Fetch mechanism (requirements §8): every artifact field already governed by §6/§7 is fetched
// via the sandbox-injected `fetchDataFromDriveLink`, but ONLY once it resolves to exactly one
// clean URL free of pasted-debug/HTML markers (a field carrying a U-01/U-02/U-03/U-04/U-06
// finding is left to those checks -- this file never re-raises them). Fetches run CONCURRENTLY
// via Promise.allSettled (never a serial await-in-loop -- build-asserted, requirements §20),
// with one retry on an empty/failed read.
//
// NO in-script timers: the production isolate (isolated-vm, run-checks-api script-executor)
// injects ONLY conversationData and the fetch helpers -- `setTimeout` does not exist there, and
// referencing it broke every fetch with "setTimeout is not defined" (v2.0.1 fix). Timeout
// enforcement is host-side: the drive-fetcher races each fetch against its own configured
// timeout (rejecting with "Drive fetch timed out after Nms", which lands here as F-01), and the
// API aborts all outstanding fetches when the 30s script budget ends (requirements §8).
//
// CHECK IDS IMPLEMENTED: F-01 F-02 F-03 F-04 F-05

async function validateFetchLayer(conversationData) {
  const VERSION = 'i18n-continuity-validator-944-L2-v2.0.4';
  const errorsBefore = errors.length;
  const warningsBefore = warnings.length;

  const CFG = /*__GENERATED_CFG__*/ null;
  if (!CFG) return; // L1 already reported the missing-tables error; do not double-report.

  // ===== adapter (duplicated from L1 by design -- see file header) =====
  const findByShape = (root, isMatch, maxDepth = 5) => {
    const seen = new Set();
    const queue = [{ node: root, path: 'conversationData', depth: 0 }];
    while (queue.length) {
      const { node, path, depth } = queue.shift();
      if (!node || typeof node !== 'object' || depth > maxDepth) continue;
      if (seen.has(node)) continue;
      seen.add(node);
      if (isMatch(node)) return { value: node, path };
      for (const [k, v] of Object.entries(node)) {
        if (v && typeof v === 'object') queue.push({ node: v, path: `${path}.${k}`, depth: depth + 1 });
      }
    }
    return null;
  };
  const KNOWN_KEYS = new Set([...Object.keys(CFG.labels), ...CFG.sxsKeys]);
  const baseOf = (k) => { if (typeof k !== 'string') return ''; const p = k.split('.'); return p[p.length - 1]; };
  const knownHits = (keys) => keys.reduce((n, k) => n + (KNOWN_KEYS.has(baseOf(k)) ? 1 : 0), 0);
  const looksLikeRatings = (n) => {
    if (Array.isArray(n)) {
      if (n.length === 0 || !n.every((e) => e && typeof e === 'object' && typeof e.key === 'string')) return false;
      return knownHits(n.map((e) => e.key)) >= 3;
    }
    if (n && typeof n === 'object') {
      const keys = Object.keys(n);
      if (keys.length < 3) return false;
      const holders = keys.filter((k) => { const v = n[k]; return v === null || typeof v !== 'object' || 'value' in v || 'human_input_value' in v; });
      if (holders.length < keys.length * 0.8) return false;
      return knownHits(keys) >= 3;
    }
    return false;
  };
  const unwrap = (v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('human_input_value' in v) return v.human_input_value;
      if ('value' in v) return v.value;
      return null;
    }
    return v;
  };
  const ratingsHit = findByShape(conversationData, looksLikeRatings);
  if (!ratingsHit) { logs.push(`${VERSION}: no ratings root found -- L1 already reports this; fetch layer self-skips.`); return; }
  const ratings = ratingsHit.value;
  const byKey = {};
  if (Array.isArray(ratings)) { for (const r of ratings) if (r && typeof r.key === 'string') byKey[r.key] = unwrap(r); }
  else { for (const [k, v] of Object.entries(ratings)) byKey[k] = unwrap(v); }

  const strVal = (v) => (typeof v === 'string' ? v.trim() : (v === null || v === undefined ? '' : String(v).trim()));
  const isBlank = (v) => v === null || v === undefined || v === false || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
  const normalizeText = (s) => strVal(s).normalize('NFC').replace(/[​-‍﻿]/g, '').replace(/[‘’‛′]/g, "'").replace(/[“”″]/g, '"').replace(/[‐-―−﹘﹣－]/g, '-').replace(/\s+/g, ' ').trim();
  const eqNorm = (a, b) => normalizeText(a) === normalizeText(b);
  const canonEnv = (s) => normalizeText(s).toLowerCase().replace(/_/g, '.').replace(/\s*\.\s*/g, '.').replace(/^[\s.]+|[\s.]+$/g, '').trim();
  const parseIntSafe = (v) => { const s = normalizeText(v); if (!/^\d+$/.test(s)) return null; const n = parseInt(s, 10); return Number.isFinite(n) ? n : null; };
  const labelOf = (fieldKey) => CFG.labels[baseOf(fieldKey)] || fieldKey;

  const envByCanon = new Map([[canonEnv(CFG.modelA), 'Model A'], [canonEnv(CFG.modelB), 'Model B']]);
  const nsFieldMap = new Map();
  for (const fullKey of Object.keys(byKey)) {
    for (const q of CFG.sxsKeys) {
      if (fullKey === q || !fullKey.endsWith('.' + q)) continue;
      const ns = fullKey.slice(0, fullKey.length - q.length - 1);
      if (!ns || baseOf(ns) === '__config__') break;
      const c = canonEnv(ns);
      let matched = envByCanon.has(c) ? c : null;
      if (!matched) for (const ec of envByCanon.keys()) { if (c.endsWith('.' + ec)) { matched = ec; break; } }
      if (matched) { if (!nsFieldMap.has(matched)) nsFieldMap.set(matched, {}); nsFieldMap.get(matched)[q] = fullKey; }
      break;
    }
  }
  const sides = [{ scope: 'Model A', name: CFG.modelA }, { scope: 'Model B', name: CFG.modelB }].map((s) => {
    const c = canonEnv(s.name);
    const fmap = nsFieldMap.get(c) || null;
    const get = (q) => (fmap && fmap[q] !== undefined ? byKey[fmap[q]] : undefined);
    const keyOf = (q) => (fmap && fmap[q] !== undefined ? fmap[q] : q);
    return { ...s, present: !!fmap, get, keyOf };
  });
  const presentSides = sides.filter((s) => s.present);
  const threadSlot = (k) => `topicConversationsHtml${k}`;
  const DEBUG_SLOTS = ['testResponse1DebugInfo', 'testResponse2DebugInfo', 'model1TestResponse3DebugInfo', 'model1TestResponse4DebugInfo', 'model1TestResponse5DebugInfo'];

  // ===== findings (same contract as L1: Problem|Fix|Why, requirements §19) =====
  const err = (scopeLabel, fieldKey, headline, action, evidence) => {
    let m = `${scopeLabel} -- "${labelOf(fieldKey)}" | Problem: ${headline} | Fix: ${action}`;
    if (evidence) m += ` | Why: ${evidence}`;
    errors.push(m);
  };
  const warn = (scopeLabel, fieldKey, headline, action, evidence) => {
    let m = `${scopeLabel} -- "${labelOf(fieldKey)}" | Problem: ${headline} | Fix: ${action}`;
    if (evidence) m += ` | Why: ${evidence}`;
    warnings.push(m);
  };

  // ===== URL extraction (precondition: passed U-01..U-06 as exactly one clean URL -- §8) =====
  const URL_RE = /https?:\/\/[^\s'"<>]+/gi;
  const isDriveFolderUrl = (u) => /https?:\/\/drive\.google\.com\/drive\/[^\s]*folders\//i.test(strVal(u));
  const PASTED_DEBUG_MARKERS = ['<ctrl99>', '<ctrl100>', 'LM Prefix', 'Model ID:', 'num_turns_read_from_footprints', 'BAS->', 'reagent_trace'];
  const PASTED_HTML_RE = /<!doctype|<html|<head|<body|<div|<span class/i;
  const driveId = (u) => {
    const s = strVal(u);
    let m = s.match(/\/d\/([^/?#\s]+)/i); if (m) return m[1];
    m = s.match(/[?&]id=([^&#\s]+)/i); if (m) return m[1];
    return normalizeText(s);
  };
  const extractCleanUrl = (raw) => {
    const s = strVal(raw);
    if (isBlank(s)) return null;
    if (PASTED_DEBUG_MARKERS.some((mk) => s.includes(mk))) return null; // U-01 owns pasted debug
    if (PASTED_HTML_RE.test(s)) return null; // U-02 owns pasted page source
    const urls = s.match(URL_RE) || [];
    if (urls.length !== 1) return null; // U-03/U-04 own zero/multi-link fields
    if (isDriveFolderUrl(urls[0])) return null; // U-06 owns folder links
    return urls[0];
  };
  // The tool's fetch helper hard-rejects any URL that is not a drive.google.com file link
  // (its isGoogleDriveUrl gate), so "attempting" another host (docs.google.com included) is a
  // guaranteed failure that would escalate U-07's warn into an F-01 error. Skip those with a
  // log instead -- U-07 owns the host question.
  const isFetchableDriveUrl = (u) => /https?:\/\/(www\.)?drive\.google\.com\/(file\/d\/|open\?id=)/i.test(u);

  // ===== candidate artifact fields =====
  // Two families remain after v2.0.4: 'debug' (text retained -- F-02, F-05) and 'html'
  // (prefix + fingerprint only -- F-03, F-04). The 'takeout' family is gone; see below.
  const candidates = []; // { scopeLabel, fieldKey, family: 'debug'|'html', url, turn? }
  const addCandidate = (scopeLabel, fieldKey, family, raw, extra) => {
    const u = extractCleanUrl(raw);
    if (!u) return;
    if (!isFetchableDriveUrl(u)) {
      logs.push(`${VERSION}: not fetched (host the Drive helper cannot read; the link-shape checks own it): ${fieldKey} -> ${u}`);
      return;
    }
    candidates.push({ scopeLabel, fieldKey, family, url: u, ...(extra || {}) });
  };
  for (let k = 1; k <= 10; k++) addCandidate('Task', threadSlot(k), 'html', byKey[threadSlot(k)]);
  // geminiConversationHistory is deliberately NOT fetched (v2.0.4, requirements §8). A Takeout
  // export is the one artifact class with no size ceiling -- 0.67MB on task 1264318, 1.20MB on
  // 1264388, 18.20MB on 1264206 -- and the host fetcher JSON.parses it before handing it over,
  // so the object graph alone can blow the isolate's 256MB cap before a single check runs. On
  // 1264206 that killed the whole script ("Promise was abandoned": isolated-vm disposes the
  // isolate on the memory limit, which rejects the pending fetch promise). The link-shape
  // checks (§6/§7: U-family, D-01) still cover this field; F-03's takeout half is withdrawn.
  if (extractCleanUrl(byKey['geminiConversationHistory'])) logs.push(`${VERSION}: geminiConversationHistory is not fetched by design (unbounded Takeout size, §8); link-shape checks still apply.`);
  for (const side of presentSides) {
    addCandidate(side.scope, side.keyOf('model1HtmlFileUpload'), 'html', side.get('model1HtmlFileUpload'));
    for (let k = 0; k < DEBUG_SLOTS.length; k++) {
      addCandidate(side.scope, side.keyOf(DEBUG_SLOTS[k]), 'debug', side.get(DEBUG_SLOTS[k]), { turn: k + 1, side: side.scope });
    }
  }

  if (candidates.length === 0) { logs.push(`${VERSION}: no clean single-URL artifact fields to fetch.`); return; }

  // ===== fetch, concurrently (Promise.allSettled -- never a serial await-in-loop) =====
  // No in-script timeout race: the isolate has no timers (see file header); the host
  // drive-fetcher enforces its own per-fetch timeout and rejects, which lands here as F-01.
  const attemptOnce = async (url) => {
    try {
      const c = await fetchDataFromDriveLink(url);
      if (typeof c === 'string' && c.trim().length > 0) return { ok: true, content: c };
      if (c !== null && c !== undefined && typeof c !== 'string') {
        // The host fetcher JSON.parses the bytes and hands over the parsed value when a file
        // is JSON -- re-serialise so content checks see text. Since v2.0.4 no candidate is
        // expected to be JSON (the Takeout field is no longer fetched); this is a fallback.
        return { ok: true, content: JSON.stringify(c) };
      }
      return { ok: false, reason: 'empty read' };
    } catch (e) {
      return { ok: false, reason: (e && e.message) ? e.message : String(e) };
    }
  };
  // The retry is deadline-gated (v2.0.4): a dead link burns a full host timeout, and on a task
  // with many slots the second round can push the script past the 30s budget -- which surfaces
  // as "Promise was abandoned", not as a finding. Past the gate, report the first failure.
  const RETRY_DEADLINE_MS = 12000;
  const tStart = Date.now();
  const fetchWithRetry = async (url) => {
    const first = await attemptOnce(url);
    if (first.ok) return first;
    if (Date.now() - tStart > RETRY_DEADLINE_MS) return { ok: false, reason: `${first.reason} (no retry: fetch budget spent)` };
    const second = await attemptOnce(url); // one retry on an empty/failed read (requirements §8)
    return second.ok ? second : { ok: false, reason: `${second.reason} (after one retry)` };
  };

  const t0 = Date.now();
  const settled = await Promise.allSettled(candidates.map((c) => fetchWithRetry(c.url)));
  logs.push(`${VERSION}: fetched ${candidates.length} artifact link(s) in ${Date.now() - t0}ms.`);

  // ===== decode: literal <ctrl99> markers => always plain text, never decode; else if the
  // fetched bytes are HTML-shaped, entity-decode + strip tags (requirements §8) =====
  const HTML_HEAD_RE = /^\s*(<!doctype|<html|<head|<meta)/i;
  const decodeEntities = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  const stripTags = (s) => s.replace(/<[^>]+>/g, ' ');
  const decodeIfHtmlShaped = (raw) => {
    if (typeof raw !== 'string') return '';
    if (raw.includes('<ctrl99>')) return raw; // literal markers -> never decode
    if (HTML_HEAD_RE.test(raw.slice(0, 400)) || /&lt;ctrl99&gt;/.test(raw)) return decodeEntities(stripTags(raw));
    return raw;
  };
  // ===== memory discipline (v2.0.4) =====
  // The isolate is capped at 256MB and a task's artifacts can be tens of MB (task 1264206:
  // 38.3MB over 9 files, four HTML uploads of 4.6-5.5MB each). v2.0.3 retained THREE full
  // copies of every artifact -- content, decoded, normalized -- and JS strings are UTF-16, so
  // the retained set alone was ~2x the fetched bytes per copy. Peak RSS on 1264206 measured
  // 849MB; the isolate died and every pending promise rejected as "Promise was abandoned".
  //
  // Only the debug family needs its text kept (F-05 counts turn markers in it, and those files
  // are small -- 68-175KB on 1264206). For html, the checks need a bounded prefix (F-03 tests
  // the leading bytes for page markers) and an identity fingerprint (F-04), never the bytes
  // themselves. So each result is reduced to {prefix, len, hash} and the full string is
  // dropped, letting the fetched bytes be collected as the loop advances.
  const PREFIX_CHARS = 4096;
  // djb2/xor over the raw content: one pass, no intermediate strings. F-04 identity is now
  // raw-byte identity (length + hash) rather than post-normalisation identity -- narrower, and
  // arguably more faithful to what F-04 asks ("is this a re-uploaded copy of the same file?").
  const hashOf = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
  const fingerprint = (s) => `${s.length}:${hashOf(s)}`;

  const DEBUG_MARKERS = ['<ctrl99>', 'Model ID:', 'LM Prefix', 'num_turns_read_from_footprints'];
  const HTML_MARKERS = ['<!doctype', '<html', '<head', '<body'];
  // Confirmed on the real golden sample (task 1264318): a Takeout export is a JSON array of
  // activity records, not an HTML page -- keys observed: header/title/time/products/details/
  // activityControls/safeHtmlItem. Some records may omit a field, so require >=2 of these keys
  // on a majority of the sampled records rather than an exact key set.
  const results = []; // { ...candidate, ok, decoded (debug only), fp, id }
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const r = settled[i].status === 'fulfilled' ? settled[i].value : { ok: false, reason: settled[i].reason ? String(settled[i].reason) : 'rejected' };
    // Release this slot's reference to the fetched bytes as soon as it is in hand, so an
    // already-checked multi-MB artifact can be collected while the loop is still running.
    settled[i] = null;
    if (!r.ok) {
      err(c.scopeLabel, c.fieldKey, `the linked file could not be retrieved.`, `confirm the file is shared and the link still resolves, then re-paste it if needed.`, `${r.reason || 'fetch failed'}; link: ${c.url}`);
      results.push({ ...c, ok: false });
      continue;
    }
    const fp = fingerprint(r.content);
    if (c.family === 'debug') {
      // Decode BEFORE the marker check: an HTML/Doc export of the debug text hides the
      // literal <ctrl99> markers inside tags until stripped (requirements §8).
      // Debug captures are the one family whose full text is retained -- F-05 counts turn
      // markers across all of it, and these files are small (68-175KB on task 1264206).
      const decoded = decodeIfHtmlShaped(r.content);
      const hasMarker = DEBUG_MARKERS.some((mk) => decoded.toLowerCase().includes(mk.toLowerCase()));
      if (!hasMarker) {
        err(c.scopeLabel, c.fieldKey, `the linked file does not look like a debug capture.`, `confirm this is the right file -- it should be the exported Gemini debug info for this turn.`, `link: ${c.url}`);
        results.push({ ...c, ok: false });
        continue;
      }
      results.push({ ...c, ok: true, decoded, fp, id: driveId(c.url) });
      continue;
    }
    // family === 'html': check the RAW bytes for tag markers -- do NOT strip tags first, that
    // would remove the very markers being looked for. Scan a bounded prefix, not the whole
    // page: a saved conversation page runs to megabytes and lowercasing it whole allocates a
    // second copy of it for no added signal -- every marker sought is in the document head.
    {
      const head = r.content.slice(0, PREFIX_CHARS).toLowerCase();
      const hasMarker = HTML_MARKERS.some((mk) => head.includes(mk));
      if (!hasMarker) {
        err(c.scopeLabel, c.fieldKey, `the linked file does not look like a saved conversation page.`, `confirm this is the right file -- it should be the saved HTML page, not some other export.`, `link: ${c.url}`);
        results.push({ ...c, ok: false });
        continue;
      }
    }
    // No text retained for html: F-04 needs identity, which the fingerprint carries.
    results.push({ ...c, ok: true, fp, id: driveId(c.url) });
  }

  // ===== F-04: different Drive ids, byte-identical (post-normalisation) content -- warn =====
  {
    const byContent = new Map();
    for (const r of results) {
      if (!r.ok) continue;
      if (!byContent.has(r.fp)) byContent.set(r.fp, []);
      byContent.get(r.fp).push(r);
    }
    for (const [, group] of byContent) {
      const distinctIds = [...new Set(group.map((g) => g.id))];
      if (distinctIds.length < 2) continue; // same id is D-01's job, not F-04's
      const anchor = group[group.length - 1];
      const others = group.slice(0, -1).map((g) => `${g.scopeLabel} "${labelOf(g.fieldKey)}"`).join(', ');
      warn(anchor.scopeLabel, anchor.fieldKey, `this artifact's content is identical to ${group.length - 1} other slot${group.length - 1 === 1 ? '' : 's'} (${others}) despite being a different Drive file.`, `confirm this isn't a re-uploaded copy of the same capture under a new name.`, `distinct Drive file ids: ${distinctIds.join(', ')}.`);
    }
  }

  // ===== F-05: side's fetched-debug turn count vs its declared numberOfTurns =====
  // Count "<ctrl99>user" turn-OPEN markers, not full "<ctrl99>user\n...<ctrl100>" blocks: real
  // captures vary in what follows the role token -- LF in the golden sample, CRLF in a
  // Windows-saved file, tags in a Doc/HTML export, "\n" as two literal characters when the blob
  // arrives JSON-encoded. The v2.0.1 strict-block regex counted 0 on a production task whose
  // debug did carry the markers (F-02 passed on the same bytes), false-blocking both sides --
  // exactly the class of failure F-05 must never produce. \b keeps "username" from counting;
  // /i keeps "User" from escaping.
  const countCtrl99 = (text) => (String(text).match(/<ctrl99>user\b/gi) || []).length;
  for (const side of presentSides) {
    const declaredStr = strVal(side.get('numberOfTurns'));
    const declared = parseIntSafe(declaredStr);
    if (declared === null) continue; // R-05 owns an unreadable turn count

    const sideDebugResults = results.filter((r) => r.family === 'debug' && r.side === side.scope && r.turn <= declared);
    // Non-fire: any contributing slot (1..declared) failed to fetch or failed the debug-marker
    // check, or was never a candidate at all (blank/malformed link -- R-07/U-family own those).
    const attemptedTurns = new Set(candidates.filter((c) => c.family === 'debug' && c.side === side.scope && c.turn <= declared).map((c) => c.turn));
    const allTurnsAttempted = Array.from({ length: Math.min(declared, 5) }, (_, i) => i + 1).every((t) => attemptedTurns.has(t));
    const allOk = sideDebugResults.length === Math.min(declared, 5) && sideDebugResults.every((r) => r.ok);
    if (!allTurnsAttempted || !allOk) continue;

    // Two debug-export shapes are both legitimate, and v2.0.2's sum-across-files rule only
    // matched one of them:
    //   CUMULATIVE (observed on the FIRST completed MT task, 1264388) -- each turn's capture
    //     carries the whole conversation so far, so turn t shows t "<ctrl99>user" markers and
    //     the sum over turns is 1+2+...+declared, not declared. Model A summed 3 for declared=2
    //     and Model B summed 6 for declared=3: a pure false block on correct captures.
    //   FLAT -- each capture carries only its own turn (1 marker per file), so the sum is
    //     declared. This is what v2.0.2 assumed and what every ST task (declared=1) looks like.
    // Fire only when the counts fit NEITHER shape; that still catches captures exported for the
    // wrong turns (e.g. 1/1/4) while never blocking a well-formed export of either kind.
    const perTurn = sideDebugResults.map((r) => ({ turn: r.turn, count: countCtrl99(r.decoded) }));
    const totalBlocks = perTurn.reduce((n, p) => n + p.count, 0);
    const fitsCumulative = perTurn.every((p) => p.count === p.turn);
    // Compare against the number of slots actually fetched, not `declared`: the form caps debug
    // slots at 5, so a 6-turn side legitimately contributes 5 files under either shape.
    const fitsFlat = totalBlocks === sideDebugResults.length;
    if (!fitsCumulative && !fitsFlat) {
      // Self-diagnosing log: show the (escaped) bytes around the first marker of each file, so
      // a surprise format shows its true shape in the tool's run log instead of needing a
      // local repro. Logs are not rater-facing (requirements SS19).
      for (const r of sideDebugResults) {
        const i = r.decoded.indexOf('<ctrl99>');
        const ctx = i < 0 ? '(no <ctrl99> in decoded text)' : JSON.stringify(r.decoded.slice(Math.max(0, i - 40), i + 100));
        logs.push(`${VERSION}: F-05 diagnostic ${side.scope} turn ${r.turn}: userMarkers=${countCtrl99(r.decoded)}, firstMarkerAt=${i}, context=${ctx}`.slice(0, 900));
      }
      const anchor = sideDebugResults[sideDebugResults.length - 1];
      const observed = perTurn.reduce((m, p) => Math.max(m, p.count), 0);
      err(side.scope, anchor.fieldKey, `the fetched debug shows ${observed} turn${observed === 1 ? '' : 's'} of model activity, but this side declares ${declared}.`, `confirm the debug captures were exported for the right turns, and that the turn count is correct.`, `"<ctrl99>user" turn marker(s) per debug file: ${perTurn.map((p) => `turn ${p.turn}=${p.count}`).join(', ')}; declared numberOfTurns=${declared}.`);
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  logs.push(`${VERSION}: L2 fetch-layer validation complete. candidates=${candidates.length}, ok=${okCount}, failed=${results.length - okCount}.`);
  if (errors.length === errorsBefore && warnings.length === warningsBefore && okCount > 0) {
    successes.push(`All ${okCount} linked artifact${okCount === 1 ? '' : 's'} fetched and content-checked.`);
  }
}
