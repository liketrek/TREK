import { createElement } from 'react'
import { Moon } from 'lucide-react'
import { escapeHtml } from '@trek/shared'
import { renderIconMarkup } from '../../utils/iconMarkup'
import type { RouteVia } from '../../types'

const moon = renderIconMarkup(createElement(Moon, { size: 13, strokeWidth: 1.8, 'aria-hidden': true }))
export const NIGHT_PAUSE_MIN_ZOOM = 6

export function nightPauseMarker(via: RouteVia): string {
  const pause = via.nightPause!
  const position = pause.atPlace ? 'left:27px;top:-27px;' : 'left:0;top:-38px;transform:translateX(-50%);'
  const stem = pause.atPlace
    ? 'left:20px;top:-7px;width:10px;height:1px;transform:rotate(-35deg);transform-origin:left center;'
    : 'left:-.5px;top:-14px;width:1px;height:14px;'
  return `<span aria-hidden="true" style="position:absolute;${stem}background:var(--text-muted);pointer-events:none;"></span><span data-night-pause="${pause.atPlace ? 'place' : 'route'}" style="position:absolute;${position}display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 8px;box-sizing:border-box;border:1px solid var(--border-primary);border-radius:9px;background:var(--bg-card);color:var(--text-primary);box-shadow:var(--shadow-sm);font-family:var(--font-system);font-size:calc(11px * var(--fs-scale-caption,1));font-weight:600;line-height:1;white-space:nowrap;cursor:inherit;">${moon}<span>${escapeHtml(String(pause.day))}</span></span>`
}
