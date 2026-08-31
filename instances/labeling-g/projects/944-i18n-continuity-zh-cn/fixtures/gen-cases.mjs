// Generate fixtures/cases.json for project 944 from a valid ST base and a valid MT base,
// mutating one thing per case (smoke / adversarial / near-miss per check family).
import { writeFileSync } from "node:fs";

const MA = "07 Pizzi Gemelli --> Fast (paid) (prod default + notebook)";
const MB = "Pcontext Mode 23 (Nippon) > Ramen (top 20) - Fast";
const link = (id) => `https://drive.google.com/file/d/${id}/view?usp=sharing`;
const v = (x) => ({ value: x });

// wrap a flat {key:val} map into conversation.ratings ({value} envelope); per-side keys are
// passed already namespaced.
function ratings(map) { const o = {}; for (const [k, val] of Object.entries(map)) o[k] = v(val); return o; }

// ---- valid Single-Turn base ----
function stBase() {
  const task = {
    p0CujCategory: "Planning",
    targetLanguage: "Chinese",
    dialect: "Mainland (Simplified)",
    turnType: "Single Turn",
    numberOfThreadsAdded: "1",
    topicConversationsHtml1: link("THREAD1"),
    myGoal: "goal en",
    keyContext: "ctx en",
    targetLanguageVersion: "goal zh",
    keyContextTargetLanguageVersion: "ctx zh",
    languageNuance: "nuance",
    prompt: "the follow-up prompt",
    firstModel: MA,
    geminiConversationHistory: link("HIST1"),
    dominantThreadLanguageMatching: ["Dominant threads language matches target language"],
    promptGoalAlignment: "aligned",
    qualityComparisonSxS: "Conversation A was better",
    firstPlaceEnvironment: MA,
    secondPlaceEnvironment: MB,
    qualityComparisonSxSRationale: "A stayed on context better than B.",
  };
  const side = (ns, dbg, html) => ({
    [`compareModels.${ns}.numberOfTurns`]: "1",
    [`compareModels.${ns}.testResponse1DebugInfo`]: link(dbg),
    [`compareModels.${ns}.model1HtmlFileUpload`]: link(html),
    [`compareModels.${ns}.conversationFeedback`]: "looked fine",
    [`compareModels.${ns}.overallSatisfaction`]: "Very satisfied",
    [`compareModels.${ns}.contextualContinuity`]: "No Issue",
    [`compareModels.${ns}.contextualContinuityGate`]: "No",
    [`compareModels.${ns}.utilityRelevance`]: "No Issue",
    [`compareModels.${ns}.constraintExpertiseAdherence`]: "No Issue",
    [`compareModels.${ns}.stateEntityProgressTracking`]: "No Issue",
    [`compareModels.${ns}.temporalAwareness`]: "No Issue",
    [`compareModels.${ns}.granularityDepth`]: "No Issue",
    [`compareModels.${ns}.targetLanguageMeaning`]: "No Issue",
    [`compareModels.${ns}.internationalizationQuality`]: "No Issues",
  });
  return { ...task, ...side(MA, "DBG_A1", "HTML_A"), ...side(MB, "DBG_B1", "HTML_B") };
}

// ---- valid Multi-Turn base ----
function mtBase() {
  const task = {
    p0CujCategory: "Planning",
    targetLanguage: "Chinese",
    dialect: "Mainland (Simplified)",
    turnType: "Multi Turn",
    trackType: "Track A",
    numberOfThreadsAdded: "1",
    topicConversationsHtml1: link("THREAD1"),
    myGoal: "goal en",
    keyContext: "ctx en",
    targetLanguageVersion: "goal zh",
    keyContextTargetLanguageVersion: "ctx zh",
    languageNuance: "nuance",
    prompt: "the follow-up prompt",
    firstModel: MA,
    geminiConversationHistory: link("HIST1"),
    dominantThreadLanguageMatching: ["Dominant threads language matches target language"],
    qualityComparisonSxS: "Conversation A was better",
    firstPlaceEnvironment: MA,
    secondPlaceEnvironment: MB,
    qualityComparisonSxSRationale: "A stayed on context better than B.",
  };
  const side = (ns, d1, d2, html) => ({
    [`compareModels.${ns}.numberOfTurns`]: "2",
    [`compareModels.${ns}.testResponse1DebugInfo`]: link(d1),
    [`compareModels.${ns}.testResponse2DebugInfo`]: link(d2),
    [`compareModels.${ns}.model1HtmlFileUpload`]: link(html),
    [`compareModels.${ns}.conversationFeedback`]: "looked fine",
    [`compareModels.${ns}.multiTurnSatisfaction`]: "Very satisfied",
    [`compareModels.${ns}.turn1Continuity`]: "No Issue",
    [`compareModels.${ns}.turn2Continuity`]: "No Issue",
    [`compareModels.${ns}.turn1ContinuityErrorTypes`]: ["None"],
    [`compareModels.${ns}.turn2ContinuityErrorTypes`]: ["None"],
    [`compareModels.${ns}.errorSeverityFirst`]: "No issues logged",
    [`compareModels.${ns}.errorSeveritySecond`]: "No issues logged",
    [`compareModels.${ns}.errorSeverityThird`]: "No issues logged",
  });
  return { ...task, ...side(MA, "DBG_A1", "DBG_A2", "HTML_A"), ...side(MB, "DBG_B1", "DBG_B2", "HTML_B") };
}

