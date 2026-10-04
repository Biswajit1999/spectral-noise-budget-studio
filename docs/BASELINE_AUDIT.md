# Baseline audit: v1.0.0 to v1.1.0

## Baseline defects addressed

1. The live application used nearest-neighbour sampling while describing a continuous physical passband.
2. “In band” meant absolute transmission above 0.20, making classification dependent on a filter’s peak efficiency.
3. A transmission-weighted mean was labelled effective wavelength without a source spectrum.
4. The toy spectroscopic noise model was disconnected from the live NIRCam application and contained illustrative background/detector constants.
5. No machine-readable result matrix or generated-artifact freshness check existed.
6. Five tests did not verify raw curve integrity, interpolation, passband quantities, or headline findings.
7. CI used mutable action tags, Node 20, and a vulnerable test-runner dependency.
