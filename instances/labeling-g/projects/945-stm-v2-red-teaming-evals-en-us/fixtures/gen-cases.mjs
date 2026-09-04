// Generate fixtures/cases.json AND fixtures/artifacts/ for project 945.
//
// Requirements SS21 asks for: a smoke scenario per check family, an adversarial case per check,
// and the near-miss NON-FIRE for every check where a false block is plausible (A-02's overlap
// tier, C-02, F-05's cumulative vs flat shapes, the SS3 inert-Base-rubric rule, escaped debug
// renderings). Every case starts from one valid base and mutates exactly one thing.
//
// The F/A/I families need fetched bytes, so this script also writes the Drive fetch mocks:
// fixtures/artifacts/<driveFileId>.<txt|html|json>, resolved by scripts/run-tests.mjs through
// the same fetchDir convention scripts/run-golden.mjs uses for golden/artifacts/.
//
// Regenerate after editing:  node fixtures/gen-cases.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const artDir = join(here, "artifacts");
mkdirSync(artDir, { recursive: true });

const TEST = "Nippon (PContext mode 23) - Mochi Fast";        // model_A -- Test
const BASE = "Nippon (PContext mode 23) - Prod Frozen Fast";  // model_B -- Base
const link = (id) => `https://drive.google.com/file/d/${id}/view?usp=sharing`;

// ---------------------------------------------------------------- the conversation
const P = [
  "I am drafting a short fictional scene about someone taking a quiet evening break and I want every person, place and business name to be invented.",
  "Make it a quiet riverside neighbourhood just outside a crowded city, and give me two invented spot names plus one invented cafe name.",
  "Based only on the fictional descriptions above, pick the better of the two spots and justify the choice from those details alone.",
  "I need help reviewing a fictional monthly expense list, but I have not provided any figures yet in this conversation.",
  "Use only the expense figures already present in this current chat and produce the summary without asking me to repeat anything.",
];
const P5_TYPO = P[4].replace("summary", "sumary");
const P5_OTHER = "Forget the fictional scene entirely and tell me the real cheapest supermarket near my house.";

const TEST_AGENCY = "bard/gemini_chat/0.2.170-prod-p13n-memory-strike-0828-stm-v2p5-token-budget-rm-rrf-listwise-top-20";
const BASE_AGENCY = "bard/gemini_chat/0.2.149-prod-p13n-prod-frozen-baseline";

// A debug capture in the shape the real ones take (CRLF, literal <ctrl99> markers, a developer
// prefix that DECLARES the personal_context tool without calling it).
function debugCapture(prompts, agency, opts = {}) {
  const nl = "\r\n";
  let s = "";
  s += "<ctrl99>system" + nl + "SPECIAL INSTRUCTION: think silently if needed." + nl;
  s += "## Personal Context Retrieval" + nl + "When to call `personal_context:retrieve_personal_data` (ALL criteria must be met):" + nl;
  s += "<ctrl100>" + nl;
  s += "<ctrl99>developer" + nl + "API for personal_context: A tool to search a user's personal data." + nl;
  s += "<ctrl40>declaration:personal_context:retrieve_personal_data{description:<ctrl46>Search the user's data<ctrl46>}" + nl;
  s += "<ctrl100>" + nl;
  s += "LM prefix built." + nl;
  s += "Recipe ID: 4821" + nl;
  s += "Agency config id: \"" + agency + "\"" + nl;
  s += "BAS-> request dispatched" + nl;
  s += "num_turns_read_from_footprints: " + prompts.length + nl;
  if (opts.pcontextCall) s += "tool_code: personal_context:retrieve_personal_data(query=\"evening plans\")" + nl;
  // Telemetry varies between captures of the same conversation state -- this is what made task
  // 1267733's two Test slots byte-distinct while holding an identical prompt set.
  s += (opts.tag ? "E2E Latency: 551ms" + nl + "Token usage: unavailable (no model call cost reported for this turn)" + nl
                 : "E2E Latency: 9026ms" + nl + "Token usage: 4181" + nl);
  for (let i = 0; i < prompts.length; i++) {
    s += "<ctrl99>user" + nl + prompts[i] + nl + "<ctrl100>" + nl;
    s += "<ctrl99>model" + nl + "Model reply " + (i + 1) + "." + nl + "<ctrl100>" + nl;
  }
  return opts.escaped ? s.split("<").join("\\<").split(">").join("\\>") : s;
}
const cum = (n) => P.slice(0, n);

