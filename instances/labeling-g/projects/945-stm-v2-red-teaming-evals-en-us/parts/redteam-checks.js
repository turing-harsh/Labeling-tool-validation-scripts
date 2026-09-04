// redteam-stm-validator-945 -- Layer L1 (deterministic, computable from the payload's own
// bytes): the R/G/U/D/I/C/B check register from requirements.md SS4-SS7, SS11-SS12.
//
// ARCHITECTURE: follows 944-i18n-continuity-zh-cn / 939-continuity-en-us -- the top-level
// `validate(conversationData)` in validation.js is a thin WRAPPER that calls this function
// (validateRedTeamL1) plus the fetch layer (validateRedTeamFetchLayer, parts/
// redteam-fetch-checks.js) independently, then de-dupes. Each sub-validator resolves the
// payload shape for itself.
//
// Adapter doctrine: ratings/input roots are DISCOVERED by shape search anchored on this form's
// own key universe, never guessed by a hardcoded path list. Two shapes are live:
//   - export shape:  conversation.ratings (object map key -> {value}), conversation.input
//   - runtime shape: an ARRAY of {key, question, human_input_value} plus a batch-axis bag
// Every resolution is logged with the path it was found at; an unresolvable root self-skips
// with a loud log rather than guessing.
//
// ROLE MAPPING (requirements SS1.1): Test = model_A = the config's first SxS model; Base =
// model_B. The anchor is the CONFIG, never a doc constant. Batch "First Model" / the form's
// "First model shown" are DISPLAY ORDER, which the platform randomises per task -- they do not
// name the Test model (v1.0.2, task 1267733: First Model was the frozen baseline). B-01 checks
// only that the form's two namespaces are the two ASSIGNED models; I-03 owns display order.
//
// BASE RUBRIC IS INERT (requirements SS3 / escalation E-1): the config forces the rater to fill
// the 15 rubric fields on the Base side, but a loss is Test-only by construction, so any value
// there is forced noise. Base rubric values are LOGGED, never judged. The three exceptions that
// DO run on Base: R-family completeness for numberOfTurns / debugInfoTurn1 / htmlExport, the
// U/D artifact checks, and (in L2) the A-family content anchoring.
//
// GENERATED TABLES are emitted from config/project-config-id-945.json by scripts/build-945.mjs;
// this file is never hand-edited away from requirements.md -- edit this source, then rebuild.
//
// CHECK IDS IMPLEMENTED (build-asserted, one each):
//   R-01 R-02 R-03 R-04 R-05 R-06 R-07 R-08 R-09
//   G-01 G-02 G-03 G-04 G-05 G-06
//   U-01 U-02 U-03 U-04 U-05 U-06 U-07  D-01  I-03
//   C-01 C-02 C-03 C-04 C-05 C-06 C-07 C-12 C-13 C-14
//   B-01 B-02 B-03

