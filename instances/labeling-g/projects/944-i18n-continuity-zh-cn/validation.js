// i18n-continuity-validator-944 \u2014 I18n Continuity Quality E2E Eval (zh-CN), PROJECT 944.
//
// PROVENANCE: built ON THE continuity-validator-917 v0.8 ENGINE SKELETON (the production-
// verified reference script): same single-function layout (all tables and helpers INSIDE
// validate()), same shape-searched adapter carrying 917's v0.6/v0.7 production fixes (roots
// resolve by SEARCH anchored on the config's own key universe, never by a guessed path list),
// same findings machinery (merged per field, Problem|Fix|Why, "Also:" joins, 40-char fuzzy
// action de-dup), same namespace-discovery doctrine (exact canonical full-name match, all
// discovered namespaces logged on every run, unmatched namespaces skip with a log).
// 944's own check register (R/G/U/D/I/C/B from requirements.md, 56 checks) replaces 917's
// five-environment checks. GENERATED TABLES are emitted from project-config-id-944.json by
// scripts/build-944.mjs; the .js is never hand-edited (requirements \u00a718).
//
// CHANGELOG:
//   v1.0.2 (31 Aug 2026) \u2014 REBUILT ON THE 917 SKELETON. The first paste failed at save time
//     ("Validation failed: Unexpected identifier 'Validation' [<isolated-vm>]") and the
//     v1.0.1 hardening still left the script structured unlike anything proven in this
//     tool's runtime. 917 is the one engine of this family verified in production on this
//     platform, so 944 now follows it byte-for-byte in structure: no top-level statements
//     before the function, CFG tables inside validate(), 917's adapter/unwrap/labels logic
//     verbatim-by-doctrine. The deployable additionally stays 7-bit ASCII (every non-ASCII
//     character escaped as \uXXXX by the builder, asserted) so no paste-layer unicode
//     normalization can alter what the parser sees.
//     ADAPTER (carried from v1.0.1, re-based onto 917's code): the real runtime payload
//     (task 1264318) nests the answers at conversation_data.ratings as an ARRAY of
//     { key, question, human_input_value } (unanswered fields carry no value), with the
//     batch axes at top-level csv_data \u2014 while the export shape uses conversation.ratings
//     as an OBJECT MAP of key -> { value } with axes at conversation.input. Both shapes are
//     the exact trap 917's v0.6/v0.7 fixes solved; both resolve here by the same search.
//     Verified: real task 1264318 passes clean; 68 fixtures green in the tool's own sandbox.
//   v1.0.1 (31 Aug 2026) \u2014 deploy-rejection hardening (ASCII output, slim tables, no
//     nullish coalescing) + the runtime-shape adapter fix, superseded by the v1.0.2 rebase.
//   v1.0.0 (31 Aug 2026) \u2014 initial build from requirements.md (944 deterministic layer
//     v1.0.0): 97 config fields, 55 per side, 56 checks, zero phantom keys.
//
// CHECK IDS IMPLEMENTED (build-asserted, one each):
//   R-01 R-02 R-03 R-04 R-05 R-06 R-07 R-08 R-09
//   G-01 G-02 G-03 G-04 G-05 G-06 G-07 G-08 G-09 G-10 G-11 G-12 G-13
//   U-01 U-02 U-03 U-04 U-05 U-06 U-07  D-01  I-01 I-02 I-03
//   C-01 C-02 C-03 C-04 C-05 C-06 C-07 C-08 C-09 C-10 C-11 C-12 C-13 C-14 C-15 C-16
//   B-01 B-02 B-03 B-04 B-05 B-06 B-07
//
// Available globals: conversationData
// const errors = []; warnings = []; infos = []; successes = []; logs = [];

