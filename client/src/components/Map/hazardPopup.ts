import { createElement } from 'react'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { renderIconMarkup } from '../../utils/iconMarkup'
import './hazardPopup.css'
import type { RoadtripHazard } from '@trek/shared'
import type { Feature, Geometry } from 'geojson'

export function hazardFeature(hazard: RoadtripHazard): Feature {
  return { type: 'Feature', properties: { id: hazard.id }, geometry: hazard.geometry as Geometry }
}

export function hazardPopup(hazard: RoadtripHazard, note: string, pointNote: string): HTMLDivElement {
  const box = document.createElement('div')
  box.className = 'trek-hazard-content flex max-w-xs flex-col gap-3 text-content'
  box.style.fontSize = 'calc(12px * var(--fs-scale-caption, 1))'
  box.style.lineHeight = '1.45'
  const title = document.createElement('div')
  title.className = 'flex items-center gap-2.5 pr-7 font-semibold'
  const symbol = document.createElement('span')
  symbol.className = 'flex size-7 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning'
  symbol.innerHTML = renderIconMarkup(createElement(AlertTriangle, { size: 15, strokeWidth: 1.8 }))
  const heading = document.createElement('span')
  heading.textContent = hazard.title
  title.append(symbol, heading)
  box.append(title)
  if (hazard.description.trim() && hazard.description.trim().toLocaleLowerCase() !== hazard.title.trim().toLocaleLowerCase()) {
    const details = document.createElement('div')
    details.className = 'text-content-secondary'
    details.textContent = hazard.description
    box.append(details)
  }
  const metadata = document.createElement('div')
  metadata.className = 'flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-content-muted'
  const source = document.createElement('a')
  source.textContent = hazard.source
  source.href = hazard.url
  source.target = '_blank'
  source.rel = 'noopener noreferrer'
  source.className = 'trek-hazard-source inline-flex items-center gap-1 rounded-md bg-surface-hover px-1.5 py-0.5 font-medium'
  const external = document.createElement('span')
  external.innerHTML = renderIconMarkup(createElement(ArrowUpRight, { size: 12 }))
  source.append(external)
  const timestamp = document.createElement('time')
  timestamp.dateTime = hazard.updatedAt
  timestamp.textContent = new Date(hazard.updatedAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  metadata.append(source, timestamp)
  const caution = document.createElement('div')
  caution.className = 'border-t border-edge-faint pt-2.5 text-content-muted'
  caution.textContent = hazard.geometry.type === 'Point' ? pointNote + ' ' + note : note
  box.append(metadata)
  if (hazard.source === 'GDACS' && hazard.alertScore != null) box.append(scoreBar(hazard.alertScore))
  box.append(caution)
  return box
}

function scoreBar(score: number): HTMLDivElement {
  const panel = document.createElement('div')
  panel.className = 'trek-hazard-score'
  const heading = document.createElement('div')
  heading.className = 'trek-hazard-score-heading'
  const label = document.createElement('span')
  label.textContent = 'GDACS Score'
  const value = document.createElement('strong')
  value.textContent = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(score)
  value.style.color = score < 1 ? 'var(--success)' : score < 2 ? 'var(--warning)' : 'var(--danger)'
  heading.append(label, value)
  const track = document.createElement('div')
  track.className = 'trek-hazard-score-track'
  track.setAttribute('role', 'img')
  track.setAttribute('aria-label', 'GDACS Score ' + value.textContent)
  for (const color of ['success', 'warning', 'danger']) {
    const segment = document.createElement('span')
    segment.style.background = 'var(--' + color + ')'
    track.append(segment)
  }
  const marker = document.createElement('span')
  marker.className = 'trek-hazard-score-marker'
  marker.style.left = Math.min(score / 3, 1) * 100 + '%'
  track.append(marker)
  const ticks = document.createElement('div')
  ticks.className = 'trek-hazard-score-ticks'
  for (const tick of ['0', '1', '2', '3+']) {
    const number = document.createElement('span')
    number.textContent = tick
    ticks.append(number)
  }
  panel.append(heading, track, ticks)
  return panel
}
