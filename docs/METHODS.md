# Methods and validity protocol

## 1. Study design

This release is a fixed 4 × 4 passband-placement audit. The independent variables are four declared marker wavelengths (H₂O 2.70 μm, CH₄ 3.30 μm, CO₂ 4.30 μm, and CO 4.67 μm) and four NIRCam filters (F150W, F277W, F356W, and F444W). The response variable is throughput at the marker divided by the filter’s sampled maximum.

These wavelengths are markers, not models of line shape, band width, abundance, temperature, pressure, or opacity. Their inclusion does not claim that broadband NIRCam imaging isolates the named molecule.

## 2. Source data and chain of custody

`scripts/build_jwst_filters.py` performs an explicit network refresh from the SVO Filter Profile Service. For each VOTable it records:

- exact query URL;
- SHA-256 of the response bytes;
- sample count;
- wavelength and transmission arrays;
- maximum response;
- transmission-weighted mean, pivot wavelength, and equivalent width.

The refresh rejects non-increasing wavelength grids, unequal arrays, fewer than two samples, and transmission outside `[0, 1]`. Deployment never refreshes remote data. It consumes the committed snapshot and fails if derived evidence is stale.

## 3. Interpolation

For samples `(λ0, T0)` and `(λ1, T1)` bracketing marker `λ`, the code evaluates

```text
T(λ) = T0 + (T1 - T0) (λ - λ0) / (λ1 - λ0)
```

A binary search locates the bracket. Exact knots return the stored value. Wavelengths outside sampled support return zero. Linear interpolation is suitable here because the requested markers lie on grids sampled far more densely than the broad passband scale; it is not a substitute for a spectral line-spread model.

## 4. Classification rule

Let `q = T(λ)/Tpeak`:

| Class | Rule |
|---|---|
| Core | `q ≥ 0.5` |
| Wing | `0.1 ≤ q < 0.5` |
| Edge | `0 < q < 0.1` |
| Outside | out of sampled support or `T(λ) = 0` |

The 50% boundary connects the “core” label to the conventional half-power concept. The 10% edge boundary is an explicit triage convention, not a universal observatory criterion. Both thresholds are serialized in the evidence JSON so downstream users can replace them.

## 5. Derived passband quantities

Trapezoidal integration yields

```text
λpivot = sqrt[ ∫T(λ)λ dλ / ∫T(λ)/λ dλ ]
equivalent width = ∫T(λ)dλ / Tpeak
transmission-weighted mean = ∫λT(λ)dλ / ∫T(λ)dλ
```

The interface reports pivot wavelength and equivalent width. It does not call the transmission-weighted mean an “effective wavelength,” because effective wavelength generally depends on the adopted source spectrum and response convention.

## 6. Relative-time proxy

In the deliberately restricted source-photon-limited case, detected counts satisfy `N ∝ Tt`. Matching the counts at filter peak gives

```text
t(λ) / tpeak = Tpeak / T(λ) = 1/q.
```

This ratio is a diagnostic of response loss only. It is not an exposure-time prediction. It excludes source spectral energy distribution, background, read noise, dark current, aperture, PSF, saturation, overhead, calibration, covariance, and systematic floors. Pandeia/ETC is the required next stage.

## 7. Hypothesis, result, and falsifiers

Hypothesis: every declared marker has a core placement, while at least one apparent edge overlap has a severe photon-limited penalty.

Observed result: four core pairs, zero wing pairs, one edge pair, and eleven outside pairs. The edge pair is CH₄/F277W with a proxy above 3,000×.

The release would be falsified or require revision if:

- the committed VOTable hash cannot be reproduced from an archived source payload;
- a curve violates the data contracts;
- independent interpolation disagrees beyond floating-point tolerance;
- a named quantity is shown to use the wrong passband definition;
- current STScI mode throughput materially differs for the intended configuration;
- the molecular marker definitions are changed.

## 8. Validation plan

The present verification is computational and provenance-based. The next research stage should compare the same source spectrum and configuration against Pandeia `get_total_eff()`, then test the placement decision across detector-specific curves and current CRDS reference contexts. A publication-grade detectability study additionally needs forward models for the stellar and planetary spectra and an explicit retrieval or hypothesis-test design.

## 9. Primary references

- [SVO Filter Profile Service](https://svo2.cab.inta-csic.es/theory/fps/)
- [SVO Filter Profile Service protocol note](https://svo2.cab.inta-csic.es/theory/NOTE-SVOFPS-1.0.20121015.pdf)
- [STScI NIRCam filter documentation](https://jwst-docs.stsci.edu/jwst-near-infrared-camera/nircam-instrumentation/nircam-filters)
- [STScI Pandeia instrument throughput documentation](https://jwst-docs.stsci.edu/jwst-exposure-time-calculator-overview/jwst-etc-pandeia-engine-tutorial/jwst-etc-instrument-throughputs)
