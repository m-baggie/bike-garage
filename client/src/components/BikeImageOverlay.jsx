import { useState } from 'react'

/**
 * BikeImageOverlay — renders a bike photo with absolutely-positioned clickable
 * overlay regions for each part that has a non-null bounding box.
 *
 * Bounding box coordinates are normalised (0.0–1.0). Overlays use percentage-
 * based CSS positioning so they scale on window resize without JS dimension
 * tracking.
 *
 * Hover shows an outline ring (no fill). Active part gets a condition-coloured
 * border + translucent fill, and the image zooms/pans to centre that region
 * via a CSS transform (scale ~2x, clipped to container, 250ms ease transition).
 *
 * Zoom maths (pure CSS, no DOM measurement):
 *   transform-origin: cx*100% cy*100%
 *   transform: translate(dx%, dy%) scale(2)
 *   where cx/cy are the part centre as 0-1 fractions, and
 *   dx% = (0.5 - cx)*100,  dy% = (0.5 - cy)*100
 * This centres the part in the container without needing pixel dimensions.
 *
 * Props:
 *   photoUrl     — URL of the bike photo
 *   parts        — array of part objects with optional `boundingBox` and `condition`
 *   style        — extra styles applied to the outer container
 *   activePartId — currently active part ID (controlled from parent)
 *   onPartClick  — callback(partId | null) — parent updates activePartId
 */

const CONDITION_COLORS = {
  excellent: 'var(--condition-excellent)',
  good:      'var(--condition-good)',
  fair:      'var(--condition-fair)',
  poor:      'var(--condition-poor)',
  unknown:   'var(--condition-unknown)',
}

export default function BikeImageOverlay({ photoUrl, parts, style, activePartId, onPartClick }) {
  const [hoveredId, setHoveredId] = useState(null)

  // Only render overlays for parts that are visible in the image and have a bounding box
  const overlayParts = (parts || []).filter(
    (p) => p.boundingBox != null && p.visible_in_image !== false
  )

  // Compute CSS transform for the active part's bounding box, or identity
  let wrapperTransform = 'translate(0, 0) scale(1)'
  let wrapperOrigin = '50% 50%'
  if (activePartId) {
    const active = overlayParts.find((p) => p.id === activePartId)
    if (active?.boundingBox) {
      const { x, y, width, height } = active.boundingBox
      const cx = x + width / 2
      const cy = y + height / 2
      const dx = (0.5 - cx) * 100
      const dy = (0.5 - cy) * 100
      wrapperOrigin = `${cx * 100}% ${cy * 100}%`
      wrapperTransform = `translate(${dx}%, ${dy}%) scale(2)`
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        borderRadius: '10px',
        ...style,
      }}
      // Click directly on the container background (not an overlay) → deactivate
      onClick={() => onPartClick?.(null)}
    >
      {/* Inner wrapper receives the zoom/pan transform */}
      <div
        style={{
          transformOrigin: wrapperOrigin,
          transform: wrapperTransform,
          transition: 'transform 250ms ease, transform-origin 0ms',
          willChange: 'transform',
        }}
      >
        <img
          src={photoUrl}
          alt="Uploaded bike"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        />
        {overlayParts.map((part) => {
          const { x, y, width, height } = part.boundingBox
          const isActive = activePartId === part.id
          const isHovered = hoveredId === part.id && !isActive
          const condKey = (part.condition || 'unknown').toLowerCase()
          const condColor = CONDITION_COLORS[condKey] || CONDITION_COLORS.unknown

          return (
            <div
              key={part.id}
              className="bio-overlay"
              role="button"
              aria-label={part.name}
              aria-pressed={isActive}
              tabIndex={0}
              title={part.name}
              style={{
                position: 'absolute',
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                width: `${width * 100}%`,
                height: `${height * 100}%`,
                boxSizing: 'border-box',
                cursor: 'pointer',
                borderRadius: '4px',
                outline: isActive
                  ? `3px solid ${condColor}`
                  : isHovered
                  ? '2px solid rgba(255, 255, 255, 0.75)'
                  : '2px solid transparent',
                background: isActive
                  ? `color-mix(in srgb, ${condColor} 25%, transparent)`
                  : 'transparent',
                transition: 'outline 0.15s ease, background 0.15s ease',
              }}
              onClick={(e) => {
                e.stopPropagation()
                onPartClick?.(isActive ? null : part.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPartClick?.(isActive ? null : part.id)
                }
              }}
              onMouseEnter={() => setHoveredId(part.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(part.id)}
              onBlur={() => setHoveredId(null)}
            />
          )
        })}
      </div>
    </div>
  )
}
