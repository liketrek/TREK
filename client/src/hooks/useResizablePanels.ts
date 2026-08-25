import { useState, useEffect, useRef } from 'react'

const MIN_SIDEBAR = 200
const MAX_SIDEBAR = 520

export function useResizablePanels() {
  const [leftWidth, setLeftWidth] = useState<number>(() => Number.parseInt(localStorage.getItem('sidebarLeftWidth') || '') || 340)
  const [rightWidth, setRightWidth] = useState<number>(() => Number.parseInt(localStorage.getItem('sidebarRightWidth') || '') || 300)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const isResizingLeft = useRef(false)
  const isResizingRight = useRef(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isResizingLeft.current) {
        const w = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, e.clientX - 10))
        setLeftWidth(w)
        localStorage.setItem('sidebarLeftWidth', String(w))
      }
      if (isResizingRight.current) {
        const w = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, window.innerWidth - e.clientX - 10))
        setRightWidth(w)
        localStorage.setItem('sidebarRightWidth', String(w))
      }
    }
    const onUp = () => {
      isResizingLeft.current = false
      isResizingRight.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  const startResizeLeft = () => { isResizingLeft.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none' }
  const startResizeRight = () => { isResizingRight.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none' }

  return { leftWidth, rightWidth, leftCollapsed, rightCollapsed, setLeftCollapsed, setRightCollapsed, startResizeLeft, startResizeRight }
}
