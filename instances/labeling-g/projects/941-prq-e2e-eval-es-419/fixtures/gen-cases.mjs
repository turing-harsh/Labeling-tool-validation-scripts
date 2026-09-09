// Generate fixtures/cases.json for projects 941/942 from a valid base task, mutating ONE thing
// per case: a smoke pass per family, an adversarial fire per check, and the near-miss that must
// NOT fire. Requirements section 7.
//
// The fetch-layer cases resolve through fixtures/artifacts/<driveFileId>.<txt|html> mocks, the
// same fetchDir convention scripts/run-tests.mjs and scripts/run-golden.mjs use.
//
// Regenerate with:  node fixtures/gen-cases.mjs fixtures/cases.json
import { writeFileSync } from "node:fs";

// Model names EXACTLY as config/project-config-id-941.json declares them. The Test name uses a
// bare ">" separator and an EN DASH before "Fast" -- both are load-bearing (see the F3-09
// regression case at the bottom of this file), so do not "tidy" them to ASCII.
const MA = "PContext Mode 23 (Nippon) > Mochi \u2013 Fast";   // Test  (model_A)
const MB = "Mode 23 -> Prod Frozen - Fast";                   // Base  (model_B)
const link = (id) => `https://drive.google.com/file/d/${id}/view?usp=sharing`;
const v = (x) => ({ value: x });

// Locale is a parameter: 941 and 942 share this generator and every check but F7-01 is
// locale-independent.  node fixtures/gen-cases.mjs <out> [es|zh]
const LOCALE = (process.argv[3] || "es") === "zh"
  ? { language: "Chinese", dialect: "Mainland (Simplified)" }
  : { language: "Spanish", dialect: "LatAm (All Variants)" };

const PROMPT = "What should I pack for my trip to Lisbon next week?";
const Q2 = "Can you add a packing list for the rainy days?";

// ---------------------------------------------------------------- valid base
// Two turns per side, CUMULATIVE debug exports (the shape task 1264388 proved on 944), Drive
// file links everywhere, every gate consistent, Q1 personalized, no i18n issues.
function base() {
  const task = {
    setupCheck: true,
    targetLanguage: LOCALE.language,
    dialect: LOCALE.dialect,
    prompt: PROMPT,
    conversationalGoal: "A packing list tailored to the Lisbon weather next week.",
    personalizationExpectation: "A lot — A generic answer would miss important things about my situation.",
    firstModel: MA,
    qualityComparisonSxS: "Conversation A was better",
    qualityComparisonSxSRationale: "A used my saved trip dates; B asked me to repeat them.",
    privacyGate: true,
  };
  const side = (ns, dbg1, dbg2, html) => ({
    [`compareModels.${ns}.numberOfTurns`]: "2",
    [`compareModels.${ns}.testResponse1DebugInfo`]: link(dbg1),
    [`compareModels.${ns}.testResponse2DebugInfo`]: link(dbg2),
    [`compareModels.${ns}.model1HtmlFileUpload`]: link(html),
    [`compareModels.${ns}.model1PersonalizationTriggering`]: ["Personalized (Personal Data)"],
    [`compareModels.${ns}.modelMakesUseOfAvailableUserData1MissedContext`]: "No issues",
    [`compareModels.${ns}.modelMakesUseOfAvailableUserData1Clarification`]: "No issues",
    [`compareModels.${ns}.modelMakesUseOfAvailableUserData1OverPersonalization`]: "No issues",
    [`compareModels.${ns}.modelMakesUseOfAvailableUserData1PersonalDataErrors`]: "No issues",
    [`compareModels.${ns}.modelFeelsLikeItGetsMe1SpeaksMyLanguage`]: "No issues",
    [`compareModels.${ns}.modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture`]: "No issues",
    [`compareModels.${ns}.modelConnectsTheDotsForMe1TransparencyAttribution`]: "No issues",
    [`compareModels.${ns}.modelConnectsTheDotsForMe1OverTransparency`]: "No issues",
    [`compareModels.${ns}.modelIsTrustworthySafe1TrustSafety`]: "No issues",
    [`compareModels.${ns}.modelRespectsMyCorrections1Corrections`]: "No issues",
    [`compareModels.${ns}.testModelOverallPersonalizationQuality`]: "Very satisfied",
    [`compareModels.${ns}.testModelOverallQuality`]: "Very satisfied",
    [`compareModels.${ns}.testModelOverallQualityRationale`]: "[Turn 1] the packing list matched my dates. [Turn 2] the rain section was useful.",
    [`compareModels.${ns}.modelLanguageAdherence`]: "No Issues",
    [`compareModels.${ns}.grammaticalGenderAgreement`]: "No Issues",
    [`compareModels.${ns}.grammaticalFormalityAndPoliteness`]: "No Issues",
    [`compareModels.${ns}.preservingTargetLanguageMeaning`]: "No Issues",
    [`compareModels.${ns}.secondModelLock`]: true,
  });
  return { ...task, ...side(MA, "DBG_T1", "DBG_T2", "HTML_T"), ...side(MB, "DBG_B1", "DBG_B2", "HTML_B") };
}

