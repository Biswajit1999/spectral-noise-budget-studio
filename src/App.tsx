import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import { FEATURES, type FilterProfile, type PlacementAudit } from './passband'

type FilterData = {
  schema: string
  retrievedAtUtc: string
  service: string
  serviceUrl: string
  jwstThroughputContext: string
  filters: FilterProfile[]
  warning: string
}

type FilterSummary = {
  id: string
  samples: number
  pivotWavelengthMicron: number
  transmissionWeightedMeanMicron: number
  equivalentWidthMicron: number
  peakTransmission: number
  sourceUrl: string
  sourceSha256: string
}

type Evidence = {
  release: string
  researchQuestion: string
  hypothesis: string
  proxyBoundary: string
  counts: Record<'core' | 'wing' | 'edge' | 'outside', number>
  records: PlacementAudit[]
  filters: FilterSummary[]
}

function Curve({ filter, feature, transmission }: { filter: FilterProfile; feature: number; transmission: number }) {
  const width = 900
  const height = 180
  const padding = 18
  const min = 1
  const max = 5.15
  const points = filter.wavelengthMicron.map((value, index) => {
    const x = padding + (value - min) / (max - min) * (width - 2 * padding)
    const y = height - padding - filter.transmission[index] * (height - 2 * padding)
    return `${x},${y}`
  }).join(' ')
  const featureX = padding + (feature - min) / (max - min) * (width - 2 * padding)
  const featureY = height - padding - transmission * (height - 2 * padding)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${filter.id} throughput with selected feature at ${feature.toFixed(2)} micrometres`}>
      <line className="base" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
      <polyline points={points} />
      <line className="feature" x1={featureX} x2={featureX} y1={padding} y2={height - padding} />
      <circle cx={featureX} cy={featureY} r="6" />
      <text x={padding} y={14}>1 μm</text>
      <text x={width - padding} y={14} textAnchor="end">5.15 μm</text>
    </svg>
  )
}

function formatMultiplier(value: number | null) {
  if (value === null) return '∞'
  if (value >= 100) return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}×`
  return `${value.toFixed(2)}×`
}

