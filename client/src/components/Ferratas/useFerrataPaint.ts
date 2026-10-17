import { useMapPaint } from '../Map/mapPaint';
import { FERRATA_TOKENS, type FerrataPaint } from './ferrataPaint';

/** The line colours, resolved again whenever the theme on `<html>` changes (see `useMapPaint`). */
export function useFerrataPaint(): FerrataPaint {
  return useMapPaint(FERRATA_TOKENS);
}
