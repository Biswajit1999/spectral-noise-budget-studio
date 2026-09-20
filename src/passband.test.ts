import { describe, expect, it } from 'vitest'
import filterData from '../public/data/jwst-nircam-filters.json'
import {
  FEATURES,
  auditPlacement,
  equivalentWidthMicron,
  interpolateTransmission,
  pivotWavelengthMicron,
  type FilterProfile,
} from './passband'

const filters = filterData.filters as FilterProfile[]

describe('reference-data contracts', () => {
  it.each(filters)('$id has ordered, finite, bounded samples', (filter) => {
    expect(filter.samples).toBe(filter.wavelengthMicron.length)
    expect(filter.samples).toBe(filter.transmission.length)
    expect(filter.wavelengthMicron.every((value, index, values) => index === 0 || value > values[index - 1])).toBe(true)
    expect(filter.transmission.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(true)
    expect(filter.votableSha256).toMatch(/^[a-f0-9]{64}$/)
  })

  it('recomputes the stored peak from every curve', () => {
    filters.forEach((filter) => expect(Math.max(...filter.transmission)).toBeCloseTo(filter.peakTransmission, 12))
  })
})

describe('passband calculations', () => {
  it('returns exact values at knots and zero outside sampled support', () => {
    const filter = filters[1]
    const index = 317
    expect(interpolateTransmission(filter, filter.wavelengthMicron[index])).toBe(filter.transmission[index])
    expect(interpolateTransmission(filter, filter.wavelengthMicron[0] - 0.001)).toBe(0)
    expect(interpolateTransmission(filter, filter.wavelengthMicron.at(-1)! + 0.001)).toBe(0)
  })

  it('linearly interpolates within the bracketing samples', () => {
    const filter = filters[2]
    const index = 400
    const midpoint = (filter.wavelengthMicron[index] + filter.wavelengthMicron[index + 1]) / 2
    const expected = (filter.transmission[index] + filter.transmission[index + 1]) / 2
    expect(interpolateTransmission(filter, midpoint)).toBeCloseTo(expected, 12)
  })

  it.each(filters)('$id has finite pivot wavelength and equivalent width within support', (filter) => {
    const pivot = pivotWavelengthMicron(filter)
    expect(pivot).toBeGreaterThan(filter.wavelengthMicron[0])
    expect(pivot).toBeLessThan(filter.wavelengthMicron.at(-1)!)
    expect(equivalentWidthMicron(filter)).toBeGreaterThan(0)
  })

  it('finds four core placements and one measurable edge leak', () => {
    const records = FEATURES.flatMap((feature) => filters.map((filter) => auditPlacement(filter, feature)))
    expect(records.filter((record) => record.classification === 'core')).toHaveLength(4)
    expect(records.filter((record) => record.classification === 'wing')).toHaveLength(0)
    expect(records.filter((record) => record.classification === 'edge')).toHaveLength(1)
    const edge = records.find((record) => record.classification === 'edge')!
    expect(edge.featureId).toBe('ch4-330')
    expect(edge.filterId).toBe('F277W')
    expect(edge.photonLimitedTimeMultiplier).toBeGreaterThan(3_000)
  })

  it('keeps the photon-limited time proxy reciprocal with normalized response', () => {
    const record = auditPlacement(filters[3], FEATURES[3])
    expect(record.photonLimitedTimeMultiplier! * record.normalizedTransmission).toBeCloseTo(1, 12)
  })
})