export default function App() {
  const [data, setData] = useState<FilterData | null>(null)
  const [evidence, setEvidence] = useState<Evidence | null>(null)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(FEATURES[2].id)

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/jwst-nircam-filters.json`).then((response) => {
        if (!response.ok) throw new Error(`filter data: HTTP ${response.status}`)
        return response.json() as Promise<FilterData>
      }),
      fetch(`${import.meta.env.BASE_URL}data/feature-passband-audit.json`).then((response) => {
        if (!response.ok) throw new Error(`evidence audit: HTTP ${response.status}`)
        return response.json() as Promise<Evidence>
      }),
    ]).then(([filterData, audit]) => {
      setData(filterData)
      setEvidence(audit)
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)))
  }, [])

  const feature = FEATURES.find((item) => item.id === selectedId) ?? FEATURES[0]
  const selectedRecords = useMemo(
    () => evidence?.records.filter((record) => record.featureId === feature.id) ?? [],
    [evidence, feature.id],
  )

  if (error) return <main className="state">Reference-data error: {error}</main>
  if (!data || !evidence) return <main className="state">Loading reviewed evidence…</main>

  return (
    <>
      <header>
        <a href="#top">SPECTRAL / EVIDENCE / JWST</a>
        <nav aria-label="Page sections">
          <a href="#result">result</a><a href="#bands">bands</a><a href="#matrix">matrix</a><a href="#source">sources</a>
        </nav>
      </header>
      <main id="top">
        <section className="hero">
          <div className="number">09</div>
          <div>
            <p>REPRODUCIBLE PASSBAND AUDIT · 16 DECLARED TESTS · {evidence.release}</p>
            <h1>Measure the edge.<br /><i>State the boundary.</i></h1>
          </div>
          <aside>
            <span>RESEARCH QUESTION</span>
            <p>{evidence.researchQuestion}</p>
          </aside>
        </section>

        <section className="result" id="result" aria-labelledby="result-title">
          <div>
            <span>PRIMARY RESULT</span>
            <h2 id="result-title">Four core placements.<br />One costly edge leak.</h2>
            <p>The 3.30 μm CH₄ marker technically remains inside the sampled F277W support, but carries only 0.026% of that filter’s peak response: a 3,805× photon-limited time proxy. Non-zero is not scientifically equivalent to useful.</p>
          </div>
          <dl>
            <div><dt>Core</dt><dd>{evidence.counts.core}</dd></div>
            <div><dt>Wing</dt><dd>{evidence.counts.wing}</dd></div>
            <div><dt>Edge</dt><dd>{evidence.counts.edge}</dd></div>
            <div><dt>Outside</dt><dd>{evidence.counts.outside}</dd></div>
          </dl>
        </section>

        <section className="selector">
          <label htmlFor="feature">FEATURE UNDER TEST</label>
          <select id="feature" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {FEATURES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <strong>{feature.wavelengthMicron.toFixed(2)}<small> μm</small></strong>
        </section>

        <section className="bands" id="bands" aria-label={`Filter results for ${feature.label}`}>
          {data.filters.map((filter, index) => {
            const record = selectedRecords.find((item) => item.filterId === filter.id)!
            const summary = evidence.filters.find((item) => item.id === filter.id)!
            return (
              <article key={filter.id}>
                <div className="band-id">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h2>{filter.id}</h2>
                  <p>λpivot {summary.pivotWavelengthMicron.toFixed(3)} μm · EW {summary.equivalentWidthMicron.toFixed(3)} μm · {filter.samples} samples</p>
                </div>
                <Curve filter={filter} feature={feature.wavelengthMicron} transmission={record.transmission} />
                <div className="at-feature">
                  <span>NORMALIZED RESPONSE</span>
                  <strong>{(record.normalizedTransmission * 100).toFixed(record.normalizedTransmission < 0.01 ? 3 : 1)}%</strong>
                  <em className={record.classification}>{record.classification.toUpperCase()}</em>
                  <small>time proxy {formatMultiplier(record.photonLimitedTimeMultiplier)}</small>
                </div>
              </article>
            )
          })}
        </section>

        <section className="matrix" id="matrix" aria-labelledby="matrix-title">
          <div className="section-heading">
            <span>FULL EVIDENCE MATRIX</span>
            <h2 id="matrix-title">Every declared comparison.</h2>
            <p>Linear interpolation is evaluated against the committed SVO samples. “Core” means at least 50% of the filter peak; the time proxy is Tpeak / T(λ).</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Feature</th><th>Filter</th><th>Class</th><th>Response / peak</th><th>Time proxy</th></tr></thead>
              <tbody>{evidence.records.map((record) => {
                const rowFeature = FEATURES.find((item) => item.id === record.featureId)!
                return <tr key={`${record.featureId}-${record.filterId}`}><td>{rowFeature.label}</td><td>{record.filterId}</td><td><span className={`pill ${record.classification}`}>{record.classification}</span></td><td>{(record.normalizedTransmission * 100).toFixed(record.normalizedTransmission < 0.01 ? 3 : 1)}%</td><td>{formatMultiplier(record.photonLimitedTimeMultiplier)}</td></tr>
              })}</tbody>
            </table>
          </div>
        </section>

        <section className="decision">
          <div><span>VALIDITY BOUNDARY</span><h2>Placement first.<br />Pandeia next.</h2></div>
          <div><p>{evidence.proxyBoundary}</p><p>{data.warning}</p><a href={data.jwstThroughputContext}>Open the official Pandeia throughput guidance ↗</a></div>
        </section>

        <section className="source" id="source">
          <div><span>REFERENCE RECEIPTS</span><h2>Curves with<br />addresses.</h2><p>SHA-256 receipts bind every calculation to the exact VOTable payload used for this release.</p></div>
          <ol>{data.filters.map((filter, index) => <li key={filter.id}><b>{String(index + 1).padStart(2, '0')}</b><strong>{filter.id}</strong><a href={filter.url}>SVO VOTable ↗</a><code>{filter.votableSha256}</code></li>)}</ol>
        </section>
      </main>
      <footer><span>{data.service} · source snapshot {data.retrievedAtUtc.slice(0, 10)}</span><a href="https://github.com/Biswajit1999/spectral-noise-budget-studio">SOURCE + EVIDENCE ↗</a></footer>
    </>
  )
}
