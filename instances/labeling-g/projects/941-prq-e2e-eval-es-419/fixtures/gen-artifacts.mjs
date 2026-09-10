// Generate fixtures/artifacts/* -- the mock Drive files the fetch-layer fixtures resolve against
// (scripts/run-tests.mjs maps <driveFileId>.<ext> in this directory to a fetch result).
//
// The mocks MUST mirror the real capture and page structure, because several checks parse that
// structure rather than free text:
//   - debug: "Agency config id" (F5 identity), llmdebugger session links (F3-12),
//            "<ctrl99>user ... <ctrl100>" blocks (F4 family), "Source Profile: source_name:
//            DATA_SOURCE_USER_PROFILE_*" (F7-03), num_turns_read_from_footprints (F4-G/H)
//   - html:  <user-query>/<model-response> ELEMENTS (F3-08/F3-10/F3-13 read the visible
//            conversation, not whole-page text), the bard-mode-menu-button aria-label (F3-09),
//            the saved-from conversation id, and the same llmdebugger links (F3-12)
// All of it is copied from the real shapes observed in project 948's golden captures.
//
// Regenerate with:  node fixtures/gen-artifacts.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "artifacts");
mkdirSync(dir, { recursive: true });
const W = (name, body) => writeFileSync(join(dir, name), body);

const P = "What should I pack for my trip to Lisbon next week?";
const Q2 = "Can you add a packing list for the rainy days?";
const OM = "[Content of all requested items is omitted here because it may be found above or below.]";
const RESP = "Pack layers, a light rain shell, and comfortable walking shoes.";

const AG_TEST = "bard/gemini_chat/0.2.170-prod-p13n-memory-strike-0828-stm-v2p5-token-budget-rm-rrf-listwise-top-20-2d-bb-based";
const AG_BASE = "bard/gemini_chat/0.2.171-prod-p13n-prod-frozen-baseline";
const dbgUrl = (tok) => `https://llmdebugger.corp.google.com/agency?s=${tok}`;

// A Gemini debug capture. `users` are the user blocks in order (real captures are CUMULATIVE:
// turn t replays turns 1..t). `tokens` are that capture's llmdebugger session ids.
function dbg(users, o = {}) {
  const opt = Object.assign({ agency: AG_TEST, footprints: 0, slice: "FULL", resp: RESP, tokens: [], sources: true, modelId: null }, o);
  let h = `You're using the BAS->Agency path.\nAgency config id: "${opt.agency}"\nRecipe ID: models/gemini-v4p1s-rev25-s-raw-thoughts-bard-agency\nThinking Level: MEDIUM\n`;
  if (opt.slice === "FULL") {
    h += `num_turns_read_from_footprints: ${opt.footprints}\n`;
    if (opt.sources) {
      for (const s of ["PHOTOS", "BARD_SEARCH", "GMAIL"]) {
        h += `------ Source Profile: source_name: "DATA_SOURCE_USER_PROFILE_${s}" text_profile: "## profile text for ${s}"\n`;
      }
    }
  }
  if (opt.modelId) h += `Model ID: ${opt.modelId}\n`;
  for (const t of opt.tokens) h += `Debug link: ${dbgUrl(t)}\n`;
  h += "LM prefix: <ctrl99>system SPECIAL INSTRUCTION\n<ctrl100>\n";
  let b = "";
  for (const u of users) b += `<ctrl99>user\n${u}\n<ctrl100>\n<ctrl99>model\n${opt.resp}\n<ctrl100>\n`;
  return h + b;
}