const cases = [];
const add = (name, flat, expect, input) => {
  const conv = { ratings: ratings(flat) };
  if (input) conv.input = input;
  cases.push({ name, conversationData: { conversation: conv }, expect });
};
// deep-clone the flat map, apply a patch (patch value undefined => delete key)
const mut = (base, patch) => {
  const o = { ...base };
  for (const [k, val] of Object.entries(patch)) { if (val === undefined) delete o[k]; else o[k] = val; }
  return o;
};
const kA = (k) => `compareModels.${MA}.${k}`;
const kB = (k) => `compareModels.${MB}.${k}`;

// ===================== SMOKE (pass) =====================
add("SMOKE valid Single-Turn task passes", stBase(), { errors: [] });
add("SMOKE valid Multi-Turn task passes", mtBase(), { errors: [] });

// ===================== R — completeness =====================
add("R-01 missing required task field (myGoal)", mut(stBase(), { myGoal: undefined }), { errorsContain: ['"My Goal - English version"'] });
add("R-02 invalid turnType value", mut(stBase(), { turnType: "Zero Turn" }), { errorsContain: ["not one of the two turn types"] });
add("R-03 declared 2 threads, slot 2 empty", mut(stBase(), { numberOfThreadsAdded: "2" }), { errorsContain: ["thread HTML slot"] });
add("R-04 stale hidden thread slot", mut(stBase(), { topicConversationsHtml3: link("STALE3") }), { errorsContain: ["hidden at the current thread count"] });
add("R-05 per-side turn count missing", mut(stBase(), { [kA("numberOfTurns")]: undefined }), { errorsContain: ["turn count is missing"] });
add("R-06 per-side feedback blank", mut(stBase(), { [kB("conversationFeedback")]: undefined }), { errorsContain: ['Model B — "Feedback"'] });
add("R-07 declared 2 turns, Turn 2 debug empty", mut(mtBase(), { [kA("testResponse2DebugInfo")]: undefined }), { errorsContain: ["Turn 2 debug info"] });
add("R-08 stale hidden debug slot", mut(stBase(), { [kA("testResponse2DebugInfo")]: link("STALEDBG") }), { errorsContain: ["hidden at the current turn count"] });
add("R-09 SxS rationale blank", mut(stBase(), { qualityComparisonSxSRationale: undefined }), { errorsContain: ["side-by-side rationale is blank"] });

