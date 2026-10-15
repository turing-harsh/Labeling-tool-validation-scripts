# Requirements — labeling-eval / 198-terminal-bench-science / task-completion

The single gate that runs **at task completion**. It passes only when all three of the
project's pipeline gates pass on the finished task:

| Stage | Source (embedded verbatim) | Reads | Passes when |
|---|---|---|---|
| Task data validation (1128) | `../task-data-validation-1128/validation.js` | `ratings.task` — Drive folder | the task package has the ideal structure ([its requirements](../task-data-validation-1128/requirements.md)) |
| Oracle validation (1183) | `../oracle-validation-1183/validation.js` | `ratings.oracle_check` | every oracle trial of the latest current-version Oracle Check scored reward 1 |
| Pass eval reward validation (1180) | `../pass-at-1-reward-validation-1180/validation.js` | `ratings.pass5Eval` + each model's Harbor GCS ZIP | every model in the roster has a valid, broken rollout backed by its bundle ([its requirements](../pass-at-1-reward-validation-1180/requirements.md)) |

The rules themselves live in those three scripts and their requirements. This file only
specifies how they are combined.

## Composition

`validation.js` is **generated** by `scripts/build-198-task-completion.mjs`. Do not edit it.

- **Verbatim.** Each pipeline script is embedded byte-for-byte inside a factory function.
  There is one source of truth per rule: fix a rule in its pipeline, then rebuild.
- **Isolated.** The factory's parameters shadow the sandbox's `errors`, `warnings`, `infos`,
  `successes` and `logs`. Each stage keeps its own top-level names (`fail`, `ratingsOf`,
  `isArray`… collide across the three) and its own "PASS only when `errors` is empty" logic.
  A failure in one stage therefore never hides another stage's findings or its PASS.
- **Parallel.** All three stages start together. The Drive folder read and the GCS bundle
  fetches share the tool's 30 s budget, so running them one after another would waste it.
- **Ordered output.** Findings are merged into the real arrays in stage order (task data, oracle,
  pass eval), whatever order the stages finish in.
- **Crash-contained.** A stage that throws becomes one `Task Completion — "<stage>"` error.
  The other stages still report.
- **Summary.** One `infos` line per stage (`PASS`, or `FAIL (n errors)`). When nothing failed,
  a final success says all 3 gates pass.

Every message keeps its stage's own scope prefix (`Task Package …`, `Oracle Check …`,
`Post Evaluation …`), so the tool's grouping is unchanged.

## Testing

```bash
node scripts/build-198-task-completion.mjs        # after editing any of the three sources
npm test -- labeling-eval/198-terminal-bench-science
npm run golden -- labeling-eval/198-terminal-bench-science/task-completion
```

`fixtures/folders` and `fixtures/zips` are symlinks to the 1128 Drive-folder fixtures and the
1180 GCS-zip fixtures. `fixtures/make-cases.mjs` composes `cases.json` from those siblings'
fixtures plus a synthetic `oracle_check`. The 7 cases cover:

- all three gates passing;
- each gate failing alone, with the other two still reporting PASS;
- the Oracle Check missing;
- an empty submission failing all three gates.

`golden/conv-380342-run-6637703.json` is the one real completed task that carries all three
inputs. Offline, it shows oracle and pass eval passing, and task data failing with "could not be
read", because that task's Drive folder is not mirrored here. Mirror it to run all three stages:

```bash
node scripts/fetch-folder.mjs labeling-eval/198-terminal-bench-science/task-completion https://drive.google.com/drive/folders/1657gPeIkq8G8IQE37GIgKEJL_XQdcIQt
```

## Open questions before deploying

1. **Script size.** 147 KB, over the 100 KB default. Confirm labeling-eval's `maxScriptSize`.
   labeling-g runs scripts up to ~216 KB.
2. **Trigger.** Which completion trigger/breakpoint id runs this script (`tool_pipeline_id` in
   `metadata.yml` is blank)?
3. **Do the per-pipeline gates stay deployed?** If they keep running at their own breakpoints,
   this gate repeats their work at completion. That is harmless, but it costs a second Drive
   read and second GCS fetches.