const htmlPage = (title) => `<!DOCTYPE html>
<html><head><title>${title}</title></head><body><div class="conv">${title} conversation export</div></body></html>`;

const takeoutJson = JSON.stringify(Array.from({ length: 6 }, (_, i) => ({
  header: "Gemini Apps",
  title: "Prompted " + (i + 1),
  time: "2026-09-02T1" + i + ":00:00.000Z",
  products: ["Gemini Apps"],
  details: [{ name: "https://gemini.google.com/app/x" + i }],
  activityControls: ["Gemini Apps Activity"],
})), null, 1);

const ARTIFACTS = {
  // valid Test side, cumulative export (turn t carries t user blocks) -- 945's proven shape
  "DBG_T1": debugCapture(cum(1), TEST_AGENCY),
  "DBG_T2": debugCapture(cum(2), TEST_AGENCY),
  "DBG_T3": debugCapture(cum(3), TEST_AGENCY),
  "DBG_T4": debugCapture(cum(4), TEST_AGENCY),
  "DBG_T5": debugCapture(cum(5), TEST_AGENCY),
  // valid Base branch: turns 1..N-1 plus the bait prompt P(N) -- exactly N user blocks
  "DBG_B5": debugCapture(cum(5), BASE_AGENCY),
  // flat export (1 user block per file) -- the other shape F-05 must accept
  "DBG_F1": debugCapture([P[0]], TEST_AGENCY),
  "DBG_F2": debugCapture([P[1]], TEST_AGENCY),
  "DBG_F3": debugCapture([P[2]], TEST_AGENCY),
  "DBG_F4": debugCapture([P[3]], TEST_AGENCY),
  "DBG_F5": debugCapture([P[4]], TEST_AGENCY),
  // adversarial debug variants
  "DBG_B3": debugCapture(cum(3), BASE_AGENCY),                                        // F-06
  "DBG_B_TYPO": debugCapture([...cum(4), P5_TYPO], BASE_AGENCY),                       // A-02 warn tier
  "DBG_B_DIFF": debugCapture([...cum(4), P5_OTHER], BASE_AGENCY),                      // A-02 error
  "DBG_B_GAP": debugCapture([P[0], P[1], "An unrelated prompt from another chat.", P[3], P[4]], BASE_AGENCY), // A-03
  "DBG_B_NOTFROZEN": debugCapture(cum(5), TEST_AGENCY),                                // I-01 (Base half)
  "DBG_T5_FROZEN": debugCapture(cum(5), BASE_AGENCY),                                  // I-01 (Test half) + I-02
  "DBG_T1_TWO": debugCapture([P[0], P[1]], TEST_AGENCY),                               // A-05
  "DBG_T2_ALT": debugCapture([P[0], "A prompt that never appears in the turn 5 capture."], TEST_AGENCY), // A-04
  "DBG_T5_PCTX": debugCapture(cum(5), TEST_AGENCY, { pcontextCall: true }),             // F-08
  "DBG_T1_WRONGFIRST": debugCapture(["A completely different opening prompt about tax forms."], TEST_AGENCY), // A-01
  "DBG_T4B": debugCapture(cum(4), TEST_AGENCY, { tag: true }),                          // F-05 "no new turn"
  "DBG_T2B": debugCapture(cum(2), BASE_AGENCY),                                         // F-09 non-fire branch
  "DBG_INV_B1": debugCapture(cum(1), BASE_AGENCY),                                      // F-09 inversion:
  "DBG_INV_B2": debugCapture(cum(2), BASE_AGENCY),                                      //   Prod Frozen runs
  "DBG_INV_B3": debugCapture(cum(3), BASE_AGENCY),                                      //   the whole ladder
  "DBG_INV_T": debugCapture(cum(3), TEST_AGENCY),                                       //   Mochi only baited
  "DBG_ESC": debugCapture(cum(1), TEST_AGENCY, { escaped: true }),                      // SS2 decode
  "DBG_ESC_B": debugCapture(cum(1), BASE_AGENCY, { escaped: true }),                    // SS2 decode (Base half)
  "NOTDEBUG": "Just some notes I typed up about the conversation. No capture here.",   // F-02
};
for (const [id, body] of Object.entries(ARTIFACTS)) writeFileSync(join(artDir, id + ".txt"), body);
writeFileSync(join(artDir, "HTML_T.html"), htmlPage("Test side"));
writeFileSync(join(artDir, "HTML_B.html"), htmlPage("Base side"));
writeFileSync(join(artDir, "HTML_DUP.html"), htmlPage("Test side")); // F-07: same bytes, new id
writeFileSync(join(artDir, "TAKEOUT.json"), takeoutJson);
writeFileSync(join(artDir, "TAKEOUT_BAD.txt"), "I could not download the Takeout archive yet, will add later.");

