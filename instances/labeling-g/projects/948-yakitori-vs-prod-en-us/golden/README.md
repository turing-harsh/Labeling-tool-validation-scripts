# Golden sample data — labeling-g / 948-yakitori-vs-prod-en-us

Drop **sample task payloads** here as `.txt` (or `.json`) files, one task per file, to eyeball
what the validation script reports on real-looking data. Unlike `../fixtures/cases.json`, golden
files carry **no assertions** — the runner just runs them and prints the findings.

## Format

Each file = **one JSON object**, the `conversationData` the tool passes to `validate()`:

```json
{
  "ratings": [
    { "key": "prompt", "question": "Prompt", "human_input_value": "..." }
  ]
}
```

Also accepted: a **JSON array** of `conversationData` (runs each), or a **batch export**
(`{ "sft": [...], "form": { ... } }`) — the runner iterates every task.

## Run it

```bash
npm run golden -- labeling-g/948-yakitori-vs-prod-en-us                 # all golden files
npm run golden -- labeling-g/948-yakitori-vs-prod-en-us golden/one.txt  # a single file
```

## Regression cases

| Task | Why it is kept |
|---|---|
| 1271432 | **Size outlier**: 36.68 MB of artifacts, saved pages of 18.54 MB and 17.41 MB (every other task here: 2.1–2.6 MB). It killed the isolate with `Promise was abandoned` until build-prq v1.1.1 stopped `extractSessionTokens` entity-decoding whole pages — see 941 `requirements.md` §10.8. Re-run it after any edit that touches the fetch layer, and watch peak memory, not just the findings: `/usr/bin/time -l node scripts/run-golden.mjs labeling-g/948-yakitori-vs-prod-en-us 1271432.txt` should stay far below the isolate's 256 MB cap (236 MB peak RSS locally, of which ~176 MB is just holding the fetched bytes). |
| 1271292 | Empty file — the runner must skip it without erroring. |
