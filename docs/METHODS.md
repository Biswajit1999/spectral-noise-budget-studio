# Methods

## Constants and units

The implementation uses exact SI values for `h` and `c`. Wavelengths are converted from μm to m, one jansky is `10⁻²⁶ W m⁻² Hz⁻¹`, and detected photons/electrons are treated as equal after throughput.

## Resolution element

Each bin has `Δλ = λ/R`. The user-selected resolving power is held constant across the band.

## Detector assumptions

The current model uses two pixels per resolution element, four reads, 12 e⁻ read noise, and 0.02 e⁻ s⁻¹ pix⁻¹ dark current. These values are visible in source and must be changed for a named detector.

## Background

The coded background is a smooth illustrative function that rises toward 5 μm. It is intentionally not labelled as a site, telescope, or zodiacal model.

## Tests

The suite checks positive finite precision and the expected monotonic improvement with telescope diameter and exposure time. Empirical validation requires comparison against a documented observatory ETC using identical source and aperture assumptions.
