import { useState, useEffect } from 'react'
import { getAuthUrl } from '../../api/authUrl'

export function AuthedImg({ src, style, onClick, onMouseEnter, onMouseLeave, alt }: { src: string; style?: React.CSSProperties; onClick?: () => void; onMouseEnter?: React.MouseEventHandler<HTMLImageElement>; onMouseLeave?: React.MouseEventHandler<HTMLImageElement>; alt?: string }) {
  const [authSrc, setAuthSrc] = useState('')
  useEffect(() => {
    getAuthUrl(src, 'download').then(setAuthSrc)
  }, [src])
  return authSrc ? <img src={authSrc} alt={alt} style={style} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} /> : null
}
