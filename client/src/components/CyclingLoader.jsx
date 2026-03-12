// Cycling-themed loading animation: spinning bicycle wheel SVG + caption text.
// Replaces generic CSS spinners during analysis and reanalysis flows.
export default function CyclingLoader({ message = 'Spinning up your diagnosis\u2026' }) {
  // 8 spoke lines from center (32,32) to rim (r=28), evenly spaced at 45° intervals
  const spokes = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180
    return {
      x2: 32 + 28 * Math.cos(angle),
      y2: 32 + 28 * Math.sin(angle),
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        aria-hidden="true"
        style={{ animation: 'spin 1.2s linear infinite' }}
      >
        {/* Outer rim */}
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="var(--priority-5)"
          strokeWidth="3"
        />
        {/* Hub */}
        <circle
          cx="32"
          cy="32"
          r="4"
          fill="none"
          stroke="var(--priority-5)"
          strokeWidth="2"
        />
        {/* 8 spokes */}
        {spokes.map(({ x2, y2 }, i) => (
          <line
            key={i}
            x1="32"
            y1="32"
            x2={x2}
            y2={y2}
            stroke="var(--priority-5)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {message}
      </span>
    </div>
  )
}
