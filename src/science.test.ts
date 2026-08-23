import { describe, expect, it } from 'vitest'
import { noiseSpectrum } from './science'

const baseline = { magnitude: 9, diameter: 3.6, throughput: .22, resolution: 300, exposure: 45 }
const centralPrecision = (data: ReturnType<typeof noiseSpectrum>) => data[Math.floor(data.length / 2)].observed

describe('noise budget', () => {
  it('returns positive finite precision', () => {
    expect(noiseSpectrum(baseline).every((row) => row.observed > 0 && Number.isFinite(row.observed))).toBe(true)
  })
  it('larger apertures improve precision', () => {
    expect(centralPrecision(noiseSpectrum({ ...baseline, diameter: 8 }))).toBeLessThan(centralPrecision(noiseSpectrum({ ...baseline, diameter: 2 })))
  })
  it('longer exposures improve precision', () => {
    expect(centralPrecision(noiseSpectrum({ ...baseline, exposure: 120 }))).toBeLessThan(centralPrecision(noiseSpectrum({ ...baseline, exposure: 10 })))
  })
})
