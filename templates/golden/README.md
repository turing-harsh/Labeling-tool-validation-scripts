# Golden sample data — <INSTANCE> / <PROJECT>

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
npm run golden -- <INSTANCE>/<PROJECT>                 # all golden files
npm run golden -- <INSTANCE>/<PROJECT> golden/one.txt  # a single file
```

## Fetching

If the script calls `fetchDriveData` / `fetchGcsData`, drop stand-ins beside this README so the
run stays offline: `artifacts/<driveFileId>.<ext>`, `gcs/<objectBasename>`,
`zips/<objectBasename>.zip`, `folders/<folderIdOrPrefix>/…`. The runner prints which mocks it
activated. See [docs/CONVENTIONS.md](../../../../../docs/CONVENTIONS.md) § Local fetch mocks.
