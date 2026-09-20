# Changelog

## [1.1.0] - 2026-09-20

### Added

- linear-interpolation passband analysis with pivot wavelength and equivalent width;
- explicit core, wing, edge, and outside decision rules;
- machine-readable JSON and CSV evidence products;
- research-maturity comparison graph and scored baseline audit;
- data-contract, numerical-property, and headline-result tests;
- deterministic artifact freshness verification.

### Changed

- refreshed SVO snapshots through a validated schema-v2 ingestion path;
- replaced the nearest-sample 20% UI rule with filter-relative diagnostics;
- separated remote data refresh from build/deployment;
- upgraded CI to Node 24, pinned actions, minimal permissions, timeouts, and concurrency control;
- upgraded Vitest to an audit-clean release.

### Removed

- disconnected illustrative spectroscopic noise code and its unsupported detector/background constants.

