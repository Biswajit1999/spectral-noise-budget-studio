import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  FEATURES,
  auditPlacement,
  equivalentWidthMicron,
  pivotWavelengthMicron,
  type FilterProfile,
} from '../src/passband'

type SourceData = {
  schema: string
  retrievedAtUtc: string
  service: string
  serviceUrl: string
  jwstThroughputContext: string
  filters: FilterProfile[]
  warning: string
}

const root = resolve(import.meta.dirname, '..')
const source = JSON.parse(await readFile(resolve(root, 'public/data/jwst-nircam-filters.json'), 'utf8')) as SourceData
const records = FEATURES.flatMap((feature) => source.filters.map((filter) => auditPlacement(filter, feature)))
const filters = source.filters.map((filter) => ({
  id: filter.id,
  samples: filter.samples,
  pivotWavelengthMicron: pivotWavelengthMicron(filter),
    transmissionWeightedMeanMicron: filter.transmissionWeightedMeanMicron,
  equivalentWidthMicron: equivalentWidthMicron(filter),
  peakTransmission: filter.peakTransmission,
  sourceUrl: filter.url,
  sourceSha256: filter.votableSha256,
}))
const counts = Object.fromEntries(['core', 'wing', 'edge', 'outside'].map((classification) => [
  classification,
  records.filter((record) => record.classification === classification).length,
]))

const evidence = {
  schema: 'spectral-noise.feature-passband-audit/1',
  release: 'v1.1.0',
  source: {
    schema: source.schema,
    retrievedAtUtc: source.retrievedAtUtc,
    service: source.service,
    serviceUrl: source.serviceUrl,
  },
  researchQuestion: 'At four declared molecular feature wavelengths, which committed NIRCam profiles retain at least half of peak response?',
  hypothesis: 'Each feature has at least one core placement; apparent edge overlap can carry a severe photon-limited time penalty.',
  decisionRule: {
    core: 'T(lambda) / T_peak >= 0.5',
    wing: '0.1 <= T(lambda) / T_peak < 0.5',
    edge: '0 < T(lambda) / T_peak < 0.1',
    outside: 'outside sampled support or zero interpolated response',
  },
  proxyBoundary: 'The time multiplier T_peak/T(lambda) is a source-photon-limited relative proxy only; it is not a JWST ETC, a molecular detectability prediction, or evidence that broadband imaging isolates a monochromatic feature.',
  features: FEATURES,
  filters,
  counts,
  records,
}

const csv = [
  'feature_id,species,wavelength_micron,filter_id,classification,transmission,normalized_transmission,photon_limited_time_multiplier,inside_sampled_support',
  ...records.map((record) => {
    const feature = FEATURES.find((item) => item.id === record.featureId)!
    return [
      record.featureId,
      feature.species,
      record.wavelengthMicron.toFixed(2),
      record.filterId,
      record.classification,
      record.transmission.toPrecision(10),
      record.normalizedTransmission.toPrecision(10),
      record.photonLimitedTimeMultiplier?.toPrecision(10) ?? '',
      record.insideSampledSupport,
    ].join(',')
  }),
].join('\n') + '\n'

const outputs = new Map([
  ['public/data/feature-passband-audit.json', JSON.stringify(evidence, null, 2) + '\n'],
  ['research/feature-passband-audit.csv', csv],
])
const checkOnly = process.argv.includes('--check')
for (const [relativePath, content] of outputs) {
  const path = resolve(root, relativePath)
  if (checkOnly) {
    const current = await readFile(path, 'utf8').catch(() => '')
    if (current !== content) throw new Error(`${relativePath} is stale; run npm run evidence`)
  } else {
    await mkdir(resolve(path, '..'), { recursive: true })
    await writeFile(path, content)
  }
}
console.log(`${checkOnly ? 'verified' : 'generated'} ${outputs.size} deterministic evidence products`)
