import { useState, useEffect } from 'react'
import { getAuthUrl } from '../../api/authUrl'

export function AuthedImg({ src, style, onClick, onMouseEnter, onMouseLeave, alt }: { src: string; style?: React.CSSProperties; onClick?: () => void; onMouseEnter?: React.MouseEventHandler<HTMLElement>; onMouseLeave?: React.MouseEventHandler<HTMLElement>; alt?: string }) {
  const [authSrc, setAuthSrc] = useState('')
  useEffect(() => {
    getAuthUrl(src, 'download').then(setAuthSrc)
  }, [src])
  if (!authSrc) return null
  // A clickable thumbnail gets a real button around the image so it is
  // reachable by keyboard. The caller's style stays on the outer box, so the
  // hover transform/transition still animates the element that carries them.
  if (onClick) {
    return (
      <button type="button" onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
        style={{ ...style, padding: 0, border: 'none', background: 'none', display: 'block' }}>
        <img src={authSrc} alt={alt} style={{ ...style, width: '100%', height: '100%', display: 'block' }} />
      </button>
    )
  }
  return <img src={authSrc} alt={alt} style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />
}
