# Golden sample data — 939 Continuity

Drop **sample task payloads** here as `.txt` (or `.json`) files, one task per file. These are
for **eyeballing** what the validation script reports on real-looking data — unlike
`../fixtures/cases.json`, golden files carry **no pass/fail assertions**; the runner just runs
them and prints the findings.

## Format

Each file contains **one JSON object** — the `conversationData` the tool would pass to
`validate()`. Save with a `.txt` extension; the runner parses the JSON inside.

Minimal shape (form/ratings style):

```json
{
  "ratings": [
    { "key": "prompt", "question": "Prompt", "human_input_value": "..." },
    { "key": "numberOfTurns", "question": "Number of Turns", "human_input_value": "1" }
  ]
}
```

Also accepted:
- a **JSON array** of `conversationData` objects (runs each), or
- a **batch export** (`{ "sft": [...], "form": { ... } }`) — the runner iterates every task.

> Paste the exact payload the tool sees. If you only have a batch export JSON, that works too
> (drop the whole export as one `.txt`).

## Run it

```bash
# all golden files for this project
npm run golden -- labeling-g/939-continuity-en-us

# a single file
npm run golden -- labeling-g/939-continuity-en-us golden/my-sample.txt
```

The runner prints, per task: PASS/FAIL, and the errors / warnings / successes the script raised.
