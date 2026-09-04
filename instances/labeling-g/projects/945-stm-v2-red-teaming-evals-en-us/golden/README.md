# Golden samples — 945

`1267698.txt` is the first completed task on this project, exported from the tool as one
`conversationData` JSON object. It is the regression anchor for the §3 inert-Base-rubric rule,
F-05, F-06, A-01..A-05, I-01, I-02 and C-04 (see requirements.md §19).

`artifacts/` holds the nine real Drive files that task links to, named by their Drive file id so
`scripts/run-golden.mjs` can serve them to the script's `fetchDataFromDriveLink` calls offline:

| id | field |
|---|---|
| `1m3gp5d4KPMombtRnRHFT06zweL2_agaW.txt` … `1Zl1eK1Jt_f5Uk2CYvdX1797Dr2c3jiAX.txt` | Test `debugInfoTurn1..5` (cumulative: 1/2/3/4/5 user blocks) |
| `1pg72fxcuGd9nqdzV0o2piBd5DZEZ9x1M.txt` | Base `debugInfoTurn1` (5 user blocks — the branch plus the bait prompt) |
| `1NiFOGREdMVwlBSxZ-k5X32TGrxTzBE77.html`, `1VofH00yL2z5rMC3QBXviZS43ax3FrCDN.html` | Test / Base `htmlExport` |
| `1f_OQI91GYvZItVHKW28Nyby16S4AZKiG.json` | `geminiTakeout` (a My Activity export, not a zip) |

Run it:

```bash
node scripts/run-golden.mjs labeling-g/945-stm-v2-red-teaming-evals-en-us
```

Expected: PASS, 0 errors, 0 warnings. Any new finding on this task is a regression until proven
otherwise — it was submitted and accepted.
