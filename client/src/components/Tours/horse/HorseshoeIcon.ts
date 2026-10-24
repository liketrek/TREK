import { createLucideIcon } from 'lucide-react';

/**
 * HOR-01: a horseshoe, the ride's own symbol, drawn on lucide's grid (24,
 * stroke 2, round caps) so it sits beside its icons without a seam: the shoe
 * open to the ground, its two arcs joined at the heels and four nail holes.
 * Lucide has no horse; built with its own factory, it is a LucideIcon like
 * any other and goes wherever one does.
 */
export const Horseshoe = createLucideIcon('horseshoe', [
  ['path', { d: 'M5.5 20C3.9 18 3 15.3 3 12.5a9 9 0 0 1 18 0c0 2.8-.9 5.5-2.5 7.5', key: 'outer' }],
  ['path', { d: 'M9.5 18c-.9-1.3-1.5-3.3-1.5-5.5a4 4 0 0 1 8 0c0 2.2-.6 4.2-1.5 5.5', key: 'inner' }],
  ['path', { d: 'm5.5 20 4-2', key: 'heel-start' }],
  ['path', { d: 'm18.5 20-4-2', key: 'heel-end' }],
  ['path', { d: 'M5.5 12.5h.01', key: 'nail-1' }],
  ['path', { d: 'M7.4 7.9h.01', key: 'nail-2' }],
  ['path', { d: 'M16.6 7.9h.01', key: 'nail-3' }],
  ['path', { d: 'M18.5 12.5h.01', key: 'nail-4' }],
]);
