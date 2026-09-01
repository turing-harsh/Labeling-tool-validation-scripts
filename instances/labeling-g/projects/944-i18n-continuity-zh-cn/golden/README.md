# Golden samples — 944 i18n Continuity (zh-CN)

Drop real task payloads here as `<taskId>.txt` (or `.json`) — a `conversationData` object with
`conversation.ratings` (object map `key -> {value}`; per-side keys namespaced as
`compareModels.<model name>.<questionKey>`) and, when available, `conversation.input` (batch axes).

Run them through the real sandbox and eyeball the findings (no assertions):

```bash
npm run golden -- labeling-g/944-i18n-continuity-zh-cn
```

## First-task verification (requirements §17 — answers recorded against task 1264318)

1. **Per-side key shape** — ✅ CONFIRMED: `ALL DISCOVERED NAMESPACES` logs both model names and
   they bind exactly (`compareModels.<model name>.<questionKey>`).
2. **Batch/input root resolves** — ✅ CONFIRMED: axes bind from top-level `csv_data` on the runtime
   shape (and `conversation.input` on the export shape).
3. **Artifact fields hold one Drive file link** — ✅ CONFIRMED on ST tasks (6 links on 1264318);
   re-confirm on the first MT task.
4. **Multi-Turn branch** — ✅ CONFIRMED on task 1264388, the first completed MT task (Model A
   2 turns, Model B 3 turns): it passes clean. It also disproved v2.0.2's F-05 assumption —
   Gemini debug captures are **cumulative** (turn *t* replays turns 1..*t*, so turn 2 carries 2
   `<ctrl99>user` markers and turn 3 carries 3). Summing across a side's files gave 3-vs-2 and
   6-vs-3 and blocked both sides of a correct submission; F-05 now accepts the flat and
   cumulative shapes and fires only when the counts fit neither (v2.0.3).
5. **Model-name bytes** — ✅ CONFIRMED, including `-->` and ` - Fast`. An exact-match miss skips
   that side with a log; fix the identity table, never loosen the match.
6. **Fetched debug is Gemini-native** — ✅ CONFIRMED: both sides' debug artifacts carry
   `<ctrl99>user…<ctrl100>` blocks (1 each, matching `numberOfTurns=1`) and `Model ID:` lines
   (`bard_paid_fast_uft90` / `pcontext_1p_paid_fast_prod_notebook_eval`).
   The Takeout export proved to be a JSON array of activity records, NOT HTML — F-03 was split
   accordingly (requirements v2.0.1).
7. **Fetch stage fits the 30s timeout** — bounded by design (concurrent `Promise.allSettled`,
   host-side per-fetch timeout; the isolate has no timers of its own) but unmeasured on a live
   run — watch the first production run's timing log.

## Regression cases (requirements §18 — re-run after any edit touching their checks)

| Task | Class | Check |
|---|---|---|
| 1264303 | thread HTML and model HTML are the same Drive file | D-01 |
| 1264308 | ST task, one side declares 2 turns | B-06 |
| 1264311 | trailing newlines inside link fields — must **not** fire | U-05 non-fire |
| 1264388 | first completed Multi-Turn task; also the F-05 cumulative-debug non-fire | G-06..G-08, C-07..C-10, F-05 |
| *(needed)* | a well-formed link whose share was revoked (fetch fails) | F-01 |
| *(needed)* | a debug slot linking a file that fetches but isn't a Gemini debug capture | F-02 non-fire boundary |
| *(needed)* | a side's fetched debug whose marker counts fit neither export shape, on a real task | F-05 |
