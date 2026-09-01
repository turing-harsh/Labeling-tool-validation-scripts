// i18n-continuity-validator-944 -- Layer L1 (deterministic, computable from the payload's own
// bytes): the R/G/U/D/I/C/B check register from requirements.md §4-§7, §10-§11 (56 checks).
//
// ARCHITECTURE: follows 939-continuity-en-us's pattern (requirements §8 provenance) -- the
// top-level `validate(conversationData)` in validation.js is a thin WRAPPER that calls this
// function (validateI18nContinuityL1) plus the fetch layer (validateFetchLayer, parts/
// i18n-continuity-fetch-checks.js) independently, then de-dupes. Each sub-validator resolves
// the payload shape for itself, exactly like 939's validateContinuity/validate903 pair.
//
// Adapter doctrine (carried from the v1.0.x line, proven against real task 1264318 in both
// shapes it has to handle): ratings/input roots are DISCOVERED by shape search anchored on
// this form's own key universe, never guessed by a hardcoded path list -- two shapes are live:
//   - export shape:  conversation.ratings (object map key -> {value}), conversation.input
//   - runtime shape: conversation_data.ratings (ARRAY of {key, question, human_input_value}),
//                     csv_data (batch axes)
// Every resolution is logged with the path it was found at; an unresolvable root self-skips
// with a loud log rather than guessing.
//
// GENERATED TABLES are emitted from project-config-id-944.json by scripts/build-944.mjs; this
// file is never hand-edited (requirements §20) -- edit this source, then rebuild.
//
// CHECK IDS IMPLEMENTED (build-asserted, one each):
//   R-01 R-02 R-03 R-04 R-05 R-06 R-07 R-08 R-09
//   G-01 G-02 G-03 G-04 G-05 G-06 G-07 G-08 G-09 G-10 G-11 G-12 G-13
//   U-01 U-02 U-03 U-04 U-05 U-06 U-07  D-01  I-01 I-02 I-03
//   C-01 C-02 C-03 C-04 C-05 C-06 C-07 C-08 C-09 C-10 C-11 C-12 C-13 C-14 C-15 C-16
//   B-01 B-02 B-03 B-04 B-05 B-06 B-07

