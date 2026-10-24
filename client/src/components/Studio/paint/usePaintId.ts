import { useId } from 'react';

/**
 * Defs ids for paint, unique per mounted copy of a page (paintRender.tsx says why).
 */

/** A defs id unique to this mounted instance, safe inside `url(#...)`. */
export function usePaintId(prefix: string): string {
  const raw = useId();
  return `${prefix}-${raw.replace(/[^\w-]/g, '')}`;
}
