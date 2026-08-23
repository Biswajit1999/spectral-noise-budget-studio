# Spectral Noise Budget Studio

An interactive exposure-time and noise-budget workbench for astronomical spectroscopy from 0.6 to 5 μm.

[![CI](https://github.com/Biswajit1999/spectral-noise-budget-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/Biswajit1999/spectral-noise-budget-studio/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

## Motivation

An observing proposal should connect a target, instrument, and science feature before time is requested. This repository makes that chain explicit: AB magnitude and spectral resolution define photons per bin; collecting area, throughput, and exposure determine detected electrons; background and detector terms set total variance; the result is reported as wavelength-resolved relative precision.

## Research question

For a declared target and instrument concept, is a 100 ppm spectral feature photon-limited, detector/background-limited, or simply below the single-exposure precision?

## Implemented budget

- AB magnitude to `fν` conversion;
- photon energy and per-resolution-element bandwidth;
- telescope collecting area and end-to-end throughput;
- target shot noise;
- simplified wavelength-dependent sky/thermal background;
- dark-current and read-noise terms;
- photon-only and total precision in ppm;
- feature S/N, source-variance fraction, bin width, and collecting-area diagnostics;
- accessible chart/table and responsive parameter controls;
- scientific limiting-case tests for aperture and exposure scaling.

## Equations

```text
fν = 3631 Jy × 10^(-0.4 m_AB)
Δλ = λ/R
Nγ = [fν c/λ²] Δλ A η t / [hc/λ]
σ² = Nγ + Nbackground + Ndark + nread σread²
relative precision = σ/Nγ
```

The app evaluates 90 wavelength bins. The flat AB magnitude assumption keeps the experiment focused on instrumental scaling; it is not a stellar atmosphere model.

## Quick start

```bash
git clone https://github.com/Biswajit1999/spectral-noise-budget-studio.git
cd spectral-noise-budget-studio
npm install
npm run dev
```

## Reproducibility gate

```bash
npm run check
```

GitHub Actions runs lint, Vitest, TypeScript, and the production build.

## Project layout

```text
src/science.ts       photon and detector budget
src/science.test.ts  aperture, exposure, and finiteness checks
src/project.ts       instrument controls and scope statement
src/Chart.tsx        accessible precision curve
docs/METHODS.md      units, constants, and validation plan
design-system/       UI design contract
CITATION.cff         machine-readable citation
```

## Suggested experiments

- hold photons per bin roughly constant while trading `R` and exposure;
- move from 2 m to 8 m aperture and compare the photon-limit scaling;
- lower throughput to reveal where detector/background terms matter;
- make the target faint and inspect the rapid loss of precision;
- estimate visits required for 100 ppm at fixed per-visit precision.

## Interpretation

The median `100 ppm S/N` is `100 / median(total precision in ppm)`. Repeated independent visits ideally improve as `√N`; real instruments frequently hit time-correlated or calibration floors before that limit.

The budget is appropriate for order-of-magnitude design comparisons and test-driven development. It is not sufficient to justify observatory time by itself.

## Limitations

- flat AB spectrum, no stellar or planetary SED;
- unobscured geometric area;
- fixed sampling and read strategy;
- illustrative background law;
- no atmosphere, tellurics, slit loss, PSF extraction aperture, saturation, cosmic rays, persistence, nonlinearity, or overhead;
- no covariance between spectral bins or visits;
- no systematic noise floor.

## Research upgrade path

1. Accept a flux-calibrated spectrum or PHOENIX stellar model.
2. Load throughput and detector curves with provenance.
3. Separate atmosphere, telescope, disperser, slit/fibre, and QE terms.
4. Model extraction aperture and wavelength-dependent PSF.
5. Add saturation/readout modes and overhead-aware visit planning.
6. Validate against an observatory ETC at declared benchmark points.
7. Propagate throughput/background uncertainties with Monte Carlo samples.

## References

- Howell, S. B. (2006), *Handbook of CCD Astronomy*, Cambridge University Press.
- McLean, I. S. (2008), *Electronic Imaging in Astronomy*, Springer, [doi:10.1007/978-3-540-76583-7](https://doi.org/10.1007/978-3-540-76583-7).
- Bessell, M. S. & Murphy, S. J. (2012), *Spectrophotometric libraries, revised photonic passbands, and zero points*, [PASP 124, 140](https://doi.org/10.1086/664083).

## Citation and license

See [`CITATION.cff`](CITATION.cff). [MIT licensed](LICENSE).
