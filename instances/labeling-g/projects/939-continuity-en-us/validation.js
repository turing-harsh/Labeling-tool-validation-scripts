// v1.1.0-continuity-en-us — 0824 Continuity (en-US) - Turing Duplicate (projectId 939).
//
// GENERATED FILE — do not edit by hand. Rebuild with: node scripts/build-939.mjs
// Composed from:
//   - parts/continuity-checks.js            (F1–F7 continuity checks -> validateContinuity)
//   - ../903-ko-kr/validation.js            (v3.2.32 debug/HTML/identity pipeline -> validate903, verbatim)
//
// 939 is a duplicate spun off from 903 and must verify BOTH:
//   (1) the F1–F7 form-completeness / gate / coherence criteria, AND
//   (2) 903's artifact-integrity, content-anchoring, Model-ID identity, footprints,
//       byte-identical, cross-conversation, full-share and HTML-pipeline criteria.
// Both push into the shared errors/warnings/infos/successes/logs; the entry point below runs
// each and then de-duplicates identical messages.

async function validate(conversationData) {
  // (1) F1–F7 continuity checks
  try {
    await validateContinuity(conversationData);
  } catch (e) {
    errors.push('Continuity-checks error: ' + (e && e.message ? e.message : String(e)));
  }
  // (2) 903 v3.2.32 pipeline (debug/HTML/identity). In the tool runtime this fetches the
  //     linked Drive artifacts; content/identity findings are raised on the fetched text.
  try {
    await validate903(conversationData);
  } catch (e) {
    errors.push('903-pipeline error: ' + (e && e.message ? e.message : String(e)));
  }
  // Suppress the 903 HTML model-identity FALSE POSITIVE for 939: the saved Gemini page shows
  // the Gemini-UI codename ("Nippon - …") while the form assigns the platform name
  // ("Mode 23 -> …"). Same model, different naming layer. Drop the finding ONLY when the
  // on-page and assigned names share the discriminating suffix (Ramen (top-20) / Prod Frozen)
  // — a genuine swap (suffix differs) still fires.
  {
    const stripPrefix = (s) => String(s).replace(/^\s*[^-→⇒>]+?\s*(?:->|→|⇒|>|-)\s*/, '');
    const canon = (s) => stripPrefix(s).normalize('NFC').toLowerCase().replace(/[^a-z0-9]+/g, '');
    for (let i = errors.length - 1; i >= 0; i--) {
      const m = errors[i];
      if (!/uploaded HTML (?:doesn't match the model assigned|is actually the other model)/.test(m)) continue;
      const on = (m.match(/shows model "([^"]+)"/) || [])[1];
      const exp = (m.match(/(?:expected|was assigned) "([^"]+)"/) || [])[1];
      if (on && exp && canon(on) && canon(on) === canon(exp)) {
        logs.push('Suppressed HTML-identity mismatch (Gemini-UI codename vs form name; model suffix matches): ' + m.slice(0, 160));
        errors.splice(i, 1);
      }
    }
  }

  // Suppress the 903 prompt-mismatch FALSE POSITIVE for 939: in continuity tasks the "Prompt"
  // field is the FOLLOW-UP (Turn 2+) question, not the Turn 1 prompt. The 903 pipeline assumes
  // Prompt == Turn 1 and fires "first prompt doesn't match" / "from different conversations"
  // on every multi-turn task. These are structurally wrong for 939 — drop them.
  {
    const promptMismatchRe = /first prompt doesn't match the prompt you submitted|"Prompt" field and Turn \d+ debug are from different conversations/;
    for (let i = errors.length - 1; i >= 0; i--) {
      if (promptMismatchRe.test(errors[i])) {
        logs.push('Suppressed prompt-mismatch (continuity: Prompt field is the follow-up turn, not Turn 1): ' + errors[i].slice(0, 160));
        errors.splice(i, 1);
      }
    }
  }

  // De-duplicate identical messages produced by both passes.
  for (const arr of [errors, warnings, infos, successes]) {
    const seen = new Set();
    const kept = arr.filter((x) => { const k = String(x); if (seen.has(k)) return false; seen.add(k); return true; });
    arr.length = 0;
    arr.push(...kept);
  }
}

// ======================================================================
// FORM CONFIG (source: config/form-spec-3778.json)
// ======================================================================
// Injected from config/form-spec-3778.json by build-939.mjs — the 939 form config (review-criteria 3778).
const FORM_SPEC = {
  "id": 3778,
  "projectId": 939,
  "note": "Compact validation spec derived from review-criteria config 3778. modelA/modelB from csv Model A/B (SxS: Conversation A = Ramen, Conversation B = Prod Frozen). cond = JsonLogic subset (var,==,in,or,and). Rubric heads gated by a Personalized triggering option; children gated by parent Minor/Major.",
  "modelA": "Mode 23 -> Ramen (top-20) - Fast",
  "modelB": "Mode 23 -> Prod Frozen - Fast",
  "triggeringCond": {
    "or": [
      { "in": ["Personalized (Personal Data)", { "var": "model1PersonalizationTriggering" }] },
      { "in": ["Personalized (Response Preference)", { "var": "model1PersonalizationTriggering" }] },
      { "in": ["Personalized (Time & Location)", { "var": "model1PersonalizationTriggering" }] }
    ]
  },
  "issueOpts": ["Minor issues", "Major issues"],
  "perSide": [
    "numberOfTurns", "testResponse1DebugInfo", "testResponse2DebugInfo",
    "model1TestResponse3DebugInfo", "model1TestResponse4DebugInfo", "model1TestResponse5DebugInfo",
    "model1HtmlFileUpload", "model1PersonalizationTriggering",
    "modelMakesUseOfAvailableUserData1MissedContext", "modelMakesUseOfAvailableUserData1MissedContextCategory", "modelMakesUseOfAvailableUserData1MissedContextTurns",
    "modelMakesUseOfAvailableUserData1Clarification", "modelMakesUseOfAvailableUserData1ClarificationCategory", "modelMakesUseOfAvailableUserData1ClarificationTurns",
    "modelMakesUseOfAvailableUserData1OverPersonalization", "modelMakesUseOfAvailableUserData1OverPersonalizationCategory", "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction", "modelMakesUseOfAvailableUserData1OverPersonalizationTurns",
    "modelMakesUseOfAvailableUserData1PersonalDataErrors", "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory", "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns",
    "modelFeelsLikeItGetsMe1SpeaksMyLanguage", "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns",
    "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture", "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory", "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns",
    "modelConnectsTheDotsForMe1TransparencyAttribution", "modelConnectsTheDotsForMe1TransparencyAttributionCategory", "modelConnectsTheDotsForMe1TransparencyAttributionTurns",
    "modelConnectsTheDotsForMe1OverTransparency", "modelConnectsTheDotsForMe1OverTransparencyCategory", "modelConnectsTheDotsForMe1OverTransparencyDetraction", "modelConnectsTheDotsForMe1OverTransparencyTurns",
    "modelIsTrustworthySafe1TrustSafety", "modelIsTrustworthySafe1TrustSafetyCategory", "modelIsTrustworthySafe1TrustSafetyTurns",
    "modelRespectsMyCorrections1Corrections", "modelRespectsMyCorrections1CorrectionsDirection", "modelRespectsMyCorrections1CorrectionsTurns",
    "testModelOverallPersonalizationQuality", "testModelOverallQuality", "testModelOverallQualityRationale",
    "secondModelLock"
  ],
  "fields": {
    "setupCheck": { "type": "CHECKBOX", "required": true },
    "targetLanguage": { "type": "SINGLE_CHOICE", "required": true, "options": ["Arabic","Assamese","Bengali","Bhojpuri","Bulgarian","Burmese","Chinese","Croatian","Czech","Danish","Dutch","English","Finnish","French","German","Greek","Gujarati","Hebrew","Hindi","Hungarian","Indonesian","Italian","Japanese","Javanese","Kannada","Khmer","Korean","Maithili","Malay","Malayalam","Marathi","Nepali","Norwegian","Odia","Persian","Polish","Portuguese","Punjabi","Romanian","Russian","Sanskrit","Slovak","Spanish","Swahili","Swedish","Tagalog","Tamil","Telugu","Thai","Turkish","Ukrainian","Urdu","Vietnamese"] },
    "dialect": { "type": "SINGLE_CHOICE", "required": true, "options": ["Modern Standard","India","Bulgaria","Myanmar","Mainland (Simplified)","Taiwan (Traditional)","Hong Kong (Cantonese)","Croatia","Czech Republic","Denmark","Netherlands","Belgium (Flemish)","United Kingdom","United States","Australia","Finland","France","Canada","Belgium","Germany","Modern","Israel","Hungary","Indonesia","Italy","Japan","Cambodia","Korea","Malaysia","Nepal","Norway","Afghanistan","Poland","Brazil","Pakistan","Romania","Moldova","Russia","Slovakia","LatAm (All Variants)","Kenya","Tanzania","Sweden","Philippines","Sri Lanka","Thailand","Turkey","Ukraine","Vietnam","Portugal "] },
    "prompt": { "type": "FREE_TEXT", "required": true },
    "conversationalGoal": { "type": "FREE_TEXT", "required": true },
    "personalizationExpectation": { "type": "SINGLE_CHOICE", "required": true, "options": ["A lot — A generic answer would miss important things about my situation.","Somewhat — Personal touches would help, but aren't essential.","Not really — I just need a good answer."] },
    "firstModel": { "type": "SINGLE_CHOICE", "required": true, "options": ["Mode 23 -> Prod Frozen - Fast","Mode 23 -> Ramen (top-20) - Fast"] },
    "qualityComparisonSxS": { "type": "SINGLE_CHOICE", "required": true, "options": ["Conversation A was much better","Conversation A was better","Conversation A was slightly better","Conversation A and B were about the same","Conversation B was slightly better","Conversation B was better","Conversation B was much better"] },
    "qualityComparisonSxSRationale": { "type": "FREE_TEXT", "required": true },
    "privacyGate": { "type": "CHECKBOX", "required": true },

    "numberOfTurns": { "type": "SINGLE_CHOICE", "required": true, "options": ["1","2","3","4","5"] },
    "testResponse1DebugInfo": { "type": "FREE_TEXT", "required": false, "artifact": "debug", "turn": 1 },
    "testResponse2DebugInfo": { "type": "FREE_TEXT", "required": true, "artifact": "debug", "turn": 2 },
    "model1TestResponse3DebugInfo": { "type": "FREE_TEXT", "required": true, "artifact": "debug", "turn": 3 },
    "model1TestResponse4DebugInfo": { "type": "FREE_TEXT", "required": true, "artifact": "debug", "turn": 4 },
    "model1TestResponse5DebugInfo": { "type": "FREE_TEXT", "required": true, "artifact": "debug", "turn": 5 },
    "model1HtmlFileUpload": { "type": "FREE_TEXT", "required": true, "artifact": "html" },
    "model1PersonalizationTriggering": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["Personalized (Personal Data)","Personalized (Response Preference)","Personalized (Time & Location)","Not Personalized"] },

    "modelMakesUseOfAvailableUserData1MissedContext": { "type": "SINGLE_CHOICE", "required": true, "options": ["N/A - No personalization needed","No issues","Minor issues","Major issues"], "condRef": "triggering" },
    "modelMakesUseOfAvailableUserData1MissedContextCategory": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["Missed requested fact","Missed directly supporting evidence","Missed hard constraint","Missed life context","Missed granularity"], "childOf": "modelMakesUseOfAvailableUserData1MissedContext" },
    "modelMakesUseOfAvailableUserData1MissedContextTurns": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["1","2","3","4","5","N/A"], "childOf": "modelMakesUseOfAvailableUserData1MissedContext", "turnsField": true },

    "modelMakesUseOfAvailableUserData1Clarification": { "type": "SINGLE_CHOICE", "required": true, "options": ["N/A","No issues","Minor issues","Major issues"], "condRef": "triggering" },
    "modelMakesUseOfAvailableUserData1ClarificationCategory": { "type": "SINGLE_CHOICE", "required": true, "options": ["Over-clarification","Under-clarification"], "childOf": "modelMakesUseOfAvailableUserData1Clarification" },
    "modelMakesUseOfAvailableUserData1ClarificationTurns": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["1","2","3","4","5","N/A"], "childOf": "modelMakesUseOfAvailableUserData1Clarification", "turnsField": true },

    "modelMakesUseOfAvailableUserData1OverPersonalization": { "type": "SINGLE_CHOICE", "required": true, "options": ["N/A","No issues","Minor issues","Major issues"], "condRef": "triggering" },
    "modelMakesUseOfAvailableUserData1OverPersonalizationCategory": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["Forced connection","Tunnel vision","Cherrypicked details"], "childOf": "modelMakesUseOfAvailableUserData1OverPersonalization" },
    "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction": { "type": "SINGLE_CHOICE", "required": true, "options": ["Not at all","Somewhat","Completely"], "childOf": "modelMakesUseOfAvailableUserData1OverPersonalization" },
    "modelMakesUseOfAvailableUserData1OverPersonalizationTurns": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["1","2","3","4","5","N/A"], "childOf": "modelMakesUseOfAvailableUserData1OverPersonalization", "turnsField": true },

    "modelMakesUseOfAvailableUserData1PersonalDataErrors": { "type": "SINGLE_CHOICE", "required": true, "options": ["N/A","No issues","Minor issues","Major issues"], "condRef": "triggering" },
    "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["Used wrong personal info","Used stale context","Incorrect inference","Overconfident speculation","Personal misattribution","Locational confusion","Temporal confusion"], "childOf": "modelMakesUseOfAvailableUserData1PersonalDataErrors" },
    "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["1","2","3","4","5","N/A"], "childOf": "modelMakesUseOfAvailableUserData1PersonalDataErrors", "turnsField": true },

    "modelFeelsLikeItGetsMe1SpeaksMyLanguage": { "type": "SINGLE_CHOICE", "required": true, "options": ["N/A","No issues","Minor issues","Major issues"], "condRef": "triggering" },
    "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["1","2","3","4","5","N/A"], "childOf": "modelFeelsLikeItGetsMe1SpeaksMyLanguage", "turnsField": true },

    "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture": { "type": "SINGLE_CHOICE", "required": true, "options": ["N/A","No issues","Minor issues","Major issues"], "condRef": "triggering" },
    "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["Missed general insights & patterns","Missed the \"why","Overgeneralized insights"], "childOf": "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture" },
    "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["1","2","3","4","5","N/A"], "childOf": "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture", "turnsField": true },

    "modelConnectsTheDotsForMe1TransparencyAttribution": { "type": "SINGLE_CHOICE", "required": true, "options": ["N/A","No issues","Minor issues","Major issues"], "condRef": "triggering" },
    "modelConnectsTheDotsForMe1TransparencyAttributionCategory": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["Didn't explain personal relevance","Didn't ground hard constraints","Didn’t ground/attribute for sensitive info","Didn't attribute surprising content","Didn't ground when asked","Didn't attribute when asked"], "childOf": "modelConnectsTheDotsForMe1TransparencyAttribution" },
    "modelConnectsTheDotsForMe1TransparencyAttributionTurns": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["1","2","3","4","5","N/A"], "childOf": "modelConnectsTheDotsForMe1TransparencyAttribution", "turnsField": true },

    "modelConnectsTheDotsForMe1OverTransparency": { "type": "SINGLE_CHOICE", "required": true, "options": ["N/A","No issues","Minor issues","Major issues"], "condRef": "triggering" },
    "modelConnectsTheDotsForMe1OverTransparencyCategory": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["Overnarrating","Showing off","Failed to hedge"], "childOf": "modelConnectsTheDotsForMe1OverTransparency" },
    "modelConnectsTheDotsForMe1OverTransparencyDetraction": { "type": "SINGLE_CHOICE", "required": true, "options": ["Not at all","Somewhat","Completely"], "childOf": "modelConnectsTheDotsForMe1OverTransparency" },
    "modelConnectsTheDotsForMe1OverTransparencyTurns": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["1","2","3","4","5","N/A"], "childOf": "modelConnectsTheDotsForMe1OverTransparency", "turnsField": true },

    "modelIsTrustworthySafe1TrustSafety": { "type": "SINGLE_CHOICE", "required": true, "options": ["N/A","No issues","Minor issues","Major issues"], "condRef": "triggering" },
    "modelIsTrustworthySafe1TrustSafetyCategory": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["Inappropriate use of sensitive data","Missing grounding/attribution for sensitive info","Offensive / intrusive"], "childOf": "modelIsTrustworthySafe1TrustSafety" },
    "modelIsTrustworthySafe1TrustSafetyTurns": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["1","2","3","4","5","N/A"], "childOf": "modelIsTrustworthySafe1TrustSafety", "turnsField": true },

    "modelRespectsMyCorrections1Corrections": { "type": "SINGLE_CHOICE", "required": true, "options": ["N/A","No issues","Minor issues","Major issues"], "condRef": "triggering" },
    "modelRespectsMyCorrections1CorrectionsDirection": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["Ignored correction","Overgeneralized correction"], "childOf": "modelRespectsMyCorrections1Corrections" },
    "modelRespectsMyCorrections1CorrectionsTurns": { "type": "MULTIPLE_CHOICE", "required": true, "options": ["1","2","3","4","5","N/A"], "childOf": "modelRespectsMyCorrections1Corrections", "turnsField": true },

    "testModelOverallPersonalizationQuality": { "type": "SINGLE_CHOICE", "required": true, "options": ["Very dissatisfied","Somewhat dissatisfied","Neither satisfied nor dissatisfied","Somewhat satisfied","Very satisfied"] },
    "testModelOverallQuality": { "type": "SINGLE_CHOICE", "required": true, "options": ["Very dissatisfied","Somewhat dissatisfied","Neither satisfied nor dissatisfied","Somewhat satisfied","Very satisfied"] },
    "testModelOverallQualityRationale": { "type": "FREE_TEXT", "required": true },
    "secondModelLock": { "type": "CHECKBOX", "required": true }
  }
};

// ======================================================================
// PART 1 — F1–F7 continuity checks (source: parts/continuity-checks.js)
// ======================================================================
// Continuity (en-US) F1–F7 checks — CONFIG-DRIVEN off FORM_SPEC (review-criteria 3778).
// FORM_SPEC is injected by scripts/build-939.mjs from config/form-spec-3778.json, so field
// visibility, required-ness, and enum option sets come from the real form config — not guesses.
// This eliminates the earlier false positives (wrong enum sets; requiring rubric fields that
// are hidden when the response is "Not Personalized"; per-field "N/A" label variants).