async function validate(conversationData) {
  const VERSION = 'i18n-continuity-validator-944-v1.0.2';

  // ===== GENERATED TABLES \u2014 emitted from project-config-id-944.json =====
  // DO NOT HAND-EDIT. Rebuild with: node scripts/build-944.mjs
  const CFG = {
    "projectId": 944,
    "modelA": "07 Pizzi Gemelli --> Fast (paid) (prod default + notebook)",
    "modelB": "Pcontext Mode 23 (Nippon) > Ramen (top 20) - Fast",
    "sxsKeys": [
      "numberOfTurns",
      "testResponse1DebugInfo",
      "testResponse2DebugInfo",
      "model1TestResponse3DebugInfo",
      "model1TestResponse4DebugInfo",
      "model1TestResponse5DebugInfo",
      "model1HtmlFileUpload",
      "conversationFeedback",
      "overallSatisfaction",
      "contextualContinuity",
      "contextualContinuityGate",
      "utilityRelevance",
      "constraintExpertiseAdherence",
      "stateEntityProgressTracking",
      "temporalAwareness",
      "granularityDepth",
      "targetLanguageMeaning",
      "targetLanguageMeaningRationale",
      "internationalizationQuality",
      "internationalizationMinorIssues",
      "internationalizationMajorIssues",
      "internationalizationRationale",
      "multiTurnSatisfaction",
      "turn1Continuity",
      "turn2Continuity",
      "turn3Continuity",
      "turn4Continuity",
      "turn5Continuity",
      "turn1ContinuityErrorTypes",
      "turn1ExpectedContext",
      "turn1ContextSourceThreads",
      "turn1ModelCorrectionOutcome",
      "turn2ContinuityErrorTypes",
      "turn2ExpectedContext",
      "turn2ContextSourceThreads",
      "turn2ModelCorrectionOutcome",
      "turn3ContinuityErrorTypes",
      "turn3ExpectedContext",
      "turn3ContextSourceThreads",
      "turn3ModelCorrectionOutcome",
      "turn4ContinuityErrorTypes",
      "turn4ExpectedContext",
      "turn4ContextSourceThreads",
      "turn4ModelCorrectionOutcome",
      "turn5ContinuityErrorTypes",
      "turn5ExpectedContext",
      "turn5ContextSourceThreads",
      "turn5ModelCorrectionOutcome",
      "errorSeverityFirst",
      "errorSeverityFirstRationale",
      "errorSeveritySecond",
      "errorSeveritySecondRationale",
      "errorSeverityThird",
      "errorSeverityThirdRationale",
      "secondModelLock"
    ],
    "labels": {
      "setupCheck": "Setup Checks Required",
      "bp1": "bp1",
      "p0CujCategory": "P0 CUJ category",
      "targetLanguage": "Target Language",
      "dialect": "Dialect",
      "turnType": "Turn Type",
      "trackType": "Track Type",
      "pivotToTopicTurnForTrackBOnly": " Pivot to Topic Turn(For Track B only)",
      "temporalTag": "Temporal Tag (if relevant)",
      "sensitiveTopicTag": "Sensitive Topic Tag (if relevant)",
      "geminiConversationHistory": "Gemini Conversation History",
      "accountAge": "Account Age",
      "recordings": "Recordings",
      "numberOfThreadsAdded": "Number of Threads Added",
      "topicConversationsHtml1": "Topic Conversations (HTML) 1",
      "topicConversationsHtml2": "Topic Conversations (HTML) 2",
      "topicConversationsHtml3": "Topic Conversations (HTML) 3",
      "topicConversationsHtml4": "Topic Conversations (HTML) 4",
      "topicConversationsHtml5": "Topic Conversations (HTML) 5",
      "topicConversationsHtml6": "Topic Conversations (HTML) 6",
      "topicConversationsHtml7": "Topic Conversations (HTML) 7",
      "topicConversationsHtml8": "Topic Conversations (HTML) 8",
      "topicConversationsHtml9": "Topic Conversations (HTML) 9",
      "topicConversationsHtml10": "Topic Conversations (HTML) 10",
      "dominantThreadLanguageMatching": "Dominant thread language matching",
      "dominantThreadLanguageMatchingOtherRationale": "Dominant thread language matching - Other rationale",
      "myGoal": "My Goal - English version",
      "keyContext": "Key Context - English version",
      "targetLanguageVersion": "My Goal - Target language version",
      "keyContextTargetLanguageVersion": "Key Context - Target language version",
      "languageNuance": "Target-language nuance",
      "prompt": "Prompt",
      "promptGoalAlignment": "Prompt Goal Alignment",
      "firstModel": "first model",
      "preQuestionsBreakpoint": "Pre-questions-breakpoint",
      "compareModels": "compare models",
      "bp2": "bp2",
      "numberOfTurns": "Number of Turns",
      "testResponse1DebugInfo": "Model Response 1 Debug Info",
      "testResponse2DebugInfo": "Model Response 2 Debug Info",
      "model1TestResponse3DebugInfo": "Model Response 3 Debug Info",
      "model1TestResponse4DebugInfo": "Model Response 4 Debug Info",
      "model1TestResponse5DebugInfo": "Model Response 5 Debug Info",
      "model1HtmlFileUpload": "Model HTML",
      "conversationFeedback": "Feedback",
      "overallSatisfaction": "Overall Satisfaction",
      "contextualContinuity": "2a. Contextual Continuity",
      "contextualContinuityGate": "2b. Contextual Continuity - Gate",
      "utilityRelevance": "3. Utility & Relevance",
      "constraintExpertiseAdherence": "4. Constraint & Expertise Adherence",
      "stateEntityProgressTracking": "5. State, Entity, and Progress Tracking",
      "temporalAwareness": "6. Temporal Awareness",
      "granularityDepth": "7. Granularity & Depth of Info",
      "targetLanguageMeaning": "8. Preserving Target Language Meaning",
      "targetLanguageMeaningRationale": "8. Preserving  Target Language Meaning Rationale",
      "internationalizationQuality": "9. Internationalization Linguistic Quality",
      "internationalizationMinorIssues": "9a. Internationalization Minor-Issue Patterns",
      "internationalizationMajorIssues": "9b. Internationalization Major-Issue Patterns",
      "internationalizationRationale": "9c. Internationalization Rationale",
      "multiTurnSatisfaction": "Multi-Turn Overall Satisfaction",
      "turn1Continuity": "Turn 1 Continuity Rating",
      "turn2Continuity": "Turn 2 Continuity Rating",
      "turn3Continuity": "Turn 3 Continuity Rating",
      "turn4Continuity": "Turn 4 Continuity Rating",
      "turn5Continuity": "Turn 5 Continuity Rating",
      "turn1ContinuityErrorTypes": "Turn 1 Continuity Error Checklist",
      "turn1ExpectedContext": "Turn 1 Expected Context",
      "turn1ContextSourceThreads": "Turn 1 Context Source Threads and Turns",
      "turn1ModelCorrectionOutcome": "Turn 1 Correction / Nudge Outcome",
      "turn2ContinuityErrorTypes": "Turn 2 Continuity Error Checklist",
      "turn2ExpectedContext": "Turn 2 Expected Context",
      "turn2ContextSourceThreads": "Turn 2 Context Source Threads and Turns",
      "turn2ModelCorrectionOutcome": "Turn 2 Correction / Nudge Outcome",
      "turn3ContinuityErrorTypes": "Turn 3 Continuity Error Checklist",
      "turn3ExpectedContext": "Turn 3 Expected Context",
      "turn3ContextSourceThreads": "Turn 3 Context Source Threads and Turns",
      "turn3ModelCorrectionOutcome": "Turn 3 Correction / Nudge Outcome",
      "turn4ContinuityErrorTypes": "Turn 4 Continuity Error Checklist",
      "turn4ExpectedContext": "Turn 4 Expected Context",
      "turn4ContextSourceThreads": "Turn 4 Context Source Threads and Turns",
      "turn4ModelCorrectionOutcome": "Turn 4 Correction / Nudge Outcome",
      "turn5ContinuityErrorTypes": "Turn 5 Continuity Error Checklist",
      "turn5ExpectedContext": "Turn 5 Expected Context",
      "turn5ContextSourceThreads": "Turn 5 Context Source Threads and Turns",
      "turn5ModelCorrectionOutcome": "Turn 5 Correction / Nudge Outcome",
      "errorSeverityFirst": "1st Place (Most Severe / Detrimental)",
      "errorSeverityFirstRationale": "1st Place Rationale",
      "errorSeveritySecond": "2nd Place",
      "errorSeveritySecondRationale": "2nd Place Rationale",
      "errorSeverityThird": "3rd Place",
      "errorSeverityThirdRationale": "3rd Place Rationale",
      "secondModelLock": "Critical Requirement",
      "qualityComparisonSxS": "Quality Comparison SxS",
      "firstPlaceEnvironment": "1st Place (Best Overall)",
      "secondPlaceEnvironment": "2nd Place (Runner Up)",
      "qualityComparisonSxSRationale": "2. Overall Satisfaction Rationale",
      "privacyGate": "Privacy Gate"
    }
  };
  // ===== END GENERATED TABLES =====
  if (!CFG) {
    errors.push('Validator configuration tables are missing \u2014 rebuild the script with scripts/build-944.mjs before deploying.');
    return;
  }

  // ===== adapter (917 v0.7 doctrine) =====
  // Roots are DISCOVERED, not guessed. 917's v0.5 adapter carried hardcoded paths and
  // aborted twice in production; a ratings root is anything, array or object, whose keys are
  // THIS FORM'S OWN KEYS \u2014 the one anchor that cannot drift. Two shapes are live on 944
  // (both verified): the runtime array (conversation_data.ratings, entries carrying key +
  // question + human_input_value, axes at csv_data \u2014 real task 1264318) and the export
  // object map (conversation.ratings of key -> { value }, axes at conversation.input).
  // Every resolution is logged with the path it was found at.
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
      // every entry is a value holder: { value } wrapper, or a primitive
      const holders = keys.filter((k) => {
        const v = n[k];
        return v === null || typeof v !== 'object' || 'value' in v || 'human_input_value' in v;
      });
      if (holders.length < keys.length * 0.8) return false;
      return knownHits(keys) >= 3;
    }
    return false;
  };

  // Unwrap whichever value envelope this payload uses.
  const unwrap = (v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('human_input_value' in v) return v.human_input_value;
      if ('value' in v) return v.value;
      return null;   // structural blob (breakpoints, __config__) \u2014 not an answer
    }
    return v;
  };

  const ratingsHit = findByShape(conversationData, looksLikeRatings);
  const ratings = ratingsHit ? ratingsHit.value : null;

  if (!ratings) {
    const topKeys = conversationData && typeof conversationData === 'object'
      ? Object.keys(conversationData).join(', ') : String(conversationData);
    errors.push(
      `Could not locate the submitted answers in this task's data | Problem: the review script could not find the form answers anywhere in the task payload, so no check could run. This is a platform or configuration issue, not something wrong with your submission. | Fix: report this task to your lead \u2014 no rework is needed from you.`);
    logs.push(`${VERSION}: ABORTED \u2014 no root carrying this form's keys was found. Top-level keys seen: [${topKeys}].`);
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
  // The runtime shape may carry no labels; fall back to the config's on-screen names.
  for (const k of Object.keys(byKey)) {
    if (!labelByKey[k]) labelByKey[k] = CFG.labels[baseOf(k)] || k;
  }
  logs.push(`${VERSION}: ratings root resolved at ${ratingsHit.path} \u2014 ${Array.isArray(ratings) ? 'array' : 'object map'}, ${Object.keys(byKey).length} keys, labels ${Array.isArray(ratings) && ratings.some((r) => r.question) ? 'from payload' : 'from config'}.`);

  // Batch axes: an object carrying the assignment columns. On the runtime payload they live
  // under top-level csv_data; on the export under conversation.input. Accept either, by shape.
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
    logs.push('BATCH-AXIS ROOT NOT RESOLVED: no metadata object carrying the assignment columns was found anywhere in the payload \u2014 all assignment checks self-skip. Route to the lead; never infer an axis from content.');
  }

  // ===== helpers =====
  // \u00a72 normalisation ladder \u2014 one shared function, used everywhere a comparison happens:
  // NFC -> strip zero-width -> curly quotes to straight -> en/em/figure dashes to hyphen ->
  // collapse whitespace -> trim. (All unicode written as \uXXXX so the source stays ASCII.)
  const strVal = (v) => (typeof v === 'string' ? v.trim() : (v === null || v === undefined ? '' : String(v).trim()));
  const normalizeText = (s) => {
    return strVal(s)
      .normalize('NFC')
      .replace(/[\u200b-\u200d\ufeff]/g, '')
      .replace(/[\u2018\u2019\u201b\u2032]/g, "'")
      .replace(/[\u201c\u201d\u2033]/g, '"')
      .replace(/[\u2010-\u2015\u2212\ufe58\ufe63\uff0d]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  };
  const eqNorm = (a, b) => normalizeText(a) === normalizeText(b);
  const eqCI = (a, b) => normalizeText(a).toLowerCase() === normalizeText(b).toLowerCase();
  const lettersOnly = (s) => normalizeText(s).toLowerCase().replace(/[^a-z]+/g, '');

  // Canonicalization for MODEL NAME matching only (exact full-string canonical match,
  // never substring \u2014 requirements \u00a71.1). Same shape as 917's canonEnv.
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

  // ===== findings machinery (917's \u2014 merged per field, Problem|Fix|Why) =====
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
    let m = `${scopeLabel} \u2014 "${labelOf(fieldKey)}" | Problem: ${headline} | Fix: ${action}`;
    if (evidence) m += ` | Why: ${evidence}`;
    warnings.push(m);
  };

  // ===== namespace discovery (\u00a71.1) =====
  // Per-side keys arrive as 'compareModels.<model name>.<questionKey>'. Discovery: for every
  // ratings key, try each per-side question key as a '.'-suffix (split from the RIGHT at the
  // last '.', NEVER on ' - ' \u2014 Model B's name contains ' - '); the remainder, minus a leading
  // 'compareModels' segment, must EXACT-match a declared model name after canonicalization.
  // No match -> skip with a log; fix the identity table, never loosen the match (\u00a715 row 5).
  const envByCanon = new Map([[canonEnv(CFG.modelA), 'Model A'], [canonEnv(CFG.modelB), 'Model B']]);
  const nsFieldMap = new Map();       // canon -> { questionKey -> fullKey }
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
    logs.push(`UNMATCHED NAMESPACES (skipped, exact-match rule): [${[...unmatchedNamespaces].join(' | ')}] \u2014 if these are real sides, the identity table needs rebinding.`);
  }
  if (nsFieldMap.size === 0) {
    logs.push('NO SIDE NAMESPACES DISCOVERED \u2014 per-side checks self-skip. Either the payload is task-level-only or the namespace pattern differs (first-task item 1).');
  }

  // Per-side accessor set (917's envs pattern, two sides)
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
    if (!s.present) logs.push(`${s.scope} ("${s.name}"): namespace not found in payload \u2014 per-side checks self-skip for this side.`);
  }

  const T = (key) => byKey[key];

  // ===== enum constants (from the config's per-field vocabularies \u2014 \u00a71.1) =====
  // internationalizationQuality uses PLURAL forms and plain N/A; everything else singular
  // and 'N/A \u2014 Cold Start'. Per-field vocabularies, never one shared list.
  const COLD_START = 'N/A \u2014 Cold Start';
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

  // Task-level context needed by many gates
  const turnTypeRaw = normalizeText(T('turnType'));
  const isST = eqNorm(turnTypeRaw, 'Single Turn');
  const isMT = eqNorm(turnTypeRaw, 'Multi Turn');
  const trackTypeRaw = normalizeText(T('trackType'));
  const dominantLang = asArr(T('dominantThreadLanguageMatching'));
  const dominantHasOther = dominantLang.some((x) => eqCI(x, 'Other(Please specify)'));
  const dominantHasEnglish = dominantLang.some((x) => eqCI(x, 'Dominant threads language is English'));

  // ============================================================
  // \u00a74 COMPLETENESS (R)
  // ============================================================
  const R01_ALWAYS = ['p0CujCategory', 'targetLanguage', 'dialect', 'turnType', 'numberOfThreadsAdded', 'myGoal', 'keyContext', 'targetLanguageVersion', 'keyContextTargetLanguageVersion', 'languageNuance', 'prompt', 'firstModel', 'geminiConversationHistory', 'dominantThreadLanguageMatching'];
  for (const key of R01_ALWAYS) {                                   // R-01
    if (isBlank(T(key))) addError('Task', key, `this required field is blank.`, `fill in "${labelOf(key)}".`);
  }
  if (isFilled(T('turnType')) && !isST && !isMT) {                  // R-02
    addError('Task', 'turnType', `the value "${strVal(T('turnType'))}" is not one of the two turn types.`, `select either Single Turn or Multi Turn.`);
  }

  const declaredThreads = parseIntSafe(T('numberOfThreadsAdded'));
  const threadSlot = (k) => `topicConversationsHtml${k}`;
  if (declaredThreads !== null) {
    const emptyInRange = [];
    for (let k = 1; k <= Math.min(declaredThreads, 10); k++) if (isBlank(T(threadSlot(k)))) emptyInRange.push(k); // R-03
    if (emptyInRange.length) {
      addError('Task', threadSlot(emptyInRange[0]),
        `${declaredThreads} thread${declaredThreads === 1 ? '' : 's'} declared but thread HTML slot${emptyInRange.length === 1 ? '' : 's'} ${emptyInRange.join(', ')} ${emptyInRange.length === 1 ? 'is' : 'are'} empty.`,
        `paste the missing thread HTML link${emptyInRange.length === 1 ? '' : 's'}, or lower "${labelOf('numberOfThreadsAdded')}" to the number of threads you actually added.`,
        `"${labelOf('numberOfThreadsAdded')}" = ${declaredThreads}; empty: ${emptyInRange.join(', ')}.`);
    }
    const stale = [];
    for (let k = declaredThreads + 1; k <= 10; k++) if (isFilled(T(threadSlot(k)))) stale.push(k);            // R-04
    if (stale.length) {
      // Fix text must un-hide, clear, re-hide: the slot is invisible at the current count.
      const highest = stale[stale.length - 1];
      addError('Task', threadSlot(highest),
        `thread HTML slot${stale.length === 1 ? '' : 's'} ${stale.join(', ')} still hold${stale.length === 1 ? 's' : ''} content from an earlier attempt but ${stale.length === 1 ? 'is' : 'are'} hidden at the current thread count.`,
        `temporarily raise "${labelOf('numberOfThreadsAdded')}" to ${highest} so the hidden slot${stale.length === 1 ? '' : 's'} reappear${stale.length === 1 ? 's' : ''}, clear ${stale.length === 1 ? 'it' : 'them'}, then set the count back to ${declaredThreads}.`,
        `"${labelOf('numberOfThreadsAdded')}" = ${declaredThreads}; hidden-but-filled: ${stale.join(', ')}.`);
    }
  }

  if (isBlank(T('qualityComparisonSxSRationale'))) {                                                          // R-09
    addError('Task', 'qualityComparisonSxSRationale', `the overall side-by-side rationale is blank.`, `explain why one conversation was better than the other in "${labelOf('qualityComparisonSxSRationale')}".`);
  }

  // Per-side R-05 / R-06 / R-07 / R-08
  const declaredTurnsBySide = new Map();
  for (const side of presentSides) {
    const turns = parseIntSafe(side.get('numberOfTurns'));
    declaredTurnsBySide.set(side.scope, turns);
    if (turns === null) {                                                                                     // R-05
      addError(side.scope, side.keyOf('numberOfTurns'), `the turn count is missing or unreadable.`, `select how many turns you ran on this side.`);
    }
    for (const key of ['model1HtmlFileUpload', 'conversationFeedback']) {                                     // R-06
      if (isBlank(side.get(key))) addError(side.scope, side.keyOf(key), `this required field is blank.`, `fill in "${side.lbl(key)}".`);
    }
    if (turns !== null) {
      const emptyDebug = [];
      for (let k = 1; k <= Math.min(turns, 5); k++) if (isBlank(side.get(DEBUG_SLOTS[k - 1]))) emptyDebug.push(k); // R-07
      if (emptyDebug.length) {
        addError(side.scope, side.keyOf(DEBUG_SLOTS[emptyDebug[0] - 1]),
          `${turns} turn${turns === 1 ? '' : 's'} declared but Turn ${emptyDebug.join(', ')} debug info ${emptyDebug.length === 1 ? 'is' : 'are'} empty.`,
          `paste the missing debug link${emptyDebug.length === 1 ? '' : 's'}, or lower "${side.lbl('numberOfTurns')}" to the number of turns you actually ran.`,
          `"${side.lbl('numberOfTurns')}" = ${turns}; empty: Turn ${emptyDebug.join(', Turn ')}.`);
      }
      const staleDebug = [];
      for (let k = turns + 1; k <= 5; k++) if (isFilled(side.get(DEBUG_SLOTS[k - 1]))) staleDebug.push(k);    // R-08
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
  // \u00a75 GATE CASCADES (G) \u2014 required-when-shown + empty-when-hidden,
  // transcribed from the config's own displayCondition expressions.
  // ============================================================
  const clearFix = (labelText) => `clear "${labelText}" \u2014 it is hidden at the current settings; if it is hidden on screen, temporarily change the controlling answer so it reappears, delete its content, then restore the controlling answer.`;

  // --- task-level gates ---
  // G-01 trackType: shown when Multi Turn
  if (isMT && isBlank(T('trackType'))) addError('Task', 'trackType', `Track Type is required for a Multi Turn task but is blank.`, `select the conversation track (Track A or Track B).`);
  if (!isMT && isFilled(T('trackType'))) addError('Task', 'trackType', `Track Type is filled but only applies to a Multi Turn task.`, clearFix(labelOf('trackType')));
  // G-02 pivotToTopicTurnForTrackBOnly: shown when trackType == Track B
  const showPivot = isMT && eqNorm(trackTypeRaw, 'Track B');
  if (showPivot && isBlank(T('pivotToTopicTurnForTrackBOnly'))) addError('Task', 'pivotToTopicTurnForTrackBOnly', `the Track B pivot-to-topic turn is required but is blank.`, `describe the pivot-to-topic turn used for Track B.`);
  if (!showPivot && isFilled(T('pivotToTopicTurnForTrackBOnly'))) addError('Task', 'pivotToTopicTurnForTrackBOnly', `the Track B pivot field is filled but this task is not Track B.`, clearFix(labelOf('pivotToTopicTurnForTrackBOnly')));
  // G-03 promptGoalAlignment: shown when Single Turn (leftover warns only)
  if (isST && isBlank(T('promptGoalAlignment'))) addError('Task', 'promptGoalAlignment', `Prompt Goal Alignment is required for a Single Turn task but is blank.`, `describe how the prompt aligns with the stated goal.`);
  if (!isST && isFilled(T('promptGoalAlignment'))) warn('Task', 'promptGoalAlignment', `Prompt Goal Alignment is filled but only applies to a Single Turn task.`, `clear it if it is left over from an earlier attempt.`);
  // G-04 dominant-language "Other" rationale (leftover warns only)
  if (dominantHasOther && isBlank(T('dominantThreadLanguageMatchingOtherRationale'))) addError('Task', 'dominantThreadLanguageMatchingOtherRationale', `you selected "Other" for the dominant thread language but gave no rationale.`, `specify the dominant thread language in "${labelOf('dominantThreadLanguageMatchingOtherRationale')}".`);
  if (!dominantHasOther && isFilled(T('dominantThreadLanguageMatchingOtherRationale'))) warn('Task', 'dominantThreadLanguageMatchingOtherRationale', `the dominant-language "Other" rationale is filled but "Other" is not selected.`, `clear it if it is left over from an earlier attempt.`);

  // --- per-side gates ---
  for (const side of presentSides) {
    const turns = declaredTurnsBySide.get(side.scope);
    const sv = side.get;
    const gate = normalizeText(sv('contextualContinuityGate'));
    const gateNo = eqNorm(gate, 'No');

    // G-05 ST rating block: required when ST, cleared when MT
    if (isST) {
      for (const key of ST_RATING_FIELDS) {
        if (isBlank(sv(key))) addError(side.scope, side.keyOf(key), `this Single Turn rating is required but is blank.`, `answer "${side.lbl(key)}".`);
      }
    } else if (isMT) {
      for (const key of ST_RATING_FIELDS) {
        if (isFilled(sv(key))) addError(side.scope, side.keyOf(key), `this Single Turn rating is filled on a Multi Turn task, where it does not apply.`, clearFix(side.lbl(key)));
      }
    }

    // G-06 MT rating block: required when MT, cleared when ST
    if (isMT) {
      if (isBlank(sv('multiTurnSatisfaction'))) addError(side.scope, side.keyOf('multiTurnSatisfaction'), `the Multi Turn overall satisfaction is required but is blank.`, `answer "${side.lbl('multiTurnSatisfaction')}".`);
    } else if (isST) {
      for (const key of MT_RATING_FIELDS) {
        if (isFilled(sv(key))) addError(side.scope, side.keyOf(key), `this Multi Turn field is filled on a Single Turn task, where it does not apply.`, clearFix(side.lbl(key)));
      }
    }

    // G-07 turnKContinuity: shown when MT and k <= numberOfTurns; cleared when k > numberOfTurns
    if (isMT) {
      for (let k = 1; k <= 5; k++) {
        const key = `turn${k}Continuity`;
        if (turns !== null && k <= turns && isBlank(sv(key))) addError(side.scope, side.keyOf(key), `Turn ${k} continuity rating is required but is blank.`, `rate continuity for Turn ${k}.`);
        if (turns !== null && k > turns && isFilled(sv(key))) addError(side.scope, side.keyOf(key), `Turn ${k} continuity is rated but the side declares only ${turns} turn${turns === 1 ? '' : 's'}.`, clearFix(side.lbl(key)));
      }
    }

    // G-08 turn-K detail trio: shown when MT, k <= numberOfTurns, error list non-empty and not "None"
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

    // G-09..G-12: ST-only issue rationales/patterns
    if (isST) {
      const tlm = classifyDim('targetLanguageMeaning', sv('targetLanguageMeaning'));
      if (gateNo && (tlm === 'minor' || tlm === 'major') && isBlank(sv('targetLanguageMeaningRationale'))) {  // G-09
        addError(side.scope, side.keyOf('targetLanguageMeaningRationale'), `Target Language Meaning is rated an issue but its rationale is blank.`, `explain the target-language meaning issue in "${side.lbl('targetLanguageMeaningRationale')}".`);
      }
      const iq = classifyDim('internationalizationQuality', sv('internationalizationQuality'));
      if (gateNo && iq === 'minor' && asArr(sv('internationalizationMinorIssues')).length === 0) {            // G-10
        addError(side.scope, side.keyOf('internationalizationMinorIssues'), `Internationalization is rated Minor Issues but no pattern is ticked.`, `tick at least one minor-issue pattern.`);
      }
      if (gateNo && iq === 'major' && asArr(sv('internationalizationMajorIssues')).length === 0) {            // G-11
        addError(side.scope, side.keyOf('internationalizationMajorIssues'), `Internationalization is rated Major Issues but no pattern is ticked.`, `tick at least one major-issue pattern.`);
      }
      if (gateNo && (iq === 'minor' || iq === 'major') && isBlank(sv('internationalizationRationale'))) {     // G-12
        addError(side.scope, side.keyOf('internationalizationRationale'), `Internationalization is rated an issue but its rationale is blank.`, `explain the internationalization issue in "${side.lbl('internationalizationRationale')}".`);
      }
    }

    // G-13 errorSeverityXRationale: shown when MT and the ranked slot is not "No issues logged"
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
  // \u00a76 / \u00a77 ARTIFACT URL INTEGRITY (U) + IDENTITY (D)
  // Project rule: every artifact field holds exactly one Google Drive FILE link and nothing
  // else. Silent normalisation, never a finding: leading/trailing whitespace and newlines
  // inside a link field (observed live on task 1264311).
  // ============================================================
  const URL_RE = /https?:\/\/[^\s'"<>]+/gi;
  const DEBUG_MARKERS = ['<ctrl99>', '<ctrl100>', 'LM Prefix', 'Model ID:', 'num_turns_read_from_footprints', 'BAS->', 'reagent_trace'];
  const HTML_MARKERS = ['<!doctype', '<html', '<head', '<body', '<div', '<span class'];
  const driveId = (u) => {                                   // \u00a76 extraction order
    const s = strVal(u);
    let m = s.match(/\/d\/([^/?#\s]+)/i); if (m) return m[1];
    m = s.match(/[?&]id=([^&#\s]+)/i); if (m) return m[1];
    m = s.match(/\/folders\/([^/?#\s]+)/i); if (m) return 'folder:' + m[1];
    return normalizeText(s);
  };
  const isDriveOrDocsHost = (u) => /^https?:\/\/(drive|docs)\.google\.com\//i.test(strVal(u));
  const isDriveFolderUrl = (u) => /https?:\/\/drive\.google\.com\/drive\/[^\s]*folders\//i.test(strVal(u));

  const idRegistry = [];                                     // { id, scope, key, fullKey } for D-01
  const auditArtifact = (scopeLabel, fullKey, rawVal) => {
    const raw = strVal(rawVal);
    if (isBlank(raw)) return;
    const lower = raw.toLowerCase();
    const dbg = DEBUG_MARKERS.find((mk) => lower.includes(mk.toLowerCase()));
    if (dbg) addError(scopeLabel, fullKey, `this artifact field contains pasted debug text instead of only a link.`, `upload the debug capture to the task folder and paste only its Google Drive file link.`, `found debug marker "${dbg}".`); // U-01
    const htm = HTML_MARKERS.find((mk) => lower.includes(mk));
    if (htm) addError(scopeLabel, fullKey, `this artifact field contains raw HTML page source instead of only a link.`, `upload the saved page and paste only its Google Drive file link.`, `found HTML marker "${htm}".`); // U-02
    const urls = raw.match(URL_RE) || [];
    if (urls.length === 0) { addError(scopeLabel, fullKey, `this artifact field holds no link.`, `paste the Google Drive share link.`, `saw: "${preview(raw)}"`); return; } // U-03
    if (urls.length > 1) addError(scopeLabel, fullKey, `this artifact field holds ${urls.length} links; it must hold exactly one.`, `keep one link and move the others to their own field.`, `links: ${urls.slice(0, 3).join(' , ')}`); // U-04
    const url = urls[0];
    if (urls.length === 1 && raw.replace(url, '').trim().length > 0) {                                        // U-05 (warn)
      warn(scopeLabel, fullKey, `the field has a link plus surrounding text.`, `a bare link is easier to open \u2014 remove the extra text.`, `extra: "${preview(raw.replace(url, '').trim())}"`);
    }
    if (isDriveFolderUrl(url)) {                                                                              // U-06
      addError(scopeLabel, fullKey, `a Google Drive folder is linked instead of an individual file.`, `open the folder and paste the individual file's link \u2014 a folder cannot be tied to one turn.`, `folder: ${url}`);
    } else if (!isDriveOrDocsHost(url)) {                                                                     // U-07 (warn)
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

  // D-01 \u2014 two or more artifact slots resolve to the same Drive file id. Unconditional:
  // no field pair on this form is a sanctioned duplicate (re-audit this claim on any fork).
  {
    const byId = new Map();
    for (const rec of idRegistry) {
      if (rec.id.startsWith('folder:')) continue;            // folders already flagged by U-06
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
        `give each slot its own file \u2014 export a separate file per turn / per conversation and paste distinct links.${extra}`,
        `shared Drive file id ${id}.`);
    }
  }

  // ============================================================
  // \u00a78 IDENTITY & COHERENCE (I, C)
  // ============================================================
  const firstModel = normalizeText(T('firstModel'));
  const firstEnv = normalizeText(T('firstPlaceEnvironment'));
  const secondEnv = normalizeText(T('secondPlaceEnvironment'));
  const discoveredCanons = new Set(nsFieldMap.keys());
  const namesForMsg = [...nsFieldMap.keys()].length ? sides.filter((s) => s.present).map((s) => `"${s.name}"`).join(', ') : '(none)';
  // I-01 firstModel must exactly equal one of the discovered per-side namespaces
  if (isFilled(firstModel) && nsFieldMap.size > 0 && !discoveredCanons.has(canonEnv(firstModel))) {
    addError('Task', 'firstModel', `the first model does not match either side present in this task.`, `select the model that actually went first; if the option list looks wrong, flag it to your lead.`, `first model "${strVal(T('firstModel'))}"; sides: ${namesForMsg}.`);
  }
  // I-02 firstPlaceEnvironment != secondPlaceEnvironment
  if (isFilled(firstEnv) && isFilled(secondEnv) && canonEnv(firstEnv) === canonEnv(secondEnv)) {
    addError('Task', 'secondPlaceEnvironment', `1st place and 2nd place name the same side.`, `choose two different sides for 1st and 2nd place.`, `both read "${strVal(T('firstPlaceEnvironment'))}".`);
  }
  // I-03 each ranking must exactly equal a discovered namespace
  for (const [key, val] of [['firstPlaceEnvironment', firstEnv], ['secondPlaceEnvironment', secondEnv]]) {
    if (isFilled(val) && nsFieldMap.size > 0 && !discoveredCanons.has(canonEnv(val))) {
      addError('Task', key, `this ranking names a side that is not present in this task.`, `pick one of the two sides being compared; if the option list looks wrong, flag it to your lead.`, `value "${strVal(T(key))}"; sides: ${namesForMsg}.`);
    }
  }
  // C-01 qualityComparisonSxS naming Conversation A/B must agree with firstPlaceEnvironment
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

  // Per-side coherence
  for (const side of presentSides) {
    const sv = side.get;
    const turns = declaredTurnsBySide.get(side.scope);

    if (isST) {
      const cc = classifyDim('contextualContinuity', sv('contextualContinuity'));
      const gate = normalizeText(sv('contextualContinuityGate'));
      const gateYes = eqNorm(gate, 'Yes');
      const gateNo = eqNorm(gate, 'No');
      // C-02 CC Major <=> gate Yes, checked in BOTH directions
      if (cc === 'major' && isFilled(gate) && !gateYes) addError(side.scope, side.keyOf('contextualContinuityGate'), `Contextual Continuity is Major Issue but the cold-start gate is not Yes.`, `set the gate to Yes when continuity is a Major Issue (complete amnesia).`, `continuity "Major Issue"; gate "${strVal(sv('contextualContinuityGate'))}".`);
      if (gateYes && cc && cc !== 'major') addError(side.scope, side.keyOf('contextualContinuity'), `the cold-start gate is Yes but Contextual Continuity is not Major Issue.`, `either rate Contextual Continuity as Major Issue, or set the gate to No.`, `gate "Yes"; continuity "${strVal(sv('contextualContinuity'))}".`);
      // C-03 gate Yes => five memory dims + Target Language Meaning all cold start
      if (gateYes) {
        const bad = [];
        for (const key of [...MEMORY_DIMS, 'targetLanguageMeaning']) { const v = sv(key); if (isFilled(v) && !isColdStart(v)) bad.push(key); }
        if (bad.length) {
          addError(side.scope, side.keyOf(bad[0]), `the cold-start gate is Yes, so every memory dimension and Target Language Meaning must read "${COLD_START}", but ${bad.length} ${bad.length === 1 ? 'does' : 'do'} not.`, `set "${COLD_START}" for each of those dimensions after a complete-amnesia gate.`, bad.map((k) => `"${side.lbl(k)}" = "${strVal(sv(k))}"`).join('; ') + '.');
        }
        // C-04 gate Yes => internationalizationQuality = N/A
        const iqv = sv('internationalizationQuality');
        if (isFilled(iqv) && !eqNorm(iqv, IQ_NA)) addError(side.scope, side.keyOf('internationalizationQuality'), `the cold-start gate is Yes but Internationalization Quality is not "N/A".`, `set Internationalization Quality to "N/A" after a complete-amnesia gate.`, `value "${strVal(iqv)}".`);
      }
      // C-05 gate No => none of the FIVE MEMORY DIMENSIONS is cold start (error)
      if (gateNo) {
        const stray = MEMORY_DIMS.filter((key) => isColdStart(sv(key)));
        if (stray.length) {
          addError(side.scope, side.keyOf(stray[0]), `the gate is No (not cold start) but ${stray.length} memory dimension${stray.length === 1 ? '' : 's'} ${stray.length === 1 ? 'is' : 'are'} marked "${COLD_START}".`, `rate ${stray.length === 1 ? 'this dimension' : 'these dimensions'} normally, or set the gate to Yes if this really was complete amnesia.`, stray.map((k) => `"${side.lbl(k)}"`).join(', ') + '.');
        }
        // C-06 (warn) gate No => TLM not cold-start and IQ not N/A \u2014 UNLESS the dominant
        // thread language is declared English, in which case no finding and a log line.
        // Dimensions 8/9 offer N/A for cold start OR English contextual material; inheriting
        // the predecessor's "stray N/A blocks" rule unchanged would block every
        // English-thread task (\u00a78.1 \u2014 the highest-value false-block prevention in the spec).
        if (!dominantHasEnglish) {
          if (isColdStart(sv('targetLanguageMeaning'))) warn(side.scope, side.keyOf('targetLanguageMeaning'), `the gate is No but Target Language Meaning is "${COLD_START}".`, `rate it normally, or tick "Dominant threads language is English" under dominant thread language if the material was in English.`);
          if (eqNorm(sv('internationalizationQuality'), IQ_NA)) warn(side.scope, side.keyOf('internationalizationQuality'), `the gate is No but Internationalization Quality is "N/A".`, `rate it normally, or tick "Dominant threads language is English" under dominant thread language if the material was in English.`);
        } else {
          logs.push(`${side.scope}: English-thread exception active \u2014 dominant thread language is declared English; a stray N/A on dimensions 8/9 is sanctioned (no finding).`);
        }
      }
      // C-11 CC Major => overallSatisfaction "Very dissatisfied" (the only anchored
      // satisfaction cell \u2014 client feedback on b/542164666; C-12..C-14 stay warnings).
      if (cc === 'major') {
        const sat = normalizeText(sv('overallSatisfaction'));
        if (isFilled(sat) && !eqNorm(sat, 'Very dissatisfied')) addError(side.scope, side.keyOf('overallSatisfaction'), `Contextual Continuity is Major Issue, so overall satisfaction must be "Very dissatisfied".`, `set overall satisfaction to "Very dissatisfied" when continuity is a Major Issue.`, `continuity "Major Issue"; satisfaction "${strVal(sv('overallSatisfaction'))}".`);
      }
      // C-12 / C-13 / C-14 satisfaction coherence (warnings \u2014 no client sentence behind them)
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
          if (majors >= 1 && SATISFIED.some((x) => eqNorm(sat, x))) warn(side.scope, side.keyOf('overallSatisfaction'), `${majorNames.length === 1 ? majorNames[0] + ' is' : majorNames.length + ' dimensions are'} rated Major Issue while overall satisfaction is "${strVal(sv('overallSatisfaction'))}".`, `check that the satisfaction rating reflects a Major Issue.`); // C-12
          if (minors >= 2 && majors === 0 && eqNorm(sat, 'Very satisfied')) warn(side.scope, side.keyOf('overallSatisfaction'), `two or more dimensions are rated Minor Issue while overall satisfaction is "Very satisfied".`, `check that the satisfaction rating reflects multiple minor issues.`); // C-13
          if (DISSATISFIED.some((x) => eqNorm(sat, x)) && ratedCount > 0 && allNoIssue) warn(side.scope, side.keyOf('overallSatisfaction'), `overall satisfaction is "${strVal(sv('overallSatisfaction'))}" while every rated dimension is No Issue.`, `record the problem on the dimension it belongs to, or raise the satisfaction rating.`); // C-14
        }
      }
    }

    if (isMT) {
      // per-turn error lists on this side
      const turnErrLists = [];
      for (let k = 1; k <= 5; k++) {
        const list = asArr(sv(`turn${k}ContinuityErrorTypes`));
        turnErrLists.push(list);
        // C-07 "None" together with any other value
        if (list.some((x) => eqNorm(x, 'None')) && list.some((x) => !eqNorm(x, 'None'))) {
          addError(side.scope, side.keyOf(`turn${k}ContinuityErrorTypes`), `Turn ${k} ticks "None" together with a real error.`, `for Turn ${k}, choose either "None" or the specific error(s), not both.`, `selected: ${list.join(', ')}.`);
        }
      }
      // ranking slots
      const rankSlots = [['errorSeverityFirst', '1st'], ['errorSeveritySecond', '2nd'], ['errorSeverityThird', '3rd']];
      const rankVals = rankSlots.map(([k]) => normalizeText(sv(k)));
      // C-08 a slot names a failure while a higher slot is "No issues logged"
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
      // C-09 the same failure named in two ranking slots
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        if (isFilled(rankVals[i]) && !eqNorm(rankVals[i], NO_ISSUES_LOGGED) && rankVals[i] === rankVals[j]) {
          addError(side.scope, side.keyOf(rankSlots[j][0]), `the same error is ranked in both ${rankSlots[i][1]} and ${rankSlots[j][1]} place.`, `rank each distinct error once.`, `both read "${strVal(sv(rankSlots[j][0]))}".`);
        }
      }
      // C-10 a ranked failure does not appear in any turn's error list on that side
      const allTurnErrors = new Set();
      for (const list of turnErrLists) for (const e of list) if (!eqNorm(e, 'None')) allTurnErrors.add(normalizeText(e));
      for (let i = 0; i < 3; i++) {
        const rv = rankVals[i];
        if (isFilled(rv) && !eqNorm(rv, NO_ISSUES_LOGGED) && !allTurnErrors.has(rv)) {
          addError(side.scope, side.keyOf(rankSlots[i][0]), `the ${rankSlots[i][1]}-place ranked error was never logged on any turn of this side.`, `rank only errors you logged in a turn's error checklist, or add the error to the turn where it occurred.`, `ranked "${strVal(sv(rankSlots[i][0]))}"; turn error checklists do not contain it.`);
        }
      }
      // C-15 / C-16 context-source coherence (warnings)
      for (let k = 1; k <= 5; k++) {
        const srcKey = `turn${k}ContextSourceThreads`;
        const src = normalizeText(sv(srcKey));
        if (isBlank(src)) continue;
        const citesThread = /thread\s*\d+/i.test(src);
        const citesTurn = /turn\s*\d+/i.test(src);
        if (!citesThread && !citesTurn) warn(side.scope, side.keyOf(srcKey), `Turn ${k}'s context source names neither a thread nor a turn.`, `cite the thread and/or turn the expected context comes from (e.g. "Thread 2, Turn 3").`); // C-15
        if (declaredThreads !== null) {                                                                       // C-16
          let m; const re = /thread\s*(\d+)/gi; const over = [];
          while ((m = re.exec(src)) !== null) { const n = parseInt(m[1], 10); if (n > declaredThreads) over.push(n); }
          if (over.length) warn(side.scope, side.keyOf(srcKey), `Turn ${k} cites Thread ${over.join(', ')}, beyond the ${declaredThreads} thread${declaredThreads === 1 ? '' : 's'} added.`, `cite only threads 1-${declaredThreads}, or correct the thread count.`);
        }
      }
    }
  }

  // ============================================================
  // \u00a79 ASSIGNMENT vs SUBMISSION (B) \u2014 self-skips with a loud log if the batch/input root
  // does not resolve. Silence there is silent blindness.
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
    logs.push(`${VERSION}: batch axes unavailable \u2014 assignment checks (task type / first model / track / language / dialect / turn-shape) SELF-SKIPPED. Route to the lead; never infer an axis from content.`);
  } else {
    const bTaskType = findInput('task type');
    const bFirstModel = findInput('first model');
    const bTrack = findInput('conversation track');
    const bLang = findInput('target language');
    const bDialect = findInput('dialect');
    logs.push(`Batch axes discovered: taskType=${bTaskType ? `"${bTaskType.value}"` : 'NOT FOUND'}; firstModel=${bFirstModel ? `"${bFirstModel.value}"` : 'NOT FOUND'}; track=${bTrack ? `"${bTrack.value}"` : 'NOT FOUND'}; language=${bLang ? `"${bLang.value}"` : 'NOT FOUND'}; dialect=${bDialect ? `"${bDialect.value}"` : 'NOT FOUND'}.`);
    // B-01 turnType must match batch Task Type \u2014 strip non-letters ("Single-Turn" vs "Single Turn")
    if (bTaskType && bTaskType.value && isFilled(turnTypeRaw) && lettersOnly(bTaskType.value) !== lettersOnly(turnTypeRaw)) {
      addError('Task', 'turnType', `the turn type does not match the assigned task type.`, `set the turn type to match your assignment, or flag the mismatch to your lead.`, `assigned "${bTaskType.value}"; submitted "${strVal(T('turnType'))}".`);
    }
    // B-02 (warn) firstModel should match batch First Model \u2014 exact canonical
    if (bFirstModel && bFirstModel.value && isFilled(firstModel) && canonEnv(bFirstModel.value) !== canonEnv(firstModel)) {
      warn('Task', 'firstModel', `the first model differs from the assigned first model.`, `verify you ran the assigned first model; the batch sheet may be the stale side.`, `assigned "${bFirstModel.value}"; submitted "${strVal(T('firstModel'))}".`);
    }
    // B-03 trackType must match batch Conversation Track \u2014 skipped when the batch value is N/A
    if (bTrack && bTrack.value && !eqCI(bTrack.value, 'N/A') && isFilled(trackTypeRaw) && !eqNorm(bTrack.value, trackTypeRaw)) {
      addError('Task', 'trackType', `the conversation track does not match the assigned track.`, `set the track to match your assignment, or flag the mismatch to your lead.`, `assigned "${bTrack.value}"; submitted "${strVal(T('trackType'))}".`);
    }
    // B-04 (warn) targetLanguage \u2014 exact canonical
    if (bLang && bLang.value && isFilled(T('targetLanguage')) && !eqNorm(bLang.value, T('targetLanguage'))) {
      warn('Task', 'targetLanguage', `the target language differs from the assigned language.`, `verify the target language; the batch sheet may be the stale side.`, `assigned "${bLang.value}"; submitted "${strVal(T('targetLanguage'))}".`);
    }
    // B-05 (warn) dialect \u2014 exact canonical
    if (bDialect && bDialect.value && isFilled(T('dialect')) && !eqNorm(bDialect.value, T('dialect'))) {
      warn('Task', 'dialect', `the dialect differs from the assigned dialect.`, `verify the dialect; the batch sheet may be the stale side.`, `assigned "${bDialect.value}"; submitted "${strVal(T('dialect'))}".`);
    }
    // B-06 ST => each side declares exactly 1 turn
    if (isST) {
      for (const side of presentSides) {
        const t = declaredTurnsBySide.get(side.scope);
        if (t !== null && t !== 1) addError(side.scope, side.keyOf('numberOfTurns'), `this is a Single Turn task but the side declares ${t} turns.`, `a Single Turn task runs exactly one turn per side \u2014 set the turn count to 1, or correct the task type.`, `turn type "Single Turn"; turns ${t}.`);
      }
    }
    // B-07 MT => each side declares >= 2 turns (asymmetric counts allowed)
    if (isMT) {
      for (const side of presentSides) {
        const t = declaredTurnsBySide.get(side.scope);
        if (t !== null && t < 2) addError(side.scope, side.keyOf('numberOfTurns'), `this is a Multi Turn task but the side declares only ${t} turn${t === 1 ? '' : 's'}.`, `a Multi Turn task runs at least two turns per side \u2014 add the remaining turn(s), or correct the task type.`, `turn type "Multi Turn"; turns ${t}.`);
      }
    }
  }

  // ============================================================
  // OUTPUT ASSEMBLY (917's \u2014 one merged block per field, Problem|Fix|Why; "Also:" joins,
  // actions fuzzy-de-duplicated on the first 40 characters; no check IDs in output)
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
    let msg = `${f.scopeLabel} \u2014 "${f.fieldLabel}" | Problem: ${headline} | Fix: ${keptActions.join(' ')}`;
    if (evidence) msg += ` | Why: ${evidence}`;
    errors.push(msg);
  }

  if (errors.length === 0) {
    const sideNote = presentSides.length ? presentSides.map((s) => `${s.scope}=${declaredTurnsBySide.get(s.scope) !== null && declaredTurnsBySide.get(s.scope) !== undefined ? declaredTurnsBySide.get(s.scope) : '?'} turn(s)`).join(', ') : 'no sides discovered';
    successes.push(`All deterministic checks pass (${turnTypeRaw || 'unknown turn type'}; ${sideNote}).`);
  }
  logs.push(`${VERSION}: validation complete. sides=${presentSides.length}, findings=${findingsByField.size}, warnings=${warnings.length}.`);
}
