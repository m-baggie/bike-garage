import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

// ── Condition badge ──────────────────────────────────────────────────────────
const CONDITION_CONFIG = {
  excellent: { bg: 'var(--condition-excellent)', icon: '★' },
  good:      { bg: 'var(--condition-good)',      icon: '✓' },
  fair:      { bg: 'var(--condition-fair)',      icon: '●' },
  poor:      { bg: 'var(--condition-poor)',      icon: '✕' },
  unknown:   { bg: 'var(--condition-unknown)',   icon: '?' },
}

function ConditionBadge({ value }) {
  const key = (value || 'unknown').toLowerCase()
  const { bg, icon } = CONDITION_CONFIG[key] || CONDITION_CONFIG.unknown
  const label = key.charAt(0).toUpperCase() + key.slice(1)
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: '0.78rem',
      fontWeight: 600,
      background: bg,
      color: 'var(--badge-text)',
    }}>
      {icon} {label}
    </span>
  )
}

// ── Priority badge ───────────────────────────────────────────────────────────
const PRIORITY_MAP = {
  1: { icon: '⚠', label: 'Immediate', bg: 'var(--priority-1)' },
  2: { icon: '↑', label: 'Soon',      bg: 'var(--priority-2)' },
  3: { icon: '●', label: 'Monitor',   bg: 'var(--priority-3)' },
  4: { icon: '✓', label: 'OK',        bg: 'var(--priority-4)' },
  5: { icon: '★', label: 'New',       bg: 'var(--priority-5)' },
}

function PriorityBadge({ value }) {
  const p = PRIORITY_MAP[value] || { icon: '', label: String(value), bg: 'var(--condition-unknown)' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: '0.78rem',
      fontWeight: 600,
      background: p.bg,
      color: 'var(--badge-text)',
    }}>
      {p.icon} {p.label}
    </span>
  )
}

// ── Metadata row ─────────────────────────────────────────────────────────────
function MetaRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 600, minWidth: '140px', opacity: 0.7 }}>{label}:</span>
      <span>{value}</span>
    </div>
  )
}

