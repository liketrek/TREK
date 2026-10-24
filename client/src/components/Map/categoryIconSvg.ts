import { createElement } from 'react';
import { renderIconMarkup } from '../../utils/iconMarkup';
import { CATEGORY_ICON_MAP } from '../shared/categoryIcons';

/**
 * A category's icon as markup for a hand-built map pin, the same on the
 * Leaflet and the GL map. The name only picks from the app's own icon table
 * (an unknown one falls back to the pin), so nothing it carries reaches the
 * markup. Every icon in that table is rendered by iconMarkup.parity.test.ts,
 * so a failure here is a bug to surface, not a case to hide.
 */
export function categoryIconSvg(
  iconName: string | null | undefined,
  size: number,
  color = 'white',
  strokeWidth = 2.5
): string {
  const IconComponent = (iconName && CATEGORY_ICON_MAP[iconName]) || CATEGORY_ICON_MAP['MapPin'];
  return renderIconMarkup(createElement(IconComponent, { size, color, strokeWidth }));
}