const K = {
  turns: (ns) => `compareModels.${ns}.numberOfTurns`,
  dbg: (ns, t) => `compareModels.${ns}.${["testResponse1DebugInfo", "testResponse2DebugInfo", "model1TestResponse3DebugInfo", "model1TestResponse4DebugInfo", "model1TestResponse5DebugInfo"][t - 1]}`,
  html: (ns) => `compareModels.${ns}.model1HtmlFileUpload`,
  q1: (ns) => `compareModels.${ns}.model1PersonalizationTriggering`,
  head: (ns, k) => `compareModels.${ns}.${k}`,
  r7c: (ns) => `compareModels.${ns}.testModelOverallQualityRationale`,
  sat7a: (ns) => `compareModels.${ns}.testModelOverallPersonalizationQuality`,
  lock: (ns) => `compareModels.${ns}.secondModelLock`,
};

// mutate: apply {key: value} patches; a value of undefined DELETES the key (an unanswered
// field is missing, not empty -- Fact 12).
function withPatch(patch, meta) {
  const flat = { ...base() };
  for (const [k, val] of Object.entries(patch)) {
    if (val === undefined) delete flat[k];
    else flat[k] = val;
  }
  const ratings = {};
  for (const [k, val] of Object.entries(flat)) ratings[k] = v(val);
  const cd = { conversation: { ratings } };
  if (meta) cd.conversation.input = meta;
  return cd;
}

const cases = [];
const add = (name, patch, expect, meta) => cases.push({ name, conversationData: withPatch(patch, meta), expect });

// ================================================================ SMOKE
add("SMOKE clean two-turn task: zero errors AND zero warnings", {}, { pass: true, warnings: [] });

// ================================================================ F1 completeness
add("F1-01 task prompt missing", { prompt: undefined }, { pass: false, errorsContain: ['"Prompt"'] });
add("F1-02 privacy gate unchecked", { privacyGate: false }, { pass: false, errorsContain: ['"Privacy Gate"'] });
add("F1-02 per-side critical-requirement unchecked", { [K.lock(MB)]: false }, { pass: false, errorsContain: ['"Critical Requirement"'] });
add("F1-03 a severity head unanswered (no Q1 gate on 941/942)", { [K.head(MA, "modelIsTrustworthySafe1TrustSafety")]: undefined }, { pass: false, errorsContain: ["Trust & Safety"] });
add("F1-04 turn count out of range", { [K.turns(MA)]: "7" }, { pass: false, errorsContain: ["not a value this form offers"] });
add("F1-05 declares 2 turns, turn 2 debug empty", { [K.dbg(MA, 2)]: undefined }, { pass: false, errorsContain: ["is missing"] });
add("F1-06 SxS rationale empty", { qualityComparisonSxSRationale: undefined }, { pass: false, errorsContain: ["side-by-side rationale is empty"] });
add("F1-07 rationale empty on one side", { [K.r7c(MB)]: undefined }, { pass: false, errorsContain: ["rationale for this model is empty"] });

