// prq-validator -- Layer L1 (deterministic, computable from the payload's own bytes):
// F1 completeness, F2 gate cascades, F5-04/F5-05 assignment identity, F6 coherence matrices,
// F7-01/F7-02/F7-04 batch metadata. Shared by projects 941 (es-419) and 942 (zh-CN).
//
// ARCHITECTURE: the top-level validate(conversationData) in the built validation.js is a thin
// wrapper calling this function plus validatePrqFetch (parts/prq-fetch-checks.js) independently,
// then de-duplicating -- 939's validateContinuity/validate903 composition, 944's L1/L2 pair.
// Each sub-validator resolves the payload shape for ITSELF; they share no state.
//
// EVERY table below is GENERATED from project-config-id-941.json by scripts/build-prq.mjs:
// field keys, on-screen labels, option vocabularies, the gate graph transcribed from
// displayConditions, and the two model names. Nothing here is hand-typed (requirements A-03,
// F2 "from R3 displayConditions", F6-09 "the configured option set"). Edit this source, rebuild.
//
// CHECK IDS IMPLEMENTED HERE:
//   F1-01 F1-02 F1-03 F1-04 F1-05 F1-06 F1-07
//   F2-01 F2-02 F2-03 F2-04 F2-05 F2-06 F2-07
//   F5-04 F5-05
//   F6-01 F6-02 F6-03 F6-04 F6-05 F6-07 F6-08 F6-09 F6-10 F6-11 F6-12 F6-13
//   F7-01 F7-02 F7-04 F7-05 F7-06
// (F3, F4, F5-01..03, F6-06, F7-03 need fetched artifact bytes and live in the L2 part.)