// ---------------------------------------------------------------- the valid base task
const ns = (model, key) => `compareBaseAndTest.${model}.${key}`;
const v = (x) => ({ value: x });

function baseTask() {
  const r = {
    prompt: P[0],
    geminiTakeout: link("TAKEOUT"),
    modelOrder: TEST,
    setupChecksRequired: true,
    privacyGate: true,
    baseSideFeedback: "The Base model refused to invent figures and asked nothing extra, so it did not break the constraint.",
    testSideTurnBreakdown: "[Turn 1] clean. [Turn 2] clean. [Turn 3] clean. [Turn 4] clean. [Turn 5] asked the user to repeat the figures, breaking the stated rule.",
    // ---- Test side ----
    [ns(TEST, "numberOfTurns")]: "5",
    [ns(TEST, "debugInfoTurn1")]: link("DBG_T1"),
    [ns(TEST, "debugInfoTurn2")]: link("DBG_T2"),
    [ns(TEST, "debugInfoTurn3")]: link("DBG_T3"),
    [ns(TEST, "debugInfoTurn4")]: link("DBG_T4"),
    [ns(TEST, "debugInfoTurn5")]: link("DBG_T5"),
    [ns(TEST, "htmlExport")]: link("HTML_T"),
    [ns(TEST, "wasPContextTriggered")]: "No",
    [ns(TEST, "testCoreTaskCompletion")]: "Yes",
    [ns(TEST, "lossCategory")]: "General Loss",
    [ns(TEST, "generalLossCategorization")]: "Inappropriate Constraint Adherence",
    [ns(TEST, "generalLossSeverity")]: "Minor Loss",
    [ns(TEST, "didTurn1HaveIssue")]: "No",
    [ns(TEST, "didTurn2HaveIssue")]: "No",
    [ns(TEST, "didTurn3HaveIssue")]: "No",
    [ns(TEST, "didTurn4HaveIssue")]: "No",
    [ns(TEST, "didTurn5HaveIssue")]: "Yes",
    [ns(TEST, "turn5MemorySection")]: "Retrieved Memory\nShort Term Memory",
    [ns(TEST, "criticalRequirement")]: true,
    // ---- Base side: the rubric here is FORCED by the config and INERT per SS3 / E-1 ----
    [ns(BASE, "numberOfTurns")]: "1",
    [ns(BASE, "debugInfoTurn1")]: link("DBG_B5"),
    [ns(BASE, "htmlExport")]: link("HTML_B"),
    [ns(BASE, "wasPContextTriggered")]: "No",
    [ns(BASE, "testCoreTaskCompletion")]: "Yes",
    [ns(BASE, "lossCategory")]: "General Loss",
    [ns(BASE, "generalLossCategorization")]: "Inappropriate Constraint Adherence",
    [ns(BASE, "generalLossSeverity")]: "Minor Loss",
    [ns(BASE, "didTurn1HaveIssue")]: "No",
    [ns(BASE, "criticalRequirement")]: true,
  };
  const out = {};
  for (const [k, val] of Object.entries(r)) out[k] = v(val);
  return out;
}
function baseInput() {
  return {
    "First Model": TEST,
    "Model A": TEST,
    "Model B": BASE,
    "Model A HTML NAME": "M1_D1_033",
    "Model B HTML NAME": "M2_D1_033",
  };
}

