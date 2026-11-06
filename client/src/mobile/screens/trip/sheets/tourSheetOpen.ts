import { createContext } from 'react';

/**
 * Whether the tour sheet is open (false while it slides away with the tour it
 * showed last) and the tour's name, which names the dialog.
 */
export const TourSheetOpen = createContext<{ open: boolean; label: string }>({ open: true, label: '' });
