import type { CSSProperties } from 'react'

/**
 * The map marker for the "open this day in Google Maps" buttons (#2005).
 *
 * What sat here before was the four-segment Google "G" — the *search* mark —
 * flattened to a single colour, which read as "run a Google search" rather than
 * "open a map". This is the pin instead: filled, so it is not mistaken for the
 * outline `MapPin` that labels ordinary places, and monochrome on currentColor
 * so it sits next to the lucide `Compass` of the CoMaps button beside it
 * without one of the two shouting. The button's own label carries the brand.
 *
 * Same shape as the other hand-vendored marks in the client (`BrandIcon` in
 * SystemNoticeModal, `ImmichIcon`/`SynologyIcon` in AddonManager): 24×24 box,
 * `fill="currentColor"`, `aria-hidden` because the button is already labelled.
 */
export default function GoogleMapsIcon({ size = 14, className, style }: {
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {/* Teardrop pin with the hole punched out by evenodd, so the glyph stays
          readable at the 13-14px the toolbars render it at. */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1.5c-4.142 0-7.5 3.358-7.5 7.5 0 5.25 6.09 12.34 6.87 13.222a.84.84 0 0 0 1.26 0C13.41 21.34 19.5 14.25 19.5 9c0-4.142-3.358-7.5-7.5-7.5Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z"
      />
    </svg>
  )
}