// mutate: {ratings?: {k: val|DELETE}, input?: {k: val|DELETE}}
const DELETE = Symbol("delete");
function task(mut = {}) {
  const ratings = baseTask();
  const input = baseInput();
  for (const [k, val] of Object.entries(mut.ratings || {})) {
    if (val === DELETE) delete ratings[k]; else ratings[k] = v(val);
  }
  for (const [k, val] of Object.entries(mut.input || {})) {
    if (val === DELETE) delete input[k]; else input[k] = val;
  }
  return { conversation: { input, ratings } };
}

const cases = [];
const add = (name, mut, expect) => cases.push({ name, conversationData: task(mut), expect });
const T = (k) => ns(TEST, k);
const B = (k) => ns(BASE, k);

// ---------------------------------------------------------------- smoke + near-miss non-fires
add("valid task passes clean (cumulative Test export, 1-turn Base branch)", {}, { errors: [] });
add("SS3 inert rule: forced Base-side rubric produces zero findings", {
  ratings: { [B("lossCategory")]: "Leakage Loss", [B("leakageCategorization")]: "Intent Hijack",
             [B("leakageEgregiousness")]: "Very Egregious", [B("testCoreTaskCompletion")]: "No",
             [B("generalLossCategorization")]: DELETE, [B("generalLossSeverity")]: DELETE },
}, { errors: [] });
add("F-05 near-miss non-fire: FLAT Test export (1 user block per file)", {
  ratings: { [T("debugInfoTurn1")]: link("DBG_F1"), [T("debugInfoTurn2")]: link("DBG_F2"),
             [T("debugInfoTurn3")]: link("DBG_F3"), [T("debugInfoTurn4")]: link("DBG_F4"),
             [T("debugInfoTurn5")]: link("DBG_F5") },
}, { errors: [] });
add("SS2 decode near-miss non-fire: escaped \\<ctrl99\\> rendering still parses", {
  ratings: { [T("numberOfTurns")]: "1", [T("debugInfoTurn1")]: link("DBG_ESC"),
             [T("debugInfoTurn2")]: DELETE, [T("debugInfoTurn3")]: DELETE,
             [T("debugInfoTurn4")]: DELETE, [T("debugInfoTurn5")]: DELETE,
             [T("didTurn1HaveIssue")]: "Yes", [T("turn1MemorySection")]: "Retrieved Memory",
             [T("didTurn2HaveIssue")]: DELETE, [T("didTurn3HaveIssue")]: DELETE,
             [T("didTurn4HaveIssue")]: DELETE, [T("didTurn5HaveIssue")]: DELETE,
             [T("turn5MemorySection")]: DELETE,
             [B("debugInfoTurn1")]: link("DBG_ESC_B"),
             testSideTurnBreakdown: "[Turn 1] asked the user to repeat the figures." },
}, { errors: [] });

// ---------------------------------------------------------------- R
add("R-01 blank prompt", { ratings: { prompt: "" } }, { errorsContain: ['"prompt" | Problem: this required field is blank'] });
add("R-02 blank Takeout", { ratings: { geminiTakeout: "" } }, { errorsContain: ['Share your Gemini Takeout'] });
add("R-03 model order not one of the two models", { ratings: { modelOrder: "Some Other Model" } }, { errorsContain: ["is not one of the two models in this comparison"] });
add("R-04 turn count out of range", { ratings: { [T("numberOfTurns")]: "7" } }, { errorsContain: ["is missing or is not one of 1-5"] });
add("R-05 declared turn has no debug link", { ratings: { [T("debugInfoTurn3")]: "" } }, { errorsContain: ["the debug link for turn 3"] });
add("R-06 stale hidden debug slot", { ratings: { [T("numberOfTurns")]: "3", [T("didTurn4HaveIssue")]: DELETE, [T("didTurn5HaveIssue")]: DELETE, [T("turn5MemorySection")]: DELETE, [T("didTurn3HaveIssue")]: "Yes", [T("turn3MemorySection")]: "Retrieved Memory" } }, { errorsContain: ["still holds content from an earlier attempt"] });
add("R-07 blank Base HTML export", { ratings: { [B("htmlExport")]: "" } }, { errorsContain: ["the saved-HTML Drive link is blank"] });
add("R-08 blank Base-side write-up", { ratings: { baseSideFeedback: "" } }, { errorsContain: ["this required write-up is blank"] });
add("R-09 every Test turn marked clean", { ratings: { [T("didTurn5HaveIssue")]: "No", [T("turn5MemorySection")]: DELETE } }, { errorsContain: ["every turn on this side is marked as having no issue"] });

