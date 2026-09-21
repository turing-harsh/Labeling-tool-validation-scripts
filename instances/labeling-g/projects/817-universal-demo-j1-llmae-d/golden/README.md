# Golden sample data — labeling-g / 817-universal-demo-j1-llmae-d

`1257845.txt` is the `conversationData` for conversation 1257845 of batch 8647, with the
signed-URL signature redacted (the real signature expires; the link only has to *look* like a
GCS URL for the local runner to resolve it).

`zips/e22a62e3-afa0-4e44-923f-376ab14b6ff2.zip` is that task's real Harbor package, 114 files.
The local runner maps a GCS link to `zips/<object-basename>.zip`, so golden runs work offline.

```bash
npm run golden -- labeling-g/817-universal-demo-j1-llmae-d
```

Expected today: PASS at the default `upload` profile with 14 advisories — the package is
pre-finalization. Add `"validationProfile": "audit"` to the ratings object to see the same 14
as blocking errors.
