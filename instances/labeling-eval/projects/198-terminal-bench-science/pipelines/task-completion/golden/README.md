# Golden sample data — labeling-eval / 198-terminal-bench-science / task-completion

`conv-380342-run-6637703.json` is a real completed project-198 task that carries all three
inputs: `task` (Drive folder `1657gPeIkq8G8IQE37GIgKEJL_XQdcIQt`), `oracle_check` and
`pass5Eval`. It is the same file as in `../pass-at-1-reward-validation-1180/golden/`.

```bash
npm run golden -- labeling-eval/198-terminal-bench-science/task-completion
```

`zips/` holds that run's two Harbor bundles and is gitignored, because it is client data. The
Drive folder is **not** mirrored, so offline the task-data stage reports "could not be read",
while oracle and pass eval pass. Mirror it with:

```bash
node scripts/fetch-folder.mjs labeling-eval/198-terminal-bench-science/task-completion https://drive.google.com/drive/folders/1657gPeIkq8G8IQE37GIgKEJL_XQdcIQt
```