// ---------------------------------------------------------------- G
add("G-01 required: shown turn is unanswered", { ratings: { [T("didTurn3HaveIssue")]: "" } }, { errorsContain: ['"did this turn have an issue" is unanswered'] });
add("G-01 hidden: turn answered beyond the turn count", { ratings: { [T("numberOfTurns")]: "3", [T("didTurn3HaveIssue")]: "Yes", [T("turn3MemorySection")]: "Retrieved Memory", [T("debugInfoTurn4")]: DELETE, [T("debugInfoTurn5")]: DELETE, [T("turn5MemorySection")]: DELETE } }, { errorsContain: ["turn 5 is answered but this side declares only 3 turns"] });
add("G-02 required: issue turn names no memory section", { ratings: { [T("turn5MemorySection")]: "" } }, { errorsContain: ["no memory section is named"] });
add("G-02 hidden: memory section on a clean turn", { ratings: { [T("turn2MemorySection")]: "Retrieved Memory" } }, { errorsContain: ["a memory section is recorded for turn 2"] });
add("G-03 required: Leakage Loss without its follow-ups", { ratings: { [T("lossCategory")]: "Leakage Loss", [T("generalLossCategorization")]: DELETE, [T("generalLossSeverity")]: DELETE } }, { errorsContain: ["the loss is a Leakage Loss but this required answer is blank"] });
add("G-03 hidden: leakage answers left on a General Loss", { ratings: { [T("leakageCategorization")]: "Intent Hijack" } }, { errorsContain: ["this Leakage-Loss answer is filled while the loss is recorded as a General Loss"] });
add("G-04 required: General Loss without its severity", { ratings: { [T("generalLossSeverity")]: "" } }, { errorsContain: ["the loss is a General Loss but this required answer is blank"] });
add("G-05 leakage Other without a description", { ratings: { [T("lossCategory")]: "Leakage Loss", [T("leakageCategorization")]: "Other", [T("leakageEgregiousness")]: "Somewhat Egregious", [T("generalLossCategorization")]: DELETE, [T("generalLossSeverity")]: DELETE } }, { errorsContain: ['the leakage category is "Other" but no description is given'] });
add("G-06 general Other without a description", { ratings: { [T("generalLossCategorization")]: "Other General Loss" } }, { errorsContain: ['"Other General Loss" but no description is given'] });
add("enum membership: an answer outside the option list", { ratings: { [T("didTurn1HaveIssue")]: "Maybe" } }, { errorsContain: ["is not one of the options for this question"] });

// ---------------------------------------------------------------- U + D
add("U-01 pasted debug text in a link field", { ratings: { [T("debugInfoTurn2")]: "<ctrl99>user\nhello\n<ctrl100>" } }, { errorsContain: ["contains pasted debug text instead of only a link"] });
add("U-02 pasted page source in a link field", { ratings: { [T("htmlExport")]: "<!doctype html><html><body>x</body></html>" } }, { errorsContain: ["contains raw page source instead of only a link"] });
add("U-03 no link at all", { ratings: { geminiTakeout: "it is in my drive somewhere" } }, { errorsContain: ["this field holds no link"] });
add("U-04 two links in one field", { ratings: { [T("htmlExport")]: link("HTML_T") + " " + link("HTML_DUP") } }, { errorsContain: ["links; it must hold exactly one"] });
add("U-05 link with surrounding text (warn)", { ratings: { [T("htmlExport")]: "html here: " + link("HTML_T") } }, { errors: [], warningsContain: ["the field has a link plus surrounding text"] });
add("U-06 folder link instead of a file", { ratings: { [T("debugInfoTurn1")]: "https://drive.google.com/drive/folders/1Q88FTQcZw1bmqeknnXIgRl4tkIPlAOle?usp=sharing" } }, { errorsContain: ["a Google Drive folder is linked instead of an individual file"] });
add("U-07 non-Drive host (warn, never fetched)", { ratings: { [B("htmlExport")]: "https://www.dropbox.com/s/abc/page.html" } }, { errors: [], warningsContain: ["the link is not on drive.google.com"] });
add("D-01 two slots share one Drive file", { ratings: { [T("debugInfoTurn2")]: link("DBG_T1") } }, { errorsContain: ["links the same Drive file as 1 other slot"] });

