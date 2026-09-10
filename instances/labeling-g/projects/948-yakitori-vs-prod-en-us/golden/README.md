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
