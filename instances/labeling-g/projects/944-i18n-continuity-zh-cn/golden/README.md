# Golden samples — 944 i18n Continuity (zh-CN)

Drop real task payloads here as `<taskId>.txt` (or `.json`) — a `conversationData` object with
`conversation.ratings` (object map `key -> {value}`; per-side keys namespaced as
`compareModels.<model name>.<questionKey>`) and, when available, `conversation.input` (batch axes).

Run them through the real sandbox and eyeball the findings (no assertions):

```bash
npm run golden -- labeling-g/944-i18n-continuity-zh-cn
```

## First-task verification (requirements §15 — blocking at deploy)

Record an answer for each before trusting production output:

1. **Per-side key shape** is `compareModels.<model name>.<questionKey>` — the run logs
   `ALL DISCOVERED NAMESPACES` on every task; confirm Model A / Model B bind exactly.
2. **Batch/input root resolves** — if not, §9 (B-01..B-07) self-skips with a loud log (expected,
   but record it).
3. **Artifact fields hold one Drive file link** — confirmed on ST tasks; re-confirm on the first MT task.
4. **Multi-Turn branch** — no completed MT task existed in the sample; every MT check (G-06..G-08,
   C-07..C-10) is structurally verified but behaviourally unproven. Replay one MT task before trusting
   any MT finding.
5. **Model-name bytes** — exactly as in requirements §1, including `-->` and ` - Fast`. An exact-match
   miss skips that side with a log; fix the identity table, never loosen the match.

## Regression cases (requirements §16 — re-run after any edit touching their checks)

| Task | Class | Check |
|---|---|---|
| 1264303 | thread HTML and model HTML are the same Drive file | D-01 |
| 1264308 | ST task, one side declares 2 turns | B-06 |
| 1264311 | trailing newlines inside link fields — must **not** fire | U-05 non-fire |
| *(needed)* | first completed Multi-Turn task | G-06..G-08, C-07..C-10 |
