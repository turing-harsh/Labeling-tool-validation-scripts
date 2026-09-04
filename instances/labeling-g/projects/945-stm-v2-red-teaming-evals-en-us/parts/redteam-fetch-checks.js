// redteam-stm-validator-945 -- Layer L2 (fetched-artifact content): the F check register
// (requirements.md SS8-SS9), the A content-anchoring register (SS10) and the debug half of
// identity (I-01, I-02, SS11).
//
// ARCHITECTURE: a second sub-validator alongside validateRedTeamL1 (parts/redteam-checks.js),
// called independently by the top-level `validate(conversationData)` wrapper in validation.js.
// This file re-resolves the payload shape for itself rather than sharing state with L1.
//
// Fetch mechanism (SS8): every artifact field already governed by SS6/SS7 is fetched via the
// sandbox-injected `fetchDataFromDriveLink`, but ONLY once it resolves to exactly one clean
// drive.google.com FILE url free of pasted-debug/HTML markers (a field carrying a U-01/U-02/
// U-03/U-04/U-06 finding is left to those checks -- this file never re-raises them; a U-07
// non-Drive host is logged, never fetched, because the helper hard-rejects it). Fetches run
// CONCURRENTLY via Promise.allSettled (never a serial await-in-loop -- build-asserted, SS21),
// with one retry on an empty/failed read.
//
// NO in-script timers: the production isolate injects ONLY conversationData and the fetch
// helpers -- `setTimeout` does not exist there, and referencing it broke every fetch with
// "setTimeout is not defined" (944 v2.0.1 incident). Timeout enforcement is host-side.
//
// MEMORY DISCIPLINE (944 v2.0.4 incident): the isolate is capped at 256MB and a saved
// conversation page runs to megabytes (4.4MB and 4.1MB on golden task 1267698). No fetched
// artifact's full text is retained. Debug captures are reduced, as they arrive, to their user
// blocks plus the two scalar facts the checks need (Agency config id, PContext call presence);
// HTML and Takeout to a bounded prefix and an identity fingerprint.
//
// CHECK IDS IMPLEMENTED: F-01 F-02 F-03 F-04 F-05 F-06 F-07 F-08 F-09  A-01 A-02 A-03 A-04 A-05
//                        I-01 I-02

