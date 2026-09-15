import React from 'react'
import BrandIcon, { type BrandIconProps } from './BrandIcon'

/**
 * Dawarich's own mark, unmodified: green and grey map blocks behind the blue
 * road that loops back as a D, with the white roundabout at the junction.
 *
 * The file is `app/assets/images/logo.svg` from Freika/dawarich, served from
 * `public/brands/`. See `BrandIcon` for why it is a file rather than inline
 * markup, and why it keeps its own colours.
 */
export default function DawarichIcon(props: BrandIconProps): React.ReactElement {
  return <BrandIcon src="/brands/dawarich.svg" {...props} />
}