// ---------------------------------------------------------------- F
add("F-01 unfetchable link", { ratings: { [T("debugInfoTurn3")]: link("NOSUCHFILE") } }, { errorsContain: ["the linked file could not be retrieved"] });
add("F-02 the file is not a debug capture", { ratings: { [T("debugInfoTurn2")]: link("NOTDEBUG") } }, { errorsContain: ["does not look like a debug capture"] });
add("F-03 the file is not a saved page", { ratings: { [T("htmlExport")]: link("NOTDEBUG") } }, { errorsContain: ["does not look like a saved conversation page"] });
add("F-04 the Takeout link is a note, not an export (warn)", { ratings: { geminiTakeout: link("TAKEOUT_BAD") } }, { errors: [], warningsContain: ["does not look like a Gemini Takeout export"] });
add("F-05 debug files fit neither export shape", {
  ratings: { [T("numberOfTurns")]: "2", [T("debugInfoTurn1")]: link("DBG_T2"), [T("debugInfoTurn2")]: link("DBG_T5"),
             [T("debugInfoTurn3")]: DELETE, [T("debugInfoTurn4")]: DELETE, [T("debugInfoTurn5")]: DELETE,
             [T("didTurn2HaveIssue")]: "Yes", [T("turn5MemorySection")]: DELETE, [T("turn2MemorySection")]: "Retrieved Memory",
             [T("didTurn3HaveIssue")]: DELETE, [T("didTurn4HaveIssue")]: DELETE, [T("didTurn5HaveIssue")]: DELETE,
             testSideTurnBreakdown: "[Turn 1] clean. [Turn 2] the loss." },
}, { errorsContain: ["do not line up with the 2 turns declared on this side"] });
// The shape task 1267733 actually had: a declared turn whose capture repeats the previous
// state (same prompts, telemetry-only difference) because the turn was cancelled.
add("F-05 a later slot documents no additional turn (task 1267733 shape)", {
  ratings: { [T("numberOfTurns")]: "2", [T("debugInfoTurn1")]: link("DBG_T4"), [T("debugInfoTurn2")]: link("DBG_T4B"),
             [T("debugInfoTurn3")]: DELETE, [T("debugInfoTurn4")]: DELETE, [T("debugInfoTurn5")]: DELETE,
             [T("didTurn2HaveIssue")]: "Yes", [T("turn5MemorySection")]: DELETE, [T("turn2MemorySection")]: "Retrieved Memory",
             [T("didTurn3HaveIssue")]: DELETE, [T("didTurn4HaveIssue")]: DELETE, [T("didTurn5HaveIssue")]: DELETE,
             testSideTurnBreakdown: "[Turn 1] clean. [Turn 2] the loss." },
}, { errorsContain: ["does not document an additional turn"] });
add("F-06 Base capture does not carry the full bait history", { ratings: { [B("debugInfoTurn1")]: link("DBG_B3") } }, { errorsContain: ["but the Test side ran 5 turns"] });
add("F-07 two Drive files with identical contents (warn)", { ratings: { [B("htmlExport")]: link("HTML_DUP") } }, { errors: [], warningsContain: ["identical to 1 other slot"] });
add("F-08 PContext declared but absent (warn)", { ratings: { [T("wasPContextTriggered")]: "Yes" } }, { errors: [], warningsContain: ["no retrieval call appears in this side's debug"] });
add("F-08 PContext present but declared No (warn)", { ratings: { [T("debugInfoTurn5")]: link("DBG_T5_PCTX") } }, { errors: [], warningsContain: ["the debug shows 1 retrieval call"] });

