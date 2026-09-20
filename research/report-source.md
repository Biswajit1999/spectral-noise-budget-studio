# Feature-to-passband audit: compact research report

## Abstract

We tested four declared molecular wavelength markers against four committed JWST/NIRCam system-throughput profiles. Linear interpolation and a filter-relative half-power rule identify four core placements, one low-response edge placement, and eleven pairs outside useful sampled response. CH₄ at 3.30 μm in F277W is non-zero but retains roughly 0.026% of the filter peak, corresponding to an approximately 3,805× source-photon-limited relative-time proxy. The result demonstrates why binary “inside the wavelength range” checks are inadequate. This audit is a pre-ETC optical-coverage test, not a molecular detectability or exposure-time forecast.

## Claim ledger

| Claim | Status | Evidence | Boundary |
|---|---|---|---|
| Four marker/filter pairs are in the half-power core | supported | generated 16-row JSON/CSV matrix | exact source snapshot and declared markers only |
| CH₄/F277W is a severe edge placement | supported | interpolated `T/Tpeak ≈ 0.000263` | source-photon-limited relative proxy |
| These profiles are provenance traceable | supported | source URL plus SHA-256 for every VOTable | hashes identify bytes but do not independently validate calibration |
| A core placement implies molecular detectability | not claimed | outside study design | requires spectrum, observing mode, detector/background, and inference model |
| The time proxy is a JWST exposure time | rejected | explicit method boundary | use Pandeia/ETC |

## Reproducible outputs

- `public/data/feature-passband-audit.json`
- `research/feature-passband-audit.csv`
- `assets/research-maturity-before-after.svg`

Run `npm run check` under Node 24 to validate the source contracts, regenerate nothing implicitly, verify evidence freshness, execute numerical tests, type-check, and build the application.