async function validateRedTeamFetchLayer(conversationData) {
  const VERSION = 'redteam-stm-validator-945-L2-v1.0.3';
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

  // ===== SS2 normalisation ladder (same function as L1) =====
  const OMISSION_MARKERS = [];
  const strVal = (v) => (typeof v === 'string' ? v.trim() : (v === null || v === undefined ? '' : String(v).trim()));
  const stripOmissionMarkers = (s) => { let out = String(s); for (const mk of OMISSION_MARKERS) out = out.split(mk).join(' '); return out; };
  const isBlank = (v) => v === null || v === undefined || v === false || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
  const normalizeText = (s) => stripOmissionMarkers(strVal(s)).normalize('NFC')
    .replace(/[​-‍﻿]/g, '').replace(/[‘’‛′]/g, "'").replace(/[“”″]/g, '"')
    .replace(/[‐-―−﹘﹣－]/g, '-').replace(/\s+/g, ' ').trim();
  const eqNorm = (a, b) => normalizeText(a) === normalizeText(b);
  const canonEnv = (s) => normalizeText(s).toLowerCase().replace(/\s*-\s*/g, ' - ').replace(/\s+/g, ' ').trim();
  const parseIntSafe = (v) => { const s = normalizeText(v); if (!/^\d+$/.test(s)) return null; const n = parseInt(s, 10); return Number.isFinite(n) ? n : null; };
  const labelOf = (fieldKey) => CFG.labels[baseOf(fieldKey)] || fieldKey;
  const preview = (v, n = 80) => { const s = normalizeText(v); return s.length > n ? s.slice(0, n) + '...' : s; };

  const TEST_NAME = CFG.modelA;
  const BASE_NAME = CFG.modelB;
  const envByCanon = new Map([[canonEnv(TEST_NAME), 'Test side'], [canonEnv(BASE_NAME), 'Base side']]);
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
  const mkSide = (scope, name, role) => {
    const c = canonEnv(name);
    const fmap = nsFieldMap.get(c) || null;
    const get = (q) => (fmap && fmap[q] !== undefined ? byKey[fmap[q]] : undefined);
    const keyOf = (q) => (fmap && fmap[q] !== undefined ? fmap[q] : q);
    return { scope, name, role, present: !!fmap, get, keyOf };
  };
  const testSide = mkSide('Test side', TEST_NAME, 'test');
  const baseSide = mkSide('Base side', BASE_NAME, 'base');
  const presentSides = [testSide, baseSide].filter((s) => s.present);
  const DEBUG_SLOTS = ['debugInfoTurn1', 'debugInfoTurn2', 'debugInfoTurn3', 'debugInfoTurn4', 'debugInfoTurn5'];

  // ===== findings (same contract as L1: Problem|Fix|Why, SS20) =====
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

  // ===== URL extraction (precondition: passed U-01..U-06 as exactly one clean URL -- SS8) =====
  const URL_RE = /https?:\/\/[^\s'"<>]+/gi;
  const PASTED_DEBUG_MARKERS = ['\x3cctrl99>', 'LM prefix', 'Agency config id', 'Recipe ID', 'num_turns_read_from_footprints', 'BAS->', 'reagent_trace'];
  const PASTED_HTML_RE = /\x3c!doctype|\x3chtml|\x3chead|\x3cbody|\x3cdiv/i;
  const isDriveFolderUrl = (u) => /https?:\/\/drive\.google\.com\/[^\s]*\/folders\//i.test(strVal(u));
  const driveId = (u) => {
    const s = strVal(u);
    let m = s.match(/\/d\/([^/?#\s]+)/i); if (m) return m[1];
    m = s.match(/[?&]id=([^&#\s]+)/i); if (m) return m[1];
    return normalizeText(s);
  };
  const extractCleanUrl = (raw) => {
    const s = strVal(raw);
    if (isBlank(s)) return null;
    const lower = s.toLowerCase();
    if (PASTED_DEBUG_MARKERS.some((mk) => lower.includes(mk.toLowerCase()))) return null; // U-01
    if (PASTED_HTML_RE.test(s)) return null;                                              // U-02
    const urls = s.match(URL_RE) || [];
    if (urls.length !== 1) return null;                                                   // U-03/U-04
    if (isDriveFolderUrl(urls[0])) return null;                                           // U-06
    return urls[0];
  };
  // The tool's fetch helper hard-rejects any URL that is not a drive.google.com file link, so
  // "attempting" another host is a guaranteed failure that would escalate U-07's warn into an
  // F-01 error. Skip those with a log instead -- U-07 owns the host question.
  const isFetchableDriveUrl = (u) => /https?:\/\/(www\.)?drive\.google\.com\/(file\/d\/|open\?id=|uc\?)/i.test(u);

  // ===== candidates =====
  const candidates = []; // { scopeLabel, fieldKey, family, url, turn?, role? }
  const addCandidate = (scopeLabel, fieldKey, family, raw, extra) => {
    const u = extractCleanUrl(raw);
    if (!u) return;
    if (!isFetchableDriveUrl(u)) {
      logs.push(`${VERSION}: not fetched (host the Drive helper cannot read; the link-shape checks own it): ${fieldKey} -> ${u}`);
      return;
    }
    candidates.push({ scopeLabel, fieldKey, family, url: u, ...(extra || {}) });
  };
  addCandidate('Task', 'geminiTakeout', 'takeout', byKey['geminiTakeout']);
  const declaredTurns = new Map();
  for (const side of presentSides) {
    const n = parseIntSafe(side.get('numberOfTurns'));
    const ok = n !== null && n >= 1 && n <= 5;
    declaredTurns.set(side.role, ok ? n : null);
    addCandidate(side.scope, side.keyOf('htmlExport'), 'html', side.get('htmlExport'), { role: side.role });
    const upTo = ok ? n : 5; // R-04 owns an unreadable count; still fetch what is there
    for (let k = 1; k <= upTo; k++) {
      addCandidate(side.scope, side.keyOf(DEBUG_SLOTS[k - 1]), 'debug', side.get(DEBUG_SLOTS[k - 1]), { turn: k, role: side.role });
    }
  }

  if (candidates.length === 0) { logs.push(`${VERSION}: no clean single-URL artifact fields to fetch -- L2 self-skips.`); return; }

  // ===== fetch, concurrently (Promise.allSettled -- never a serial await-in-loop) =====
  const attemptOnce = async (url) => {
    try {
      const c = await fetchDataFromDriveLink(url);
      if (typeof c === 'string' && c.trim().length > 0) return { ok: true, content: c };
      // The host fetcher JSON.parses the bytes and hands over the parsed value for JSON files
      // (a Gemini Takeout "My Activity" export arrives as a parsed array).
      if (c !== null && c !== undefined && typeof c !== 'string') return { ok: true, parsed: c };
      return { ok: false, reason: 'empty read' };
    } catch (e) {
      return { ok: false, reason: (e && e.message) ? e.message : String(e) };
    }
  };
  const RETRY_DEADLINE_MS = 12000;
  const tStart = Date.now();
  const fetchWithRetry = async (url) => {
    const first = await attemptOnce(url);
    if (first.ok) return first;
    if (Date.now() - tStart > RETRY_DEADLINE_MS) return { ok: false, reason: `${first.reason} (no retry: fetch budget spent)` };
    const second = await attemptOnce(url);
    return second.ok ? second : { ok: false, reason: `${second.reason} (after one retry)` };
  };

  const t0 = Date.now();
  const settled = await Promise.allSettled(candidates.map((c) => fetchWithRetry(c.url)));
  logs.push(`${VERSION}: fetched ${candidates.length} artifact link(s) in ${Date.now() - t0}ms.`);

  // ===== decode (SS2 / SS8): literal markers => never decode; otherwise entity-decode,
  // un-escape "\<" / "\>" (Drive's text renderer escapes them), and strip tags =====
  const decodeEntities = (s) => s.replace(/\x26lt;/g, '<').replace(/\x26gt;/g, '>').replace(/\x26amp;/g, '&').replace(/\x26quot;/g, '"').replace(/\x26#39;/g, "'").replace(/\x26nbsp;/g, ' ');
  const HTML_HEAD_RE = /^\s*(\x3c!doctype|\x3chtml|\x3chead|\x3cmeta)/i;
  const decodeCapture = (raw) => {
    if (typeof raw !== 'string') return '';
    if (raw.includes('\x3cctrl99>')) return raw; // literal markers -> never decode
    let s = raw;
    if (/\x26lt;ctrl99\x26gt;/i.test(s) || HTML_HEAD_RE.test(s.slice(0, 400))) s = decodeEntities(s).replace(/\x3c[^>]+>/g, ' ');
    if (/\\\x3cctrl99\\>/i.test(s)) s = s.replace(/\\\x3c/g, '<').replace(/\\>/g, '>');
    return s;
  };

  // ===== user-block extraction: anchor on the ctrl99-user OPEN marker (\b so "username"
  // never counts; /i so "User" does not escape), block content up to the next role marker or
  // the ctrl100 close. The strict "\n"-anchored block regex false-blocked on CRLF (944
  // v2.0.2) -- these files are CRLF. =====
  const USER_OPEN = /\x3cctrl99>user\b/gi;
  const extractUserBlocks = (text) => {
    const out = [];
    const idx = [];
    let m;
    USER_OPEN.lastIndex = 0;
    while ((m = USER_OPEN.exec(text)) !== null) idx.push(m.index + m[0].length);
    for (const start of idx) {
      const rest = text.slice(start);
      const cut = rest.search(/\x3cctrl99>|\x3cctrl100>/i);
      out.push(normalizeText(cut < 0 ? rest : rest.slice(0, cut)));
    }
    return out;
  };
  // PContext CALL detection (F-08): a call, not the tool DECLARATION in the developer prefix and
  // not the backticked mention in the system prompt's instructions. Both separators are accepted
  // ('.' per QA rule 9, ':' as the execution path actually spells it -- SS18 item 5).
  const PCTX_RE = /personal_context[.:]retrieve_personal_data/gi;
  const countPContextCalls = (text) => {
    let n = 0, m;
    PCTX_RE.lastIndex = 0;
    while ((m = PCTX_RE.exec(text)) !== null) {
      const before = text.slice(Math.max(0, m.index - 24), m.index);
      if (/declaration\s*:\s*$/i.test(before)) continue; // tool declaration block
      if (/['"\x60]$/.test(before)) continue;            // quoted mention in the instructions
      n++;
    }
    return n;
  };
  const AGENCY_RE = /Agency config id\s*:?\s*"?([^"\r\n]+?)"?\s*$/im;

  const hashOf = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
  const DEBUG_CONTENT_MARKERS = ['BAS->', 'Agency config id', 'Recipe ID', '\x3cctrl99>', 'LM prefix', 'num_turns_read_from_footprints'];
  const HTML_CONTENT_MARKERS = ['\x3c!doctype', '\x3chtml', '\x3chead', '\x3cbody'];
  const PREFIX_CHARS = 4096;

  const results = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const r = settled[i].status === 'fulfilled' ? settled[i].value : { ok: false, reason: settled[i].reason ? String(settled[i].reason) : 'rejected' };
    settled[i] = null; // release the fetched bytes as soon as this slot is reduced
    if (!r.ok) { // F-01
      err(c.scopeLabel, c.fieldKey, `the linked file could not be retrieved.`, `confirm the file is shared with the task's Drive folder and the link still resolves, then re-paste it.`, `${r.reason || 'fetch failed'}; link: ${c.url}`);
      results.push({ ...c, ok: false });
      continue;
    }

    if (c.family === 'takeout') { // F-04 -- classify only; a Takeout archive is not text
      let looksRight = false, shape = '';
      if (r.parsed !== undefined) {
        const p = r.parsed;
        const recs = Array.isArray(p) ? p : (p && typeof p === 'object' ? [p] : []);
        const sample = recs.slice(0, 20);
        const TAKEOUT_KEYS = ['header', 'title', 'time', 'products', 'details', 'activityControls', 'titleUrl', 'subtitles'];
        const hits = sample.filter((rec) => rec && typeof rec === 'object' && TAKEOUT_KEYS.filter((k) => k in rec).length >= 2).length;
        looksRight = sample.length > 0 && hits >= Math.ceil(sample.length * 0.5);
        shape = `parsed JSON ${Array.isArray(p) ? `array of ${p.length}` : 'object'}, ${hits}/${sample.length} sampled records carry Takeout activity keys`;
      } else {
        const head = String(r.content).slice(0, PREFIX_CHARS);
        const isZip = head.charCodeAt(0) === 0x50 && head.charCodeAt(1) === 0x4b; // "PK" local file header
        const isJson = /^\s*[[{]/.test(head) && /"(header|title|time|products|activityControls)"/i.test(head);
        looksRight = isZip || isJson;
        shape = isZip ? 'archive (PK header)' : (isJson ? 'Takeout JSON text' : `text starting "${preview(head, 60)}"`);
      }
      if (!looksRight) {
        warn('Task', 'geminiTakeout', `the linked file does not look like a Gemini Takeout export.`, `upload the Takeout archive Google prepared for you and paste that file's link.`, `read as ${shape}.`);
      }
      logs.push(`${VERSION}: geminiTakeout classified -- ${shape}.`);
      results.push({ ...c, ok: looksRight });
      continue;
    }

    if (c.family === 'html') { // F-03 -- raw bytes, bounded prefix, never tag-stripped first
      const text = r.parsed !== undefined ? '' : String(r.content);
      const head = text.slice(0, PREFIX_CHARS).toLowerCase();
      if (!HTML_CONTENT_MARKERS.some((mk) => head.includes(mk))) {
        err(c.scopeLabel, c.fieldKey, `the linked file does not look like a saved conversation page.`, `confirm this is the right file -- it should be the saved HTML page for this side's conversation.`, `link: ${c.url}`);
        results.push({ ...c, ok: false });
        continue;
      }
      results.push({ ...c, ok: true, fp: `${text.length}:${hashOf(text)}`, id: driveId(c.url) });
      continue;
    }

    // family === 'debug'
    const decoded = r.parsed !== undefined ? JSON.stringify(r.parsed) : decodeCapture(String(r.content));
    const lower = decoded.toLowerCase();
    if (!DEBUG_CONTENT_MARKERS.some((mk) => lower.includes(mk.toLowerCase()))) { // F-02
      err(c.scopeLabel, c.fieldKey, `the linked file does not look like a debug capture.`, `confirm this is the right file -- it should be the exported debug information for this turn.`, `link: ${c.url}`);
      results.push({ ...c, ok: false });
      continue;
    }
    const blocks = extractUserBlocks(decoded);
    const am = decoded.match(AGENCY_RE);
    if (blocks.length === 0) {
      logs.push(`${VERSION}: ${c.scopeLabel} turn ${c.turn}: no ctrl99-user open marker found in ${decoded.length} decoded chars; first 120: ${JSON.stringify(decoded.slice(0, 120))}`.slice(0, 900));
    }
    results.push({
      ...c, ok: true, blocks, count: blocks.length,
      agency: am ? normalizeText(am[1]) : '',
      pcalls: countPContextCalls(decoded),
      fp: `${decoded.length}:${hashOf(decoded)}`, id: driveId(c.url),
    });
  }

  const okDebug = (role) => results.filter((r) => r.family === 'debug' && r.role === role && r.ok).sort((a, b) => a.turn - b.turn);
  const testDebug = okDebug('test');
  const baseDebug = okDebug('base');
  const testN = declaredTurns.get('test');
  const baseN = declaredTurns.get('base');
  const testAll = testSide.present && testN !== null && testDebug.length === testN && testDebug.every((r) => r.turn <= testN);
  const baseAll = baseSide.present && baseN !== null && baseDebug.length === baseN;
  if (testDebug.length) logs.push(`${VERSION}: Test debug user-block counts per turn: ${testDebug.map((r) => `turn ${r.turn}=${r.count}`).join(', ')} (declared ${testN === null ? '?' : testN}).`);
  if (baseDebug.length) logs.push(`${VERSION}: Base debug user-block counts per turn: ${baseDebug.map((r) => `turn ${r.turn}=${r.count}`).join(', ')} (declared ${baseN === null ? '?' : baseN}).`);

  // ===== F-09: the conversation ran on the wrong model (requirements SS1, ruled 2026-09-03) ==
  // The protocol is fixed: START on Model A (Mochi) and continue until the model makes the
  // mistake -- that turn is the bait prompt -- then BRANCH the bait prompt and the history to
  // Model B (Prod Frozen). So Model A's captures form the ladder (turn t carries t user blocks,
  // or 1 under a flat export) and Model B's single capture carries the whole shared history.
  //
  // Inversion looks exactly the other way round, and task 1267733 is one: Prod Frozen's four
  // captures counted 1/2/3/4 while both Mochi captures carried the same 4 prompts. Nothing at
  // the field level catches that -- the namespaces are right, the links resolve, each capture is
  // a real capture of the model it claims. Only the block-count SHAPE across the two sides shows
  // that the frozen baseline ran the conversation and the test model got baited, which measures
  // nothing: the regression under test is in Mochi's memory build.
  //
  // Deliberately narrow, so a correct task can never trip it: it needs the Base side to hold a
  // real multi-capture ladder (>= 2 slots, counts 1,2,3...) AND the Test side to hold no ladder
  // of its own AND every Test capture to carry exactly the Base side's full history. A correct
  // task has one Base capture, so the first clause alone rules it out.
  let inverted = false;
  {
    const isLadder = (rs) => rs.length >= 2 && rs.every((r) => r.count === r.turn);
    const baseLadder = isLadder(baseDebug);
    const testLadder = isLadder(testDebug);
    const testCarriesBaseHistory = testDebug.length > 0 && testDebug.every((r) => r.count === baseDebug.length);
    inverted = baseLadder && !testLadder && testCarriesBaseHistory;
    if (inverted) {
      const anchor = testDebug[0];
      err('Test side', anchor.fieldKey,
        `the conversation was run on the other model: the debug shows ${BASE_NAME} answering all ${baseDebug.length} turns, while ${TEST_NAME} only ever received the last one.`,
        `re-run this task the other way round -- start the conversation on "${TEST_NAME}" and keep going until it makes the mistake, then branch that prompt and the history to "${BASE_NAME}".`,
        `${BASE_NAME} captures hold ${baseDebug.map((r) => r.count).join('/')} prompts across turns ${baseDebug.map((r) => r.turn).join('/')} (a full conversation); ${TEST_NAME} captures each hold ${testDebug[0].count} (the shared history plus one prompt).`);
      logs.push(`${VERSION}: F-09 FIRED -- roles inverted. F-05, F-06, A-04 and A-05 stand down: their findings on this task would all be restatements of the same inversion. C-01 sits in Layer L1, which cannot see artifacts, so it may still report.`);
    }
  }

  // ===== F-07: different Drive ids, identical fetched content -- warn, not D-01's error =====
  {
    const byContent = new Map();
    for (const r of results) {
      if (!r.ok || !r.fp) continue;
      if (!byContent.has(r.fp)) byContent.set(r.fp, []);
      byContent.get(r.fp).push(r);
    }
    for (const [, group] of byContent) {
      const distinctIds = [...new Set(group.map((g) => g.id))];
      if (distinctIds.length < 2) continue; // same id is D-01's job
      const anchor = group[group.length - 1];
      const others = group.slice(0, -1).map((g) => `${g.scopeLabel} "${labelOf(g.fieldKey)}"`).join(', ');
      warn(anchor.scopeLabel, anchor.fieldKey, `this file's contents are identical to ${group.length - 1} other slot${group.length - 1 === 1 ? '' : 's'} (${others}) despite being a different Drive file.`, `confirm this is not a re-uploaded copy of the same capture under a new name.`, `distinct Drive file ids: ${distinctIds.join(', ')}.`);
    }
  }

  // ===== F-05: Test-side per-file ctrl99-user counts must fit the flat or the cumulative
  // export shape. Fires only when they fit NEITHER (944 v2.0.3 doctrine: a cumulative export is
  // legitimate and summing across files false-blocks it). =====
  let cumulativeConfirmed = false;
  if (!inverted && testAll && testDebug.length > 0) {
    const perTurn = testDebug.map((r) => ({ turn: r.turn, count: r.count }));
    const fitsCumulative = perTurn.every((p) => p.count === p.turn);
    const fitsFlat = perTurn.reduce((n, p) => n + p.count, 0) === perTurn.length;
    cumulativeConfirmed = fitsCumulative && perTurn.length > 1;
    if (!fitsCumulative && !fitsFlat) {
      // Name the commonest sub-case rather than leaving the rater to read a count table: a slot
      // whose capture holds no more prompts than the slot before it documents no additional
      // turn at all. Observed on task 1267733, where the turn-2 slot held the same four prompts
      // and the same role sequence as turn 1 and differed only in latency telemetry -- the
      // second turn had been cancelled, so the declared count was not what the run produced.
      // Role-independent: it compares a side's slots against each other, nothing else.
      const noNewTurn = [];
      for (let i = 1; i < perTurn.length; i++) {
        if (perTurn[i].count <= perTurn[i - 1].count) noNewTurn.push(perTurn[i].turn);
      }
      const anchor = noNewTurn.length
        ? (testDebug.find((r) => r.turn === noNewTurn[0]) || testDebug[testDebug.length - 1])
        : testDebug[testDebug.length - 1];
      const observed = perTurn.reduce((m, p) => Math.max(m, p.count), 0);
      const headline = noNewTurn.length
        ? `the turn ${noNewTurn.join(', ')} debug capture${noNewTurn.length === 1 ? '' : 's'} hold${noNewTurn.length === 1 ? 's' : ''} no prompt that the previous turn's capture does not already hold, so ${noNewTurn.length === 1 ? 'it does' : 'they do'} not document ${noNewTurn.length === 1 ? 'an additional turn' : 'additional turns'}.`
        : `the debug files do not line up with the ${testN} turn${testN === 1 ? '' : 's'} declared on this side.`;
      const action = noNewTurn.length
        ? `re-export that turn's debug after the turn actually completed, or lower the turn count to the number of turns the conversation really ran.`
        : `confirm each turn's debug capture was exported for that turn, and that the turn count is correct.`;
      err('Test side', anchor.fieldKey, headline, action,
        `user prompts found per debug file: ${perTurn.map((p) => `turn ${p.turn}=${p.count}`).join(', ')}; highest ${observed}; declared ${testN}.`);
    } else {
      logs.push(`${VERSION}: F-05 Test debug export shape = ${fitsCumulative ? 'CUMULATIVE (turn t carries t user blocks)' : 'FLAT (1 user block per file)'}.`);
    }
  }

  // ===== F-06: the Base capture is the branch of turns 1..N-1 plus the bait prompt P(N), so it
  // carries exactly N user blocks. This is the project's structural bait-turn invariant. =====
  const baseAnchor = baseDebug.length ? baseDebug[baseDebug.length - 1] : null;
  if (!inverted && testAll && baseAll && baseAnchor && testN !== null) {
    if (baseAnchor.count !== testN) {
      err('Base side', baseAnchor.fieldKey,
        `the Base debug capture holds ${baseAnchor.count} user prompt${baseAnchor.count === 1 ? '' : 's'}, but the Test side ran ${testN} turn${testN === 1 ? '' : 's'}.`,
        `re-export the Base debug from the branched conversation -- it must carry the shared history up to the bait prompt, and nothing after it.`,
        `Base capture user prompts = ${baseAnchor.count}; Test "Number of turns" = ${testN}.`);
    }
  } else if (baseAnchor) {
    logs.push(`${VERSION}: F-06 self-skipped (testAll=${testAll}, baseAll=${baseAll}, testN=${testN}).`);
  }

  // ===== SS10 CONTENT ANCHORING (A) =====
  const formPrompt = normalizeText(byKey['prompt']);
  const wordOverlapPct = (a, b) => {
    const wa = a.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
    const wb = b.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
    if (!wa.length && !wb.length) return 100;
    if (!wa.length || !wb.length) return 0;
    const bag = new Map();
    for (const w of wb) bag.set(w, (bag.get(w) || 0) + 1);
    let hit = 0;
    for (const w of wa) { const c = bag.get(w) || 0; if (c > 0) { hit++; bag.set(w, c - 1); } }
    return Math.round((hit / Math.max(wa.length, wb.length)) * 100);
  };

  // A-01: a fetched debug capture's FIRST user block equals the form's prompt. Symmetric
  // wording -- either the form or the capture could be the wrong side.
  // SCOPE (false-block guard): a capture only replays turn 1 when it is a turn-1 capture, when
  // the side exports CUMULATIVELY (945's proven shape -- SS18 item 3), or when it is the Base
  // branch capture (which always carries the shared history). On a FLAT export, turn t's file
  // starts at prompt t and A-01 would false-block every later turn, so those are skipped with
  // a log -- exactly the shape tolerance F-05 already grants.
  if (formPrompt) {
    const a01Scope = [...testDebug, ...baseDebug].filter((r) =>
      r.turn === 1 || (r.role === 'test' && cumulativeConfirmed) || (baseAnchor && r === baseAnchor));
    const a01Skipped = [...testDebug, ...baseDebug].filter((r) => a01Scope.indexOf(r) < 0);
    if (a01Skipped.length) logs.push(`${VERSION}: A-01 not applied to ${a01Skipped.length} capture(s) whose export shape does not replay turn 1 (flat export): ${a01Skipped.map((r) => `${r.scopeLabel} turn ${r.turn}`).join(', ')}.`);
    for (const r of a01Scope) {
      if (!r.blocks.length) continue;
      if (eqNorm(r.blocks[0], formPrompt)) continue;
      const pct = wordOverlapPct(r.blocks[0], formPrompt);
      err(r.scopeLabel, r.fieldKey,
        `the first prompt in this debug capture is not the prompt recorded on the form.`,
        `make the two match: either paste the prompt you actually sent into the prompt field, or re-export the debug from the conversation that started with it.`,
        `form prompt "${preview(formPrompt, 70)}"; capture starts "${preview(r.blocks[0], 70)}"; ${pct}% word overlap.`);
    }
  } else {
    logs.push(`${VERSION}: A-01 self-skipped -- the form's prompt field is blank (R-01 owns it).`);
  }

  const testLast = testAll && testDebug.length ? testDebug[testDebug.length - 1] : null;

  // A-02: Test turn-N's LAST user block is the bait prompt P(N); the Base capture's last user
  // block must be the same text. >=90% word overlap is a warn tier, not a block -- the two
  // captures re-render the same text and may differ in invisible ways.
  if (testLast && baseAnchor && testLast.blocks.length && baseAnchor.blocks.length) {
    const a = testLast.blocks[testLast.blocks.length - 1];
    const b = baseAnchor.blocks[baseAnchor.blocks.length - 1];
    if (!eqNorm(a, b)) {
      const pct = wordOverlapPct(a, b);
      if (pct >= 90) {
        warn('Base side', baseAnchor.fieldKey, `the bait prompt in the Base capture is not byte-identical to the one in the Test capture (${pct}% word overlap).`, `confirm you sent the exact same prompt to the Base model rather than retyping it.`, `Test "${preview(a, 60)}"; Base "${preview(b, 60)}".`);
      } else {
        err('Base side', baseAnchor.fieldKey, `the last prompt in the Base capture is not the bait prompt from the Test conversation.`, `send the Base model the exact same bait prompt you sent the Test model, then re-export the Base debug.`, `Test "${preview(a, 60)}"; Base "${preview(b, 60)}"; ${pct}% word overlap.`);
      }
    }
  }

  // A-03: the Base branch carries the whole SHARED history -- every user block of Test turn-N's
  // capture except the bait prompt itself must appear in the Base capture. The bait prompt is
  // A-02's business, and A-02 grants it a >=90% overlap tolerance tier; re-testing it here as a
  // hard containment would take that tolerance straight back (the two captures re-render the
  // same text). With Test N = 1 there is no shared history and A-03 is vacuous.
  if (testLast && baseAnchor && testLast.blocks.length && baseAnchor.blocks.length) {
    const hay = baseAnchor.blocks.join('\n');
    const shared = testLast.blocks.slice(0, -1);
    const missing = shared.filter((b) => b && hay.indexOf(b) < 0);
    if (missing.length) {
      err('Base side', baseAnchor.fieldKey,
        `the Base capture is missing ${missing.length} prompt${missing.length === 1 ? '' : 's'} from the shared conversation history.`,
        `branch the Base run from the Test conversation instead of starting a fresh chat, then re-export its debug.`,
        `first missing prompt: "${preview(missing[0], 70)}"; Base capture holds ${baseAnchor.blocks.length} prompt(s), Test turn ${testLast.turn} holds ${testLast.blocks.length} (${shared.length} shared).`);
    }
  }

  // A-04: within-side history containment -- only meaningful once F-05 confirmed the cumulative
  // shape on the Test side.
  if (!inverted && cumulativeConfirmed && testLast) {
    const hay = testLast.blocks.join('\n');
    for (const r of testDebug) {
      if (r.turn >= testLast.turn) continue;
      const missing = r.blocks.filter((b) => b && hay.indexOf(b) < 0);
      if (missing.length) {
        err('Test side', r.fieldKey,
          `the turn ${r.turn} debug capture contains prompts that are not in this side's final capture.`,
          `re-export the per-turn debug files from the same conversation, in order.`,
          `first mismatched prompt: "${preview(missing[0], 70)}".`);
      }
    }
  }

  // A-05: a turn-1 capture holds one logical prompt (Check D). On the Base side this applies
  // only when the Test side ran a single turn.
  {
    const t1 = testDebug.find((r) => r.turn === 1);
    const b1 = baseDebug.find((r) => r.turn === 1);
    const cands = [];
    if (!inverted && t1) cands.push(t1);
    if (!inverted && b1 && testN === 1) cands.push(b1);
    for (const r of cands) {
      if (r.blocks.length < 2) continue;
      const first = r.blocks[0], last = r.blocks[r.blocks.length - 1];
      if (!eqNorm(first, last)) {
        err(r.scopeLabel, r.fieldKey,
          `the turn 1 debug capture holds ${r.blocks.length} different prompts; a first-turn capture holds one.`,
          `re-export the turn 1 debug from the point where the conversation had only its first prompt.`,
          `first "${preview(first, 55)}"; last "${preview(last, 55)}".`);
      }
    }
  }

  // ===== SS11 IDENTITY on the debug bytes: the anchor is "Agency config id", not "Model ID:"
  // (no such line on this execution path -- SS15). =====
  {
    const tAg = testLast ? testLast.agency : (testDebug.length ? testDebug[testDebug.length - 1].agency : '');
    const bAg = baseAnchor ? baseAnchor.agency : '';
    logs.push(`${VERSION}: Agency config id -- Test="${tAg || '(not found)'}", Base="${bAg || '(not found)'}".`);
    if (tAg && bAg) {
      const tFrozen = /prod-frozen/i.test(tAg);
      const bFrozen = /prod-frozen/i.test(bAg);
      // I-01
      if (!bFrozen) {
        err('Base side', baseAnchor.fieldKey, `the Base debug capture did not come from the frozen production model.`, `re-run the bait prompt on the Base model and export its debug, or swap the two sides' files if they were pasted the wrong way round.`, `Base capture's model configuration is "${preview(bAg, 70)}".`);
      }
      if (tFrozen) {
        const anchorKey = testLast ? testLast.fieldKey : testDebug[testDebug.length - 1].fieldKey;
        err('Test side', anchorKey, `the Test debug capture came from the frozen production model, which is the Base model.`, `re-run the conversation on the Test model and export its debug, or swap the two sides' files if they were pasted the wrong way round.`, `Test capture's model configuration is "${preview(tAg, 70)}".`);
      }
      // I-02
      if (eqNorm(tAg, bAg)) {
        err('Base side', baseAnchor.fieldKey, `both sides' debug captures come from the same model configuration.`, `re-export each side's debug from its own conversation -- the two sides must be different models.`, `both read "${preview(tAg, 70)}".`);
      }
    } else if (testDebug.length || baseDebug.length) {
      logs.push(`${VERSION}: I-01/I-02 self-skipped -- an "Agency config id" line was not found on ${!tAg ? 'the Test' : 'the Base'} side (SS18 item 4).`);
    }
  }

  // ===== F-08: declared PContext trigger vs the fetched debug (warn -- SS18 item 5 keeps the
  // call-marker syntax unconfirmed; promote to error once one triggered sample confirms it) ====
  for (const side of presentSides) {
    const declared = normalizeText(side.get('wasPContextTriggered'));
    if (!declared || /^n\/?a$/i.test(declared)) continue;
    const sideDebug = okDebug(side.role);
    if (!sideDebug.length) continue;
    const calls = sideDebug.reduce((n, r) => n + (r.pcalls || 0), 0);
    logs.push(`${VERSION}: ${side.scope} PContext calls counted in debug = ${calls} (declared "${declared}").`);
    const anchor = sideDebug[sideDebug.length - 1];
    if (/^yes$/i.test(declared) && calls === 0) {
      warn(side.scope, side.keyOf('wasPContextTriggered'), `personal context is marked as triggered but no retrieval call appears in this side's debug.`, `re-check the debug for a personal-context retrieval; if there is none, answer No.`, `no personal-context call found across ${sideDebug.length} debug file(s) (tool declarations do not count).`);
    }
    if (/^no$/i.test(declared) && calls > 0) {
      warn(side.scope, side.keyOf('wasPContextTriggered'), `personal context is marked as not triggered but the debug shows ${calls} retrieval call${calls === 1 ? '' : 's'}.`, `re-check the debug; if the retrieval ran, answer Yes.`, `anchor: "${labelOf(anchor.fieldKey)}".`);
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  logs.push(`${VERSION}: L2 complete. candidates=${candidates.length}, ok=${okCount}, failed=${results.length - okCount}.`);
  if (errors.length === errorsBefore && warnings.length === warningsBefore && okCount > 0) {
    successes.push(`All ${okCount} linked file${okCount === 1 ? '' : 's'} fetched and content-checked.`);
  }
}