// ===================== G — gate cascades =====================
add("G-01 Multi Turn but trackType blank", mut(mtBase(), { trackType: undefined }), { errorsContain: ["Track Type is required"] });
add("G-01 Single Turn but trackType filled (stale)", mut(stBase(), { trackType: "Track A" }), { errorsContain: ["only applies to a Multi Turn"] });
add("G-02 Track B pivot required", mut(mtBase(), { trackType: "Track B" }), { errorsContain: ["pivot-to-topic turn is required"] });
add("G-03 Single Turn promptGoalAlignment blank", mut(stBase(), { promptGoalAlignment: undefined }), { errorsContain: ["Prompt Goal Alignment is required"] });
add("G-04 dominant Other selected, rationale blank", mut(stBase(), { dominantThreadLanguageMatching: ["Other(Please specify)"] }), { errorsContain: ["gave no rationale"] });
add("G-05 ST rating blank (utilityRelevance)", mut(stBase(), { [kA("utilityRelevance")]: undefined }), { errorsContain: ["Single Turn rating is required"] });
add("G-05 ST rating filled on MT task (stale)", mut(mtBase(), { [kA("overallSatisfaction")]: "Very satisfied" }), { errorsContain: ["filled on a Multi Turn task"] });
add("G-06 MT satisfaction blank", mut(mtBase(), { [kA("multiTurnSatisfaction")]: undefined }), { errorsContain: ["Multi Turn overall satisfaction is required"] });
add("G-06 MT field filled on ST task (stale)", mut(stBase(), { [kA("turn1Continuity")]: "No Issue" }), { errorsContain: ["filled on a Single Turn task"] });
add("G-07 turn continuity beyond declared turns (stale)", mut(mtBase(), { [kA("turn3Continuity")]: "No Issue" }), { errorsContain: ["declares only 2 turns"] });
add("G-08 turn logs error but detail blank", mut(mtBase(), { [kA("turn1ContinuityErrorTypes")]: ["Temporal Awareness — Expired Rule"], [kA("errorSeverityFirst")]: "Temporal Awareness — Expired Rule", [kA("errorSeverityFirstRationale")]: "because expired" }), { errorsContain: ["follow-up detail is required"] });
add("G-09 TLM issue but rationale blank", mut(stBase(), { [kA("targetLanguageMeaning")]: "Minor Issue" }), { errorsContain: ["Target Language Meaning is rated an issue but its rationale is blank"] });
add("G-10 IQ Minor Issues but no pattern", mut(stBase(), { [kA("internationalizationQuality")]: "Minor Issues", [kA("internationalizationRationale")]: "x" }), { errorsContain: ["no pattern is ticked"] });
add("G-11 IQ Major Issues but no pattern", mut(stBase(), { [kA("internationalizationQuality")]: "Major Issues", [kA("internationalizationRationale")]: "x" }), { errorsContain: ["no pattern is ticked"] });
add("G-12 IQ issue but rationale blank", mut(stBase(), { [kA("internationalizationQuality")]: "Minor Issues", [kA("internationalizationMinorIssues")]: ["Register slip"] }), { errorsContain: ["Internationalization is rated an issue but its rationale is blank"] });
add("G-13 ranked error but rationale blank", mut(mtBase(), { [kA("errorSeverityFirst")]: "Temporal Awareness — Expired Rule", [kA("turn1ContinuityErrorTypes")]: ["Temporal Awareness — Expired Rule"], [kA("turn1ExpectedContext")]: "x", [kA("turn1ContextSourceThreads")]: "Thread 1, Turn 1", [kA("turn1ModelCorrectionOutcome")]: "No" }), { errorsContain: ["rationale is blank"] });

// ===================== U — artifact URL integrity =====================
add("U-01 pasted debug text in artifact", mut(stBase(), { [kA("testResponse1DebugInfo")]: "Model ID: foo\n<ctrl99>user\nhi<ctrl100>" }), { errorsContain: ["pasted debug text"] });
add("U-02 raw HTML in artifact", mut(stBase(), { topicConversationsHtml1: "<!doctype html><html><body>x</body></html>" }), { errorsContain: ["raw HTML page source"] });
add("U-03 no link in artifact", mut(stBase(), { [kA("model1HtmlFileUpload")]: "see attached" }), { errorsContain: ["holds no link"] });
add("U-04 two links in one artifact", mut(stBase(), { topicConversationsHtml1: `${link("X1")} ${link("X2")}` }), { errorsContain: ["must hold exactly one"] });
add("U-05 link plus surrounding text (warn)", mut(stBase(), { topicConversationsHtml1: `thread: ${link("THREAD1")}` }), { warningsContain: ["link plus surrounding text"] });
add("U-06 folder link", mut(stBase(), { topicConversationsHtml1: "https://drive.google.com/drive/folders/FOLDER1?usp=sharing" }), { errorsContain: ["folder is linked instead of an individual file"] });
add("U-07 non-Drive host (warn)", mut(stBase(), { topicConversationsHtml1: "https://example.com/file/d/Z1/view" }), { warningsContain: ["not on drive.google.com"] });

