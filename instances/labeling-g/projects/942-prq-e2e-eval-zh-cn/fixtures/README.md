# 942 fixtures — generated, do not hand-edit

Both projects share ONE checks source and ONE fixture generator, in
`../941-prq-e2e-eval-es-419/`. Regenerate this project's cases with:

```bash
cd ../941-prq-e2e-eval-es-419
node fixtures/gen-cases.mjs ../942-prq-e2e-eval-zh-cn/fixtures/cases.json zh
cp fixtures/artifacts/* ../942-prq-e2e-eval-zh-cn/fixtures/artifacts/
```

The only difference from 941's suite is the locale the base task declares (Chinese /
Mainland (Simplified)), which is what F7-01 compares against.
