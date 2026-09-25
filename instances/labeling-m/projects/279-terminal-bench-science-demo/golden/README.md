# Golden sample data — labeling-m / 279-terminal-bench-science-demo

`1961550.txt` is the `conversationData` for conversation 1961550 of batch 4065 — the sample task,
whose `ratings.task` links the Drive folder `1aNCMUaRh4jLKevQhrcEHWlvhOYHIPaNs`.

```bash
npm run golden -- labeling-m/279-terminal-bench-science-demo
```

## The fetched folder

`folders/1aNCMUaRh4jLKevQhrcEHWlvhOYHIPaNs/` is that task's real package (25 files), mirrored
from Drive so golden runs work offline — the local runner maps a Drive folder link to
`folders/<folderId>/`. **It is gitignored: it is client data.** Re-fetch it with:

```bash
node scripts/fetch-folder.mjs labeling-m/279-terminal-bench-science-demo https://drive.google.com/drive/folders/1aNCMUaRh4jLKevQhrcEHWlvhOYHIPaNs
```

That walk mirrors the tool's own: it follows shortcuts, skips Google Workspace files and writes
the `.mimetypes.json` sidecar, so a skipped entry appears locally exactly as it would in the tool.

Layout, for reference when reading the script:

```
task.toml  instruction.md  README.md
tests/        test.sh test_outputs.py grader.py kitf.py reference.json private.npz Dockerfile
solution/     solve.sh solve.py oracle.py kitf.py
environment/  Dockerfile  data/{spec.json,proxy.npz,check_outputs.py}
authoring/    provenance/build_instance.py
              evidence/{oracle_selftest,spec_matches_verifier,tolerances,calibrate,
                        instance_spread,alt_spectral_truncation}.py
```

## Expected today

PASS at the default `upload` profile with **0 errors and 0 warnings**, and the same at `audit`.
Add `"validationProfile": "delivery"` to the ratings object to see the one finding it does
produce: `T0.delivery-evaluations-missing` — the package is task-only, with no `evaluations/`.

Unit fixtures live in `../fixtures/folders/` and are synthetic (see `../requirements.md`).
