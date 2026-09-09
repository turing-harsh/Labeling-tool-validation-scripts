# Golden samples -- 942 PRQ E2E Eval

Drop real task payloads here as `<taskId>.txt` (or `.json`): a `conversationData` object with
the form answers (object map `key -> {value}`, or the runtime array of
`{key, question, human_input_value}`), per-side keys namespaced
`compareModels.<model name>.<questionKey>`, plus `conversation.input` / `csv_data` when the
batch columns are available. Fetched artifacts are mocked from `golden/artifacts/<driveFileId>.<ext>`.

```bash
npm run golden -- labeling-g/942-prq-e2e-eval-zh-cn
```

## What to read off the FIRST real task

Every row of requirements section 9 is still unproven, and the run log is written to close them.
Look for these lines and record the answers in requirements section 9:

| Log line to find | Closes |
|---|---|
| `A-01 ratings root at <path>` and whether it is an array or an object map | row 1 |
| `ALL COMPARE MODEL NAMESPACES: [...]` -- the exact bytes, arrows and spacing | rows 1, 2 |
| `A-02 metadata root at <path> (<n> columns): [...]` | row 3 |
| whether the debug/HTML fields held Drive file links at all (F3-01 findings) | row 4, escalation 1 |
| `F3-06 <side> Turn <n>: slice=..., user blocks=..., Model ID line(s)=..., footprints=...` | rows 5, 7 |
| `F5-03 <side>: the identity table is EMPTY ... observed Model ID "<id>"` | rows 6, 10 |
| `F4 export shape on <side>: CUMULATIVE / FLAT / MIXED` | row 5, named deviation 1 |
| `F7-03 Test model Turn 1: personal-context sources present ...` | row 8 |
| `F3-09 <side>: page mode-selector label ... conversation id ...` | row 9 |
| `F2-07: bp2 gates on ...` | row 11 |
| `WIDTH PROBE ...` (942 only) | row 13 |
| `A-06: <n> replacement character(s)` | encoding sanity |

A finding class that fires on EVERY task in the batch is a script defect until proven otherwise
(requirements section 7, batch replay).
