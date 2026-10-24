import type { FerrataBbox } from '@trek/shared';
import { create } from 'zustand';

/**
 * The area the tour planner's map shows, as it last reported it, for the rails
 * beside it that look for something "in this view" (HOR-01's horse routes).
 * The map stage writes it; null while no planner map is on screen.
 */
export const useTourMapViewportStore = create<{ bounds: FerrataBbox | null }>(() => ({ bounds: null }));

export function publishTourMapViewport(bounds: FerrataBbox | null): void {
  useTourMapViewportStore.setState({ bounds });
}