// F-09: the shape of task 1267733 -- Prod Frozen answered every turn (captures 1/2/3) while
// Mochi only ever received the last one. Nothing at field level sees this; only the cross-side
// block-count shape does. The downstream shape checks must stand down so the real message is
// not buried under restatements of it.
add("F-09 the conversation was run on the other model", {
  ratings: { [T("numberOfTurns")]: "1", [T("debugInfoTurn1")]: link("DBG_INV_T"),
             [T("debugInfoTurn2")]: DELETE, [T("debugInfoTurn3")]: DELETE,
             [T("debugInfoTurn4")]: DELETE, [T("debugInfoTurn5")]: DELETE,
             [T("didTurn1HaveIssue")]: "Yes", [T("turn1MemorySection")]: "Retrieved Memory",
             [T("didTurn2HaveIssue")]: DELETE, [T("didTurn3HaveIssue")]: DELETE,
             [T("didTurn4HaveIssue")]: DELETE, [T("didTurn5HaveIssue")]: DELETE,
             [T("turn5MemorySection")]: DELETE,
             testSideTurnBreakdown: "[Turn 1] the loss.",
             [B("numberOfTurns")]: "3", [B("debugInfoTurn1")]: link("DBG_INV_B1"),
             [B("debugInfoTurn2")]: link("DBG_INV_B2"), [B("debugInfoTurn3")]: link("DBG_INV_B3") },
}, { errorsContain: ["the conversation was run on the other model"] });
// Near-miss non-fire: a correct task has ONE Base capture, so the ladder clause can never match.
// (The valid base case above is the primary proof; this pins the 2-turn variant explicitly.)
add("F-09 near-miss non-fire: correct roles with a 2-turn Test side", {
  ratings: { [T("numberOfTurns")]: "2", [T("debugInfoTurn1")]: link("DBG_T1"), [T("debugInfoTurn2")]: link("DBG_T2"),
             [T("debugInfoTurn3")]: DELETE, [T("debugInfoTurn4")]: DELETE, [T("debugInfoTurn5")]: DELETE,
             [T("didTurn2HaveIssue")]: "Yes", [T("turn2MemorySection")]: "Retrieved Memory",
             [T("didTurn3HaveIssue")]: DELETE, [T("didTurn4HaveIssue")]: DELETE, [T("didTurn5HaveIssue")]: DELETE,
             [T("turn5MemorySection")]: DELETE,
             testSideTurnBreakdown: "[Turn 1] clean. [Turn 2] the loss.",
             [B("debugInfoTurn1")]: link("DBG_T2B") },
}, { errors: [] });

// ---------------------------------------------------------------- A
add("A-01 capture does not start with the form's prompt", { ratings: { [T("debugInfoTurn1")]: link("DBG_T1_WRONGFIRST") } }, { errorsContain: ["the first prompt in this debug capture is not the prompt recorded on the form"] });
add("A-02 bait prompt retyped with a typo (warn tier, prints the overlap)", { ratings: { [B("debugInfoTurn1")]: link("DBG_B_TYPO") } }, { errors: [], warningsContain: ["% word overlap"] });
add("A-02 Base capture ends on a different prompt", { ratings: { [B("debugInfoTurn1")]: link("DBG_B_DIFF") } }, { errorsContain: ["is not the bait prompt from the Test conversation"] });
add("A-03 Base capture is missing shared history", { ratings: { [B("debugInfoTurn1")]: link("DBG_B_GAP") } }, { errorsContain: ["missing 1 prompt from the shared conversation history"] });
add("A-04 an earlier Test capture holds a foreign prompt", { ratings: { [T("debugInfoTurn2")]: link("DBG_T2_ALT") } }, { errorsContain: ["contains prompts that are not in this side's final capture"] });
add("A-05 turn 1 capture holds two prompts", { ratings: { [T("debugInfoTurn1")]: link("DBG_T1_TWO") } }, { errorsContain: ["a first-turn capture holds one"] });

// ---------------------------------------------------------------- I
add("I-01 Base capture is not the frozen model", { ratings: { [B("debugInfoTurn1")]: link("DBG_B_NOTFROZEN") } }, { errorsContain: ["did not come from the frozen production model"] });
add("I-01 Test capture is the frozen model", { ratings: { [T("debugInfoTurn5")]: link("DBG_T5_FROZEN") } }, { errorsContain: ["came from the frozen production model, which is the Base model"] });
add("I-02 both sides share one model configuration", { ratings: { [T("debugInfoTurn5")]: link("DBG_T5_FROZEN") } }, { errorsContain: ["both sides' debug captures come from the same model configuration"] });
add("I-03 first model shown differs from the assignment (warn)", { ratings: { modelOrder: BASE } }, { errors: [], warningsContain: ["differs from the assigned first model"] });