// ---- Fact 13 near-miss: "Not Personalized" plus N/A on the heads that offer it is the
// INSTRUCTED compliant pattern. No check may treat it as a defect.
add("NEAR-MISS Not Personalized with N/A on every head that offers it: no finding", {
  [K.q1(MA)]: ["Not Personalized"],
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContext")]: "N/A - No personalization needed",
  [K.head(MA, "modelMakesUseOfAvailableUserData1Clarification")]: "N/A",
  [K.head(MA, "modelMakesUseOfAvailableUserData1OverPersonalization")]: "N/A",
  [K.head(MA, "modelMakesUseOfAvailableUserData1PersonalDataErrors")]: "N/A",
  [K.head(MA, "modelFeelsLikeItGetsMe1SpeaksMyLanguage")]: "N/A",
  [K.head(MA, "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture")]: "N/A",
  [K.head(MA, "modelConnectsTheDotsForMe1TransparencyAttribution")]: "N/A",
  [K.head(MA, "modelConnectsTheDotsForMe1OverTransparency")]: "N/A",
  [K.head(MA, "modelIsTrustworthySafe1TrustSafety")]: "N/A",
  [K.head(MA, "modelRespectsMyCorrections1Corrections")]: "N/A",
}, { pass: true, warnings: [] });

// ================================================================ F2 gate cascades
add("F2-01 Minor issues with the Category child empty", {
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContext")]: "Minor issues",
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContextTurns")]: ["1"],
}, { pass: false, errorsContain: ["Missed Context Category"] });
add("F2-02 Minor issues with the Turns child empty", {
  [K.head(MA, "modelIsTrustworthySafe1TrustSafety")]: "Major issues",
  [K.head(MA, "modelIsTrustworthySafe1TrustSafetyCategory")]: ["Offensive / intrusive"],
}, { pass: false, errorsContain: ["Trust & Safety - Turns"] });
add("F2-03 Minor issues with the Detraction child empty", {
  [K.head(MA, "modelConnectsTheDotsForMe1OverTransparency")]: "Minor issues",
  [K.head(MA, "modelConnectsTheDotsForMe1OverTransparencyCategory")]: ["Overnarrating"],
  [K.head(MA, "modelConnectsTheDotsForMe1OverTransparencyTurns")]: ["2"],
}, { pass: false, errorsContain: ["Over-Transparency - Detraction"] });
add("F2-04 stale hidden category after the parent flipped to No issues", {
  [K.head(MA, "modelIsTrustworthySafe1TrustSafetyCategory")]: ["Offensive / intrusive"],
}, { pass: false, errorsContain: ["hidden and will still be submitted"] });
add("NEAR-MISS legal N/A alone on a Turns child under Minor issues: no warning", {
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContext")]: "Minor issues",
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContextCategory")]: ["Missed life context"],
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContextTurns")]: ["N/A"],
}, { pass: true, warnings: [] });
add("F2-05 debug filled past the declared turn count (stale hidden slot)", {
  [K.turns(MA)]: "1", [K.dbg(MA, 2)]: link("DBG_T2"),
}, { pass: false, errorsContain: ["past the 1 turn"] });
add("F2-06 i18n head at Minor Issue(s) with the explanation empty", {
  [K.head(MA, "modelLanguageAdherence")]: "Minor Issue(s)",
}, { pass: false, errorsContain: ["Language Adherence Explanation"] });
add("F2-06 reverse: i18n explanation filled while the head reports No Issues", {
  [K.head(MA, "grammaticalGenderAgreementIssueExplanation")]: "gender agreement slipped in turn 2",
}, { pass: false, errorsContain: ["hidden and will still be submitted"] });
add("NEAR-MISS i18n 'Not relevant' head with the explanation empty: no finding", {
  [K.head(MA, "grammaticalGenderAgreement")]: "Not relevant — The language(s) do not have grammatical first person gender agreement.",
}, { pass: true, warnings: [] });