async function validateContinuity(conversationData) {
  const SPEC = (typeof FORM_SPEC !== 'undefined') ? FORM_SPEC : null;
  if (!SPEC) { errors.push('Continuity config (FORM_SPEC) missing — rebuild with scripts/build-939.mjs.'); return; }

  const ratingsRaw =
    conversationData?.conversation?.ratings ||
    conversationData?.task_data?.formData?.ratings ||
    conversationData?.raw_data?.formData?.ratings ||
    conversationData?.ratings;
  if (!ratingsRaw || typeof ratingsRaw !== 'object' || Array.isArray(ratingsRaw)) {
    errors.push('[ROUTE TO LEAD] Form answers not locatable on the payload (no conversation.ratings object).');
    return;
  }
  const inputRaw =
    conversationData?.conversation?.input ||
    conversationData?.task_data?.formData?.input ||
    conversationData?.raw_data?.formData?.input || {};

  const unwrap = (e) => (e && typeof e === 'object' && !Array.isArray(e) && 'value' in e) ? e.value : e;
  const csv = {}; for (const [k, v] of Object.entries(inputRaw)) csv[k] = unwrap(v);

  const isBlank = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'string' && v.trim() === '');
  const asStr = (v) => typeof v === 'string' ? v : v == null ? '' : String(v);
  const asArr = (v) => Array.isArray(v) ? v.map(asStr) : (isBlank(v) ? [] : [asStr(v)]);
  const preview = (v, n = 100) => { const s = Array.isArray(v) ? v.join(', ') : asStr(v); return s.length > n ? s.slice(0, n) + '…' : s; };
  const canon = (s) => asStr(s).normalize('NFC').toLowerCase().replace(/[→⇒]/g, '->').replace(/[^a-z0-9]+/g, '');
  const arrowCanon = (s) => asStr(s).normalize('NFC').replace(/[→⇒⭢]/g, '->').replace(/\s*->\s*/g, ' -> ').replace(/\s+/g, ' ').trim().toLowerCase();

  const err = (side, key, problem, fix, why) => { let m = `${side} — "${key}" | Problem: ${problem} | Fix: ${fix}`; if (why) m += ` | Why: ${why}`; errors.push(m); };
  const warn = (side, key, problem, fix) => warnings.push(`${side} — "${key}" | Problem: ${problem} | Fix: ${fix}`);

  const T = (k) => unwrap(ratingsRaw[k]);
  const perSide = new Set(SPEC.perSide || []);
  const ISSUE = new Set(SPEC.issueOpts || ['Minor issues', 'Major issues']);

  // --- namespace binding (F1-E2/E3) ---
  const PREFIX = 'compareModels.';
  const namespaces = [];
  for (const key of Object.keys(ratingsRaw)) {
    if (!key.startsWith(PREFIX)) continue;
    const rem = key.slice(PREFIX.length);
    if (rem === '__config__') continue;
    const idx = rem.lastIndexOf('.'); if (idx < 0) continue;
    const ns = rem.slice(0, idx); if (ns && !namespaces.includes(ns)) namespaces.push(ns);
  }
  const bindNs = (want) => want ? namespaces.find((ns) => arrowCanon(ns) === arrowCanon(want)) : null;
  let nsA = bindNs(asStr(csv['Model A']).trim());
  let nsB = bindNs(asStr(csv['Model B']).trim());
  if (!nsA && !nsB) {
    errors.push(`[ABORT] Neither model side could be bound. csv Model A="${csv['Model A'] || '(missing)'}", Model B="${csv['Model B'] || '(missing)'}". Namespaces: ${namespaces.map(n => `"${n}"`).join(', ') || '(none)'}.`);
    return;
  }
  if (!nsA || !nsB) {
    const leftover = namespaces.find((n) => n !== nsA && n !== nsB);
    errors.push(`[BINDING] ${!nsA ? 'Model A' : 'Model B'} unbindable; using "${leftover || '(none)'}". Namespaces: ${namespaces.map(n => `"${n}"`).join(', ')}.`);
    if (!nsA) nsA = leftover; else nsB = leftover;
  }
  const sides = [{ label: 'Model A', ns: nsA }, { label: 'Model B', ns: nsB }];
  const S = (ns, k) => unwrap(ratingsRaw[`${PREFIX}${ns}.${k}`]);
  const hasKey = (ns, k) => Object.prototype.hasOwnProperty.call(ratingsRaw, `${PREFIX}${ns}.${k}`);
  logs.push(`Bound Model A="${nsA}", Model B="${nsB}".`);

  // --- enum check with canonical-variant diagnosis (F6-E1) ---
  const checkEnum = (side, key, value, options) => {
    if (!options || !options.length) return;
    for (const v of asArr(value)) {
      if (options.includes(v)) continue;
      const near = options.find((o) => canon(o) === canon(v));
      if (near) err(side, key, `value "${v}" isn't an exact option (variant of "${near}").`, `select "${near}".`, 'enum canonical-variant');
      else err(side, key, `value "${v}" is not a configured option.`, `select one of: ${options.join(' / ')}.`, 'enum value not in option set');
    }
  };

  // --- Drive link protocol (F3) ---
  const URL_RE = /https?:\/\/[^\s'"<>]+/gi;
  const driveFileId = (u) => { let m = asStr(u).match(/\/file\/d\/([^/?#\s]+)/i); if (m) return m[1]; m = asStr(u).match(/[?&]id=([^&#\s]+)/i); return m ? m[1] : null; };
  const isDriveFolder = (u) => /https?:\/\/drive\.google\.com\/drive\/folders\//i.test(asStr(u));
  const isDriveHost = (u) => /^https?:\/\/drive\.google\.com\//i.test(asStr(u).trim());
  const debugFolder = asStr(csv['Google Drive Link (Debug Info)']).trim();
  const htmlFolder = asStr(csv['Google Drive Link (HTML)']).trim();
  const idRegistry = [];
  const checkArtifact = (side, key, value, kind) => {
    const s = asStr(value).trim(); if (isBlank(s)) return;
    const urls = s.match(URL_RE) || [];
    if (urls.length === 0) { err(side, key, 'holds neither a Drive link nor recognizable content.', 'paste the Google Drive file link.', `saw: "${preview(s)}"`); return; }
    if (urls.length > 1) err(side, key, `contains ${urls.length} links; must be exactly one.`, 'keep only the correct Drive file link.', `links: ${urls.slice(0, 3).join(' , ')}`);
    const url = urls[0];
    if (urls.length === 1 && s.replace(url, '').trim().length > 0) err(side, key, 'contains a link plus extra text.', 'the field must contain only the Drive file link.', `extra: "${preview(s.replace(url, '').trim())}"`);
    if (isDriveFolder(url)) {
      const batch = (kind === 'debug' && debugFolder && arrowCanon(url) === arrowCanon(debugFolder)) || (kind === 'html' && htmlFolder && arrowCanon(url) === arrowCanon(htmlFolder));
      err(side, key, `a Drive folder was linked instead of the file${batch ? ' (batch destination folder pasted unchanged)' : ''}.`, 'link the specific file, not the folder.', `folder: ${url}`); return;
    }
    const id = driveFileId(url);
    if (!id) { if (isDriveHost(url)) err(side, key, 'Drive URL is not a file link (no file id).', 'use https://drive.google.com/file/d/<id>/view.', `saw: ${url}`); else warn(side, key, `link is not on Google Drive.`, 'prefer the shared Drive so access can be verified.'); return; }
    for (const p of idRegistry) if (p.id === id) {
      if (p.kind !== kind) err(side, key, `links the same Drive file as ${p.side} "${p.key}" (${p.kind}).`, 'debug links the debug export, HTML the page — never the same file.', `shared id ${id}`);
      else if (p.side !== side) err(side, key, `both sides link the same Drive file for ${kind}.`, 'export a separate file per side.', `shared id ${id}`);
      else err(side, key, `two turns on this side link the same Drive file.`, 'export each turn to its own file.', `shared id ${id}`);
    }
    idRegistry.push({ id, side, key, kind });
  };

  // ---------------- Task-level fields ----------------
  for (const [key, def] of Object.entries(SPEC.fields)) {
    if (perSide.has(key)) continue; // handled per-side below
    const v = T(key);
    if (def.type === 'CHECKBOX') { if (v !== true) err('Task', key, 'is not completed (must be checked/true).', `complete "${key}" before submitting.`); continue; }
    if (def.required && isBlank(v)) { err('Task', key, 'is empty.', `fill in "${key}".`); continue; }
    if (!isBlank(v)) checkEnum('Task', key, v, def.options);
  }

  // F7 — firstModel vs assigned First Model is covered by the embedded 903 pipeline
  // (reported there as an error); not duplicated here to avoid a double finding.

  const raterInstr = asStr(csv['Additional Rater Instruction']);
  const wantMulti = /multi[\s_-]*turn/i.test(raterInstr), wantSingle = /single[\s_-]*turn/i.test(raterInstr);
  const citedTurns = (s) => { const out = []; let m; const re = /\[\s*turn\s*(\d+)\s*\]/gi; while ((m = re.exec(asStr(s))) !== null) out.push(parseInt(m[1], 10)); return out; };

  // ---------------- Per-side ----------------
  for (const { label: side, ns } of sides) {
    const sideName = `${side} ("${ns}")`;
    const startErr = errors.length;
    const declaredStr = asStr(S(ns, 'numberOfTurns'));
    const declared = /^[1-5]$/.test(declaredStr) ? parseInt(declaredStr, 10) : null;
    const resolve = (k) => perSide.has(k) ? S(ns, k) : T(k);

    // visibility per the config
    const visible = (key, def) => {
      if (def.artifact === 'debug') return declared == null ? true : def.turn <= declared;
      if (def.childOf) return ISSUE.has(asStr(resolve(def.childOf)));
      if (def.condRef === 'triggering') {
        const trig = asArr(resolve('model1PersonalizationTriggering'));
        return trig.some((x) => /^personalized/i.test(x));
      }
      return true;
    };

    for (const key of SPEC.perSide) {
      const def = SPEC.fields[key]; if (!def) continue;
      const vis = visible(key, def);
      const val = S(ns, key);

      if (!vis) { // filled-while-hidden (F2-E6) — but a hidden debug slot beyond declared count = stale
        if (!isBlank(val)) {
          if (def.artifact === 'debug') err(sideName, key, `Turn ${def.turn} debug is filled but the task declares only ${declared} turn(s) (stale/hidden slot).`, `clear it, or set the turn count to include Turn ${def.turn}.`);
          else err(sideName, key, `filled while hidden (its show-condition isn't met).`, 'clear it, or correct the field that controls its visibility.');
        }
        continue;
      }

      if (def.type === 'CHECKBOX') { if (val !== true) err(sideName, key, 'is not checked (must be true).', `check "${key}".`); continue; }

      if (def.artifact) {
        if (def.required && isBlank(val)) { err(sideName, key, `${def.artifact === 'html' ? 'HTML link' : `Turn ${def.turn} debug`} is empty.`, 'paste the Drive file link.'); continue; }
        checkArtifact(sideName, key, val, def.artifact);
        continue;
      }

      if (def.required && isBlank(val)) { err(sideName, key, 'is empty.', `fill in "${key}".`); continue; }
      if (isBlank(val)) continue;

      checkEnum(sideName, key, val, def.options);

      if (key === 'numberOfTurns' && declared == null) err(sideName, key, `turn count "${declaredStr}" is missing or outside 1–5.`, 'select a turn count 1–5.');

      // turns-field coherence (F6): cited turns beyond declared; N/A mixing
      if (def.turnsField) {
        const arr = asArr(val);
        if (declared != null) { const over = arr.filter((x) => /^\d+$/.test(x) && +x > declared); if (over.length) err(sideName, key, `cites turn(s) ${over.join(', ')} beyond the declared count (${declared}).`, `cite only turns 1–${declared}.`); }
        if (arr.some((x) => /^n\/?a$/i.test(x)) && arr.some((x) => /^\d+$/.test(x))) warn(sideName, key, 'mixes "N/A" with turn numbers.', 'use either N/A or turn numbers, not both.');
      }
    }

    // F6-E2 — Q1 contradiction
    const trig = asArr(S(ns, 'model1PersonalizationTriggering'));
    if (trig.some((x) => /not\s+personalized/i.test(x)) && trig.some((x) => /^personalized/i.test(x)))
      err(sideName, 'model1PersonalizationTriggering', 'marks "Not Personalized" together with a Personalized option — contradictory.', 'choose either Not Personalized or the Personalized option(s), not both.', `selected: ${trig.join(', ')}`);

    // F6 — rationale coherence
    const anyIssue = SPEC.perSide.some((k) => SPEC.fields[k]?.condRef === 'triggering' && ISSUE.has(asStr(S(ns, k))));
    const rat = S(ns, 'testModelOverallQualityRationale'); const rTurns = citedTurns(rat);
    if (anyIssue && !isBlank(rat) && rTurns.length === 0) warn(sideName, 'testModelOverallQualityRationale', 'issues are flagged but the rationale cites no [Turn N].', 'cite the turn(s) behind the flagged issue(s).');
    if (declared != null) { const over = rTurns.filter((n) => n > declared); if (over.length) warn(sideName, 'testModelOverallQualityRationale', `rationale cites [Turn ${over.join('], [Turn ')}] beyond the declared count (${declared}).`, `cite only turns 1–${declared}.`); }

    // F4 — content anchoring only if a debug slot holds pasted text (self-skips under links)
    logs.push(`${sideName}: debug slots are Drive links — F4 content anchoring runs in the tool (903 pipeline); F5 identity dormant (no verified Model-ID table).`);

    // MT/ST shape
    if ((wantMulti || wantSingle) && declared != null) {
      if (wantMulti && declared < 2) warn(sideName, 'numberOfTurns', `rater instruction "${raterInstr}" (multi-turn) but only ${declared} turn(s).`, 'if the goal was met in one turn you may proceed; otherwise add the remaining turn(s).');
      if (wantSingle && declared > 1) err(sideName, 'numberOfTurns', `rater instruction "${raterInstr}" (single-turn) but ${declared} turns.`, 'reduce to one turn or confirm the intended shape.');
    }

    if (errors.length === startErr) successes.push(`${sideName}: continuity checks passed (${declared ?? '?'} turn(s)).`);
  }

  logs.push('Continuity (en-US) config-driven validation complete (spec 3778).');
}

// ======================================================================
// PART 2 — embedded 903 v3.2.32 pipeline (source: 903-ko-kr/validation.js, verbatim)
// ======================================================================
// v3.2.32-maps-i18n — 0804 Maps in PContext i18n SHARED-TEMPLATE family.
//
// v3.2.24 changes vs v3.2.23 — DEBUG-AS-DRIVE-LINK protocol:
//   This batch family requires each per-turn debug to be saved as a Drive
//   file and LINKED in the debug field — bare pastes are now the protocol
//   violation (previously inverted). New behavior:
//   1. Every non-empty debug slot is resolved BEFORE content checks:
//      - Drive file link  -> fetched via fetchDataFromDriveLink; ALL existing
//        content checks (A-D, Model IDs, footprints, full-share/sian, E39
//        anchors) run on the FETCHED text.
//      - Bare debug paste -> ERROR (protocol violation) with save-to-folder
//        fix text; the pasted content is still analyzed so content problems
//        surface in the same rework round.
//      - Neither          -> ERROR (expected a Drive link).
//   2. Fetch failures reuse the HTML-fetch sharing guidance (share the file
//      or batch folder with the FETCH_SERVICE_ACCOUNT constant — verify it);
//      content checks for that slot are skipped (the link error covers it).
//   3. Linked file that fetches but contains no Gemini debug markers -> ERROR
//      (wrong file). If the file is an HTML/Doc export, entities are decoded
//      and tags dropped line-wise before the marker test so a debug saved via
//      “Save as HTML/Doc” still parses.
//   4. Link-level duplicate check: the same Drive file id in two debug slots
//      (any side/turn), or a debug slot reusing a side's conversation-HTML
//      file id, is an immediate ERROR — catches copy-paste reuse even when
//      fetching is unavailable.
//   5. Emptiness/turn-count/stale-slot logic unchanged (a link counts as a
//      filled slot); MT/ST, rater-instruction, HTML pipeline unchanged.
//   9. (v3.2.32) SELF-CONTAINED FINDINGS FOR QA: error text is the only
//      thing a QA can see when a rater escalates — they cannot open the task
//      data. Every finding anchored on a linked field now appends
//      "| File: <full Drive URL>" automatically (single registry consulted
//      by pushFieldError and by the finding assembler, so ALL debug-content
//      findings and ALL HTML findings carry their link with no per-message
//      code). Pair comparisons (same-chat, swapped HTML, byte-identical
//      debug) list BOTH links; the highest-triage warnings (full-share on
//      dissatisfied, unexpected Model ID, footprints delta, sian_profile,
//      soft identity, title check) carry theirs inline.
//   8. (v3.2.31) INCOMPLETE-READ DEFENCE: a fetched debug that carries the
//      header markers but NO <ctrl99>user turn blocks is indistinguishable
//      from a transient partial download, so the file is now RE-FETCHED once
//      before any finding is raised; if the second read contains the turns
//      (or is longer), it silently replaces the first. Only if the retry
//      reproduces the same content is the finding emitted, and its wording
//      now covers both causes (genuinely truncated file vs incomplete
//      download) instead of blaming the trainer's capture.
//   7. (v3.2.30) FULL LINKS IN OUTPUT: every message and log now prints the
//      complete Drive URL exactly as the trainer submitted it, instead of the
//      internal "drive:<fileId>" comparison key. The canonical id is still
//      used for duplicate MATCHING (so ?usp= variants of the same file still
//      collide) — it is simply never displayed.
//   6. (v3.2.29) READABLE-FORMAT POLICY: if a linked file's debug content can
//      be read, the file passes — format is not policed for its own sake.
//      RTF (TextEdit Rich Text) and Google-Doc/HTML exports that decode to
//      valid debug output now pass SILENTLY (log only, no error/warning);
//      all content checks run on the decoded text as before. Errors remain
//      only for files we genuinely cannot read: .docx/binary, and RTF or
//      Doc/HTML exports whose decoded content contains no debug output.
//      Rationale: a decoded file yields identical validation results, so
//      blocking on container format only costs a rework cycle.
//   7. (v3.2.28) RTF DETECTION + RECOVERY: macOS TextEdit defaults to Rich
//      Text, so raters "save as .txt" and produce an RTF file with a .txt
//      name (confirmed on all four debug files of task 1242430/pt-BR: head
//      '{\\rtf1\\ansi\\ansicpg1252\\cocoartf', line breaks encoded as
//      backslash+newline, accents as \\'e3 / \\uNNNN). RTF is ASCII, so the
//      binary/.docx detector missed it, and the literal <ctrl99> markers made
//      it look like plain text — but the backslash before each newline broke
//      turn extraction, producing a misleading "debug looks cut off, re-copy
//      from the Gemini UI" error on complete, correct debug files. Now: RTF
//      is detected by head, reported as a FORMAT error with TextEdit-specific
//      guidance (Format > Make Plain Text), and DECODED (control words, \\uN
//      with \\ucN fallback skipping, \\'hh cp1252, escaped line breaks) so all
//      content checks still run in the same rework round.
//   7. (v3.2.27) HTML-EXPORT DETECTION FIX: a plain-text debug whose CONTENT
//      quotes HTML (confirmed on M1_D1_038_Turn2.txt — the model's own text
//      says 'do NOT wrap in a <div> container') was misclassified as a
//      Doc/HTML export, and the decode path's tag-stripper then ATE the
//      literal <ctrl99>/<ctrl100> markers (they match <[^>]+>), destroying
//      the turn structure. New rule: literal <ctrlN> markers present =>
//      ALWAYS plain text, never decode; the decode path runs only when the
//      document HEAD is HTML (<!doctype/<html/<head/<meta/<style in the
//      first 400 chars) or the ctrl markers are entity-encoded. The
//      tag-stripper also now shields <ctrlN> tokens via sentinels.
//   7. (v3.2.26) CRLF NORMALIZATION: real Windows-saved .txt debug exports
//      arrive with \r\n line endings (confirmed on task 1241820's Turn-3
//      file: complete debug, 624 CRLF lines, zero bare LF), which broke the
//      <ctrl99>user\n turn-extraction regex and false-fired the "cut off"
//      finding. All debug text (fetched or pasted) is now normalized to \n
//      at the debugValue layer before any content check runs.
//   7. (v3.2.25) FILE FORMAT: the linked debug file must be a plain-text
//      .txt export. A .docx/binary file (ZIP 'PK' signature or word/ parts)
//      is an ERROR and cannot be content-checked; a Google-Doc/HTML-shaped
//      export that still decodes to valid debug fires the format ERROR but
//      the decoded content IS analyzed, so content problems surface in the
//      same rework round.
// Deploy to: 898 (tr-TR), 903 (ko-KR), 904 (es-419), 905 (pt-BR), 906 (zh-CN),
// 907 (id-ID), 908 (ar-001), 909 (ja-JP), 910 (hi-IN).
// Form configs verified BYTE-IDENTICAL (76 fields, zero diffs) for 898/903/904
// on 2026-08-07; verify 905-910 configs the same way on receipt before their
// first batch. Same model pair, Model IDs, and field keys everywhere — no
// per-project code. Language-specific logic is data-driven off each task's
// targetLanguage/dialect.
//
// v3.2.22 changes vs v3.2.21:
//   1. CONFIG RENAME (verified 2026-08-06 by field-level diff of the re-pulled
//      project-config-id-898: only compareModels.sideBySide, firstModel
//      options, the SxS description, and cosmetic displayCondition null->false
//      changed; all 74 other fields byte-identical). The form's model names
//      are now the Gemini-UI names directly:
//        Model A = "Mode 27 Bosko → fast_maps_eval"   (UNICODE arrow U+2192, Test)
//        Model B = "Snowball 03 -> Paid Fast Prod"    (ASCII arrow, Base)
//      The naming layers have COLLAPSED into one. New pair added to
//      KNOWN_PAIRS (legacy Spider/GOAT pair retained for any stale early
//      exports). PROJECT_898_MODELS nsTokens updated to bosko/snowball;
//      'spider'/'goat' kept as legacy alias tokens so csv sheets or exports
//      still carrying the pre-rename strings resolve to the correct side.
//   2. A = Test is no longer an assumption: the renamed config's
//      sideBySide.model_A is the Test dropdown name and the project doc
//      labels the dropdowns Test/Base explicitly. Routine Model-ID
//      confirmation on task 1 still applies; the flip-risk note is retired.
//   3. Mixed-arrow note: canonLoose strips both arrow forms, so → vs ->
//      never affects any comparison in this script. (It DOES affect JMES
//      bindings in the QDs — those must use the exact stored bytes.)
//   4. PROVENANCE (learned from the 886 v3.2.21-en-us script, 2026-08-06):
//      "Spider"/"GOAT" are project 886's (P13N E2E En-US) live model names;
//      898's original config was cloned from 886 and renamed later. Inside
//      project 898 the spider/goat alias tokens correctly resolve stale
//      pre-rename data to Bosko/Snowball.
//      *** DO NOT DEPLOY THIS FILE TO PROJECT 886 ***: there, Spider/GOAT
//      are DIFFERENT models that merely share those strings — this file's
//      identity map would misresolve them to the 898 Bosko/Snowball entries.
//      886 stays on its own v3.2.21-en-us line. If the lineages are ever
//      merged, key the identity map on project id, not on names.
//   5. Documented delta vs the en-us lineage: runHtmlSide receives
//      expectedModel with a namespace fallback (assignedModelARaw ||
//      nsAForMetadata; canonical passes csv-only). Deliberate for 898 — the
//      HTML identity check still runs when the csv sheet is sparse, since
//      the 898 namespaces now equal the Gemini dropdown names.
//
// ---- v3.2.21 changelog below ----
//
// v3.2.21 changes vs v3.2.20-en-us:
//   1. 898 pair registered: platform names are
//        Model A = "P13n x ToolSelector (PContext mode 21) -> Spider"
//        Model B = "P13n x ToolSelector -> GOAT"
//      (confirmed from project-config-id-898.json: firstModel options and the
//      compareModels sideBySide config). The Gemini-UI dropdown names from the
//      project doc — "Mode 27 Bosko -> fast_maps_eval" (Test) and
//      "Snowball 03 -> Paid Fast Prod" (Base) — are a different naming layer
//      and appear only inside Gemini (mode selector, Model IDs), never in the
//      form data. Added to KNOWN_PAIRS in adaptIfNewSchema.
//   2. Exact Model-ID identity map (from the client project doc):
//        Spider -> pcontext_1p_paid_fast_prod_maps_eval
//        GOAT   -> bard_paid_fast_uft90
//      When the map resolves both sides, the v3.2.7/v3.2.14 fuzzy
//      declared-identity heuristic is SKIPPED entirely — traced against the
//      898 names it false-fires: the Base declared core "paid_fast_prod" is a
//      substring of the TEST id core "1p_paid_fast_prod_maps_eval", which
//      flips the check into STRICT mode and errors both sides on every
//      correct task. Exact semantics: id equals own expected -> pass; equals
//      the OTHER side's expected -> ERROR (definitive swap); equals neither
//      -> WARNING (possible variant drift; report to POC).
//      *** ASSUMPTION TO VERIFY ON TASK 1 ***: Model A (Spider, "PContext
//      mode 21") is the Test side and Model B (GOAT) is Base. If reversed,
//      the exact check will fire the swap error on every task — flip the two
//      modelId/geminiName values in PROJECT_898_MODELS.
//   3. Mode-selector identity: per-side Gemini-UI alias tokens (bosko /
//      fast_maps_eval vs snowball / paid fast prod). The platform names
//      (Spider/GOAT) share no tokens with the Gemini-UI variant labels, so
//      both the full-name match and the v3.2.18 codename-core fallback would
//      fail on every 898 task. Alias hit on own side -> pass; on the other
//      side -> error (swap); on neither -> WARNING (not error) until the real
//      saved-page selector label is verified on the first completed task.
//   4. MT shape (Eval Type = MT with <2 filled slots): error -> WARNING for
//      this project. The 898 client doc explicitly allows finishing in one
//      turn when the conversational goal is achieved ("Avg turns 1-5 ...
//      they don't have to force the interaction to be multi-turn"). ST logic
//      unchanged (an ST task with 2+ turns is still a hard shape error).
//   5. Adapter passes `dialect` through (new 898 field; consumed by QD6).
//   6. sian_profile checks unchanged: chapter absence on a full share stays
//      log-only (882 evidence: task debugs legitimately lack the chapter once
//      the setup-verification chat is deleted per instructions), sources
//      sub-check stays a warning. The 898 "sian_profile in BOTH Test and
//      Base" requirement is a rater-screening rule enforced by leads;
//      revisit severity after the first 898 full share is inspected.
//
// Everything below the changelog is v3.2.20-en-us with the edits marked
// "v3.2.21". All content-anchored debug checks (A-D), byte-identical pairs,
// stale slots, footprints warnings, Attribution branch mode (898 has 4
// Attribution prompts in its 84-prompt set), dissatisfied-full-share, E39,
// and the HTML pipeline carry over unchanged.

async function validate903(conversationData) {
  const originalConversationData = conversationData;
  conversationData = adaptIfRatingsArraySchema(conversationData);
  conversationData = adaptIfRunnerSchema(conversationData);
  conversationData = adaptIfNewSchema(conversationData);

  const ratings =
    conversationData?.ratings ||
    conversationData?.conversation?.ratings ||
    conversationData?.task_data?.formData?.ratings ||
    conversationData?.raw_data?.formData?.ratings;

  if (!Array.isArray(ratings)) {
    errors.push('Could not locate ratings array on conversationData.');
    return;
  }

  const inputs =
    conversationData?.input ||
    conversationData?.conversation?.input ||
    conversationData?.task_data?.formData?.input ||
    conversationData?.raw_data?.formData?.input ||
    [];

  const byKey = {};
  const labelByKey = {};
  for (const r of ratings) {
    if (r && typeof r.key === 'string') {
      byKey[r.key] = r.human_input_value;
      labelByKey[r.key] = r.question || r.key;
    }
  }

  // v3.2.32: field -> full artifact URL registry. Populated as links are
  // read (HTML uploads, debug slots); consulted by pushFieldError and the
  // finding assembler so every finding is self-contained for QA triage.
  const fieldLinks = {};
  const linkSuffix = (fieldKey) => fieldLinks[fieldKey] ? ` | File: ${fieldLinks[fieldKey]}` : '';

  const inputByKey = {};
  if (Array.isArray(inputs)) {
    for (const entry of inputs) {
      if (entry && typeof entry === 'object') {
        for (const [k, v] of Object.entries(entry)) {
          inputByKey[k] = v;
        }
      }
    }
  }

  const sideLabels = Array.isArray(conversationData?._sideLabels) && conversationData._sideLabels.length === 2
    ? conversationData._sideLabels
    : ['Model A', 'Model B'];
  const SIDE_A = sideLabels[0];
  const SIDE_B = sideLabels[1];
  const sideALower = SIDE_A.toLowerCase();
  const sideBLower = SIDE_B.toLowerCase();

  const parseTurnCount = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };

  const shortHash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(16).padStart(8, '0');
  };

  const SYSTEM_MARKERS = /\[Content of all requested items is omitted here because it may be found above or below\.\]|\[NO CONTENT FOUND\]/g;
  const stripSystemMarkers = (s) => typeof s !== 'string' ? '' : s.replace(SYSTEM_MARKERS, '');
  const hasSystemMarker = (s) => {
    if (typeof s !== 'string') return false;
    SYSTEM_MARKERS.lastIndex = 0;
    const result = SYSTEM_MARKERS.test(s);
    SYSTEM_MARKERS.lastIndex = 0;
    return result;
  };

  const preview = (s, n = 80) => {
    if (typeof s !== 'string') return String(s);
    const cleaned = stripSystemMarkers(s).trim();
    return cleaned.length > n ? cleaned.slice(0, n) + '...' : cleaned;
  };

  const previewDiff = (a, b, n = 80) => {
    const cleanA = stripSystemMarkers(a);
    const cleanB = stripSystemMarkers(b);
    const minLen = Math.min(cleanA.length, cleanB.length);
    let diffAt = -1;
    for (let i = 0; i < minLen; i++) {
      if (cleanA[i] !== cleanB[i]) { diffAt = i; break; }
    }
    if (diffAt === -1) diffAt = minLen;
    if (diffAt < Math.floor(n / 2)) {
      return { a: preview(cleanA, n), b: preview(cleanB, n) };
    }
    const half = Math.floor(n / 2);
    const start = Math.max(0, diffAt - half);
    const window = (s) => {
      const end = Math.min(s.length, start + n);
      const left = start > 0 ? '...' : '';
      const right = end < s.length ? '...' : '';
      return left + s.slice(start, end).replace(/\s+/g, ' ').trim() + right;
    };
    return { a: window(cleanA), b: window(cleanB) };
  };

  const normalizeText = (s) => {
    if (typeof s !== 'string') return '';
    return stripSystemMarkers(s)
      .normalize('NFC')
      .replace(/[​-‍﻿]/g, '')
      .replace(/�/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const extractUserMessages = (blob) => {
    const out = [];
    const re = /<ctrl99>user\n([\s\S]*?)<ctrl100>/g;
    let m;
    while ((m = re.exec(blob)) !== null) out.push(m[1].trim());
    return out;
  };

  const extractModelIds = (blob) => {
    const re = /^Model ID:\s*(\S+)\s*$/gm;
    const out = [];
    let m;
    while ((m = re.exec(blob)) !== null) out.push(m[1]);
    return out;
  };

  const extractFootprints = (blob) => {
    if (typeof blob !== 'string') return null;
    const m = blob.match(/num_turns_read_from_footprints:\s*(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };

  const extractDeclaredCore = (declaredStr) => {
    if (typeof declaredStr !== 'string') return null;
    const parts = declaredStr.split(/->|→|⇒|—>|=>|\s>\s/); // v3.2.14: bare ' > ' separator (877 names)
    const suffix = parts[parts.length - 1];
    const core = suffix.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    return core.length > 0 ? core : null;
  };

  const extractDeclaredCandidates = (declaredStr) => {
    if (typeof declaredStr !== 'string') return null;
    const coreOf = (s) => s.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    const parts = declaredStr.split(/->|→|⇒|—>|=>|\s>\s/);
    const cands = [...new Set([...parts, declaredStr].map(coreOf).filter(c => c.length >= 4))];
    return cands.length > 0 ? cands : null;
  };

  const extractIdCore = (modelId) => {
    if (typeof modelId !== 'string') return null;
    const core = modelId.toLowerCase().replace(/^pcontext_/, '');
    return core.length > 0 ? core : null;
  };

  const matchesDeclared = (idCore, declared) => {
    if (!idCore || !declared) return null;
    const cands = Array.isArray(declared) ? declared : [declared];
    return cands.some((c) => idCore.includes(c) || c.includes(idCore));
  };

  const DEBUG_STRUCTURAL_MARKERS = [
    '<ctrl99>', 'Model ID:', 'LM Prefix:', 'LM prefix:', 'BAS->', 'num_turns_read_from_footprints',
    'Agency config id', 'Recipe ID', // v3.2.14: Agency-style shares
  ];

  const looksLikeDebug = (s) => {
    if (typeof s !== 'string' || s.length === 0) return false;
    return DEBUG_STRUCTURAL_MARKERS.some((m) => s.includes(m));
  };

  // ---------------------------------------------------------------------------
  // Deterministic metadata / link / HTML helpers
  // ---------------------------------------------------------------------------

  const valueToString = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return v.map(valueToString).filter(Boolean).join(' ');
    if (typeof v === 'object') {
      for (const k of ['url', 'link', 'href', 'value', 'name', 'fileName', 'filename', 'title', 'displayName']) {
        if (typeof v[k] === 'string' && v[k].trim()) return v[k];
      }
    }
    return '';
  };

  const normalizeModelDisplayName = (s) => {
    if (typeof s !== 'string') return '';
    return s
      .normalize('NFC')
      .replace(/[​-‍﻿]/g, '')
      .replace(/^\s*\d+\s*[-.)]\s*/, '')
      .replace(/\s*>\s*/g, ' - ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const canonLoose = (s) => normalizeModelDisplayName(valueToString(s))
    .toLowerCase()
    .replace(/&gt;/g, '>')
    .replace(/[^a-z0-9㐀-鿿]+/g, '');

  const modelNamesMatch = (a, b) => {
    const ca = canonLoose(a);
    const cb = canonLoose(b);
    if (!ca || !cb) return false;
    return ca === cb || ca.includes(cb) || cb.includes(ca);
  };

  const modelNameCore = (s) => {
    const t = normalizeModelDisplayName(valueToString(s));
    if (!t) return '';
    const parts = t.split(/->|→|⇒|>|[-–:,]/).map(x => x.trim()).filter(Boolean);
    const last = parts.length > 0 ? parts[parts.length - 1] : t;
    const core = canonLoose(last);
    return core.length >= 3 ? core : canonLoose(t);
  };

  // ---------------------------------------------------------------------------
  // v3.2.23-898: project identity tables (0804 Maps in PContext i18n).
  // Post-rename (2026-08-06) the compareModels namespaces ARE the Gemini-UI
  // names; nsToken matches them. 'spider'/'goat' are kept as LEGACY alias
  // tokens so pre-rename csv sheets / stale exports still resolve.
  // WARNING: those two tokens are also project 886's LIVE model names (the
  // 898 config was cloned from 886). This aliasing is correct only inside
  // project 898 — never copy this file to 886 (see header note 4).
  // A = Test is confirmed by the config (sideBySide.model_A = the Test
  // dropdown name) and the project doc's Test/Base dropdown labels; the exact
  // Model-ID check below still confirms it empirically on every task.
  // ---------------------------------------------------------------------------
  const PROJECT_898_MODELS = [
    {
      nsToken: 'bosko',
      geminiName: 'Mode 27 Bosko → fast_maps_eval',
      modelIds: ['pcontext_1p_paid_fast_prod_maps_eval'],
      uiAliases: ['bosko', 'mode 27', 'fast maps eval', 'fast_maps_eval', 'maps eval', 'spider'],
    },
    {
      nsToken: 'snowball',
      geminiName: 'Snowball 03 -> Paid Fast Prod',
      // v3.2.23: production task 1241400 shipped bard_paid_fast_uft94 (doc said uft90) — both accepted.
      modelIds: ['bard_paid_fast_uft94', 'bard_paid_fast_uft90'],
      uiAliases: ['snowball', 'paid fast prod', 'paid_fast_prod', 'uft90', 'goat'],
    },
  ];
  const resolve898Entry = (nameRaw) => {
    const c = canonLoose(nameRaw);
    if (!c) return null;
    const byNs = PROJECT_898_MODELS.find((e) => c.includes(e.nsToken));
    if (byNs) return byNs;
    // Also resolve Gemini-UI-layer strings (csv sheets may carry them):
    // dropdown-name aliases and the raw Model IDs.
    return PROJECT_898_MODELS.find((e) =>
      e.modelIds.some((id) => c.includes(canonLoose(id))) ||
      e.uiAliases.some((a) => { const ac = canonLoose(a); return ac.length >= 4 && c.includes(ac); })
    ) || null;
  };

  // v3.2.21: name equality across the 898 naming layers. "Mode 27 Bosko ->
  // fast_maps_eval" (Gemini UI) and "P13n x ToolSelector (PContext mode 21)
  // -> Spider" (platform form) are the same model; the generic matcher can't
  // know that, so metadata comparisons route through this helper. A true
  // cross-side mismatch (Spider section vs GOAT declaration) still fails.
  const modelNamesMatch898 = (a, b) => {
    if (modelNamesMatch(a, b)) return true;
    const ea = resolve898Entry(a);
    const eb = resolve898Entry(b);
    return !!ea && ea === eb;
  };

  const extractDriveFileId = (v) => {
    const s = valueToString(v).trim();
    if (!s) return null;
    let m = s.match(/https?:\/\/drive\.google\.com\/file\/d\/([^/?#\s]+)/i);
    if (m) return m[1];
    m = s.match(/https?:\/\/drive\.google\.com\/(?:open|uc)\?[^\s#]*\bid=([^&#\s]+)/i);
    if (m) return m[1];
    return null;
  };

  const isDriveFileUrl = (v) => {
    const s = valueToString(v).trim();
    if (!s) return false;
    return !!extractDriveFileId(s) && /^https?:\/\/drive\.google\.com\//i.test(s);
  };

  const canonicalUploadLink = (v) => {
    const id = extractDriveFileId(v);
    if (id) return `drive:${id}`;
    return valueToString(v).trim().replace(/[?#].*$/, '').toLowerCase();
  };

  const decodeHtmlEntities = (s) => {
    if (typeof s !== 'string') return '';
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, ent) => {
      const e = ent.toLowerCase();
      if (e[0] === '#') {
        const n = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : _;
      }
      return Object.prototype.hasOwnProperty.call(named, e) ? named[e] : _;
    });
  };

  const stripHtmlToText = (rawHtml) => {
    if (typeof rawHtml !== 'string') return '';
    let s = rawHtml
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|article|li|tr|h[1-6]|pre)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ');
    return normalizeText(decodeHtmlEntities(s));
  };

  const extractHtmlTitle = (rawHtml) => {
    if (typeof rawHtml !== 'string') return '';
    const m = rawHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    return m ? normalizeText(decodeHtmlEntities(m[1]).replace(/\s+-\s+Google Gemini\s*$/i, '')) : '';
  };

  const extractSavedGeminiConversationId = (rawHtml) => {
    if (typeof rawHtml !== 'string') return null;
    const looksLikeConvId = (t) =>
      typeof t === 'string' && t.length >= 12 && /[0-9]/.test(t) && /^[A-Za-z0-9_-]+$/.test(t);
    const saved = rawHtml.match(/saved from url=\(\d+\)https:\/\/gemini\.google\.com\/app\/([A-Za-z0-9_-]+)/i);
    if (saved && looksLikeConvId(saved[1])) return saved[1];
    const re = /https:\/\/gemini\.google\.com\/app\/([A-Za-z0-9_-]+)/gi;
    let g;
    while ((g = re.exec(rawHtml)) !== null) {
      if (looksLikeConvId(g[1])) return g[1];
    }
    return null;
  };

  const extractVisiblePromptsFromHtml = (rawHtml) => {
    const out = [];
    if (typeof rawHtml !== 'string') return out;
    const lineRe = /<p\b[^>]*class=(['"])\s*[^'"]*query-text-line[^'"]*\1[^>]*>([\s\S]*?)<\/p>/gi;
    const containers = rawHtml.split(/<user-query-content\b/i).slice(1);
    if (containers.length > 0) {
      for (const c of containers) {
        const lines = [];
        let m; lineRe.lastIndex = 0;
        while ((m = lineRe.exec(c)) !== null) {
          const txt = stripHtmlToText(m[2]);
          if (txt) lines.push(txt);
        }
        const joined = normalizeText(lines.join(' '));
        if (joined) out.push(joined);
      }
      if (out.length > 0) return out;
    }
    let m; lineRe.lastIndex = 0;
    while ((m = lineRe.exec(rawHtml)) !== null) {
      const txt = stripHtmlToText(m[2]);
      if (txt) out.push(txt);
    }
    return out;
  };

  const extractVisibleResponsesFromHtml = (rawHtml) => {
    const out = [];
    if (typeof rawHtml !== 'string') return out;
    const re = /<structured-content-container\b[^>]*class=(['"])[^'"]*model-response-text[^'"]*\1[^>]*>([\s\S]*?)<\/structured-content-container>/gi;
    let m;
    while ((m = re.exec(rawHtml)) !== null) {
      const txt = stripHtmlToText(m[2]);
      if (txt) out.push(txt);
    }
    return out;
  };

  const extractAgencyConfigId = (blob) => {
    if (typeof blob !== 'string') return null;
    const m = blob.match(/Agency config id:\s*"([^"]+)"/i) || blob.match(/Agency config id:\s*([^\s<]+)/i);
    return m ? decodeHtmlEntities(m[1]).trim() : null;
  };

  const extractLlmDebuggerUrl = (blob) => {
    if (typeof blob !== 'string') return null;
    const m = blob.match(/https:\/\/llmdebugger\.corp\.google\.com\/agency\?s=[^"'\s<>)]+/i);
    return m ? decodeHtmlEntities(m[0]).trim() : null;
  };

  const extractModeSelectorModel = (rawHtml) => {
    if (typeof rawHtml !== 'string') return '';
    const anchor = rawHtml.search(/data-test-id=(['"])bard-mode-menu-button\1/i);
    let aria = '';
    if (anchor >= 0) {
      const fwd = rawHtml.slice(anchor, anchor + 1500);
      const mf = fwd.match(/aria-label=(['"])([\s\S]*?)\1/i);
      if (mf) aria = mf[2];
      if (!aria) {
        const start = rawHtml.lastIndexOf('<button', anchor);
        const gt = rawHtml.indexOf('>', anchor);
        if (start >= 0 && gt > start) {
          const tag = rawHtml.slice(start, gt);
          const m = tag.match(/aria-label=(['"])([\s\S]*?)\1/i);
          if (m) aria = m[2];
        }
      }
    }
    if (!aria) {
      const m2 = rawHtml.match(/aria-label=(['"])([^'"]*?(?:seletor de modo|mode selector|选择模式|模式|وضع|الوضع)[^'"]*)\1/i);
      if (m2) aria = m2[2];
    }
    aria = decodeHtmlEntities(aria).trim();
    if (aria) {
      let candidate = aria;
      const cm = candidate.match(/,\s*currently\s+([\s\S]+)$/i);
      if (cm) candidate = cm[1];
      const after = candidate.includes(':') ? candidate.slice(candidate.lastIndexOf(':') + 1) : candidate;
      const out = normalizeText(after);
      if (out) return out;
    }
    if (anchor >= 0) {
      const mv = rawHtml.slice(anchor, anchor + 800).match(/>\s*([^<>]{2,60}?)\s*<(?:gem-icon|mat-icon|span)/i);
      if (mv) return normalizeText(decodeHtmlEntities(mv[1]));
    }
    return '';
  };

  const hasM1Marker = (s) => /(^|[^a-z0-9])m1([^a-z0-9]|$)|html[_ -]?m1|_m1_/i.test(valueToString(s));
  const hasM2Marker = (s) => /(^|[^a-z0-9])m2([^a-z0-9]|$)|html[_ -]?m2|_m2_/i.test(valueToString(s));
  const basename = (s) => {
    const raw = valueToString(s).split(/[?#]/)[0].replace(/\\/g, '/');
    const part = raw.slice(raw.lastIndexOf('/') + 1);
    return decodeURIComponent(part || raw || '').trim();
  };

  const filenameFromUploadValue = (v) => {
    if (!v) return '';
    if (typeof v === 'object' && !Array.isArray(v)) {
      for (const k of ['name', 'fileName', 'filename', 'originalName', 'title', 'displayName']) {
        if (typeof v[k] === 'string' && v[k].trim()) return basename(v[k]);
      }
      for (const k of ['path', 'localPath']) {
        if (typeof v[k] === 'string' && v[k].trim()) return basename(v[k]);
      }
    }
    const s = valueToString(v);
    const b = basename(s);
    return /\.html?$/i.test(b) ? b : '';
  };

  const collectHtmlCandidates = (root) => {
    const candidates = [];
    const seen = new Set();
    const addCandidate = (candidate) => {
      if (!candidate || typeof candidate.content !== 'string' || !candidate.content.trim()) return;
      const key = `${candidate.name || ''}|${candidate.url || ''}|${candidate.slot || ''}|${candidate.content.length}`;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push(candidate);
    };
    const ingest = (node, keyHint = '') => {
      if (!node) return;
      if (typeof node === 'string') {
        if (node.toLowerCase().includes('<html')) addCandidate({ name: keyHint, slot: keyHint, content: node });
        return;
      }
      if (Array.isArray(node)) {
        node.forEach((v, i) => ingest(v, `${keyHint}[${i}]`));
        return;
      }
      if (typeof node !== 'object') return;

      const name = valueToString(node.name || node.fileName || node.filename || node.originalName || node.title || node.displayName || keyHint);
      const url = valueToString(node.url || node.link || node.href || node.driveUrl || node.webViewLink);
      const slot = valueToString(node.slot || node.side || node.modelLabel || node.model || keyHint);
      const content = node.content || node.html || node.rawHtml || node.rawHTML || node.text || node.body;
      if (typeof content === 'string') addCandidate({ name, url, slot, content });

      const looksLikeFileObject = !!content || !!node.name || !!node.fileName || !!node.filename || !!node.url || !!node.link;
      if (looksLikeFileObject) return;
      for (const [k, v] of Object.entries(node)) ingest(v, k);
    };

    const knownContainers = [
      root?._htmlFiles, root?.htmlFiles, root?.html_files, root?._attachedHtmlFiles,
      root?.attachments, root?.files, root?.uploadedFiles, root?.fileContents,
      root?.htmlByModel, root?.rawHtmlByModel,
      root?.task_data?._htmlFiles, root?.task_data?.htmlFiles,
      root?.raw_data?._htmlFiles, root?.raw_data?.htmlFiles,
    ];
    knownContainers.forEach((container, i) => ingest(container, `htmlContainer${i}`));
    return candidates;
  };

  const pickHtmlCandidate = (candidates, sideLabel, expectedHtmlName, uploadValue, expectedModel, sideMarker) => {
    const fileId = extractDriveFileId(uploadValue);
    const expectedNameCanon = canonLoose(expectedHtmlName || '');
    let best = null;
    for (const c of candidates) {
      const hay = `${c.name || ''} ${c.slot || ''} ${c.url || ''}`;
      const slotHay = `${c.slot || ''}`;
      const hayCanon = canonLoose(hay);
      let score = 0;
      const escapedSideLabel = sideLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (slotHay && new RegExp(escapedSideLabel, 'i').test(slotHay)) score += 1000;
      if (slotHay && sideMarker === 'M1' && hasM1Marker(slotHay)) score += 500;
      if (slotHay && sideMarker === 'M2' && hasM2Marker(slotHay)) score += 500;
      if (fileId && extractDriveFileId(c.url) === fileId) score += 300;
      if (expectedNameCanon && hayCanon.includes(expectedNameCanon)) score += 120;
      if (sideMarker === 'M1' && hasM1Marker(hay)) score += 70;
      if (sideMarker === 'M2' && hasM2Marker(hay)) score += 70;
      if (new RegExp(escapedSideLabel, 'i').test(hay)) score += 60;
      if (!best || score > best.score) best = { ...c, score };
    }
    return best && best.score > 0 ? best : null;
  };

  const titleLooksAlignedWithPrompt = (title, prompt) => {
    const t = normalizeText(title);
    const p = normalizeText(prompt);
    if (!t || !p) return true;
    if (p.includes(t) || t.includes(p)) return true;
    const cjk = (x) => (x.match(/[㐀-鿿]/g) || []).join('');
    const titleCjk = cjk(t);
    const promptCjk = cjk(p);
    if (titleCjk.length >= 2 && promptCjk.length >= 6) {
      const grams = new Set();
      for (let i = 0; i < promptCjk.length - 1; i++) grams.add(promptCjk.slice(i, i + 2));
      let overlap = 0;
      for (let i = 0; i < titleCjk.length - 1; i++) if (grams.has(titleCjk.slice(i, i + 2))) overlap++;
      return overlap > 0;
    }
    const stop = new Set(['the','a','an','and','or','to','of','in','on','for','with','my','me','i','you','using','based','from','help','give']);
    const titleWords = t.toLowerCase().match(/[a-z0-9]{4,}/g) || [];
    const promptWords = new Set((p.toLowerCase().match(/[a-z0-9]{4,}/g) || []).filter(w => !stop.has(w)));
    if (titleWords.length === 0 || promptWords.size === 0) return true;
    return titleWords.some(w => promptWords.has(w));
  };

  const pushFieldError = (modelLabel, fieldKey, headline, action, evidence = '') => {
    const label = labelByKey[fieldKey] || fieldKey;
    let msg = `${modelLabel} - "${label}" | Problem: ${headline} | Fix: ${action}`;
    if (evidence) msg += ` | Why: ${evidence}`;
    msg += linkSuffix(fieldKey); // v3.2.32: QA sees only this text — carry the artifact link
    errors.push(msg);
  };

  const models = [
    {
      label: SIDE_A,
      turnCountKey: 'numberOfTurns',
      fieldByTurn: {
        1: 'testResponse1DebugInfo',
        2: 'testResponse2DebugInfo',
        3: 'model1TestResponse3DebugInfo',
        4: 'model1TestResponse4DebugInfo',
        5: 'model1TestResponse5DebugInfo',
      },
    },
    {
      label: SIDE_B,
      turnCountKey: 'model2NumberOfTurns',
      fieldByTurn: {
        1: 'model2Response1DebugInfo',
        2: 'model2Response2DebugInfo',
        3: 'model2Response3DebugInfo',
        4: 'model2Response4DebugInfo',
        5: 'model2Response5DebugInfo',
      },
    },
  ];

  const perModel = {};
  const findingsByField = new Map();

  const addFinding = (modelLabel, turn, fieldKey, headline, action) => {
    if (!findingsByField.has(fieldKey)) {
      findingsByField.set(fieldKey, {
        fieldKey,
        fieldLabel: labelByKey[fieldKey] || fieldKey,
        modelLabel, turn,
        headlines: [], actions: new Set(), evidence: [],
      });
    }
    const f = findingsByField.get(fieldKey);
    f.headlines.push(headline);
    f.actions.add(action);
  };

  const addEvidence = (fieldKey, line) => {
    const f = findingsByField.get(fieldKey);
    if (f) f.evidence.push(line);
  };

  const formPromptRaw = typeof byKey.prompt === 'string' ? byKey.prompt.trim() : null;
  const formPromptNorm = formPromptRaw !== null ? normalizeText(formPromptRaw) : null;
  const promptFieldLabel = labelByKey.prompt || 'Prompt';

  if (!formPromptRaw) {
    errors.push(
      `"${promptFieldLabel}" field is empty | Problem: the form prompt is required for validation. | Fix: paste Turn 1's user prompt into the "${promptFieldLabel}" field.`
    );
  }

  // ---------------------------------------------------------------------------
  // Deterministic checks from csv_data + submitted form fields (v3.2.12)
  // ---------------------------------------------------------------------------

  const assignedModelARaw = valueToString(inputByKey['TEST MODEL']).trim();
  const assignedModelBRaw = valueToString(inputByKey['BASE MODEL']).trim();
  const assignedFirstModelRaw = valueToString(inputByKey['FIRST MODEL ASSIGNED']).trim();
  const expectedAHtmlName = valueToString(inputByKey['MODEL A HTML NAME']).trim();
  const expectedBHtmlName = valueToString(inputByKey['MODEL B HTML NAME']).trim();
  const nsAForMetadata = valueToString(inputByKey['MODEL A NAMESPACE']).trim();
  const nsBForMetadata = valueToString(inputByKey['MODEL B NAMESPACE']).trim();

  // v3.2.21: resolve the 898 identity entries once. Namespace is preferred
  // (always the platform name); csv declaration is the fallback.
  const entry898A = resolve898Entry(nsAForMetadata || assignedModelARaw);
  const entry898B = resolve898Entry(nsBForMetadata || assignedModelBRaw);
  const project898MapActive = !!(entry898A && entry898B && entry898A !== entry898B);
  if (project898MapActive) {
    logs.push(`v3.2.24 identity map active: ${SIDE_A}="${entry898A.geminiName}" (expected Model ID ${entry898A.modelIds[0]}); ${SIDE_B}="${entry898B.geminiName}" (expected Model ID ${entry898B.modelIds[0]}).`);
  } else {
    logs.push('v3.2.24 identity map NOT resolved from namespaces/csv — falling back to generic fuzzy identity behavior.');
  }

  const htmlLinkAValue = byKey.modelAHtmlFileUpload;
  const htmlLinkBValue = byKey.modelBHtmlFileUpload;
  const htmlLinkARaw = valueToString(htmlLinkAValue).trim();
  const htmlLinkBRaw = valueToString(htmlLinkBValue).trim();
  if (htmlLinkARaw) fieldLinks.modelAHtmlFileUpload = htmlLinkARaw;   // v3.2.32
  if (htmlLinkBRaw) fieldLinks.modelBHtmlFileUpload = htmlLinkBRaw;   // v3.2.32
  const hasAHtmlField = Object.prototype.hasOwnProperty.call(byKey, 'modelAHtmlFileUpload') || !!expectedAHtmlName;
  const hasBHtmlField = Object.prototype.hasOwnProperty.call(byKey, 'modelBHtmlFileUpload') || !!expectedBHtmlName;

  if (nsAForMetadata && assignedModelARaw && !modelNamesMatch898(nsAForMetadata, assignedModelARaw)) {
    errors.push(`${SIDE_A} metadata | Problem: the submitted ${SIDE_A} section label does not match csv_data["Model A"]. | Fix: use the ${SIDE_A} comparison section that matches the assigned Model A. | Why: section namespace="${nsAForMetadata}" but csv Model A="${assignedModelARaw}".`);
  }
  if (nsBForMetadata && assignedModelBRaw && !modelNamesMatch898(nsBForMetadata, assignedModelBRaw)) {
    errors.push(`${SIDE_B} metadata | Problem: the submitted ${SIDE_B} section label does not match csv_data["Model B"]. | Fix: use the ${SIDE_B} comparison section that matches the assigned Model B. | Why: section namespace="${nsBForMetadata}" but csv Model B="${assignedModelBRaw}".`);
  }

  const selectedFirstModelFullRaw = valueToString(byKey.firstModelRaw).trim();
  const selectedFirstSideRaw = valueToString(byKey.firstModel).trim();
  let assignedFirstSide = null;
  if (assignedFirstModelRaw && assignedModelARaw && modelNamesMatch898(assignedFirstModelRaw, assignedModelARaw)) assignedFirstSide = SIDE_A;
  if (assignedFirstModelRaw && assignedModelBRaw && modelNamesMatch898(assignedFirstModelRaw, assignedModelBRaw)) assignedFirstSide = SIDE_B;

  let firstModelMismatchReported = false;
  if (assignedFirstModelRaw && selectedFirstModelFullRaw && !modelNamesMatch898(selectedFirstModelFullRaw, assignedFirstModelRaw)) {
    pushFieldError(
      'Task Metadata', 'firstModelRaw',
      'Trainer-selected first model does not equal the assigned First Model after canonicalization.',
      'select the exact First Model assigned in the task metadata, then rerun the conversations in that order.',
      `Assigned First Model="${assignedFirstModelRaw}"; trainer selected="${selectedFirstModelFullRaw}".`
    );
    firstModelMismatchReported = true;
  }
  if (!firstModelMismatchReported && assignedFirstSide && (selectedFirstSideRaw === SIDE_A || selectedFirstSideRaw === SIDE_B) && selectedFirstSideRaw !== assignedFirstSide) {
    pushFieldError(
      'Task Metadata', 'firstModel',
      'Trainer-selected first model side does not equal the side implied by csv_data["First Model"].',
      'select the side that corresponds to the assigned First Model and rerun in that order.',
      `Assigned First Model maps to ${assignedFirstSide}; form selected ${selectedFirstSideRaw}.`
    );
  }

  // ---------------------------------------------------------------------------
  // Attribution branch mode — detection + branch-side resolution (v3.2.20).
  // ---------------------------------------------------------------------------
  const attributionInstrRaw = valueToString(inputByKey['ADDITIONAL RATER INSTRUCTION']);
  const attributionL2Raw = valueToString(inputByKey['L2 SUB-USE CASE']);
  const attributionMode =
    /attribution/i.test(attributionL2Raw) ||
    (/branch/i.test(attributionInstrRaw) && /(second|2nd)[\s_-]*turn/i.test(attributionInstrRaw));
  let branchSide = null;
  let branchSideT1Empty = false;
  if (attributionMode) {
    const firstSide = (selectedFirstSideRaw === SIDE_A || selectedFirstSideRaw === SIDE_B)
      ? selectedFirstSideRaw
      : assignedFirstSide;
    branchSide = firstSide === SIDE_A ? SIDE_B : (firstSide === SIDE_B ? SIDE_A : null);
    if (!branchSide) {
      logs.push('Attribution branch mode detected, but the first model could not be resolved from the form or csv metadata — branch-side exemptions skipped (standard checks apply).');
    } else {
      const branchT1Key = branchSide === SIDE_A ? 'testResponse1DebugInfo' : 'model2Response1DebugInfo';
      const branchT1Raw = byKey[branchT1Key];
      branchSideT1Empty = !(typeof branchT1Raw === 'string' && branchT1Raw.trim().length > 0);
      logs.push(`Attribution branch mode active (L2="${attributionL2Raw || '(none)'}"): first side=${firstSide}, branch side=${branchSide}, branch-side Turn 1 ${branchSideT1Empty ? 'empty (per protocol)' : 'FILLED'}.`);
      if (!branchSideT1Empty) {
        warnings.push(
          `${branchSide} Turn 1 | Problem: this is an Attribution branch task — ${branchSide}'s chat is branched from the first model's Turn 1, so it has no Turn 1 run of its own and the protocol is to leave ${branchSide}'s Turn 1 debug slot EMPTY. You pasted content there. | Fix: clear ${branchSide}'s Turn 1 debug field (keep the turn count at 2 and Turn 2's debug filled) and resubmit. If the pasted content is a copy of the first model's Turn 1 debug, the same-chat checks below will also flag it.`
        );
      }
    }
  }

  if (hasAHtmlField && !htmlLinkARaw) {
    pushFieldError(SIDE_A, 'modelAHtmlFileUpload', `${SIDE_A} HTML link is empty.`, `paste the Google Drive file URL for ${SIDE_A}'s exported Gemini HTML.`, `Expected HTML name: "${expectedAHtmlName || 'not provided'}".`);
  }
  if (hasBHtmlField && !htmlLinkBRaw) {
    pushFieldError(SIDE_B, 'modelBHtmlFileUpload', `${SIDE_B} HTML link is empty.`, `paste the Google Drive file URL for ${SIDE_B}'s exported Gemini HTML.`, `Expected HTML name: "${expectedBHtmlName || 'not provided'}".`);
  }

  if (htmlLinkARaw && !isDriveFileUrl(htmlLinkARaw)) {
    pushFieldError(SIDE_A, 'modelAHtmlFileUpload', `The link you submitted isn't a Google Drive file link.`, 'submit a Drive file URL in the format https://drive.google.com/file/d/<file-id>/view.', `Saw: "${preview(htmlLinkARaw, 120)}".`);
  }
  if (htmlLinkBRaw && !isDriveFileUrl(htmlLinkBRaw)) {
    pushFieldError(SIDE_B, 'modelBHtmlFileUpload', `The link you submitted isn't a Google Drive file link.`, 'submit a Drive file URL in the format https://drive.google.com/file/d/<file-id>/view.', `Saw: "${preview(htmlLinkBRaw, 120)}".`);
  }

  if (htmlLinkARaw && htmlLinkBRaw && canonicalUploadLink(htmlLinkARaw) && canonicalUploadLink(htmlLinkARaw) === canonicalUploadLink(htmlLinkBRaw)) {
    pushFieldError(SIDE_A, 'modelAHtmlFileUpload', `${SIDE_A} and ${SIDE_B} point to the same uploaded file.`, `upload two separate exported HTML files, one for ${SIDE_A} and one for ${SIDE_B}.`, `${SIDE_A}: ${htmlLinkARaw} ; ${SIDE_B}: ${htmlLinkBRaw}`);
  }

  // ---------------------------------------------------------------------------
  // v3.2.24: debug-as-Drive-link resolution pre-pass.
  // Resolves every non-empty debug slot to analyzable text and enforces the
  // link protocol. Content checks below consume debugValue(field).
  // ---------------------------------------------------------------------------
  const resolvedDebugByField = {};
  const debugFetchFailed = new Set();
  const debugLinkIdByField = {};   // canonical id — used for MATCHING only
  const debugLinkUrlByField = {};  // v3.2.30: full URL as submitted — used for DISPLAY

  // VERIFY THIS ADDRESS against the runner credential's client_email.
  // "beling-" reads like "labeling-" with two letters lost; if this string is
  // wrong, every 404 fix-message sends raters to share with a dead account.
  const FETCH_SERVICE_ACCOUNT = 'beling-tool-g-svc@turing-gpt.iam.gserviceaccount.com';
  const normalizeDebugNewlines = (s) => typeof s === 'string' ? s.replace(/\r\n?/g, '\n') : s;
  const noteReplacementChars = (label, turn, text) => {
    if (typeof text === 'string') {
      const n = (text.match(/�/g) || []).length;
      if (n) logs.push(`${label} Turn ${turn}: fetched text contains ${n} replacement character(s) (U+FFFD) — the runtime decoded a non-UTF-8 file (typically Windows-1252 with NBSP/accented bytes) with replacement. Comparisons ignore these; flag the runner owner to add a cp1252 decode fallback.`);
    }
    return text;
  };
  const debugValue = (field) =>
    normalizeDebugNewlines(
      Object.prototype.hasOwnProperty.call(resolvedDebugByField, field)
        ? resolvedDebugByField[field]
        : valueToString(byKey[field]));

  // v3.2.28: RTF (TextEdit Rich Text saved as .txt) detection + decoding.
  const CP1252_HIGH = {0x80:0x20AC,0x82:0x201A,0x83:0x0192,0x84:0x201E,0x85:0x2026,0x86:0x2020,0x87:0x2021,
    0x88:0x02C6,0x89:0x2030,0x8A:0x0160,0x8B:0x2039,0x8C:0x0152,0x8E:0x017D,0x91:0x2018,0x92:0x2019,
    0x93:0x201C,0x94:0x201D,0x95:0x2022,0x96:0x2013,0x97:0x2014,0x98:0x02DC,0x99:0x2122,0x9A:0x0161,
    0x9B:0x203A,0x9C:0x0153,0x9E:0x017E,0x9F:0x0178};
  const cp1252Char = (b) => String.fromCharCode((b >= 0x80 && b <= 0x9F) ? (CP1252_HIGH[b] || b) : b);

  const looksLikeRtf = (s) => typeof s === 'string' && /^﻿?\s*\{\\rtf\d/.test(s.slice(0, 200));

  const rtfToDebugText = (s) => {
    if (typeof s !== 'string') return '';
    // Drop font/color/style tables: markup only, no debug content.
    let src = s.replace(/\{\\(?:fonttbl|colortbl|stylesheet|\*\\expandedcolortbl|\*\\listtable|\*\\generator)[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gi, '');
    let out = '';
    let i = 0;
    let uc = 1; // \ucN: number of fallback chars following a \uN escape
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') {
        const nxt = src[i + 1];
        if (nxt === '\n' || nxt === '\r') { out += '\n'; i += 2; if (src[i - 1] === '\r' && src[i] === '\n') i++; continue; }
        if (nxt === '\\' || nxt === '{' || nxt === '}') { out += nxt; i += 2; continue; }
        let m = /^\\uc(\d+) ?/.exec(src.slice(i));
        if (m) { uc = parseInt(m[1], 10); i += m[0].length; continue; }
        m = /^\\u(-?\d+) ?/.exec(src.slice(i));
        if (m) {
          let cp = parseInt(m[1], 10);
          if (cp < 0) cp += 65536;
          out += String.fromCharCode(cp);
          i += m[0].length;
          // Skip uc fallback characters (a \'hh escape counts as one).
          for (let k = 0; k < uc && i < src.length; k++) {
            const fb = /^\\'[0-9a-fA-F]{2}/.exec(src.slice(i));
            if (fb) { i += fb[0].length; } else { i += 1; }
          }
          continue;
        }
        m = /^\\'([0-9a-fA-F]{2})/.exec(src.slice(i));
        if (m) { out += cp1252Char(parseInt(m[1], 16)); i += m[0].length; continue; }
        m = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(src.slice(i));
        if (m) { if (m[1] === 'par' || m[1] === 'line') out += '\n'; i += m[0].length; continue; }
        i += 1; continue;
      }
      if (c === '{' || c === '}') { i += 1; continue; }
      out += c; i += 1;
    }
    return out;
  };

  const htmlishToDebugText = (s) => {
    if (typeof s !== 'string') return '';
    // Shield literal <ctrlN> markers so the tag-stripper cannot eat them.
    const shielded = s.replace(/<(ctrl\d+)>/g, '\u0000$1\u0000');
    const stripped = decodeHtmlEntities(
      shielded.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h[1-6]|pre)>/gi, '\n').replace(/<[^>]+>/g, ''));
    return stripped.replace(/\u0000(ctrl\d+)\u0000/g, '<$1>');
  };

  // v3.2.31: same format resolution as the main branches, but silent — used
  // by the incomplete-read retry so no duplicate findings are emitted.
  const resolveFetchedToDebugText = (fetched) => {
    if (typeof fetched !== 'string' || !fetched) return '';
    if (looksLikeRtf(fetched)) {
      const d = rtfToDebugText(fetched);
      return looksLikeDebug(d) ? d : fetched;
    }
    const hasLiteralCtrl = /<ctrl\d+>/.test(fetched);
    const headIsHtml = /^﻿?\s*(?:<!doctype\b|<html\b|<head\b|<meta\b|<style\b)/i.test(fetched.slice(0, 400));
    const hasEncodedCtrl = /&lt;ctrl\d+&gt;/i.test(fetched);
    if (!hasLiteralCtrl && (headIsHtml || hasEncodedCtrl)) {
      const d = htmlishToDebugText(fetched);
      if (looksLikeDebug(d)) return d;
    }
    return fetched;
  };

  const fetchDriveDebugForSlot = async (sideLabel, turn, field, linkRaw) => {
    if (typeof fetchDataFromDriveLink !== 'function') {
      pushFieldError(sideLabel, field,
        `The Drive fetch helper is unavailable in this runtime, so the linked Turn ${turn} debug file could not be read.`,
        `flag this to the project owner — debug-link validation cannot run until the Drive-fetch capability is enabled in the runner.`,
        `Field contains a Drive link ("${preview(linkRaw, 90)}") but the runtime did not expose fetchDataFromDriveLink.`);
      return null;
    }
    try {
      const data = await fetchDataFromDriveLink(linkRaw);
      let content = typeof data === 'string'
        ? data
        : (data != null ? (() => { try { return JSON.stringify(data); } catch (_) { return ''; } })() : '');
      if (!content || !content.trim()) {
        pushFieldError(sideLabel, field,
          `The linked Turn ${turn} debug file is empty.`,
          `re-export the full debug info for this turn into a plain-text .txt file (in the batch output folder) and resubmit.`,
          `Fetched 0 usable characters from ${linkRaw}`);
        return null;
      }
      // v3.2.25: .docx / binary detection — the protocol requires plain .txt.
      const head = content.slice(0, 512);
      const isZipDocx = head.startsWith('PK') && (content.includes('[Content_Types].xml') || content.includes('word/'));
      const nonPrintable = (head.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
      if (isZipDocx || nonPrintable > head.length * 0.1) {
        pushFieldError(sideLabel, field,
          `The linked Turn ${turn} debug file is a ${isZipDocx ? '.docx' : 'binary'} file — debug files must be plain-text .txt.`,
          `Open the debug export, save it as a plain-text .txt file in the batch output folder, and relink the .txt file here. Do not upload .docx, .pdf, or other binary formats — they cannot be validated.`,
          `Fetched content has a ${isZipDocx ? "ZIP/Office signature ('PK' + word/ parts)" : `high non-printable byte ratio (${nonPrintable}/${head.length} in the first 512 chars)`} from ${linkRaw} ; none of the debug content checks can run on it.`);
        return null;
      }
      return content;
    } catch (e) {
      const emsg = (e && e.message) ? e.message : String(e);
      const notFound = /\b404\b|not\s*found/i.test(emsg);
      const reason = notFound
        ? `Google Drive returned "File not found" (404), which it also returns when a file exists but isn't shared with the fetching account — so if the link is correct the file almost certainly isn't shared with ${FETCH_SERVICE_ACCOUNT}.`
        : `The Drive file could not be fetched.`;
      pushFieldError(sideLabel, field,
        `The linked Turn ${turn} debug file could not be accessed (likely not shared).`,
        `save the debug file inside the batch output folder (which is pre-shared), or share the file with ${FETCH_SERVICE_ACCOUNT} as Viewer, then resubmit.`,
        `${reason} The content checks for this turn could not run. [fetch error: ${emsg.slice(0, 160)}]`);
      return null;
    }
  };

  for (const model of models) {
    for (const [tStr, field] of Object.entries(model.fieldByTurn)) {
      const turn = parseInt(tStr, 10);
      const rawSlot = valueToString(byKey[field]).trim();
      if (!rawSlot) continue;

      if (isDriveFileUrl(rawSlot)) {
        debugLinkIdByField[field] = canonicalUploadLink(rawSlot);
        debugLinkUrlByField[field] = rawSlot;
        fieldLinks[field] = rawSlot;   // v3.2.32: findings on this field carry the link
        const fetched = await fetchDriveDebugForSlot(model.label, turn, field, rawSlot);
        if (fetched === null) { debugFetchFailed.add(field); continue; }
        // v3.2.28: RTF first — it contains literal <ctrlN> markers and is pure
        // ASCII, so neither the binary nor the HTML branch would catch it.
        if (looksLikeRtf(fetched)) {
          const rtfDecoded = rtfToDebugText(fetched);
          if (looksLikeDebug(rtfDecoded)) {
            // v3.2.29: readable => acceptable. No finding; content checks run
            // on the decoded text and report any real problems themselves.
            resolvedDebugByField[field] = noteReplacementChars(model.label, turn, normalizeDebugNewlines(rtfDecoded));
            logs.push(`${model.label} Turn ${turn}: linked file is RTF (TextEdit Rich Text); decoded ${rtfDecoded.length.toLocaleString()} chars of debug from ${debugLinkUrlByField[field]} — accepted, content checks applied to the decoded text.`);
            continue;
          }
          addFinding(model.label, turn, field,
            `The linked Turn ${turn} file is a Rich Text (RTF) document that doesn't contain Gemini debug output.`,
            `Export Turn ${turn}'s FULL debug info from the Gemini debug panel into a file in the batch output folder, and link that file here. If you linked the saved conversation page by mistake, that file belongs in the "Model HTML" field.`);
          addEvidence(field,
            `Fetched content from ${debugLinkUrlByField[field]} has the RTF signature, but after decoding it contains none of the markers real debug output always has (Model ID / LM Prefix / <ctrl99> turns / footprints).`);
          debugFetchFailed.add(field);
          continue;
        }

        // v3.2.27: decide plain-text vs Doc/HTML export precisely.
        // Literal <ctrlN> markers => plain text, ALWAYS — debug content
        // routinely quotes HTML tags, which must never trigger decoding.
        // Decode only when the document HEAD is HTML or the ctrl markers
        // arrive entity-encoded (true Doc/HTML export).
        let text = fetched;
        const hasLiteralCtrl = /<ctrl\d+>/.test(fetched);
        const headIsHtml = /^﻿?\s*(?:<!doctype\b|<html\b|<head\b|<meta\b|<style\b)/i.test(fetched.slice(0, 400));
        const hasEncodedCtrl = /&lt;ctrl\d+&gt;/i.test(fetched);
        if (!hasLiteralCtrl && (headIsHtml || hasEncodedCtrl)) {
          const decoded = htmlishToDebugText(fetched);
          if (looksLikeDebug(decoded)) {
            // v3.2.29: readable => acceptable (same policy as RTF).
            text = decoded;
            logs.push(`${model.label} Turn ${turn}: linked file is a Google-Doc/HTML export; debug recovered by decoding from ${debugLinkUrlByField[field]} — accepted, content checks applied to the decoded text.`);
          }
        }
        if (!looksLikeDebug(text)) {
          addFinding(model.label, turn, field,
            `The linked Turn ${turn} file isn't a Gemini debug export — it contains none of the markers real debug output always has.`,
            `Export Turn ${turn}'s FULL debug info from the Gemini debug panel into a plain-text .txt file in the batch output folder, and link that file here. If you linked the saved conversation HTML by mistake, that file belongs in the "Model HTML" field, not the debug field.`);
          addEvidence(field,
            `Fetched ${fetched.length.toLocaleString()} chars from ${debugLinkUrlByField[field]} , but found no debug markers (Model ID / LM Prefix / <ctrl99> turns / footprints).`);
          debugFetchFailed.add(field);
          continue;
        }
        resolvedDebugByField[field] = noteReplacementChars(model.label, turn, normalizeDebugNewlines(text));
        logs.push(`${model.label} Turn ${turn}: fetched linked debug (${text.length.toLocaleString()} chars) from ${debugLinkUrlByField[field]}`);
      } else if (looksLikeDebug(rawSlot)) {
        // Bare paste — protocol violation for this batch family.
        addFinding(model.label, turn, field,
          `Turn ${turn} debug was pasted as raw text — this eval requires each turn's debug to be saved as a Drive file and LINKED in this field.`,
          `Save Turn ${turn}'s full debug info as a plain-text .txt file in the batch output Drive folder (so sharing is inherited), then replace the pasted text in this field with the file's Drive link.`);
        addEvidence(field,
          `The field contains ${rawSlot.length.toLocaleString()} chars of raw debug text instead of a Drive file link. (The pasted content was still analyzed below so any content problems can be fixed in the same round.)`);
        resolvedDebugByField[field] = noteReplacementChars(model.label, turn, normalizeDebugNewlines(rawSlot));
      } else {
        addFinding(model.label, turn, field,
          `Expected a Google Drive file link to Turn ${turn}'s exported debug, but the field contains neither a Drive link nor recognizable debug text.`,
          `Export Turn ${turn}'s full debug info to a plain-text .txt file in the batch output Drive folder and paste the file's link here.`);
        addEvidence(field,
          `Saw: "${preview(rawSlot, 100)}".`);
        debugFetchFailed.add(field);
      }
    }
  }

  // v3.2.31: re-read any slot whose fetched content has debug markers but no
  // conversation turns — the signature of both a truncated file AND a partial
  // download. A second read costs one request and removes the ambiguity.
  for (const model of models) {
    for (const [tStr, field] of Object.entries(model.fieldByTurn)) {
      const turn = parseInt(tStr, 10);
      const stored = resolvedDebugByField[field];
      const linkRaw = debugLinkUrlByField[field];
      if (!stored || !linkRaw || debugFetchFailed.has(field)) continue;
      if (!looksLikeDebug(stored) || /<ctrl99>user\n/.test(stored)) continue;
      if (typeof fetchDataFromDriveLink !== 'function') continue;
      try {
        const again = await fetchDataFromDriveLink(linkRaw);
        const againRaw = typeof again === 'string'
          ? again
          : (again != null ? (() => { try { return JSON.stringify(again); } catch (_) { return ''; } })() : '');
        const againText = normalizeDebugNewlines(resolveFetchedToDebugText(againRaw));
        if (/<ctrl99>user\n/.test(againText) || againText.length > stored.length) {
          logs.push(`${model.label} Turn ${turn}: first read returned ${stored.length.toLocaleString()} chars with no conversation turns; re-read returned ${againText.length.toLocaleString()} chars${/<ctrl99>user\n/.test(againText) ? ' WITH turns' : ''} — using the re-read (incomplete first download).`);
          resolvedDebugByField[field] = againText;
        } else {
          logs.push(`${model.label} Turn ${turn}: re-read returned the same content (${againText.length.toLocaleString()} chars, still no conversation turns) — the linked file itself is incomplete.`);
        }
      } catch (e) {
        logs.push(`${model.label} Turn ${turn}: re-read attempt failed (${(e && e.message ? e.message : String(e)).slice(0, 80)}); reporting on the first read.`);
      }
    }
  }

  // Link-level duplicate detection (works even when fetching is unavailable).
  {
    const byId = {};
    for (const [field, id] of Object.entries(debugLinkIdByField)) {
      (byId[id] = byId[id] || []).push(field);
    }
    const htmlIds = [
      { id: htmlLinkARaw && isDriveFileUrl(htmlLinkARaw) ? canonicalUploadLink(htmlLinkARaw) : null, url: htmlLinkARaw, label: `${SIDE_A}'s conversation HTML` },
      { id: htmlLinkBRaw && isDriveFileUrl(htmlLinkBRaw) ? canonicalUploadLink(htmlLinkBRaw) : null, url: htmlLinkBRaw, label: `${SIDE_B}'s conversation HTML` },
    ];
    for (const [id, fields] of Object.entries(byId)) {
      if (fields.length > 1) {
        const labels = fields.map(f => `"${labelByKey[f] || f}"`).join(' and ');
        const urlList = fields.map(f => `"${labelByKey[f] || f}" -> ${debugLinkUrlByField[f]}`).join(' ; ');
        errors.push(`Debug links | Problem: the same Drive file is linked in ${fields.length} debug slots (${labels}). Each turn's debug must be its own export. | Fix: export each turn's debug to its own file and relink the duplicated slot(s). | Why: ${urlList}`);
      }
      const htmlHit = htmlIds.find(h => h.id && h.id === id);
      if (htmlHit) {
        const labels = fields.map(f => `"${labelByKey[f] || f}"`).join(' and ');
        const dupUrl = debugLinkUrlByField[fields[0]] || htmlHit.url || id;
        errors.push(`Debug links | Problem: ${labels} link${fields.length === 1 ? 's' : ''} the same Drive file as ${htmlHit.label} — the debug field must link the debug TEXT export, not the saved conversation page. | Fix: export the turn's debug info to its own file and link that instead. | Why: both point to ${dupUrl}`);
      }
    }
  }

  const jsonDebugA = debugValue('testResponse1DebugInfo');
  const jsonDebugB = debugValue('model2Response1DebugInfo');

  const extractAllLlmDebuggerUrls = (blob) => {
    if (typeof blob !== 'string') return [];
    const m = blob.match(/https?:\/\/llmdebugger\.corp\.google\.com\/[^\s"'<>]+/g);
    return m ? [...new Set(m)] : [];
  };
  const sideDebugUrlSet = (fieldKeys) => {
    const out = new Set();
    for (const k of fieldKeys) {
      for (const u of extractAllLlmDebuggerUrls(debugValue(k))) out.add(u);
    }
    return out;
  };
  const debugUrlSetA = sideDebugUrlSet(['testResponse1DebugInfo', 'testResponse2DebugInfo', 'model1TestResponse3DebugInfo', 'model1TestResponse4DebugInfo', 'model1TestResponse5DebugInfo']);
  const debugUrlSetB = sideDebugUrlSet(['model2Response1DebugInfo', 'model2Response2DebugInfo', 'model2Response3DebugInfo', 'model2Response4DebugInfo', 'model2Response5DebugInfo']);
  const jsonAgencyA = extractAgencyConfigId(jsonDebugA);
  const jsonAgencyB = extractAgencyConfigId(jsonDebugB);
  const jsonDebugUrlA = extractLlmDebuggerUrl(jsonDebugA);
  const jsonDebugUrlB = extractLlmDebuggerUrl(jsonDebugB);

  if (jsonDebugUrlA && jsonDebugUrlB && jsonDebugUrlA === jsonDebugUrlB) {
    pushFieldError(SIDE_A, 'testResponse1DebugInfo', `${SIDE_A} and ${SIDE_B} have the same Gemini debug link — both point to one chat.`, `copy each model's debug from its own Gemini chat.`, `Both debug fields use ${jsonDebugUrlA}.`);
  }
  if (jsonAgencyA && jsonAgencyB && jsonAgencyA === jsonAgencyB && assignedModelARaw && assignedModelBRaw && !modelNamesMatch(assignedModelARaw, assignedModelBRaw)) {
    pushFieldError(SIDE_A, 'testResponse1DebugInfo',
      `${SIDE_A} and ${SIDE_B} Turn 1 Agency config ids are identical.`,
      `confirm each side's debug was copied from its own model run, and re-paste whichever slot is wrong.`,
      `${SIDE_A} ("${assignedModelARaw}") and ${SIDE_B} ("${assignedModelBRaw}") are supposed to be different models, but the debug you pasted for both sides came from the same model run — so one side's debug is from the wrong model. (Both show the same internal Agency config id "${jsonAgencyA}".)`);
  }

  // ---------------------------------------------------------------------------
  // HTML acquisition (v3.2.13-hercules)
  // ---------------------------------------------------------------------------
  const fetchHtmlForSide = async (sideLabel, fieldKey, linkRaw) => {
    if (!linkRaw || !isDriveFileUrl(linkRaw)) return null;
    if (typeof fetchDataFromDriveLink !== 'function') {
      pushFieldError(sideLabel, fieldKey,
        `The HTML fetch helper is unavailable in this runtime.`,
        `flag this to the project owner — HTML validation cannot run until the Drive-fetch capability is enabled in the runner.`,
        `The runtime did not expose fetchDataFromDriveLink, so the HTML prompt / model-identity / debug checks could not run for this side.`);
      return null;
    }
    try {
      const data = await fetchDataFromDriveLink(linkRaw);
      let content = typeof data === 'string'
        ? data
        : (data != null ? (() => { try { return JSON.stringify(data); } catch (_) { return ''; } })() : '');
      if (!content || !/<html\b/i.test(content)) {
        pushFieldError(sideLabel, fieldKey,
          `The fetched Drive file is not an HTML page.`,
          `upload the exported Gemini conversation HTML for this side; the linked file has no <html> document.`,
          `Fetched ${content ? content.length.toLocaleString() : 0} chars but found no <html> tag — likely the wrong file (e.g., a PDF, text, or doc) was linked.`);
        return null;
      }
      logs.push(`${sideLabel}: fetched HTML from Drive (${content.length.toLocaleString()} chars).`);
      return { name: linkRaw, url: linkRaw, slot: sideLabel, content };
    } catch (e) {
      const emsg = (e && e.message) ? e.message : String(e);
      const notFound = /\b404\b|not\s*found/i.test(emsg);
      const reason = notFound
        ? `Google Drive returned "File not found" (404), which it also returns when a file exists but isn't shared with the fetching account — so if the link is correct the file almost certainly isn't shared with ${FETCH_SERVICE_ACCOUNT}.`
        : `The Drive file could not be fetched.`;
      pushFieldError(sideLabel, fieldKey,
        `The Drive HTML file could not be accessed (likely not shared).`,
        `share the file — or the batch output folder it lives in — with ${FETCH_SERVICE_ACCOUNT} as Viewer, then resubmit. (If it lives in a Shared Drive, add the service account to the Shared Drive itself.)`,
        `${reason} The HTML prompt / model-identity / debug checks could not run for this side. [fetch error: ${emsg.slice(0, 160)}]`);
      return null;
    }
  };

  const htmlCandidates = collectHtmlCandidates(originalConversationData);
  let htmlSourceA = pickHtmlCandidate(htmlCandidates, SIDE_A, expectedAHtmlName, htmlLinkAValue, assignedModelARaw, 'M1');
  let htmlSourceB = pickHtmlCandidate(htmlCandidates, SIDE_B, expectedBHtmlName, htmlLinkBValue, assignedModelBRaw, 'M2');
  if (!htmlSourceA) htmlSourceA = await fetchHtmlForSide(SIDE_A, 'modelAHtmlFileUpload', htmlLinkARaw);
  if (!htmlSourceB) htmlSourceB = await fetchHtmlForSide(SIDE_B, 'modelBHtmlFileUpload', htmlLinkBRaw);

  const htmlAnalysis = {};

  const analyzeHtmlForSide = (cfg) => {
    const { side, fieldKey, source, expectedModel, otherExpectedModel, otherSide } = cfg;
    if (!source || typeof source.content !== 'string') {
      return null;
    }

    const rawHtml = source.content;
    const htmlPlain = decodeHtmlEntities(rawHtml.replace(/<[^>]+>/g, ' '));
    const visibleText = stripHtmlToText(rawHtml);
    const title = extractHtmlTitle(rawHtml);
    const prompts = extractVisiblePromptsFromHtml(rawHtml).map(normalizeText).filter(Boolean);
    const responses = extractVisibleResponsesFromHtml(rawHtml).map(normalizeText).filter(Boolean);
    const htmlAgency = extractAgencyConfigId(htmlPlain) || extractAgencyConfigId(rawHtml);
    const htmlDebugUrl = extractLlmDebuggerUrl(rawHtml) || extractLlmDebuggerUrl(htmlPlain);
    const conversationId = extractSavedGeminiConversationId(rawHtml);
    const selectorModel = extractModeSelectorModel(rawHtml);
    const firstPrompt = prompts[0] || '';
    const firstResponse = responses[0] || '';

    if (!/<html\b/i.test(rawHtml)) {
      pushFieldError(side, fieldKey, `The uploaded file isn't a web page (no HTML content found).`, 're-export the Gemini conversation as a complete HTML file and upload that file link.', `Source: ${source.url || source.name || '(fetched)'}.`);
    }

    const hasConversationMarker = /Conversation with Gemini|Gemini said|You said/i.test(visibleText) || /chat-history/i.test(rawHtml);
    if (!hasConversationMarker) {
      pushFieldError(side, fieldKey, `The uploaded HTML isn't a saved Gemini conversation page.`, 'upload the saved Gemini conversation page, not another web page or file.', `Title="${title || '(missing)'}".`);
    }

    if (formPromptNorm) {
      const visibleContainsPrompt = visibleText.includes(formPromptNorm);
      const promptCandidateMatches = prompts.some(p => p === formPromptNorm);
      if (!visibleContainsPrompt && !promptCandidateMatches) {
        pushFieldError(side, fieldKey, `The uploaded HTML doesn't contain the prompt you submitted.`, 'upload the HTML export for the same task prompt that was submitted in the form.', `Submitted prompt="${preview(formPromptRaw, 120)}"; HTML title="${title || '(missing)'}".`);
      }
      if (firstPrompt && firstPrompt !== formPromptNorm) {
        const dp = previewDiff(formPromptRaw, firstPrompt, 120);
        pushFieldError(side, fieldKey, `The uploaded HTML's first prompt doesn't match the prompt you submitted.`, 'upload the HTML export from the current task conversation, or correct the form prompt if the form prompt is wrong.', `Form prompt="${dp.a}"; HTML Turn 1 prompt="${dp.b}".`);
      }
      const declaredTurnCount = side === SIDE_A ? parseTurnCount(byKey.numberOfTurns) : parseTurnCount(byKey.model2NumberOfTurns);
      if (declaredTurnCount === 1) {
        const otherVisiblePrompts = prompts.filter(p => p !== formPromptNorm);
        if (otherVisiblePrompts.length > 0) {
          pushFieldError(side, fieldKey, `The uploaded HTML appears to include another task's prompt in the conversation.`, 'upload a single-task HTML export whose visible conversation belongs only to this task.', `Unexpected visible prompt example="${preview(otherVisiblePrompts[0], 120)}".`);
        }
      }
    }

    if (!/Debug Info/i.test(rawHtml)) {
      pushFieldError(side, fieldKey, `The uploaded HTML doesn't include a Debug Info section.`, 'expand/copy the Gemini response with Debug Info visible and re-save the HTML.', `Title="${title || '(missing)'}".`);
    }

    const htmlUrlSet = new Set((rawHtml.match(/https?:\/\/llmdebugger\.corp\.google\.com\/[^\s"'<>]+/g) || []));
    const pastedUrlSet = cfg.debugUrlSet instanceof Set ? cfg.debugUrlSet : new Set(cfg.jsonDebugUrl ? [cfg.jsonDebugUrl] : []);
    if (pastedUrlSet.size > 0 && htmlUrlSet.size > 0) {
      const intersects = [...pastedUrlSet].some((u) => htmlUrlSet.has(u));
      if (!intersects) {
        pushFieldError(side, fieldKey, 'The debug info you pasted and the HTML you uploaded are from two different chats.', 'make sure the pasted debug and the uploaded HTML are from the same conversation (for branched Attribution tasks: the pasted post-branch turns and the saved branched-chat HTML), then re-copy whichever one came from the wrong chat.', `None of the ${pastedUrlSet.size} debug URL(s) in your pasted turns appears among the ${htmlUrlSet.size} debug URL(s) in the uploaded HTML.`);
      }
    }
    if (cfg.jsonAgency && htmlAgency && cfg.jsonAgency !== htmlAgency) {
      pushFieldError(side, fieldKey, 'The debug info you pasted and the HTML you uploaded are from two different model runs.', 'make sure the pasted debug and the uploaded HTML are both from the same Gemini response, then re-copy whichever one came from the wrong chat.', `Form Agency config="${cfg.jsonAgency}"; HTML Agency config="${htmlAgency}".`);
    }

    // MODEL IDENTITY via the in-page mode selector.
    // v3.2.21-898: after the v3.2.18 codename-core fallback, try the
    // Gemini-UI alias tokens (the 898 platform names "Spider"/"GOAT" share
    // no tokens with the UI variant labels, which come from the
    // Bosko/Snowball naming layer). A neither-match becomes a WARNING when
    // the 898 map is active, until the real saved-page label is verified.
    if (selectorModel && expectedModel) {
      let matchesOwn = modelNamesMatch(selectorModel, expectedModel);
      let matchesOther = !!otherExpectedModel && modelNamesMatch(selectorModel, otherExpectedModel);
      if (!matchesOwn && !matchesOther && otherExpectedModel) {
        const ownCore = modelNameCore(expectedModel);
        const otherCore = modelNameCore(otherExpectedModel);
        const coresDistinct = ownCore && otherCore && ownCore !== otherCore &&
          !ownCore.includes(otherCore) && !otherCore.includes(ownCore);
        if (coresDistinct) {
          const selCore = modelNameCore(selectorModel);
          const selCanon = canonLoose(selectorModel);
          const coreHitsOwn = !!selCore && (selCore === ownCore || selCanon.includes(ownCore));
          const coreHitsOther = !!selCore && (selCore === otherCore || selCanon.includes(otherCore));
          if (coreHitsOwn && coreHitsOther) {
            logs.push(`${side}: mode-selector label "${selectorModel}" matches both assigned models' codenames — identity check skipped as ambiguous.`);
            matchesOwn = true;
          } else {
            matchesOwn = coreHitsOwn;
            matchesOther = coreHitsOther;
            if (coreHitsOwn) logs.push(`${side}: mode-selector matched by codename core ("${selectorModel}" -> "${ownCore}").`);
          }
        }
      }
      // v3.2.21: Gemini-UI alias fallback (898 dual-naming layer).
      if (!matchesOwn && !matchesOther && (cfg.ownUiAliases || cfg.otherUiAliases)) {
        const selCanon2 = canonLoose(selectorModel);
        const aliasHit = (aliases) => Array.isArray(aliases) && aliases.some((a) => {
          const ac = canonLoose(a);
          return !!ac && selCanon2.includes(ac);
        });
        const aliasOwn = aliasHit(cfg.ownUiAliases);
        const aliasOther = aliasHit(cfg.otherUiAliases);
        if (aliasOwn && aliasOther) {
          logs.push(`${side}: mode-selector label "${selectorModel}" matches both sides' Gemini-UI aliases — identity check skipped as ambiguous.`);
          matchesOwn = true;
        } else {
          if (aliasOwn) {
            matchesOwn = true;
            logs.push(`${side}: mode-selector matched via Gemini-UI alias ("${selectorModel}" -> "${cfg.geminiName898 || 'alias table'}").`);
          }
          if (aliasOther) matchesOther = true;
        }
      }
      if (!matchesOwn && matchesOther) {
        pushFieldError(side, fieldKey, `${side}'s uploaded HTML is actually the other model — the model name on the saved Gemini page is ${otherSide}'s.`, `upload the saved Gemini page for ${side}'s assigned model ("${normalizeModelDisplayName(expectedModel)}"${cfg.geminiName898 ? `, Gemini dropdown "${cfg.geminiName898}"` : ''}); the file you uploaded is ${otherSide}'s.`, `The saved Gemini page shows model "${selectorModel}"; ${side} was assigned "${normalizeModelDisplayName(expectedModel)}".`);
      } else if (!matchesOwn && !matchesOther) {
        if (cfg.softIdentityMismatch) {
          // v3.2.21: warning until the 898 saved-page selector label is
          // verified on a real completed task; then promote or extend aliases.
          warnings.push(`${side} — uploaded HTML | Problem: the model name on the saved Gemini page ("${selectorModel}") matches neither side's platform name ("${normalizeModelDisplayName(expectedModel)}" / "${normalizeModelDisplayName(otherExpectedModel || '')}") nor the Gemini-UI dropdown aliases for this eval. | Fix: confirm the page really is ${side}'s assigned model (Gemini dropdown "${cfg.geminiName898 || 'n/a'}"). If it is, report the exact on-page label to your POC so the alias table can be updated — this check runs as a warning until the 898 saved-page label is verified.${linkSuffix(fieldKey)}`);
        } else {
          pushFieldError(side, fieldKey, `${side}'s uploaded HTML doesn't match the model assigned to ${side}.`, `upload the saved Gemini page for ${side}'s assigned model ("${normalizeModelDisplayName(expectedModel)}").`, `The saved Gemini page shows model "${selectorModel}"; expected "${normalizeModelDisplayName(expectedModel)}".`);
        }
      }
    } else if (!selectorModel) {
      logs.push(`${side}: could not find the model name on the saved Gemini page; the model-identity check was skipped for this side.`);
    }
    if (title && formPromptRaw && !titleLooksAlignedWithPrompt(title, formPromptRaw)) {
      warnings.push(`${side}: HTML title "${title}" has no deterministic lexical overlap with the submitted prompt. The visible-prompt and selector checks are the blocking sources of truth; review manually if this looks like another task's HTML.${linkSuffix(fieldKey)}`);
    }

    logs.push(`${side} HTML parsed: title="${title || '(missing)'}", conversationId="${conversationId || '(missing)'}", selectorModel="${selectorModel || '(missing)'}".`);

    return { side, fieldKey, rawHtml, visibleText, title, prompts, responses, htmlAgency, htmlDebugUrl, conversationId, selectorModel, firstPrompt, firstResponse };
  };

  const runHtmlSide = (cfg) => {
    const before = errors.length;
    const res = analyzeHtmlForSide(cfg);
    if (res && errors.length === before) {
      const bits = [];
      if (res.conversationId) bits.push(`Gemini conversation ${res.conversationId}`);
      if (res.selectorModel && cfg.expectedModel) bits.push(`the model name on the saved Gemini page ("${res.selectorModel}") matches the assigned model`);
      else if (!res.selectorModel) bits.push('model selector not found (identity not verified — see logs)');
      if (formPromptNorm) bits.push('submitted prompt found in the page');
      bits.push('Debug Info present');
      successes.push(`${cfg.side} HTML verified (fetched ${res.rawHtml.length.toLocaleString()} chars): ${bits.join('; ')}.`);
    }
    return res;
  };

  htmlAnalysis[SIDE_A] = runHtmlSide({
    side: SIDE_A, otherSide: SIDE_B, fieldKey: 'modelAHtmlFileUpload', source: htmlSourceA,
    expectedModel: assignedModelARaw || nsAForMetadata, otherExpectedModel: assignedModelBRaw || nsBForMetadata,
    jsonAgency: jsonAgencyA, jsonDebugUrl: jsonDebugUrlA, debugUrlSet: debugUrlSetA,
    ownUiAliases: entry898A ? entry898A.uiAliases : null,
    otherUiAliases: entry898B ? entry898B.uiAliases : null,
    geminiName898: entry898A ? entry898A.geminiName : null,
    softIdentityMismatch: project898MapActive,
  });
  htmlAnalysis[SIDE_B] = runHtmlSide({
    side: SIDE_B, otherSide: SIDE_A, fieldKey: 'modelBHtmlFileUpload', source: htmlSourceB,
    expectedModel: assignedModelBRaw || nsBForMetadata, otherExpectedModel: assignedModelARaw || nsAForMetadata,
    jsonAgency: jsonAgencyB, jsonDebugUrl: jsonDebugUrlB, debugUrlSet: debugUrlSetB,
    ownUiAliases: entry898B ? entry898B.uiAliases : null,
    otherUiAliases: entry898A ? entry898A.uiAliases : null,
    geminiName898: entry898B ? entry898B.geminiName : null,
    softIdentityMismatch: project898MapActive,
  });

  const aHtml = htmlAnalysis[SIDE_A];
  const bHtml = htmlAnalysis[SIDE_B];
  if (aHtml && bHtml) {
    if (aHtml.conversationId && bHtml.conversationId && aHtml.conversationId === bHtml.conversationId) {
      if (attributionMode && branchSide) {
        warnings.push(`Both sides' uploaded HTML resolve to the same Gemini conversation id ("${aHtml.conversationId}"). Even in the Attribution branch flow, the branched chat should be saved as its own conversation — check that you didn't upload one file (or one chat's save) for both sides. If this fires on a correctly-branched save, report it: the check will be tightened or removed once real branched saves are verified.`);
      } else {
        pushFieldError(SIDE_A, 'modelAHtmlFileUpload', `Both sides' uploaded HTML are the same Gemini conversation.`, `upload separate Gemini conversations for ${SIDE_A} and ${SIDE_B}.`, `Both HTML files resolve to Gemini conversation id "${aHtml.conversationId}". Files: ${SIDE_A} -> ${htmlLinkARaw || '(inline)'} ; ${SIDE_B} -> ${htmlLinkBRaw || '(inline)'}`);
      }
    }
    if (aHtml.firstPrompt && bHtml.firstPrompt && aHtml.firstPrompt !== bHtml.firstPrompt) {
      pushFieldError('Cross-HTML', 'modelAHtmlFileUpload', `${SIDE_A} Turn 1 prompt differs from ${SIDE_B} Turn 1 prompt.`, 'rerun both models with the exact same Turn 1 prompt and upload the matching HTML files.', `${SIDE_A} prompt="${preview(aHtml.firstPrompt, 100)}"; ${SIDE_B} prompt="${preview(bHtml.firstPrompt, 100)}". Files: ${SIDE_A} -> ${htmlLinkARaw || '(inline)'} ; ${SIDE_B} -> ${htmlLinkBRaw || '(inline)'}`);
    }
    if (aHtml.firstPrompt && bHtml.firstPrompt && aHtml.firstPrompt === bHtml.firstPrompt && aHtml.firstResponse && bHtml.firstResponse && aHtml.firstResponse === bHtml.firstResponse && aHtml.firstResponse.length >= 80 && !(aHtml.conversationId && bHtml.conversationId && aHtml.conversationId !== bHtml.conversationId)) {
      if (attributionMode && branchSide) {
        logs.push(`Attribution branch flow: both HTMLs share the same Turn 1 response (hash ${shortHash(aHtml.firstResponse)}) — inherited by the branched chat; same-chat error skipped.`);
      } else {
        pushFieldError('Cross-HTML', 'modelAHtmlFileUpload', `${SIDE_A}'s and ${SIDE_B}'s uploaded HTML have the same prompt and the same response — the same chat was used for both sides.`, 'upload the distinct HTML export for each model; do not reuse one model response for both sides.', `Response hash=${shortHash(aHtml.firstResponse)}; response length=${aHtml.firstResponse.length.toLocaleString()} chars.`);
      }
    }
    if (jsonAgencyA && jsonAgencyB && aHtml.htmlAgency && bHtml.htmlAgency && aHtml.htmlAgency === jsonAgencyB && bHtml.htmlAgency === jsonAgencyA && jsonAgencyA !== jsonAgencyB) {
      pushFieldError('Cross-HTML', 'modelAHtmlFileUpload', `The two uploaded HTML files are swapped — each one matches the other side's debug info.`, `swap the two HTML uploads so each side's HTML matches the debug you pasted for that side.`, `${SIDE_A} HTML agency="${aHtml.htmlAgency}"; ${SIDE_B} HTML agency="${bHtml.htmlAgency}". Files: ${SIDE_A} -> ${htmlLinkARaw || '(inline)'} ; ${SIDE_B} -> ${htmlLinkBRaw || '(inline)'}`);
    }
  }

  if (Object.prototype.hasOwnProperty.call(byKey, 'qualityComparisonSxS') && !valueToString(byKey.qualityComparisonSxS).trim()) {
    errors.push(`Quality Comparison SxS | Problem: SxS winner is empty. | Fix: select which conversation was better before submitting.`);
  }
  if (Object.prototype.hasOwnProperty.call(byKey, 'qualityComparisonSxSRationale') && !valueToString(byKey.qualityComparisonSxSRationale).trim()) {
    errors.push(`Quality Comparison SxS Rationale | Problem: SxS rationale is empty. | Fix: enter a rationale explaining the selected SxS winner.`);
  }

  // ---------------------------------------------------------------------------
  // Debug-info checks (unchanged from v3.2.12)
  // ---------------------------------------------------------------------------
  for (const model of models) {
    const declared = parseTurnCount(byKey[model.turnCountKey]);
    if (declared === null) {
      errors.push(
        `${model.label} — "${labelByKey[model.turnCountKey] || model.turnCountKey}" field is missing or unreadable | Problem: the turn count is required to validate debug pastes against the declared submission shape. | Fix: enter the number of turns for ${model.label} in "${labelByKey[model.turnCountKey] || model.turnCountKey}".`
      );
    }
    const maxTurn = declared || 5;

    const turns = [];
    const systemMarkerTurns = [];
    for (let t = 1; t <= maxTurn; t++) {
      const field = model.fieldByTurn[t];
      if (debugFetchFailed.has(field)) continue; // v3.2.24: link error already reported; content unavailable
      const raw = debugValue(field);
      if (typeof raw !== 'string') continue;
      const trimmed = raw.trim();
      if (trimmed.length === 0) continue;

      if (!looksLikeDebug(trimmed)) {
        const fieldLabel = labelByKey[field] || field;
        addFinding(
          model.label, t, field,
          `Debug info doesn't look like Gemini debug output.`,
          `Re-copy Turn ${t}'s debug info from the Gemini UI debug panel and paste it into "${fieldLabel}".`
        );
        addEvidence(field,
          `The pasted content (${trimmed.length.toLocaleString()} chars) has none of the markers a real Gemini debug always contains.`
        );
        continue;
      }

      const rawUsers = extractUserMessages(trimmed);
      const normUsers = rawUsers.map(normalizeText);
      const modelIds = extractModelIds(trimmed);
      const firstUser = rawUsers[0] || null;
      const lastUser = rawUsers[rawUsers.length - 1] || null;
      const firstUserNorm = normUsers[0] || '';
      const lastUserNorm = normUsers[normUsers.length - 1] || '';

      turns.push({
        turn: t, field, value: trimmed,
        users: rawUsers, normUsers,
        firstUser, lastUser, firstUserNorm, lastUserNorm,
        modelIds,
      });

      if (rawUsers.some(u => hasSystemMarker(u))) systemMarkerTurns.push(t);

      const hasLmPrefixMarker = /LM [Pp]refix/.test(trimmed);
      if (rawUsers.length === 0 && !hasLmPrefixMarker) {
        addFinding(
          model.label, t, field,
          `This turn's debug paste contains only the first section of the debug info — the "LM Prefix" section with the conversation turns is missing.`,
          `Per the share instructions, paste BOTH segments: on the Agency path, the first paragraph AND everything after "LM prefix"; on the ALS path, everything before "reagent_trace" AND everything from "LM Prefix: <ctrl99>system" onward. Re-copy Turn ${t}'s debug and include the LM Prefix segment in "${labelByKey[field] || field}".`
        );
        addEvidence(field,
          `The paste (${trimmed.length.toLocaleString()} chars) has debug markers but no "LM prefix" section and no <ctrl99>user turn blocks — without them, none of the conversation-content checks can run on this turn.`
        );
      } else if (rawUsers.length === 0) {
        addFinding(
          model.label, t, field,
          `Turn ${t}'s debug is incomplete — the header is there but the conversation turns are missing (only ${trimmed.length.toLocaleString()} characters were read).`,
          `Open the linked file and scroll to the end: a complete capture ends with the model's final response, not mid-sentence. If it IS cut off, re-save the full debug and relink. If it looks complete on your side, re-run validation once — an incomplete download can produce this too (the file was already re-read once automatically).`
        );
        addEvidence(field,
          `The content read for this turn has debug markers (Model ID / LM Prefix) but no <ctrl99>user...<ctrl100> conversation blocks, which in a complete capture appear after the system and developer sections. The file was re-read once and returned the same content.`
        );
      }
    }

    if (declared !== null) {
      const filledSlots = [];
      const emptySlotsInRange = [];
      for (let t = 1; t <= declared; t++) {
        const field = model.fieldByTurn[t];
        const raw = byKey[field];
        const trimmed = typeof raw === 'string' ? raw.trim() : '';
        if (trimmed.length > 0) {
          filledSlots.push(t);
        } else {
          emptySlotsInRange.push({ t, field, fieldLabel: labelByKey[field] || field });
        }
      }
      if (attributionMode && branchSide === model.label && declared >= 2) {
        const t1Idx = emptySlotsInRange.findIndex((s) => s.t === 1);
        if (t1Idx !== -1) {
          emptySlotsInRange.splice(t1Idx, 1);
          logs.push(`${model.label}: Turn 1 debug intentionally empty (Attribution branch flow) — excluded from the empty-slot count check.`);
        }
      }
      if (emptySlotsInRange.length > 0) {
        const turnCountFieldLabel = labelByKey[model.turnCountKey] || model.turnCountKey;
        const emptyTurnsList = emptySlotsInRange.length === 1
          ? `Turn ${emptySlotsInRange[0].t}`
          : `Turns ${emptySlotsInRange.slice(0, -1).map(s => s.t).join(', ')} and ${emptySlotsInRange.at(-1).t}`;
        const anchor = emptySlotsInRange[0];
        addFinding(
          model.label, anchor.t, anchor.field,
          `${model.label}: declared ${declared} turn${declared === 1 ? '' : 's'} but ${emptySlotsInRange.length} debug slot${emptySlotsInRange.length === 1 ? ' is' : 's are'} empty (${emptyTurnsList}).`,
          `Either paste the missing debug info into the empty slot${emptySlotsInRange.length === 1 ? '' : 's'}, or correct "${turnCountFieldLabel}" to match the number of turns you actually have.`
        );
        addEvidence(anchor.field,
          `"${turnCountFieldLabel}" is set to ${declared}, so ${declared} debug slot${declared === 1 ? '' : 's'} ${declared === 1 ? 'is' : 'are'} expected. Filled: ${filledSlots.length}. Empty: ${emptySlotsInRange.map(s => `"${s.fieldLabel}"`).join(', ')}.`
        );
      }
    }

    if (systemMarkerTurns.length > 0) {
      const turnList = systemMarkerTurns.length === 1
        ? `Turn ${systemMarkerTurns[0]}`
        : `Turns ${systemMarkerTurns.slice(0, -1).join(', ')} and ${systemMarkerTurns.at(-1)}`;
      warnings.push(
        `${model.label}: ${turnList} debug contains a placeholder note that Gemini's system inserts automatically (e.g., "[Content of all requested items is omitted here...]" or "[NO CONTENT FOUND]"). Gemini adds these on its own — not you — and the checks ignore them. No action needed unless another check flags the same field.`
      );
    }

    if (declared !== null) {
      const turnCountFieldLabel = labelByKey[model.turnCountKey] || model.turnCountKey;
      const staleSlots = [];
      for (let t = declared + 1; t <= 5; t++) {
        const field = model.fieldByTurn[t];
        const raw = byKey[field];
        if (typeof raw !== 'string') continue;
        const trimmed = raw.trim();
        if (trimmed.length === 0) continue;
        staleSlots.push({ t, field, fieldLabel: labelByKey[field] || field, length: trimmed.length });
      }
      if (staleSlots.length > 0) {
        const highest = staleSlots[staleSlots.length - 1].t;
        const slotsList = staleSlots.map(s => `Turn ${s.t}`).join(', ');
        const anchor = staleSlots[staleSlots.length - 1];
        addFinding(
          model.label, anchor.t, anchor.field,
          `Hidden ${model.label} debug fields (${slotsList}) still hold content from an earlier attempt and need to be cleared.`,
          `Temporarily set "${turnCountFieldLabel}" to ${highest} so the hidden ${model.label} debug fields become visible again. Delete the content from each of them. Then set "${turnCountFieldLabel}" back to ${declared} and resubmit.`
        );
        addEvidence(anchor.field,
          `"${turnCountFieldLabel}" is currently ${declared}, so only ${declared} field${declared === 1 ? '' : 's'} visible. Stale content remains in ${slotsList}.`
        );
      }
    }

    perModel[model.label] = { declared, turns };

    for (let i = 0; i < turns.length; i++) {
      for (let j = i + 1; j < turns.length; j++) {
        if (turns[i].value !== turns[j].value) continue;
        const a = turns[i], b = turns[j];
        const isLikelyCorrect = (t) => {
          if (!formPromptNorm) return false;
          if (t.turn === 1) return t.lastUserNorm === formPromptNorm;
          return t.lastUserNorm !== formPromptNorm;
        };
        const aOk = isLikelyCorrect(a);
        const bOk = isLikelyCorrect(b);
        let culprit, otherOk;
        if (aOk && !bOk) { culprit = b; otherOk = a; }
        else if (bOk && !aOk) { culprit = a; otherOk = b; }
        else { culprit = b; otherOk = a; }
        const culpritLabel = labelByKey[culprit.field] || culprit.field;
        const otherLabel = labelByKey[otherOk.field] || otherOk.field;
        addFinding(
          model.label, culprit.turn, culprit.field,
          `This turn's debug paste is an exact copy of Turn ${otherOk.turn}'s debug — the same text was pasted into both turns.`,
          `Go to the Gemini UI, copy Turn ${culprit.turn}'s actual debug info, and replace what's in "${culpritLabel}".`
        );
        addEvidence(culprit.field,
          `"${culpritLabel}" and "${otherLabel}" contain the exact same ${culprit.value.length.toLocaleString()}-char blob (hash ${shortHash(culprit.value)}).${fieldLinks[culprit.field] || fieldLinks[otherOk.field] ? ` Files: "${culpritLabel}" -> ${fieldLinks[culprit.field] || '(pasted)'} ; "${otherLabel}" -> ${fieldLinks[otherOk.field] || '(pasted)'}` : ''}`
        );
      }
    }

    if (formPromptNorm) {
      for (const t of turns) {
        if (!t.firstUser) continue;
        if (t.firstUserNorm !== formPromptNorm) {
          const fieldLabel = labelByKey[t.field] || t.field;
          const dp = previewDiff(formPromptRaw, t.firstUser, 80);
          addFinding(
            model.label, t.turn, t.field,
            `The "${promptFieldLabel}" field and Turn ${t.turn} debug are from different conversations.`,
            `Verify which one is correct: either re-enter the right prompt in "${promptFieldLabel}", or re-paste Turn ${t.turn}'s debug from the correct conversation into "${fieldLabel}".`
          );
          addEvidence(t.field,
            `"${promptFieldLabel}" field has: "${dp.a}". First user message in "${fieldLabel}" has: "${dp.b}".`
          );
        }
      }
    }

    const t1 = turns.find(t => t.turn === 1);
    if (t1 && t1.firstUser && t1.lastUser && t1.firstUserNorm !== t1.lastUserNorm) {
      const fieldLabel = labelByKey[t1.field] || t1.field;
      const dp = previewDiff(t1.firstUser, t1.lastUser, 80);
      addFinding(
        model.label, 1, t1.field,
        `Turn 1 debug appears to be from a higher turn (it contains multiple distinct user prompts).`,
        `Go to the Gemini UI, copy Turn 1's actual debug info, and replace what's in "${fieldLabel}".`
      );
      addEvidence(t1.field,
        `First user message: "${dp.a}". Last user message: "${dp.b}". A real Turn 1 debug has only one user prompt.`
      );
    }

    if (formPromptNorm) {
      for (const t of turns) {
        if (t.turn === 1 || !t.lastUser) continue;
        if (t.lastUserNorm === formPromptNorm) {
          const fieldLabel = labelByKey[t.field] || t.field;
          addFinding(
            model.label, t.turn, t.field,
            `Turn ${t.turn} debug ends with the same prompt as Turn 1 — Turn ${t.turn} must introduce a new follow-up question, not repeat the Turn 1 prompt.`,
            `Re-run Turn ${t.turn} in the Gemini UI with a new follow-up question that builds on prior context, capture its debug, and replace what's in "${fieldLabel}".`
          );
          addEvidence(t.field,
            `The last user message in this turn's debug is identical to the "${promptFieldLabel}" field value (the Turn 1 prompt). A multi-turn evaluation requires each subsequent turn to introduce a new prompt.`
          );
        }
      }
    }

    for (let i = 1; i < turns.length; i++) {
      const prev = turns[i - 1], curr = turns[i];
      if (!prev.lastUser || prev.users.length === 0 || curr.users.length === 0) continue;
      const prevLastStripped = stripSystemMarkers(prev.lastUser);
      const currValueStripped = stripSystemMarkers(curr.value);
      if (!currValueStripped.includes(prevLastStripped)) {
        const prevLabel = labelByKey[prev.field] || prev.field;
        const currLabel = labelByKey[curr.field] || curr.field;
        addFinding(
          model.label, curr.turn, curr.field,
          `Turn ${curr.turn} debug is from a different conversation than Turn ${prev.turn}.`,
          `Make sure all ${model.label} debug pastes are from the same conversation, then re-paste Turn ${curr.turn}'s debug into "${currLabel}".`
        );
        addEvidence(curr.field,
          `Turn ${prev.turn} ("${prevLabel}") ends with: "${preview(prev.lastUser)}". This text does not appear anywhere in Turn ${curr.turn}'s debug.`
        );
      }
    }

    const idsByTurn = turns
      .map((t) => ({ turn: t.turn, field: t.field, ids: t.modelIds }))
      .filter((x) => x.ids.length > 0);

    if (idsByTurn.length > 0) {
      for (const e of idsByTurn) {
        const uniq = [...new Set(e.ids)];
        if (uniq.length > 1) {
          const fieldLabel = labelByKey[e.field] || e.field;
          addFinding(
            model.label, e.turn, e.field,
            `This debug paste contains responses from more than one model mixed together — it should come from a single model.`,
            `Re-copy Turn ${e.turn}'s debug info from the Gemini UI for ${model.label} only — one turn from one model — and replace what's in "${fieldLabel}".`
          );
          addEvidence(e.field,
            `Found ${uniq.length} different Model ID values: ${uniq.join(', ')}. A valid capture has exactly one Model ID.`
          );
        }
      }
      const canonical = idsByTurn.map((e) => ({ turn: e.turn, field: e.field, id: e.ids[0] }));
      const distinct = [...new Set(canonical.map((c) => c.id))];
      if (distinct.length > 1) {
        const counts = {};
        canonical.forEach((c) => { counts[c.id] = (counts[c.id] || 0) + 1; });
        const majorityId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        const odd = canonical.filter((c) => c.id !== majorityId);
        for (const o of odd) {
          const fieldLabel = labelByKey[o.field] || o.field;
          addFinding(
            model.label, o.turn, o.field,
            `This turn's debug looks like it came from a different model than ${model.label}'s other turns.`,
            `Re-check that "${fieldLabel}" was copied from ${model.label}'s Turn ${o.turn} response, not from the other model.`
          );
          addEvidence(o.field,
            `This turn's debug shows Model ID "${o.id}", but the other ${model.label} turns show "${majorityId}".`
          );
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // v3.2.14 checks — full-share detection + sian_profile (unchanged in
  // v3.2.21; see header note 6 for the 898 stance).
  // ---------------------------------------------------------------------------
  const FULL_SHARE_MARKERS = [
    /num_turns_read_from_footprints/i,
    /personal\s*context:\s*[\r\n\s]*chapters\s*\{/i,
    /chapters\s*\{[\r\n\s]*name:/i,
    /name:\s*"?sian_profile"?/i,
  ];
  const looksFullShare = (blob) => typeof blob === 'string' && FULL_SHARE_MARKERS.some((re) => re.test(blob));

  // Check N1 — full debug required when dissatisfied.
  {
    const DISSAT = ['very dissatisfied', 'somewhat dissatisfied'];
    const likertOf = (k) => valueToString(byKey[k]).trim().toLowerCase();
    const sideLikerts = [
      { side: SIDE_A, pq: 'modelAOverallPersonalizationQuality', oq: 'modelAOverallQuality' },
      { side: SIDE_B, pq: 'modelBOverallPersonalizationQuality', oq: 'modelBOverallQuality' },
    ];
    for (const s of sideLikerts) {
      const pqDis = DISSAT.includes(likertOf(s.pq));
      const oqDis = DISSAT.includes(likertOf(s.oq));
      if (!pqDis && !oqDis) continue;
      const which = [pqDis ? 'Overall Personalization Quality' : null, oqDis ? 'Overall Quality' : null].filter(Boolean).join(' and ');
      const turns = perModel[s.side]?.turns || [];
      if (turns.length === 0) continue;
      const partialTurns = turns.filter((t) => !looksFullShare(t.value)).map((t) => t.turn);
      if (partialTurns.length > 0) {
        const list = partialTurns.length === 1 ? `Turn ${partialTurns[0]}` : `Turns ${partialTurns.join(', ')}`;
        const sideFields = (perModel[s.side]?.turns || []).filter((t) => partialTurns.includes(t.turn) && fieldLinks[t.field]).map((t) => `Turn ${t.turn} -> ${fieldLinks[t.field]}`).join(' ; ');
        warnings.push(
          `${s.side} | Problem: rated "${which}" as dissatisfied, but ${list} debug looks like a PARTIAL share (no footprints / Personal Context / sian_profile section). Dissatisfied ratings require the FULL debug info so the client can diagnose the failure. | Fix: re-copy the COMPLETE debug info for ${list} from the Gemini UI (include everything from the top, not just the section after "LM Prefix") and replace the paste${partialTurns.length === 1 ? '' : 's'}.${sideFields ? ` | File(s): ${sideFields}` : ''}`
        );
      } else {
        logs.push(`${s.side}: dissatisfied rating present and all ${turns.length} debug paste(s) look like full shares — full-debug requirement satisfied.`);
      }
    }
  }

  // Check N2 — sian_profile setup verification (Turn-1 full shares only).
  // 898 note: the client requires the sian_profile chapter to be visible in
  // BOTH Test and Base dropdowns (rater screening). Chapter absence on a
  // full share stays log-only (882 evidence: task debugs legitimately lack
  // the chapter once the setup chat is deleted) — revisit after the first
  // real 898 full share.
  {
    const SIAN_SOURCES = ['SEARCH', 'GMAIL', 'PHOTOS', 'BARD_NOT_PERSONALIZED_USING_FIRST_PARTY_DATA'];
    const targetLangRaw = valueToString(byKey.targetLanguage).toLowerCase();
    const isKorean = /korean|한국|(^|[^a-z])ko([^a-z]|$)/.test(targetLangRaw);
    for (const model of models) {
      const t1 = perModel[model.label]?.turns?.find((t) => t.turn === 1);
      if (!t1 || typeof t1.value !== 'string' || !t1.value.trim()) continue;
      const blob = t1.value;
      const sianChapterMatch = blob.match(/name:\s*"?sian_profile"?/i);
      if (!looksFullShare(blob)) {
        logs.push(`${model.label}: Turn 1 debug looks like a partial share — sian_profile setup check skipped.`);
        continue;
      }
      if (!sianChapterMatch) {
        logs.push(`${model.label}: Turn 1 full share has no sian_profile chapter — expected for task debugs (the setup-verification chat is deleted per instructions); sources check skipped. [898: report if the client asks for per-task sian verification.]`);
        continue;
      }
      const chapStart = sianChapterMatch.index;
      const nextChap = blob.slice(chapStart + 20).search(/chapters\s*\{/i);
      const chapEnd = nextChap >= 0 ? chapStart + 20 + nextChap : Math.min(blob.length, chapStart + 4000);
      const chapterRegion = blob.slice(chapStart, chapEnd);
      const required = SIAN_SOURCES.filter((src) => !(src === 'PHOTOS' && isKorean));
      const missing = required.filter((src) => !new RegExp(`\\b${src}\\b`, 'i').test(chapterRegion));
      if (missing.length > 0) {
        warnings.push(
          `${model.label} | Problem: Turn 1 sian_profile is missing expected source(s): ${missing.join(', ')}${isKorean ? ' (PHOTOS exempt — Korean task)' : ''}. | Fix: check the eval account's connected-sources setup (Search/Gmail/Photos) and re-capture Turn 1's debug info; if the setup is intentional for this task, ignore this warning.${linkSuffix(t1.field)}`
        );
      } else {
        logs.push(`${model.label}: sian_profile present with all required sources${isKorean ? ' (PHOTOS exempt — Korean task)' : ''}.`);
      }
    }
  }

  // E39 — multi-turn HTML coverage.
  for (const model of models) {
    const side = model.label;
    const ha = htmlAnalysis[side];
    if (!ha || !ha.visibleText) continue;
    const turns = perModel[side]?.turns || [];
    if (turns.length < 2) continue;
    const missing = [];
    for (const t of turns) {
      const q = t.lastUserNorm;
      if (!q || q.length < 12) continue;
      if (!ha.visibleText.includes(q)) missing.push(t.turn);
    }
    if (missing.length > 0) {
      const htmlField = side === SIDE_A ? 'modelAHtmlFileUpload' : 'modelBHtmlFileUpload';
      const turnList = missing.length === 1
        ? `Turn ${missing[0]}`
        : `Turns ${missing.slice(0, -1).join(', ')} and ${missing.at(-1)}`;
      pushFieldError(side, htmlField,
        `The uploaded HTML is missing ${turnList} — ${missing.length === 1 ? 'that turn’s question' : 'those turns’ questions'} from the debug do not appear in the conversation page.`,
        `upload the full multi-turn HTML export for ${side} that includes every evaluated turn, then resubmit.`,
        `${side} has ${turns.length} evaluated turns, but the question text for ${turnList} (taken from the pasted per-turn debug) was not found in the uploaded HTML's visible conversation — the debug and the HTML are not the same complete conversation.`);
    }
  }

  // v3.2.20: branch-side Turn-2 HTML coverage.
  if (attributionMode && branchSide) {
    const haBranch = htmlAnalysis[branchSide];
    const branchTurns = perModel[branchSide]?.turns || [];
    if (haBranch && haBranch.visibleText && branchSideT1Empty && branchTurns.length === 1) {
      const bq = branchTurns[0].lastUserNorm;
      if (bq && bq.length >= 12 && !haBranch.visibleText.includes(bq)) {
        warnings.push(
          `${branchSide} — uploaded HTML | Problem: the Turn ${branchTurns[0].turn} question from your pasted debug ("${preview(branchTurns[0].lastUser)}") was not found in ${branchSide}'s uploaded HTML. | Fix: for Attribution tasks, ${branchSide}'s HTML should be the saved BRANCHED chat (Turn 1 inherited from the first model + your Turn 2 question). Re-check that you saved and uploaded the branched chat's page for ${branchSide}, not another conversation.`
        );
      }
    }
  }

  // MT/ST shape check.
  // v3.2.21: MT-side shortfall demoted to WARNING for 898 — the client doc
  // explicitly allows finishing in one turn when the conversational goal is
  // achieved. ST remains a hard error (extra turns on a single-turn task are
  // never protocol-compliant).
  {
    const evalTypeRaw = inputByKey['Eval Type'];
    const evalType = typeof evalTypeRaw === 'string' ? evalTypeRaw.trim().toUpperCase() : null;

    if (evalType !== 'MT' && evalType !== 'ST') {
      logs.push(`MT/ST shape check skipped: Eval Type field missing or unexpected (saw ${JSON.stringify(evalTypeRaw)}).`);
    } else {
      const aTurns = perModel[SIDE_A]?.turns?.length ?? 0;
      const bTurns = perModel[SIDE_B]?.turns?.length ?? 0;
      logs.push(`MT/ST shape check: Eval Type=${evalType}, ${SIDE_A} filled=${aTurns}, ${SIDE_B} filled=${bTurns}.`);

      const branchBonus = (side, count) =>
        (attributionMode && branchSide === side && branchSideT1Empty && count >= 1) ? 1 : 0;
      const aEff = aTurns + branchBonus(SIDE_A, aTurns);
      const bEff = bTurns + branchBonus(SIDE_B, bTurns);
      if (aEff !== aTurns || bEff !== bTurns) {
        logs.push(`MT/ST shape check: Attribution branch adjustment applied (${SIDE_A} effective=${aEff}, ${SIDE_B} effective=${bEff}).`);
      }

      if (evalType === 'MT' && (aEff < 2 || bEff < 2)) {
        const sidesShort = [];
        if (aEff < 2 && aTurns > 0) sidesShort.push({ label: SIDE_A, count: aTurns });
        if (bEff < 2 && bTurns > 0) sidesShort.push({ label: SIDE_B, count: bTurns });
        for (const s of sidesShort) {
          warnings.push(
            `${s.label} | Problem: the task is marked Eval Type = MT (multi-turn) but ${s.label} has only ${s.count} filled debug slot${s.count === 1 ? '' : 's'}. | Note: per the 898 client guidelines, if you genuinely achieved your conversational goal in one turn you don't have to force a multi-turn interaction — in that case you may proceed. If the conversation was cut short for any other reason, run and paste the remaining turn(s) for ${s.label}.`
          );
        }
      }

      if (evalType === 'ST' && (aTurns !== 1 || bTurns !== 1)) {
        const sidesWrong = [];
        if (aTurns !== 1) sidesWrong.push({ label: SIDE_A, count: aTurns, field: 'testResponse1DebugInfo' });
        if (bTurns !== 1) sidesWrong.push({ label: SIDE_B, count: bTurns, field: 'model2Response1DebugInfo' });
        for (const s of sidesWrong) {
          addFinding(
            s.label, 1, s.field,
            `Task is marked Eval Type = ST (single-turn) but ${s.label} has ${s.count} filled debug slot${s.count === 1 ? '' : 's'}. A single-turn task should have exactly 1 turn on each side.`,
            s.count > 1
              ? `Either remove the extra turn debug info from ${s.label}'s higher-turn slots and reduce the turn count to 1, or change the task's Eval Type to MT if you intended a multi-turn evaluation.`
              : `Paste Turn 1 debug info for ${s.label}, or correct the task's Eval Type if it should be something other than ST.`
          );
          addEvidence(s.field,
            `Eval Type = "ST". ${s.label} has ${s.count} non-empty debug slot${s.count === 1 ? '' : 's'}; expected exactly 1.`
          );
        }
      }
    }
  }

  // Rater-instruction shape check (v3.2.15, WARNING).
  {
    const evalTypeRaw2 = inputByKey['Eval Type'];
    const evalTypePresent = typeof evalTypeRaw2 === 'string' &&
      ['MT', 'ST'].includes(evalTypeRaw2.trim().toUpperCase());
    const rawInstr = valueToString(inputByKey['ADDITIONAL RATER INSTRUCTION']).trim();
    const l2SubUseCase = valueToString(inputByKey['L2 SUB-USE CASE']).trim();
    if (/attribution/i.test(l2SubUseCase)) {
      logs.push(`L2 Sub-Use Case is "${l2SubUseCase}" — branched-conversation (Branch in new chat) flow expected on this task; within-side chat matching uses URL-set intersection (v3.2.16).`);
    }
    const isMulti = /multi[\s_-]*turn/i.test(rawInstr);
    const isSingle = /single[\s_-]*turn/i.test(rawInstr);
    if (evalTypePresent) {
      logs.push('Rater-instruction shape check skipped: Eval Type is present and takes precedence.');
    } else if (!rawInstr || (!isMulti && !isSingle)) {
      logs.push(`Rater-instruction shape check skipped: no turn-shape declaration found (saw "${rawInstr || '(empty)'}").`);
    } else {
      const aTurns2 = perModel[SIDE_A]?.turns?.length ?? 0;
      const bTurns2 = perModel[SIDE_B]?.turns?.length ?? 0;
      const shape = isMulti ? 'MT' : 'ST';
      logs.push(`Rater-instruction shape check: instruction="${rawInstr}" -> ${shape}, ${SIDE_A} filled=${aTurns2}, ${SIDE_B} filled=${bTurns2}.`);
      if (isMulti) {
        for (const s of [{ label: SIDE_A, count: aTurns2 }, { label: SIDE_B, count: bTurns2 }]) {
          if (s.count >= 2 || s.count === 0) continue;
          if (attributionMode && branchSide === s.label && branchSideT1Empty) {
            logs.push(`${s.label}: single filled debug slot accepted under the Attribution branch flow (Turn 1 intentionally empty) — multi-turn instruction warning skipped.`);
            continue;
          }
          warnings.push(
            `${s.label} | Problem: the task's rater instruction says "${rawInstr}" (multi-turn), but ${s.label} has only ${s.count} filled debug slot. | Note: per the client guidelines, if you genuinely achieved your conversational goal in one turn you don't have to force a multi-turn interaction — in that case you may proceed. If the conversation was cut short for any other reason, run and paste the remaining turn(s) for ${s.label}.`
          );
        }
      } else {
        for (const s of [{ label: SIDE_A, count: aTurns2 }, { label: SIDE_B, count: bTurns2 }]) {
          if (s.count <= 1) continue;
          warnings.push(
            `${s.label} | Problem: the task's rater instruction says "${rawInstr}" (single-turn), but ${s.label} has ${s.count} filled debug slots. A single-turn task should have exactly 1 turn per side. | Fix: remove the extra turn debug and set the turn count to 1, or confirm with your POC that a multi-turn submission is intended for this task.`
          );
        }
      }
    }
  }

  // Check 6 — Footprints delta (warning since v3.2.3)
  const firstModelRaw = typeof byKey.firstModel === 'string' ? byKey.firstModel.trim() : null;
  const firstModelLower = firstModelRaw ? firstModelRaw.toLowerCase() : null;

  const order = (firstModelLower === sideALower)
    ? { m1: { label: SIDE_A, field: 'testResponse1DebugInfo' },
        m2: { label: SIDE_B, field: 'model2Response1DebugInfo' } }
    : (firstModelLower === sideBLower)
    ? { m1: { label: SIDE_B, field: 'model2Response1DebugInfo' },
        m2: { label: SIDE_A, field: 'testResponse1DebugInfo' } }
    : null;

  if (!order) {
    logs.push(`Check 6 skipped: firstModel field is missing or unrecognized (saw "${firstModelRaw}").`);
  } else if (findingsByField.has(order.m1.field) || findingsByField.has(order.m2.field)) {
    logs.push(`Check 6 skipped: ${order.m1.label} or ${order.m2.label} Turn 1 debug already has an earlier finding.`);
  } else {
    const m1Footprints = extractFootprints(debugValue(order.m1.field));
    const m2Footprints = extractFootprints(debugValue(order.m2.field));
    if (m1Footprints === null || m2Footprints === null) {
      logs.push(`Check 6 skipped: footprints not found in ${order.m1.label} or ${order.m2.label} Turn 1 debug.`);
    } else {
      const delta = m2Footprints - m1Footprints;
      const m2FieldLabel = labelByKey[order.m2.field] || order.m2.field;
      const m1FieldLabel = labelByKey[order.m1.field] || order.m1.field;
      logs.push(`Check 6: delta=${delta >= 0 ? '+' : ''}${delta}.`);

      if (delta > 0) {
        warnings.push(
          `${order.m2.label} Turn 1 — "${m2FieldLabel}": it looks like the ${order.m1.label} chat may still have been open when you ran ${order.m2.label} — ${order.m2.label}'s debug shows more earlier chat history than ${order.m1.label}'s (${m2Footprints} vs ${m1Footprints}). Gemini doesn't always clear deleted chats reliably, so this isn't always a real problem. If you deleted the ${order.m1.label} chat before starting ${order.m2.label}, you can proceed. If you didn't, delete it and redo ${order.m2.label} — otherwise this comes back as rework.${fieldLinks[order.m1.field] || fieldLinks[order.m2.field] ? ` | File(s): ${order.m1.label} Turn 1 -> ${fieldLinks[order.m1.field] || '(pasted)'} ; ${order.m2.label} Turn 1 -> ${fieldLinks[order.m2.field] || '(pasted)'}` : ''}`
        );
      } else if (delta < 0) {
        warnings.push(
          `${order.m2.label} Turn 1 — "${m2FieldLabel}": ${order.m2.label}'s debug shows less earlier chat history than ${order.m1.label}'s (${m2Footprints} vs ${m1Footprints}). This usually means the First Model selection is reversed, or the two chats were captured from different accounts. Double-check which model you actually ran first.${fieldLinks[order.m1.field] || fieldLinks[order.m2.field] ? ` | File(s): ${order.m1.label} Turn 1 -> ${fieldLinks[order.m1.field] || '(pasted)'} ; ${order.m2.label} Turn 1 -> ${fieldLinks[order.m2.field] || '(pasted)'}` : ''}`
        );
      }
    }
  }

  // Second-model Turn 1 contamination check.
  if (order) {
    const secondT1 = perModel[order.m2.label]?.turns?.find(t => t.turn === 1);
    if (secondT1 && secondT1.users && secondT1.users.length > 1) {
      const distinctUsers = [...new Set(secondT1.normUsers.filter(Boolean))];
      if (distinctUsers.length > 1) {
        addFinding(
          order.m2.label, 1, secondT1.field,
          `${order.m2.label} Turn 1 debug still contains text from the ${order.m1.label} chat — it looks like the previous model's conversation wasn't cleared before running ${order.m2.label}.`,
          `Delete the prior ${order.m1.label} chat/history, rerun ${order.m2.label} from a clean Turn 1, and re-paste its debug info.`
        );
        addEvidence(secondT1.field,
          `The debug field contains ${secondT1.users.length} user-message blocks and ${distinctUsers.length} distinct user prompts. A clean Turn 1 debug should contain only the submitted Turn 1 prompt.`
        );
      } else {
        logs.push(`${order.m2.label} Turn 1 debug contains multiple user-message blocks, but they normalize to the same prompt. Residual first-model text is not provable from text comparison alone.`);
      }
    }
  }

  const canonicalId = (modelData) => {
    if (!modelData) return null;
    for (const t of modelData.turns) {
      if (t.modelIds && t.modelIds.length > 0) return t.modelIds[0];
    }
    return null;
  };
  const aCanonicalId = canonicalId(perModel[SIDE_A]);
  const bCanonicalId = canonicalId(perModel[SIDE_B]);
  let crossModelSameIdFired = false;
  if (aCanonicalId && bCanonicalId && aCanonicalId === bCanonicalId) {
    const aT1 = perModel[SIDE_A]?.turns.find(t => t.turn === 1);
    const bT1 = perModel[SIDE_B]?.turns.find(t => t.turn === 1);
    const anchor = aT1 || bT1;
    if (anchor) {
      addFinding(
        aT1 ? SIDE_A : SIDE_B, 1, anchor.field,
        `${SIDE_A} and ${SIDE_B} debug pastes report the same Model ID ("${aCanonicalId}"). One of the two slots holds debug from the other model.`,
        `Open the Gemini UI, identify which conversation belongs to which side, and re-paste the debug for whichever slot is wrong.`
      );
      addEvidence(anchor.field,
        `All ${SIDE_A} turn(s) report "${aCanonicalId}"; all ${SIDE_B} turn(s) also report "${bCanonicalId}". The two model variants being compared cannot produce the same Model ID.`
      );
      crossModelSameIdFired = true;
    }
  }

  // ---------------------------------------------------------------------------
  // Identity vs assignment.
  // v3.2.21: when the 898 exact Model-ID map is active, use it and SKIP the
  // v3.2.7/v3.2.14 fuzzy declared-identity heuristic entirely — traced
  // against the 898 names the fuzzy path false-fires (see header note 2).
  // ---------------------------------------------------------------------------
  if (!crossModelSameIdFired && project898MapActive) {
    const check898Side = (sideLabel, canonId, ownEntry, otherEntry, t1FieldDefault) => {
      if (!canonId) {
        logs.push(`${sideLabel}: no Model ID found in the debug — 898 exact identity check skipped for this side.`);
        return;
      }
      const idLower = String(canonId).toLowerCase();
      const t1Field = perModel[sideLabel]?.turns.find(t => t.turn === 1)?.field || t1FieldDefault;
      if (ownEntry.modelIds.includes(idLower)) {
        logs.push(`${sideLabel}: Model ID "${canonId}" matches an expected id for "${ownEntry.geminiName}".`);
        return;
      }
      if (otherEntry.modelIds.includes(idLower)) {
        addFinding(sideLabel, 1, t1Field,
          `${sideLabel}'s debug is from the wrong model — its Model ID is the one assigned to the other side.`,
          `Open the Gemini UI, identify which conversation belongs to ${sideLabel} (Gemini dropdown "${ownEntry.geminiName}"), and re-paste its debug into "${labelByKey[t1Field] || t1Field}".`);
        addEvidence(t1Field,
          `${sideLabel}'s debug reports Model ID "${canonId}" — the expected id for the OTHER side ("${otherEntry.geminiName}"). ${sideLabel} should report ${ownEntry.modelIds.map(x => `"${x}"`).join(" or ")} ("${ownEntry.geminiName}").`);
        return;
      }
      warnings.push(
        `${sideLabel} | Problem: debug Model ID "${canonId}" matches neither expected id for this eval (${ownEntry.modelIds.join("/")} for ${sideLabel}, ${otherEntry.modelIds.join("/")} for the other side). | Fix: confirm the correct Gemini dropdown ("${ownEntry.geminiName}") was used for ${sideLabel}. If the paste is correct, the batch may have shipped a new model variant — report the id to your POC so the expected-id map can be updated.${linkSuffix(t1Field)}`
      );
    };
    check898Side(SIDE_A, aCanonicalId, entry898A, entry898B, 'testResponse1DebugInfo');
    check898Side(SIDE_B, bCanonicalId, entry898B, entry898A, 'model2Response1DebugInfo');
    logs.push('Declared-identity fuzzy check skipped: v3.2.23 898 exact Model-ID map active.');
  } else if (!crossModelSameIdFired) {
    // Generic fuzzy path (v3.2.7 / v3.2.14) — only when the 898 map did not
    // resolve (e.g., script reused on another batch).
    const declaredARaw = inputByKey['TEST MODEL'];
    const declaredBRaw = inputByKey['BASE MODEL'];
    const declaredACore = extractDeclaredCandidates(declaredARaw);
    const declaredBCore = extractDeclaredCandidates(declaredBRaw);
    if (!declaredACore || !declaredBCore) {
      logs.push(`Declared-identity check skipped: ${SIDE_A} or ${SIDE_B} declaration missing or unreadable.`);
    } else {
      const aIdCore = extractIdCore(aCanonicalId);
      const bIdCore = extractIdCore(bCanonicalId);

      const xpAA = matchesDeclared(aIdCore, declaredACore) === true;
      const xpAB = matchesDeclared(aIdCore, declaredBCore) === true;
      const xpBA = matchesDeclared(bIdCore, declaredACore) === true;
      const xpBB = matchesDeclared(bIdCore, declaredBCore) === true;
      const realNameStyleConfirmed = xpAA || xpAB || xpBA || xpBB;

      logs.push(`Declared-identity (v3.2.7/v3.2.14): declared ${SIDE_A} candidates="${declaredACore.join(' | ')}", declared ${SIDE_B} candidates="${declaredBCore.join(' | ')}", actual ${SIDE_A} ID core="${aIdCore}", actual ${SIDE_B} ID core="${bIdCore}", cross-products [AA=${xpAA}, AB=${xpAB}, BA=${xpBA}, BB=${xpBB}] -> ${realNameStyleConfirmed ? 'STRICT' : 'FALLBACK'} mode.`);

      if (aIdCore) {
        const matchesADecl = matchesDeclared(aIdCore, declaredACore) === true;
        const matchesBDecl = matchesDeclared(aIdCore, declaredBCore) === true;
        let shouldFire = false;
        if (realNameStyleConfirmed) shouldFire = !matchesADecl; else shouldFire = matchesBDecl && !matchesADecl;
        if (shouldFire) {
          const aT1 = perModel[SIDE_A]?.turns.find(t => t.turn === 1);
          const anchorField = aT1?.field || 'testResponse1DebugInfo';
          let headline, evidence;
          if (matchesBDecl) {
            headline = `${SIDE_A}'s debug is from the wrong model — it matches ${SIDE_B}, the model assigned to the other side.`;
            evidence = `The debug you pasted for ${SIDE_A} is from model "${aCanonicalId}". ${SIDE_A} is assigned "${declaredARaw}" and ${SIDE_B} is assigned "${declaredBRaw}" — so this debug is actually ${SIDE_B}'s model.`;
          } else {
            headline = `${SIDE_A}'s debug doesn't match ${SIDE_A} — it's from a different model than either side was assigned.`;
            evidence = `The debug you pasted for ${SIDE_A} is from model "${aCanonicalId}", but ${SIDE_A} is assigned "${declaredARaw}" and ${SIDE_B} "${declaredBRaw}" — it matches neither side.`;
          }
          addFinding(SIDE_A, 1, anchorField, headline, `Open the Gemini UI, identify which conversation belongs to ${SIDE_A} (assigned "${declaredARaw}"), and re-paste its debug into "${labelByKey[anchorField] || anchorField}".`);
          addEvidence(anchorField, evidence);
        }
      }

      if (bIdCore) {
        const matchesBDecl = matchesDeclared(bIdCore, declaredBCore) === true;
        const matchesADecl = matchesDeclared(bIdCore, declaredACore) === true;
        let shouldFire = false;
        if (realNameStyleConfirmed) shouldFire = !matchesBDecl; else shouldFire = matchesADecl && !matchesBDecl;
        if (shouldFire) {
          const bT1 = perModel[SIDE_B]?.turns.find(t => t.turn === 1);
          const anchorField = bT1?.field || 'model2Response1DebugInfo';
          let headline, evidence;
          if (matchesADecl) {
            headline = `${SIDE_B}'s debug is from the wrong model — it matches ${SIDE_A}, the model assigned to the other side.`;
            evidence = `The debug you pasted for ${SIDE_B} is from model "${bCanonicalId}". ${SIDE_A} is assigned "${declaredARaw}" and ${SIDE_B} is assigned "${declaredBRaw}" — so this debug is actually ${SIDE_A}'s model.`;
          } else {
            headline = `${SIDE_B}'s debug doesn't match ${SIDE_B} — it's from a different model than either side was assigned.`;
            evidence = `The debug you pasted for ${SIDE_B} is from model "${bCanonicalId}", but ${SIDE_B} is assigned "${declaredBRaw}" and ${SIDE_A} "${declaredARaw}" — it matches neither side.`;
          }
          addFinding(SIDE_B, 1, anchorField, headline, `Open the Gemini UI, identify which conversation belongs to ${SIDE_B} (assigned "${declaredBRaw}"), and re-paste its debug into "${labelByKey[anchorField] || anchorField}".`);
          addEvidence(anchorField, evidence);
        }
      }
    }
  } else {
    logs.push(`Declared-identity check skipped: cross-model same-ID check already fired.`);
  }

  // Output assembly
  const fieldsOrdered = [...findingsByField.keys()].sort((a, b) => {
    const fa = findingsByField.get(a);
    const fb = findingsByField.get(b);
    if (fa.modelLabel !== fb.modelLabel) return fa.modelLabel < fb.modelLabel ? -1 : 1;
    return fa.turn - fb.turn;
  });

  for (const key of fieldsOrdered) {
    const f = findingsByField.get(key);
    const headline = f.headlines.length === 1 ? f.headlines[0] : f.headlines.join(' Also: ');
    const actionList = [...f.actions];
    const keptActions = [];
    const seen = new Set();
    for (const a of actionList) {
      const sig = a.slice(0, 40).toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(sig)) continue;
      seen.add(sig);
      keptActions.push(a);
    }
    const action = keptActions.join(' ');
    const evidence = f.evidence.length > 0 ? f.evidence.join(' ') : '';
    let msg = `${f.modelLabel} Turn ${f.turn} — "${f.fieldLabel}" | Problem: ${headline} | Fix: ${action}`;
    if (evidence) msg += ` | Why: ${evidence}`;
    msg += linkSuffix(key); // v3.2.32
    errors.push(msg);
  }

  for (const [mLabel, data] of Object.entries(perModel)) {
    const turns = data.turns;
    if (turns.length === 0) continue;
    const hasFinding = [...findingsByField.values()].some((f) => f.modelLabel === mLabel);
    if (!hasFinding) {
      successes.push(
        turns.length === 1
          ? `${mLabel}: the single debug info turn checks out.`
          : `${mLabel}: all ${turns.length} debug info turns check out.`
      );
    }
  }

  logs.push('Debug info validation complete (v3.2.32-maps-i18n).');
}

// ===========================================================================
// Ratings-array export adapter (v3.2.12)
// ===========================================================================
function adaptIfRatingsArraySchema(conv) {
  const cdEnvelope = conv?.conversation_data
                || conv?.task_data?.conversation_data
                || conv?.raw_data?.conversation_data;
  const csv = conv?.csv_data
          || conv?.task_data?.csv_data
          || conv?.raw_data?.csv_data;
  if (!cdEnvelope || !Array.isArray(cdEnvelope.ratings) || !csv || typeof csv !== 'object') {
    return conv;
  }
  const flat = {};
  for (const r of cdEnvelope.ratings) {
    if (r && typeof r.key === 'string') {
      flat[r.key] = r.human_input_value;
    }
  }
  return { ...conv, conversation_data: flat, csv_data: csv, _sourceRatingsArray: cdEnvelope.ratings };
}

// ===========================================================================
// New-project schema adapter (v3.2.9; _sideLabels in v3.2.10)
// ===========================================================================
function adaptIfNewSchema(conv) {
  const cd = conv?.conversation_data
         || conv?.task_data?.conversation_data
         || conv?.raw_data?.conversation_data;
  const csv = conv?.csv_data
          || conv?.task_data?.csv_data
          || conv?.raw_data?.csv_data;
  if (!cd || !csv || typeof cd !== 'object' || typeof csv !== 'object') {
    return conv;
  }

  const namespaces = new Set();
  for (const k of Object.keys(cd)) {
    if (k.startsWith('compareModels.')) {
      const remainder = k.slice('compareModels.'.length);
      const dotIdx = remainder.indexOf('.');
      const ns = dotIdx === -1 ? remainder : remainder.slice(0, dotIdx);
      if (ns) namespaces.add(ns);
    }
  }

  const canon = (s) => (typeof s === 'string' ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

  const modelADecl = typeof csv['Model A'] === 'string' ? csv['Model A'] : '';
  const modelBDecl = typeof csv['Model B'] === 'string' ? csv['Model B'] : '';
  const modelACanon = canon(modelADecl);
  const modelBCanon = canon(modelBDecl);

  let nsA = null, nsB = null;
  for (const ns of namespaces) {
    const nsC = canon(ns);
    if (!nsA && modelACanon && (nsC === modelACanon || nsC.includes(modelACanon) || modelACanon.includes(nsC))) {
      nsA = ns;
    } else if (!nsB && modelBCanon && (nsC === modelBCanon || nsC.includes(modelBCanon) || modelBCanon.includes(nsC))) {
      nsB = ns;
    }
  }
  // Known-project pairs: the compareModels config fixes the A/B mapping for
  // the batch; without csv declarations the alphabetical fallback below could
  // swap the sides.
  if (!nsA || !nsB) {
    const KNOWN_PAIRS = [
      { a: '49 - Poe > Papaya - Fast', b: '07 - Pizzi Gemelli > Fast (paid)' },
      { a: 'Model 06 -> Maple', b: 'Model 06 -> Cedar' }, // v3.2.15: 882 (En-US)
      { a: 'Mode 27 Bosko → fast_maps_eval', b: 'Snowball 03 -> Paid Fast Prod' }, // v3.2.22: 898 post-rename (2026-08-06); Bosko stores a UNICODE arrow
      { a: 'P13n x ToolSelector (PContext mode 21) -> Spider', b: 'P13n x ToolSelector -> GOAT' }, // shared: 886 (P13N E2E En-US) live pair AND stale pre-rename 898 exports — 898's original config was cloned from 886, then renamed 2026-08-06
    ];
    for (const kp of KNOWN_PAIRS) {
      const hitA = [...namespaces].find(n => canon(n) === canon(kp.a));
      const hitB = [...namespaces].find(n => canon(n) === canon(kp.b));
      if (hitA && hitB) { nsA = nsA || hitA; nsB = nsB || hitB; break; }
    }
  }
  if ((!nsA || !nsB) && namespaces.size >= 2) {
    const sorted = [...namespaces].sort();
    nsA = nsA || sorted.find(n => n !== nsB) || sorted[0];
    nsB = nsB || sorted.find(n => n !== nsA) || sorted[1];
  }
  const firstModelDecl = (typeof cd.firstModel === 'string' && cd.firstModel)
    || (typeof csv['First Model'] === 'string' && csv['First Model'])
    || '';
  const firstModelC = canon(firstModelDecl);
  let firstModelResolved = '';
  if (firstModelC) {
    if (modelACanon && (firstModelC === modelACanon || firstModelC.includes(modelACanon) || modelACanon.includes(firstModelC))) {
      firstModelResolved = 'Model A';
    } else if (modelBCanon && (firstModelC === modelBCanon || firstModelC.includes(modelBCanon) || modelBCanon.includes(firstModelC))) {
      firstModelResolved = 'Model B';
    }
  }
  if (!firstModelResolved && firstModelC) {
    const nsAC = canon(nsA || ''), nsBC = canon(nsB || '');
    if (nsAC && (firstModelC === nsAC || firstModelC.includes(nsAC) || nsAC.includes(firstModelC))) {
      firstModelResolved = 'Model A';
    } else if (nsBC && (firstModelC === nsBC || firstModelC.includes(nsBC) || nsBC.includes(firstModelC))) {
      firstModelResolved = 'Model B';
    }
  }

  const getNs = (ns, key) => {
    if (!ns) return '';
    const v = cd[`compareModels.${ns}.${key}`];
    return v == null ? '' : v;
  };

  const ratings = [
    { key: 'prompt', human_input_value: cd.prompt ?? '', question: 'Prompt' },
    { key: 'firstModel', human_input_value: firstModelResolved, question: 'First Model' },
    { key: 'firstModelRaw', human_input_value: cd.firstModel ?? '', question: 'Selected First Model' },

    { key: 'modelAHtmlFileUpload',     human_input_value: getNs(nsA, 'model1HtmlFileUpload'),     question: 'Model A - Model HTML' },
    { key: 'modelBHtmlFileUpload',     human_input_value: getNs(nsB, 'model1HtmlFileUpload'),     question: 'Model B - Model HTML' },
    { key: 'numberOfTurns',            human_input_value: getNs(nsA, 'numberOfTurns'),            question: 'Model A - Number of Turns' },
    { key: 'model2NumberOfTurns',      human_input_value: getNs(nsB, 'numberOfTurns'),            question: 'Model B - Number of Turns' },

    { key: 'testResponse1DebugInfo',   human_input_value: getNs(nsA, 'testResponse1DebugInfo'),     question: 'Model A - Model Response 1 Debug Info' },
    { key: 'testResponse2DebugInfo',   human_input_value: getNs(nsA, 'testResponse2DebugInfo'),     question: 'Model A - Model Response 2 Debug Info' },
    { key: 'model1TestResponse3DebugInfo', human_input_value: getNs(nsA, 'model1TestResponse3DebugInfo'), question: 'Model A - Model Response 3 Debug Info' },
    { key: 'model1TestResponse4DebugInfo', human_input_value: getNs(nsA, 'model1TestResponse4DebugInfo'), question: 'Model A - Model Response 4 Debug Info' },
    { key: 'model1TestResponse5DebugInfo', human_input_value: getNs(nsA, 'model1TestResponse5DebugInfo'), question: 'Model A - Model Response 5 Debug Info' },

    { key: 'model2Response1DebugInfo',    human_input_value: getNs(nsB, 'testResponse1DebugInfo'),    question: 'Model B - Model Response 1 Debug Info' },
    { key: 'model2Response2DebugInfo',    human_input_value: getNs(nsB, 'testResponse2DebugInfo'),    question: 'Model B - Model Response 2 Debug Info' },
    { key: 'model2Response3DebugInfo',    human_input_value: getNs(nsB, 'model1TestResponse3DebugInfo'), question: 'Model B - Model Response 3 Debug Info' },
    { key: 'model2Response4DebugInfo',    human_input_value: getNs(nsB, 'model1TestResponse4DebugInfo'), question: 'Model B - Model Response 4 Debug Info' },
    { key: 'model2Response5DebugInfo',    human_input_value: getNs(nsB, 'model1TestResponse5DebugInfo'), question: 'Model B - Model Response 5 Debug Info' },

    { key: 'modelAOverallPersonalizationQuality', human_input_value: getNs(nsA, 'testModelOverallPersonalizationQuality'), question: 'Model A - Overall Personalization Quality' },
    { key: 'modelBOverallPersonalizationQuality', human_input_value: getNs(nsB, 'testModelOverallPersonalizationQuality'), question: 'Model B - Overall Personalization Quality' },
    { key: 'modelAOverallQuality',        human_input_value: getNs(nsA, 'testModelOverallQuality'),         question: 'Model A - Overall Quality' },
    { key: 'modelBOverallQuality',        human_input_value: getNs(nsB, 'testModelOverallQuality'),         question: 'Model B - Overall Quality' },
    { key: 'targetLanguage',              human_input_value: cd.targetLanguage ?? '',                       question: 'Target Language' },
    { key: 'dialect',                     human_input_value: cd.dialect ?? '',                              question: 'Dialect' }, // v3.2.21: new 898 field (QD6)

    { key: 'modelAOverallQualityRationale', human_input_value: getNs(nsA, 'testModelOverallQualityRationale'), question: 'Model A - Overall Quality Rationale' },
    { key: 'modelBOverallQualityRationale', human_input_value: getNs(nsB, 'testModelOverallQualityRationale'), question: 'Model B - Overall Quality Rationale' },
    { key: 'qualityComparisonSxS',      human_input_value: cd.qualityComparisonSxS ?? '', question: 'Quality Comparison SxS' },
    { key: 'qualityComparisonSxSRationale', human_input_value: cd.qualityComparisonSxSRationale ?? '', question: 'Quality Comparison SxS Rationale' },
  ];

  const input = [
    { 'Eval Type': csv['Eval Type'] },
    { 'TEST MODEL': csv['Model A'] || nsA },
    { 'BASE MODEL': csv['Model B'] || nsB },
    { 'FIRST MODEL ASSIGNED': csv['First Model'] },
    { 'MODEL A HTML NAME': csv['Model A HTML NAME'] },
    { 'MODEL B HTML NAME': csv['Model B HTML Name'] },
    { 'MODEL A NAMESPACE': nsA },
    { 'MODEL B NAMESPACE': nsB },
    { 'ALL COMPARE MODEL NAMESPACES': [...namespaces].join(' | ') },
    { 'DRIVE LINK (Save HTML Here)': csv['DRIVE LINK (Save HTML Here)'] },
    { 'PROMPT EXAMPLES': csv['Prompt Examples'] || csv['Prompt Example'] },
    { 'ADDITIONAL RATER INSTRUCTION': csv['Additional Rater Instruction'] },
    { 'TARGET LANGUAGE': csv['Target Language'] },
    { 'PROMPT TYPE': csv['Prompt Type'] },
    { 'L2 SUB-USE CASE': csv['L2: Sub-Use Case'] },
  ];

  return { ratings, input, _sideLabels: ['Model A', 'Model B'] };
}

// ===========================================================================
// Runner-schema adapter (v3.2.11)
// ===========================================================================
function adaptIfRunnerSchema(conv) {
  const fd = conv?.formData
         || conv?.task_data?.formData
         || conv?.raw_data?.formData;
  if (!fd || typeof fd !== 'object') return conv;
  const ratings = fd.ratings;
  const input = fd.input;
  if (!ratings || typeof ratings !== 'object' || Array.isArray(ratings)) return conv;
  if (!input || typeof input !== 'object' || Array.isArray(input)) return conv;
  const sampleKey = Object.keys(ratings).find(k => ratings[k] && typeof ratings[k] === 'object');
  if (sampleKey) {
    const sample = ratings[sampleKey];
    if (!('value' in sample) && !('config' in sample)) return conv;
  }

  const conversation_data = {};
  for (const [k, v] of Object.entries(ratings)) {
    if (v && typeof v === 'object' && 'value' in v) conversation_data[k] = v.value;
    else conversation_data[k] = v;
  }

  const csv_data = {};
  for (const [k, v] of Object.entries(input)) {
    if (v && typeof v === 'object' && 'value' in v) csv_data[k] = v.value;
    else csv_data[k] = v;
  }

  return { conversation_data, csv_data };
}
