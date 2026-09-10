// prq-validator-948 v1.1.0 -- 0909 Yakitori vs Prod (en-US) (project 948).
//
// GENERATED FILE -- do not edit by hand. Rebuild with: node scripts/build-prq.mjs
// Composed from (both live in 941-prq-e2e-eval-es-419/, shared by 941 and 942):
//   - parts/prq-checks.js        Layer L1, payload-only  -> validatePrqL1
//   - parts/prq-fetch-checks.js  Layer L2, fetched Drive artifacts -> validatePrqFetch
// Config tables (keys, labels, option vocabularies, gate graph, model names) are DERIVED from
// config/project-config-id-941.json and injected here -- never hand-typed.
//
// ARCHITECTURE: validate() is a thin wrapper running both sub-validators independently and
// de-duplicating, matching 939-continuity-en-us's validateContinuity/validate903 composition
// and 944's L1/L2 pair. Each sub-validator resolves the payload shape for itself.
//
// CHECKS IMPLEMENTED (build-asserted, one call site each):
//   F1-01..F1-07  completeness           F2-01..F2-07  gate cascades (from displayConditions)
//   F3-01..F3-11  artifact integrity     F4-A..F4-H    content anchoring (fetched debug)
//   F5-01..F5-05  identity               F6-01..F6-11  coherence matrices
//   F7-01..F7-04  batch / metadata
// F5-06 and the four \u00a74 REMOVED-ON-FORK items are deliberately absent, not self-skipping.
//
// Locale assignment for this build: English / United States (F7-01 warns on drift).
// 948 tables derived from the config export; machine-diffed against the earlier bootstrap: IDENTICAL.
//
// Available globals: conversationData, fetchDataFromDriveLink, fetchDataFromDriveZip,
// fetchDataFromGcsLink. Injected arrays: errors, warnings, infos, successes, logs.

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
  const CFG = {
 "version": "1.1.0",
 "projectId": 948,
 "modelA": "Mode 23 -> Yakitori - Fast",
 "modelB": "Mode 23 -> Prod Frozen - Fast",
 "perSide": [
  "numberOfTurns",
  "testResponse1DebugInfo",
  "testResponse2DebugInfo",
  "model1TestResponse3DebugInfo",
  "model1TestResponse4DebugInfo",
  "model1TestResponse5DebugInfo",
  "model1HtmlFileUpload",
  "model1PersonalizationTriggering",
  "modelMakesUseOfAvailableUserData1MissedContext",
  "modelMakesUseOfAvailableUserData1MissedContextCategory",
  "modelMakesUseOfAvailableUserData1MissedContextTurns",
  "modelMakesUseOfAvailableUserData1Clarification",
  "modelMakesUseOfAvailableUserData1ClarificationCategory",
  "modelMakesUseOfAvailableUserData1ClarificationTurns",
  "modelMakesUseOfAvailableUserData1OverPersonalization",
  "modelMakesUseOfAvailableUserData1OverPersonalizationCategory",
  "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction",
  "modelMakesUseOfAvailableUserData1OverPersonalizationTurns",
  "modelMakesUseOfAvailableUserData1PersonalDataErrors",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns",
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns",
  "modelConnectsTheDotsForMe1TransparencyAttribution",
  "modelConnectsTheDotsForMe1TransparencyAttributionCategory",
  "modelConnectsTheDotsForMe1TransparencyAttributionTurns",
  "modelConnectsTheDotsForMe1OverTransparency",
  "modelConnectsTheDotsForMe1OverTransparencyCategory",
  "modelConnectsTheDotsForMe1OverTransparencyDetraction",
  "modelConnectsTheDotsForMe1OverTransparencyTurns",
  "modelIsTrustworthySafe1TrustSafety",
  "modelIsTrustworthySafe1TrustSafetyCategory",
  "modelIsTrustworthySafe1TrustSafetyTurns",
  "modelRespectsMyCorrections1Corrections",
  "modelRespectsMyCorrections1CorrectionsDirection",
  "modelRespectsMyCorrections1CorrectionsTurns",
  "testModelOverallPersonalizationQuality",
  "testModelOverallQuality",
  "testModelOverallQualityRationale",
  "secondModelLock"
 ],
 "taskFields": [
  "setupCheck",
  "targetLanguage",
  "dialect",
  "prompt",
  "conversationalGoal",
  "personalizationExpectation",
  "firstModel",
  "qualityComparisonSxS",
  "qualityComparisonSxSRationale",
  "privacyGate"
 ],
 "labels": {
  "setupCheck": "Setup Checks Required",
  "bp1": "bp1",
  "targetLanguage": "Target Language",
  "dialect": "Dialect",
  "prompt": "Prompt",
  "conversationalGoal": "Conversational Goal",
  "personalizationExpectation": "Personalization Expectation",
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
  "model1PersonalizationTriggering": "Model Personalization Triggering",
  "modelMakesUseOfAvailableUserData1MissedContext": "Model Makes Use of Available User Data - 1. Missed Context",
  "modelMakesUseOfAvailableUserData1MissedContextCategory": "Model Makes Use of Available User Data - 1. Missed Context Category",
  "modelMakesUseOfAvailableUserData1MissedContextTurns": "Model Makes Use of Available User Data - 1. Missed Context Turns",
  "modelMakesUseOfAvailableUserData1Clarification": "Model Makes Use of Available User Data - 1. Clarification",
  "modelMakesUseOfAvailableUserData1ClarificationCategory": "Model Makes Use of Available User Data - 1. Clarification Category",
  "modelMakesUseOfAvailableUserData1ClarificationTurns": "Model Makes Use of Available User Data - 1. Clarification Turns",
  "modelMakesUseOfAvailableUserData1OverPersonalization": "Model Makes Use of Available User Data - 1. Over-Personalization",
  "modelMakesUseOfAvailableUserData1OverPersonalizationCategory": "Model Makes Use of Available User Data - 1. Over-Personalization Category",
  "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction": "Model Makes Use of Available User Data - 1. Over-Personalization Detraction",
  "modelMakesUseOfAvailableUserData1OverPersonalizationTurns": "Model Makes Use of Available User Data - 1. Over-Personalization Turns",
  "modelMakesUseOfAvailableUserData1PersonalDataErrors": "Model Makes Use of Available User Data - 1. Personal Data Errors",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory": "Model Makes Use of Available User Data - 1. Personal Data Errors Category",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns": "Model Makes Use of Available User Data - 1. Personal Data Errors Turns",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage": "Model Feels Like It Gets Me - 1. Speaks My \"Language\"",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns": "Model Feels Like It Gets Me - 1. Speaks My \"Language\" Turns",
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture": "Model Feels Like It Gets Me - 1. Insights, Patterns & the Bigger Picture",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory": "Model Feels Like It Gets Me - 1. Insights, Patterns & the Bigger Picture Category",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns": "Model Feels Like It Gets Me - 1. Insights, Patterns & the Bigger Picture - Turns",
  "modelConnectsTheDotsForMe1TransparencyAttribution": "Model Connects the Dots for Me - 1. Transparency & Attribution",
  "modelConnectsTheDotsForMe1TransparencyAttributionCategory": "Model Connects the Dots for Me - 1. Transparency & Attribution Category",
  "modelConnectsTheDotsForMe1TransparencyAttributionTurns": "Model Connects the Dots for Me - 1. Transparency & Attribution - Turns",
  "modelConnectsTheDotsForMe1OverTransparency": "Model Connects the Dots for Me - 1. Over-Transparency",
  "modelConnectsTheDotsForMe1OverTransparencyCategory": "Model Connects the Dots for Me - 1. Over-Transparency Category",
  "modelConnectsTheDotsForMe1OverTransparencyDetraction": "Model Connects the Dots for Me - 1. Over-Transparency - Detraction",
  "modelConnectsTheDotsForMe1OverTransparencyTurns": "Model Connects the Dots for Me - 1. Over-Transparency - Turns",
  "modelIsTrustworthySafe1TrustSafety": "Model Is Trustworthy & Safe - 1. Trust & Safety",
  "modelIsTrustworthySafe1TrustSafetyCategory": "Model Is Trustworthy & Safe - 1. Trust & Safety - Category",
  "modelIsTrustworthySafe1TrustSafetyTurns": "Model Is Trustworthy & Safe - 1. Trust & Safety - Turns",
  "modelRespectsMyCorrections1Corrections": "Model Respects My Corrections - 1. Corrections",
  "modelRespectsMyCorrections1CorrectionsDirection": "Model Respects My Corrections - 1. Corrections - Direction",
  "modelRespectsMyCorrections1CorrectionsTurns": "Model Respects My Corrections - 1. Corrections - Turns",
  "testModelOverallPersonalizationQuality": "Model Holistic Assessment - 1. Overall Personalization Quality",
  "testModelOverallQuality": "Model Holistic Assessment - 1. Overall Quality",
  "testModelOverallQualityRationale": "Model Holistic Assessment - 1. Overall Quality Rationale",
  "secondModelLock": "Critical Requirement",
  "qualityComparisonSxS": "Quality Comparison SxS",
  "qualityComparisonSxSRationale": "Quality Comparison SxS Rationale",
  "privacyGate": "Privacy Gate"
 },
 "options": {
  "targetLanguage": [
   "Arabic",
   "Assamese",
   "Bengali",
   "Bhojpuri",
   "Bulgarian",
   "Burmese",
   "Chinese",
   "Croatian",
   "Czech",
   "Danish",
   "Dutch",
   "English",
   "Finnish",
   "French",
   "German",
   "Greek",
   "Gujarati",
   "Hebrew",
   "Hindi",
   "Hungarian",
   "Indonesian",
   "Italian",
   "Japanese",
   "Javanese",
   "Kannada",
   "Khmer",
   "Korean",
   "Maithili",
   "Malay",
   "Malayalam",
   "Marathi",
   "Nepali",
   "Norwegian",
   "Odia",
   "Persian",
   "Polish",
   "Portuguese",
   "Punjabi",
   "Romanian",
   "Russian",
   "Sanskrit",
   "Slovak",
   "Spanish",
   "Swahili",
   "Swedish",
   "Tagalog",
   "Tamil",
   "Telugu",
   "Thai",
   "Turkish",
   "Ukrainian",
   "Urdu",
   "Vietnamese"
  ],
  "dialect": [
   "Modern Standard",
   "India",
   "Bulgaria",
   "Myanmar",
   "Mainland (Simplified)",
   "Taiwan (Traditional)",
   "Hong Kong (Cantonese)",
   "Croatia",
   "Czech Republic",
   "Denmark",
   "Netherlands",
   "Belgium (Flemish)",
   "United Kingdom",
   "United States",
   "Australia",
   "Finland",
   "France",
   "Canada",
   "Belgium",
   "Germany",
   "Modern",
   "Israel",
   "Hungary",
   "Indonesia",
   "Italy",
   "Japan",
   "Cambodia",
   "Korea",
   "Malaysia",
   "Nepal",
   "Norway",
   "Afghanistan",
   "Poland",
   "Brazil",
   "Pakistan",
   "Romania",
   "Moldova",
   "Russia",
   "Slovakia",
   "LatAm (All Variants)",
   "Kenya",
   "Tanzania",
   "Sweden",
   "Philippines",
   "Sri Lanka",
   "Thailand",
   "Turkey",
   "Ukraine",
   "Vietnam",
   "Portugal "
  ],
  "personalizationExpectation": [
   "A lot \u2014 A generic answer would miss important things about my situation.",
   "Somewhat \u2014 Personal touches would help, but aren't essential.",
   "Not really \u2014 I just need a good answer."
  ],
  "firstModel": [
   "Mode 23 -> Yakitori - Fast",
   "Mode 23 -> Prod Frozen - Fast"
  ],
  "numberOfTurns": [
   "1",
   "2",
   "3",
   "4",
   "5"
  ],
  "model1PersonalizationTriggering": [
   "Personalized (Personal Data)",
   "Personalized (Response Preference)",
   "Personalized (Time & Location)",
   "Not Personalized"
  ],
  "modelMakesUseOfAvailableUserData1MissedContext": [
   "N/A - No personalization needed",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelMakesUseOfAvailableUserData1MissedContextCategory": [
   "Missed requested fact",
   "Missed directly supporting evidence",
   "Missed hard constraint",
   "Missed life context",
   "Missed granularity"
  ],
  "modelMakesUseOfAvailableUserData1MissedContextTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelMakesUseOfAvailableUserData1Clarification": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelMakesUseOfAvailableUserData1ClarificationCategory": [
   "Over-clarification",
   "Under-clarification"
  ],
  "modelMakesUseOfAvailableUserData1ClarificationTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelMakesUseOfAvailableUserData1OverPersonalization": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelMakesUseOfAvailableUserData1OverPersonalizationCategory": [
   "Forced connection",
   "Tunnel vision",
   "Cherrypicked details"
  ],
  "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction": [
   "Not at all",
   "Somewhat",
   "Completely"
  ],
  "modelMakesUseOfAvailableUserData1OverPersonalizationTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelMakesUseOfAvailableUserData1PersonalDataErrors": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory": [
   "Used wrong personal info",
   "Used stale context",
   "Incorrect inference",
   "Overconfident speculation",
   "Personal misattribution",
   "Locational confusion",
   "Temporal confusion"
  ],
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory": [
   "Missed general insights & patterns",
   "Missed the \"why\"",
   "Overgeneralized insights"
  ],
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelConnectsTheDotsForMe1TransparencyAttribution": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelConnectsTheDotsForMe1TransparencyAttributionCategory": [
   "Didn't explain personal relevance",
   "Didn't ground hard constraints",
   "Didn\u2019t ground/attribute for sensitive info",
   "Didn't attribute surprising content",
   "Didn't ground when asked",
   "Didn't attribute when asked"
  ],
  "modelConnectsTheDotsForMe1TransparencyAttributionTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelConnectsTheDotsForMe1OverTransparency": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelConnectsTheDotsForMe1OverTransparencyCategory": [
   "Overnarrating",
   "Showing off",
   "Failed to hedge"
  ],
  "modelConnectsTheDotsForMe1OverTransparencyDetraction": [
   "Not at all",
   "Somewhat",
   "Completely"
  ],
  "modelConnectsTheDotsForMe1OverTransparencyTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelIsTrustworthySafe1TrustSafety": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelIsTrustworthySafe1TrustSafetyCategory": [
   "Inappropriate use of sensitive data",
   "Missing grounding/attribution for sensitive info",
   "Offensive / intrusive"
  ],
  "modelIsTrustworthySafe1TrustSafetyTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelRespectsMyCorrections1Corrections": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelRespectsMyCorrections1CorrectionsDirection": [
   "Ignored correction",
   "Overgeneralized correction"
  ],
  "modelRespectsMyCorrections1CorrectionsTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "testModelOverallPersonalizationQuality": [
   "Very dissatisfied",
   "Somewhat dissatisfied",
   "Neither satisfied nor dissatisfied",
   "Somewhat satisfied",
   "Very satisfied"
  ],
  "testModelOverallQuality": [
   "Very dissatisfied",
   "Somewhat dissatisfied",
   "Neither satisfied nor dissatisfied",
   "Somewhat satisfied",
   "Very satisfied"
  ],
  "qualityComparisonSxS": [
   "Conversation A was much better",
   "Conversation A was better",
   "Conversation A was slightly better",
   "Conversation A and B were about the same",
   "Conversation B was slightly better",
   "Conversation B was better",
   "Conversation B was much better"
  ]
 },
 "types": {
  "setupCheck": "CHECKBOX",
  "bp1": "BREAKPOINT",
  "targetLanguage": "SINGLE_CHOICE",
  "dialect": "SINGLE_CHOICE",
  "prompt": "FREE_TEXT",
  "conversationalGoal": "FREE_TEXT",
  "personalizationExpectation": "SINGLE_CHOICE",
  "firstModel": "SINGLE_CHOICE",
  "preQuestionsBreakpoint": "BREAKPOINT",
  "compareModels": "SIDE_BY_SIDE_COMPARISON",
  "bp2": "BREAKPOINT",
  "numberOfTurns": "SINGLE_CHOICE",
  "testResponse1DebugInfo": "FREE_TEXT",
  "testResponse2DebugInfo": "FREE_TEXT",
  "model1TestResponse3DebugInfo": "FREE_TEXT",
  "model1TestResponse4DebugInfo": "FREE_TEXT",
  "model1TestResponse5DebugInfo": "FREE_TEXT",
  "model1HtmlFileUpload": "FREE_TEXT",
  "model1PersonalizationTriggering": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1MissedContext": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1MissedContextCategory": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1MissedContextTurns": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1Clarification": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1ClarificationCategory": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1ClarificationTurns": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1OverPersonalization": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1OverPersonalizationCategory": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1OverPersonalizationTurns": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1PersonalDataErrors": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns": "MULTIPLE_CHOICE",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage": "SINGLE_CHOICE",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns": "MULTIPLE_CHOICE",
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture": "SINGLE_CHOICE",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory": "MULTIPLE_CHOICE",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns": "MULTIPLE_CHOICE",
  "modelConnectsTheDotsForMe1TransparencyAttribution": "SINGLE_CHOICE",
  "modelConnectsTheDotsForMe1TransparencyAttributionCategory": "MULTIPLE_CHOICE",
  "modelConnectsTheDotsForMe1TransparencyAttributionTurns": "MULTIPLE_CHOICE",
  "modelConnectsTheDotsForMe1OverTransparency": "SINGLE_CHOICE",
  "modelConnectsTheDotsForMe1OverTransparencyCategory": "MULTIPLE_CHOICE",
  "modelConnectsTheDotsForMe1OverTransparencyDetraction": "SINGLE_CHOICE",
  "modelConnectsTheDotsForMe1OverTransparencyTurns": "MULTIPLE_CHOICE",
  "modelIsTrustworthySafe1TrustSafety": "SINGLE_CHOICE",
  "modelIsTrustworthySafe1TrustSafetyCategory": "MULTIPLE_CHOICE",
  "modelIsTrustworthySafe1TrustSafetyTurns": "MULTIPLE_CHOICE",
  "modelRespectsMyCorrections1Corrections": "SINGLE_CHOICE",
  "modelRespectsMyCorrections1CorrectionsDirection": "MULTIPLE_CHOICE",
  "modelRespectsMyCorrections1CorrectionsTurns": "MULTIPLE_CHOICE",
  "testModelOverallPersonalizationQuality": "SINGLE_CHOICE",
  "testModelOverallQuality": "SINGLE_CHOICE",
  "testModelOverallQualityRationale": "FREE_TEXT",
  "secondModelLock": "CHECKBOX",
  "qualityComparisonSxS": "SINGLE_CHOICE",
  "qualityComparisonSxSRationale": "FREE_TEXT",
  "privacyGate": "CHECKBOX"
 },
 "gates": [
  {
   "child": "bp2",
   "parent": "numberOfTurns",
   "values": [
    "1",
    "2",
    "3",
    "4",
    "5"
   ],
   "op": "eq"
  },
  {
   "child": "testResponse1DebugInfo",
   "parent": "numberOfTurns",
   "values": [
    "1",
    "2",
    "3",
    "4",
    "5"
   ],
   "op": "eq"
  },
  {
   "child": "testResponse2DebugInfo",
   "parent": "numberOfTurns",
   "values": [
    "2",
    "3",
    "4",
    "5"
   ],
   "op": "eq"
  },
  {
   "child": "model1TestResponse3DebugInfo",
   "parent": "numberOfTurns",
   "values": [
    "3",
    "4",
    "5"
   ],
   "op": "eq"
  },
  {
   "child": "model1TestResponse4DebugInfo",
   "parent": "numberOfTurns",
   "values": [
    "5",
    "4"
   ],
   "op": "eq"
  },
  {
   "child": "model1TestResponse5DebugInfo",
   "parent": "numberOfTurns",
   "values": [
    "5"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1MissedContextCategory",
   "parent": "modelMakesUseOfAvailableUserData1MissedContext",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1MissedContextTurns",
   "parent": "modelMakesUseOfAvailableUserData1MissedContext",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1ClarificationCategory",
   "parent": "modelMakesUseOfAvailableUserData1Clarification",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1ClarificationTurns",
   "parent": "modelMakesUseOfAvailableUserData1Clarification",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1OverPersonalizationCategory",
   "parent": "modelMakesUseOfAvailableUserData1OverPersonalization",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction",
   "parent": "modelMakesUseOfAvailableUserData1OverPersonalization",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1OverPersonalizationTurns",
   "parent": "modelMakesUseOfAvailableUserData1OverPersonalization",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory",
   "parent": "modelMakesUseOfAvailableUserData1PersonalDataErrors",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns",
   "parent": "modelMakesUseOfAvailableUserData1PersonalDataErrors",
   "values": [
    "Major issues",
    "Minor issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns",
   "parent": "modelFeelsLikeItGetsMe1SpeaksMyLanguage",
   "values": [
    "Major issues",
    "Minor issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory",
   "parent": "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns",
   "parent": "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelConnectsTheDotsForMe1TransparencyAttributionCategory",
   "parent": "modelConnectsTheDotsForMe1TransparencyAttribution",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelConnectsTheDotsForMe1TransparencyAttributionTurns",
   "parent": "modelConnectsTheDotsForMe1TransparencyAttribution",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelConnectsTheDotsForMe1OverTransparencyCategory",
   "parent": "modelConnectsTheDotsForMe1OverTransparency",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelConnectsTheDotsForMe1OverTransparencyDetraction",
   "parent": "modelConnectsTheDotsForMe1OverTransparency",
   "values": [
    "Major issues",
    "Minor issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelConnectsTheDotsForMe1OverTransparencyTurns",
   "parent": "modelConnectsTheDotsForMe1OverTransparency",
   "values": [
    "Major issues",
    "Minor issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelIsTrustworthySafe1TrustSafetyCategory",
   "parent": "modelIsTrustworthySafe1TrustSafety",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelIsTrustworthySafe1TrustSafetyTurns",
   "parent": "modelIsTrustworthySafe1TrustSafety",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelRespectsMyCorrections1CorrectionsDirection",
   "parent": "modelRespectsMyCorrections1Corrections",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelRespectsMyCorrections1CorrectionsTurns",
   "parent": "modelRespectsMyCorrections1Corrections",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  }
 ],
 "heads": [
  "modelMakesUseOfAvailableUserData1MissedContext",
  "modelMakesUseOfAvailableUserData1Clarification",
  "modelMakesUseOfAvailableUserData1OverPersonalization",
  "modelMakesUseOfAvailableUserData1PersonalDataErrors",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage",
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture",
  "modelConnectsTheDotsForMe1TransparencyAttribution",
  "modelConnectsTheDotsForMe1OverTransparency",
  "modelIsTrustworthySafe1TrustSafety",
  "modelRespectsMyCorrections1Corrections"
 ],
 "i18nHeads": [],
 "childrenOf": {
  "modelMakesUseOfAvailableUserData1MissedContext": {
   "category": "modelMakesUseOfAvailableUserData1MissedContextCategory",
   "turns": "modelMakesUseOfAvailableUserData1MissedContextTurns"
  },
  "modelMakesUseOfAvailableUserData1Clarification": {
   "category": "modelMakesUseOfAvailableUserData1ClarificationCategory",
   "turns": "modelMakesUseOfAvailableUserData1ClarificationTurns"
  },
  "modelMakesUseOfAvailableUserData1OverPersonalization": {
   "category": "modelMakesUseOfAvailableUserData1OverPersonalizationCategory",
   "detraction": "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction",
   "turns": "modelMakesUseOfAvailableUserData1OverPersonalizationTurns"
  },
  "modelMakesUseOfAvailableUserData1PersonalDataErrors": {
   "category": "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory",
   "turns": "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns"
  },
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage": {
   "turns": "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns"
  },
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture": {
   "category": "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory",
   "turns": "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns"
  },
  "modelConnectsTheDotsForMe1TransparencyAttribution": {
   "category": "modelConnectsTheDotsForMe1TransparencyAttributionCategory",
   "turns": "modelConnectsTheDotsForMe1TransparencyAttributionTurns"
  },
  "modelConnectsTheDotsForMe1OverTransparency": {
   "category": "modelConnectsTheDotsForMe1OverTransparencyCategory",
   "detraction": "modelConnectsTheDotsForMe1OverTransparencyDetraction",
   "turns": "modelConnectsTheDotsForMe1OverTransparencyTurns"
  },
  "modelIsTrustworthySafe1TrustSafety": {
   "category": "modelIsTrustworthySafe1TrustSafetyCategory",
   "turns": "modelIsTrustworthySafe1TrustSafetyTurns"
  },
  "modelRespectsMyCorrections1Corrections": {
   "category": "modelRespectsMyCorrections1CorrectionsDirection",
   "turns": "modelRespectsMyCorrections1CorrectionsTurns"
  }
 },
 "debugSlotKeys": [
  "testResponse1DebugInfo",
  "testResponse2DebugInfo",
  "model1TestResponse3DebugInfo",
  "model1TestResponse4DebugInfo",
  "model1TestResponse5DebugInfo"
 ],
 "anchors": {
  "turns": "numberOfTurns",
  "q1": "model1PersonalizationTriggering",
  "html": "model1HtmlFileUpload",
  "sat7a": "testModelOverallPersonalizationQuality",
  "sat7b": "testModelOverallQuality",
  "rationale7c": "testModelOverallQualityRationale",
  "secondModelLock": "secondModelLock",
  "setupCheck": "setupCheck",
  "privacyGate": "privacyGate",
  "prompt": "prompt",
  "conversationalGoal": "conversationalGoal",
  "personalizationExpectation": "personalizationExpectation",
  "firstModel": "firstModel",
  "targetLanguage": "targetLanguage",
  "dialect": "dialect",
  "sxs": "qualityComparisonSxS",
  "sxsRationale": "qualityComparisonSxSRationale",
  "f6_07_category": "modelConnectsTheDotsForMe1TransparencyAttributionCategory",
  "f6_07_option": "Didn\u2019t ground/attribute for sensitive info",
  "f6_07_crossHead": "modelIsTrustworthySafe1TrustSafety",
  "f6_08_heads": [
   "modelMakesUseOfAvailableUserData1OverPersonalization",
   "modelConnectsTheDotsForMe1OverTransparency"
  ]
 },
 "locale": {
  "language": "English",
  "dialect": "United States"
 }
};
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

// prq-validator -- Layer L2 (artifact integrity, content anchoring and identity, computed from
// the FETCHED bytes of the linked Drive files): F3-01..F3-11, F4-A..F4-H, F5-01..F5-03, F6-06,
// F7-03. Shared by projects 941 (es-419) and 942 (zh-CN).
//
// ARCHITECTURE: a second sub-validator alongside validatePrqL1, called independently by the
// wrapper. It re-resolves the payload shape for itself rather than sharing state with L1 --
// 939's validateContinuity/validate903 pattern, 944's L1/L2 pair.
//
// PROVENANCE: the algorithms here are PORTED from 903's v3.2.32 pipeline (ctrl99 block
// extraction, Model ID / footprints extraction, the mode-selector aria-label extractor, RTF
// detection) as paid-for learnings, NOT wholesale-embedded the way 939 did it. 939 had to
// blanket-suppress two whole finding families after embedding 903 against a form whose Prompt
// field means something different; on 941/942 the client doc is explicit that Prompt is the
// Turn 1 starting prompt on BOTH sides, so F4-A is LIVE and that suppression is not carried
// (requirements section 4 REMOVED-ON-FORK). 898's identity map, KNOWN_PAIRS and namespace tokens are
// gone; the identity table below ships EMPTY and is populated from the first real batch.
//
// SANDBOX REALITY (944 v2.0.1 / v2.0.4 incidents, enforced as build gates):
//   - the isolate injects NO timers -- there is no setTimeout here; per-fetch timeouts are
//     host-side and land here as an F3-03 fetch failure
//   - fetches run CONCURRENTLY via Promise.allSettled, never a serial await-in-loop
//   - only drive.google.com FILE links are fetched; the helper hard-rejects other hosts, so
//     "trying anyway" would turn F3-01's non-Drive WARNING into a false F3-03 error
//   - the helper hands back PARSED JSON for JSON files; re-serialised here
//   - HTML uploads run to megabytes: each is reduced to the projections the checks need and its
//     raw bytes are released as the loop advances (the isolate is capped at 256MB)
//
// This source stays 7-bit ASCII: every non-ASCII character is a \uXXXX escape. The builder
// asserts ASCII output too (944 v1.0.1: a paste layer mangled literal non-ASCII and the tool
// rejected the script at save time).
//
// CHECK IDS IMPLEMENTED HERE:
//   F3-01 F3-02 F3-03 F3-04 F3-05 F3-06 F3-07 F3-08 F3-09 F3-10 F3-11 F3-12 F3-13
//   F4-A F4-B F4-C F4-D F4-E F4-F F4-G F4-H
//   F5-01 F5-02 F5-03 F5-06 F5-07
//   F6-06
//   F7-03

async function validatePrqFetch(conversationData) {
  const CFG = {
 "version": "1.1.0",
 "projectId": 948,
 "modelA": "Mode 23 -> Yakitori - Fast",
 "modelB": "Mode 23 -> Prod Frozen - Fast",
 "perSide": [
  "numberOfTurns",
  "testResponse1DebugInfo",
  "testResponse2DebugInfo",
  "model1TestResponse3DebugInfo",
  "model1TestResponse4DebugInfo",
  "model1TestResponse5DebugInfo",
  "model1HtmlFileUpload",
  "model1PersonalizationTriggering",
  "modelMakesUseOfAvailableUserData1MissedContext",
  "modelMakesUseOfAvailableUserData1MissedContextCategory",
  "modelMakesUseOfAvailableUserData1MissedContextTurns",
  "modelMakesUseOfAvailableUserData1Clarification",
  "modelMakesUseOfAvailableUserData1ClarificationCategory",
  "modelMakesUseOfAvailableUserData1ClarificationTurns",
  "modelMakesUseOfAvailableUserData1OverPersonalization",
  "modelMakesUseOfAvailableUserData1OverPersonalizationCategory",
  "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction",
  "modelMakesUseOfAvailableUserData1OverPersonalizationTurns",
  "modelMakesUseOfAvailableUserData1PersonalDataErrors",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns",
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns",
  "modelConnectsTheDotsForMe1TransparencyAttribution",
  "modelConnectsTheDotsForMe1TransparencyAttributionCategory",
  "modelConnectsTheDotsForMe1TransparencyAttributionTurns",
  "modelConnectsTheDotsForMe1OverTransparency",
  "modelConnectsTheDotsForMe1OverTransparencyCategory",
  "modelConnectsTheDotsForMe1OverTransparencyDetraction",
  "modelConnectsTheDotsForMe1OverTransparencyTurns",
  "modelIsTrustworthySafe1TrustSafety",
  "modelIsTrustworthySafe1TrustSafetyCategory",
  "modelIsTrustworthySafe1TrustSafetyTurns",
  "modelRespectsMyCorrections1Corrections",
  "modelRespectsMyCorrections1CorrectionsDirection",
  "modelRespectsMyCorrections1CorrectionsTurns",
  "testModelOverallPersonalizationQuality",
  "testModelOverallQuality",
  "testModelOverallQualityRationale",
  "secondModelLock"
 ],
 "taskFields": [
  "setupCheck",
  "targetLanguage",
  "dialect",
  "prompt",
  "conversationalGoal",
  "personalizationExpectation",
  "firstModel",
  "qualityComparisonSxS",
  "qualityComparisonSxSRationale",
  "privacyGate"
 ],
 "labels": {
  "setupCheck": "Setup Checks Required",
  "bp1": "bp1",
  "targetLanguage": "Target Language",
  "dialect": "Dialect",
  "prompt": "Prompt",
  "conversationalGoal": "Conversational Goal",
  "personalizationExpectation": "Personalization Expectation",
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
  "model1PersonalizationTriggering": "Model Personalization Triggering",
  "modelMakesUseOfAvailableUserData1MissedContext": "Model Makes Use of Available User Data - 1. Missed Context",
  "modelMakesUseOfAvailableUserData1MissedContextCategory": "Model Makes Use of Available User Data - 1. Missed Context Category",
  "modelMakesUseOfAvailableUserData1MissedContextTurns": "Model Makes Use of Available User Data - 1. Missed Context Turns",
  "modelMakesUseOfAvailableUserData1Clarification": "Model Makes Use of Available User Data - 1. Clarification",
  "modelMakesUseOfAvailableUserData1ClarificationCategory": "Model Makes Use of Available User Data - 1. Clarification Category",
  "modelMakesUseOfAvailableUserData1ClarificationTurns": "Model Makes Use of Available User Data - 1. Clarification Turns",
  "modelMakesUseOfAvailableUserData1OverPersonalization": "Model Makes Use of Available User Data - 1. Over-Personalization",
  "modelMakesUseOfAvailableUserData1OverPersonalizationCategory": "Model Makes Use of Available User Data - 1. Over-Personalization Category",
  "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction": "Model Makes Use of Available User Data - 1. Over-Personalization Detraction",
  "modelMakesUseOfAvailableUserData1OverPersonalizationTurns": "Model Makes Use of Available User Data - 1. Over-Personalization Turns",
  "modelMakesUseOfAvailableUserData1PersonalDataErrors": "Model Makes Use of Available User Data - 1. Personal Data Errors",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory": "Model Makes Use of Available User Data - 1. Personal Data Errors Category",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns": "Model Makes Use of Available User Data - 1. Personal Data Errors Turns",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage": "Model Feels Like It Gets Me - 1. Speaks My \"Language\"",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns": "Model Feels Like It Gets Me - 1. Speaks My \"Language\" Turns",
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture": "Model Feels Like It Gets Me - 1. Insights, Patterns & the Bigger Picture",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory": "Model Feels Like It Gets Me - 1. Insights, Patterns & the Bigger Picture Category",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns": "Model Feels Like It Gets Me - 1. Insights, Patterns & the Bigger Picture - Turns",
  "modelConnectsTheDotsForMe1TransparencyAttribution": "Model Connects the Dots for Me - 1. Transparency & Attribution",
  "modelConnectsTheDotsForMe1TransparencyAttributionCategory": "Model Connects the Dots for Me - 1. Transparency & Attribution Category",
  "modelConnectsTheDotsForMe1TransparencyAttributionTurns": "Model Connects the Dots for Me - 1. Transparency & Attribution - Turns",
  "modelConnectsTheDotsForMe1OverTransparency": "Model Connects the Dots for Me - 1. Over-Transparency",
  "modelConnectsTheDotsForMe1OverTransparencyCategory": "Model Connects the Dots for Me - 1. Over-Transparency Category",
  "modelConnectsTheDotsForMe1OverTransparencyDetraction": "Model Connects the Dots for Me - 1. Over-Transparency - Detraction",
  "modelConnectsTheDotsForMe1OverTransparencyTurns": "Model Connects the Dots for Me - 1. Over-Transparency - Turns",
  "modelIsTrustworthySafe1TrustSafety": "Model Is Trustworthy & Safe - 1. Trust & Safety",
  "modelIsTrustworthySafe1TrustSafetyCategory": "Model Is Trustworthy & Safe - 1. Trust & Safety - Category",
  "modelIsTrustworthySafe1TrustSafetyTurns": "Model Is Trustworthy & Safe - 1. Trust & Safety - Turns",
  "modelRespectsMyCorrections1Corrections": "Model Respects My Corrections - 1. Corrections",
  "modelRespectsMyCorrections1CorrectionsDirection": "Model Respects My Corrections - 1. Corrections - Direction",
  "modelRespectsMyCorrections1CorrectionsTurns": "Model Respects My Corrections - 1. Corrections - Turns",
  "testModelOverallPersonalizationQuality": "Model Holistic Assessment - 1. Overall Personalization Quality",
  "testModelOverallQuality": "Model Holistic Assessment - 1. Overall Quality",
  "testModelOverallQualityRationale": "Model Holistic Assessment - 1. Overall Quality Rationale",
  "secondModelLock": "Critical Requirement",
  "qualityComparisonSxS": "Quality Comparison SxS",
  "qualityComparisonSxSRationale": "Quality Comparison SxS Rationale",
  "privacyGate": "Privacy Gate"
 },
 "options": {
  "targetLanguage": [
   "Arabic",
   "Assamese",
   "Bengali",
   "Bhojpuri",
   "Bulgarian",
   "Burmese",
   "Chinese",
   "Croatian",
   "Czech",
   "Danish",
   "Dutch",
   "English",
   "Finnish",
   "French",
   "German",
   "Greek",
   "Gujarati",
   "Hebrew",
   "Hindi",
   "Hungarian",
   "Indonesian",
   "Italian",
   "Japanese",
   "Javanese",
   "Kannada",
   "Khmer",
   "Korean",
   "Maithili",
   "Malay",
   "Malayalam",
   "Marathi",
   "Nepali",
   "Norwegian",
   "Odia",
   "Persian",
   "Polish",
   "Portuguese",
   "Punjabi",
   "Romanian",
   "Russian",
   "Sanskrit",
   "Slovak",
   "Spanish",
   "Swahili",
   "Swedish",
   "Tagalog",
   "Tamil",
   "Telugu",
   "Thai",
   "Turkish",
   "Ukrainian",
   "Urdu",
   "Vietnamese"
  ],
  "dialect": [
   "Modern Standard",
   "India",
   "Bulgaria",
   "Myanmar",
   "Mainland (Simplified)",
   "Taiwan (Traditional)",
   "Hong Kong (Cantonese)",
   "Croatia",
   "Czech Republic",
   "Denmark",
   "Netherlands",
   "Belgium (Flemish)",
   "United Kingdom",
   "United States",
   "Australia",
   "Finland",
   "France",
   "Canada",
   "Belgium",
   "Germany",
   "Modern",
   "Israel",
   "Hungary",
   "Indonesia",
   "Italy",
   "Japan",
   "Cambodia",
   "Korea",
   "Malaysia",
   "Nepal",
   "Norway",
   "Afghanistan",
   "Poland",
   "Brazil",
   "Pakistan",
   "Romania",
   "Moldova",
   "Russia",
   "Slovakia",
   "LatAm (All Variants)",
   "Kenya",
   "Tanzania",
   "Sweden",
   "Philippines",
   "Sri Lanka",
   "Thailand",
   "Turkey",
   "Ukraine",
   "Vietnam",
   "Portugal "
  ],
  "personalizationExpectation": [
   "A lot \u2014 A generic answer would miss important things about my situation.",
   "Somewhat \u2014 Personal touches would help, but aren't essential.",
   "Not really \u2014 I just need a good answer."
  ],
  "firstModel": [
   "Mode 23 -> Yakitori - Fast",
   "Mode 23 -> Prod Frozen - Fast"
  ],
  "numberOfTurns": [
   "1",
   "2",
   "3",
   "4",
   "5"
  ],
  "model1PersonalizationTriggering": [
   "Personalized (Personal Data)",
   "Personalized (Response Preference)",
   "Personalized (Time & Location)",
   "Not Personalized"
  ],
  "modelMakesUseOfAvailableUserData1MissedContext": [
   "N/A - No personalization needed",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelMakesUseOfAvailableUserData1MissedContextCategory": [
   "Missed requested fact",
   "Missed directly supporting evidence",
   "Missed hard constraint",
   "Missed life context",
   "Missed granularity"
  ],
  "modelMakesUseOfAvailableUserData1MissedContextTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelMakesUseOfAvailableUserData1Clarification": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelMakesUseOfAvailableUserData1ClarificationCategory": [
   "Over-clarification",
   "Under-clarification"
  ],
  "modelMakesUseOfAvailableUserData1ClarificationTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelMakesUseOfAvailableUserData1OverPersonalization": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelMakesUseOfAvailableUserData1OverPersonalizationCategory": [
   "Forced connection",
   "Tunnel vision",
   "Cherrypicked details"
  ],
  "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction": [
   "Not at all",
   "Somewhat",
   "Completely"
  ],
  "modelMakesUseOfAvailableUserData1OverPersonalizationTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelMakesUseOfAvailableUserData1PersonalDataErrors": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory": [
   "Used wrong personal info",
   "Used stale context",
   "Incorrect inference",
   "Overconfident speculation",
   "Personal misattribution",
   "Locational confusion",
   "Temporal confusion"
  ],
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory": [
   "Missed general insights & patterns",
   "Missed the \"why\"",
   "Overgeneralized insights"
  ],
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelConnectsTheDotsForMe1TransparencyAttribution": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelConnectsTheDotsForMe1TransparencyAttributionCategory": [
   "Didn't explain personal relevance",
   "Didn't ground hard constraints",
   "Didn\u2019t ground/attribute for sensitive info",
   "Didn't attribute surprising content",
   "Didn't ground when asked",
   "Didn't attribute when asked"
  ],
  "modelConnectsTheDotsForMe1TransparencyAttributionTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelConnectsTheDotsForMe1OverTransparency": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelConnectsTheDotsForMe1OverTransparencyCategory": [
   "Overnarrating",
   "Showing off",
   "Failed to hedge"
  ],
  "modelConnectsTheDotsForMe1OverTransparencyDetraction": [
   "Not at all",
   "Somewhat",
   "Completely"
  ],
  "modelConnectsTheDotsForMe1OverTransparencyTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelIsTrustworthySafe1TrustSafety": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelIsTrustworthySafe1TrustSafetyCategory": [
   "Inappropriate use of sensitive data",
   "Missing grounding/attribution for sensitive info",
   "Offensive / intrusive"
  ],
  "modelIsTrustworthySafe1TrustSafetyTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "modelRespectsMyCorrections1Corrections": [
   "N/A",
   "No issues",
   "Minor issues",
   "Major issues"
  ],
  "modelRespectsMyCorrections1CorrectionsDirection": [
   "Ignored correction",
   "Overgeneralized correction"
  ],
  "modelRespectsMyCorrections1CorrectionsTurns": [
   "1",
   "2",
   "3",
   "4",
   "5",
   "N/A"
  ],
  "testModelOverallPersonalizationQuality": [
   "Very dissatisfied",
   "Somewhat dissatisfied",
   "Neither satisfied nor dissatisfied",
   "Somewhat satisfied",
   "Very satisfied"
  ],
  "testModelOverallQuality": [
   "Very dissatisfied",
   "Somewhat dissatisfied",
   "Neither satisfied nor dissatisfied",
   "Somewhat satisfied",
   "Very satisfied"
  ],
  "qualityComparisonSxS": [
   "Conversation A was much better",
   "Conversation A was better",
   "Conversation A was slightly better",
   "Conversation A and B were about the same",
   "Conversation B was slightly better",
   "Conversation B was better",
   "Conversation B was much better"
  ]
 },
 "types": {
  "setupCheck": "CHECKBOX",
  "bp1": "BREAKPOINT",
  "targetLanguage": "SINGLE_CHOICE",
  "dialect": "SINGLE_CHOICE",
  "prompt": "FREE_TEXT",
  "conversationalGoal": "FREE_TEXT",
  "personalizationExpectation": "SINGLE_CHOICE",
  "firstModel": "SINGLE_CHOICE",
  "preQuestionsBreakpoint": "BREAKPOINT",
  "compareModels": "SIDE_BY_SIDE_COMPARISON",
  "bp2": "BREAKPOINT",
  "numberOfTurns": "SINGLE_CHOICE",
  "testResponse1DebugInfo": "FREE_TEXT",
  "testResponse2DebugInfo": "FREE_TEXT",
  "model1TestResponse3DebugInfo": "FREE_TEXT",
  "model1TestResponse4DebugInfo": "FREE_TEXT",
  "model1TestResponse5DebugInfo": "FREE_TEXT",
  "model1HtmlFileUpload": "FREE_TEXT",
  "model1PersonalizationTriggering": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1MissedContext": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1MissedContextCategory": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1MissedContextTurns": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1Clarification": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1ClarificationCategory": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1ClarificationTurns": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1OverPersonalization": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1OverPersonalizationCategory": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1OverPersonalizationTurns": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1PersonalDataErrors": "SINGLE_CHOICE",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory": "MULTIPLE_CHOICE",
  "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns": "MULTIPLE_CHOICE",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage": "SINGLE_CHOICE",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns": "MULTIPLE_CHOICE",
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture": "SINGLE_CHOICE",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory": "MULTIPLE_CHOICE",
  "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns": "MULTIPLE_CHOICE",
  "modelConnectsTheDotsForMe1TransparencyAttribution": "SINGLE_CHOICE",
  "modelConnectsTheDotsForMe1TransparencyAttributionCategory": "MULTIPLE_CHOICE",
  "modelConnectsTheDotsForMe1TransparencyAttributionTurns": "MULTIPLE_CHOICE",
  "modelConnectsTheDotsForMe1OverTransparency": "SINGLE_CHOICE",
  "modelConnectsTheDotsForMe1OverTransparencyCategory": "MULTIPLE_CHOICE",
  "modelConnectsTheDotsForMe1OverTransparencyDetraction": "SINGLE_CHOICE",
  "modelConnectsTheDotsForMe1OverTransparencyTurns": "MULTIPLE_CHOICE",
  "modelIsTrustworthySafe1TrustSafety": "SINGLE_CHOICE",
  "modelIsTrustworthySafe1TrustSafetyCategory": "MULTIPLE_CHOICE",
  "modelIsTrustworthySafe1TrustSafetyTurns": "MULTIPLE_CHOICE",
  "modelRespectsMyCorrections1Corrections": "SINGLE_CHOICE",
  "modelRespectsMyCorrections1CorrectionsDirection": "MULTIPLE_CHOICE",
  "modelRespectsMyCorrections1CorrectionsTurns": "MULTIPLE_CHOICE",
  "testModelOverallPersonalizationQuality": "SINGLE_CHOICE",
  "testModelOverallQuality": "SINGLE_CHOICE",
  "testModelOverallQualityRationale": "FREE_TEXT",
  "secondModelLock": "CHECKBOX",
  "qualityComparisonSxS": "SINGLE_CHOICE",
  "qualityComparisonSxSRationale": "FREE_TEXT",
  "privacyGate": "CHECKBOX"
 },
 "gates": [
  {
   "child": "bp2",
   "parent": "numberOfTurns",
   "values": [
    "1",
    "2",
    "3",
    "4",
    "5"
   ],
   "op": "eq"
  },
  {
   "child": "testResponse1DebugInfo",
   "parent": "numberOfTurns",
   "values": [
    "1",
    "2",
    "3",
    "4",
    "5"
   ],
   "op": "eq"
  },
  {
   "child": "testResponse2DebugInfo",
   "parent": "numberOfTurns",
   "values": [
    "2",
    "3",
    "4",
    "5"
   ],
   "op": "eq"
  },
  {
   "child": "model1TestResponse3DebugInfo",
   "parent": "numberOfTurns",
   "values": [
    "3",
    "4",
    "5"
   ],
   "op": "eq"
  },
  {
   "child": "model1TestResponse4DebugInfo",
   "parent": "numberOfTurns",
   "values": [
    "5",
    "4"
   ],
   "op": "eq"
  },
  {
   "child": "model1TestResponse5DebugInfo",
   "parent": "numberOfTurns",
   "values": [
    "5"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1MissedContextCategory",
   "parent": "modelMakesUseOfAvailableUserData1MissedContext",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1MissedContextTurns",
   "parent": "modelMakesUseOfAvailableUserData1MissedContext",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1ClarificationCategory",
   "parent": "modelMakesUseOfAvailableUserData1Clarification",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1ClarificationTurns",
   "parent": "modelMakesUseOfAvailableUserData1Clarification",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1OverPersonalizationCategory",
   "parent": "modelMakesUseOfAvailableUserData1OverPersonalization",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction",
   "parent": "modelMakesUseOfAvailableUserData1OverPersonalization",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1OverPersonalizationTurns",
   "parent": "modelMakesUseOfAvailableUserData1OverPersonalization",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory",
   "parent": "modelMakesUseOfAvailableUserData1PersonalDataErrors",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns",
   "parent": "modelMakesUseOfAvailableUserData1PersonalDataErrors",
   "values": [
    "Major issues",
    "Minor issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns",
   "parent": "modelFeelsLikeItGetsMe1SpeaksMyLanguage",
   "values": [
    "Major issues",
    "Minor issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory",
   "parent": "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns",
   "parent": "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelConnectsTheDotsForMe1TransparencyAttributionCategory",
   "parent": "modelConnectsTheDotsForMe1TransparencyAttribution",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelConnectsTheDotsForMe1TransparencyAttributionTurns",
   "parent": "modelConnectsTheDotsForMe1TransparencyAttribution",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelConnectsTheDotsForMe1OverTransparencyCategory",
   "parent": "modelConnectsTheDotsForMe1OverTransparency",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelConnectsTheDotsForMe1OverTransparencyDetraction",
   "parent": "modelConnectsTheDotsForMe1OverTransparency",
   "values": [
    "Major issues",
    "Minor issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelConnectsTheDotsForMe1OverTransparencyTurns",
   "parent": "modelConnectsTheDotsForMe1OverTransparency",
   "values": [
    "Major issues",
    "Minor issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelIsTrustworthySafe1TrustSafetyCategory",
   "parent": "modelIsTrustworthySafe1TrustSafety",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelIsTrustworthySafe1TrustSafetyTurns",
   "parent": "modelIsTrustworthySafe1TrustSafety",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelRespectsMyCorrections1CorrectionsDirection",
   "parent": "modelRespectsMyCorrections1Corrections",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  },
  {
   "child": "modelRespectsMyCorrections1CorrectionsTurns",
   "parent": "modelRespectsMyCorrections1Corrections",
   "values": [
    "Minor issues",
    "Major issues"
   ],
   "op": "eq"
  }
 ],
 "heads": [
  "modelMakesUseOfAvailableUserData1MissedContext",
  "modelMakesUseOfAvailableUserData1Clarification",
  "modelMakesUseOfAvailableUserData1OverPersonalization",
  "modelMakesUseOfAvailableUserData1PersonalDataErrors",
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage",
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture",
  "modelConnectsTheDotsForMe1TransparencyAttribution",
  "modelConnectsTheDotsForMe1OverTransparency",
  "modelIsTrustworthySafe1TrustSafety",
  "modelRespectsMyCorrections1Corrections"
 ],
 "i18nHeads": [],
 "childrenOf": {
  "modelMakesUseOfAvailableUserData1MissedContext": {
   "category": "modelMakesUseOfAvailableUserData1MissedContextCategory",
   "turns": "modelMakesUseOfAvailableUserData1MissedContextTurns"
  },
  "modelMakesUseOfAvailableUserData1Clarification": {
   "category": "modelMakesUseOfAvailableUserData1ClarificationCategory",
   "turns": "modelMakesUseOfAvailableUserData1ClarificationTurns"
  },
  "modelMakesUseOfAvailableUserData1OverPersonalization": {
   "category": "modelMakesUseOfAvailableUserData1OverPersonalizationCategory",
   "detraction": "modelMakesUseOfAvailableUserData1OverPersonalizationDetraction",
   "turns": "modelMakesUseOfAvailableUserData1OverPersonalizationTurns"
  },
  "modelMakesUseOfAvailableUserData1PersonalDataErrors": {
   "category": "modelMakesUseOfAvailableUserData1PersonalDataErrorsCategory",
   "turns": "modelMakesUseOfAvailableUserData1PersonalDataErrorsTurns"
  },
  "modelFeelsLikeItGetsMe1SpeaksMyLanguage": {
   "turns": "modelFeelsLikeItGetsMe1SpeaksMyLanguageTurns"
  },
  "modelFeelsLikeItGetsMe1InsightsPatternsAndTheBiggerPicture": {
   "category": "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureCategory",
   "turns": "modelFeelsLikeItGetsMe1InsightsPatternsTheBiggerPictureTurns"
  },
  "modelConnectsTheDotsForMe1TransparencyAttribution": {
   "category": "modelConnectsTheDotsForMe1TransparencyAttributionCategory",
   "turns": "modelConnectsTheDotsForMe1TransparencyAttributionTurns"
  },
  "modelConnectsTheDotsForMe1OverTransparency": {
   "category": "modelConnectsTheDotsForMe1OverTransparencyCategory",
   "detraction": "modelConnectsTheDotsForMe1OverTransparencyDetraction",
   "turns": "modelConnectsTheDotsForMe1OverTransparencyTurns"
  },
  "modelIsTrustworthySafe1TrustSafety": {
   "category": "modelIsTrustworthySafe1TrustSafetyCategory",
   "turns": "modelIsTrustworthySafe1TrustSafetyTurns"
  },
  "modelRespectsMyCorrections1Corrections": {
   "category": "modelRespectsMyCorrections1CorrectionsDirection",
   "turns": "modelRespectsMyCorrections1CorrectionsTurns"
  }
 },
 "debugSlotKeys": [
  "testResponse1DebugInfo",
  "testResponse2DebugInfo",
  "model1TestResponse3DebugInfo",
  "model1TestResponse4DebugInfo",
  "model1TestResponse5DebugInfo"
 ],
 "anchors": {
  "turns": "numberOfTurns",
  "q1": "model1PersonalizationTriggering",
  "html": "model1HtmlFileUpload",
  "sat7a": "testModelOverallPersonalizationQuality",
  "sat7b": "testModelOverallQuality",
  "rationale7c": "testModelOverallQualityRationale",
  "secondModelLock": "secondModelLock",
  "setupCheck": "setupCheck",
  "privacyGate": "privacyGate",
  "prompt": "prompt",
  "conversationalGoal": "conversationalGoal",
  "personalizationExpectation": "personalizationExpectation",
  "firstModel": "firstModel",
  "targetLanguage": "targetLanguage",
  "dialect": "dialect",
  "sxs": "qualityComparisonSxS",
  "sxsRationale": "qualityComparisonSxSRationale",
  "f6_07_category": "modelConnectsTheDotsForMe1TransparencyAttributionCategory",
  "f6_07_option": "Didn\u2019t ground/attribute for sensitive info",
  "f6_07_crossHead": "modelIsTrustworthySafe1TrustSafety",
  "f6_08_heads": [
   "modelMakesUseOfAvailableUserData1OverPersonalization",
   "modelConnectsTheDotsForMe1OverTransparency"
  ]
 },
 "locale": {
  "language": "English",
  "dialect": "United States"
 }
};
  if (!CFG) return;   // L1 already reported the missing-tables error; never double-report.
  const VERSION = 'prq-validator-' + CFG.projectId + '-L2-v' + CFG.version;
  const A = CFG.anchors;
  const errorsBefore = errors.length, warningsBefore = warnings.length;

  // The ONE place this address is written (section 9 row 13: it must equal the harness credential's
  // client_email, verified on the harness before every deploy). Carried verbatim from the
  // deployed 903/939 scripts -- see metadata.yml: this string is UNDER REVIEW as a suspected
  // truncation of "labeling-tool-g-svc@...", and a wrong address here sends every sharing fix
  // to a dead end.
  const FETCH_SERVICE_ACCOUNT = 'beling-tool-g-svc@turing-gpt.iam.gserviceaccount.com';

  // ===== adapter (duplicated from L1 by design -- see the file header) =====
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
  if (!ratingsHit) { logs.push(VERSION + ': no ratings root -- L1 reports this; artifact layer self-skips.'); return; }
  const byKey = {};
  const labelByKey = {};
  if (Array.isArray(ratingsHit.value)) {
    for (const r of ratingsHit.value) if (r && typeof r.key === 'string') { byKey[r.key] = unwrap(r); if (r.question) labelByKey[r.key] = r.question; }
  } else {
    for (const [k, v] of Object.entries(ratingsHit.value)) byKey[k] = unwrap(v);
  }
  const META_NAMES = ['model a', 'model b', 'first model', 'prompt type', 'target language', 'dialect',
                      'additional rater instruction', 'rater instruction', 'task type', 'destination folder', 'batch'];
  const isMetaBag = (n) => {
    if (n === ratingsHit.value) return false;
    if (Array.isArray(n)) return n.length > 0 && n.every((e) => e && typeof e === 'object' && !Array.isArray(e)) && n.some((e) => Object.keys(e).some((k) => META_NAMES.includes(String(k).trim().toLowerCase())));
    if (n && typeof n === 'object') return Object.keys(n).some((k) => META_NAMES.includes(String(k).trim().toLowerCase()));
    return false;
  };
  const metaHit = findByShape(conversationData, isMetaBag);
  const meta = {};
  if (metaHit) {
    for (const e of (Array.isArray(metaHit.value) ? metaHit.value : [metaHit.value])) {
      if (e && typeof e === 'object') for (const [k, v] of Object.entries(e)) { const uv = unwrap(v); if (uv !== null && typeof uv !== 'object') meta[k] = uv; }
    }
  }
  const findMeta = (name) => {
    const want = String(name).toLowerCase();
    const keys = Object.keys(meta);
    const exact = keys.find((k) => k.trim().toLowerCase() === want);
    const k = exact || keys.find((kk) => kk.trim().toLowerCase().includes(want));
    return k ? { key: k, value: String(meta[k] === null || meta[k] === undefined ? '' : meta[k]).trim() } : null;
  };

  // ==========================================================================
  // section 5 NORMALIZATION LADDER -- identical to L1's. ONE ladder, two copies by design (the two
  // sub-validators share no state). Order is load-bearing:
  //   1 CRLF/CR -> LF   2 strip BOM   3 strip the Gemini omission marker   4 strip [cite: ...]
  //   5 NFC   6 strip zero-width + U+FFFD   7 curly quotes/apostrophes -> straight, dashes ->
  //   hyphen-minus   8 collapse all Unicode whitespace (NBSP, U+3000) to one space, trim
  // NOT applied: NFKC / half-width folding. zh-CN full-width forms stay DISTINCT by design;
  // the width probe at the end of this file decides whether that ever changes.
  // ==========================================================================
  const OMISSION_MARKER = '[Content of all requested items is omitted here because it may be found above or below.]';
  const rawStr = (v) => (typeof v === 'string' ? v : (v === null || v === undefined ? '' : String(v)));
  let replacementCharTotal = 0;
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

  const OVERLAP_TIER = 90;   // section 5 step 9: word-level Jaccard tolerance; percentage printed
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
  // Equality through the tolerance tier; returns the percentage so callers can print evidence.
  const softEq = (a, b) => {
    if (eqN(a, b)) return { ok: true, pct: 100, exact: true };
    const pct = overlapPct(a, b);
    return { ok: pct >= OVERLAP_TIER, pct: pct, exact: false };
  };
  // Containment through the same tier: does `needle` appear inside `hay`?
  const softIn = (needle, hay) => {
    const n = norm(needle), h = norm(hay);
    if (!n) return { ok: true, pct: 100, exact: true };
    if (h.indexOf(n) >= 0) return { ok: true, pct: 100, exact: true };
    // Containment is tested on the FOLDED text too, so softIn and softEq agree character for
    // character (they did not before -- see the foldTokens note).
    const nf = foldTokens(needle), hf = foldTokens(hay);
    if (nf && hf.indexOf(nf) >= 0) return { ok: true, pct: 100, exact: true };
    const wn = [...new Set(nf.split(' ').filter(Boolean))];
    if (!wn.length) return { ok: true, pct: 100, exact: true };
    const hl = hf;
    let hit = 0;
    for (const w of wn) if (hl.indexOf(w) >= 0) hit++;
    const pct = Math.round((hit / wn.length) * 1000) / 10;
    return { ok: pct >= OVERLAP_TIER, pct: pct, exact: false };
  };
  const isBlank = (v) => {
    if (v === null || v === undefined || v === false) return true;
    if (Array.isArray(v)) return v.length === 0 || v.every((x) => isBlank(x));
    const s = rawStr(v).trim();
    return s === '' || s.toLowerCase() === 'none';
  };
  const filled = (v) => !isBlank(v);
  const intOf = (v) => { const s = norm(v); if (!/^\d+$/.test(s)) return null; const n = parseInt(s, 10); return Number.isFinite(n) ? n : null; };
  // A-04 model-name canonicalization: arrow SPELLINGS unified, then either "->" or a BARE ">"
  // collapsed in ONE pass, whitespace collapsed, case-folded. The bare ">" matters: the
  // configured Test name is "PContext Mode 23 (Nippon) > Mochi - Fast", and 903 split on
  // "\s>\s" for the same reason on the 877 names. One pass, not two: replacing ">" first would
  // also eat the ">" inside "->" and mangle every arrow-style name.
  // EXACT canonical full-string match only -- never substring, never by position.
  const canonModel = (s) => norm(s).replace(/\u2192|\u21d2|=>|-->/g, '->').replace(/\s*(?:->|>)\s*/g, '->').toLowerCase();
  const optCanon = (s) => norm(s).toLowerCase();
  // Option equality -- same rule as L1's (see the note there). The short-form rule applies ONLY
  // when one side carries no separator at all; a looser shared-first-segment rule read two
  // differently-decorated values that merely share a prefix as the same answer.
  const OPT_SEP = /\s*[-:]\s*/;
  const sameOpt = (a, b) => {
    const x = optCanon(a), y = optCanon(b);
    if (x === y) return true;
    const xs = x.split(OPT_SEP), ys = y.split(OPT_SEP);
    if (xs.length === 1 && ys.length > 1) return ys[0].trim() === x;
    if (ys.length === 1 && xs.length > 1) return xs[0].trim() === y;
    return false;
  };

  // ===== side binding (A-04, same rule as L1: exact canonical match, never by position) =====
  const byCanon = new Map([[canonModel(CFG.modelA), 'test'], [canonModel(CFG.modelB), 'base']]);
  const nsMap = new Map();
  for (const fullKey of Object.keys(byKey)) {
    for (const q of CFG.perSide) {
      if (fullKey === q || !fullKey.endsWith('.' + q)) continue;
      const nsTail = fullKey.slice(0, fullKey.length - q.length - 1).replace(/^compareModels\./, '');
      if (!nsTail || nsTail === '__config__') break;
      const c = canonModel(nsTail);
      let hit = byCanon.has(c) ? c : null;
      if (!hit) for (const cc of byCanon.keys()) { if (c.endsWith('.' + cc)) { hit = cc; break; } }
      if (hit) { if (!nsMap.has(hit)) nsMap.set(hit, {}); nsMap.get(hit)[q] = fullKey; }
      break;
    }
  }
  const sides = [
    { role: 'Test', slot: 'test', name: CFG.modelA },
    { role: 'Base', slot: 'base', name: CFG.modelB },
  ].map((d) => {
    const f = nsMap.get(canonModel(d.name)) || null;
    return { role: d.role, slot: d.slot, name: d.name, scope: d.name, present: !!f,
      get: (q) => (f && f[q] !== undefined ? byKey[f[q]] : undefined),
      keyOf: (q) => (f && f[q] !== undefined ? f[q] : q) };
  });
  const bound = sides.filter((s) => s.present);
  if (!bound.length) { logs.push(VERSION + ': no side bound -- L1 reports this; artifact layer self-skips.'); return; }

  // ===== section 6 message contract =====
  const labelOf = (k) => labelByKey[k] || CFG.labels[baseOf(k)] || k;
  const fileLinks = {};
  const emit = (bucket, scope, fieldKey, turn, problem, fix, why) => {
    let m = '[' + scope + (turn ? ' Turn ' + turn : '') + ' - "' + labelOf(fieldKey) + '"] | Problem: ' + problem + ' | Fix: ' + fix;
    if (why) m += ' | Why: ' + why;
    if (fileLinks[fieldKey]) m += ' | File: ' + fileLinks[fieldKey];   // A-08
    (bucket === 'error' ? errors : warnings).push(m);
  };
  const err = (scope, fieldKey, turn, problem, fix, why) => emit('error', scope, fieldKey, turn, problem, fix, why);
  const warn = (scope, fieldKey, turn, problem, fix, why) => emit('warning', scope, fieldKey, turn, problem, fix, why);

  // ==========================================================================
  // F3-01  LINK SHAPE. Each debug and HTML field must hold EXACTLY ONE Google Drive FILE link
  // and nothing else. Fact 6 is UNPROVEN until the first export: if ops confirms a PASTE
  // protocol instead (escalation 1), this family inverts -- paste expected, link the violation.
  // Until then a pasted debug capture is recognised and reported as the protocol mismatch it
  // is, rather than as a bare "no link found".
  // ==========================================================================
  const URL_RE = /https?:\/\/[^\s'"<>]+/gi;
  const DRIVE_FILE_RE = /^https?:\/\/(?:www\.)?drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?)/i;
  const DRIVE_HOST_RE = /^https?:\/\/(?:[a-z0-9-]+\.)?(?:drive|docs)\.google\.com\//i;
  const DRIVE_FOLDER_RE = /^https?:\/\/(?:www\.)?drive\.google\.com\/drive\/[^\s]*folders\//i;
  const PASTED_DEBUG_MARKERS = ['<ctrl99>', '<ctrl100>', 'LM Prefix', 'Model ID:', 'num_turns_read_from_footprints', 'BAS->', 'Agency config id', 'Recipe ID'];
  const PASTED_HTML_RE = /<!doctype|<html\b|<head\b|<body\b/i;
  const driveId = (u) => {
    const s = rawStr(u);
    let m = s.match(/\/folders\/([^/?#\s]+)/i); if (m) return 'folder:' + m[1];
    m = s.match(/\/(?:file\/)?d\/([^/?#\s]+)/i); if (m) return m[1];
    m = s.match(/[?&]id=([^&#\s]+)/i); if (m) return m[1];
    return null;
  };
  // Batch destination folder(s) named in the metadata, so a folder link pasted UNCHANGED is
  // reported as exactly that rather than as a generic "this is a folder" finding.
  const batchFolderIds = new Set();
  for (const v of Object.values(meta)) {
    for (const u of (rawStr(v).match(URL_RE) || [])) {
      const id = driveId(u);
      if (id && id.indexOf('folder:') === 0) batchFolderIds.add(id);
    }
  }

  const SHARE_FIX = 'open the file in Drive, set sharing so anyone with the link can view it (or share it with ' + FETCH_SERVICE_ACCOUNT + '), then re-paste the link.';
  const slots = [];   // { scope, role, slot, fieldKey, family, turn, url, id }
  const addSlot = (side, fieldKey, family, turn, raw) => {
    const s = rawStr(raw);
    const urls = s.match(URL_RE) || [];
    if (urls.length && !fileLinks[fieldKey]) fileLinks[fieldKey] = urls[0];
    if (isBlank(s)) return;   // F1-03 / F1-05 own emptiness; never double-report
    if (!urls.length && PASTED_DEBUG_MARKERS.some((mk) => s.indexOf(mk) >= 0)) {
      err(side.scope, fieldKey, turn, 'the debug information was pasted in as text instead of being uploaded and linked.',
        'upload this turn\'s debug info as a file to the batch destination folder, then paste that file\'s link here.',
        'no link found; the pasted text carries debug markers.');   // F3-01
      return;
    }
    if (!urls.length && PASTED_HTML_RE.test(s)) {
      err(side.scope, fieldKey, turn, 'the page source was pasted in as text instead of being uploaded and linked.',
        'upload the saved conversation page as a file to the batch destination folder, then paste that file\'s link here.',
        'no link found; the pasted text is page source.');   // F3-01
      return;
    }
    if (!urls.length) {
      err(side.scope, fieldKey, turn, 'no link was found in this field.',
        'upload the file to the batch destination folder and paste its Drive link here.',
        'submitted text: "' + norm(s).slice(0, 120) + '".');   // F3-01
      return;
    }
    if (urls.length > 1) {
      err(side.scope, fieldKey, turn, 'this field holds ' + urls.length + ' links; it takes exactly one.',
        'keep only the link for this ' + (family === 'debug' ? 'turn\'s debug info' : 'conversation page') + ' and delete the rest.',
        'links found: ' + urls.join(' , ') + '.');   // F3-01
      return;
    }
    const url = urls[0];
    const leftover = norm(s.split(url).join(' '));
    if (leftover.length > 0) {
      // ERROR, not a warning: golden task 1271273 (a clean submission on this same batch) holds
      // ONLY the link in all four debug slots, which settles that commentary here is a rater
      // deviation and not the protocol. 939's continuity-checks.js:94 treats it as an error too.
      // The link is still extracted and fetched below, so the content checks all still run.
      err(side.scope, fieldKey, turn, 'this field holds the link plus other text; it takes the link on its own.',
        'move your observations into the rationale question and leave only the file link here.',
        'extra text: "' + leftover.slice(0, 120) + '".');   // F3-01
    }
    if (DRIVE_FOLDER_RE.test(url)) {
      const id = driveId(url);
      const isBatchFolder = !!(id && batchFolderIds.has(id));
      err(side.scope, fieldKey, turn, isBatchFolder
        ? 'this is the batch destination folder link, pasted unchanged -- not a link to the file inside it.'
        : 'this is a link to a Drive folder, not to a file.',
        'open the folder, click the ' + (family === 'debug' ? 'debug info file for this turn' : 'saved conversation page') + ', copy THAT file\'s link, and paste it here.',
        'folder link: ' + url + '.');   // F3-01
      return;
    }
    if (!DRIVE_FILE_RE.test(url)) {
      if (DRIVE_HOST_RE.test(url)) {
        err(side.scope, fieldKey, turn, 'this Drive link does not point at a specific file.',
          'open the file in Drive, use Share then Copy link, and paste that link here.',
          'link: ' + url + '.');   // F3-01
      } else {
        err(side.scope, fieldKey, turn, 'this link is not a Google Drive link, so the file behind it cannot be opened for review.',
          'upload the file to the batch destination folder in Drive and paste its Drive link here.',
          'link host: ' + url.replace(/^(https?:\/\/[^/]+).*$/, '$1') + '.');   // F3-01
      }
      return;
    }
    slots.push({ scope: side.scope, role: side.role, slot: side.slot, fieldKey: fieldKey, family: family, turn: turn, url: url, id: driveId(url) });
  };

  const declared = new Map();
  for (const side of bound) {
    declared.set(side.slot, intOf(side.get(A.turns)));
    const n = declared.get(side.slot);
    // Only the slots the form actually SHOWS are candidates: 1..N. A slot beyond N is F2-05's.
    const upto = n === null ? CFG.debugSlotKeys.length : Math.min(n, CFG.debugSlotKeys.length);
    for (let t = 1; t <= upto; t++) addSlot(side, side.keyOf(CFG.debugSlotKeys[t - 1]), 'debug', t, side.get(CFG.debugSlotKeys[t - 1]));
    addSlot(side, side.keyOf(A.html), 'html', null, side.get(A.html));
  }

  // ==========================================================================
  // F3-02  SAME DRIVE FILE ID IN TWO PLACES. Canonical id compared, full URL displayed.
  // ==========================================================================
  {
    const byId = new Map();
    for (const s of slots) { if (!s.id) continue; if (!byId.has(s.id)) byId.set(s.id, []); byId.get(s.id).push(s); }
    for (const [id, group] of byId) {
      if (group.length < 2) continue;
      const where = group.map((g) => '[' + g.scope + (g.turn ? ' Turn ' + g.turn : '') + ' - "' + labelOf(g.fieldKey) + '"]').join(' and ');
      const crossSide = new Set(group.map((g) => g.slot)).size > 1;
      const crossFamily = new Set(group.map((g) => g.family)).size > 1;
      const anchor = group[group.length - 1];
      err(anchor.scope, anchor.fieldKey, anchor.turn,
        'the same Drive file is linked in ' + group.length + ' places: ' + where + '.'
        + (crossSide ? ' Each model needs its own files.' : '')
        + (crossFamily ? ' A debug capture and a saved conversation page cannot be the same file.' : ''),
        'upload the missing file' + (group.length === 2 ? '' : 's') + ' and paste ' + (group.length === 2 ? 'its' : 'their') + ' own link' + (group.length === 2 ? '' : 's') + ' -- one file per slot.',
        'Drive file id "' + id + '"; links: ' + group.map((g) => g.url).join(' , ') + '.');   // F3-02
    }
  }

  if (!slots.length) { logs.push(VERSION + ': no well-formed Drive file link to fetch; the link-shape findings above stand alone.'); return; }

  // ==========================================================================
  // FETCH -- concurrent, one retry, no in-script timers (see the file header).
  // ==========================================================================
  const attemptOnce = async (url) => {
    try {
      const c = await fetchDataFromDriveLink(url);
      if (typeof c === 'string' && c.trim().length > 0) return { ok: true, content: c };
      if (c !== null && c !== undefined && typeof c !== 'string') return { ok: true, content: JSON.stringify(c) };
      return { ok: false, reason: 'the file read back empty' };
    } catch (e) {
      return { ok: false, reason: (e && e.message) ? e.message : String(e) };
    }
  };
  // The retry is deadline-gated (944 v2.0.4): a dead link burns a full host timeout, and on a
  // task with many slots a second round can push the script past the 30s budget -- which
  // surfaces as an abandoned promise, not as a finding. Past the gate, report the first failure.
  const RETRY_DEADLINE_MS = 12000;
  const tStart = Date.now();
  const fetchWithRetry = async (url) => {
    const first = await attemptOnce(url);
    if (first.ok) return first;
    if (Date.now() - tStart > RETRY_DEADLINE_MS) return { ok: false, reason: first.reason + ' (not retried: the fetch budget was spent)' };
    const second = await attemptOnce(url);
    return second.ok ? second : { ok: false, reason: second.reason + ' (after one retry)' };
  };
  const t0 = Date.now();
  const settled = await Promise.allSettled(slots.map((s) => fetchWithRetry(s.url)));
  logs.push(VERSION + ': fetched ' + slots.length + ' Drive file link(s) in ' + (Date.now() - t0) + 'ms.');

  // ==========================================================================
  // F3-03  FETCH FAILURE CLASSIFICATION. Sharing / permission / 404 is a rater-fixable ERROR
  // carrying the share-with-service-account fix. An auth / OAuth / platform failure is NOT the
  // rater's doing: it routes to the lead and never becomes a rater finding. Content checks for
  // that slot skip either way.
  // ==========================================================================
  const SHARING_RE = /permission|not shared|forbidden|403|404|not found|no access|cannot access|access denied|does not exist/i;
  const PLATFORM_RE = /oauth|unauthorized|401|invalid[_ ]grant|credential|token|quota|rate limit|429|5\d\d|timed out|timeout|network|econn|socket/i;

  // ===== decode / classify helpers, ported from 903 =====
  const RTF_RE = /^\s*\{\\rtf/i;
  const decodeEntities = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  const stripTags = (s) => s.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const HTML_HEAD_RE = /^\s*(<!doctype|<html|<head|<meta)/i;
  // A .docx or other binary cannot be read as text at all: OOXML zips start with "PK".
  const looksBinary = (s) => /^PK\u0003\u0004/.test(s) || /^%PDF-/.test(s) || (s.slice(0, 2000).match(/\u0000/g) || []).length > 4;
  const rtfToText = (s) => s
    .replace(/\{\\\*[\s\S]*?\}/g, ' ')
    .replace(/\\'([0-9a-f]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u(-?\d+)\s?\??/g, (m, d) => { const c = parseInt(d, 10); return String.fromCharCode(c < 0 ? c + 65536 : c); })
    .replace(/\\par[d]?\b/g, '\n')
    .replace(/\\line\b/g, '\n')
    .replace(/\\[a-z]+-?\d*\s?/gi, ' ')
    .replace(/[{}]/g, ' ');
  // A-06: count and log U+FFFD per slot (bytes a decoder already replaced upstream).
  const countFFFD = (s) => (s.match(/\ufffd/g) || []).length;

  // F3-04: the Mode 23 marker set. Deliberately does NOT require "Model ID:" -- Mode 23 may
  // emit "Recipe ID:" / "Agency config id:" instead (section 9 row 5). ZERO markers = wrong file.
  const DEBUG_MARKERS = ['<ctrl99>', 'LM Prefix', 'LM prefix', 'Model ID:', 'Recipe ID', 'Agency config id',
                         'num_turns_read_from_footprints', 'BAS->', 'reagent_trace'];
  const HTML_MARKERS = ['<!doctype', '<html', '<head', '<body'];
  // F3-07: a saved GEMINI conversation page, not merely any HTML file.
  const GEMINI_PAGE_MARKERS = ['bard-mode-menu-button', 'gemini.google.com', 'model-response', 'user-query',
                               'conversation-container', 'bard-', 'mat-icon'];

  // F3-06: slice classification -- FULL / AGENCY-SLICE / ALS-SLICE / UNKNOWN, logged per slot.
  // Drives F6-06 and F5 availability. Three states everywhere downstream: present /
  // absent-from-artifact / out-of-sanctioned-slice; only the first two are reportable.
  // "sian_profile" alone is NOT a usable marker: every Mode 23 capture carries the config flag
  // "enable_sian_profile: true" whether or not any personal context was actually attached, so
  // matching it classified a share as FULL on the strength of a feature flag. The real evidence
  // is the personal-context payload itself -- "Source Profile:" blocks and the footprints line.
  const FULL_MARKERS = ['Source Profile:', 'DATA_SOURCE_USER_PROFILE_', 'Personal Context', 'num_turns_read_from_footprints'];
  const AGENCY_MARKERS = ['Agency config id', 'BAS->', 'agency'];
  const ALS_MARKERS = ['assistant_level_signals', 'als_', 'ALS'];
  const classifySlice = (text) => {
    if (FULL_MARKERS.some((m) => text.indexOf(m) >= 0)) return 'FULL';
    const ag = AGENCY_MARKERS.some((m) => text.indexOf(m) >= 0);
    const als = ALS_MARKERS.some((m) => text.indexOf(m) >= 0);
    if (ag) return 'AGENCY-SLICE';
    if (als) return 'ALS-SLICE';
    return 'UNKNOWN';
  };

  // ===== ported extractors (903 v3.2.32) =====
  // Anchored on the "<ctrl99>user" OPEN marker rather than a strict
  // "<ctrl99>user\n ... <ctrl100>" block: real captures vary in what follows the role token
  // (LF in the reference sample, CRLF from a Windows-saved file, tags in a Doc/HTML export,
  // "\n" as two literal characters when the blob arrives JSON-encoded). 944 v2.0.2 was a
  // production false block caused by the strict form; that lesson is carried here.
  const extractUserBlocks = (blob) => {
    const out = [];
    const re = /<ctrl99>\s*user\b[^\S\n]*\n?([\s\S]*?)(?=<ctrl100>|<ctrl99>|$)/gi;
    let m;
    while ((m = re.exec(blob)) !== null) {
      const t = norm(m[1]);
      if (t) out.push(t);
    }
    return out;
  };
  const extractModelIds = (blob) => {
    const out = [];
    const re = /^\s*Model ID:\s*(\S+)\s*$/gm;
    let m;
    while ((m = re.exec(blob)) !== null) out.push(m[1]);
    return out;
  };
  // IDENTITY on Mode 23. The Mode 23 captures carry NO "Model ID:" line at all (verified on
  // golden tasks 1271273 and 1271348: zero occurrences in all eight debug files), so keying F5
  // on it left the entire identity family dormant -- a swapped debug pair passed silently.
  // "Agency config id" IS present, in BOTH the debug and the saved page, and discriminates:
  //   Yakitori    bard/gemini_chat/0.2.170-prod-p13n-memory-strike-0828-stm-v2p5-token-budget-...
  //   Prod Frozen bard/gemini_chat/0.2.171-prod-p13n-prod-frozen-baseline
  // 903 v3.2.32 already used it this way (its lines 1223, 1352, 1482). Model ID / Recipe ID are
  // kept as secondary signals for batches that do emit them.
  const extractAgencyIds = (blob) => {
    const out = [];
    const re = /Agency config id:\s*"?([^"\n\r]+?)"?\s*$/gim;
    let m;
    while ((m = re.exec(blob)) !== null) { const v = m[1].trim(); if (v) out.push(v); }
    return out;
  };
  // Every debug capture and every saved page embeds the llmdebugger session links for the turns
  // it covers. The token is a per-response session id, so it is a DECISIVE same-chat proof --
  // far stronger than text overlap, which cannot work here at all because the saved page embeds
  // the debug dump verbatim (see the visible-conversation note below). 903:1348 does the same.
  const extractSessionTokens = (blob) => {
    const out = [];
    const re = /llmdebugger\.corp\.google\.com\/agency\?s=([^\s"'<>)&]+)/gi;
    let m;
    while ((m = re.exec(decodeEntities(rawStr(blob)))) !== null) out.push(m[1]);
    return [...new Set(out)];
  };
  // VISIBLE CONVERSATION. The saved page contains the whole Debug Info dump, so testing the form
  // prompt against stripTags(whole page) put the debug text INSIDE the haystack and made F3-08 /
  // F3-10 nearly impossible to fail. Extract only what the reader actually sees -- the
  // <user-query> and <model-response> elements -- as 903:546-586 does. Verified to return
  // exactly the 2 questions and 2 responses on all four saved pages across both golden tasks.
  const htmlToText = (h) => decodeEntities(rawStr(h).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  const extractVisiblePrompts = (html) => {
    const out = [];
    const re = /<user-query[\s>][\s\S]*?<\/user-query>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const lines = [...m[0].matchAll(/class="[^"]*query-text-line[^"]*"[^>]*>([\s\S]*?)<\/p>/gi)].map((x) => htmlToText(x[1]));
      const t = (lines.length ? lines.join(' ') : htmlToText(m[0])).trim();
      if (t) out.push(norm(t));
    }
    return out;
  };
  const extractVisibleResponses = (html) => {
    const out = [];
    const re = /<model-response[\s>][\s\S]*?<\/model-response>/gi;
    let m;
    while ((m = re.exec(html)) !== null) { const t = htmlToText(m[0]); if (t) out.push(norm(t)); }
    return out;
  };
  const extractFootprints = (blob) => {
    const m = rawStr(blob).match(/num_turns_read_from_footprints:\s*(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };
  // F3-09: the mode-selector label on the saved page. Prefers the TRAILING QUOTED SEGMENT of
  // the aria-label sentence (straight, curly and CJK quote pairs) before falling back to 903's
  // ", currently ..." / last-colon heuristics -- the Gemini UI phrases this label differently
  // per locale, and the quoted model name is the stable part of it.
  const QUOTE_PAIRS = [['"', '"'], ['\u201c', '\u201d'], ['\u2018', '\u2019'],
                       ['\u300c', '\u300d'], ['\u300e', '\u300f'], ['\uff02', '\uff02']];
  const trailingQuoted = (s) => {
    let best = null;
    for (const pair of QUOTE_PAIRS) {
      const ci = s.lastIndexOf(pair[1]);
      if (ci <= 0) continue;
      const oi = s.lastIndexOf(pair[0], ci - 1);
      if (oi < 0 || ci - oi < 2) continue;
      if (best === null || oi > best.oi) best = { oi: oi, text: s.slice(oi + 1, ci) };
    }
    return best ? norm(best.text) : '';
  };
  const extractModeSelector = (rawHtml) => {
    let aria = '';
    const anchor = rawHtml.search(/data-test-id=(['"])bard-mode-menu-button\1/i);
    if (anchor >= 0) {
      const mf = rawHtml.slice(anchor, anchor + 1500).match(/aria-label=(['"])([\s\S]*?)\1/i);
      if (mf) aria = mf[2];
      if (!aria) {
        const start = rawHtml.lastIndexOf('<button', anchor);
        const gt = rawHtml.indexOf('>', anchor);
        if (start >= 0 && gt > start) {
          const m = rawHtml.slice(start, gt).match(/aria-label=(['"])([\s\S]*?)\1/i);
          if (m) aria = m[2];
        }
      }
    }
    if (!aria) {
      const m2 = rawHtml.match(/aria-label=(['"])([^'"]*?(?:mode selector|selector de modo|seletor de modo|\u9009\u62e9\u6a21\u5f0f|\u6a21\u5f0f)[^'"]*)\1/i);
      if (m2) aria = m2[2];
    }
    aria = decodeEntities(aria).trim();
    if (aria) {
      const q = trailingQuoted(aria);
      if (q) return q;
      let cand = aria;
      const cm = cand.match(/,\s*currently\s+([\s\S]+)$/i);
      if (cm) cand = cm[1];
      const after = cand.indexOf(':') >= 0 ? cand.slice(cand.lastIndexOf(':') + 1) : cand;
      const out = norm(after);
      if (out) return out;
    }
    if (anchor >= 0) {
      const mv = rawHtml.slice(anchor, anchor + 800).match(/>\s*([^<>]{2,60}?)\s*<(?:gem-icon|mat-icon|span)/i);
      if (mv) return norm(decodeEntities(mv[1]));
    }
    return '';
  };
  const extractConversationId = (rawHtml) => {
    const m = rawHtml.match(/gemini\.google\.com\/app\/([a-z0-9_-]{8,})/i) || rawHtml.match(/["']c_([a-f0-9]{8,})["']/i);
    return m ? m[1] : '';
  };
  // F3-09 suffix compare: the Gemini UI shows a codename layer ("Nippon - Prod Frozen - Fast")
  // while the form assigns the platform name ("Mode 23 -> Prod Frozen - Fast"). Strip the
  // leading codename / mode segment on both sides and compare what actually DISCRIMINATES the
  // two variants; fire only when the suffixes differ, which is a genuine swap.
  // The separator set MUST include a bare ">": when the Test model was renamed to
  // "PContext Mode 23 (Nippon) > Mochi - Fast", a set of only {"->", " - "} split first at the
  // " - " before "Fast", leaving the discriminator as "fast" while the page read "mochifast" --
  // an error on EVERY Test-side task. Covered by a fixture in both directions.
  const discriminator = (s) => norm(s)
    .replace(/\u2192|\u21d2|=>|-->/g, '->')
    .split(/->|>|\s-\s/)   // a BARE ">" is a separator too: the Test name uses "(Nippon) > Mochi".
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(1)                       // drop the leading codename / "Mode 23" layer
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  const fullCanon = (s) => norm(s).toLowerCase().replace(/[^a-z0-9]+/g, '');

  // ==========================================================================
  // REDUCE each fetched file to the projections its checks need, releasing the raw bytes as the
  // loop advances (256MB isolate cap; HTML uploads run to megabytes -- 944 v2.0.4 died at 849MB
  // RSS retaining three full copies of every artifact).
  // ==========================================================================
  const HTML_TEXT_CAP = 600000;   // normalized-text projection retained per page
  const hashOf = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
  const results = [];
  for (let i = 0; i < slots.length; i++) {
    const c = slots[i];
    const r = settled[i].status === 'fulfilled' ? settled[i].value : { ok: false, reason: settled[i].reason ? String(settled[i].reason) : 'the fetch was rejected' };
    settled[i] = null;   // release this slot's reference to the fetched bytes
    if (!r.ok) {
      const reason = r.reason || 'the fetch failed';
      if (PLATFORM_RE.test(reason) && !SHARING_RE.test(reason)) {
        logs.push('[ROUTE TO LEAD] F3-03 platform-side fetch failure on ' + c.scope + (c.turn ? ' Turn ' + c.turn : '') + ' "' + labelOf(c.fieldKey) + '": ' + reason + ' (link: ' + c.url + '). NOT reported to the rater; content checks for this slot skip.');
      } else {
        err(c.scope, c.fieldKey, c.turn, 'the linked file could not be opened for review.', SHARE_FIX, reason + '; link: ' + c.url + '.');   // F3-03
      }
      results.push({ scope: c.scope, role: c.role, slot: c.slot, fieldKey: c.fieldKey, family: c.family, turn: c.turn, url: c.url, id: c.id, ok: false });
      continue;
    }
    const fp = r.content.length + ':' + hashOf(r.content);
    const fffd = countFFFD(r.content);
    replacementCharTotal += fffd;
    if (fffd) logs.push('A-06: ' + fffd + ' replacement character(s) (U+FFFD) in ' + c.scope + (c.turn ? ' Turn ' + c.turn : '') + ' "' + labelOf(c.fieldKey) + '" -- the ladder strips them before any compare.');

    if (c.family === 'debug') {
      // Read-if-readable: RTF is a FORMAT error but the content is still analysed; an HTML/Doc
      // export that decodes cleanly passes silently; a .docx/binary cannot be read at all.
      let text = r.content;
      let formatNote = '';
      if (looksBinary(text)) {
        err(c.scope, c.fieldKey, c.turn, 'this file is not a readable text export, so its contents cannot be reviewed.',
          'export the debug info as plain text (or as a Google Doc) and upload that instead of a Word or PDF file.',
          'the file\'s contents are binary, not text; link: ' + c.url + '.');   // F3-04
        results.push({ scope: c.scope, role: c.role, slot: c.slot, fieldKey: c.fieldKey, family: c.family, turn: c.turn, url: c.url, id: c.id, ok: false });
        continue;
      }
      if (RTF_RE.test(text)) {
        text = rtfToText(text);
        formatNote = 'RTF';
        warn(c.scope, c.fieldKey, c.turn, 'this file was saved as rich text (RTF) rather than plain text.',
          'save the debug info as plain text next time -- its contents were still read for this review.',
          'the file starts with an RTF signature; link: ' + c.url + '.');   // F3-04
      } else if (HTML_HEAD_RE.test(text.slice(0, 400)) || /&lt;ctrl99&gt;/.test(text)) {
        text = decodeEntities(stripTags(text));
        formatNote = 'HTML/Doc export (decoded silently)';
      }
      if (!DEBUG_MARKERS.some((mk) => text.indexOf(mk) >= 0)) {
        err(c.scope, c.fieldKey, c.turn, 'this file does not look like Gemini debug information.',
          'confirm you uploaded this turn\'s debug info, then re-paste that file\'s link.',
          'none of the markers a debug capture always carries were found; read ' + text.length + ' characters; link: ' + c.url + '.');   // F3-04
        results.push({ scope: c.scope, role: c.role, slot: c.slot, fieldKey: c.fieldKey, family: c.family, turn: c.turn, url: c.url, id: c.id, ok: false });
        continue;
      }
      const users = extractUserBlocks(text);
      const ids = extractModelIds(text);
      const agency = extractAgencyIds(text);
      const tokens = extractSessionTokens(text);
      const fps = extractFootprints(text);
      const slice = classifySlice(text);
      logs.push('F3-06 ' + c.scope + ' Turn ' + c.turn + ': slice=' + slice + ', user blocks=' + users.length + ', Model ID line(s)=' + ids.length + ', agency id(s)=' + (agency.length ? agency.map((x) => '"' + x + '"').join(' | ') : 'NONE') + ', session token(s)=' + tokens.length + ', footprints=' + (fps === null ? 'absent' : fps) + (formatNote ? ', format=' + formatNote : '') + '.');
      results.push({ scope: c.scope, role: c.role, slot: c.slot, fieldKey: c.fieldKey, family: c.family, turn: c.turn, url: c.url, id: c.id,
        ok: true, text: text, users: users, slice: slice, modelIds: ids, agency: agency, tokens: tokens, footprints: fps, fp: fp });
      continue;
    }

    // family === 'html'
    {
      const head = r.content.slice(0, 4096).toLowerCase();
      if (!HTML_MARKERS.some((mk) => head.indexOf(mk) >= 0)) {
        err(c.scope, c.fieldKey, c.turn, 'this file is not a saved web page.',
          'save the conversation as an HTML page from the browser, upload that file, and paste its link here.',
          'the file does not start like an HTML document; link: ' + c.url + '.');   // F3-07
        results.push({ scope: c.scope, role: c.role, slot: c.slot, fieldKey: c.fieldKey, family: c.family, turn: c.turn, url: c.url, id: c.id, ok: false });
        continue;
      }
      const lower = r.content.slice(0, 200000).toLowerCase();
      const geminiHits = GEMINI_PAGE_MARKERS.filter((mk) => lower.indexOf(mk.toLowerCase()) >= 0);
      if (!geminiHits.length) {
        err(c.scope, c.fieldKey, c.turn, 'this page is not a saved Gemini conversation.',
          'save the Gemini conversation page itself, upload that file, and paste its link here.',
          'none of the markers a saved Gemini page carries were found; link: ' + c.url + '.');   // F3-07
        results.push({ scope: c.scope, role: c.role, slot: c.slot, fieldKey: c.fieldKey, family: c.family, turn: c.turn, url: c.url, id: c.id, ok: false });
        continue;
      }
      const modeLabel = extractModeSelector(r.content);
      const convId = extractConversationId(r.content);
      const agency = extractAgencyIds(r.content);
      const tokens = extractSessionTokens(r.content);
      // Only the VISIBLE conversation is retained, never the whole page: the page embeds the
      // Debug Info dump, so whole-page containment was self-satisfying, and a multi-megabyte
      // retained string is exactly the isolate-memory shape 944 v2.0.4 died on. A few KB now.
      const vPrompts = extractVisiblePrompts(r.content);
      const vResponses = extractVisibleResponses(r.content);
      const convText = vPrompts.concat(vResponses).join(' \n ').slice(0, HTML_TEXT_CAP);
      logs.push('F3-09 ' + c.scope + ': page mode-selector label ' + (modeLabel ? '"' + modeLabel + '"' : 'NOT FOUND') + '; conversation id ' + (convId || 'not found') + '; agency id(s)=' + (agency.length ? agency.map((x) => '"' + x + '"').join(' | ') : 'NONE') + '; session token(s)=' + tokens.length + '; visible turns=' + vPrompts.length + ' question(s) / ' + vResponses.length + ' response(s).');
      if (!vPrompts.length) logs.push('F3 note: ' + c.scope + ' page yielded NO visible questions -- the saved-page markup may have changed; F3-08/F3-10/F3-13 self-skip for this side rather than fire on an extraction failure.');
      results.push({ scope: c.scope, role: c.role, slot: c.slot, fieldKey: c.fieldKey, family: c.family, turn: c.turn, url: c.url, id: c.id,
        ok: true, prompts: vPrompts, responses: vResponses, text: convText, modeLabel: modeLabel, convId: convId, agency: agency, tokens: tokens, fp: fp });
    }
  }
  if (replacementCharTotal) logs.push('A-06: ' + replacementCharTotal + ' replacement character(s) across all fetched files on this task.');

  const okDebug = results.filter((r) => r.family === 'debug' && r.ok);
  const okHtml = results.filter((r) => r.family === 'html' && r.ok);
  const debugOf = (slot, turn) => okDebug.find((r) => r.slot === slot && r.turn === turn) || null;
  const htmlOf = (slot) => okHtml.find((r) => r.slot === slot) || null;
  const formPrompt = byKey[A.prompt];

  // F7-04: branch mode -- the branched side has no Turn 1 of its own, so Turn 1 anchoring is
  // exempt there. Data-driven and dormant unless the metadata triggers it; logged when active.
  const branchMeta = ((findMeta('rater instruction') || {}).value || '') + ' ' + ((findMeta('l2') || {}).value || '');
  const branchActive = /\bbranch(ed|ing)?\b/i.test(branchMeta) && /attribution|second turn|2nd turn/i.test(branchMeta);
  if (branchActive) logs.push('F7-04 ACTIVE: attribution branch mode -- Turn 1 prompt anchoring (F4-A and F4-D on Turn 1) is exempt on the branched side.');

  // ==========================================================================
  // F3-05  Header markers present but ZERO <ctrl99>user blocks. BOTH sanctioned slices carry
  // the LM prefix, so user blocks are expected in EVERY legal slice -- zero means a truncated
  // file or an incomplete download. Re-fetch once; only a reproduced result is reported, and
  // the wording covers both causes.
  // ==========================================================================
  for (const r of okDebug) {
    if (r.users.length > 0) continue;
    const again = await attemptOnce(r.url);
    let stillEmpty = true;
    if (again.ok) {
      let t2 = again.content;
      if (RTF_RE.test(t2)) t2 = rtfToText(t2);
      else if (HTML_HEAD_RE.test(t2.slice(0, 400)) || /&lt;ctrl99&gt;/.test(t2)) t2 = decodeEntities(stripTags(t2));
      const u2 = extractUserBlocks(t2);
      if (u2.length > 0) {
        r.users = u2; r.text = t2; stillEmpty = false;
        logs.push('F3-05: ' + r.scope + ' Turn ' + r.turn + ' returned conversation blocks on the second read -- the first read was incomplete.');
      }
    }
    if (stillEmpty) {
      err(r.scope, r.fieldKey, r.turn, 'this debug file carries the header information but none of the conversation itself.',
        're-export the complete debug info for this turn from the top of the panel, upload it, and re-paste the link -- if the file looks complete in Drive, download it again and check it is not cut short.',
        'the file was read twice and both reads ended before any conversation block; read ' + r.text.length + ' characters.');   // F3-05
    }
  }
  const usableDebug = okDebug.filter((r) => r.users.length > 0);

  // ==========================================================================
  // F4  CONTENT ANCHORING. Every compare goes through the section 5 ladder; the overlap percentage is
  // printed whenever the tolerance tier decides the outcome.
  // ==========================================================================
  // EXPORT SHAPE, decided per side before any F4 compare. Gemini debug captures come in two
  // legitimate shapes and F4-A/B/C mean different things in each -- 944 v2.0.2/v2.0.3 were both
  // production false blocks caused by assuming one shape:
  //   CUMULATIVE -- turn t's capture replays the whole conversation so far, so it carries t
  //     user blocks: the FIRST is the starting prompt and the LAST is turn t's own question.
  //   FLAT -- turn t's capture carries only turn t, so its single block IS turn t's question.
  // The requirements state F4-A ("every turn's first user block equals the form prompt"),
  // F4-B ("turn N>1 last user block equals the form prompt") and F4-C ("turn N-1's last block
  // appears in turn N's debug") unconditionally. Taken literally, each one false-fires on one
  // of the two shapes: F4-A and F4-C on a FLAT export, F4-B on a CUMULATIVE one. So each is
  // scoped to the shape in which it is decidable, and the shape is logged per side:
  //   F4-A  turn 1 always; turns >1 only on a CUMULATIVE side
  //   F4-B  only on a FLAT side (there the last block is that turn's whole question)
  //   F4-C  only on a CUMULATIVE side (a flat capture cannot contain the previous turn)
  // Turn 1 anchoring (F4-A, F4-D) is unconditional on every shape, so a wrong Turn 1 conversation
  // is still caught either way. See metadata.yml: this scoping is a NAMED DEVIATION from the
  // literal requirement text and wants a ruling with the first real export (section 9 row 5).
  for (const side of bound) {
    const n = declared.get(side.slot);
    const upto = n === null ? CFG.debugSlotKeys.length : Math.min(n, CFG.debugSlotKeys.length);
    const exemptTurn1 = branchActive && side.slot === 'base';
    const mine = [];
    for (let t = 1; t <= upto; t++) { const d = debugOf(side.slot, t); if (d && d.users.length) mine.push(d); }
    if (!mine.length) continue;
    const later = mine.filter((d) => d.turn > 1);
    const cumulative = later.length > 0 && later.every((d) => d.users.length >= d.turn);
    const flat = later.length > 0 && later.every((d) => d.users.length === 1);
    const shape = cumulative ? 'CUMULATIVE' : (flat ? 'FLAT' : (later.length ? 'MIXED' : 'SINGLE-TURN'));
    logs.push('F4 export shape on ' + side.scope + ': ' + shape + ' (user blocks per turn: ' + mine.map((d) => 'T' + d.turn + '=' + d.users.length).join(', ') + '). F4-A on turn 1' + (cumulative ? ' and all later turns' : ' only') + '; F4-B ' + (flat ? 'live' : 'skipped') + '; F4-C ' + (cumulative ? 'live' : 'skipped') + '.');
    if (shape === 'MIXED' && later.length) {
      logs.push('F4 note: ' + side.scope + ' fits neither export shape cleanly -- cross-turn continuity (F4-C) and the later-turn prompt anchor (F4-A) are both skipped for this side rather than guessed. Turn 1 anchoring still applies.');
    }

    for (const d of mine) {
      const t = d.turn;
      const first = d.users[0], last = d.users[d.users.length - 1];

      // F4-A: the conversation's FIRST question is the starting prompt. The client doc is
      // explicit (Prompt = the starting prompt, ONE Pre-Conversation block per task), so this
      // is LIVE on 941/942 -- 939's blanket suppression is not carried (section 4). It also
      // enforces cross-side Turn 1 identity transitively. Symmetric wording: either the Prompt
      // field or the capture could be the wrong one.
      if (filled(formPrompt) && !(exemptTurn1 && t === 1) && (t === 1 || cumulative)) {
        const m = softEq(first, formPrompt);
        if (!m.ok) {
          err(side.scope, d.fieldKey, t, 'this turn\'s conversation starts with a different question than the "' + labelOf(A.prompt) + '" you submitted.',
            'confirm the debug info is from the conversation you ran for this task, and that "' + labelOf(A.prompt) + '" holds the prompt you actually started with -- correct whichever one is wrong.',
            'submitted prompt: "' + norm(formPrompt).slice(0, 160) + '"; this file starts with: "' + first.slice(0, 160) + '"; word overlap ' + m.pct + '% (needs ' + OVERLAP_TIER + '%).');   // F4-A
        }
      }

      // F4-D: Turn 1 is a single prompt, so its first and last user blocks are the same one.
      if (t === 1 && !exemptTurn1 && d.users.length > 1) {
        const m = softEq(first, last);
        if (!m.ok) {
          err(side.scope, d.fieldKey, t, 'this Turn 1 debug file contains more than one question from you.',
            'upload the debug info captured right after the FIRST response, before you asked anything else.',
            'the file holds ' + d.users.length + ' questions; the first is "' + first.slice(0, 100) + '" and the last is "' + last.slice(0, 100) + '"; word overlap ' + m.pct + '%.');   // F4-D
        }
      }

      // F4-B: on a FLAT export a later turn's file holds only that turn's question, and the
      // doc has the same starting prompt opening both sides -- so a flat later-turn file whose
      // question is not the prompt is either the wrong file or a retyped question. A rater may
      // legitimately retype, so this WARNS: 898's error severity is not inherited.
      if (t > 1 && flat && filled(formPrompt)) {
        const m = softEq(last, formPrompt);
        if (!m.ok) {
          warn(side.scope, d.fieldKey, t, 'the question in this turn\'s debug is not the prompt you submitted.',
            'check this is the right turn\'s debug info; if you re-worded the question during the conversation, no change is needed.',
            'submitted prompt: "' + norm(formPrompt).slice(0, 140) + '"; question in this file: "' + last.slice(0, 140) + '"; word overlap ' + m.pct + '%.');   // F4-B
        }
      }

      // F4-C: continuity -- on a CUMULATIVE export turn N-1's last question must appear inside
      // turn N's debug. Containment AFTER the omission-marker strip and whitespace
      // normalization (the H5 fix), U+FFFD stripped, the overlap tier as the fallback with the
      // percentage printed. Skips when either slot is unreadable.
      if (t > 1 && cumulative) {
        const prev = debugOf(side.slot, t - 1);
        if (prev && prev.users.length) {
          const prevLast = prev.users[prev.users.length - 1];
          const m = softIn(prevLast, d.text);
          if (!m.ok) {
            err(side.scope, d.fieldKey, t, 'this turn\'s debug does not contain the question from the turn before it, so the two turns are not from the same conversation.',
              'upload the debug info captured from the ongoing conversation for each turn, without starting a new chat between turns.',
              'turn ' + (t - 1) + ' ended with "' + prevLast.slice(0, 140) + '"; that text was not found in turn ' + t + '; word overlap ' + m.pct + '% (needs ' + OVERLAP_TIER + '%).');   // F4-C
          }
        }
      }
    }
  }

  // F4-E: two debug slots with byte-identical fetched content. The culprit is chosen by
  // CONTENT -- whichever slot's block count does not fit its own expected position.
  {
    const byFp = new Map();
    for (const r of usableDebug) { if (!byFp.has(r.fp)) byFp.set(r.fp, []); byFp.get(r.fp).push(r); }
    for (const group of byFp.values()) {
      if (group.length < 2) continue;
      const blocks = group[0].users.length;
      const culprit = group.find((g) => g.turn !== blocks) || group[group.length - 1];
      const others = group.filter((g) => g !== culprit).map((g) => '[' + g.scope + ' Turn ' + g.turn + ']').join(' and ');
      err(culprit.scope, culprit.fieldKey, culprit.turn, 'this debug file is identical to the one in ' + others + ', but each turn is its own separate export.',
        'export the debug info for turn ' + culprit.turn + ' of this model and replace this file.',
        'the files are byte-for-byte identical (' + blocks + ' question' + (blocks === 1 ? '' : 's') + ' in each); links: ' + group.map((g) => g.url).join(' , ') + '.');   // F4-E
    }
  }

  // F4-F: both sides' Turn 1 debug identical in prompt AND response = one chat used for both
  // models. Suppressed by the same decisive rule as F3-11: a different Model ID makes text
  // identity a coincidence, not a defect.
  {
    const a = debugOf('test', 1), b = debugOf('base', 1);
    if (a && b && a.users.length && b.users.length) {
      const same = a.fp === b.fp || (eqN(a.users[0], b.users[0]) && overlapPct(a.text, b.text) >= 99);
      const idA = a.modelIds.length ? a.modelIds[0] : '';
      const idB = b.modelIds.length ? b.modelIds[0] : '';
      const decisivelyDifferent = !!(idA && idB && idA !== idB);
      if (same && !decisivelyDifferent) {
        err(a.scope, a.fieldKey, 1, 'the Turn 1 debug for both models is the same conversation, but each model must be run in its own separate chat.',
          'run the second model in a new chat after deleting the first model\'s history, then upload that conversation\'s own debug info.',
          'both files carry the same first question and the same response text' + (a.fp === b.fp ? ', and are byte-for-byte identical' : '') + '; the other model\'s file is ' + b.url + '.');   // F4-F
      } else if (same && decisivelyDifferent) {
        logs.push('F4-F suppressed: Turn 1 debug text matches across sides but the Model IDs differ ("' + idA + '" vs "' + idB + '") -- decisive evidence of two separate runs.');
      }
    }
  }

  // F4-G / F4-H: footprints delta between the FIRST-run side's Turn 1 and the SECOND-run side's
  // Turn 1, with run order taken from the form's own first-model answer. A drifted signal
  // (v3.2.3), so both directions WARN. Only when both slices carry footprints -- a sanctioned
  // partial slice legitimately has none.
  // Planned replacement (requirements F4-G): side B's Turn 1 prefix carrying side A's LATER-turn
  // content, context-qualified so the shared starting prompt can never trigger it.
  {
    const fm = byKey[A.firstModel];
    let firstSlot = null;
    if (filled(fm)) {
      if (canonModel(fm) === canonModel(CFG.modelA)) firstSlot = 'test';
      else if (canonModel(fm) === canonModel(CFG.modelB)) firstSlot = 'base';
    }
    if (firstSlot === null) {
      logs.push('F4-G/F4-H skipped: the run order is not readable from "' + labelOf(A.firstModel) + '".');
    } else {
      const secondSlot = firstSlot === 'test' ? 'base' : 'test';
      const d1 = debugOf(firstSlot, 1), d2 = debugOf(secondSlot, 1);
      if (!d1 || !d2 || d1.footprints === null || d2.footprints === null) {
        logs.push('F4-G/F4-H skipped: footprints absent from one or both Turn 1 slices (' + (d1 ? d1.footprints : 'no readable file') + ' / ' + (d2 ? d2.footprints : 'no readable file') + ') -- expected on a sanctioned partial slice.');
      } else {
        const delta = d2.footprints - d1.footprints;
        const secondSide = bound.find((s) => s.slot === secondSlot) || bound[0];
        const lock = labelOf(secondSide.keyOf(A.secondModelLock));
        if (delta > 0) {
          warn(d2.scope, d2.fieldKey, 1, 'the second model\'s conversation appears to have started with history from the first model\'s chat still in place.',
            'confirm you deleted the previous Gemini chat before running this model, as "' + lock + '" asks; if you did, no change is needed.',
            'turns read from history: ' + d1.footprints + ' on the first model, ' + d2.footprints + ' on the second (a difference of ' + delta + ').');   // F4-G
        } else if (delta < 0) {
          warn(d1.scope, d1.fieldKey, 1, 'the history counts suggest the two models were run in the opposite order to the one recorded.',
            'check "' + labelOf(A.firstModel) + '" and correct it if you ran the other model first.',
            'turns read from history: ' + d1.footprints + ' on the model recorded as first, ' + d2.footprints + ' on the other (a difference of ' + delta + ').');   // F4-H
        }
      }
    }
  }

  // ==========================================================================
  // F3-08 / F3-09 / F3-10 / F3-11  the saved pages
  // ==========================================================================
  for (const side of bound) {
    const h = htmlOf(side.slot);
    if (!h) continue;
    // F3-08: the page carries the form prompt. Redaction placeholders (Fact 8) ride through the
    // overlap tier rather than being special-cased.
    // Compared against the VISIBLE questions only. Self-skips when extraction found none, so a
    // markup change degrades to a log rather than accusing the rater.
    if (filled(formPrompt) && h.prompts.length) {
      const best = h.prompts.reduce((acc, q) => { const m = softIn(formPrompt, q); return m.pct > acc.pct ? m : acc; }, { ok: false, pct: 0 });
      if (!best.ok) {
        err(side.scope, h.fieldKey, null, 'the saved page does not contain the prompt you submitted, so it does not look like this task\'s conversation.',
          'save and upload the page for the conversation you actually ran for this task.',
          'submitted prompt: "' + norm(formPrompt).slice(0, 160) + '"; the page\'s first question is "' + h.prompts[0].slice(0, 160) + '"; best word overlap ' + best.pct + '% (needs ' + OVERLAP_TIER + '%).');   // F3-08
      }
    }
    // F3-09: the mode selector on the page identifies THIS side's model. Compared on the
    // DISCRIMINATING SUFFIX after the codename layer is stripped, so the Gemini UI's
    // "Nippon - Prod Frozen - Fast" matches the form's "Mode 23 -> Prod Frozen - Fast".
    if (h.modeLabel) {
      const own = discriminator(side.name), onPage = discriminator(h.modeLabel);
      const other = bound.find((s) => s.slot !== side.slot);
      if (own && onPage && own !== onPage) {
        const isOther = !!(other && discriminator(other.name) === onPage);
        err(side.scope, h.fieldKey, null, isOther
          ? 'the page saved for this model is actually the other model\'s conversation.'
          : 'the model shown on the saved page is not the model this page is filed under.',
          isOther
            ? 'swap the two saved pages so each model\'s page sits under that model.'
            : 'confirm the correct model was selected in Gemini for this conversation, and that you uploaded that conversation\'s page.',
          'the page\'s model selector reads "' + h.modeLabel + '"; this slot is for "' + side.name + '".');   // F3-09
      } else if (own && onPage && own === onPage && fullCanon(h.modeLabel) !== fullCanon(side.name)) {
        logs.push('F3-09 ' + side.scope + ': page label "' + h.modeLabel + '" differs from the form name "' + side.name + '" only in the codename layer -- same model, no finding.');
      }
    } else {
      logs.push('F3-09 ' + side.scope + ': no model selector found on the saved page -- this check self-skips for this side.');
    }
    // F3-10: every turn's user question from the debug appears in this side's page.
    const missingTurns = [];
    const n = declared.get(side.slot);
    const upto = n === null ? CFG.debugSlotKeys.length : Math.min(n, CFG.debugSlotKeys.length);
    if (h.prompts.length) {
      for (let t = 1; t <= upto; t++) {
        const d = debugOf(side.slot, t);
        if (!d || !d.users.length) continue;
        const q = d.users[d.users.length - 1];
        const best = h.prompts.reduce((acc, vq) => { const m = softIn(q, vq); return m.pct > acc.pct ? m : acc; }, { ok: false, pct: 0 });
        if (!best.ok) missingTurns.push({ t: t, q: q, pct: best.pct });
      }
    }
    if (missingTurns.length) {
      err(side.scope, h.fieldKey, null, 'the saved page is missing the question' + (missingTurns.length === 1 ? '' : 's') + ' from turn' + (missingTurns.length === 1 ? ' ' + missingTurns[0].t : 's ' + missingTurns.map((x) => x.t).join(', ')) + ', so the page and the debug info are not the same conversation.',
        'save the page again with the whole conversation visible -- expand any collapsed turns first -- and upload that file.',
        missingTurns.map((x) => 'turn ' + x.t + ' asked "' + x.q.slice(0, 100) + '" (best word overlap against the page\'s questions ' + x.pct + '%)').join('; ') + '.');   // F3-10
    }
    // F3-13: the page must show as many questions as the side declares turns. Generalises
    // 903:1333 (which only caught the declared-1 case) to any turn count.
    if (h.prompts.length && n !== null && n !== undefined && h.prompts.length !== n) {
      err(side.scope, h.fieldKey, null, 'the saved page shows ' + h.prompts.length + ' question' + (h.prompts.length === 1 ? '' : 's') + ' but this model declares ' + n + ' turn' + (n === 1 ? '' : 's') + '.',
        h.prompts.length > n
          ? 'upload the page for this task\'s conversation only, or raise the turn count if the extra turns were part of it.'
          : 'save the page again with every turn visible -- expand any collapsed turns first -- or correct the turn count.',
        'questions visible on the page: ' + h.prompts.map((q) => '"' + q.slice(0, 60) + '"').join('; ') + '.');   // F3-13
    }
  }
  // F3-11: both pages carrying the same prompt AND the same response text = one chat submitted
  // for both models. Text identity is only SUGGESTIVE; a different conversation id or a
  // different mode label on the page is decisive and suppresses the finding.
  {
    const a = htmlOf('test'), b = htmlOf('base');
    if (a && b) {
      const sameText = a.fp === b.fp
        || (a.prompts.length && b.prompts.length && a.responses.length && b.responses.length
            && eqN(a.prompts[0], b.prompts[0]) && overlapPct(a.responses[0], b.responses[0]) >= 99);
      const idsDiffer = !!(a.convId && b.convId && a.convId !== b.convId);
      const labelsDiffer = !!(a.modeLabel && b.modeLabel && discriminator(a.modeLabel) !== discriminator(b.modeLabel));
      if (sameText && !idsDiffer && !labelsDiffer) {
        err(a.scope, a.fieldKey, null, 'the same conversation appears to have been saved for both models, but this task needs two separate conversations.',
          'run the second model in its own chat, save that page, and upload it under that model.',
          'the two pages carry the same prompt and the same responses' + (a.fp === b.fp ? ', and are byte-for-byte identical' : '') + '; the other page is ' + b.url + '.');   // F3-11
      } else if (sameText) {
        logs.push('F3-11 suppressed: page text matches across sides but ' + (idsDiffer ? 'the conversation ids differ ("' + a.convId + '" vs "' + b.convId + '")' : 'the model selector labels differ ("' + a.modeLabel + '" vs "' + b.modeLabel + '")') + ' -- decisive evidence of two conversations.');
      }
    }
  }

  // ==========================================================================
  // F3-12  SAME-CHAT PROOF via llmdebugger session tokens. Each debug capture and each saved
  // page embeds the session link for every response it covers; the token is a per-response
  // session id, so a side's debug tokens must all appear in that side's own page. This is
  // DECISIVE where text is not: the page embeds the debug dump, so text containment cannot
  // separate "same conversation" from "same words typed twice". Ref 903:1348.
  //
  // Evidence it is safe as an error (both golden tasks, all four side-instances):
  //   1271273 Yakitori    2/2 debug tokens present in its page   OK
  //   1271273 Prod Frozen 2/2 debug tokens present in its page   OK
  //   1271348 Yakitori    2/2 debug tokens present in its page   OK
  //   1271348 Prod Frozen 0/2 -- ZERO overlap, and none with the other side's page either:
  //                       the conversation was re-run and the page saved from the second run,
  //                       so the uploaded debug does not document the submitted conversation.
  // Self-skips with a log whenever either artifact yields no tokens, so a capture format that
  // stops emitting them degrades to silence rather than blocking every task.
  // ==========================================================================
  for (const side of bound) {
    const h = htmlOf(side.slot);
    if (!h) continue;
    const mine = usableDebug.filter((r) => r.slot === side.slot);
    const dTokens = [...new Set(mine.flatMap((r) => r.tokens || []))];
    if (!dTokens.length || !(h.tokens || []).length) {
      logs.push('F3-12 SELF-SKIPPED on ' + side.scope + ': session tokens absent (' + dTokens.length + ' in the debug, ' + (h.tokens || []).length + ' on the page) -- cannot prove or disprove same-chat from tokens here.');
      continue;
    }
    const missing = dTokens.filter((t) => !h.tokens.includes(t));
    if (missing.length === dTokens.length) {
      const other = bound.find((x) => x.slot !== side.slot);
      const oh = other ? htmlOf(other.slot) : null;
      const inOther = oh && dTokens.some((t) => (oh.tokens || []).includes(t));
      err(side.scope, h.fieldKey, null, 'the debug files and the saved page for this model are from two different conversations.',
        inOther
          ? 'the two models\' saved pages look swapped -- upload each model\'s own page under that model.'
          : 'upload the saved page for the same conversation the debug info was captured from; if you re-ran the conversation, re-capture the debug info from the run you are submitting.',
        'none of the ' + dTokens.length + ' debug session id(s) appear on the page. Debug: ' + dTokens.join(', ') + '. Page: ' + h.tokens.join(', ') + '.' + (inOther ? ' They DO appear on the other model\'s page.' : ''));   // F3-12
    } else if (missing.length) {
      // Same defect as the fully-disjoint case above, just smaller: the page does not document
      // every turn the debug covers. Blocking (severity review, 10 Sep 2026).
      err(side.scope, h.fieldKey, null, 'the saved page is missing ' + missing.length + ' of the ' + dTokens.length + ' turns the debug info covers.',
        'save the page again with the whole conversation visible, and upload that file.',
        'debug session id(s) not found on the page: ' + missing.join(', ') + '.');   // F3-12
    }
  }

  // ==========================================================================
  // F5  IDENTITY (fetched-debug half). Only live when the sanctioned slice actually carries a
  // Model ID line (F3-06); otherwise identity is DORMANT and says so in the log, rather than
  // silently passing.
  // ==========================================================================
  // The identity table ships EMPTY and marked unconfirmed (section 9 row 6): the real identifier
  // strings for each model on Mode 23 Fast are unknown until they are proven on a batch.
  // Populate from the first clean captures; promote F5-03 to Error only once proven.
  //
  // KEYED ON "Agency config id", not "Model ID:". Mode 23 captures emit no Model ID line at all
  // (zero occurrences across all eight debug files of golden tasks 1271273 and 1271348), which
  // left this whole family dormant and let a swapped debug pair pass silently. The agency id is
  // present in BOTH the debug and the saved page and separates the models cleanly:
  //   Yakitori    "bard/gemini_chat/0.2.170-prod-p13n-memory-strike-0828-stm-v2p5-token-budget-..."
  //   Prod Frozen "bard/gemini_chat/0.2.171-prod-p13n-prod-frozen-baseline"
  // Model ID / Recipe ID stay as fallbacks for batches that do emit them.
  const IDENTITY_TABLE = {};   // canonical model name -> [expected agency config id strings]
  const idsBySlot = new Map();
  const idSourceBySlot = new Map();
  for (const side of bound) {
    const mine = usableDebug.filter((r) => r.slot === side.slot);
    const withAgency = mine.filter((r) => (r.agency || []).length);
    const withModelId = mine.filter((r) => (r.modelIds || []).length);
    const source = withAgency.length ? 'agency config id' : (withModelId.length ? 'Model ID' : null);
    const carriers = withAgency.length ? withAgency : withModelId;
    if (!source) {
      const seen = mine.map((r) => 'T' + r.turn + '=' + r.slice).join(', ');
      logs.push('F5: identity dormant on ' + side.scope + ' -- no agency config id and no Model ID line in any readable slice (slices: ' + (seen || 'none readable') + ').');
      continue;
    }
    idSourceBySlot.set(side.slot, source);
    const all = [];
    for (const r of carriers) for (const id of (withAgency.length ? r.agency : r.modelIds)) all.push({ turn: r.turn, id: id, field: r.fieldKey });
    const distinct = [...new Set(all.map((x) => x.id))];
    // F5-01: one model per side, so ONE identifier across that side's turns.
    if (distinct.length > 1) {
      const counts = new Map();
      for (const x of all) counts.set(x.id, (counts.get(x.id) || 0) + 1);
      const majority = [...counts.entries()].sort((p, q) => q[1] - p[1])[0][0];
      const odd = all.filter((x) => x.id !== majority)[0];
      err(side.scope, odd.field, odd.turn, 'the debug files for this model report ' + distinct.length + ' different models, but one model was run for the whole conversation.',
        'confirm each turn\'s debug info came from this model\'s own conversation, and replace any file exported from the other model\'s chat.',
        'model identifiers found (' + source + '): ' + distinct.map((d) => '"' + d + '"').join(', ') + '; turn ' + odd.turn + ' reports "' + odd.id + '" while the other turns report "' + majority + '".');   // F5-01
      idsBySlot.set(side.slot, majority);
    } else {
      idsBySlot.set(side.slot, distinct[0]);
    }
    // F5-06: the debug and the saved page must report the SAME model for this side. Ref 903:1352.
    const h = htmlOf(side.slot);
    const pageId = h && (h.agency || []).length ? h.agency[0] : null;
    const debugId = idsBySlot.get(side.slot);
    if (h && pageId && debugId && source === 'agency config id' && canonModel(pageId) !== canonModel(debugId)) {
      err(side.scope, h.fieldKey, null, 'the debug files and the saved page for this model were produced by two different models.',
        'confirm the same model was selected for the conversation you captured and the page you saved, and re-upload whichever is wrong.',
        'the debug reports "' + debugId + '"; the page reports "' + pageId + '".');   // F5-06
    } else if (h && !pageId) {
      logs.push('F5-06 self-skipped on ' + side.scope + ': the saved page carries no agency config id.');
    }
    // F5-03: against the identity table. Ships EMPTY, so this is a LOG and never a finding.
    const expected = IDENTITY_TABLE[canonModel(side.name)];
    const observed = idsBySlot.get(side.slot);
    if (!expected || !expected.length) {
      logs.push('F5-03 ' + side.scope + ': the identity table is EMPTY (unconfirmed) -- observed ' + source + ' "' + observed + '". Record this to populate the table; promote F5-03 to Error only once it is proven on a batch.');
    } else if (!expected.some((e) => canonModel(e) === canonModel(observed))) {
      const anchor = usableDebug.find((r) => r.slot === side.slot);
      warn(side.scope, anchor ? anchor.fieldKey : side.keyOf(CFG.debugSlotKeys[0]), anchor ? anchor.turn : null,
        'the debug info reports a different model than this slot expects.',
        'confirm the model selected in Gemini for this conversation matched "' + side.name + '"; if it did, report the identifier below to your lead so the expected list can be updated.',
        'observed "' + observed + '"; expected ' + expected.map((e) => '"' + e + '"').join(' or ') + '.');   // F5-03
    }
  }
  // F5-02: the two variants cannot report the same identifier.
  {
    const ia = idsBySlot.get('test'), ib = idsBySlot.get('base');
    if (ia && ib && canonModel(ia) === canonModel(ib)) {
      const anchor = usableDebug.find((r) => r.slot === 'base') || usableDebug[0];
      err(anchor.scope, anchor.fieldKey, anchor.turn, 'the debug info for both models reports the same model, so one of the two sets of files came from the wrong chat.',
        'check which model each conversation was run with, and replace the files that came from the other model\'s chat.',
        'both models report "' + ia + '" (' + (idSourceBySlot.get('base') || idSourceBySlot.get('test')) + '); the two models compared here cannot produce the same identifier.');   // F5-02
    }
  }
  // F5-07: decisive SWAP -- each side's page reports the OTHER side's debug model. Unlike the
  // mode-selector comparison (F3-09) this needs no name canonicalization at all, so it stands on
  // its own when the selector label is missing or phrased differently. Ref 903:1482.
  {
    const ah = htmlOf('test'), bh = htmlOf('base');
    const ad = idsBySlot.get('test'), bd = idsBySlot.get('base');
    const ap = ah && (ah.agency || []).length ? ah.agency[0] : null;
    const bp = bh && (bh.agency || []).length ? bh.agency[0] : null;
    if (ap && bp && ad && bd && canonModel(ap) === canonModel(bd) && canonModel(bp) === canonModel(ad)) {
      err(ah.scope, ah.fieldKey, null, 'the two saved pages are swapped: each model\'s page is filed under the other model.',
        'swap the two page uploads so each model\'s page sits under that model.',
        'this slot\'s page reports "' + ap + '", which is the other model\'s; the other slot\'s page reports "' + bp + '".');   // F5-07
    }
  }

  // ==========================================================================
  // F6-06  Dissatisfied ratings require the FULL debug share. It lives here because it needs
  // the F3-06 slice classification. WARNING, not an error: the doc's wording says
  // "Dissatisfied" while the scale offers "Somewhat dissatisfied" / "Very dissatisfied", and it
  // references stale labels ("Holistic 1a/1b") for 7a/7b -- escalations 7 and 13 own the
  // ruling, and this is promoted only once it lands.
  // ==========================================================================
  {
    const DISSATISFIED = ['Very dissatisfied', 'Somewhat dissatisfied'];
    for (const side of bound) {
      const which = [];
      if (DISSATISFIED.some((d) => sameOpt(side.get(A.sat7a), d))) which.push('"' + labelOf(side.keyOf(A.sat7a)) + '"');
      if (DISSATISFIED.some((d) => sameOpt(side.get(A.sat7b), d))) which.push('"' + labelOf(side.keyOf(A.sat7b)) + '"');
      if (!which.length) continue;
      const partial = usableDebug.filter((r) => r.slot === side.slot && r.slice !== 'FULL');
      if (!partial.length) continue;
      const anchor = partial[0];
      warn(side.scope, anchor.fieldKey, anchor.turn, 'this model was rated as dissatisfying on ' + which.join(' and ') + ', and the debug info for turn' + (partial.length === 1 ? ' ' + anchor.turn : 's ' + partial.map((p) => p.turn).join(', ')) + ' is a partial share.',
        'when you are dissatisfied, share the COMPLETE debug info -- copy everything from the top of the panel, not just the section after the LM prefix -- and replace ' + (partial.length === 1 ? 'that file' : 'those files') + '.',
        which.join(' and ') + ' = dissatisfied; debug share' + (partial.length === 1 ? '' : 's') + ' classified as ' + partial.map((p) => 'turn ' + p.turn + ': ' + p.slice).join(', ') + '.');   // F6-06
    }
  }

  // ==========================================================================
  // F7-03  TEST SIDE ONLY, Turn 1, FULL share: the sian_profile chapter with the sources the
  // doc's own verification step names. The doc verifies the Test model only, so this NEVER
  // fires on the Base side. YouTube is enabled as a toggle but is NOT in the doc's list -- its
  // presence is logged, never required. Exact spellings are re-confirmed on the first capture
  // (section 9 row 8).
  // ==========================================================================
  {
    // WHAT MODE 23 ACTUALLY EMITS (verified on all four Turn-1 captures across golden tasks
    // 1271273 and 1271348): there is no "sian_profile" chapter and no "Personal Context" header.
    // Personal context arrives as blocks of
    //     Source Profile: source_name: "DATA_SOURCE_USER_PROFILE_<X>" text_profile: "..."
    // with <X> observed as GMAIL, PHOTOS, BARD_SEARCH, GEMINI_CHAT.
    //
    // The inherited expected-list check (SEARCH / GMAIL / PHOTOS /
    // BARD_NOT_PERSONALIZED_USING_FIRST_PARTY_DATA, from the 0701 template) is WRONG here twice
    // over: those exact tokens appear in no capture at all, and the set that does appear VARIES
    // BY TASK because it reflects what the model RETRIEVED for that query, not what the rater
    // connected during setup -- 1271273 (an email-retrieval task) pulled 4 sources, 1271348 (a
    // skills question) pulled only GMAIL. Requiring a fixed list would warn on every correct
    // task, which is the "uniform finding = script defect" trap in requirements section 7.
    //
    // So: the only decidable failure is a FULL Test-side share carrying NO personal context at
    // all -- that really does mean the personalization setup did not reach the model. Which
    // sources appeared is LOGGED for the client ruling that section 9 row 8 is waiting on.
    const SOURCE_RE = /source_name:\s*"(DATA_SOURCE_USER_PROFILE_[A-Z0-9_]+)"/g;
    const testSide = bound.find((s2) => s2.slot === 'test');
    const d = testSide ? debugOf('test', 1) : null;
    if (!testSide) {
      logs.push('F7-03 skipped: the Test model side is not bound.');
    } else if (!d) {
      logs.push('F7-03 skipped: no readable Turn 1 debug on the Test model side.');
    } else if (d.slice !== 'FULL') {
      logs.push('F7-03 skipped: the Test model\'s Turn 1 debug is a ' + d.slice + ', not a FULL share -- the personal-context section is out of the sanctioned slice, which is not reportable.');
    } else {
      const found = [...new Set([...d.text.matchAll(SOURCE_RE)].map((m) => m[1]))].sort();
      if (!found.length) {
        warn(testSide.scope, d.fieldKey, 1, 'no personal information reached this model, so the setup that makes it personalized cannot be verified.',
          'check this model\'s setup -- the personal data sources must be connected before you start the conversation -- then re-export and re-upload this turn\'s debug info.',
          'the debug is a full share but carries no personal-context source at all.');   // F7-03
      } else {
        logs.push('F7-03 Test model Turn 1: personal-context sources retrieved = ' + found.join(', ') + '. (Which sources a task SHOULD show is not yet ruled -- the set varies with what the query needs, so only "none at all" is treated as a failure. Section 9 row 8.)');   // F7-03
      }
    }
  }

  // ==========================================================================
  // zh-CN WIDTH PROBE (section 5 locale notes): MEASURE ONLY, never a finding. Classifies every
  // form-prompt vs first-user-block inequality by character class, so the first real batch says
  // whether half/full-width folding belongs in the ladder. Folding is added only if this probe
  // shows it in real data, with the probe as the incident citation.
  // ==========================================================================
  if (filled(formPrompt)) {
    const WIDE_RE = /[\uff01-\uff5e\u3000-\u303f]/;
    const foldWidth = (s) => norm(s).replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, ' ');
    for (const r of usableDebug) {
      const first = r.users[0];
      if (eqN(first, formPrompt)) continue;
      const wide = WIDE_RE.test(first) || WIDE_RE.test(rawStr(formPrompt));
      const foldedEqual = foldWidth(first) === foldWidth(formPrompt);
      logs.push('WIDTH PROBE ' + r.scope + ' Turn ' + r.turn + ': prompt and first block differ; full-width characters present=' + wide + ', equal after width folding=' + foldedEqual + ', word overlap=' + overlapPct(first, formPrompt) + '%. Measure only -- KNOWN-OPEN, no finding comes from this line.');
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  logs.push(VERSION + ': L2 complete. links=' + slots.length + ', read=' + okCount + ', unreadable=' + (results.length - okCount) + ', slices=[' + usableDebug.map((r) => r.role + 'T' + r.turn + ':' + r.slice).join(' ') + '].');
  if (errors.length === errorsBefore && warnings.length === warningsBefore && okCount > 0) {
    successes.push('All ' + okCount + ' linked file' + (okCount === 1 ? '' : 's') + ' opened and checked against the conversation.');
  }
}

async function validate(conversationData) {
  try {
    await validatePrqL1(conversationData);
  } catch (e) {
    errors.push('[ROUTE TO LEAD] Form-check layer error: ' + (e && e.message ? e.message : String(e)));
  }
  try {
    await validatePrqFetch(conversationData);
  } catch (e) {
    errors.push('[ROUTE TO LEAD] Artifact-check layer error: ' + (e && e.message ? e.message : String(e)));
  }
  for (const arr of [errors, warnings, infos, successes]) {
    const seen = new Set();
    const kept = arr.filter((x) => { const k = String(x); if (seen.has(k)) return false; seen.add(k); return true; });
    arr.length = 0;
    arr.push(...kept);
  }
}
