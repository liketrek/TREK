import { useState, useEffect } from 'react'
import { getAuthUrl } from '../../api/authUrl'

// Authenticated image — fetches a short-lived download token and renders the image
export function AuthedImg({ src, style }: { src: string; style?: React.CSSProperties }) {
  const [authSrc, setAuthSrc] = useState('')
  useEffect(() => {
    getAuthUrl(src, 'download').then(setAuthSrc)
  }, [src])
  return authSrc ? <img src={authSrc} alt="" style={style} /> : null
}