// ===================== D — artifact identity =====================
add("D-01 same drive file in two slots", mut(stBase(), { [kA("model1HtmlFileUpload")]: link("DUP99"), [kA("testResponse1DebugInfo")]: link("DUP99") }), { errorsContain: ["same Drive file"] });

// ===================== I — identity =====================
add("I-01 firstModel not a present side", mut(stBase(), { firstModel: "Some Other Model" }), { errorsContain: ["does not match either side"] });
add("I-02 first and second place identical", mut(stBase(), { secondPlaceEnvironment: MA }), { errorsContain: ["name the same side"] });
add("I-03 place names absent side", mut(stBase(), { firstPlaceEnvironment: "Ghost Model", qualityComparisonSxS: "Conversation A and B were about the same" }), { errorsContain: ["not present in this task"] });

// ===================== C — coherence =====================
add("C-01 SxS verdict disagrees with 1st place", mut(stBase(), { qualityComparisonSxS: "Conversation B was better" }), { errorsContain: ["prefers Conversation B, but 1st place names the other side"] });
add("C-02 CC Major but gate not Yes", mut(stBase(), { [kA("contextualContinuity")]: "Major Issue", [kA("overallSatisfaction")]: "Very dissatisfied" }), { errorsContain: ["cold-start gate is not Yes"] });
add("C-03 gate Yes but a dimension rated", mut(stBase(), {
  [kA("contextualContinuity")]: "Major Issue", [kA("contextualContinuityGate")]: "Yes", [kA("overallSatisfaction")]: "Very dissatisfied",
  [kA("utilityRelevance")]: "N/A — Cold Start", [kA("constraintExpertiseAdherence")]: "N/A — Cold Start", [kA("stateEntityProgressTracking")]: "N/A — Cold Start", [kA("temporalAwareness")]: "N/A — Cold Start", [kA("granularityDepth")]: "No Issue", [kA("targetLanguageMeaning")]: "N/A — Cold Start", [kA("internationalizationQuality")]: "N/A",
}), { errorsContain: ['must read "N/A — Cold Start"'] });
add("C-04 gate Yes but IQ not N/A", mut(stBase(), {
  [kA("contextualContinuity")]: "Major Issue", [kA("contextualContinuityGate")]: "Yes", [kA("overallSatisfaction")]: "Very dissatisfied",
  [kA("utilityRelevance")]: "N/A — Cold Start", [kA("constraintExpertiseAdherence")]: "N/A — Cold Start", [kA("stateEntityProgressTracking")]: "N/A — Cold Start", [kA("temporalAwareness")]: "N/A — Cold Start", [kA("granularityDepth")]: "N/A — Cold Start", [kA("targetLanguageMeaning")]: "N/A — Cold Start", [kA("internationalizationQuality")]: "No Issues",
}), { errorsContain: ['Internationalization Quality is not "N/A"'] });
add("C-05 gate No but a memory dim cold start", mut(stBase(), { [kA("utilityRelevance")]: "N/A — Cold Start" }), { errorsContain: ['marked "N/A — Cold Start"'] });
add("C-06 gate No stray N/A WARNS (not English)", mut(stBase(), { [kA("targetLanguageMeaning")]: "N/A — Cold Start" }), { warningsContain: ['Target Language Meaning is "N/A — Cold Start"'] });
add("C-06 NEAR-MISS English thread suppresses", mut(stBase(), { dominantThreadLanguageMatching: ["Dominant threads language is English"], [kA("targetLanguageMeaning")]: "N/A — Cold Start", [kA("internationalizationQuality")]: "N/A", [kB("targetLanguageMeaning")]: "N/A — Cold Start", [kB("internationalizationQuality")]: "N/A" }), { errors: [] });
add("C-07 turn ticks None plus real error", mut(mtBase(), { [kA("turn1ContinuityErrorTypes")]: ["None", "Temporal Awareness — Expired Rule"], [kA("turn1ExpectedContext")]: "x", [kA("turn1ContextSourceThreads")]: "Thread 1, Turn 1", [kA("turn1ModelCorrectionOutcome")]: "No" }), { errorsContain: ['ticks "None" together with a real error'] });
add("C-08 failure ranked below empty higher slot", mut(mtBase(), { [kA("errorSeveritySecond")]: "Temporal Awareness — Expired Rule", [kA("errorSeveritySecondRationale")]: "x", [kA("turn1ContinuityErrorTypes")]: ["Temporal Awareness — Expired Rule"], [kA("turn1ExpectedContext")]: "x", [kA("turn1ContextSourceThreads")]: "Thread 1, Turn 1", [kA("turn1ModelCorrectionOutcome")]: "No" }), { errorsContain: ['more severe 1st place is "No issues logged"'] });
add("C-09 same failure ranked twice", mut(mtBase(), {
  [kA("errorSeverityFirst")]: "Temporal Awareness — Expired Rule", [kA("errorSeverityFirstRationale")]: "x",
  [kA("errorSeveritySecond")]: "Temporal Awareness — Expired Rule", [kA("errorSeveritySecondRationale")]: "x",
  [kA("turn1ContinuityErrorTypes")]: ["Temporal Awareness — Expired Rule"], [kA("turn1ExpectedContext")]: "x", [kA("turn1ContextSourceThreads")]: "Thread 1, Turn 1", [kA("turn1ModelCorrectionOutcome")]: "No",
}), { errorsContain: ["same error is ranked in both"] });
add("C-10 ranked failure not in any turn list", mut(mtBase(), { [kA("errorSeverityFirst")]: "Temporal Awareness — Expired Rule", [kA("errorSeverityFirstRationale")]: "x" }), { errorsContain: ["never logged on any turn"] });
add("C-11 CC Major but satisfaction not Very dissatisfied", mut(stBase(), { [kA("contextualContinuity")]: "Major Issue", [kA("contextualContinuityGate")]: "Yes", [kA("utilityRelevance")]: "N/A — Cold Start", [kA("constraintExpertiseAdherence")]: "N/A — Cold Start", [kA("stateEntityProgressTracking")]: "N/A — Cold Start", [kA("temporalAwareness")]: "N/A — Cold Start", [kA("granularityDepth")]: "N/A — Cold Start", [kA("targetLanguageMeaning")]: "N/A — Cold Start", [kA("internationalizationQuality")]: "N/A", [kA("overallSatisfaction")]: "Somewhat dissatisfied" }), { errorsContain: ['must be "Very dissatisfied"'] });
add("C-12 Major dimension but satisfied (warn)", mut(stBase(), { [kA("utilityRelevance")]: "Major Issue", [kA("overallSatisfaction")]: "Very satisfied" }), { warningsContain: ["rated Major Issue while overall satisfaction"] });
add("C-13 two minors but Very satisfied (warn)", mut(stBase(), { [kA("utilityRelevance")]: "Minor Issue", [kA("temporalAwareness")]: "Minor Issue", [kA("overallSatisfaction")]: "Very satisfied" }), { warningsContain: ["two or more dimensions are rated Minor Issue"] });
add("C-14 dissatisfied but all No Issue (warn)", mut(stBase(), { [kA("overallSatisfaction")]: "Very dissatisfied" }), { warningsContain: ["every rated dimension is No Issue"] });
add("C-15 context source cites neither thread nor turn (warn)", mut(mtBase(), { [kA("turn1ContinuityErrorTypes")]: ["Temporal Awareness — Expired Rule"], [kA("turn1ExpectedContext")]: "x", [kA("turn1ContextSourceThreads")]: "somewhere earlier", [kA("turn1ModelCorrectionOutcome")]: "No", [kA("errorSeverityFirst")]: "Temporal Awareness — Expired Rule", [kA("errorSeverityFirstRationale")]: "x" }), { warningsContain: ["names neither a thread nor a turn"] });
add("C-16 cites Thread beyond count (warn)", mut(mtBase(), { [kA("turn1ContinuityErrorTypes")]: ["Temporal Awareness — Expired Rule"], [kA("turn1ExpectedContext")]: "x", [kA("turn1ContextSourceThreads")]: "Thread 5, Turn 1", [kA("turn1ModelCorrectionOutcome")]: "No", [kA("errorSeverityFirst")]: "Temporal Awareness — Expired Rule", [kA("errorSeverityFirstRationale")]: "x" }), { warningsContain: ["beyond the 1 thread"] });