async function validateRedTeamL1(conversationData) {
  const VERSION = 'redteam-stm-validator-945-L1-v1.0.9';

  // ===== GENERATED TABLES -- emitted from config/project-config-id-945.json =====
  // DO NOT HAND-EDIT. Rebuild with: node scripts/build-945.mjs
  const CFG = /*__GENERATED_CFG__*/ null;
  // ===== END GENERATED TABLES =====
  if (!CFG) {
    errors.push('Validator configuration tables are missing -- rebuild the script with scripts/build-945.mjs before deploying.');
    return;
  }

  // ===== adapter =====
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
  // Split at the LAST '.', never on ' - ' (requirements SS1.1: both model names contain ' - ').
  const baseOf = (k) => {
    if (typeof k !== 'string') return '';
    const parts = k.split('.');
    return parts[parts.length - 1];
  };
  const knownHits = (keys) => keys.reduce((n, k) => n + (KNOWN_KEYS.has(baseOf(k)) ? 1 : 0), 0);

  const looksLikeRatings = (n) => {
    if (Array.isArray(n)) {
      if (n.length === 0 || !n.every((e) => e && typeof e === 'object' && typeof e.key === 'string')) return false;
      return knownHits(n.map((e) => e.key)) >= 3;
    }
    if (n && typeof n === 'object') {
      const keys = Object.keys(n);
      if (keys.length < 3) return false;
      const holders = keys.filter((k) => {
        const v = n[k];
        return v === null || typeof v !== 'object' || 'value' in v || 'human_input_value' in v;
      });
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
  const ratings = ratingsHit ? ratingsHit.value : null;

  if (!ratings) {
    const topKeys = conversationData && typeof conversationData === 'object'
      ? Object.keys(conversationData).join(', ') : String(conversationData);
    errors.push(`Task -- "this task's answers" | Problem: the review script could not find the form answers anywhere in the task payload, so no check could run. This is a platform or configuration issue, not something wrong with your submission. | Fix: report this task to your lead -- no rework is needed from you.`);
    logs.push(`${VERSION}: ABORTED -- no root carrying this form's keys was found. Top-level keys seen: [${topKeys}].`);
    return;
  }

  const byKey = {};
  const labelByKey = {};
  if (Array.isArray(ratings)) {
    for (const r of ratings) {
      if (r && typeof r.key === 'string') {
        byKey[r.key] = unwrap(r);
        if (r.question) labelByKey[r.key] = r.question;
      }
    }
  } else {
    for (const [k, v] of Object.entries(ratings)) byKey[k] = unwrap(v);
  }
  for (const k of Object.keys(byKey)) {
    if (!labelByKey[k]) labelByKey[k] = CFG.labels[baseOf(k)] || k;
  }
  logs.push(`${VERSION}: ratings root resolved at ${ratingsHit.path} -- ${Array.isArray(ratings) ? 'array' : 'object map'}, ${Object.keys(byKey).length} keys.`);

  // Batch/input root (requirements SS12): self-skips with a LOUD log if it does not resolve.
  const AXIS_NAMES = ['first model', 'model a', 'model b', 'model a html name', 'model b html name', 'prompt'];
  const isAxisBag = (n) => {
    if (n === ratings) return false;
    if (Array.isArray(n)) {
      return n.length > 0 && n.every((e) => e && typeof e === 'object' && !Array.isArray(e)) &&
        n.some((e) => Object.keys(e).some((k) => AXIS_NAMES.includes(k.trim().toLowerCase())));
    }
    if (n && typeof n === 'object') {
      return Object.keys(n).some((k) => AXIS_NAMES.includes(k.trim().toLowerCase()));
    }
    return false;
  };
  const axisHit = findByShape(conversationData, isAxisBag);
  const inputByKey = {};
  if (axisHit) {
    const entries = Array.isArray(axisHit.value) ? axisHit.value : [axisHit.value];
    for (const entry of entries) {
      if (entry && typeof entry === 'object') {
        for (const [k, v] of Object.entries(entry)) {
          const uv = unwrap(v);
          if (uv === null || typeof uv === 'object') continue;
          inputByKey[k] = uv;
        }
      }
    }
    logs.push(`batch-axis root resolved at ${axisHit.path} (${Object.keys(inputByKey).length} entries).`);
  } else {
    logs.push('BATCH-AXIS ROOT NOT RESOLVED: no metadata object carrying the assignment columns was found anywhere in the payload -- all assignment checks (B-01..B-03) self-skip. Route to the lead; never infer an assignment from content.');
  }

  // ===== helpers -- SS2 normalisation ladder, one shared function =====
  // WAF-SAFE LITERALS (see requirements.md SS21.2): the tool's save endpoint sits behind a web
  // application firewall that scores request bodies for HTML-injection signatures. Marker
  // strings are therefore written with \x3c / \x26 escapes so the TRANSMITTED BYTES never form
  // an HTML tag opener or an HTML entity. The parsed strings are identical at runtime -- JS
  // reads '\x3cbody' as the same five characters the marker has always been -- so no check
  // behaviour changes. The builder asserts the output carries none of those raw sequences
  // (including in comments, which is why this note spells none of them out); do not "tidy"
  // these back into plain literals.

  // 1. strip pipeline omission markers (no-op until confirmed -- SS18 item 7)
  // 2. NFC  3. strip zero-width  4. curly quotes/dashes  5. collapse whitespace  6. trim
  const OMISSION_MARKERS = [];
  const strVal = (v) => (typeof v === 'string' ? v.trim() : (v === null || v === undefined ? '' : String(v).trim()));
  const stripOmissionMarkers = (s) => {
    let out = String(s);
    for (const mk of OMISSION_MARKERS) out = out.split(mk).join(' ');
    return out;
  };
  const normalizeText = (s) => stripOmissionMarkers(strVal(s))
    .normalize('NFC')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/[\u2018\u2019\u201b\u2032]/g, "'")
    .replace(/[\u201c\u201d\u2033]/g, '"')
    .replace(/[\u2010-\u2015\u2212\ufe58\ufe63\uff0d]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const eqNorm = (a, b) => normalizeText(a) === normalizeText(b);
  const eqCI = (a, b) => normalizeText(a).toLowerCase() === normalizeText(b).toLowerCase();

  // Model-name matching: EXACT canonical string only, never substring, never prefix (SS1.1).
  const canonEnv = (s) => normalizeText(s)
    .toLowerCase()
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();

  const isBlank = (v) => v === null || v === undefined || v === false ||
    (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
  const isFilled = (v) => !isBlank(v);
  const parseIntSafe = (v) => {
    const s = normalizeText(v);
    if (!/^\d+$/.test(s)) return null;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  };
  const preview = (v, n = 90) => {
    const s = normalizeText(v);
    return s.length > n ? s.slice(0, n) + '...' : s;
  };

  // ===== findings machinery -- merged per field, Problem|Fix|Why (requirements SS20) =====
  const labelOf = (fieldKey) => labelByKey[fieldKey] || CFG.labels[baseOf(fieldKey)] || fieldKey;
  const findingsByField = new Map();
  const addError = (scopeLabel, fieldKey, headline, action, evidence) => {
    const id = scopeLabel + ' :: ' + fieldKey;
    if (!findingsByField.has(id)) {
      findingsByField.set(id, { fieldKey, fieldLabel: labelOf(fieldKey), scopeLabel, headlines: [], actions: new Set(), evidence: [] });
    }
    const f = findingsByField.get(id);
    f.headlines.push(headline);
    if (action) f.actions.add(action);
    if (evidence) f.evidence.push(evidence);
  };
  const warn = (scopeLabel, fieldKey, headline, action, evidence) => {
    let m = `${scopeLabel} -- "${labelOf(fieldKey)}" | Problem: ${headline} | Fix: ${action}`;
    if (evidence) m += ` | Why: ${evidence}`;
    warnings.push(m);
  };

  // ===== namespace discovery (SS1.1) =====
  // Per-side keys arrive as 'compareBaseAndTest.(model name).(questionKey)'. Discovery: for
  // every ratings key, try each per-side question key as a '.'-suffix; the remainder, minus the
  // leading SxS segment, must EXACT-match a declared model name after canonicalization.
  // No match -> skip with a log; fix the identity table, never loosen the match.
  const TEST_NAME = CFG.modelA; // config anchor: model_A is Test (SS1.1)
  const BASE_NAME = CFG.modelB;
  const envByCanon = new Map([[canonEnv(TEST_NAME), 'Test side'], [canonEnv(BASE_NAME), 'Base side']]);
  const nsFieldMap = new Map();
  const unmatchedNamespaces = new Set();
  for (const fullKey of Object.keys(byKey)) {
    for (const q of CFG.sxsKeys) {
      if (fullKey === q || !fullKey.endsWith('.' + q)) continue;
      const ns = fullKey.slice(0, fullKey.length - q.length - 1);
      if (!ns || baseOf(ns) === '__config__') break;
      const c = canonEnv(ns);
      let matched = envByCanon.has(c) ? c : null;
      if (!matched) {
        for (const ec of envByCanon.keys()) { if (c.endsWith('.' + ec)) { matched = ec; break; } }
      }
      if (matched) {
        if (!nsFieldMap.has(matched)) nsFieldMap.set(matched, {});
        nsFieldMap.get(matched)[q] = fullKey;
      } else {
        unmatchedNamespaces.add(ns);
      }
      break;
    }
  }
  logs.push(`ALL DISCOVERED NAMESPACES: [${[...nsFieldMap.keys()].join(' | ') || 'NONE'}]`);
  if (unmatchedNamespaces.size > 0) {
    logs.push(`UNMATCHED NAMESPACES (skipped, exact-match rule): [${[...unmatchedNamespaces].join(' | ')}] -- if these are real sides, the identity table needs rebinding (SS18 item 1).`);
  }
  if (nsFieldMap.size === 0) {
    logs.push('NO SIDE NAMESPACES DISCOVERED -- per-side checks self-skip.');
  }

  const mkSide = (scope, name, role) => {
    const c = canonEnv(name);
    const fmap = nsFieldMap.get(c) || null;
    const get = (q) => (fmap && fmap[q] !== undefined ? byKey[fmap[q]] : undefined);
    const keyOf = (q) => (fmap && fmap[q] !== undefined ? fmap[q] : q);
    const lbl = (q) => labelOf(keyOf(q));
    return { scope, name, role, canon: c, present: !!fmap, get, keyOf, lbl };
  };
  const testSide = mkSide('Test side', TEST_NAME, 'test');
  const baseSide = mkSide('Base side', BASE_NAME, 'base');
  const sides = [testSide, baseSide];
  const presentSides = sides.filter((s) => s.present);
  for (const s of sides) {
    if (!s.present) logs.push(`${s.scope} ("${s.name}"): namespace not found in payload -- per-side checks self-skip for this side.`);
  }
  logs.push(`ROLE MAPPING (config-anchored, SS1.1): Test = "${TEST_NAME}", Base = "${BASE_NAME}".`);

  const T = (key) => byKey[key];

  // ===== field families =====
  const DEBUG_SLOTS = ['debugInfoTurn1', 'debugInfoTurn2', 'debugInfoTurn3', 'debugInfoTurn4', 'debugInfoTurn5'];
  const ISSUE_SLOTS = ['didTurn1HaveIssue', 'didTurn2HaveIssue', 'didTurn3HaveIssue', 'didTurn4HaveIssue', 'didTurn5HaveIssue'];
  const MEMSEC_SLOTS = ['turn1MemorySection', 'turn2MemorySection', 'turn3MemorySection', 'turn4MemorySection', 'turn5MemorySection'];
  // SS3 / E-1: values here are logged, never judged, on the Base side.
  const BASE_INERT_RUBRIC = ['testCoreTaskCompletion', 'lossCategory', 'leakageCategorization',
    'leakageOtherDetails', 'leakageEgregiousness', 'generalLossCategorization', 'generalOtherDetails',
    'generalLossSeverity', 'wasPContextTriggered', ...ISSUE_SLOTS, ...MEMSEC_SLOTS];

  // ============================================================
  // SS4 COMPLETENESS (R)
  // ============================================================
  // R-01 prompt, R-02 geminiTakeout
  if (isBlank(T('prompt'))) addError('Task', 'prompt', `the "${labelOf('prompt')}" field is empty -- the exact first message you sent to the model is required.`, `copy the first prompt from the Gemini conversation (do not retype it) and paste it into "${labelOf('prompt')}". Why we check this: every debug file must begin with this prompt; it anchors the other checks.`);
  if (isBlank(T('geminiTakeout'))) addError('Task', 'geminiTakeout', `the Gemini Takeout link is empty.`, `create the Takeout export as described in the task instructions, upload the downloaded archive to the task's Drive folder, then paste that file's share link here.`);

  // R-03 modelOrder: blank, or not one of the two config model strings (exact canonical)
  {
    const mo = T('modelOrder');
    if (isBlank(mo)) {
      addError('Task', 'modelOrder', `"First model shown" is not selected.`, `select "${TEST_NAME}" -- every conversation starts on the Test model; the Base model is only ever branched from it.`);
    } else if (canonEnv(mo) !== canonEnv(TEST_NAME) && canonEnv(mo) !== canonEnv(BASE_NAME)) {
      addError('Task', 'modelOrder', `the selected first model ("${strVal(mo)}") is not one of the two models in this comparison.`, `select "${TEST_NAME}", the model every conversation starts on.`, `selected "${strVal(mo)}"; expected "${TEST_NAME}" or "${BASE_NAME}".`);
    }
  }

  // R-08 the two rationale fields
  for (const key of ['baseSideFeedback', 'testSideTurnBreakdown']) {
    if (isBlank(T(key))) addError('Task', key, `"${labelOf(key)}" is empty -- this write-up is required.`, `fill in "${labelOf(key)}". Test side: one [Turn X] entry per turn saying what the model did and, at the loss turn, which memory content produced the failure and where it appears in the response. Base side: how the Base model handled the SAME bait prompt, judged on the same behaviour the Test model is faulted for.`);
  }

  // R-04 / R-05 / R-06 / R-07 -- per side (these run on BOTH sides: they are about artifacts
  // and turn structure, not the inert Base rubric).
  const declaredTurns = new Map();
  const r04Fired = new Map();
  for (const side of presentSides) {
    const raw = side.get('numberOfTurns');
    const turns = parseIntSafe(raw);
    const ok = turns !== null && turns >= 1 && turns <= 5;
    declaredTurns.set(side.scope, ok ? turns : null);
    r04Fired.set(side.scope, !ok);
    if (!ok) {
      addError(side.scope, side.keyOf('numberOfTurns'), `"${side.lbl('numberOfTurns')}" is missing or is not a number from 1 to 5.`, `select the number of prompts you actually sent on this side. Test side: all prompts up to and including the bait. Base side: normally 1 -- the branched chat receives only the bait prompt.`, isFilled(raw) ? `saw "${preview(raw)}".` : `no value.`);
    }
    // R-07 htmlExport
    if (isBlank(side.get('htmlExport'))) {
      addError(side.scope, side.keyOf('htmlExport'), `the saved-HTML Drive link for this side is empty.`, `save the full conversation page (Ctrl+S, "Webpage, Complete"), name it as the task metadata says, upload it to the task's Drive folder and paste that file's share link here.`);
    }
    if (!ok) continue; // R-05/R-06 non-fire when R-04 fired
    // R-05 required debug slots
    const emptyDebug = [];
    for (let k = 1; k <= turns; k++) if (isBlank(side.get(DEBUG_SLOTS[k - 1]))) emptyDebug.push(k);
    if (emptyDebug.length) {
      addError(side.scope, side.keyOf(DEBUG_SLOTS[emptyDebug[0] - 1]),
        `"${side.lbl('numberOfTurns')}" says ${turns} turn${turns === 1 ? '' : 's'}, but the debug link for turn ${emptyDebug.join(', ')} ${emptyDebug.length === 1 ? 'is' : 'are'} empty.`,
        `either paste the missing debug file link${emptyDebug.length === 1 ? '' : 's'} (one exported debug file per turn), or lower "${side.lbl('numberOfTurns')}" to the number of turns you actually ran.`,
        `"${side.lbl('numberOfTurns')}" = ${turns}; blank: turn ${emptyDebug.join(', turn ')}.`);
    }
    // R-06 stale hidden slots
    const stale = [];
    for (let k = turns + 1; k <= 5; k++) if (isFilled(side.get(DEBUG_SLOTS[k - 1]))) stale.push(k);
    if (stale.length) {
      const highest = stale[stale.length - 1];
      addError(side.scope, side.keyOf(DEBUG_SLOTS[highest - 1]),
        `turn ${stale.join(', ')} still ${stale.length === 1 ? 'holds' : 'hold'} a debug link from an earlier attempt, but ${stale.length === 1 ? 'is' : 'are'} hidden because the turn count is now ${turns}.`,
        `1) temporarily set "${side.lbl('numberOfTurns')}" to ${highest} so the hidden field${stale.length === 1 ? '' : 's'} reappear${stale.length === 1 ? 's' : ''}; 2) delete the content of turn ${stale.join(', turn ')}; 3) set the count back to ${turns} and save. Why we check this: hidden fields are still submitted with the task.`,
        `"${side.lbl('numberOfTurns')}" = ${turns}; hidden-but-filled: turn ${stale.join(', turn ')}.`);
    }
  }

  // R-09 -- Test side: a submitted task is a loss by construction, so at least one turn must be
  // marked as having an issue. Non-fire when R-04 fired or any in-range answer is blank (G-01
  // owns blanks).
  if (testSide.present && !r04Fired.get('Test side')) {
    const n = declaredTurns.get('Test side');
    const vals = [];
    let anyBlank = false;
    for (let k = 1; k <= n; k++) {
      const v = testSide.get(ISSUE_SLOTS[k - 1]);
      if (isBlank(v)) { anyBlank = true; break; }
      vals.push(normalizeText(v));
    }
    if (!anyBlank && vals.length === n && vals.every((x) => eqCI(x, 'No'))) {
      addError('Test side', testSide.keyOf(ISSUE_SLOTS[n - 1]),
        `every turn on the Test side is marked "No" for "did this turn have an issue", but a submitted task must record the turn where the loss happened.`,
        `mark the loss turn (normally the last turn -- the bait) as "Yes" and name its memory section. If no loss actually occurred, do not submit: ask your lead to withdraw the task and start a new attempt.`,
        `turns 1-${n} all answered "No" on "${testSide.lbl(ISSUE_SLOTS[0])}"-style questions.`);
    }
  }

  // C-13 / C-14 -- Base rubric (v1.0.7): Loss Category on the Base side has an "N/A" option and must be N/A --
  // the Base is the control, not a scored loss. Its Leakage/General sub-answers must be empty. A Base
  // turn marked as having an issue is the rater declaring the Base showed the failure too, which by
  // the client's rule means no loss: warn, quoting the declaration. Core Task Completion on the Base
  // side has no N/A option in the config and stays inert.
  if (baseSide.present) {
    const bLoss = normalizeText(baseSide.get('lossCategory'));
    if (isFilled(bLoss) && !eqNorm(bLoss, 'N/A')) {
      addError('Base side', baseSide.keyOf('lossCategory'), `the Base side's Loss Category is "${preview(bLoss, 30)}"; the Base is the control and is not scored for a loss.`, `select "N/A" for the Base side's Loss Category. Record how the Base handled the bait in the Base-side feedback instead. Why we check this: a Leakage or General Loss recorded on the Base side reads as "the Base also failed", which would mean no loss at all.`, `"${baseSide.lbl('lossCategory')}" = "${preview(bLoss, 40)}" on the Base side.`);
    }
    for (const key of ['leakageCategorization', 'leakageEgregiousness', 'generalLossCategorization', 'generalLossSeverity', 'leakageOtherDetails', 'generalOtherDetails']) {
      if (eqNorm(bLoss, 'N/A') && isFilled(baseSide.get(key))) {
        addError('Base side', baseSide.keyOf(key), `"${baseSide.lbl(key)}" holds an answer on the Base side, but the Base side's Loss Category is "N/A".`, `clear "${baseSide.lbl(key)}" on the Base side: temporarily set the Base side's Loss Category to Leakage Loss or General Loss so the field shows, delete its content, then set Loss Category back to "N/A" and save.`, `"${baseSide.lbl(key)}" = "${preview(baseSide.get(key), 40)}" while Loss Category = "N/A".`);
      }
    }
    for (let k = 1; k <= 5; k++) {
      const v = baseSide.get(ISSUE_SLOTS[k - 1]);
      if (eqCI(v, 'Yes')) {
        warn('Base side', baseSide.keyOf(ISSUE_SLOTS[k - 1]), `the Base side's turn ${k} is marked as having an issue.`, `if the Base model showed the same failure as the Test model, this is not a memory loss: tell your lead and start a fresh attempt. If the Base did not show the failure, change this answer to "No" and describe what the Base did in the Base-side feedback.`, `"${baseSide.lbl(ISSUE_SLOTS[k - 1])}" = "Yes" on the Base side.`);
      }
    }
  }

  // Remaining Base rubric fields: logged, never judged (SS3 / E-1).
  if (baseSide.present) {
    const seen = [];
    for (const key of BASE_INERT_RUBRIC) {
      const v = baseSide.get(key);
      if (isFilled(v)) seen.push(`${key}="${preview(v, 40)}"`);
    }
    logs.push(`BASE RUBRIC (inert per SS3 / escalation E-1 -- logged, never judged): ${seen.length ? seen.join('; ') : '(none filled)'}`.slice(0, 950));
  }

  // ============================================================
  // SS5 GATE CASCADES (G) -- required-when-shown + empty-when-hidden, transcribed from the
  // config's own displayCondition expressions. TEST SIDE ONLY (SS3: the Base rubric is inert).
  // ============================================================
  const clearFix = (labelText) => `clear "${labelText}" -- it is hidden at the current answers; if it is hidden on screen, temporarily change the controlling answer so it reappears, delete its content, then restore the controlling answer.`;

  if (testSide.present) {
    const sv = testSide.get;
    const n = declaredTurns.get('Test side');

    // G-01: didTurnKHaveIssue shown when numberOfTurns >= K
    if (n !== null) {
      for (let k = 1; k <= 5; k++) {
        const key = ISSUE_SLOTS[k - 1];
        const v = sv(key);
        if (k <= n && isBlank(v)) {
          addError('Test side', testSide.keyOf(key), `turn ${k} is part of this conversation, but "did this turn have an issue" is unanswered.`, `answer Yes or No for turn ${k}.`);
        }
        if (k > n && isFilled(v)) {
          addError('Test side', testSide.keyOf(key), `turn ${k} has an issue answer, but this side declares only ${n} turn${n === 1 ? '' : 's'}.`, clearFix(testSide.lbl(key)), `"${testSide.lbl('numberOfTurns')}" = ${n}; turn ${k} answered "${preview(v, 30)}".`);
        }
      }
    }

    // G-02: turnKMemorySection shown when didTurnKHaveIssue = Yes
    for (let k = 1; k <= 5; k++) {
      const gateV = sv(ISSUE_SLOTS[k - 1]);
      const memKey = MEMSEC_SLOTS[k - 1];
      const memV = sv(memKey);
      if (eqCI(gateV, 'Yes') && isBlank(memV)) {
        addError('Test side', testSide.keyOf(memKey), `turn ${k} is marked as having an issue, but no memory section is named for it.`, `name the memory section(s) the leaked or degrading content came from, using the names as they appear in the debug: Long Term Memory, Short Term Memory, Retrieved Memory, Explicit Memory, PContext tool output. Select only sections whose content actually shows up in the model's response -- retrieval that the model ignored is not a source.`);
      }
      if (eqCI(gateV, 'No') && isFilled(memV)) {
        addError('Test side', testSide.keyOf(memKey), `a memory section is recorded for turn ${k}, but turn ${k} is marked as having no issue.`, clearFix(testSide.lbl(memKey)), `turn ${k} answered "No"; memory section "${preview(memV, 40)}".`);
      }
    }

    // G-03 / G-04: the loss-category branch
    const lossCat = normalizeText(sv('lossCategory'));
    const isLeakage = eqNorm(lossCat, 'Leakage Loss');
    const isGeneral = eqNorm(lossCat, 'General Loss');
    // C-12 (v1.0.7): "N/A" exists for the Base side only. A Test side with N/A has recorded no loss.
    if (eqNorm(lossCat, 'N/A')) {
      addError('Test side', testSide.keyOf('lossCategory'), `the Test side's Loss Category is "N/A", but a submitted task must record the loss found on the Test model.`, `select Leakage Loss (specific leaked facts, rules, tone or entities from memory) or General Loss (a worse answer caused by memory, with no specific leaked item). "N/A" is only for the Base side, which is the control. If no loss was found, do not submit: ask your lead to withdraw the task and start a new attempt.`, `"${testSide.lbl('lossCategory')}" = "N/A" on the Test side.`);
    }
    for (const key of ['leakageCategorization', 'leakageEgregiousness']) {
      if (isLeakage && isBlank(sv(key))) addError('Test side', testSide.keyOf(key), `the loss is recorded as a Leakage Loss, so "${testSide.lbl(key)}" is required -- it is empty.`, `answer "${testSide.lbl(key)}".`);
      if (isGeneral && isFilled(sv(key))) addError('Test side', testSide.keyOf(key), `"${testSide.lbl(key)}" is a Leakage-Loss answer, but the loss is recorded as a General Loss.`, clearFix(testSide.lbl(key)), `"${testSide.lbl('lossCategory')}" = "General Loss"; value "${preview(sv(key), 40)}".`);
    }
    for (const key of ['generalLossCategorization', 'generalLossSeverity']) {
      if (isGeneral && isBlank(sv(key))) addError('Test side', testSide.keyOf(key), `the loss is recorded as a General Loss, so "${testSide.lbl(key)}" is required -- it is empty.`, `answer "${testSide.lbl(key)}".`);
      if (isLeakage && isFilled(sv(key))) addError('Test side', testSide.keyOf(key), `"${testSide.lbl(key)}" is a General-Loss answer, but the loss is recorded as a Leakage Loss.`, clearFix(testSide.lbl(key)), `"${testSide.lbl('lossCategory')}" = "Leakage Loss"; value "${preview(sv(key), 40)}".`);
    }

    // G-05 / G-06: the two "Other" free-text follow-ups
    const leakCat = normalizeText(sv('leakageCategorization'));
    if (eqNorm(leakCat, 'Other') && isBlank(sv('leakageOtherDetails'))) {
      addError('Test side', testSide.keyOf('leakageOtherDetails'), `the leakage category is "Other", but its description is empty.`, `describe the new leakage type in "${testSide.lbl('leakageOtherDetails')}" -- use "Other" only when none of the named categories fits.`);
    }
    if (isFilled(sv('leakageOtherDetails')) && !eqNorm(leakCat, 'Other')) {
      addError('Test side', testSide.keyOf('leakageOtherDetails'), `the "Other" leakage description is filled, but the leakage category is not "Other".`, clearFix(testSide.lbl('leakageOtherDetails')), `category "${strVal(sv('leakageCategorization')) || '(blank)'}".`);
    }
    const genCat = normalizeText(sv('generalLossCategorization'));
    if (eqNorm(genCat, 'Other General Loss') && isBlank(sv('generalOtherDetails'))) {
      addError('Test side', testSide.keyOf('generalOtherDetails'), `the general-loss category is "Other General Loss", but its description is empty.`, `describe the new general-loss type in "${testSide.lbl('generalOtherDetails')}" -- use it only when none of the named categories fits.`);
    }
    if (isFilled(sv('generalOtherDetails')) && !eqNorm(genCat, 'Other General Loss')) {
      addError('Test side', testSide.keyOf('generalOtherDetails'), `the "Other" general-loss description is filled, but the general-loss category is not "Other General Loss".`, clearFix(testSide.lbl('generalOtherDetails')), `category "${strVal(sv('generalLossCategorization')) || '(blank)'}".`);
    }

    // Enum membership on every Test-side single-choice field (SS5 closing rule). Blank is the
    // gate checks' business; only a filled value that is not on the option list fires here.
    const ENUM_KEYS = ['wasPContextTriggered', 'testCoreTaskCompletion', 'lossCategory',
      'leakageCategorization', 'leakageEgregiousness', 'generalLossCategorization',
      'generalLossSeverity', ...ISSUE_SLOTS];
    for (const key of ENUM_KEYS) {
      const opts = CFG.options[key];
      const v = sv(key);
      if (!opts || !opts.length || isBlank(v)) continue;
      if (!opts.some((o) => eqNorm(o, v))) {
        addError('Test side', testSide.keyOf(key), `"${preview(v, 40)}" is not one of the options for this question.`, `choose one of: ${opts.join(' / ')}.`);
      }
    }
  }

  // ============================================================
  // SS6 ARTIFACT URL INTEGRITY (U) + SS7 DRIVE-ID IDENTITY (D)
  // Every artifact field holds exactly one Google Drive FILE link and nothing else.
  // Silent normalisation, never a finding: whitespace/newlines around a link.
  // ============================================================
  const URL_RE = /https?:\/\/[^\s'"<>]+/gi;
  // U-01 markers, from requirements SS6 (the 945 execution path has NO "Model ID:" line -- SS15).
  const DEBUG_MARKERS = ['\x3cctrl99>', 'LM prefix', 'Agency config id', 'Recipe ID', 'num_turns_read_from_footprints', 'BAS->', 'reagent_trace'];
  const HTML_MARKERS = ['\x3c!doctype', '\x3chtml', '\x3chead', '\x3cbody', '\x3cdiv'];
  const driveId = (u) => {
    const s = strVal(u);
    let m = s.match(/\/d\/([^/?#\s]+)/i); if (m) return m[1];
    m = s.match(/[?&]id=([^&#\s]+)/i); if (m) return m[1];
    m = s.match(/\/folders\/([^/?#\s]+)/i); if (m) return 'folder:' + m[1];
    return normalizeText(s);
  };
  const isDriveHost = (u) => /^https?:\/\/(www\.)?drive\.google\.com\//i.test(strVal(u));
  const isDriveFolderUrl = (u) => /https?:\/\/drive\.google\.com\/[^\s]*\/folders\//i.test(strVal(u));

  const idRegistry = [];
  const auditArtifact = (scopeLabel, fullKey, rawVal) => {
    const raw = strVal(rawVal);
    if (isBlank(raw)) return;
    const lower = raw.toLowerCase();
    const dbg = DEBUG_MARKERS.find((mk) => lower.includes(mk.toLowerCase()));
    if (dbg) addError(scopeLabel, fullKey, `debug text was pasted into this field; it must hold only the Drive link to the debug file.`, `save the debug text as a .txt file named "<HTML name>_Debuginfo_turnN.txt", upload it to the task's Drive folder, and paste only that file's share link here.`, `found debug marker "${dbg}".`); // U-01
    const htm = HTML_MARKERS.find((mk) => lower.includes(mk));
    if (htm) addError(scopeLabel, fullKey, `page source was pasted into this field; it must hold only the Drive link to the saved HTML file.`, `upload the saved page to the task's Drive folder and paste only its share link here.`, `found HTML marker "${htm}".`); // U-02
    const urls = raw.match(URL_RE) || [];
    if (urls.length === 0) { // U-03
      addError(scopeLabel, fullKey, `this field holds no link.`, `open the file in Google Drive, choose Share -> Copy link, and paste that link here.`, `saw: "${preview(raw)}"`);
      return;
    }
    if (urls.length > 1) { // U-04
      addError(scopeLabel, fullKey, `this field holds ${urls.length} links; each field takes exactly one file.`, `keep only the link for this turn or file and move the others to their own fields.`, `links: ${urls.slice(0, 3).join(' , ')}`);
    }
    const url = urls[0];
    if (urls.length === 1 && raw.split(url).join('').trim().length > 0) { // U-05
      warn(scopeLabel, fullKey, `the field has a link plus surrounding text.`, `a bare link is easier to open -- remove the extra text; the link is still read.`, `extra: "${preview(raw.split(url).join('').trim())}"`);
    }
    if (isDriveFolderUrl(url)) { // U-06
      addError(scopeLabel, fullKey, `a Drive FOLDER is linked here instead of a single file.`, `open the folder, right-click the specific file (this turn's debug, or this side's HTML), choose Share -> Copy link, and paste that file's link. Why we check this: a folder cannot tell us which file belongs to which turn.`, `folder: ${url}`);
    } else if (!isDriveHost(url)) { // U-07, error since v1.0.5: an unreadable file silently disables every content check on that turn
      addError(scopeLabel, fullKey, `the link is not a Google Drive link, so the file cannot be read.`, `upload the file to the task's Drive folder and paste that Drive link.`, `host: ${url}`);
    }
    idRegistry.push({ id: driveId(url), scopeLabel, fullKey });
  };

  auditArtifact('Task', 'geminiTakeout', T('geminiTakeout'));
  for (const side of presentSides) {
    auditArtifact(side.scope, side.keyOf('htmlExport'), side.get('htmlExport'));
    for (const dk of DEBUG_SLOTS) auditArtifact(side.scope, side.keyOf(dk), side.get(dk));
  }

  // D-01 -- two or more artifact slots resolve to the same Drive file id. Unconditional: no
  // field pair on this form is a sanctioned duplicate (re-audit this claim on any fork).
  {
    const byId = new Map();
    for (const rec of idRegistry) {
      if (rec.id.indexOf('folder:') === 0) continue;
      if (!byId.has(rec.id)) byId.set(rec.id, []);
      byId.get(rec.id).push(rec);
    }
    for (const [id, group] of byId) {
      if (group.length < 2) continue;
      const names = group.map((g) => `${g.scopeLabel} "${labelOf(g.fullKey)}"`).join(', ');
      const allDebug = group.every((g) => DEBUG_SLOTS.indexOf(baseOf(g.fullKey)) >= 0);
      const bothHtml = group.every((g) => baseOf(g.fullKey) === 'htmlExport');
      let extra = '';
      if (allDebug) extra = ' Two different turns cannot produce the same debug capture.';
      else if (bothHtml) extra = ' The Base branch is a separate conversation and exports separately, even though it contains the shared history.';
      const anchor = group[group.length - 1];
      addError(anchor.scopeLabel, anchor.fullKey,
        `this field links the same Drive file as ${group.length - 1} other field${group.length - 1 === 1 ? '' : 's'} (${names}).`,
        `each turn and each side has its own file -- upload the right file for this field and paste its own link.${extra} Why we check this: two different turns or sides can never share one capture.`,
        `shared Drive file id ${id}.`);
    }
  }

  // ============================================================
  // SS11 COHERENCE (C) + the payload half of identity (I-03)
  // ============================================================
  if (testSide.present && !r04Fired.get('Test side')) {
    const sv = testSide.get;
    const n = declaredTurns.get('Test side');
    const answered = [];
    for (let k = 1; k <= n; k++) answered.push(normalizeText(sv(ISSUE_SLOTS[k - 1])));
    const yesTurns = [];
    for (let k = 1; k <= n; k++) if (eqCI(answered[k - 1], 'Yes')) yesTurns.push(k);
    const lastIsYes = eqCI(answered[n - 1], 'Yes');

    // C-01: the protocol stops at the loss turn (workflow rules 3 & 5).
    if (!lastIsYes && yesTurns.length > 0 && !isBlank(answered[n - 1])) {
      addError('Test side', testSide.keyOf(ISSUE_SLOTS[n - 1]),
        `turn ${yesTurns.join(', ')} ${yesTurns.length === 1 ? 'is' : 'are'} marked as having an issue, but the conversation continued and the last turn (${n}) is marked "No".`,
        `the run must stop at the turn where the loss happens -- that turn is the bait, and it is the last turn. Either the loss is really on turn ${n} (mark turn ${n} "Yes" and correct the earlier answer), or the turns after the loss should not have been sent (remove their debug links and lower the turn count).`,
        `issue turns: ${yesTurns.join(', ')}; last turn ${n} answered "${strVal(sv(ISSUE_SLOTS[n - 1]))}".`);
    }
    // C-02: legal (a minor issue before the loss) but worth a self-confirm.
    if (lastIsYes && yesTurns.length > 1) {
      warn('Test side', testSide.keyOf(ISSUE_SLOTS[yesTurns[0] - 1]),
        `turn ${yesTurns.slice(0, -1).join(', ')} ${yesTurns.length === 2 ? 'is' : 'are'} also marked as having an issue, before the loss turn (${n}).`,
        `confirm the earlier issue was a minor observation and not the loss itself -- the run stops at the first real loss. If it WAS the loss, that turn is the bait: lower the turn count and redo the Base branch from the reply before it.`,
        `issue turns: ${yesTurns.join(', ')}.`);
    }
    // C-04: memory-section canonicalisation. The field is free text and two conventions are
    // both in live use (v1.0.2, from tasks 1267698 and 1267733):
    //   (a) bare names, one per line -- "Retrieved Memory\nShort Term Memory"
    //   (b) a bracketed header followed by prose -- "[Turn 1] - [Retrieved Memory]. The issue
    //       was caused by Gmail content retrieved through ..."
    // v1.0.1 split on newlines AND commas and tested every fragment, which shredded (b)'s prose
    // into six "unrecognised" pieces and warned on a correctly-filled field. Candidates are now
    // the BRACKETED tokens (minus the [Turn K] label) plus SHORT standalone lines; prose is
    // never a candidate. The check fires only when a value offers no recognisable section at all.
    const CANON_SECTIONS = ['Long Term Memory', 'Short Term Memory', 'Retrieved Memory', 'Explicit Memory', 'PContext tool output'];
    const canonSec = (s) => normalizeText(s).toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const CANON_SET = new Set(CANON_SECTIONS.map(canonSec));
    const LINE_IS_PROSE = 48; // characters; longer standalone lines are rationale, not a name
    for (let k = 1; k <= 5; k++) {
      const raw = sv(MEMSEC_SLOTS[k - 1]);
      if (isBlank(raw)) continue;
      const text = String(raw);
      const candidates = [];
      let m; const braced = /\[([^\]]{1,60})\]/g;
      while ((m = braced.exec(text)) !== null) {
        const inner = m[1].trim();
        if (/^turn\s*\d+$/i.test(inner)) continue; // the [Turn K] label, not a section name
        candidates.push(inner);
      }
      for (const line of text.split(/[\r\n]+/).map((x) => x.trim().replace(/^[-*\u2022\s]+|[.\s]+$/g, ''))) {
        if (line && line.length <= LINE_IS_PROSE && !/\[/.test(line)) candidates.push(line);
      }
      const known = [], unknown = [];
      for (const cand of candidates) {
        const c = canonSec(cand);
        if (CANON_SET.has(c)) { known.push(cand); continue; }
        if (c.indexOf('other') === 0) { known.push(cand); logs.push(`Test side: turn ${k} memory section carries an "Other"-shaped value: "${preview(cand, 60)}" (allowed, logged -- escalation E-5).`); continue; }
        unknown.push(cand);
      }
      if (known.length) {
        logs.push(`Test side: turn ${k} memory section resolved to [${known.join(' | ')}]${unknown.length ? ` (ignored non-name text: ${unknown.length} fragment(s))` : ''}.`);
        continue;
      }
      // error since v1.0.5: attribution cannot be mapped without a standard section name
      addError('Test side', testSide.keyOf(MEMSEC_SLOTS[k - 1]),
        `the memory section named for turn ${k} is not one of the standard section names.`,
        `write it as "[Turn ${k}] - [Section name]" using one of: ${CANON_SECTIONS.join(' / ')} -- these are the names used for the memory blocks in the debug.`,
        candidates.length ? `read as: "${candidates.map((x) => preview(x, 30)).join('", "')}".` : `no section name found in "${preview(text, 60)}".`);
    }
    // C-05: [Turn K] labels in the turn-by-turn breakdown.
    {
      const bd = strVal(T('testSideTurnBreakdown'));
      if (isFilled(bd)) {
        const missing = [];
        for (let k = 1; k <= n; k++) {
          if (!(new RegExp('\\[\\s*turn\\s*' + k + '\\s*\\]', 'i')).test(bd)) missing.push(k);
        }
        if (missing.length) {
          // error since v1.0.5: the client instruction is a must in an exact format; a missing entry leaves a turn unreviewable
          addError('Task', 'testSideTurnBreakdown',
        `the turn-by-turn breakdown has no "[Turn ${missing.join('], [Turn ')}]" entry.`,
        `add a [Turn X] entry for every turn you sent (${n} turn${n === 1 ? '' : 's'}), describing what the model did in that turn.`,
            `${n} turn${n === 1 ? '' : 's'} declared; missing label${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.`);
        }
      }
    }
    // C-06 / C-07: category-vs-core-task and the open Harmless-Callback ruling (escalation E-6).
    {
      const core = normalizeText(sv('testCoreTaskCompletion'));
      const leakCat = normalizeText(sv('leakageCategorization'));
      const egr = normalizeText(sv('leakageEgregiousness'));
      if (eqNorm(sv('lossCategory'), 'Leakage Loss')) {
        if (eqNorm(leakCat, 'Intent Hijack') && eqCI(core, 'Yes')) {
          warn('Test side', testSide.keyOf('testCoreTaskCompletion'), `the leakage is categorised as Intent Hijack, but Core Task Completion is "Yes".`, `Intent Hijack means the model answered the WRONG question (Core Task = No). Factual Over-Personalization, Constraint / Tone Bleed and Lexical Bleed mean it answered the right question with extra content (Core Task = Yes). Change whichever answer is wrong.`, `category "Intent Hijack"; core task "Yes".`);
        }
        if (eqNorm(leakCat, 'Harmless Callback') && eqCI(core, 'No')) {
          warn('Test side', testSide.keyOf('testCoreTaskCompletion'), `the leakage is categorised as Harmless Callback, but Core Task Completion is "No".`, `Harmless Callback means the model mentioned past context WITHOUT derailing the answer (Core Task = Yes). If the answer really was derailed, the category is Intent Hijack. Change whichever answer is wrong.`, `category "Harmless Callback"; core task "No".`);
        }
        if (eqNorm(leakCat, 'Harmless Callback') && eqNorm(egr, 'Not Egregious')) {
          warn('Test side', testSide.keyOf('leakageEgregiousness'), `this is a Harmless Callback rated Not Egregious -- a mention that did not derail the answer and had minimal impact may not count as a loss.`, `flag this task to your lead for a ruling before submitting; do not change your rating on your own.`, `category "Harmless Callback"; egregiousness "Not Egregious".`);
        }
      }
    }
  }

  // C-03: Base side ran more than one turn (QA rule 7: usually one turn).
  if (baseSide.present && !r04Fired.get('Base side')) {
    const bn = declaredTurns.get('Base side');
    if (bn !== null && bn > 1) {
      warn('Base side', baseSide.keyOf('numberOfTurns'), `the Base side declares ${bn} turns; the branched Base chat should receive only the bait prompt (1 turn).`, `confirm you sent nothing after the Base model's reply to the bait. If you did, those turns are not part of the comparison: remove their debug links and set the Base turn count to 1. Why we check this: the comparison is one prompt, the same history, two models.`, `"${baseSide.lbl('numberOfTurns')}" = ${bn}.`);
    }
  }

  // ============================================================
  // SS12 ASSIGNMENT vs SUBMISSION (B) + I-03 -- self-skips with a LOUD log when the batch
  // root does not resolve. Silence there is silent blindness.
  // ============================================================
  const findInput = (name) => {
    const want = name.toLowerCase();
    const exact = Object.keys(inputByKey).find((k) => k.trim().toLowerCase() === want);
    const k = exact || Object.keys(inputByKey).find((kk) => kk.trim().toLowerCase() === want.replace(/\s+/g, ''));
    return k ? { key: k, value: strVal(inputByKey[k]) } : null;
  };
  const bFirstModel = findInput('first model');
  const bModelA = findInput('model a');
  const bModelB = findInput('model b');
  const bPrompt = findInput('prompt');
  const bHtmlA = findInput('model a html name');
  const bHtmlB = findInput('model b html name');
  if (!bFirstModel && !bModelA && !bModelB) {
    logs.push(`${VERSION}: batch axes unavailable -- assignment checks B-01..B-03 and I-03 SELF-SKIPPED. Route to the lead; never infer an assignment from content.`);
  } else {
    logs.push(`Batch axes discovered: firstModel=${bFirstModel ? `"${bFirstModel.value}"` : 'NOT FOUND'}; modelA=${bModelA ? `"${bModelA.value}"` : 'NOT FOUND'}; modelB=${bModelB ? `"${bModelB.value}"` : 'NOT FOUND'}.`);
    // B-01 -- the form's two namespaces must be the two ASSIGNED models, in either order.
    // It deliberately does NOT require the Test namespace to equal batch "First Model": that
    // field is display order and the platform randomises it per task (task 1267733 assigned the
    // frozen baseline first), so tying the Test ROLE to it would block every correctly-run task
    // whose display order happened to flip. Display order is I-03's business, at warn.
    if (bFirstModel && bFirstModel.value) {
      logs.push(`B-01: display order for this task is "${bFirstModel.value}" first; the Test role stays anchored on the config (model_A = "${TEST_NAME}"). Display order is not a role.`);
    }
    if (bModelA && bModelB && bModelA.value && bModelB.value) {
      const assigned = [canonEnv(bModelA.value), canonEnv(bModelB.value)].sort();
      const formPair = [canonEnv(TEST_NAME), canonEnv(BASE_NAME)].sort();
      if (assigned[0] !== formPair[0] || assigned[1] !== formPair[1]) {
        addError('Task', 'modelOrder', `the two models on this form are not the two models assigned in the batch.`, `report this task to your lead -- the form is bound to different models than the assignment. Do not work around it.`, `form: "${TEST_NAME}" / "${BASE_NAME}"; assigned: "${bModelA.value}" / "${bModelB.value}".`);
      }
    }
    // I-03 (v1.0.9) -- LOG ONLY, no finding. It compares the rater's run-order field against the
    // batch sheet's "First Model" column, and those are different quantities: the column is
    // randomised display order (proven on 1267733) while policy fixes the form value to the Test
    // model, so the two disagree on roughly half of all tasks BY CONSTRUCTION. That made it
    // guaranteed noise on correct work -- raters reported it on live tasks. There is no rater
    // action behind it, so it is not a finding. A genuinely inverted run is F-09's, on the
    // debug captures.
    if (bFirstModel && bFirstModel.value && isFilled(T('modelOrder')) && canonEnv(bFirstModel.value) !== canonEnv(T('modelOrder'))) {
      logs.push(`I-03: batch "First Model" ("${bFirstModel.value}") differs from the form's "First model shown" ("${strVal(T('modelOrder'))}") -- batch column is randomized display order, not run order; no rater action.`);
    }
    // NO first-model finding at this layer (v1.0.9). "First model shown" -- in the batch column
    // AND in the form -- records which model the TOOL DISPLAYED first, not which model the
    // conversation was run on. Task 1267704 settles it: the rater ran Mochi first and got the
    // loss on it ("[Turn 1] Model A was showing off personalization ..."), branched the bait to
    // Prod Frozen ("[Turn 1] Model B answered the bait prompt ..."), recorded Test=1 turn with
    // the issue and Base=1 turn clean with Loss Category N/A -- a textbook-correct submission --
    // and still, truthfully, set "First model shown" to Prod Frozen, because that is what the
    // platform showed. Warning on that field punished a rater for reporting the UI accurately.
    // Run order is knowable only from the debug captures, so it belongs to F-09 alone.
    {
      const fm = strVal(T('modelOrder'));
      if (fm && canonEnv(fm) !== canonEnv(TEST_NAME)) {
        logs.push(`"First model shown" = "${fm}" (not the Test model). Display order only -- the platform randomises it and the rater records what was shown; it says nothing about which model the conversation ran on. Run order is F-09's, from the debug captures.`);
      }
    }
    // B-02 -- warn: the form prompt should match the batch prompt when the batch carries one.
    if (bPrompt && bPrompt.value && isFilled(T('prompt')) && !eqNorm(bPrompt.value, T('prompt'))) {
      warn('Task', 'prompt', `the prompt recorded here differs from the prompt in the assignment.`, `paste the assigned prompt exactly as given, or flag the difference to your lead.`, `assigned "${preview(bPrompt.value, 60)}"; submitted "${preview(T('prompt'), 60)}".`);
    }
    // B-03 -- log-only reminder line, never a finding (SS14 item 1: filenames are unverifiable).
    if (bHtmlA || bHtmlB) {
      logs.push(`B-03: batch HTML names present (Model A="${bHtmlA ? bHtmlA.value : '?'}", Model B="${bHtmlB ? bHtmlB.value : '?'}") but unverifiable -- the fetch helper returns content, not Drive filenames (SS14 item 1). No finding.`);
    }
  }

  // ============================================================
  // OUTPUT ASSEMBLY -- one merged block per field, Problem|Fix|Why; "Also:" joins, actions
  // fuzzy-de-duplicated on the first 40 characters; no check IDs in output (SS20)
  // ============================================================
  const scopeOrder = new Map([['Task', 0], ['Test side', 1], ['Base side', 2]]);
  const idsOrdered = [...findingsByField.keys()].sort((a, b) => {
    const fa = findingsByField.get(a), fb = findingsByField.get(b);
    const oa = scopeOrder.has(fa.scopeLabel) ? scopeOrder.get(fa.scopeLabel) : 9;
    const ob = scopeOrder.has(fb.scopeLabel) ? scopeOrder.get(fb.scopeLabel) : 9;
    if (oa !== ob) return oa - ob;
    return fa.fieldKey < fb.fieldKey ? -1 : 1;
  });
  for (const id of idsOrdered) {
    const f = findingsByField.get(id);
    const headline = f.headlines.length === 1 ? f.headlines[0] : f.headlines.join(' Also: ');
    const keptActions = [];
    const seenSig = new Set();
    for (const a of f.actions) {
      const sig = a.slice(0, 40).toLowerCase().replace(/\s+/g, ' ').trim();
      if (seenSig.has(sig)) continue;
      seenSig.add(sig);
      keptActions.push(a);
    }
    const evidence = f.evidence.join(' ');
    let msg = `${f.scopeLabel} -- "${f.fieldLabel}" | Problem: ${headline} | Fix: ${keptActions.join(' ')}`;
    if (evidence) msg += ` | Why: ${evidence}`;
    errors.push(msg);
  }

  if (findingsByField.size === 0) {
    const note = presentSides.map((s) => `${s.scope}=${declaredTurns.get(s.scope) === null || declaredTurns.get(s.scope) === undefined ? '?' : declaredTurns.get(s.scope)} turn(s)`).join(', ') || 'no sides discovered';
    successes.push(`Layer L1 (deterministic) checks pass (${note}).`);
  }
  logs.push(`${VERSION}: L1 validation complete. sides=${presentSides.length}, findings=${findingsByField.size}, warnings=${warnings.length}.`);
}