// ── Pricing cell ─────────────────────────────────────────────────────────────
function PricingCell({ state }) {
  if (!state) {
    return <span style={ps.muted}>Loading prices…</span>
  }
  if (state.loading) {
    return (
      <span style={ps.loading} aria-busy="true">
        <span style={ps.spinner} />
        Loading prices…
      </span>
    )
  }
  if (state.error) {
    return <span style={ps.error}>Pricing unavailable</span>
  }
  if (!state.results || state.results.length === 0) {
    return <span style={ps.muted}>No results found on Performance Bicycle</span>
  }
  return (
    <div style={ps.resultList}>
      {state.results.slice(0, 3).map((r, i) => (
        <div key={i} style={ps.resultCard}>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            style={ps.productLink}
          >
            {r.title}
          </a>
          <div style={ps.productMeta}>
            <span style={ps.price}>{r.price}</span>
            {r.availability && (
              <span style={ps.availability}>{r.availability}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Pricing cell styles ───────────────────────────────────────────────────────
const ps = {
  muted: { opacity: 0.5, fontSize: '0.82rem' },
  loading: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    opacity: 0.6,
    fontSize: '0.82rem',
  },
  spinner: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: 'rgba(255,255,255,0.7)',
    animation: 'spin 0.7s linear infinite',
  },
  error: { color: '#f87171', fontSize: '0.82rem' },
  resultList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  resultCard: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '6px',
    padding: '0.4rem 0.6rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  productLink: {
    color: '#93c5fd',
    fontSize: '0.82rem',
    textDecoration: 'none',
    lineHeight: 1.4,
  },
  productMeta: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  price: { fontWeight: 700, fontSize: '0.88rem', color: '#86efac' },
  availability: { fontSize: '0.75rem', opacity: 0.65 },
}

// ── Main component styles ─────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    padding: '1.5rem 1.5rem',
    maxWidth: '1260px',
    margin: '0 auto',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  heading: { margin: '0 0 1rem', fontSize: '1.75rem', fontWeight: 700 },
  section: {
    background: 'var(--card-bg, #1e1e1e)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  sectionTitle: { margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, opacity: 0.9 },
  metaGrid: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  summary: { marginTop: '1rem', lineHeight: 1.6, opacity: 0.85 },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: {
    textAlign: 'left',
    padding: '0.6rem 0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    opacity: 0.7,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
  },
  td: {
    padding: '0.6rem 0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    verticalAlign: 'top',
  },
  backBtn: {
    display: 'inline-block',
    marginBottom: '1.5rem',
    padding: '0.4rem 1rem',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '6px',
    cursor: 'pointer',
    color: 'inherit',
    fontSize: '0.9rem',
  },
  bikePhoto: {
    width: '100%',
    maxHeight: '280px',
    objectFit: 'cover',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    marginBottom: '1.5rem',
    display: 'block',
  },
}

// Inject responsive layout CSS (once)
if (typeof document !== 'undefined' && !document.getElementById('__results_layout')) {
  const style = document.createElement('style')
  style.id = '__results_layout'
  style.textContent = `
    .rp-columns {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    .rp-columns > * {
      min-width: 0;
    }
    @media (min-width: 1024px) {
      .rp-columns {
        grid-template-columns: minmax(280px, 360px) 1fr;
        align-items: start;
      }
    }
    .rp-row-even td { background: rgba(255,255,255,0.04); }
    .rp-row-odd td { background: transparent; }
  `
  document.head.appendChild(style)
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sortAsc, setSortAsc] = useState(true) // true = ascending (most urgent first)
  // Map of part_id → { loading, results, error }
  const [pricing, setPricing] = useState(null)

  // Redirect if no analysis data
  useEffect(() => {
    if (!location.state?.result) {
      navigate('/', { state: { message: 'No analysis data — please upload a photo' } })
    }
  }, [location.state, navigate])

  const result = location.state?.result
  const photoUrl = location.state?.photoUrl || null
  const parts = Array.isArray(result?.parts) ? result.parts : []

  // Fetch pricing once parts are available
  useEffect(() => {
    if (!parts.length) return

    // Initialise all parts to loading state
    const initial = {}
    for (const p of parts) {
      initial[p.id] = { loading: true, results: [], error: null }
    }
    setPricing(initial)

    axios
      .post('/api/pricing', { parts })
      .then(({ data }) => {
        const next = {}
        for (const item of data.pricing) {
          next[item.part_id] = { loading: false, results: item.results || [], error: null }
        }
        // Fill any parts not returned by the API as empty
        for (const p of parts) {
          if (!next[p.id]) {
            next[p.id] = { loading: false, results: [], error: null }
          }
        }
        setPricing(next)
      })
      .catch(() => {
        const err = {}
        for (const p of parts) {
          err[p.id] = { loading: false, results: [], error: true }
        }
        setPricing(err)
      })
    // Only run once when parts stabilise — intentionally omit parts from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!result) return null

  const bike = result.bike || {}
  const overallCondition = result.overall_condition || bike.overall_condition
  const summary = result.summary || bike.summary

  // Sort parts by priority (1 = most urgent)
  const sortedParts = [...parts].sort((a, b) =>
    sortAsc ? a.priority - b.priority : b.priority - a.priority
  )

  const toggleSort = () => setSortAsc((v) => !v)

  return (
    <div style={s.page}>
      <h1 style={s.heading}>Bike Analysis Results</h1>
      <button style={s.backBtn} onClick={() => navigate('/')}>← New Analysis</button>

      <div className="rp-columns">
        {/* Left column: photo + bike details */}
        <div>
          {photoUrl && (
            <img src={photoUrl} alt="Uploaded bike" style={s.bikePhoto} />
          )}
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Bike Details</h2>
            <div style={s.metaGrid}>
              <MetaRow label="Brand"          value={bike.brand} />
              <MetaRow label="Model"          value={bike.model} />
              <MetaRow label="Type"           value={bike.type} />
              <MetaRow label="Year"           value={bike.year} />
              <MetaRow label="Color"          value={bike.color} />
              <MetaRow label="Frame Material" value={bike.frame_material} />
              <MetaRow
                label="Overall Condition"
                value={overallCondition
                  ? <ConditionBadge value={overallCondition} />
                  : null}
              />
            </div>
            {summary && <p style={s.summary}>{summary}</p>}
          </div>
        </div>

        {/* Right column: parts table */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Parts Analysis ({sortedParts.length} parts)</h2>
          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Part Name</th>
                  <th style={s.th}>Component Group</th>
                  <th style={s.th}>Brand / Model</th>
                  <th style={s.th}>Condition</th>
                  <th style={s.th} onClick={toggleSort}>
                    Priority {sortAsc ? '▲' : '▼'}
                  </th>
                  <th style={s.th}>Condition Notes</th>
                  <th style={{ ...s.th, minWidth: '200px', cursor: 'default' }}>
                    Performance Bicycle Pricing
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedParts.map((part, i) => (
                  <tr key={part.id || i} className={i % 2 === 0 ? 'rp-row-even' : 'rp-row-odd'}>
                    <td style={s.td}>{part.name}</td>
                    <td style={s.td}>{part.component_group}</td>
                    <td style={s.td}>{[part.brand, part.model].filter(Boolean).join(' ')}</td>
                    <td style={s.td}><ConditionBadge value={part.condition} /></td>
                    <td style={s.td}><PriorityBadge value={part.priority} /></td>
                    <td style={s.td}>{part.condition_notes}</td>
                    <td style={s.td}>
                      <PricingCell state={pricing ? pricing[part.id] : null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