async function validateI18nContinuityL1(conversationData) {
  const VERSION = 'i18n-continuity-validator-944-L1-v2.0.3';

  // ===== GENERATED TABLES -- emitted from project-config-id-944.json =====
  // DO NOT HAND-EDIT. Rebuild with: node scripts/build-944.mjs
  const CFG = /*__GENERATED_CFG__*/ null;
  // ===== END GENERATED TABLES =====
  if (!CFG) {
    errors.push('Validator configuration tables are missing -- rebuild the script with scripts/build-944.mjs before deploying.');
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
    errors.push(
      `Could not locate the submitted answers in this task's data | Problem: the review script could not find the form answers anywhere in the task payload, so no check could run. This is a platform or configuration issue, not something wrong with your submission. | Fix: report this task to your lead -- no rework is needed from you.`);
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
  logs.push(`${VERSION}: ratings root resolved at ${ratingsHit.path} -- ${Array.isArray(ratings) ? 'array' : 'object map'}, ${Object.keys(byKey).length} keys, labels ${Array.isArray(ratings) && ratings.some((r) => r.question) ? 'from payload' : 'from config'}.`);

  const AXIS_NAMES = ['task type', 'first model', 'conversation track', 'target language',
                      'dialect', 'model a', 'model b', 'time gap', 'context relevance', 'prompt explicitness'];
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
    const bag = axisHit.value;
    const entries = Array.isArray(bag) ? bag : [bag];
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
    logs.push('BATCH-AXIS ROOT NOT RESOLVED: no metadata object carrying the assignment columns was found anywhere in the payload -- all assignment checks self-skip. Route to the lead; never infer an axis from content.');
  }

  // ===== helpers =====
  // §2 normalisation ladder -- one shared function, used everywhere a comparison happens:
  // NFC -> strip zero-width -> curly quotes to straight -> en/em/figure dashes to hyphen ->
  // collapse whitespace -> trim.
  const strVal = (v) => (typeof v === 'string' ? v.trim() : (v === null || v === undefined ? '' : String(v).trim()));
  const normalizeText = (s) => {
    return strVal(s)
      .normalize('NFC')
      .replace(/[​-‍﻿]/g, '')
      .replace(/[‘’‛′]/g, "'")
      .replace(/[“”″]/g, '"')
      .replace(/[‐-―−﹘﹣－]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  };
  const eqNorm = (a, b) => normalizeText(a) === normalizeText(b);
  const eqCI = (a, b) => normalizeText(a).toLowerCase() === normalizeText(b).toLowerCase();
  const lettersOnly = (s) => normalizeText(s).toLowerCase().replace(/[^a-z]+/g, '');

  // Canonicalization for MODEL NAME matching only (exact full-string canonical match, never
  // substring -- requirements §1.1).
  const canonEnv = (s) => normalizeText(s)
    .toLowerCase()
    .replace(/_/g, '.')
    .replace(/\s*\.\s*/g, '.')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .trim();

  const isBlank = (v) => v === null || v === undefined || v === false ||
    (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
  const isFilled = (v) => !isBlank(v);
  const asArr = (v) => Array.isArray(v) ? v.map(strVal) : (isBlank(v) ? [] : [strVal(v)]);

  const parseIntSafe = (v) => {
    const s = normalizeText(v);
    if (!/^\d+$/.test(s)) return null;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  };

  const preview = (v, n = 90) => {
    const s = Array.isArray(v) ? v.join(', ') : normalizeText(v);
    return s.length > n ? s.slice(0, n) + '...' : s;
  };

  // ===== findings machinery -- merged per field, Problem|Fix|Why (requirements §19) =====
  const labelOf = (fieldKey) => labelByKey[fieldKey] || CFG.labels[baseOf(fieldKey)] || fieldKey;
  const findingsByField = new Map();
  const addFinding = (scopeLabel, fieldKey, headline, action) => {
    const id = scopeLabel + ' :: ' + fieldKey;
    if (!findingsByField.has(id)) {
      findingsByField.set(id, {
        fieldKey, fieldLabel: labelOf(fieldKey), scopeLabel,
        headlines: [], actions: new Set(), evidence: [],
      });
    }
    const f = findingsByField.get(id);
    f.headlines.push(headline);
    if (action) f.actions.add(action);
    return id;
  };
  const addEvidence = (id, line) => {
    const f = findingsByField.get(id);
    if (f) f.evidence.push(line);
  };
  const addError = (scopeLabel, fieldKey, headline, action, evidence) => {
    const id = addFinding(scopeLabel, fieldKey, headline, action);
    if (evidence) addEvidence(id, evidence);
  };
  const warn = (scopeLabel, fieldKey, headline, action, evidence) => {
    let m = `${scopeLabel} -- "${labelOf(fieldKey)}" | Problem: ${headline} | Fix: ${action}`;
    if (evidence) m += ` | Why: ${evidence}`;
    warnings.push(m);
  };

  // ===== namespace discovery (§1.1) =====
  // Per-side keys arrive as 'compareModels.<model name>.<questionKey>'. Discovery: for every
  // ratings key, try each per-side question key as a '.'-suffix (split from the RIGHT at the
  // last '.', NEVER on ' - ' -- Model B's name contains ' - '); the remainder, minus a leading
  // 'compareModels' segment, must EXACT-match a declared model name after canonicalization.
  // No match -> skip with a log; fix the identity table, never loosen the match (§17 row 5).
  const envByCanon = new Map([[canonEnv(CFG.modelA), 'Model A'], [canonEnv(CFG.modelB), 'Model B']]);
  const nsFieldMap = new Map();
  const unmatchedNamespaces = new Set();
  for (const fullKey of Object.keys(byKey)) {
    for (const q of CFG.sxsKeys) {
      if (fullKey === q || !fullKey.endsWith('.' + q)) continue;
      const ns = fullKey.slice(0, fullKey.length - q.length - 1);
      if (!ns || baseOf(ns) === '__config__') break;
      const c = canonEnv(ns);
      let matched = null;
      if (envByCanon.has(c)) matched = c;
      else {
        for (const ec of envByCanon.keys()) {
          if (c.endsWith('.' + ec)) { matched = ec; break; }
        }
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
    logs.push(`UNMATCHED NAMESPACES (skipped, exact-match rule): [${[...unmatchedNamespaces].join(' | ')}] -- if these are real sides, the identity table needs rebinding.`);
  }
  if (nsFieldMap.size === 0) {
    logs.push('NO SIDE NAMESPACES DISCOVERED -- per-side checks self-skip. Either the payload is task-level-only or the namespace pattern differs (first-task item 1).');
  }

  const sides = [
    { scope: 'Model A', name: CFG.modelA },
    { scope: 'Model B', name: CFG.modelB },
  ].map((s) => {
    const c = canonEnv(s.name);
    const fmap = nsFieldMap.get(c) || null;
    const get = (q) => (fmap && fmap[q] !== undefined ? byKey[fmap[q]] : undefined);
    const keyOf = (q) => (fmap && fmap[q] !== undefined ? fmap[q] : q);
    const lbl = (q) => labelOf(keyOf(q));
    return { ...s, canon: c, present: !!fmap, get, keyOf, lbl };
  });
  const presentSides = sides.filter((s) => s.present);
  for (const s of sides) {
    if (!s.present) logs.push(`${s.scope} ("${s.name}"): namespace not found in payload -- per-side checks self-skip for this side.`);
  }

  const T = (key) => byKey[key];

  // ===== enum constants (§1.1 per-field vocabularies) =====
  const COLD_START = 'N/A - Cold Start'; // normalizeText collapses the real em-dash to one hyphen
  const IQ_NA = 'N/A';
  const NO_ISSUES_LOGGED = 'No issues logged';
  const MEMORY_DIMS = ['utilityRelevance', 'constraintExpertiseAdherence', 'stateEntityProgressTracking', 'temporalAwareness', 'granularityDepth'];
  const ST_RATING_FIELDS = ['overallSatisfaction', 'contextualContinuity', 'contextualContinuityGate', ...MEMORY_DIMS, 'targetLanguageMeaning', 'internationalizationQuality'];
  const MT_RATING_FIELDS = ['multiTurnSatisfaction', 'turn1Continuity', 'turn2Continuity', 'turn3Continuity', 'turn4Continuity', 'turn5Continuity', 'errorSeverityFirst', 'errorSeveritySecond', 'errorSeverityThird'];
  const DEBUG_SLOTS = ['testResponse1DebugInfo', 'testResponse2DebugInfo', 'model1TestResponse3DebugInfo', 'model1TestResponse4DebugInfo', 'model1TestResponse5DebugInfo'];
  const SATISFIED = ['Very satisfied', 'Somewhat satisfied'];
  const DISSATISFIED = ['Very dissatisfied', 'Somewhat dissatisfied'];
  const isColdStart = (v) => eqNorm(v, COLD_START);
  const classifyDim = (key, v) => {
    const s = normalizeText(v);
    if (!s) return null;
    if (key === 'internationalizationQuality') {
      if (eqNorm(s, 'N/A')) return 'na';
      if (eqNorm(s, 'No Issues')) return 'noIssue';
      if (eqNorm(s, 'Minor Issues')) return 'minor';
      if (eqNorm(s, 'Major Issues')) return 'major';
      return 'other';
    }
    if (isColdStart(s)) return 'na';
    if (eqNorm(s, 'No Issue')) return 'noIssue';
    if (eqNorm(s, 'Minor Issue')) return 'minor';
    if (eqNorm(s, 'Major Issue')) return 'major';
    return 'other';
  };

  const turnTypeRaw = normalizeText(T('turnType'));
  const isST = eqNorm(turnTypeRaw, 'Single Turn');
  const isMT = eqNorm(turnTypeRaw, 'Multi Turn');
  const trackTypeRaw = normalizeText(T('trackType'));
  const dominantLang = asArr(T('dominantThreadLanguageMatching'));
  const dominantHasOther = dominantLang.some((x) => eqCI(x, 'Other(Please specify)'));
  const dominantHasEnglish = dominantLang.some((x) => eqCI(x, 'Dominant threads language is English'));

  // ============================================================
  // §4 COMPLETENESS (R)
  // ============================================================
  const R01_ALWAYS = ['p0CujCategory', 'targetLanguage', 'dialect', 'turnType', 'numberOfThreadsAdded', 'myGoal', 'keyContext', 'targetLanguageVersion', 'keyContextTargetLanguageVersion', 'languageNuance', 'prompt', 'firstModel', 'geminiConversationHistory', 'dominantThreadLanguageMatching'];
  for (const key of R01_ALWAYS) {
    if (isBlank(T(key))) addError('Task', key, `this required field is blank.`, `fill in "${labelOf(key)}".`);
  }
  if (isFilled(T('turnType')) && !isST && !isMT) {
    addError('Task', 'turnType', `the value "${strVal(T('turnType'))}" is not one of the two turn types.`, `select either Single Turn or Multi Turn.`);
  }

  const declaredThreads = parseIntSafe(T('numberOfThreadsAdded'));
  const threadSlot = (k) => `topicConversationsHtml${k}`;
  if (declaredThreads !== null) {
    const emptyInRange = [];
    for (let k = 1; k <= Math.min(declaredThreads, 10); k++) if (isBlank(T(threadSlot(k)))) emptyInRange.push(k);
    if (emptyInRange.length) {
      addError('Task', threadSlot(emptyInRange[0]),
        `${declaredThreads} thread${declaredThreads === 1 ? '' : 's'} declared but thread HTML slot${emptyInRange.length === 1 ? '' : 's'} ${emptyInRange.join(', ')} ${emptyInRange.length === 1 ? 'is' : 'are'} empty.`,
        `paste the missing thread HTML link${emptyInRange.length === 1 ? '' : 's'}, or lower "${labelOf('numberOfThreadsAdded')}" to the number of threads you actually added.`,
        `"${labelOf('numberOfThreadsAdded')}" = ${declaredThreads}; empty: ${emptyInRange.join(', ')}.`);
    }
    const stale = [];
    for (let k = declaredThreads + 1; k <= 10; k++) if (isFilled(T(threadSlot(k)))) stale.push(k);
    if (stale.length) {
      const highest = stale[stale.length - 1];
      addError('Task', threadSlot(highest),
        `thread HTML slot${stale.length === 1 ? '' : 's'} ${stale.join(', ')} still hold${stale.length === 1 ? 's' : ''} content from an earlier attempt but ${stale.length === 1 ? 'is' : 'are'} hidden at the current thread count.`,
        `temporarily raise "${labelOf('numberOfThreadsAdded')}" to ${highest} so the hidden slot${stale.length === 1 ? '' : 's'} reappear${stale.length === 1 ? 's' : ''}, clear ${stale.length === 1 ? 'it' : 'them'}, then set the count back to ${declaredThreads}.`,
        `"${labelOf('numberOfThreadsAdded')}" = ${declaredThreads}; hidden-but-filled: ${stale.join(', ')}.`);
    }
  }

  if (isBlank(T('qualityComparisonSxSRationale'))) {
    addError('Task', 'qualityComparisonSxSRationale', `the overall side-by-side rationale is blank.`, `explain why one conversation was better than the other in "${labelOf('qualityComparisonSxSRationale')}".`);
  }

  const declaredTurnsBySide = new Map();
  for (const side of presentSides) {
    const turns = parseIntSafe(side.get('numberOfTurns'));
    declaredTurnsBySide.set(side.scope, turns);
    if (turns === null) {
      addError(side.scope, side.keyOf('numberOfTurns'), `the turn count is missing or unreadable.`, `select how many turns you ran on this side.`);
    }
    for (const key of ['model1HtmlFileUpload', 'conversationFeedback']) {
      if (isBlank(side.get(key))) addError(side.scope, side.keyOf(key), `this required field is blank.`, `fill in "${side.lbl(key)}".`);
    }
    if (turns !== null) {
      const emptyDebug = [];
      for (let k = 1; k <= Math.min(turns, 5); k++) if (isBlank(side.get(DEBUG_SLOTS[k - 1]))) emptyDebug.push(k);
      if (emptyDebug.length) {
        addError(side.scope, side.keyOf(DEBUG_SLOTS[emptyDebug[0] - 1]),
          `${turns} turn${turns === 1 ? '' : 's'} declared but Turn ${emptyDebug.join(', ')} debug info ${emptyDebug.length === 1 ? 'is' : 'are'} empty.`,
          `paste the missing debug link${emptyDebug.length === 1 ? '' : 's'}, or lower "${side.lbl('numberOfTurns')}" to the number of turns you actually ran.`,
          `"${side.lbl('numberOfTurns')}" = ${turns}; empty: Turn ${emptyDebug.join(', Turn ')}.`);
      }
      const staleDebug = [];
      for (let k = turns + 1; k <= 5; k++) if (isFilled(side.get(DEBUG_SLOTS[k - 1]))) staleDebug.push(k);
      if (staleDebug.length) {
        const highest = staleDebug[staleDebug.length - 1];
        addError(side.scope, side.keyOf(DEBUG_SLOTS[highest - 1]),
          `Turn ${staleDebug.join(', ')} debug info still holds content from an earlier attempt but ${staleDebug.length === 1 ? 'is' : 'are'} hidden at the current turn count.`,
          `temporarily raise "${side.lbl('numberOfTurns')}" to ${highest} so the hidden field${staleDebug.length === 1 ? '' : 's'} reappear${staleDebug.length === 1 ? 's' : ''}, clear ${staleDebug.length === 1 ? 'it' : 'them'}, then set the count back to ${turns}.`,
          `"${side.lbl('numberOfTurns')}" = ${turns}; hidden-but-filled: Turn ${staleDebug.join(', Turn ')}.`);
      }
    }
  }

  // ============================================================
  // §5 GATE CASCADES (G) -- required-when-shown + empty-when-hidden,
  // transcribed from the config's own displayCondition expressions.
  // ============================================================
  const clearFix = (labelText) => `clear "${labelText}" -- it is hidden at the current settings; if it is hidden on screen, temporarily change the controlling answer so it reappears, delete its content, then restore the controlling answer.`;

  if (isMT && isBlank(T('trackType'))) addError('Task', 'trackType', `Track Type is required for a Multi Turn task but is blank.`, `select the conversation track (Track A or Track B).`);
  if (!isMT && isFilled(T('trackType'))) addError('Task', 'trackType', `Track Type is filled but only applies to a Multi Turn task.`, clearFix(labelOf('trackType')));
  const showPivot = isMT && eqNorm(trackTypeRaw, 'Track B');
  if (showPivot && isBlank(T('pivotToTopicTurnForTrackBOnly'))) addError('Task', 'pivotToTopicTurnForTrackBOnly', `the Track B pivot-to-topic turn is required but is blank.`, `describe the pivot-to-topic turn used for Track B.`);
  if (!showPivot && isFilled(T('pivotToTopicTurnForTrackBOnly'))) addError('Task', 'pivotToTopicTurnForTrackBOnly', `the Track B pivot field is filled but this task is not Track B.`, clearFix(labelOf('pivotToTopicTurnForTrackBOnly')));
  if (isST && isBlank(T('promptGoalAlignment'))) addError('Task', 'promptGoalAlignment', `Prompt Goal Alignment is required for a Single Turn task but is blank.`, `describe how the prompt aligns with the stated goal.`);
  if (!isST && isFilled(T('promptGoalAlignment'))) warn('Task', 'promptGoalAlignment', `Prompt Goal Alignment is filled but only applies to a Single Turn task.`, `clear it if it is left over from an earlier attempt.`);
  if (dominantHasOther && isBlank(T('dominantThreadLanguageMatchingOtherRationale'))) addError('Task', 'dominantThreadLanguageMatchingOtherRationale', `you selected "Other" for the dominant thread language but gave no rationale.`, `specify the dominant thread language in "${labelOf('dominantThreadLanguageMatchingOtherRationale')}".`);
  if (!dominantHasOther && isFilled(T('dominantThreadLanguageMatchingOtherRationale'))) warn('Task', 'dominantThreadLanguageMatchingOtherRationale', `the dominant-language "Other" rationale is filled but "Other" is not selected.`, `clear it if it is left over from an earlier attempt.`);

  for (const side of presentSides) {
    const turns = declaredTurnsBySide.get(side.scope);
    const sv = side.get;
    const gate = normalizeText(sv('contextualContinuityGate'));
    const gateNo = eqNorm(gate, 'No');

    if (isST) {
      for (const key of ST_RATING_FIELDS) {
        if (isBlank(sv(key))) addError(side.scope, side.keyOf(key), `this Single Turn rating is required but is blank.`, `answer "${side.lbl(key)}".`);
      }
    } else if (isMT) {
      for (const key of ST_RATING_FIELDS) {
        if (isFilled(sv(key))) addError(side.scope, side.keyOf(key), `this Single Turn rating is filled on a Multi Turn task, where it does not apply.`, clearFix(side.lbl(key)));
      }
    }

    if (isMT) {
      if (isBlank(sv('multiTurnSatisfaction'))) addError(side.scope, side.keyOf('multiTurnSatisfaction'), `the Multi Turn overall satisfaction is required but is blank.`, `answer "${side.lbl('multiTurnSatisfaction')}".`);
    } else if (isST) {
      for (const key of MT_RATING_FIELDS) {
        if (isFilled(sv(key))) addError(side.scope, side.keyOf(key), `this Multi Turn field is filled on a Single Turn task, where it does not apply.`, clearFix(side.lbl(key)));
      }
    }

    if (isMT) {
      for (let k = 1; k <= 5; k++) {
        const key = `turn${k}Continuity`;
        if (turns !== null && k <= turns && isBlank(sv(key))) addError(side.scope, side.keyOf(key), `Turn ${k} continuity rating is required but is blank.`, `rate continuity for Turn ${k}.`);
        if (turns !== null && k > turns && isFilled(sv(key))) addError(side.scope, side.keyOf(key), `Turn ${k} continuity is rated but the side declares only ${turns} turn${turns === 1 ? '' : 's'}.`, clearFix(side.lbl(key)));
      }
    }

    if (isMT && turns !== null) {
      for (let k = 1; k <= turns && k <= 5; k++) {
        const errList = asArr(sv(`turn${k}ContinuityErrorTypes`));
        const hasRealError = errList.length > 0 && !errList.some((x) => eqNorm(x, 'None'));
        if (hasRealError) {
          for (const suffix of ['ExpectedContext', 'ContextSourceThreads', 'ModelCorrectionOutcome']) {
            const key = `turn${k}${suffix}`;
            if (isBlank(sv(key))) addError(side.scope, side.keyOf(key), `Turn ${k} logs a continuity error, so this follow-up detail is required but is blank.`, `fill in "${side.lbl(key)}".`);
          }
        }
      }
    }

    if (isST) {
      const tlm = classifyDim('targetLanguageMeaning', sv('targetLanguageMeaning'));
      if (gateNo && (tlm === 'minor' || tlm === 'major') && isBlank(sv('targetLanguageMeaningRationale'))) {
        addError(side.scope, side.keyOf('targetLanguageMeaningRationale'), `Target Language Meaning is rated an issue but its rationale is blank.`, `explain the target-language meaning issue in "${side.lbl('targetLanguageMeaningRationale')}".`);
      }
      const iq = classifyDim('internationalizationQuality', sv('internationalizationQuality'));
      if (gateNo && iq === 'minor' && asArr(sv('internationalizationMinorIssues')).length === 0) {
        addError(side.scope, side.keyOf('internationalizationMinorIssues'), `Internationalization is rated Minor Issues but no pattern is ticked.`, `tick at least one minor-issue pattern.`);
      }
      if (gateNo && iq === 'major' && asArr(sv('internationalizationMajorIssues')).length === 0) {
        addError(side.scope, side.keyOf('internationalizationMajorIssues'), `Internationalization is rated Major Issues but no pattern is ticked.`, `tick at least one major-issue pattern.`);
      }
      if (gateNo && (iq === 'minor' || iq === 'major') && isBlank(sv('internationalizationRationale'))) {
        addError(side.scope, side.keyOf('internationalizationRationale'), `Internationalization is rated an issue but its rationale is blank.`, `explain the internationalization issue in "${side.lbl('internationalizationRationale')}".`);
      }
    }

    if (isMT) {
      for (const [slot, ratKey] of [['errorSeverityFirst', 'errorSeverityFirstRationale'], ['errorSeveritySecond', 'errorSeveritySecondRationale'], ['errorSeverityThird', 'errorSeverityThirdRationale']]) {
        const sval = normalizeText(sv(slot));
        if (isFilled(sval) && !eqNorm(sval, NO_ISSUES_LOGGED) && isBlank(sv(ratKey))) {
          addError(side.scope, side.keyOf(ratKey), `a ranked error is selected but its rationale is blank.`, `explain the ranked error in "${side.lbl(ratKey)}".`);
        }
      }
    }
  }

  // ============================================================
  // §6 / §7 ARTIFACT URL INTEGRITY (U) + IDENTITY (D)
  // Project rule: every artifact field holds exactly one Google Drive FILE link and nothing
  // else. Silent normalisation, never a finding: leading/trailing whitespace and newlines
  // inside a link field (observed live on task 1264311).
  // ============================================================
  const URL_RE = /https?:\/\/[^\s'"<>]+/gi;
  const DEBUG_MARKERS = ['<ctrl99>', '<ctrl100>', 'LM Prefix', 'Model ID:', 'num_turns_read_from_footprints', 'BAS->', 'reagent_trace'];
  const HTML_MARKERS = ['<!doctype', '<html', '<head', '<body', '<div', '<span class'];
  const driveId = (u) => {
    const s = strVal(u);
    let m = s.match(/\/d\/([^/?#\s]+)/i); if (m) return m[1];
    m = s.match(/[?&]id=([^&#\s]+)/i); if (m) return m[1];
    m = s.match(/\/folders\/([^/?#\s]+)/i); if (m) return 'folder:' + m[1];
    return normalizeText(s);
  };
  const isDriveOrDocsHost = (u) => /^https?:\/\/(drive|docs)\.google\.com\//i.test(strVal(u));
  const isDriveFolderUrl = (u) => /https?:\/\/drive\.google\.com\/drive\/[^\s]*folders\//i.test(strVal(u));

  const idRegistry = [];
  const auditArtifact = (scopeLabel, fullKey, rawVal) => {
    const raw = strVal(rawVal);
    if (isBlank(raw)) return;
    const lower = raw.toLowerCase();
    const dbg = DEBUG_MARKERS.find((mk) => lower.includes(mk.toLowerCase()));
    if (dbg) addError(scopeLabel, fullKey, `this artifact field contains pasted debug text instead of only a link.`, `upload the debug capture to the task folder and paste only its Google Drive file link.`, `found debug marker "${dbg}".`);
    const htm = HTML_MARKERS.find((mk) => lower.includes(mk));
    if (htm) addError(scopeLabel, fullKey, `this artifact field contains raw HTML page source instead of only a link.`, `upload the saved page and paste only its Google Drive file link.`, `found HTML marker "${htm}".`);
    const urls = raw.match(URL_RE) || [];
    if (urls.length === 0) { addError(scopeLabel, fullKey, `this artifact field holds no link.`, `paste the Google Drive share link.`, `saw: "${preview(raw)}"`); return; }
    if (urls.length > 1) addError(scopeLabel, fullKey, `this artifact field holds ${urls.length} links; it must hold exactly one.`, `keep one link and move the others to their own field.`, `links: ${urls.slice(0, 3).join(' , ')}`);
    const url = urls[0];
    if (urls.length === 1 && raw.replace(url, '').trim().length > 0) {
      warn(scopeLabel, fullKey, `the field has a link plus surrounding text.`, `a bare link is easier to open -- remove the extra text.`, `extra: "${preview(raw.replace(url, '').trim())}"`);
    }
    if (isDriveFolderUrl(url)) {
      addError(scopeLabel, fullKey, `a Google Drive folder is linked instead of an individual file.`, `open the folder and paste the individual file's link -- a folder cannot be tied to one turn.`, `folder: ${url}`);
    } else if (!isDriveOrDocsHost(url)) {
      warn(scopeLabel, fullKey, `the link is not on drive.google.com or docs.google.com.`, `re-upload to the shared Drive folder if that is the team convention.`, `host: ${url}`);
    }
    idRegistry.push({ id: driveId(url), scopeLabel, fullKey });
  };

  for (let k = 1; k <= 10; k++) auditArtifact('Task', threadSlot(k), T(threadSlot(k)));
  auditArtifact('Task', 'geminiConversationHistory', T('geminiConversationHistory'));
  for (const side of presentSides) {
    auditArtifact(side.scope, side.keyOf('model1HtmlFileUpload'), side.get('model1HtmlFileUpload'));
    for (const dk of DEBUG_SLOTS) auditArtifact(side.scope, side.keyOf(dk), side.get(dk));
  }

  // D-01 -- two or more artifact slots resolve to the same Drive file id. Unconditional: no
  // field pair on this form is a sanctioned duplicate (re-audit this claim on any fork).
  {
    const byId = new Map();
    for (const rec of idRegistry) {
      if (rec.id.startsWith('folder:')) continue;
      if (!byId.has(rec.id)) byId.set(rec.id, []);
      byId.get(rec.id).push(rec);
    }
    for (const [id, group] of byId) {
      if (group.length < 2) continue;
      const names = group.map((g) => `${g.scopeLabel} "${labelOf(g.fullKey)}"`).join(', ');
      const allDebug = group.every((g) => DEBUG_SLOTS.includes(baseOf(g.fullKey)));
      const extra = allDebug ? ' Two different turns cannot produce the same debug capture.' : '';
      const anchor = group[group.length - 1];
      addError(anchor.scopeLabel, anchor.fullKey,
        `this artifact links the same Drive file as ${group.length - 1} other slot${group.length - 1 === 1 ? '' : 's'} (${names}).`,
        `give each slot its own file -- export a separate file per turn / per conversation and paste distinct links.${extra}`,
        `shared Drive file id ${id}.`);
    }
  }

  // ============================================================
  // §10 IDENTITY & COHERENCE (I, C)
  // ============================================================
  const firstModel = normalizeText(T('firstModel'));
  const firstEnv = normalizeText(T('firstPlaceEnvironment'));
  const secondEnv = normalizeText(T('secondPlaceEnvironment'));
  const discoveredCanons = new Set(nsFieldMap.keys());
  const namesForMsg = [...nsFieldMap.keys()].length ? sides.filter((s) => s.present).map((s) => `"${s.name}"`).join(', ') : '(none)';
  if (isFilled(firstModel) && nsFieldMap.size > 0 && !discoveredCanons.has(canonEnv(firstModel))) {
    addError('Task', 'firstModel', `the first model does not match either side present in this task.`, `select the model that actually went first; if the option list looks wrong, flag it to your lead.`, `first model "${strVal(T('firstModel'))}"; sides: ${namesForMsg}.`);
  }
  if (isFilled(firstEnv) && isFilled(secondEnv) && canonEnv(firstEnv) === canonEnv(secondEnv)) {
    addError('Task', 'secondPlaceEnvironment', `1st place and 2nd place name the same side.`, `choose two different sides for 1st and 2nd place.`, `both read "${strVal(T('firstPlaceEnvironment'))}".`);
  }
  for (const [key, val] of [['firstPlaceEnvironment', firstEnv], ['secondPlaceEnvironment', secondEnv]]) {
    if (isFilled(val) && nsFieldMap.size > 0 && !discoveredCanons.has(canonEnv(val))) {
      addError('Task', key, `this ranking names a side that is not present in this task.`, `pick one of the two sides being compared; if the option list looks wrong, flag it to your lead.`, `value "${strVal(T(key))}"; sides: ${namesForMsg}.`);
    }
  }
  {
    const sxs = normalizeText(T('qualityComparisonSxS'));
    if (isFilled(sxs) && isFilled(firstEnv)) {
      let prefers = null;
      if (/conversation a was/i.test(sxs)) prefers = 'A';
      else if (/conversation b was/i.test(sxs)) prefers = 'B';
      if (prefers) {
        const firstIsA = canonEnv(firstEnv) === canonEnv(CFG.modelA);
        const firstIsB = canonEnv(firstEnv) === canonEnv(CFG.modelB);
        if ((prefers === 'A' && firstIsB) || (prefers === 'B' && firstIsA)) {
          addError('Task', 'firstPlaceEnvironment', `the side-by-side verdict prefers Conversation ${prefers}, but 1st place names the other side.`, `make the 1st-place ranking and the side-by-side verdict agree on which conversation won.`, `verdict "${strVal(T('qualityComparisonSxS'))}"; 1st place "${strVal(T('firstPlaceEnvironment'))}".`);
        }
      }
    }
  }

  for (const side of presentSides) {
    const sv = side.get;
    const turns = declaredTurnsBySide.get(side.scope);

    if (isST) {
      const cc = classifyDim('contextualContinuity', sv('contextualContinuity'));
      const gate = normalizeText(sv('contextualContinuityGate'));
      const gateYes = eqNorm(gate, 'Yes');
      const gateNo = eqNorm(gate, 'No');
      if (cc === 'major' && isFilled(gate) && !gateYes) addError(side.scope, side.keyOf('contextualContinuityGate'), `Contextual Continuity is Major Issue but the cold-start gate is not Yes.`, `set the gate to Yes when continuity is a Major Issue (complete amnesia).`, `continuity "Major Issue"; gate "${strVal(sv('contextualContinuityGate'))}".`);
      if (gateYes && cc && cc !== 'major') addError(side.scope, side.keyOf('contextualContinuity'), `the cold-start gate is Yes but Contextual Continuity is not Major Issue.`, `either rate Contextual Continuity as Major Issue, or set the gate to No.`, `gate "Yes"; continuity "${strVal(sv('contextualContinuity'))}".`);
      if (gateYes) {
        const bad = [];
        for (const key of [...MEMORY_DIMS, 'targetLanguageMeaning']) { const v = sv(key); if (isFilled(v) && !isColdStart(v)) bad.push(key); }
        if (bad.length) {
          addError(side.scope, side.keyOf(bad[0]), `the cold-start gate is Yes, so every memory dimension and Target Language Meaning must read "${COLD_START}", but ${bad.length} ${bad.length === 1 ? 'does' : 'do'} not.`, `set "${COLD_START}" for each of those dimensions after a complete-amnesia gate.`, bad.map((k) => `"${side.lbl(k)}" = "${strVal(sv(k))}"`).join('; ') + '.');
        }
        const iqv = sv('internationalizationQuality');
        if (isFilled(iqv) && !eqNorm(iqv, IQ_NA)) addError(side.scope, side.keyOf('internationalizationQuality'), `the cold-start gate is Yes but Internationalization Quality is not "N/A".`, `set Internationalization Quality to "N/A" after a complete-amnesia gate.`, `value "${strVal(iqv)}".`);
      }
      if (gateNo) {
        const stray = MEMORY_DIMS.filter((key) => isColdStart(sv(key)));
        if (stray.length) {
          addError(side.scope, side.keyOf(stray[0]), `the gate is No (not cold start) but ${stray.length} memory dimension${stray.length === 1 ? '' : 's'} ${stray.length === 1 ? 'is' : 'are'} marked "${COLD_START}".`, `rate ${stray.length === 1 ? 'this dimension' : 'these dimensions'} normally, or set the gate to Yes if this really was complete amnesia.`, stray.map((k) => `"${side.lbl(k)}"`).join(', ') + '.');
        }
        // C-06 (warn): the highest-value false-block prevention in the spec (requirements
        // §10.1) -- gate No => TLM not cold-start and IQ not N/A, UNLESS the dominant thread
        // language is declared English, in which case no finding and a log line.
        if (!dominantHasEnglish) {
          if (isColdStart(sv('targetLanguageMeaning'))) warn(side.scope, side.keyOf('targetLanguageMeaning'), `the gate is No but Target Language Meaning is "${COLD_START}".`, `rate it normally, or tick "Dominant threads language is English" under dominant thread language if the material was in English.`);
          if (eqNorm(sv('internationalizationQuality'), IQ_NA)) warn(side.scope, side.keyOf('internationalizationQuality'), `the gate is No but Internationalization Quality is "N/A".`, `rate it normally, or tick "Dominant threads language is English" under dominant thread language if the material was in English.`);
        } else {
          logs.push(`${side.scope}: English-thread exception active -- dominant thread language is declared English; a stray N/A on dimensions 8/9 is sanctioned (no finding).`);
        }
      }
      if (cc === 'major') {
        const sat = normalizeText(sv('overallSatisfaction'));
        if (isFilled(sat) && !eqNorm(sat, 'Very dissatisfied')) addError(side.scope, side.keyOf('overallSatisfaction'), `Contextual Continuity is Major Issue, so overall satisfaction must be "Very dissatisfied".`, `set overall satisfaction to "Very dissatisfied" when continuity is a Major Issue.`, `continuity "Major Issue"; satisfaction "${strVal(sv('overallSatisfaction'))}".`);
      }
      {
        const dimsAll = ['contextualContinuity', ...MEMORY_DIMS, 'targetLanguageMeaning', 'internationalizationQuality'];
        let majors = 0, minors = 0, ratedCount = 0, anyRated = false, allNoIssue = true;
        const majorNames = [];
        for (const key of dimsAll) {
          const cls = classifyDim(key, sv(key));
          if (!cls || cls === 'other') continue;
          anyRated = true;
          if (cls === 'na') continue;
          ratedCount++;
          if (cls === 'major') { majors++; majorNames.push(side.lbl(key)); allNoIssue = false; }
          else if (cls === 'minor') { minors++; allNoIssue = false; }
        }
        const sat = normalizeText(sv('overallSatisfaction'));
        if (isFilled(sat) && anyRated) {
          if (majors >= 1 && SATISFIED.some((x) => eqNorm(sat, x))) warn(side.scope, side.keyOf('overallSatisfaction'), `${majorNames.length === 1 ? majorNames[0] + ' is' : majorNames.length + ' dimensions are'} rated Major Issue while overall satisfaction is "${strVal(sv('overallSatisfaction'))}".`, `check that the satisfaction rating reflects a Major Issue.`);
          if (minors >= 2 && majors === 0 && eqNorm(sat, 'Very satisfied')) warn(side.scope, side.keyOf('overallSatisfaction'), `two or more dimensions are rated Minor Issue while overall satisfaction is "Very satisfied".`, `check that the satisfaction rating reflects multiple minor issues.`);
          if (DISSATISFIED.some((x) => eqNorm(sat, x)) && ratedCount > 0 && allNoIssue) warn(side.scope, side.keyOf('overallSatisfaction'), `overall satisfaction is "${strVal(sv('overallSatisfaction'))}" while every rated dimension is No Issue.`, `record the problem on the dimension it belongs to, or raise the satisfaction rating.`);
        }
      }
    }

    if (isMT) {
      const turnErrLists = [];
      for (let k = 1; k <= 5; k++) {
        const list = asArr(sv(`turn${k}ContinuityErrorTypes`));
        turnErrLists.push(list);
        if (list.some((x) => eqNorm(x, 'None')) && list.some((x) => !eqNorm(x, 'None'))) {
          addError(side.scope, side.keyOf(`turn${k}ContinuityErrorTypes`), `Turn ${k} ticks "None" together with a real error.`, `for Turn ${k}, choose either "None" or the specific error(s), not both.`, `selected: ${list.join(', ')}.`);
        }
      }
      const rankSlots = [['errorSeverityFirst', '1st'], ['errorSeveritySecond', '2nd'], ['errorSeverityThird', '3rd']];
      const rankVals = rankSlots.map(([k]) => normalizeText(sv(k)));
      for (let i = 1; i < 3; i++) {
        if (isFilled(rankVals[i]) && !eqNorm(rankVals[i], NO_ISSUES_LOGGED)) {
          for (let h = 0; h < i; h++) {
            if (eqNorm(rankVals[h], NO_ISSUES_LOGGED)) {
              addError(side.scope, side.keyOf(rankSlots[i][0]), `the ${rankSlots[i][1]}-place severity names an error while the more severe ${rankSlots[h][1]} place is "No issues logged".`, `move the error up into the higher slot, or leave lower slots empty rather than ranking below an empty one.`, `${rankSlots[h][1]} "No issues logged"; ${rankSlots[i][1]} "${strVal(sv(rankSlots[i][0]))}".`);
              break;
            }
          }
        }
      }
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        if (isFilled(rankVals[i]) && !eqNorm(rankVals[i], NO_ISSUES_LOGGED) && rankVals[i] === rankVals[j]) {
          addError(side.scope, side.keyOf(rankSlots[j][0]), `the same error is ranked in both ${rankSlots[i][1]} and ${rankSlots[j][1]} place.`, `rank each distinct error once.`, `both read "${strVal(sv(rankSlots[j][0]))}".`);
        }
      }
      const allTurnErrors = new Set();
      for (const list of turnErrLists) for (const e of list) if (!eqNorm(e, 'None')) allTurnErrors.add(normalizeText(e));
      for (let i = 0; i < 3; i++) {
        const rv = rankVals[i];
        if (isFilled(rv) && !eqNorm(rv, NO_ISSUES_LOGGED) && !allTurnErrors.has(rv)) {
          addError(side.scope, side.keyOf(rankSlots[i][0]), `the ${rankSlots[i][1]}-place ranked error was never logged on any turn of this side.`, `rank only errors you logged in a turn's error checklist, or add the error to the turn where it occurred.`, `ranked "${strVal(sv(rankSlots[i][0]))}"; turn error checklists do not contain it.`);
        }
      }
      for (let k = 1; k <= 5; k++) {
        const srcKey = `turn${k}ContextSourceThreads`;
        const src = normalizeText(sv(srcKey));
        if (isBlank(src)) continue;
        const citesThread = /thread\s*\d+/i.test(src);
        const citesTurn = /turn\s*\d+/i.test(src);
        if (!citesThread && !citesTurn) warn(side.scope, side.keyOf(srcKey), `Turn ${k}'s context source names neither a thread nor a turn.`, `cite the thread and/or turn the expected context comes from (e.g. "Thread 2, Turn 3").`);
        if (declaredThreads !== null) {
          let m; const re = /thread\s*(\d+)/gi; const over = [];
          while ((m = re.exec(src)) !== null) { const n = parseInt(m[1], 10); if (n > declaredThreads) over.push(n); }
          if (over.length) warn(side.scope, side.keyOf(srcKey), `Turn ${k} cites Thread ${over.join(', ')}, beyond the ${declaredThreads} thread${declaredThreads === 1 ? '' : 's'} added.`, `cite only threads 1-${declaredThreads}, or correct the thread count.`);
        }
      }
    }
  }

  // ============================================================
  // §11 ASSIGNMENT vs SUBMISSION (B) -- self-skips with a loud log if the batch/input
  // root does not resolve. Silence there is silent blindness.
  // ============================================================
  const findInput = (name) => {
    const want = name.toLowerCase();
    const exact = Object.keys(inputByKey).find((k) => k.trim().toLowerCase() === want);
    const k = exact || Object.keys(inputByKey).find((kk) => kk.trim().toLowerCase().includes(want));
    return k ? { key: k, value: strVal(inputByKey[k]) } : null;
  };
  const batchResolved = Object.keys(inputByKey).length > 0 &&
    ['task type', 'first model', 'conversation track', 'target language', 'dialect'].some((c) => findInput(c));
  if (!batchResolved) {
    logs.push(`${VERSION}: batch axes unavailable -- assignment checks (task type / first model / track / language / dialect / turn-shape) SELF-SKIPPED. Route to the lead; never infer an axis from content.`);
  } else {
    const bTaskType = findInput('task type');
    const bFirstModel = findInput('first model');
    const bTrack = findInput('conversation track');
    const bLang = findInput('target language');
    const bDialect = findInput('dialect');
    logs.push(`Batch axes discovered: taskType=${bTaskType ? `"${bTaskType.value}"` : 'NOT FOUND'}; firstModel=${bFirstModel ? `"${bFirstModel.value}"` : 'NOT FOUND'}; track=${bTrack ? `"${bTrack.value}"` : 'NOT FOUND'}; language=${bLang ? `"${bLang.value}"` : 'NOT FOUND'}; dialect=${bDialect ? `"${bDialect.value}"` : 'NOT FOUND'}.`);
    if (bTaskType && bTaskType.value && isFilled(turnTypeRaw) && lettersOnly(bTaskType.value) !== lettersOnly(turnTypeRaw)) {
      addError('Task', 'turnType', `the turn type does not match the assigned task type.`, `set the turn type to match your assignment, or flag the mismatch to your lead.`, `assigned "${bTaskType.value}"; submitted "${strVal(T('turnType'))}".`);
    }
    if (bFirstModel && bFirstModel.value && isFilled(firstModel) && canonEnv(bFirstModel.value) !== canonEnv(firstModel)) {
      warn('Task', 'firstModel', `the first model differs from the assigned first model.`, `verify you ran the assigned first model; the batch sheet may be the stale side.`, `assigned "${bFirstModel.value}"; submitted "${strVal(T('firstModel'))}".`);
    }
    if (bTrack && bTrack.value && !eqCI(bTrack.value, 'N/A') && isFilled(trackTypeRaw) && !eqNorm(bTrack.value, trackTypeRaw)) {
      addError('Task', 'trackType', `the conversation track does not match the assigned track.`, `set the track to match your assignment, or flag the mismatch to your lead.`, `assigned "${bTrack.value}"; submitted "${strVal(T('trackType'))}".`);
    }
    if (bLang && bLang.value && isFilled(T('targetLanguage')) && !eqNorm(bLang.value, T('targetLanguage'))) {
      warn('Task', 'targetLanguage', `the target language differs from the assigned language.`, `verify the target language; the batch sheet may be the stale side.`, `assigned "${bLang.value}"; submitted "${strVal(T('targetLanguage'))}".`);
    }
    if (bDialect && bDialect.value && isFilled(T('dialect')) && !eqNorm(bDialect.value, T('dialect'))) {
      warn('Task', 'dialect', `the dialect differs from the assigned dialect.`, `verify the dialect; the batch sheet may be the stale side.`, `assigned "${bDialect.value}"; submitted "${strVal(T('dialect'))}".`);
    }
    if (isST) {
      for (const side of presentSides) {
        const t = declaredTurnsBySide.get(side.scope);
        if (t !== null && t !== 1) addError(side.scope, side.keyOf('numberOfTurns'), `this is a Single Turn task but the side declares ${t} turns.`, `a Single Turn task runs exactly one turn per side -- set the turn count to 1, or correct the task type.`, `turn type "Single Turn"; turns ${t}.`);
      }
    }
    if (isMT) {
      for (const side of presentSides) {
        const t = declaredTurnsBySide.get(side.scope);
        if (t !== null && t < 2) addError(side.scope, side.keyOf('numberOfTurns'), `this is a Multi Turn task but the side declares only ${t} turn${t === 1 ? '' : 's'}.`, `a Multi Turn task runs at least two turns per side -- add the remaining turn(s), or correct the task type.`, `turn type "Multi Turn"; turns ${t}.`);
      }
    }
  }

  // ============================================================
  // OUTPUT ASSEMBLY -- one merged block per field, Problem|Fix|Why; "Also:" joins, actions
  // fuzzy-de-duplicated on the first 40 characters; no check IDs in output (requirements §19)
  // ============================================================
  const scopeOrder = new Map([['Task', 0], ['Model A', 1], ['Model B', 2]]);
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

  if (errors.length === 0) {
    const sideNote = presentSides.length ? presentSides.map((s) => `${s.scope}=${declaredTurnsBySide.get(s.scope) !== null && declaredTurnsBySide.get(s.scope) !== undefined ? declaredTurnsBySide.get(s.scope) : '?'} turn(s)`).join(', ') : 'no sides discovered';
    successes.push(`Layer L1 (deterministic) checks pass (${turnTypeRaw || 'unknown turn type'}; ${sideNote}).`);
  }
  logs.push(`${VERSION}: L1 validation complete. sides=${presentSides.length}, findings=${findingsByField.size}, warnings=${warnings.length}.`);
}
