# Research-maturity audit: v1.0.0 → v1.1.0

Scores use a repository-maturity rubric from 0 (absent) to 100 (release-grade). They evaluate the repository’s evidence practice, not the telescope, instrument, or scientific importance of the result.

| Dimension | Before | After | Evidence for change |
|---|---:|---:|---|
| Scientific question | 42 | 96 | replaced mixed noise/placement claims with a fixed 4 × 4 question and hypothesis |
| Provenance | 68 | 98 | retained exact URLs and hashes; added schema-v2 retrieval metadata and validated ingestion |
| Method validity | 45 | 95 | replaced nearest-sample/arbitrary 20% rule with interpolation, declared thresholds, pivot wavelength, and equivalent width |
| Evidence products | 25 | 96 | added deterministic JSON, CSV, SVG, result matrix, and claim ledger |
| Test depth | 31 | 94 | expanded from five broad tests to data contracts, numerical identities, interpolation cases, and outcome regression |
| Claim discipline | 57 | 97 | removed the disconnected toy noise forecast and established a strict pre-ETC boundary |
| Reproducibility | 50 | 96 | separated external refresh from builds and added generated-artifact staleness checks |
| Maintenance | 36 | 91 | added Node 24, immutable action SHAs, timeouts, concurrency, audit-clean dependencies, changelog, and release metadata |
| **Mean** | **44** | **95** | rounded arithmetic mean |

## Baseline defects addressed

1. The live application used nearest-neighbour sampling while describing a continuous physical passband.
2. “In band” meant absolute transmission above 0.20, making classification dependent on a filter’s peak efficiency.
3. A transmission-weighted mean was labelled effective wavelength without a source spectrum.
4. The toy spectroscopic noise model was disconnected from the live NIRCam application and contained illustrative background/detector constants.
5. No machine-readable result matrix or generated-artifact freshness check existed.
6. Five tests did not verify raw curve integrity, interpolation, passband quantities, or headline findings.
7. CI used mutable action tags, Node 20, and a vulnerable test-runner dependency.

## Scoring caveat

The “after” scores are maintainers’ rubric judgments, not an independent peer review. The graph is included to make the change surface auditable and should not be interpreted as a tenfold numerical increase in scientific truth.