// ===================== B — assignment vs submission (needs batch input) =====================
const stInput = { "Task Type": v("Single Turn"), "First Model": v(MA), "Conversation Track": v("N/A"), "Target Language": v("Chinese"), "Dialect": v("Mainland (Simplified)"), "Model A": v(MA), "Model B": v(MB) };
const mtInput = { "Task Type": v("Multi Turn"), "First Model": v(MA), "Conversation Track": v("Track A"), "Target Language": v("Chinese"), "Dialect": v("Mainland (Simplified)"), "Model A": v(MA), "Model B": v(MB) };
add("B-01 turnType mismatches assigned task type", mut(mtBase(), {}), { errorsContain: ["does not match the assigned task type"] }, { ...mtInput, "Task Type": v("Single Turn") });
add("B-02 firstModel mismatch (warn)", mut(stBase(), {}), { warningsContain: ["differs from the assigned first model"] }, { ...stInput, "First Model": v(MB) });
add("B-03 track mismatch", mut(mtBase(), {}), { errorsContain: ["does not match the assigned track"] }, { ...mtInput, "Conversation Track": v("Track B") });
add("B-04 target language mismatch (warn)", mut(stBase(), {}), { warningsContain: ["differs from the assigned language"] }, { ...stInput, "Target Language": v("Japanese") });
add("B-05 dialect mismatch (warn)", mut(stBase(), {}), { warningsContain: ["differs from the assigned dialect"] }, { ...stInput, "Dialect": v("Taiwan (Traditional)") });
add("B-06 ST but a side declares 2 turns", mut(stBase(), { [kA("numberOfTurns")]: "2", [kA("testResponse2DebugInfo")]: link("A2") }), { errorsContain: ["Single Turn task but the side declares 2 turns"] }, stInput);
add("B-07 MT but a side declares 1 turn", mut(mtBase(), { [kA("numberOfTurns")]: "1", [kA("testResponse2DebugInfo")]: undefined, [kA("turn2Continuity")]: undefined, [kA("turn2ContinuityErrorTypes")]: undefined }), { errorsContain: ["Multi Turn task but the side declares only 1 turn"] }, mtInput);
add("B valid ST batch passes (near-miss, all match)", mut(stBase(), {}), { errors: [] }, stInput);

