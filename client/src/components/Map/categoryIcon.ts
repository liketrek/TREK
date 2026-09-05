import { createElement } from 'react'
import { CATEGORY_ICON_MAP } from '../shared/categoryIcons'
import { renderIconMarkup } from '../../utils/iconMarkup'

/**
 * Renders a category's Lucide glyph to an SVG string for injection into a
 * marker element. Shared by the GL and Google renderers so a pin drawn by one
 * is identical to a pin drawn by the other.
 */
export function categoryIconSvg(iconName: string | null | undefined, size: number): string {
  const IconComponent = (iconName && CATEGORY_ICON_MAP[iconName]) || CATEGORY_ICON_MAP['MapPin']
  try {
    return renderIconMarkup(createElement(IconComponent, { size, color: 'white', strokeWidth: 2.5 }))
  } catch { return '' }
}