async function validatePrqL1(conversationData) {
  // ===== GENERATED TABLES -- emitted by scripts/build-prq.mjs. DO NOT HAND-EDIT. =====
  const CFG = /*__GENERATED_CFG__*/ null;
  // ===== END GENERATED TABLES =====
  if (!CFG) {
    errors.push('[ROUTE TO LEAD] Validator configuration tables are missing -- rebuild the script with scripts/build-prq.mjs before deploying.');
    return;
  }
  const VERSION = 'prq-validator-' + CFG.projectId + '-L1-v' + CFG.version;
  const A = CFG.anchors;

  // ==========================================================================
  // A-01..A-05  PAYLOAD ADAPTER. Roots are DISCOVERED by shape search anchored on this form's
  // own key universe, never guessed from a hardcoded path list -- two shapes are live (export:
  // conversation.ratings as an object map; runtime: ratings as an array of
  // {key, question, human_input_value}). Every resolution is logged with the path it was found
  // at (A-02); an unresolvable ratings root routes to the lead and stops (A-01).
  // ==========================================================================
  const findByShape = (root, isMatch, maxDepth = 5) => {
    const seen = new Set();
    const queue = [{ node: root, path: 'conversationData', depth: 0 }];
    while (queue.length) {
      const { node, path, depth } = queue.shift();
      if (!node || typeof node !== 'object' || depth > maxDepth) continue;
      if (seen.has(node)) continue;
      seen.add(node);
      if (isMatch(node)) return { value: node, path: path };
      for (const [k, v] of Object.entries(node)) {
        if (v && typeof v === 'object') queue.push({ node: v, path: path + '.' + k, depth: depth + 1 });
      }
    }
    return null;
  };
  const baseOf = (k) => { if (typeof k !== 'string') return ''; const p = k.split('.'); return p[p.length - 1]; };
  const KNOWN_KEYS = new Set([...Object.keys(CFG.labels), ...CFG.perSide]);
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
  // A-05: unwrap {value} / {human_input_value}; null, "", [], bare "None" are UNANSWERED.
  const unwrap = (v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('human_input_value' in v) return v.human_input_value;
      if ('value' in v) return v.value;
      return null;
    }
    return v;
  };

  const ratingsHit = findByShape(conversationData, looksLikeRatings);
  if (!ratingsHit) {
    const topKeys = conversationData && typeof conversationData === 'object' ? Object.keys(conversationData).join(', ') : String(conversationData);
    errors.push('[ROUTE TO LEAD] Form answers not locatable | Problem: the review script could not find this task\'s form answers anywhere in its data, so no check could run. This is a platform or configuration issue, not a problem with your submission. | Fix: report this task to your lead -- no rework is needed from you.');
    logs.push(VERSION + ': A-01 ABORT -- no root carrying this form\'s keys was found. Top-level keys seen: [' + topKeys + '].');
    return;
  }
  const ratings = ratingsHit.value;
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
  logs.push(VERSION + ': A-01 ratings root at ' + ratingsHit.path + ' -- ' + (Array.isArray(ratings) ? 'array' : 'object map') + ', ' + Object.keys(byKey).length + ' keys.');

  // A-02: metadata / batch root. Absent -> F7 self-skips with a loud log, never a rater error.
  const META_NAMES = ['model a', 'model b', 'first model', 'prompt type', 'target language', 'dialect',
                      'additional rater instruction', 'rater instruction', 'task type', 'destination folder', 'batch'];
  const isMetaBag = (n) => {
    if (n === ratings) return false;
    if (Array.isArray(n)) {
      return n.length > 0 && n.every((e) => e && typeof e === 'object' && !Array.isArray(e)) &&
        n.some((e) => Object.keys(e).some((k) => META_NAMES.includes(String(k).trim().toLowerCase())));
    }
    if (n && typeof n === 'object') return Object.keys(n).some((k) => META_NAMES.includes(String(k).trim().toLowerCase()));
    return false;
  };
  const metaHit = findByShape(conversationData, isMetaBag);
  const meta = {};
  if (metaHit) {
    const entries = Array.isArray(metaHit.value) ? metaHit.value : [metaHit.value];
    for (const e of entries) {
      if (e && typeof e === 'object') {
        for (const [k, v] of Object.entries(e)) {
          const uv = unwrap(v);
          if (uv === null || typeof uv === 'object') continue;
          meta[k] = uv;
        }
      }
    }
    logs.push('A-02 metadata root at ' + metaHit.path + ' (' + Object.keys(meta).length + ' columns): [' + Object.keys(meta).join(' | ') + '].');
  } else {
    logs.push('A-02 METADATA ROOT NOT RESOLVED: no object carrying the batch columns was found anywhere in the payload -- every batch-layer check (F5-05, F6-10, F7-01 assignment half, F7-02, F7-04) SELF-SKIPS. Route to the lead; never infer an assignment from content.');
  }
  const findMeta = (name) => {
    const want = String(name).toLowerCase();
    const keys = Object.keys(meta);
    const exact = keys.find((k) => k.trim().toLowerCase() === want);
    const k = exact || keys.find((kk) => kk.trim().toLowerCase().includes(want));
    return k ? { key: k, value: String(meta[k] === null || meta[k] === undefined ? '' : meta[k]).trim() } : null;
  };

  // ==========================================================================
  // section 5 NORMALIZATION LADDER -- ONE function, used by every equality and containment compare in
  // both layers. Order is load-bearing; see requirements section 5.
  //   1 CRLF/CR -> LF   2 strip BOM   3 strip the Gemini omission marker   4 strip [cite: ...]
  //   5 NFC   6 strip zero-width + U+FFFD   7 curly quotes/apostrophes -> straight, dashes ->
  //   hyphen-minus   8 collapse all Unicode whitespace (NBSP, U+3000) to one space, trim
  // NOT applied: NFKC / half-width folding. zh-CN full-width forms stay DISTINCT by design
  // (requirements section 5 locale notes) -- the width probe decides whether that ever changes.
  // ==========================================================================
  const OMISSION_MARKER = '[Content of all requested items is omitted here because it may be found above or below.]';
  const rawStr = (v) => (typeof v === 'string' ? v : (v === null || v === undefined ? '' : String(v)));
  const norm = (s) => rawStr(s)
    .replace(/\r\n?/g, '\n')
    .replace(/^\ufeff/, '')
    .split(OMISSION_MARKER).join(' ')
    .replace(/\[cite:[^\]]*\]/gi, ' ')
    .normalize('NFC')
    .replace(/[\u200b-\u200d\ufeff\ufffd]/g, '')
    .replace(/[\u2018\u2019\u201b\u2032]/g, "'")
    .replace(/[\u201c\u201d\u2033]/g, '"')
    .replace(/[\u2010-\u2015\u2212\ufe58\ufe63\uff0d]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const eqN = (a, b) => norm(a) === norm(b) || foldTokens(a) === foldTokens(b);
  // COMPARISON-ONLY token fold. Applied when tokenising for the tolerance tier, never to
  // displayed text. Intra-word hyphens and apostrophes are dropped so "e-commerce" and
  // "ecommerce" are one token.
  // Why: golden task 1270939 was BLOCKED by a single hyphen. The rater typed "e-commerce" in
  // the Prompt field and "ecommerce" in Gemini -- unambiguously the same conversation -- and in
  // a 12-word prompt that one token cost 15 points of word-Jaccard: F4-A scored 84.6% and
  // failed the 90% tier while F3-08's word-hit-rate scored 91.7% and passed. The two
  // comparators disagreeing on one character was itself the bug. With the fold both are an
  // exact match and no tolerance tier is involved.
  // Accepted cost: "re-sign"/"resign" and "co-op"/"coop" also collapse. For the question these
  // comparators ask -- is this the same conversation? -- that is negligible against blocking
  // every task where a rater typed a hyphen differently.
  const foldTokens = (s) => norm(s).toLowerCase().replace(/(\w)[-'\u2019](\w)/g, '$1$2');

  const eqCI = (a, b) => norm(a).toLowerCase() === norm(b).toLowerCase();
  // Word-level Jaccard, the section 5 step-9 tolerance tier. Returns a percentage so it can be printed
  // as evidence whenever it decides an outcome.
  const overlapPct = (a, b) => {
    const wa = foldTokens(a).split(' ').filter(Boolean);
    const wb = foldTokens(b).split(' ').filter(Boolean);
    if (!wa.length && !wb.length) return 100;
    if (!wa.length || !wb.length) return 0;
    const sa = new Set(wa), sb = new Set(wb);
    let inter = 0;
    for (const w of sa) if (sb.has(w)) inter++;
    const union = sa.size + sb.size - inter;
    return union === 0 ? 100 : Math.round((inter / union) * 1000) / 10;
  };

  const isBlank = (v) => {
    if (v === null || v === undefined || v === false) return true;
    if (Array.isArray(v)) return v.length === 0 || v.every((x) => isBlank(x));
    const s = rawStr(v).trim();
    return s === '' || s.toLowerCase() === 'none';
  };
  const filled = (v) => !isBlank(v);   // Fact 12: the ONLY valid presence test
  const asArr = (v) => (Array.isArray(v) ? v.map(rawStr) : (isBlank(v) ? [] : [rawStr(v)]));
  const intOf = (v) => { const s = norm(v); if (!/^\d+$/.test(s)) return null; const n = parseInt(s, 10); return Number.isFinite(n) ? n : null; };

  // A-04 model-name canonicalization: arrow SPELLINGS unified, then either "->" or a BARE ">"
  // collapsed in ONE pass, whitespace collapsed, case-folded. The bare ">" matters: the
  // configured Test name is "PContext Mode 23 (Nippon) > Mochi - Fast", and 903 split on
  // "\s>\s" for the same reason on the 877 names. One pass, not two: replacing ">" first would
  // also eat the ">" inside "->" and mangle every arrow-style name.
  // EXACT canonical full-string match only -- never substring, never by position.
  const canonModel = (s) => norm(s).replace(/\u2192|\u21d2|=>|-->/g, '->').replace(/\s*(?:->|>)\s*/g, '->').toLowerCase();

  // ==========================================================================
  // section 6 MESSAGE CONTRACT. One block per field; multiple problems joined by "Also:"; actions
  // fuzzy-de-duplicated; every linked-field finding carries "| File: <URL as submitted>" (A-08).
  // Side names are the platform model names, never A/B letters. No internal language.
  // ==========================================================================
  const labelOf = (fieldKey) => labelByKey[fieldKey] || CFG.labels[baseOf(fieldKey)] || fieldKey;
  const fileLinks = {};   // fieldKey -> full URL as submitted (A-08)
  const findings = new Map();
  const record = (bucket, scope, fieldKey, turn, problem, fix, why) => {
    const id = bucket + ' :: ' + scope + ' :: ' + fieldKey + ' :: ' + (turn || '');
    if (!findings.has(id)) findings.set(id, { bucket, scope, fieldKey, turn: turn || null, problems: [], fixes: new Set(), whys: [] });
    const f = findings.get(id);
    f.problems.push(problem);
    if (fix) f.fixes.add(fix);
    if (why) f.whys.push(why);
  };
  const err = (scope, fieldKey, problem, fix, why, turn) => record('error', scope, fieldKey, turn, problem, fix, why);
  const warn = (scope, fieldKey, problem, fix, why, turn) => record('warning', scope, fieldKey, turn, problem, fix, why);

  // ==========================================================================
  // A-03 / A-04  SIDE BINDING. Per-side answers arrive namespaced compareModels.<ns>.<key>.
  // Every discovered namespace is logged on EVERY run (A-03). Sides bind by exact canonical
  // match of the namespace to a configured model name -- never from csv Model A / Model B
  // (run-order columns, the 939 learning), never by position.
  // ==========================================================================
  const byCanon = new Map([[canonModel(CFG.modelA), 'test'], [canonModel(CFG.modelB), 'base']]);
  const nsMap = new Map();
  const unmatchedNs = new Set();
  for (const fullKey of Object.keys(byKey)) {
    for (const q of CFG.perSide) {
      if (fullKey === q || !fullKey.endsWith('.' + q)) continue;
      const ns = fullKey.slice(0, fullKey.length - q.length - 1);
      if (!ns) break;
      const nsTail = ns.replace(/^compareModels\./, '');
      if (nsTail === '__config__') break;
      const c = canonModel(nsTail);
      let hit = byCanon.has(c) ? c : null;
      if (!hit) for (const cc of byCanon.keys()) { if (c.endsWith('.' + cc)) { hit = cc; break; } }
      if (hit) {
        if (!nsMap.has(hit)) nsMap.set(hit, { ns: nsTail, fields: {} });
        nsMap.get(hit).fields[q] = fullKey;
      } else {
        unmatchedNs.add(nsTail);
      }
      break;
    }
  }
  logs.push('ALL COMPARE MODEL NAMESPACES: [' + ([...nsMap.values()].map((v) => v.ns).concat([...unmatchedNs]).join(' | ') || 'NONE') + '] (bound: ' + [...nsMap.keys()].join(', ') + ').');
  if (unmatchedNs.size) logs.push('UNMATCHED NAMESPACES (not bound, exact-canonical-match rule): [' + [...unmatchedNs].join(' | ') + '] -- if these are real sides the configured model names have drifted; fix the config, never loosen the match.');

  const sideDefs = [
    { role: 'Test', slot: 'test', name: CFG.modelA },
    { role: 'Base', slot: 'base', name: CFG.modelB },
  ];
  const sides = sideDefs.map((d) => {
    const entry = nsMap.get(canonModel(d.name)) || null;
    const fields = entry ? entry.fields : null;
    return {
      role: d.role, slot: d.slot, name: d.name, scope: d.name, present: !!fields,
      get: (q) => (fields && fields[q] !== undefined ? byKey[fields[q]] : undefined),
      keyOf: (q) => (fields && fields[q] !== undefined ? fields[q] : q),
    };
  });
  const bound = sides.filter((s) => s.present);
  if (bound.length === 0) {
    errors.push('[ABORT] Neither model\'s answers could be matched to this evaluation\'s two models | Problem: the per-model answer groups in this task carry names that match neither configured model, so no per-model check could run. | Fix: report this task to your lead -- no rework is needed from you. | Why: expected "' + CFG.modelA + '" and "' + CFG.modelB + '"; found [' + ([...unmatchedNs].join(' | ') || 'no per-model groups at all') + '].');
    logs.push(VERSION + ': A-04 ABORT -- zero sides bound.');
    return;
  }
  if (bound.length === 1) {
    const leftover = [...unmatchedNs][0];
    errors.push('[BINDING] Only one of the two models could be matched by name | Problem: one per-model answer group matched a configured model and the other did not, so the second model is being checked under an unverified name. | Fix: report this task to your lead -- no rework is needed from you. | Why: bound "' + bound[0].name + '"; unmatched [' + ([...unmatchedNs].join(' | ') || 'none') + '].');
    logs.push(VERSION + ': A-04 BINDING -- one side bound (' + bound[0].role + '); continuing with the leftover namespace ' + (leftover || 'NONE') + ' unbound.');
  }
  for (const s of sides) if (!s.present) logs.push(s.role + ' side ("' + s.name + '"): namespace not found -- per-side checks self-skip for this side.');
  logs.push('ROLE BINDING (logs only until the identity table is proven): Test="' + CFG.modelA + '", Base="' + CFG.modelB + '".');

  const T = (key) => byKey[key];

  // A-08: registry of fieldKey -> the full URL AS SUBMITTED, so any finding anchored on a
  // linked field can carry "| File: <URL>" and a QA can act without opening the task.
  const URL_IN = /https?:\/\/[^\s'"<>]+/i;
  const registerLink = (fullKey, raw) => {
    const m = rawStr(raw).match(URL_IN);
    if (m) fileLinks[fullKey] = m[0];
  };
  for (const side of bound) {
    for (const k of CFG.debugSlotKeys) registerLink(side.keyOf(k), side.get(k));
    registerLink(side.keyOf(A.html), side.get(A.html));
  }

  // ===== option vocabularies =====
  const MINOR = 'Minor issues', MAJOR = 'Major issues';
  const I18N_MINOR = 'Minor Issue(s)', I18N_MAJOR = 'Major Issue(s)';
  const DISSATISFIED = ['Very dissatisfied', 'Somewhat dissatisfied'];
  const NOT_PERSONALIZED = 'Not Personalized';
  // F6-09: canonical option equality. Two values are the SAME answer when they canonicalize
  // equal after ladder step 7, or when one is the bare short form of the other's decorated
  // label ("N/A" vs "N/A - No personalization needed"). Never rework a rater for a quote glyph.
  const optCanon = (s) => norm(s).toLowerCase();
  // F6-09 canonical option equality: the SAME answer written differently. Two values are equal
  // when they canonicalize identically (whitespace, case, straight vs curly apostrophe, en/em
  // dash -- the ladder already did that work), or when one is the BARE SHORT FORM of the
  // other's decorated label ("N/A" vs "N/A - No personalization needed").
  // The short-form rule applies ONLY when one side carries no separator at all. A looser
  // shared-first-segment rule read two differently-decorated values that merely share a
  // prefix as the same answer -- it made "Mode 23 -> Something Else - Fast" equal to
  // "Mode 23 -> Ramen (top-20) - Fast" and silently disabled F5-04.
  const OPT_SEP = /\s*[-:]\s*/;
  const sameOpt = (a, b) => {
    const x = optCanon(a), y = optCanon(b);
    if (x === y) return true;
    const xs = x.split(OPT_SEP), ys = y.split(OPT_SEP);
    if (xs.length === 1 && ys.length > 1) return ys[0].trim() === x;
    if (ys.length === 1 && xs.length > 1) return xs[0].trim() === y;
    return false;
  };
  const isOneOf = (v, list) => list.some((o) => sameOpt(v, o));
  const isMinorOrMajor = (v) => isOneOf(v, [MINOR, MAJOR]);
  const isI18nIssue = (v) => {
    // "Minor Issue(s)" and "Minor issues" both canonicalize to a "minor issue" head; require the
    // i18n spelling explicitly so a rubric head's value can never satisfy an i18n gate.
    const s = optCanon(v);
    return s === optCanon(I18N_MINOR) || s === optCanon(I18N_MAJOR);
  };

  // Turn citation regex: half- and full-width brackets, case-insensitive "turn". Localized
  // tokens (es "Turno", zh "\u56de\u5408") are NOT accepted yet -- escalation 4 owns that ruling;
  // until it lands F6-04/F6-05 stay warnings so a localized citation never blocks a rater.
  const TURN_CITE_RE = /[\[\uff3b]\s*turn\s*(\d+)\s*[\]\uff3d]/gi;
  // A turn referenced in PROSE ("in turn 1", "on turn 2") rather than as "[Turn 1]". The doc
  // requires the bracket form, so this is still a finding -- but the WORDING has to be right:
  // on golden task 1271348 both rationales say "...in turn 1" and the old message told the
  // rater "the rationale does not reference any turn", which is plainly false and gets the
  // finding dismissed. Report what is actually wrong: the format.
  const proseTurns = (s) => {
    const out = [];
    const re = /(?:^|[^\[\uFF3B])\bturns?\s+(\d+)\b/gi;
    let m;
    const t = rawStr(s);
    while ((m = re.exec(t)) !== null) out.push(parseInt(m[1], 10));
    return [...new Set(out)];
  };
  const citedTurns = (s) => {
    const out = [];
    const re = new RegExp(TURN_CITE_RE.source, 'gi');
    let m;
    const t = rawStr(s);
    while ((m = re.exec(t)) !== null) out.push(parseInt(m[1], 10));
    return out;
  };

  // ===== gate graph + visibility (used by F1-03 as well as the F2 cascades) =====
  const gatesByChild = new Map();
  for (const g of CFG.gates) gatesByChild.set(g.child, g);
  // VISIBILITY. A field is shown when it has no gate, or when its gate is satisfied by the
  // parent's answer AND the parent is itself shown. Two operators are live and their semantics
  // differ (see the builder's parser note):
  //   eq  the parent's single-choice answer equals one of the gate values
  //   in  the parent's MULTI-select answer contains one of them
  // The recursion matters on 942, where the cascade is two deep: Q1 -> severity head -> child.
  // 941 and 948 gate no head on Q1, so there every head is shown and this reduces to today's
  // behaviour exactly.
  const isShown = (key, side, depth) => {
    if ((depth || 0) > 6) return true;                  // cycle guard; a cyclic config is a build problem
    const g = gatesByChild.get(key);
    if (!g) return true;                                 // ungated fields are always shown
    const parentVal = side ? side.get(g.parent) : T(g.parent);
    const satisfied = g.op === 'in'
      ? asArr(parentVal).some((a) => g.values.some((v) => sameOpt(a, v)))
      : g.values.some((v) => sameOpt(parentVal, v));
    if (!satisfied) return false;
    return isShown(g.parent, side, (depth || 0) + 1);
  };

  // ==========================================================================
  // F1  COMPLETENESS
  // ==========================================================================
  // F1-01: task-level required fields. The config carries no allowOptional flag on any field,
  // so "shown" == "required"; F2 owns the shown/hidden question.
  const F1_01_TASK = [A.prompt, A.conversationalGoal, A.personalizationExpectation, A.firstModel,
                      A.targetLanguage, A.dialect];
  for (const k of F1_01_TASK) {
    if (isBlank(T(k))) err('Task', k, 'this required answer is missing.', 'fill in "' + labelOf(k) + '".');   // F1-01
  }
  // F1-06 owns the two SxS fields (same anchors, one merged block per field).
  if (isBlank(T(A.sxs))) err('Task', A.sxs, 'no side-by-side winner was chosen.', 'choose which conversation was higher quality in "' + labelOf(A.sxs) + '".');   // F1-06
  if (isBlank(T(A.sxsRationale))) err('Task', A.sxsRationale, 'the side-by-side rationale is empty.', 'explain in "' + labelOf(A.sxsRationale) + '" what made one conversation better than the other.');   // F1-06

  // F1-02: attestation checkboxes. Fix text quotes the checkbox's own on-screen wording.
  if (T(A.setupCheck) !== true) err('Task', A.setupCheck, 'the "' + labelOf(A.setupCheck) + '" confirmation is not checked.', 'confirm your settings and the selected model, then tick "' + labelOf(A.setupCheck) + '".');   // F1-02
  if (T(A.privacyGate) !== true) err('Task', A.privacyGate, 'the "' + labelOf(A.privacyGate) + '" confirmation is not checked.', 're-read each privacy statement, confirm the HTML preview renders and carries no personal information, then tick "' + labelOf(A.privacyGate) + '".');   // F1-02

  // ---- per-side turn count first: it is the prerequisite for F1-05, F2-05, F6-02, F6-04.
  const declared = new Map();
  for (const side of bound) {
    const raw = side.get(A.turns);
    const n = intOf(raw);
    if (isBlank(raw)) {
      err(side.scope, side.keyOf(A.turns), 'the number of turns is missing.', 'select how many turns this conversation ran (1 to 5).');   // F1-04
      declared.set(side.slot, null);
    } else if (n === null || n < 1 || n > 5) {
      err(side.scope, side.keyOf(A.turns), 'the number of turns is not a value this form offers.',
        'select a turn count between 1 and 5.', 'submitted "' + rawStr(raw) + '"; this form offers ' + (CFG.options[A.turns] || []).join(' / ') + '.');   // F1-04
      declared.set(side.slot, null);
    } else {
      declared.set(side.slot, n);
    }
  }

  // F1-03: per-side required answers -- but only the ones the form actually SHOWS.
  // The projects diverge here and the difference is load-bearing:
  //   941 / 948  no Q1 gate. Every severity head is always visible, so Fact 13 applies: Q1 =
  //              "Not Personalized" followed by N/A on the heads is the INSTRUCTED compliant
  //              pattern, and an N/A answer is answered, never a gap.
  //   942        all ten heads are gated on Q1. With "Not Personalized" alone they are HIDDEN,
  //              so requiring them blocks correct work -- measured at 20 false errors on golden
  //              task 1271023 before this fix. There the compliant pattern is the heads being
  //              ABSENT, and a head carrying a value instead is F2-04's stale hidden value.
  // Nothing here branches per project: isShown() reads the gate graph the builder derived.
  const F1_03_REQUIRED = [A.q1, ...CFG.heads, A.sat7a, A.sat7b, ...CFG.i18nHeads, A.html];
  for (const side of bound) {
    for (const k of F1_03_REQUIRED) {
      if (!isShown(k, side)) continue;
      if (isBlank(side.get(k))) {
        err(side.scope, side.keyOf(k), 'this required answer is missing.', 'answer "' + labelOf(k) + '" for this model.');   // F1-03
      }
    }
    // F1-07 owns 7c: emptiness only. Length is never checked.
    if (isBlank(side.get(A.rationale7c))) {
      err(side.scope, side.keyOf(A.rationale7c), 'the rationale for this model is empty.',
        'explain in "' + labelOf(A.rationale7c) + '" what led to your ratings, starting each point with the turn number in square brackets, e.g. [Turn 1].');   // F1-07
    }
    if (side.get(A.secondModelLock) !== true) {
      err(side.scope, side.keyOf(A.secondModelLock), 'the "' + labelOf(A.secondModelLock) + '" confirmation is not checked for this model.',
        'confirm you finished this model\'s review and deleted the previous Gemini chat, then tick "' + labelOf(A.secondModelLock) + '".');   // F1-02
    }

    // F1-05: declared N turns but debug slots 1..N are not all filled -- ONE consolidated
    // per-side finding listing the empty turns. Turn 1 is required (939's optional-Turn-1 spec
    // is not carried, section 4).
    const n = declared.get(side.slot);
    if (n !== null && n !== undefined) {
      const missing = [];
      for (let t = 1; t <= n; t++) {
        const k = CFG.debugSlotKeys[t - 1];
        if (k && isBlank(side.get(k))) missing.push(t);
      }
      if (missing.length) {
        err(side.scope, side.keyOf(CFG.debugSlotKeys[missing[0] - 1]),
          'this model declares ' + n + ' turn' + (n === 1 ? '' : 's') + ' but the debug info for turn' + (missing.length === 1 ? ' ' + missing[0] : 's ' + missing.join(', ')) + ' is missing.',
          'add the debug info for turn' + (missing.length === 1 ? ' ' + missing[0] : 's ' + missing.join(', ')) + ', or correct the turn count.',
          'turn count ' + n + '; empty debug turn(s): ' + missing.join(', ') + '.');   // F1-05
      }
    }
  }

  // ==========================================================================
  // F2  GATE CASCADES -- both directions, driven by the gate graph the build transcribed from
  // the config's displayConditions. No cascade is hand-written, so a config revision cannot
  // silently disable one.
  // ==========================================================================
  const roleOfChild = (head, child) => {
    const c = CFG.childrenOf[head] || {};
    for (const r of ['category', 'turns', 'detraction', 'explanation']) if (c[r] === child) return r;
    return 'child';
  };
  // The unhide/clear/rehide walkthrough: the rater CANNOT see a stale hidden value, so the fix
  // has to walk them through revealing it (F2-04, Validator Guide F2).
  const clearFix = (headLabel, childLabel, gateValues) =>
    'set "' + headLabel + '" to ' + gateValues.map((v) => '"' + v + '"').join(' or ') + ' to reveal "' + childLabel + '", clear it, then set "' + headLabel + '" back to your real answer.';

  for (const side of bound) {
    // ---- rubric heads: Category (F2-01), Turns (F2-02), Detraction (F2-03) + reverse (F2-04)
    for (const head of CFG.heads) {
      const headVal = side.get(head);
      // F2-04 on the HEAD itself. Only reachable where heads are gated (942): a head answered
      // before the rater set Q1 to "Not Personalized" is now hidden, and the stale value is
      // submitted invisibly. Same defect the children have always been checked for.
      const headGate = gatesByChild.get(head);
      if (headGate && !isShown(head, side) && filled(headVal)) {
        err(side.scope, side.keyOf(head), 'this rating holds an answer even though "' + labelOf(headGate.parent) + '" says the response was not personalized, so the answer is hidden and will still be submitted.',
          'set "' + labelOf(headGate.parent) + '" to one of ' + headGate.values.map((v) => '"' + v + '"').join(' or ') + ' to reveal "' + labelOf(head) + '", clear it, then set "' + labelOf(headGate.parent) + '" back to your real answer.',
          '"' + labelOf(headGate.parent) + '" = "' + asArr(side.get(headGate.parent)).join(', ') + '"; hidden "' + labelOf(head) + '" = "' + rawStr(headVal) + '".');   // F2-04
      }
      const kids = CFG.childrenOf[head] || {};
      for (const role of ['category', 'turns', 'detraction']) {
        const child = kids[role];
        if (!child) continue;
        const gate = gatesByChild.get(child);
        if (!gate) continue;
        // isShown() rather than a value-only test: on 942 a head can itself be HIDDEN (Q1 not
        // personalized) while still carrying a stale value, and a value-only test then demanded
        // the rater fill in children they cannot see -- three errors for one defect, two of them
        // impossible to action. Caught by mutating real task 1271023.
        const shown = isShown(child, side);
        const childVal = side.get(child);
        if (shown && isBlank(childVal)) {
          // F2-01 (category) / F2-02 (turns) / F2-03 (detraction)
          err(side.scope, side.keyOf(child), 'this follow-up is required once "' + labelOf(head) + '" is set to "' + rawStr(headVal) + '", but it is empty.',
            'answer "' + labelOf(child) + '".',
            '"' + labelOf(head) + '" = "' + rawStr(headVal) + '".');
        } else if (!shown && filled(childVal)) {
          err(side.scope, side.keyOf(child), 'this follow-up holds an answer even though "' + labelOf(head) + '" is not set to ' + gate.values.map((v) => '"' + v + '"').join(' or ') + ', so the answer is hidden and will still be submitted.',
            clearFix(labelOf(head), labelOf(child), gate.values),
            '"' + labelOf(head) + '" = "' + rawStr(headVal) + '"; hidden "' + labelOf(child) + '" = "' + asArr(childVal).join(', ') + '".');   // F2-04
        }
      }
    }

    // ---- F2-06: i18n heads. Spelling differs from the rubric heads ("Minor Issue(s)" not
    // "Minor issues"); 10b's explanation is a SINGLE_CHOICE, the other three are FREE_TEXT.
    for (const head of CFG.i18nHeads) {
      const child = (CFG.childrenOf[head] || {}).explanation;
      if (!child) continue;
      const gate = gatesByChild.get(child);
      if (!gate) continue;
      const headVal = side.get(head);
      const shown = isShown(child, side);
      const childVal = side.get(child);
      if (shown && isBlank(childVal)) {
        err(side.scope, side.keyOf(child), 'this explanation is required once "' + labelOf(head) + '" is set to "' + rawStr(headVal) + '", but it is empty.',
          (CFG.types[child] === 'FREE_TEXT' ? 'describe the issue in "' : 'choose an option in "') + labelOf(child) + '".',
          '"' + labelOf(head) + '" = "' + rawStr(headVal) + '".');   // F2-06
      } else if (!shown && filled(childVal)) {
        err(side.scope, side.keyOf(child), 'this explanation holds an answer even though "' + labelOf(head) + '" reports no issue, so the answer is hidden and will still be submitted.',
          clearFix(labelOf(head), labelOf(child), gate.values),
          '"' + labelOf(head) + '" = "' + rawStr(headVal) + '"; hidden "' + labelOf(child) + '" = "' + asArr(childVal).join(', ') + '".');   // F2-06
      }
    }

    // ---- F2-05: debug slot filled beyond the declared count (stale hidden slot). Consolidated
    // per side. Fix walks the count up, clears, and back down -- the rater cannot see these.
    const n = declared.get(side.slot);
    if (n !== null && n !== undefined) {
      const stale = [];
      for (let t = n + 1; t <= CFG.debugSlotKeys.length; t++) {
        const k = CFG.debugSlotKeys[t - 1];
        if (k && filled(side.get(k))) stale.push(t);
      }
      if (stale.length) {
        err(side.scope, side.keyOf(CFG.debugSlotKeys[stale[0] - 1]),
          'debug info is filled in for turn' + (stale.length === 1 ? ' ' + stale[0] : 's ' + stale.join(', ')) + ', past the ' + n + ' turn' + (n === 1 ? '' : 's') + ' this model declares, so it is hidden and will still be submitted.',
          'set the turn count to ' + Math.max(...stale) + ' to reveal turn' + (stale.length === 1 ? ' ' + stale[0] : 's ' + stale.join(', ')) + ', clear ' + (stale.length === 1 ? 'it' : 'them') + ', then set the turn count back to ' + n + ' -- or raise the turn count if the extra turn' + (stale.length === 1 ? ' was' : 's were') + ' real.',
          'turn count ' + n + '; filled beyond it: turn(s) ' + stale.join(', ') + '.');   // F2-05
      }
    }
  }
  // F2-07: bp2 is a breakpoint gated on the per-side turn count. Log whether it resolves; the
  // platform, not the rater, owns it -- no finding either way (section 9 row 10).
  {
    const g = gatesByChild.get('bp2');
    logs.push('F2-07: bp2 ' + (g ? 'gates on "' + g.parent + '" (values ' + g.values.join('/') + '); per-side turn counts read: ' + bound.map((s) => s.role + '=' + (declared.get(s.slot) === null ? 'unreadable' : declared.get(s.slot))).join(', ') : 'has no display condition in this config') + '.');
  }

  // ==========================================================================
  // F5  IDENTITY (payload half; the fetched-debug half is in the L2 part)
  // ==========================================================================
  // F5-04: firstModel must be one of the two configured names. Anything else is config drift.
  {
    const fm = T(A.firstModel);
    if (filled(fm) && !isOneOf(fm, [CFG.modelA, CFG.modelB])) {
      errors.push('[ROUTE TO LEAD] "' + labelOf(A.firstModel) + '" holds a model this evaluation does not use | Problem: the recorded first model matches neither of the two models being compared, which points at a form-configuration change rather than a rater mistake. | Fix: report this task to your lead -- no rework is needed from you. | Why: submitted "' + rawStr(fm) + '"; configured "' + CFG.modelA + '" / "' + CFG.modelB + '".');   // F5-04
    }
  }
  // F5-05: firstModel vs the assigned first model in batch metadata. Self-skips with a log.
  {
    const m = findMeta('first model');
    const fm = T(A.firstModel);
    if (!m) {
      logs.push('F5-05 SELF-SKIPPED: batch metadata carries no assigned First Model column.');
    } else if (filled(fm) && m.value && canonModel(m.value) !== canonModel(fm)) {
      err('Task', A.firstModel, 'the model recorded as first does not match the model this task assigned as first.',
        'confirm which model you ran first and correct "' + labelOf(A.firstModel) + '"; if the assignment sheet is the wrong side, tell your lead.',
        'assigned "' + m.value + '"; recorded "' + rawStr(fm) + '".');   // F5-05
    }
  }

  // ==========================================================================
  // F6  COHERENCE MATRICES -- byte-decidable, using the client's own vocabulary
  // ==========================================================================
  for (const side of bound) {
    const q1 = asArr(side.get(A.q1));
    const q1HasNot = q1.some((v) => sameOpt(v, NOT_PERSONALIZED));
    const q1HasPers = q1.some((v) => /^personalized/i.test(norm(v)));
    // F6-01: contradictory by definition.
    if (q1HasNot && q1HasPers) {
      err(side.scope, side.keyOf(A.q1), 'this answer says the response was both personalized and not personalized.',
        'keep only the options that describe this response -- "' + NOT_PERSONALIZED + '" cannot be combined with a "Personalized" option.',
        'selected: ' + q1.join(', ') + '.');   // F6-01
    }

    const n = declared.get(side.slot);
    // F6-02 / F6-03: the Turns multi-select on every head.
    for (const head of CFG.heads) {
      const child = (CFG.childrenOf[head] || {}).turns;
      if (!child) continue;
      const picks = asArr(side.get(child));
      if (!picks.length) continue;
      const nums = picks.map((p) => intOf(p)).filter((x) => x !== null);
      const hasNA = picks.some((p) => sameOpt(p, 'N/A'));
      if (n !== null && n !== undefined) {
        const over = nums.filter((x) => x > n);
        if (over.length) {
          err(side.scope, side.keyOf(child), 'this cites turn' + (over.length === 1 ? ' ' + over[0] : 's ' + over.join(', ')) + ', past the ' + n + ' turn' + (n === 1 ? '' : 's') + ' this model declares.',
            'deselect the turn' + (over.length === 1 ? '' : 's') + ' that did not happen, or correct the turn count.',
            'turn count ' + n + '; cited ' + picks.join(', ') + '.');   // F6-02
        }
      }
      // N/A ALONE on a Minor/Major head stays legal until the client rules otherwise -- only the
      // MIXTURE is checked, and that is a straight contradiction: nothing downstream can tell
      // which turns the issue was on. Blocking (severity review, 10 Sep 2026).
      if (hasNA && nums.length) {
        err(side.scope, side.keyOf(child), '"N/A" is selected alongside specific turn numbers.',
          'keep the turn numbers where the issue appeared, or "N/A" on its own -- not both.',
          'selected: ' + picks.join(', ') + '.');   // F6-03
      }
    }

    // F6-04 / F6-05: 7c citation format. Format only -- substance is the QD pack's territory.
    // F6-05 never counts points or checks that each has a citation, only zero-vs-some.
    const r7c = side.get(A.rationale7c);
    if (filled(r7c)) {
      const cites = citedTurns(r7c);
      if (n !== null && n !== undefined) {
        const over = [...new Set(cites.filter((x) => x > n))];
        if (over.length) {
          // Decisive once a bracket citation is detected: the turn does not exist. Blocking.
          err(side.scope, side.keyOf(A.rationale7c), 'the rationale references turn' + (over.length === 1 ? ' ' + over[0] : 's ' + over.join(', ')) + ', past the ' + n + ' turn' + (n === 1 ? '' : 's') + ' this model declares.',
            'correct the turn number' + (over.length === 1 ? '' : 's') + ' in the rationale, or the turn count if more turns were run.',
            'turn count ' + n + '; referenced ' + over.join(', ') + '.');   // F6-04
        }
      }
      // SINGLE-TURN RELIEF (F6-05 and F6-12). The bracket citation exists so a reader knows
      // WHICH turn a point refers to. On a side that declares exactly one turn there is no
      // ambiguity to resolve, so demanding "[Turn 1]" carries no information -- it is the kind
      // of always-fires finding that teaches raters to ignore warnings. Found on golden task
      // 1271588: a clean single-turn task whose two rationales are accurate and substantive,
      // warned on both sides purely for the missing bracket.
      // F6-04 (a citation ABOVE the declared count) is deliberately NOT relieved -- "[Turn 3]"
      // on a one-turn task is still wrong.
      const singleTurn = n === 1;
      if (singleTurn && cites.length === 0) {
        logs.push('F6-05/F6-12 self-skipped on ' + side.scope + ': the side declares a single turn, so a "[Turn N]" citation disambiguates nothing.');
      }
      if (!singleTurn && cites.length === 0) {
        const prose = proseTurns(r7c);
        const flagged = CFG.heads.filter((h) => isMinorOrMajor(side.get(h)));
        const why = flagged.length
          ? 'issue' + (flagged.length === 1 ? '' : 's') + ' flagged: ' + flagged.map((h) => '"' + labelOf(h) + '" = "' + rawStr(side.get(h)) + '"').join('; ') + '.'
          : 'no [Turn N] reference found in the rationale.';
        if (prose.length) {
          // It DOES reference a turn, just not in the required form. Say that.
          warn(side.scope, side.keyOf(A.rationale7c), 'the rationale refers to turn' + (prose.length === 1 ? ' ' + prose[0] : 's ' + prose.join(', ')) + ' in words, but not in the square-bracket form the question asks for.',
            'start each point with the turn number in brackets, e.g. "[Turn ' + prose[0] + '] the response ...".',
            'the question asks you to "start with the turn number in square brackets (e.g., [Turn 1], [Turn 2])". ' + why);   // F6-05
        } else if (flagged.length) {
          warn(side.scope, side.keyOf(A.rationale7c), 'the rationale does not reference any turn, but ' + flagged.length + ' rating' + (flagged.length === 1 ? ' on this model flags an issue' : 's on this model flag issues') + ' that the rationale is where you explain.',
            'start each point with the turn where you saw it, e.g. "[Turn 2] the response repeated ...".', why);   // F6-05
        } else {
          warn(side.scope, side.keyOf(A.rationale7c), 'the rationale does not reference any turn.',
            'as the question asks, "for each point in your rationale ... start with the turn number in square brackets (e.g., [Turn 1], [Turn 2])".', why);   // F6-05
        }
      }
      // F6-12: every turn a rating FLAGS must be explained in the rationale. Byte-decidable:
      // the flagged-turn set comes from each head's Turns child, the cited set from the
      // rationale. Length is never checked (requirements F1-07) -- turn coverage is the
      // decidable proxy for "explain the issues you flagged".
      // The turns children MUST come from CFG.childrenOf[head].turns and never from a name
      // pattern like /Turns$/ -- that also matches "numberOfTurns" and silently poisons the
      // flagged set with the turn COUNT (hit while dry-running this against both goldens).
      if (!singleTurn) {
        const flaggedTurns = new Set();
        for (const head of CFG.heads) {
          if (!isMinorOrMajor(side.get(head))) continue;
          const tk = (CFG.childrenOf[head] || {}).turns;
          if (!tk) continue;
          for (const v of asArr(side.get(tk))) { const x = intOf(v); if (x !== null) flaggedTurns.add(x); }
        }
        const citedSet = new Set(cites);
        const uncited = [...flaggedTurns].filter((t) => !citedSet.has(t)).sort((x, y) => x - y);
        if (flaggedTurns.size && uncited.length) {
          // The doc is explicit: "If you selected Minor or Major issue(s) to any of the questions
          // above, please also explain in this question." An unexplained flagged issue is a
          // requirement violation, not a formatting nit -- unlike F6-05, which stays a warning
          // because there the explanation IS present and only the notation is wrong.
          err(side.scope, side.keyOf(A.rationale7c), 'turn' + (uncited.length === 1 ? ' ' + uncited[0] + ' is' : 's ' + uncited.join(', ') + ' are') + ' flagged as having issues, but the rationale never explains ' + (uncited.length === 1 ? 'that turn' : 'those turns') + '.',
            'add a point starting "[Turn ' + uncited[0] + ']" describing what went wrong there.',
            'turns flagged on the ratings: ' + [...flaggedTurns].sort((x, y) => x - y).join(', ') + '; turns cited in the rationale: ' + (cites.length ? [...citedSet].sort((x, y) => x - y).join(', ') : 'none') + '.');   // F6-12
        }
      }
    }

    // F6-07: the doc's own cross-reference -- 4a "(If you select this, also flag the issue in
    // 5a.)". Byte-decidable, so it moved out of the QD layer.
    {
      const cats = asArr(side.get(A.f6_07_category));
      const hit = cats.some((c) => sameOpt(c, A.f6_07_option));
      const ts = side.get(A.f6_07_crossHead);
      if (hit && filled(ts) && !isMinorOrMajor(ts)) {
        // The form itself instructs "If you select this, also flag the issue in 5a." The two
        // answers contradict each other and the rater can reconcile either way. Blocking.
        err(side.scope, side.keyOf(A.f6_07_crossHead), 'a sensitive-information grounding problem is flagged under "' + labelOf(A.f6_07_category) + '", but this rating reports no issue.',
          'either rate "' + labelOf(A.f6_07_crossHead) + '" as a minor or major issue, or remove that category if it does not apply.',
          'the form\'s own instruction on "' + labelOf(A.f6_07_category) + '" reads "If you select this, also flag the issue in 5a."; "' + labelOf(A.f6_07_crossHead) + '" = "' + rawStr(ts) + '".');   // F6-07
      }
    }

    // F6-08: both "Over-" heads define N/A as "the response wasn't personalized". If Q1 says
    // the response was not personalized at all, an issue rating on those heads contradicts it.
    // Symmetric wording: either Q1 or the head may be the wrong one.
    if (q1HasNot && !q1HasPers) {
      for (const head of A.f6_08_heads) {
        const v = side.get(head);
        if (isMinorOrMajor(v)) {
          // Both "Over-" heads define N/A as "the response wasn't personalized", so this pair is
          // self-contradictory by the form's own vocabulary. Blocking; the wording stays
          // symmetric because either answer could be the wrong one.
          err(side.scope, side.keyOf(head), 'this rating flags an over-personalization issue while "' + labelOf(A.q1) + '" says the response was not personalized at all.',
            'if the response really was not personalized, set this to "N/A"; if it was personalized, correct "' + labelOf(A.q1) + '".',
            '"' + labelOf(A.q1) + '" = "' + q1.join(', ') + '"; "' + labelOf(head) + '" = "' + rawStr(v) + '".');   // F6-08
        }
      }
    }
  }

  // F6-13: the side-by-side verdict says the two conversations were about the same, while the
  // per-model ratings disagree. Deliberately scoped to the "about the same" case ONLY, because
  // that is the one verdict needing no Conversation-A/B -> Model-A/B mapping -- which is still
  // unresolved (escalation 3: where the 50:50 presentation flip lands in the export is unknown).
  // A directional check would have to assume that mapping, so it is not attempted here.
  {
    const sxs = T(A.sxs);
    if (filled(sxs) && /about the same/i.test(norm(sxs)) && bound.length === 2) {
      const profile = (side) => {
        const flagged = CFG.heads.filter((h) => isMinorOrMajor(side.get(h)));
        const major = flagged.filter((h) => sameOpt(side.get(h), MAJOR));
        return { flagged: flagged, major: major, key: flagged.map((h) => h + '=' + norm(side.get(h))).sort().join('|') };
      };
      const pa = profile(bound[0]), pb = profile(bound[1]);
      if (pa.key !== pb.key) {
        const delta = Math.abs(pa.flagged.length - pb.flagged.length) + Math.abs(pa.major.length - pb.major.length);
        if (delta > 0) {
          warn('Task', A.sxs, 'the two conversations are rated as about the same, but the per-model ratings differ.',
            'if one conversation really was better, choose that side; if they were genuinely equal, check the per-model ratings that differ.',
            bound[0].name + ': ' + pa.flagged.length + ' issue(s) flagged (' + pa.major.length + ' major); ' +
            bound[1].name + ': ' + pb.flagged.length + ' issue(s) flagged (' + pb.major.length + ' major).');   // F6-13
        }
      }
    }
    // F7-06: record the verdict direction against each side's severity profile and the batch's
    // Model A / Model B columns, so escalation 3 (does Conversation A always mean Model A?) can
    // be settled from a real batch instead of assumed. Log only -- never a finding.
    if (filled(T(A.sxs)) && bound.length === 2) {
      const cnt = (side) => CFG.heads.filter((h) => isMinorOrMajor(side.get(h))).length;
      const mA = findMeta('model a'), mB = findMeta('model b');
      logs.push('F7-06 SxS mapping evidence: verdict "' + rawStr(T(A.sxs)) + '"; issues flagged -- ' +
        bound.map((x) => x.role + ' (' + x.name + ')=' + cnt(x)).join(', ') +
        '; batch Model A=' + (mA ? '"' + mA.value + '"' : 'absent') + ', Model B=' + (mB ? '"' + mB.value + '"' : 'absent') + '.');   // F7-06
    }
  }

  // F6-09: every choice answer must be in the configured option set. Canonical variants
  // (whitespace, case, straight vs curly apostrophe, short "N/A" vs its long label) are EQUAL
  // and logged, never flagged -- we parse on our side. A genuinely unknown value is config
  // drift and routes to the lead, never to the rater.
  {
    const CHOICE_TYPES = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE']);
    const variantLog = [];
    const unknown = [];
    const checkOpts = (scope, key, fullKey, val) => {
      const opts = CFG.options[key];
      if (!opts || !opts.length || !CHOICE_TYPES.has(CFG.types[key])) return;
      for (const v of asArr(val)) {
        if (isBlank(v)) continue;
        if (opts.some((o) => o === rawStr(v))) continue;
        const soft = opts.find((o) => sameOpt(o, v));
        if (soft) variantLog.push(scope + ' "' + labelOf(fullKey) + '": "' + rawStr(v) + '" read as "' + soft + '"');
        else unknown.push(scope + ' "' + labelOf(fullKey) + '": "' + rawStr(v) + '" (configured: ' + opts.map((o) => '"' + o + '"').join(', ') + ')');
      }
    };
    for (const k of CFG.taskFields) checkOpts('Task', k, k, T(k));
    for (const side of bound) for (const k of CFG.perSide) checkOpts(side.role + ' model', k, side.keyOf(k), side.get(k));
    if (variantLog.length) logs.push('F6-09 canonical option variants accepted (' + variantLog.length + ', never a finding): ' + variantLog.join(' | '));
    if (unknown.length) {
      errors.push('[ROUTE TO LEAD] Answer value not offered by this form | Problem: ' + unknown.length + ' answer' + (unknown.length === 1 ? '' : 's') + ' in this task hold' + (unknown.length === 1 ? 's' : '') + ' a value the form does not offer, which points at a form-configuration change rather than a rater mistake. | Fix: report this task to your lead -- no rework is needed from you. | Why: ' + unknown.join(' ; ') + '.');   // F6-09
    }
  }

  // F6-11: the doc's PII rule -- "replace it with what it was (e.g. [full name]) - not just
  // delete it or put 'redacted'". Only the BARE token is the violation; descriptive
  // placeholders like [full name] / [city] / [granddaughter's name] never fire. The rater
  // decides WHAT to redact; this only checks HOW.
  {
    // Only the BRACKETED substitution form -- "[redacted]", "(redacted)", "<redacted>" -- which
    // is what the doc forbids as a replacement for removed personal information. The previous
    // pattern matched the bare word anywhere, so it fired on legitimate prompts such as
    // "How do I redact a PDF?" and "What is the best redaction tool" (both verified). Stays a
    // WARNING even tightened: a rater could be discussing redaction inside brackets.
    const BARE_REDACTED = /[\[\(<\uff3b]\s*redact(?:ed|ion)?\s*[\]\)>\uff3d]/i;
    const scan = (scope, fullKey, val) => {
      const s = rawStr(val);
      if (!s || !BARE_REDACTED.test(s)) return;
      warn(scope, fullKey, 'this answer uses the word "redacted" in place of removed personal information.',
        'replace it with a description of what it was, in square brackets -- e.g. [full name], [city] -- so the response still reads correctly.',
        'the task instructions read: replace personal information "with what it was (e.g. [full name]) - not just delete it or put \'redacted\'".');   // F6-11
    };
    scan('Task', A.prompt, T(A.prompt));
    scan('Task', A.conversationalGoal, T(A.conversationalGoal));
    scan('Task', A.sxsRationale, T(A.sxsRationale));
    for (const side of bound) {
      scan(side.scope, side.keyOf(A.rationale7c), side.get(A.rationale7c));
      for (const head of CFG.i18nHeads) {
        const child = (CFG.childrenOf[head] || {}).explanation;
        if (child && CFG.types[child] === 'FREE_TEXT') scan(side.scope, side.keyOf(child), side.get(child));
      }
    }
  }

  // F6-10: turn-count shape from the batch rater instruction, when metadata carries one.
  // A multi-turn instruction with 1 turn is a WARNING -- the doc allows stopping once the goal
  // is met. A single-turn instruction with more than 1 turn is an ERROR. No Eval Type field
  // exists on this form (section 4), so the shape is read from the instruction text only.
  {
    const m = findMeta('rater instruction');
    if (!m || !m.value) {
      logs.push('F6-10 SELF-SKIPPED: batch metadata carries no rater-instruction column.');
    } else {
      const t = m.value.toLowerCase();
      const multi = /multi[\s-]?turn|multiple turns|follow[\s-]?up/.test(t);
      const single = /single[\s-]?turn|one turn|1 turn/.test(t);
      for (const side of bound) {
        const n = declared.get(side.slot);
        if (n === null || n === undefined) continue;
        if (multi && !single && n === 1) {
          warn(side.scope, side.keyOf(A.turns), 'this task was assigned as a multi-turn conversation but only one turn was run for this model.',
            'if your goal was met in one turn that is allowed -- otherwise continue the conversation for the assigned number of turns.',
            'assigned instruction: "' + m.value.slice(0, 160) + '"; turn count ' + n + '.');   // F6-10
        } else if (single && !multi && n > 1) {
          err(side.scope, side.keyOf(A.turns), 'this task was assigned as a single-turn conversation but ' + n + ' turns were run for this model.',
            'a single-turn task is one prompt and one response -- correct the turn count, or tell your lead if the assignment is wrong.',
            'assigned instruction: "' + m.value.slice(0, 160) + '"; turn count ' + n + '.');   // F6-10
        }
      }
    }
  }

  // ==========================================================================
  // F7  BATCH AND METADATA
  // ==========================================================================
  // F7-01: locale vs this project's assignment. BLOCKING as of the 10 Sep 2026 severity review
  // -- the lead ruled the locale is a hard per-project assignment, which settles escalation 6 in
  // favour of enforcement. The config carries no locale marker, so the expected value is
  // SUPPLIED by the build (see CFG.locale) rather than derived.
  // KNOWN CONSEQUENCE: golden task 1271588 is otherwise clean work but declares dialect "India"
  // on an en-US project, with no dialect column in the batch to arbitrate -- it now blocks. If
  // the batch legitimately spans English dialects, widen CFG.locale for that project rather
  // than softening this check.
  {
    const want = CFG.locale || {};
    const gotL = T(A.targetLanguage), gotD = T(A.dialect);
    if (want.language && filled(gotL) && !sameOpt(gotL, want.language)) {
      err('Task', A.targetLanguage, 'the target language is not the language this project is assigned.',
        'confirm the language you evaluated in and correct "' + labelOf(A.targetLanguage) + '"; if this task really was assigned another language, tell your lead.',
        'this project is assigned ' + want.language + '; submitted "' + rawStr(gotL) + '".');   // F7-01
    }
    if (want.dialect && filled(gotD) && !sameOpt(gotD, want.dialect)) {
      err('Task', A.dialect, 'the dialect is not the dialect this project is assigned.',
        'confirm the dialect you evaluated in and correct "' + labelOf(A.dialect) + '"; if this task really was assigned another dialect, tell your lead.',
        'this project is assigned ' + want.dialect + '; submitted "' + rawStr(gotD) + '"' + (findMeta('dialect') ? '' : '. This task carries no assigned-dialect column, so the expectation comes from the project itself') + '.');   // F7-01
    }
    // The assignment half, when the batch sheet carries the columns.
    const mL = findMeta('target language'), mD = findMeta('dialect');
    if (mL && mL.value && filled(gotL) && !sameOpt(mL.value, gotL)) {
      err('Task', A.targetLanguage, 'the target language differs from the language this task assigned.',
        'confirm the language you evaluated in; the assignment sheet may be the stale side.',
        'assigned "' + mL.value + '"; submitted "' + rawStr(gotL) + '".');   // F7-01
    }
    if (mD && mD.value && filled(gotD) && !sameOpt(mD.value, gotD)) {
      err('Task', A.dialect, 'the dialect differs from the dialect this task assigned.',
        'confirm the dialect you evaluated in; the assignment sheet may be the stale side.',
        'assigned "' + mD.value + '"; submitted "' + rawStr(gotD) + '".');   // F7-01
    }
  }
  // F7-05: the batch names the file each side's page should be uploaded as (Model A HTML NAME /
  // Model B HTML NAME, e.g. "M1_D1_001"). The Drive helper returns file CONTENT and never a
  // filename, so this genuinely cannot be verified from inside the script -- log the expected
  // names for a QA to eyeball rather than pretending to check them.
  {
    const a = findMeta('model a html name'), b = findMeta('model b html name');
    if (a || b) {
      logs.push('F7-05 (not verifiable in-script -- the fetch helper exposes no filename): expected page filenames are Model A "' + (a ? a.value : '?') + '", Model B "' + (b ? b.value : '?') + '".');   // F7-05
    } else {
      logs.push('F7-05 SELF-SKIPPED: batch metadata carries no HTML NAME columns.');   // F7-05
    }
  }
  // F7-02: Prompt Type presence only -- whether the prompt FITS its type is QD territory.
  {
    const m = findMeta('prompt type');
    logs.push('F7-02: assigned Prompt Type ' + (m && m.value ? '= "' + m.value + '".' : 'NOT PRESENT in batch metadata -- a platform/metadata issue, never a rater finding.'));   // F7-02
  }
  // F7-04: Attribution branch mode. Data-driven and dormant unless the metadata says so; when
  // active, the branched side has no Turn 1 of its own and the L2 layer exempts its Turn 1
  // checks. Both layers detect this independently from the same metadata.
  {
    const m = findMeta('rater instruction');
    const l2 = findMeta('l2');
    const txt = ((m && m.value) || '') + ' ' + ((l2 && l2.value) || '');
    const branch = /\bbranch(ed|ing)?\b/i.test(txt) && /attribution|second turn|2nd turn/i.test(txt);
    logs.push('F7-04: attribution branch mode ' + (branch ? 'ACTIVE (metadata mentions a branch plus attribution/second-turn scope) -- Turn 1 anchoring is exempt on the branched side.' : 'dormant (no branch instruction in metadata).'));   // F7-04
  }

  // ==========================================================================
  // OUTPUT -- section 6 message contract. One block per field; problems joined by "Also:"; fixes
  // fuzzy-de-duplicated on their first 40 characters; no internal language.
  // ==========================================================================
  const scopeRank = new Map([['Task', 0], [CFG.modelA, 1], [CFG.modelB, 2]]);
  const ordered = [...findings.values()].sort((a, b) => {
    const ra = scopeRank.has(a.scope) ? scopeRank.get(a.scope) : 9;
    const rb = scopeRank.has(b.scope) ? scopeRank.get(b.scope) : 9;
    if (ra !== rb) return ra - rb;
    if (a.fieldKey !== b.fieldKey) return a.fieldKey < b.fieldKey ? -1 : 1;
    return 0;
  });
  for (const f of ordered) {
    const problem = f.problems.length === 1 ? f.problems[0] : f.problems.join(' Also: ');
    const fixes = [];
    const seenSig = new Set();
    for (const a of f.fixes) {
      const sig = a.slice(0, 40).toLowerCase().replace(/\s+/g, ' ').trim();
      if (seenSig.has(sig)) continue;
      seenSig.add(sig);
      fixes.push(a);
    }
    const head = '[' + f.scope + (f.turn ? ' Turn ' + f.turn : '') + ' - "' + labelOf(f.fieldKey) + '"]';
    let msg = head + ' | Problem: ' + problem + ' | Fix: ' + fixes.join(' ');
    if (f.whys.length) msg += ' | Why: ' + f.whys.join(' ');
    if (fileLinks[f.fieldKey]) msg += ' | File: ' + fileLinks[f.fieldKey];
    (f.bucket === 'error' ? errors : warnings).push(msg);
  }

  logs.push(VERSION + ': L1 complete. sides bound=' + bound.length + ', turn counts=' + bound.map((s) => s.role + '=' + (declared.get(s.slot) === null ? '?' : declared.get(s.slot))).join('/') + ', findings=' + findings.size + '.');
}
