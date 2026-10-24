import { Compass, Files, ImageIcon, Layers, LayoutTemplate, Palette, Shapes, type LucideIcon } from 'lucide-react';

/**
 * The sections of the rail, in the order a book is made.
 *
 * The first five put things on a page, read from top to bottom the way the
 * work goes: which page, the journey's own photos and words, an arrangement
 * for them, things to add (type, shapes, lines, frames, icons, stickers), and
 * the journey's figures. The last two are about the book and the page as a
 * whole, its look and what lies in front of what, and the rail sets them
 * apart with a rule.
 *
 * Stickers used to be a section of their own beside Elements. They are a kind
 * of thing to add like a shape or an icon, so they are now a tab of Elements,
 * and the rail holds one place to add things instead of two.
 */

export type RailSection = 'pages' | 'content' | 'templates' | 'elements' | 'travel' | 'theme' | 'layers';

interface RailEntry {
  id: RailSection;
  icon: LucideIcon;
  labelKey: string;
  /** The first section of the second group, which the rail sets apart. */
  startsGroup?: boolean;
}

export const RAIL_SECTIONS: readonly RailEntry[] = [
  { id: 'pages', icon: Files, labelKey: 'journey.studio.pages' },
  { id: 'content', icon: ImageIcon, labelKey: 'journey.studio.content' },
  { id: 'templates', icon: LayoutTemplate, labelKey: 'journey.studio.templates' },
  { id: 'elements', icon: Shapes, labelKey: 'journey.studio.elements' },
  { id: 'travel', icon: Compass, labelKey: 'journey.studio.travel' },
  { id: 'theme', icon: Palette, labelKey: 'studio.theme.panel', startsGroup: true },
  { id: 'layers', icon: Layers, labelKey: 'journey.studio.layers' },
];

/** The ids the rail's tabs and the panel they open share. */
export const RAIL_IDS = {
  tab: (id: RailSection) => `st-rail-tab-${id}`,
  panel: 'st-rail-panel',
} as const;
