# Golden sample data — labeling-g / 903-ko-kr

Drop **sample task payloads** here as `.txt` (or `.json`) files, one task per file, to eyeball
what `v3.2.32-maps-i18n` reports on real-looking data. No assertions — the runner just runs
them and prints the findings. (Asserted cases live in `../fixtures/cases.json`.)

## Format

Each file = **one JSON object**, the `conversationData` the tool passes to `validate()`.
The 903 script also accepts the `conversation_data` + `csv_data` envelope and batch exports
(`{ "sft": [...], "form": { ... } }`) — its adapters normalize them.

## Run it

```bash
npm run golden -- labeling-g/903-ko-kr                 # all golden files
npm run golden -- labeling-g/903-ko-kr golden/one.txt  # a single file
```