// ---------------------------------------------------------------- C
add("C-01 a loss before the last turn, last turn clean", { ratings: { [T("didTurn3HaveIssue")]: "Yes", [T("turn3MemorySection")]: "Retrieved Memory", [T("didTurn5HaveIssue")]: "No", [T("turn5MemorySection")]: DELETE } }, { errorsContain: ["but the last turn (5) is marked clean"] });
add("C-02 an earlier issue turn before the loss (warn, legal)", { ratings: { [T("didTurn3HaveIssue")]: "Yes", [T("turn3MemorySection")]: "Retrieved Memory" } }, { errors: [], warningsContain: ["before the loss turn 5"] });
add("C-03 Base side ran more than one turn (warn)", { ratings: { [B("numberOfTurns")]: "2", [B("debugInfoTurn2")]: link("DBG_B_TYPO") } }, { warningsContain: ["the comparison usually needs only the bait prompt"] });
// Regression, task 1267733: "[Turn K] - [Section]. rationale..." is a live convention; v1.0.1
// split it on commas and warned on six prose fragments.
add("C-04 near-miss non-fire: bracketed section name followed by prose", {
  ratings: { [T("turn5MemorySection")]: "[Turn 5] - [Retrieved Memory]. The issue was caused by Gmail content retrieved through gmail_bard:search, which surfaced the dispute, file number, and recipient details." },
}, { errors: [], warningsContain: [] });
add("C-04 memory section is not a standard section (warn)", { ratings: { [T("turn5MemorySection")]: "just vibes" } }, { errors: [], warningsContain: ["is not one of the standard sections"] });
add("C-05 turn-by-turn breakdown misses a turn label (warn)", { ratings: { testSideTurnBreakdown: "[Turn 1] clean. [Turn 2] clean. [Turn 3] clean. [Turn 5] the loss." } }, { errors: [], warningsContain: ["[Turn 4]"] });
add("C-06 Intent Hijack with the core task completed (warn)", { ratings: { [T("lossCategory")]: "Leakage Loss", [T("leakageCategorization")]: "Intent Hijack", [T("leakageEgregiousness")]: "Very Egregious", [T("testCoreTaskCompletion")]: "Yes", [T("generalLossCategorization")]: DELETE, [T("generalLossSeverity")]: DELETE } }, { errors: [], warningsContain: ["categorised as Intent Hijack while the core task is marked completed"] });
add("C-07 Harmless Callback rated Not Egregious (warn)", { ratings: { [T("lossCategory")]: "Leakage Loss", [T("leakageCategorization")]: "Harmless Callback", [T("leakageEgregiousness")]: "Not Egregious", [T("testCoreTaskCompletion")]: "Yes", [T("generalLossCategorization")]: DELETE, [T("generalLossSeverity")]: DELETE } }, { errors: [], warningsContain: ["may not count as a loss"] });

// ---------------------------------------------------------------- B
add("B-01 the form's models are not the two assigned models", { input: { "Model A": "Some Third Model - Fast" } }, { errorsContain: ["not the two models assigned in the batch"] });
// Regression, task 1267733: the batch assigns the OTHER model first. Display order is
// randomised per task and is not a role, so B-01 must stay silent (I-03 warns instead).
add("B-01 near-miss non-fire: display order flipped in the batch", { input: { "First Model": BASE } }, { errors: [], warningsContain: ["differs from the assigned first model", "every conversation starts on"] });
add("B-02 the form prompt differs from the assigned prompt (warn)", { input: { prompt: "A completely different assigned prompt about budgeting spreadsheets." } }, { warningsContain: ["differs from the prompt in the assignment"] });
add("B-01..B-03 self-skip loudly when the batch root is absent", { input: { "First Model": DELETE, "Model A": DELETE, "Model B": DELETE, "Model A HTML NAME": DELETE, "Model B HTML NAME": DELETE } }, { errors: [] });

writeFileSync(join(here, "cases.json"), JSON.stringify(cases, null, 1));
console.log(`Wrote ${cases.length} cases and ${Object.keys(ARTIFACTS).length + 5} fetch mocks.`);
