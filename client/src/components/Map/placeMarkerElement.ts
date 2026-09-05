import { escapeHtml } from '@trek/shared'
import { safeHexColor } from '../../utils/safeColor'
import { categoryIconSvg } from './categoryIcon'
import type { Place } from '../../types'

/**
 * The circular place pin every GL-family renderer draws: category colour or
 * photo, selection ring, and the day-order badge.
 *
 * Extracted from MapViewGL so a second renderer can draw an identical marker
 * instead of carrying its own copy — the pin is what makes a TREK map look like
 * a TREK map, and two copies would drift.
 */
export function createMarkerElement(place: Place & { category_color?: string; category_icon?: string }, photoUrl: string | null, orderNumbers: number[] | null, selected: boolean): HTMLDivElement {
  const size = selected ? 44 : 36
  // See MapView: allow-listed rather than escaped, because this is a CSS context.
  const borderColor = selected ? '#111827' : safeHexColor(place.category_color, 'white')
  const borderWidth = selected ? 3 : 2.5
  const shadow = selected
    ? '0 0 0 3px rgba(17,24,39,0.25), 0 4px 14px rgba(0,0,0,0.3)'
    : '0 2px 8px rgba(0,0,0,0.22)'
  const bgColor = safeHexColor(place.category_color, '#6b7280')

  // The visual circle is `size` + 2*border on each side. To make the
  // mapbox `anchor: 'center'` land on the real visual middle of the marker
  // (rather than just the inner content box), the wrapper has to be the
  // full outer size. If we gave the wrapper only `size`, the border would
  // bleed outside it and the route lines would appear slightly off.
  const outer = size + borderWidth * 2

  let badgeHtml = ''
  if (orderNumbers && orderNumbers.length > 0) {
    const label = orderNumbers.join(' · ')
    badgeHtml = `<span style="
      position:absolute;bottom:-2px;right:-2px;
      min-width:18px;height:${orderNumbers.length > 1 ? 16 : 18}px;border-radius:${orderNumbers.length > 1 ? 8 : 9}px;
      padding:0 ${orderNumbers.length > 1 ? 4 : 3}px;
      background:rgba(255,255,255,0.94);
      border:1.5px solid rgba(0,0,0,0.15);
      box-shadow:0 1px 4px rgba(0,0,0,0.18);
      display:flex;align-items:center;justify-content:center;
      font-size:${orderNumbers.length > 1 ? 7.5 : 9}px;font-weight:800;color:#111827;
      font-family:var(--font-system);line-height:1;
      box-sizing:border-box;white-space:nowrap;
    ">${label}</span>`
  }

  const wrap = document.createElement('div')
  // Do NOT set `position: relative` here — GL map libraries ship
  // marker classes with `position: absolute` and rely on it. An inline
  // `position: relative` here overrides the class, turns every marker into
  // a static block element, and stacks them in document order inside the
  // canvas container. The result looks exactly like "markers drift as the
  // map zooms" because each marker's transform is then applied relative
  // to its stacked slot, not to the map viewport.
  wrap.style.cssText = `width:${outer}px;height:${outer}px;cursor:pointer;`

  const hasPhoto = photoUrl && (photoUrl.startsWith('data:') || photoUrl.startsWith('/api/maps/place-photo/') || photoUrl.startsWith('/uploads/'))
  if (hasPhoto) {
    wrap.innerHTML = `
      <div style="
        position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
        width:${size}px;height:${size}px;border-radius:50%;
        border:${borderWidth}px solid ${borderColor};
        box-shadow:${shadow};
        overflow:hidden;background:${bgColor};
        box-sizing:content-box;
      ">
        <img src="${escapeHtml(photoUrl)}" width="${size}" height="${size}" style="display:block;border-radius:50%;object-fit:cover;" />
      </div>
      ${badgeHtml}
    `
  } else {
    wrap.innerHTML = `
      <div style="
        position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
        width:${size}px;height:${size}px;border-radius:50%;
        border:${borderWidth}px solid ${borderColor};
        box-shadow:${shadow};
        background:${bgColor};
        display:flex;align-items:center;justify-content:center;
        box-sizing:content-box;
      ">
        ${categoryIconSvg(place.category_icon, selected ? 18 : 15)}
      </div>
      ${badgeHtml}
    `
  }
  return wrap
}
