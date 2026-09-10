# Validation Requirements - 942 (zh-CN)

942 shares ONE requirements ledger and ONE checks source with its es-419 sibling. The spec is:

**[../941-prq-e2e-eval-es-419/requirements.md](../941-prq-e2e-eval-es-419/requirements.md)**

Everything in it applies here **except the Q1 cascade below**. This project differs in three ways:

0. **THE SEVERITY HEADS ARE GATED ON Q1 — 941's are not.** This is a structural difference in the
   form, not a locale difference, and it was only discovered when 942's own config export
   (review-criteria **3781**) finally arrived on 10 Sep 2026, closing escalation 11 with the
   opposite answer to the one predicted. All ten heads are shown only when
   `model1PersonalizationTriggering` contains a `Personalized (…)` option; with `Not Personalized`
   alone they are hidden and **absent from the payload**.
   - Proven on real tasks: 1271023 (Not Personalized) carries 0/10 heads; 1271024 (Personalized)
     carries 10/10. 941/1270939 (Not Personalized) carries 10/10.
   - **941 Fact 13 does not apply here.** On 941 "Not Personalized + N/A on the heads" is the
     instructed compliant pattern; on 942 that is ten stale hidden answers (F2-04), and the
     compliant shape is the heads being absent.
   - Before this was implemented, task 1271023 produced **20 false errors**.
   - The gate uses the `in` operator with reversed operands; see 941 requirements §10.6.

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
projects with `node scripts/build-prq.mjs`.

**Escalation 11: CLOSED (10 Sep 2026), DIFFERS.** 942's own config export is in the repo at
`config/project-config-id-942.json` and the tables are derived from it. The machine-diff against
941 runs on every build and reports the divergence by name. The two projects are **not**
interchangeable.

**Open for a config owner:** 941 and 942 are meant to be the same eval in two locales, yet they
disagree on whether the rubric heads are visible when nothing was personalized. One of the two
configs is probably a mistake. The script implements whatever each config says, but this changes
what raters are asked to do and should be confirmed.
