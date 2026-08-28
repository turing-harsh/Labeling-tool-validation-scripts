// Validation script — <INSTANCE> / <PROJECT>
//
// Contract (see docs/CONVENTIONS.md):
//   Define `async function validate(conversationData)`.
//   Push into the injected globals — do NOT declare them:
//     errors[]     -> pushing here FAILS the task
//     warnings[]   -> non-blocking
//     infos[] successes[] logs[]
//   PASS = errors.length === 0. Plain script only: no import/export/require.

async function validate(conversationData) {
  const byKey = {};
  const labelByKey = {};
  for (const r of conversationData?.ratings || []) {
    if (r && typeof r.key === "string") {
      byKey[r.key] = r.human_input_value;
      labelByKey[r.key] = r.question || r.key;
    }
  }

  // TODO: implement rules from requirements.md, e.g.
  // if (!byKey.someField) errors.push(`${labelByKey.someField || "someField"} is required`);

  logs.push("Validation complete.");
}
