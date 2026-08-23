import type { StudyResult } from './types'

const PLANCK = 6.62607015e-34
const LIGHT_SPEED = 299_792_458

export function noiseSpectrum(values: Record<string, number>) {
  const area = Math.PI * (values.diameter / 2) ** 2
  const time = values.exposure * 60
  return Array.from({ length: 90 }, (_, index) => {
    const wave = .6 + index * (4.4 / 89)
    const wavelength = wave * 1e-6
    const deltaWavelength = wavelength / values.resolution
    // oxlint-disable-next-line erasing-op -- 3.631e-23 is the AB zero point in SI, not an integer underflow.
    const fluxDensity = 3.631e-23 * Math.pow(10, -.4 * values.magnitude)
    const photons = fluxDensity * LIGHT_SPEED / wavelength ** 2 * deltaWavelength * area
      * values.throughput * time / (PLANCK * LIGHT_SPEED / wavelength)
    const background = (.018 + .14 * Math.pow(wave / 5, 3)) * area * time * 2
    const dark = .02 * time * 2
    const read = 12 ** 2 * 2 * 4
    const variance = photons + background + dark + read
    return {
      x: wave,
      observed: 1e6 * Math.sqrt(variance) / Math.max(photons, 1),
      model: 1e6 / Math.sqrt(Math.max(photons, 1)),
      photons,
      background,
      variance,
    }
  })
}

const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

export function runModel(values: Record<string, number>): StudyResult {
  const data = noiseSpectrum(values)
  const precision = median(data.map((row) => row.observed))
  const photon = median(data.map((row) => row.model))
  const transitSnr = 100 / precision
  const sourceFraction = median(data.map((row) => row.photons / row.variance))
  return {
    samples: data,
    metrics: [
      { label: 'Median precision', value: `${precision.toFixed(0)} ppm`, detail: 'Per resolution element', tone: precision < 100 ? 'good' : 'warn' },
      { label: 'Photon limit', value: `${photon.toFixed(0)} ppm`, detail: 'Shot noise only' },
      { label: '100 ppm S/N', value: transitSnr.toFixed(2), detail: 'Single-exposure feature significance', tone: transitSnr > 1 ? 'good' : 'warn' },
      { label: 'Source variance', value: `${(100 * sourceFraction).toFixed(1)}%`, detail: 'Fraction of total variance from target photons' },
      { label: 'Collecting area', value: `${(Math.PI * (values.diameter / 2) ** 2).toFixed(1)} m²`, detail: 'Unobscured geometric area' },
      { label: 'Bin width @ 1 μm', value: `${(1000 / values.resolution).toFixed(2)} nm`, detail: 'Δλ = λ/R' },
    ],
    conclusion: transitSnr >= 1
      ? `A 100 ppm spectral feature reaches S/N ≈ ${transitSnr.toFixed(2)} per exposure at the median wavelength. Repeated events improve only as √N if systematics remain negligible.`
      : `The median single-exposure uncertainty is ${precision.toFixed(0)} ppm, so a 100 ppm feature is sub-threshold. Increase photons per bin or explicitly plan multiple visits.`,
    rows: data.map((row) => [row.x, row.observed, row.model].map(String)),
  }
}
