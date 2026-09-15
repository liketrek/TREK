import React from 'react'

export interface BrandIconProps {
  size?: number
  /**
   * Fill the box it sits in, corner to corner.
   *
   * A brand mark that is itself a badge should BE the framed slot rather than
   * float in the middle of one — which is what the lucide line icons beside it
   * need, and it does not.
   */
  fill?: boolean
  /**
   * Drain the colour, for a switched-off addon. Every other tile greys its glyph
   * out; a full-colour badge among them reads as the one thing that is on.
   */
  muted?: boolean
  /**
   * Sizing classes, so the mark can stand in wherever a lucide icon is expected
   * (`w-5 h-5 …`). When set it wins over `size`.
   */
  className?: string
}

/**
 * A third party's own logo, served as a file and rendered unmodified.
 *
 * The files under `public/brands/` are the marks as each project ships them.
 * They are deliberately NOT recoloured to `currentColor` the way the Immich and
 * Synology glyphs in the addon manager are: those are single-colour shapes that
 * happen to be brands, while these are the pictures people recognise, and
 * redrawing one in the user's accent makes it a different logo.
 *
 * Served rather than inlined because one of them is 56 paths — inline it would
 * be a kilobyte of markup at every call site, and this way the browser caches it.
 */
export default function BrandIcon({
  src,
  size = 20,
  fill = false,
  muted = false,
  className,
}: BrandIconProps & { src: string }): React.ReactElement {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      // The files carry their own width/height attributes; the explicit style is
      // what keeps them at icon size next to the lucide glyphs.
      style={{
        ...(fill
          ? { width: '100%', height: '100%', objectFit: 'contain' as const }
          : className
            ? { flexShrink: 0 }
            : { width: size, height: size, flexShrink: 0 }),
        display: 'block',
        ...(muted ? { filter: 'grayscale(1)', opacity: 0.55 } : {}),
      }}
    />
  )
}