// A saved Gemini conversation page, using the real element structure.
function html(users, model, convId, o = {}) {
  const opt = Object.assign({ agency: AG_TEST, resp: RESP, tokens: [], gemini: true }, o);
  let turns = "";
  users.forEach((u, i) => {
    turns += `<user-query class="ng-star-inserted"><span class="user-query-container"><user-query-content class="user-query-container">`
      + `<div class="query-content"><p class="query-text-line">${u}</p></div></user-query-content></span></user-query>\n`
      + `<model-response class="ng-star-inserted"><div class="model-response-text"><structured-content-container>`
      + `<p>${opt.resp}</p></structured-content-container></div></model-response>\n`;
    void i;
  });
  // Saved pages embed the Debug Info panel verbatim -- that is exactly why the content checks
  // read the visible conversation instead of whole-page text, so the mocks embed it too.
  const debugPanel = `<div class="debug-info"><h3>Debug Info</h3><pre>Agency config id: "${opt.agency}"\n`
    + opt.tokens.map((t) => `Debug link: ${dbgUrl(t)}`).join("\n")
    + `\n&lt;ctrl99&gt;user ${users[0] || ""} &lt;ctrl100&gt;</pre></div>`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Trip packing help - Google Gemini</title></head>
<body>
<!-- saved from url=(0043)https://gemini.google.com/app/${convId} -->
${opt.gemini ? `<button data-test-id="bard-mode-menu-button" aria-label="Open mode picker, currently ${model}"><mat-icon>expand</mat-icon></button>` : ""}
<div class="chat-history">
${turns}</div>
${debugPanel}
</body></html>`;
}

// ---- clean base: two turns per side, cumulative debug, distinct agency ids, matching tokens
const T = { t1: "TESTTOK1", t2: "TESTTOK2" };
const B = { t1: "BASETOK1", t2: "BASETOK2" };

W("DBG_T1.txt", dbg([P], { agency: AG_TEST, footprints: 0, tokens: [T.t1] }));
W("DBG_T2.txt", dbg([P, Q2], { agency: AG_TEST, footprints: 0, tokens: [T.t2] }));
W("DBG_B1.txt", dbg([P], { agency: AG_BASE, footprints: 0, tokens: [B.t1] }));
W("DBG_B2.txt", dbg([P, Q2], { agency: AG_BASE, footprints: 0, tokens: [B.t2] }));
W("HTML_T.html", html([P, Q2], "Nippon - Mochi - Fast", "convtest01", { agency: AG_TEST, tokens: [T.t1, T.t2] }));
W("HTML_B.html", html([P, Q2], "Nippon - Prod Frozen - Fast", "convbase01", { agency: AG_BASE, tokens: [B.t1, B.t2] }));

// ---- F4 / F3 adversarial variants
W("DBG_T1_CRLF.txt", dbg([P + "\n" + OM], { tokens: [T.t1] }).replace(/\n/g, "\r\n"));
W("DBG_T1_FFFD.txt", dbg([P.replace(/ /g, "� ")], { tokens: [T.t1] }));
W("DBG_WRONG.txt", dbg(["How do I reset my router?"], { tokens: [T.t1] }));
W("DBG_T2_BROKEN.txt", dbg(["How do I reset my router?", "And the password?"], { tokens: [T.t2] }));
W("DBG_T1_TWIN.txt", dbg([P], { agency: AG_TEST, footprints: 0, tokens: [T.t1] }));       // byte-identical to DBG_T1
W("DBG_T2_TWIN.txt", dbg([P, Q2], { agency: AG_TEST, footprints: 0, tokens: [T.t2] }));   // byte-identical to DBG_T2
W("DBG_B1_FOOT.txt", dbg([P], { agency: AG_BASE, footprints: 3, tokens: [B.t1] }));
// identity variants (agency id is the discriminator now)
W("DBG_T2_OTHERID.txt", dbg([P, Q2], { agency: AG_BASE, tokens: [T.t2] }));
W("DBG_B1_SAMEID.txt", dbg([P], { agency: AG_TEST, tokens: [B.t1] }));
W("DBG_B2_SAMEID.txt", dbg([P, Q2], { agency: AG_TEST, tokens: [B.t2] }));
// partial (Agency) slice: no footprints, no Source Profile blocks
W("DBG_T1_AGENCY.txt", dbg([P], { agency: AG_TEST, slice: "AGENCY", tokens: [T.t1] }));
W("DBG_T2_AGENCY.txt", dbg([P, Q2], { agency: AG_TEST, slice: "AGENCY", tokens: [T.t2] }));
// FULL share carrying no personal context at all (F7-03's one decidable failure)
W("DBG_T1_NOSRC.txt", dbg([P], { agency: AG_TEST, footprints: 0, sources: false, tokens: [T.t1] }));
// headers but zero conversation blocks (F3-05)
W("DBG_NOUSER.txt", `You're using the BAS->Agency path.\nAgency config id: "${AG_TEST}"\nnum_turns_read_from_footprints: 0\nLM prefix:\n`);
W("NOT_DEBUG.txt", "Shopping list\n- milk\n- bread\n");
// F3-12: debug whose session tokens appear on NO page (the 1271348 Prod Frozen defect)
W("DBG_B1_ORPHAN.txt", dbg([P], { agency: AG_BASE, footprints: 0, tokens: ["ORPHANTOK1"] }));
W("DBG_B2_ORPHAN.txt", dbg([P, Q2], { agency: AG_BASE, footprints: 0, tokens: ["ORPHANTOK2"] }));

// Defect 2: the debug/page say "ecommerce" while the form says "e-commerce". Same conversation,
// one character apart -- must not fire under the comparison-only token fold.
const PH = "He visto videos sobre ecommerce en youtube";
W("DBG_T1_HYPHEN.txt", dbg([PH], { agency: AG_TEST, footprints: 0, tokens: [T.t1] }));
W("DBG_B1_HYPHEN.txt", dbg([PH], { agency: AG_BASE, footprints: 0, tokens: [B.t1] }));
W("HTML_T_HYPHEN.html", html([PH], "Nippon - Mochi - Fast", "convtest01", { agency: AG_TEST, tokens: [T.t1] }));
W("HTML_B_HYPHEN.html", html([PH], "Nippon - Prod Frozen - Fast", "convbase01", { agency: AG_BASE, tokens: [B.t1] }));

// ---- HTML variants
W("HTML_T_COPY.html", html([P, Q2], "Nippon - Mochi - Fast", "convtest01", { agency: AG_TEST, tokens: [T.t1, T.t2] }));
W("HTML_OTHER.html", html(["How do I reset my router?"], "Nippon - Mochi - Fast", "convother1", { agency: AG_TEST, resp: "Open the admin page.", tokens: [T.t1, T.t2] }));
// single-turn pages, for cases that declare numberOfTurns = 1 (F3-13 compares the two)
W("HTML_T_1TURN.html", html([P], "Nippon - Mochi - Fast", "convtest01", { agency: AG_TEST, tokens: [T.t1] }));
W("HTML_B_1TURN.html", html([P], "Nippon - Prod Frozen - Fast", "convbase01", { agency: AG_BASE, tokens: [B.t1] }));
W("HTML_T_3TURNS.html", html([P, Q2, "And shoes?"], "Nippon - Mochi - Fast", "convtest01", { agency: AG_TEST, tokens: [T.t1, T.t2] }));
W("HTML_T_AGBASE.html", html([P, Q2], "Nippon - Mochi - Fast", "convtest01", { agency: AG_BASE, tokens: [T.t1, T.t2] }));
W("NOT_GEMINI.html", "<!doctype html><html><head><title>Invoice</title></head><body><table><tr><td>total</td></tr></table></body></html>");
// zh-CN width-form probe pair
W("DBG_ZH_HALF.txt", dbg(["(下周去里斯本要带什么)"], { tokens: [T.t1] }));

console.log("fixture artifacts written to", dir);