// ================================================================ F3 artifact integrity
add("F3-01 batch destination folder link pasted unchanged", {
  [K.dbg(MA, 1)]: "https://drive.google.com/drive/folders/BATCHFOLDER1",
}, { pass: false, errorsContain: ["pasted unchanged"] }, { "Destination Folder": "https://drive.google.com/drive/folders/BATCHFOLDER1" });
add("F3-01 a Drive folder link that is not the batch folder", {
  [K.dbg(MA, 1)]: "https://drive.google.com/drive/folders/SOMEOTHER",
}, { pass: false, errorsContain: ["link to a Drive folder, not to a file"] });
add("F3-01 two links in one field", {
  [K.dbg(MA, 1)]: `${link("DBG_T1")} ${link("DBG_T2")}`,
}, { pass: false, errorsContain: ["holds 2 links"] });
add("F3-01 debug pasted as text instead of linked", {
  [K.dbg(MA, 1)]: "Model ID: pcontext_ramen_top20\n<ctrl99>user\n" + PROMPT + "\n<ctrl100>",
}, { pass: false, errorsContain: ["pasted in as text"] });
add("NEAR-MISS valid file link with a ?usp=sharing suffix: no finding", {}, { pass: true, warnings: [] });
add("F3-02 the same Drive file id used on both sides", {
  [K.dbg(MB, 1)]: link("DBG_T1"),
}, { pass: false, errorsContain: ["same Drive file is linked"] });
add("F3-03 fetch failure with no artifact mock behind the link", {
  [K.dbg(MA, 1)]: link("MISSING_FILE"),
}, { pass: false, errorsContain: ["could not be opened for review"] });
add("F3-04 the linked file is not a debug capture", {
  [K.dbg(MA, 1)]: link("NOT_DEBUG"),
}, { pass: false, errorsContain: ["does not look like Gemini debug information"] });
add("F3-05 debug carries headers but zero conversation blocks", {
  [K.turns(MA)]: "1", [K.dbg(MA, 2)]: undefined, [K.dbg(MA, 1)]: link("DBG_NOUSER"),
}, { pass: false, errorsContain: ["none of the conversation itself"] });
add("F3-07 the HTML link is not a saved Gemini page", {
  [K.html(MA)]: link("NOT_GEMINI"),
}, { pass: false, errorsContain: ["not a saved Gemini conversation"] });
add("F3-08 the saved page does not contain the submitted prompt", {
  [K.html(MA)]: link("HTML_OTHER"),
}, { pass: false, errorsContain: ["does not contain the prompt you submitted"] });
add("F3-09 the two saved pages are swapped between the models", {
  [K.html(MA)]: link("HTML_B"), [K.html(MB)]: link("HTML_T"),
}, { pass: false, errorsContain: ["actually the other model's conversation"] });
add("F3-11 one conversation saved for both models", {
  [K.html(MB)]: link("HTML_T_COPY"),
}, { pass: false, errorsContain: ["same conversation appears to have been saved for both models"] });

