import { useEffect, useState } from 'react'
import { Navigation } from 'lucide-react'
import type mapboxgl from 'mapbox-gl'

/**
 * Round compass pill for the Mapbox planner map. The Mapbox map can be rotated and
 * pitched, so this shows the current bearing (the arrow points to north) and snaps
 * the camera back to north + flat on click. Rendered next to the POI "explore" pill
 * (Mapbox only) and built as the SAME frosted shell (padding 4 around a 34px button)
 * so its height and transparency match the POI pill exactly.
 */
export function MapCompassPill({ map }: { map: mapboxgl.Map }) {
  const [bearing, setBearing] = useState(() => map.getBearing())

  useEffect(() => {
    const update = () => setBearing(map.getBearing())
    update()
    map.on('rotate', update)
    return () => { map.off('rotate', update) }
  }, [map])

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', padding: 4, borderRadius: 999, pointerEvents: 'auto',
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: 'var(--sidebar-shadow, 0 4px 16px rgba(0,0,0,0.14))',
    }}>
      <button
        type="button"
        onClick={() => map.easeTo({ bearing: 0, pitch: 0, duration: 300 })}
        aria-label="Reset north"
        className="text-content-muted"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'transparent', padding: 0,
          transition: 'background 0.14s, color 0.14s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <Navigation size={16} strokeWidth={2} style={{ transform: `rotate(${-bearing}deg)`, transition: 'transform 0.1s linear' }} />
      </button>
    </div>
  )
}
