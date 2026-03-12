import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import BikeImageOverlay from '../components/BikeImageOverlay'

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

// ── Part Detail Panel ─────────────────────────────────────────────────────────
function PartDetailPanel({ part, pricingState, onClose }) {
  const brandModel = part ? [part.brand, part.model].filter(Boolean).join(' ') : ''
  return (
    <>
      {/* Mobile backdrop — tap outside to dismiss */}
      {part && (
        <div className="pdp-backdrop" onClick={onClose} aria-hidden="true" />
      )}
      <div className={`pdp-panel${part ? ' pdp-active' : ''}`} style={dp.panel}>
        {!part ? (
          <p style={dp.placeholder}>No part selected — click a part on the photo</p>
        ) : (
          <>
            <div style={dp.header}>
              <span style={dp.title}>{part.name}</span>
              <button
                style={dp.closeBtn}
                onClick={onClose}
                aria-label="Close detail panel"
              >
                ✕
              </button>
            </div>
            <div style={dp.body}>
              {part.component_group && (
                <div style={dp.row}>
                  <span style={dp.label}>Component Group</span>
                  <span>{part.component_group}</span>
                </div>
              )}
              {brandModel && (
                <div style={dp.row}>
                  <span style={dp.label}>Brand / Model</span>
                  <span>{brandModel}</span>
                </div>
              )}
              <div style={dp.row}>
                <span style={dp.label}>Condition</span>
                <ConditionBadge value={part.condition} />
              </div>
              <div style={dp.row}>
                <span style={dp.label}>Priority</span>
                <PriorityBadge value={part.priority} />
              </div>
              {part.condition_notes && (
                <div style={{ ...dp.row, flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <span style={dp.label}>Condition Notes</span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.85, lineHeight: 1.5 }}>{part.condition_notes}</span>
                </div>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ ...dp.label, display: 'block', marginBottom: '0.4rem' }}>Pricing</span>
                <PricingCell state={pricingState} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

const dp = {
  panel: {
    background: 'var(--card-bg, #1e1e1e)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '10px',
    padding: '1rem',
    marginBottom: '1rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  placeholder: {
    opacity: 0.45,
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '0.25rem 0',
    margin: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  title: { fontWeight: 700, fontSize: '1rem' },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit',
    opacity: 0.5,
    padding: '0 0.2rem',
    fontSize: '0.85rem',
    lineHeight: 1,
    borderRadius: '4px',
  },
  body: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  row: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  label: { fontWeight: 600, fontSize: '0.8rem', opacity: 0.6, minWidth: '130px' },
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
  reanalyzeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  reanalyzeBtn: (enabled) => ({
    padding: '0.4rem 1.1rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    borderRadius: '6px',
    border: 'none',
    cursor: enabled ? 'pointer' : 'not-allowed',
    background: enabled ? '#646cff' : '#444',
    color: enabled ? '#fff' : 'rgba(255,255,255,0.4)',
    transition: 'background 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  }),
  btnSpinner: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
  },
  reanalysisError: {
    color: '#f87171',
    fontSize: '0.88rem',
    margin: '0 0 0.75rem',
  },
  photoLoadingOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  overlaySpinner: {
    display: 'inline-block',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '4px solid rgba(255,255,255,0.2)',
    borderTopColor: 'rgba(255,255,255,0.85)',
    animation: 'spin 0.7s linear infinite',
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
    /* Tablet (768–1023px): two-column, narrower left */
    @media (min-width: 768px) {
      .rp-columns {
        grid-template-columns: minmax(200px, 280px) 1fr;
        align-items: start;
      }
    }
    /* Desktop (≥1024px): two-column, wider left */
    @media (min-width: 1024px) {
      .rp-columns {
        grid-template-columns: minmax(280px, 360px) 1fr;
      }
    }
    .rp-row-even td { background: rgba(255,255,255,0.04); }
    .rp-row-odd td { background: transparent; }
    .rp-row-active td { background: rgba(99,179,237,0.15) !important; outline: 1px solid rgba(99,179,237,0.3); }
    @keyframes panel-in {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    /* Desktop: animate panel in when active */
    .pdp-panel.pdp-active {
      animation: panel-in 200ms ease;
    }
    /* Backdrop: hidden on desktop, shown on mobile */
    .pdp-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 99;
      background: rgba(0,0,0,0.45);
    }
    /* Mobile bottom sheet */
    @media (max-width: 767px) {
      .pdp-panel {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 100 !important;
        border-radius: 16px 16px 0 0 !important;
        max-height: 60vh;
        overflow-y: auto;
        transform: translateY(100%);
        transition: transform 300ms ease;
        margin-bottom: 0 !important;
        animation: none !important;
      }
      .pdp-panel.pdp-active {
        transform: translateY(0);
        animation: none !important;
      }
      .pdp-backdrop {
        display: block;
      }
    }
    /* Mobile condensed parts list */
    .rp-mobile-parts { display: none; }
    @media (max-width: 767px) {
      .rp-table-desktop { display: none; }
      .rp-mobile-parts { display: block; }
      .rp-mobile-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.75rem;
        min-height: 44px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
        cursor: pointer;
        box-sizing: border-box;
      }
      .rp-mobile-row:active { background: rgba(99,179,237,0.08); }
      .rp-mobile-row-active { background: rgba(99,179,237,0.15) !important; }
      /* Touch targets: overlay regions at least 44×44px */
      .bio-overlay {
        min-width: 44px;
        min-height: 44px;
      }
    }
  `
  document.head.appendChild(style)
}

// ── Mobile condensed parts list ───────────────────────────────────────────────
// Single-line rows (name + priority badge); tap a row to open the bottom sheet.
function MobilePartsList({ parts, activePartId, onPartClick }) {
  return (
    <div className="rp-mobile-parts">
      {parts.map((part, i) => {
        const isActive = activePartId === part.id
        return (
          <div
            key={part.id || i}
            className={`rp-mobile-row${isActive ? ' rp-mobile-row-active' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            onClick={() => onPartClick(isActive ? null : part.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPartClick(isActive ? null : part.id)
              }
            }}
          >
            <span style={{ fontWeight: 500, fontSize: '0.9rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {part.name}
            </span>
            <PriorityBadge value={part.priority} />
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sortAsc, setSortAsc] = useState(true) // true = ascending (most urgent first)
  const [activePartId, setActivePartId] = useState(null)
  // Map of part_id → { loading, results, error }
  const [pricing, setPricing] = useState(null)
  // Analysis result — initialized from router state, replaced on reanalysis
  const [result, setResult] = useState(location.state?.result ?? null)
  // Reanalysis state
  const [reanalyzing, setReanalyzing] = useState(false)
  const [reanalysisError, setReanalysisError] = useState(null)
  // Refs for table rows keyed by part.id (for scroll-into-view)
  const rowRefs = useRef({})

  // Redirect if no analysis data
  useEffect(() => {
    if (!location.state?.result) {
      navigate('/', { state: { message: 'No analysis data — please upload a photo' } })
    }
  }, [location.state, navigate])

  const photoUrl = location.state?.photoUrl || null
  // Original File object stored in router state for reanalysis
  const file = location.state?.file || null
  const parts = Array.isArray(result?.parts) ? result.parts : []

  // Fetch pricing for a given parts array — used on initial load and after reanalysis
  const fetchPricing = useCallback((partsToFetch) => {
    if (!partsToFetch.length) return

    // Initialise all parts to loading state
    const initial = {}
    for (const p of partsToFetch) {
      initial[p.id] = { loading: true, results: [], error: null }
    }
    setPricing(initial)

    axios
      .post('/api/pricing', { parts: partsToFetch })
      .then(({ data }) => {
        const next = {}
        for (const item of data.pricing) {
          next[item.part_id] = { loading: false, results: item.results || [], error: null }
        }
        // Fill any parts not returned by the API as empty
        for (const p of partsToFetch) {
          if (!next[p.id]) {
            next[p.id] = { loading: false, results: [], error: null }
          }
        }
        setPricing(next)
      })
      .catch(() => {
        const err = {}
        for (const p of partsToFetch) {
          err[p.id] = { loading: false, results: [], error: true }
        }
        setPricing(err)
      })
  }, [])

  // Fetch pricing once on initial mount
  useEffect(() => {
    fetchPricing(parts)
    // Only run once when parts stabilise — intentionally omit parts from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle reanalysis — re-POST the stored File to /api/analyze
  const handleReanalyze = useCallback(async () => {
    if (!file || reanalyzing) return
    setReanalyzing(true)
    setReanalysisError(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await axios.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(response.data)
      setActivePartId(null)
      const newParts = Array.isArray(response.data?.parts) ? response.data.parts : []
      fetchPricing(newParts)
    } catch {
      setReanalysisError('Reanalysis failed. Please try again.')
    } finally {
      setReanalyzing(false)
    }
  }, [file, reanalyzing, fetchPricing])

  // Scroll active table row into view when activePartId changes
  useEffect(() => {
    if (!activePartId) return
    const el = rowRefs.current[activePartId]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activePartId])

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
          {/* Reanalyze button above photo */}
          <div style={s.reanalyzeRow}>
            <button
              style={s.reanalyzeBtn(!!file && !reanalyzing)}
              disabled={!file || reanalyzing}
              onClick={handleReanalyze}
              aria-busy={reanalyzing}
            >
              {reanalyzing ? (
                <>
                  <span style={s.btnSpinner} aria-hidden="true" />
                  Reanalyzing…
                </>
              ) : 'Reanalyze'}
            </button>
          </div>
          {reanalysisError && (
            <p style={s.reanalysisError} role="alert">{reanalysisError}</p>
          )}
          {/* Photo with loading overlay */}
          <div style={{ position: 'relative' }}>
            {photoUrl && (
              <BikeImageOverlay
                photoUrl={photoUrl}
                parts={parts}
                style={{ marginBottom: '1.5rem' }}
                activePartId={activePartId}
                onPartClick={setActivePartId}
              />
            )}
            {reanalyzing && (
              <div style={s.photoLoadingOverlay} aria-hidden="true">
                <span style={s.overlaySpinner} />
              </div>
            )}
          </div>
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

        {/* Right column: part detail panel + parts table */}
        <div>
          {/* Part detail panel (desktop inline card; mobile fixed bottom sheet) */}
          {(() => {
            const activePart = activePartId ? parts.find((p) => p.id === activePartId) : null
            return (
              <PartDetailPanel
                part={activePart}
                pricingState={pricing && activePartId ? pricing[activePartId] : null}
                onClose={() => setActivePartId(null)}
              />
            )
          })()}
          {/* Parts analysis table */}
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Parts Analysis ({sortedParts.length} parts)</h2>
            {/* Desktop/tablet full table */}
            <div style={s.tableWrapper} className="rp-table-desktop">
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
                  {sortedParts.map((part, i) => {
                    const isActive = activePartId === part.id
                    let rowClass = i % 2 === 0 ? 'rp-row-even' : 'rp-row-odd'
                    if (isActive) rowClass = 'rp-row-active'
                    return (
                      <tr
                        key={part.id || i}
                        className={rowClass}
                        ref={(el) => { if (el) rowRefs.current[part.id] = el }}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActivePartId(isActive ? null : part.id)}
                      >
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
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile condensed single-line list; tapping opens bottom sheet */}
            <MobilePartsList
              parts={sortedParts}
              activePartId={activePartId}
              onPartClick={setActivePartId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