// ================================================================ F4 content anchoring
add("F4-A turn 1 debug is a different conversation", {
  [K.turns(MA)]: "1", [K.dbg(MA, 2)]: undefined, [K.dbg(MA, 1)]: link("DBG_WRONG"),
}, { pass: false, errorsContain: ["starts with a different question"] });
add("NEAR-MISS same conversation with CRLF and the omission marker: zero findings", {
  [K.dbg(MA, 1)]: link("DBG_T1_CRLF"),
}, { pass: true, warnings: [] });
add("NEAR-MISS the 939 regression pair: NBSP in the prompt, U+FFFD in the debug", {
  prompt: PROMPT.replace(/ /g, " "), [K.dbg(MA, 1)]: link("DBG_T1_FFFD"),
}, { pass: true });
add("F4-C turn 2 debug is from a different conversation than turn 1", {
  [K.dbg(MA, 2)]: link("DBG_T2_BROKEN"),
}, { pass: false, errorsContain: ["does not contain the question from the turn before it"] });
add("F4-D turn 2 debug pasted into the turn 1 slot", {
  [K.turns(MA)]: "1", [K.dbg(MA, 2)]: undefined, [K.dbg(MA, 1)]: link("DBG_T2"),
}, { pass: false, errorsContain: ["more than one question from you"] });
add("F4-E turn 1 debug pasted into the turn 2 slot as a second copy", {
  [K.dbg(MA, 2)]: link("DBG_T1_TWIN"),
}, { pass: false, errorsContain: ["identical to the one in"] });
add("F4-F one chat used for both models (Turn 1 debug identical)", {
  [K.dbg(MB, 1)]: link("DBG_T1_TWIN"), [K.dbg(MB, 2)]: link("DBG_T2_TWIN"),
}, { pass: false, errorsContain: ["same conversation, but each model must be run"] });
add("F4-G second model started with the first model's history still in place", {
  [K.dbg(MB, 1)]: link("DBG_B1_FOOT"),
}, { pass: true, warningsContain: ["history from the first model's chat still in place"] });
add("F4-H the recorded run order looks reversed", {
  firstModel: MB, [K.dbg(MB, 1)]: link("DBG_B1_FOOT"),
}, { pass: true, warningsContain: ["opposite order to the one recorded"] });

// ================================================================ F5 identity
add("F5-01 one side's turns report two different models", {
  [K.dbg(MA, 2)]: link("DBG_T2_OTHERID"),
}, { pass: false, errorsContain: ["report 2 different models"] });
add("F5-02 both models report the same Model ID", {
  [K.dbg(MB, 1)]: link("DBG_B1_SAMEID"), [K.dbg(MB, 2)]: link("DBG_B2_SAMEID"),
}, { pass: false, errorsContain: ["both models reports the same model"] });
add("F5-04 first model is a model this evaluation does not use", {
  firstModel: "Mode 23 -> Something Else - Fast",
}, { pass: false, errorsContain: ["[ROUTE TO LEAD]"] });
add("F5-05 first model differs from the assigned first model", {}, { pass: false, errorsContain: ["does not match the model this task assigned"] }, { "First Model": MB });

