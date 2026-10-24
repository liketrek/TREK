import type { BookPalette, BookThemeFont } from '@trek/shared';

import '../../../styles/studio-theme.css';
import { fontStack } from '../bookFonts';

/**
 * A theme as a little page: its paper, "Aa" in its display face and ink, and
 * its three accents. The Theme panel's cards and the inspector's summary of the
 * book's theme draw it alike, so the theme a book has looks like the card it
 * was picked from.
 *
 * The colours are the theme's own, set inline from the data: the sheet shows
 * what the theme offers, which no token of the app's could.
 */
export function ThemeSheet({ palette, display }: { palette: BookPalette; display: BookThemeFont }) {
  return (
    <span className="st-theme-sheet" style={{ background: palette.paper }} aria-hidden>
      <span
        className="st-theme-word"
        style={{
          fontFamily: fontStack(display.font),
          color: palette.ink,
          fontStyle: display.italic ? 'italic' : undefined,
        }}
      >
        Aa
      </span>
      <span className="st-theme-dots">
        {[palette.accent, palette.accent2, palette.accent3].map((c, i) => (
          <span key={i} style={{ background: c }} />
        ))}
      </span>
    </span>
  );
}
