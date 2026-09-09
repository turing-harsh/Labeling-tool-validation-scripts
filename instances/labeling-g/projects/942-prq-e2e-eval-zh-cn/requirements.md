# Validation Requirements - 942 (zh-CN)

942 shares ONE requirements ledger and ONE checks source with its es-419 sibling. The spec is:

**[../941-prq-e2e-eval-es-419/requirements.md](../941-prq-e2e-eval-es-419/requirements.md)**

Everything in it applies here unchanged. This project differs in exactly two ways:

1. **Locale assignment (F7-01).** Chinese / Mainland (Simplified), injected by the build. The
   config carries no locale marker, so the expected value is supplied, not derived, and F7-01
   stays a warning until the client rules the field is a hard assignment (escalation 6).

2. **zh-CN width forms (requirements section 5 locale notes).** The normalization ladder does
   NOT fold full-width to half-width and does NOT apply NFKC: NFC leaves U+FF01..U+FF5E and
   ideographic punctuation distinct, which is the intended behaviour until real data says
   otherwise. A measure-only probe logs, for every prompt-vs-first-user-block inequality,
   whether full-width characters are present, whether the two become equal after width folding,
   and the word overlap. Width folding is added ONLY if the probe shows it in real zh-CN data,
   with the probe line as the incident citation.

Do not edit checks here. Edit
`../941-prq-e2e-eval-es-419/parts/prq-checks.js` or `.../prq-fetch-checks.js` and rebuild both
projects with `node scripts/build-941.mjs`.

**Blocking (escalation 11):** 942's own config export has not been received, so this build
derives its tables from 941's config. See `metadata.yml` -> `parity`.