// ================================================================ F6 coherence
add("F6-01 Q1 says both personalized and not personalized", {
  [K.q1(MA)]: ["Personalized (Personal Data)", "Not Personalized"],
}, { pass: false, errorsContain: ["both personalized and not personalized"] });
add("F6-02 a Turns child cites a turn past the declared count", {
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContext")]: "Minor issues",
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContextCategory")]: ["Missed life context"],
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContextTurns")]: ["4"],
}, { pass: false, errorsContain: ["past the 2 turns"] });
add("F6-03 N/A mixed with turn numbers", {
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContext")]: "Minor issues",
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContextCategory")]: ["Missed life context"],
  [K.head(MA, "modelMakesUseOfAvailableUserData1MissedContextTurns")]: ["1", "N/A"],
}, { pass: true, warningsContain: ['"N/A" is selected alongside specific turn numbers'] });
add("F6-04 the rationale cites a turn past the declared count", {
  [K.r7c(MA)]: "[Turn 5] the list was wrong.",
}, { pass: true, warningsContain: ["past the 2 turns"] });
add("F6-05 the rationale cites no turn at all while a head flags an issue", {
  [K.head(MA, "modelIsTrustworthySafe1TrustSafety")]: "Minor issues",
  [K.head(MA, "modelIsTrustworthySafe1TrustSafetyCategory")]: ["Offensive / intrusive"],
  [K.head(MA, "modelIsTrustworthySafe1TrustSafetyTurns")]: ["2"],
  [K.r7c(MA)]: "It felt intrusive overall.",
}, { pass: true, warningsContain: ["does not reference any turn"] });
add("F6-06 dissatisfied with a partial debug slice", {
  [K.sat7a(MA)]: "Very dissatisfied",
  [K.dbg(MA, 1)]: link("DBG_T1_AGENCY"), [K.dbg(MA, 2)]: link("DBG_T2_AGENCY"),
  [K.r7c(MA)]: "[Turn 1] it ignored my dates. [Turn 2] still wrong.",
}, { pass: true, warningsContain: ["is a partial share"] });
add("NEAR-MISS dissatisfied with a FULL debug share: no partial-share warning", {
  [K.sat7a(MA)]: "Very dissatisfied",
  [K.r7c(MA)]: "[Turn 1] it ignored my dates. [Turn 2] still wrong.",
}, { pass: true, warnings: [] });
add("F6-07 sensitive-attribution category flagged while Trust & Safety reports No issues", {
  [K.head(MA, "modelConnectsTheDotsForMe1TransparencyAttribution")]: "Minor issues",
  [K.head(MA, "modelConnectsTheDotsForMe1TransparencyAttributionCategory")]: ["Didn’t ground/attribute for sensitive info"],
  [K.head(MA, "modelConnectsTheDotsForMe1TransparencyAttributionTurns")]: ["1"],
}, { pass: true, warningsContain: ["this rating reports no issue"] });
add("F6-08 Not Personalized only, yet an over-personalization issue is flagged", {
  [K.q1(MA)]: ["Not Personalized"],
  [K.head(MA, "modelMakesUseOfAvailableUserData1OverPersonalization")]: "Minor issues",
  [K.head(MA, "modelMakesUseOfAvailableUserData1OverPersonalizationCategory")]: ["Forced connection"],
  [K.head(MA, "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction")]: "Somewhat",
  [K.head(MA, "modelMakesUseOfAvailableUserData1OverPersonalizationTurns")]: ["1"],
}, { pass: true, warningsContain: ["was not personalized at all"] });
add("F6-09 an answer value this form does not offer routes to the lead", {
  [K.head(MA, "modelIsTrustworthySafe1TrustSafety")]: "Catastrophic issues",
}, { pass: false, errorsContain: ["[ROUTE TO LEAD]"] });
add("NEAR-MISS curly-apostrophe option variant is read, never flagged", {
  [K.head(MA, "modelConnectsTheDotsForMe1TransparencyAttribution")]: "Minor issues",
  [K.head(MA, "modelConnectsTheDotsForMe1TransparencyAttributionCategory")]: ["Didn't ground/attribute for sensitive info"],
  [K.head(MA, "modelConnectsTheDotsForMe1TransparencyAttributionTurns")]: ["1"],
  [K.head(MA, "modelIsTrustworthySafe1TrustSafety")]: "Minor issues",
  [K.head(MA, "modelIsTrustworthySafe1TrustSafetyCategory")]: ["Missing grounding/attribution for sensitive info"],
  [K.head(MA, "modelIsTrustworthySafe1TrustSafetyTurns")]: ["1"],
}, { pass: true, warnings: [] });
add("F6-10 single-turn assignment but two turns were run", {}, { pass: false, errorsContain: ["assigned as a single-turn conversation"] }, { "Additional Rater Instruction": "This is a single-turn task: ask one question only." });
add("F6-10 multi-turn assignment with one turn warns, never blocks", {
  [K.turns(MA)]: "1", [K.dbg(MA, 2)]: undefined,
  [K.turns(MB)]: "1", [K.dbg(MB, 2)]: undefined,
}, { pass: true, warningsContain: ["assigned as a multi-turn conversation"] }, { "Additional Rater Instruction": "Multi-turn: continue for up to 5 turns." });
add("F6-11 the bare token 'redacted' used in place of personal information", {
  conversationalGoal: "A packing list for my trip with [redacted].",
}, { pass: true, warningsContain: ['uses the word "redacted"'] });
add("NEAR-MISS descriptive redaction placeholders never fire", {
  conversationalGoal: "A packing list for my trip with [granddaughter's name] to [city].",
}, { pass: true, warnings: [] });

