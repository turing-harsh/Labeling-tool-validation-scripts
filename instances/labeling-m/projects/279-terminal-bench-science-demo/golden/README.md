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

**FAIL, with 8 errors and 1 warning.** The gate admits only the ideal structure, and this demo
package predates it:

- it ships `authoring/` and `harbor-canary` markers, which are both forbidden
- `solution/solve.sh` has no shebang
- the verifier is not pytest: `test.sh` runs `python3 /tests/test_outputs.py` without
  `set -e`, there is no `def test_...`, and `tests/Dockerfile` installs no pytest pins and
  does not create `/logs/verifier`
- the warning is advisory: `[agent] timeout_sec = 28800` is above the 18000 cap

`380030.txt` and `380090.txt` report "could not be read" offline because their folders are not
mirrored here. The mirrored folders `379987/` and `380056/` have no `.txt` beside them. Run them
with a ratings object that links `…/drive/folders/379987` or `…/380056`: 379987 fails on
`tests/authoring/` and a `.DS_Store`, and 380056 on one unspaced math delimiter.

Unit fixtures live in `../fixtures/folders/` and are synthetic (see `../requirements.md`).
