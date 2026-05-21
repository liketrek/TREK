// ─────────────────────────────────────────────────────────────────────────────
// FICHERO NUEVO: client/src/components/Packing/BikepackDrawer.tsx
//
// Drawer lateral que embebe Bikepack en un iframe.
// Se abre desde TripPlannerPage al pulsar el botón 🚴 Bikepack.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { X, Download, ExternalLink, Loader2 } from 'lucide-react'
import ReactDOM from 'react-dom'

const BIKEPACK_URL = 'https://trekwanderer.info:448'

interface Props {
  onClose: () => void
  onImport: () => void  // abre el modal de importación
}

export default function BikepackDrawer({ onClose, onImport }: Props) {
  const [loaded, setLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Escuchar mensajes de Bikepack (para futura comunicación postMessage)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== BIKEPACK_URL) return
      if (e.data?.type === 'bikepack:saved') {
        // Bikepack avisa que se guardaron cambios — podríamos auto-importar aquí
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const drawer = (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1101,
        width: 'min(820px, 90vw)',
        background: 'var(--bg-primary)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.22s cubic-bezier(0.23,1,0.32,1)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-secondary)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 16 }}>🚴</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>
            Bikepack
          </span>

          {/* Botón importar a este viaje */}
          <button
            onClick={() => { onClose(); setTimeout(onImport, 150) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: '#0d9488', color: '#fff',
              border: 'none', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Download size={13} />
            Importar a este viaje
          </button>

          {/* Abrir en pestaña */}
          <a
            href={BIKEPACK_URL}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 8,
              border: '1px solid var(--border-primary)',
              color: 'var(--text-muted)', fontSize: 12,
              textDecoration: 'none', fontWeight: 500,
            }}
          >
            <ExternalLink size={12} />
            <span className="hidden sm:inline">Abrir</span>
          </a>

          {/* Cerrar */}
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8,
              border: 'none', background: 'var(--bg-hover)',
              color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* iframe */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {!loaded && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, color: 'var(--text-muted)',
            }}>
              <Loader2 size={24} className="animate-spin" />
              <span style={{ fontSize: 13 }}>Cargando Bikepack…</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={BIKEPACK_URL}
            onLoad={() => setLoaded(true)}
            style={{
              width: '100%', height: '100%',
              border: 'none',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
            title="Bikepack"
          />
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )

  return ReactDOM.createPortal(drawer, document.body)
}