// ================================================================ F7 batch and metadata
add("F7-01 the target language is not this project's assigned language", {
  targetLanguage: "Portuguese", dialect: "Brazil",
}, { pass: true, warningsContain: ["not the language this project is assigned"] });

// ================================================================ adapter
cases.push({
  name: "A-01 form answers not locatable routes to the lead",
  conversationData: { something: { unrelated: true } },
  expect: { pass: false, errorsContain: ["Form answers not locatable"] },
});
cases.push({
  name: "A-04 neither model namespace matches the configured names: ABORT",
  conversationData: { conversation: { ratings: {
    setupCheck: v(true), prompt: v(PROMPT), conversationalGoal: v("goal"),
    personalizationExpectation: v("Somewhat — Personal touches would help, but aren't essential."),
    firstModel: v(MA), targetLanguage: v(LOCALE.language), dialect: v(LOCALE.dialect),
    qualityComparisonSxS: v("Conversation A was better"), qualityComparisonSxSRationale: v("r"), privacyGate: v(true),
    "compareModels.Some Other Model.numberOfTurns": v("1"),
    "compareModels.Some Other Model.testModelOverallQuality": v("Very satisfied"),
    "compareModels.Some Other Model.model1PersonalizationTriggering": v(["Not Personalized"]),
  } } },
  expect: { pass: false, errorsContain: ["[ABORT]"] },
});
// A-01 runtime shape: ratings as an ARRAY of {key, question, human_input_value}.
cases.push({
  name: "A-01 runtime array shape resolves and the clean task still passes",
  conversationData: { conversation_data: { ratings: Object.entries(base()).map(([k, val]) => ({ key: k, question: k, human_input_value: val })) } },
  expect: { pass: true, warnings: [] },
});

// ================================================================ zh-CN width forms
// KNOWN-OPEN (requirements section 5): the result is RECORDED by the width probe in the run
// log, not asserted. This case exists so the pair is exercised and the probe line is visible.
add("KNOWN-OPEN zh-CN width-form variant pair (probe records, nothing asserted)", {
  prompt: "（下周去里斯本要带什么）",
  [K.dbg(MA, 1)]: link("DBG_ZH_HALF"), [K.dbg(MA, 2)]: undefined, [K.turns(MA)]: "1",
}, {});

// ================================================================ F3-09 name-shape regression
// PERMANENT. When the Test model was renamed to "PContext Mode 23 (Nippon) > Mochi - Fast", the
// F3-09 discriminator recognised only {"->", " - "} as separators, so it split first at the
// " - " before "Fast" and reduced the form name to "fast" while the saved page reduced to
// "mochifast" -- an F3-09 ERROR on every correct Test-side task. Both directions are pinned:
// the correctly-labelled page must NOT fire, and a genuinely swapped page MUST.
add("F3-09 REGRESSION bare-'>' Test name: correctly labelled page does NOT fire", {},
  { pass: true, warnings: [] });
add("F3-09 REGRESSION a genuinely swapped page still fires under the new Test name", {
  [K.html(MA)]: link("HTML_B"), [K.html(MB)]: link("HTML_T"),
}, { pass: false, errorsContain: ["actually the other model's conversation"] });

const out = process.argv[2] || "fixtures/cases.json";
writeFileSync(out, JSON.stringify(cases, null, 1));
console.log(`wrote ${out}: ${cases.length} cases (locale ${LOCALE.language} / ${LOCALE.dialect})`);
