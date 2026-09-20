export type FilterProfile = {
  id: string
  url: string
  votableSha256: string
  samples: number
  wavelengthMicron: number[]
  transmission: number[]
  peakTransmission: number
  transmissionWeightedMeanMicron: number
}

export type PlacementClass = 'core' | 'wing' | 'edge' | 'outside'

export type FeatureDefinition = {
  id: string
  label: string
  species: string
  wavelengthMicron: number
}

export type PlacementAudit = {
  featureId: string
  filterId: string
  wavelengthMicron: number
  transmission: number
  normalizedTransmission: number
  photonLimitedTimeMultiplier: number | null
  classification: PlacementClass
  insideSampledSupport: boolean
}

export const FEATURES: FeatureDefinition[] = [
  { id: 'h2o-270', label: 'H₂O · 2.70 μm', species: 'H₂O', wavelengthMicron: 2.70 },
  { id: 'ch4-330', label: 'CH₄ · 3.30 μm', species: 'CH₄', wavelengthMicron: 3.30 },
  { id: 'co2-430', label: 'CO₂ · 4.30 μm', species: 'CO₂', wavelengthMicron: 4.30 },
  { id: 'co-467', label: 'CO · 4.67 μm', species: 'CO', wavelengthMicron: 4.67 },
]

function assertProfile(profile: FilterProfile) {
  if (profile.wavelengthMicron.length !== profile.transmission.length || profile.wavelengthMicron.length < 2) {
    throw new Error(`${profile.id}: wavelength and transmission arrays must have equal length >= 2`)
  }
  if (profile.samples !== profile.wavelengthMicron.length) {
    throw new Error(`${profile.id}: declared sample count does not match arrays`)
  }
  for (let index = 0; index < profile.wavelengthMicron.length; index += 1) {
    const wavelength = profile.wavelengthMicron[index]
    const transmission = profile.transmission[index]
    if (!Number.isFinite(wavelength) || !Number.isFinite(transmission) || transmission < 0 || transmission > 1) {
      throw new Error(`${profile.id}: invalid sample at index ${index}`)
    }
    if (index > 0 && wavelength <= profile.wavelengthMicron[index - 1]) {
      throw new Error(`${profile.id}: wavelengths must be strictly increasing`)
    }
  }
}

export function interpolateTransmission(profile: FilterProfile, wavelengthMicron: number): number {
  assertProfile(profile)
  const wavelengths = profile.wavelengthMicron
  const transmissions = profile.transmission
  if (wavelengthMicron < wavelengths[0] || wavelengthMicron > wavelengths.at(-1)!) return 0

  let low = 0
  let high = wavelengths.length - 1
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    if (wavelengths[middle] === wavelengthMicron) return transmissions[middle]
    if (wavelengths[middle] < wavelengthMicron) low = middle + 1
    else high = middle - 1
  }

  const right = low
  const left = right - 1
  const fraction = (wavelengthMicron - wavelengths[left]) / (wavelengths[right] - wavelengths[left])
  return transmissions[left] + fraction * (transmissions[right] - transmissions[left])
}

export function trapezoidIntegral(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) throw new Error('integral arrays must have equal length >= 2')
  return x.slice(1).reduce((sum, right, index) => {
    const left = x[index]
    return sum + (right - left) * (y[index] + y[index + 1]) / 2
  }, 0)
}

export function pivotWavelengthMicron(profile: FilterProfile): number {
  assertProfile(profile)
  const numerator = trapezoidIntegral(
    profile.wavelengthMicron,
    profile.wavelengthMicron.map((wavelength, index) => wavelength * profile.transmission[index]),
  )
  const denominator = trapezoidIntegral(
    profile.wavelengthMicron,
    profile.wavelengthMicron.map((wavelength, index) => profile.transmission[index] / wavelength),
  )
  return Math.sqrt(numerator / denominator)
}

export function equivalentWidthMicron(profile: FilterProfile): number {
  assertProfile(profile)
  return trapezoidIntegral(profile.wavelengthMicron, profile.transmission) / profile.peakTransmission
}

export function auditPlacement(profile: FilterProfile, feature: FeatureDefinition): PlacementAudit {
  const first = profile.wavelengthMicron[0]
  const last = profile.wavelengthMicron.at(-1)!
  const insideSampledSupport = feature.wavelengthMicron >= first && feature.wavelengthMicron <= last
  const transmission = interpolateTransmission(profile, feature.wavelengthMicron)
  const normalizedTransmission = profile.peakTransmission > 0 ? transmission / profile.peakTransmission : 0
  const classification: PlacementClass = !insideSampledSupport || transmission === 0
    ? 'outside'
    : normalizedTransmission >= 0.5
      ? 'core'
      : normalizedTransmission >= 0.1
        ? 'wing'
        : 'edge'

  return {
    featureId: feature.id,
    filterId: profile.id,
    wavelengthMicron: feature.wavelengthMicron,
    transmission,
    normalizedTransmission,
    photonLimitedTimeMultiplier: transmission > 0 ? profile.peakTransmission / transmission : null,
    classification,
    insideSampledSupport,
  }
}