// ===================== adapter / near-miss =====================
add("ADAPTER no ratings -> route to lead", {}, { errorsContain: ["report this task to your lead"] });
cases[cases.length - 1].conversationData = { conversation: {} };
add("NEAR-MISS trailing newlines in link do not fire U-05", mut(stBase(), { topicConversationsHtml1: `\n  ${link("THREAD1")}\n` }), { errors: [] });

// ===================== ADAPTER: runtime payload shape =====================
// The real runtime payload (task 1264318) nests the answers at conversation_data.ratings as
// an ARRAY of { key, question, human_input_value } (unanswered fields carry NO value), with
// the batch axes at top-level csv_data. Locks the v1.0.1 adapter fix.
const toRuntime = (flat, csvOverrides) => {
  const arr = Object.entries(flat).map(([key, val]) => ({ key, input_type: "X", value_options: [], human_input_value: val }));
  // an unanswered field: present in the array with no human_input_value — must read as blank
  arr.push({ key: "temporalTag", question: "Temporal Tag (if relevant)", input_type: "SINGLE_CHOICE", value_options: [] });
  return {
    conversationId: 999,
    csv_data: { "Task Type": "Single-Turn", "First Model": MA, "Conversation Track": "N/A", "Target Language": "Chinese", "Dialect": "Mainland (Simplified)", "Model A": MA, "Model B": MB, modelConfig: { conversation_id: 999 }, ...(csvOverrides || {}) },
    conversation_data: { ratings: arr },
  };
};
cases.push({ name: "ADAPTER runtime array shape + csv_data passes", conversationData: toRuntime(stBase()), expect: { errors: [] } });
cases.push({ name: "ADAPTER runtime shape: checks actually run (blank myGoal fires)", conversationData: toRuntime(mut(stBase(), { myGoal: undefined })), expect: { errorsContain: ['"My Goal - English version"'] } });
cases.push({ name: "ADAPTER runtime shape: csv_data axes bind (task-type mismatch fires)", conversationData: toRuntime(stBase(), { "Task Type": "Multi-Turn" }), expect: { errorsContain: ["does not match the assigned task type"] } });

writeFileSync(process.argv[2], JSON.stringify(cases, null, 2));
console.log("wrote", cases.length, "cases");
