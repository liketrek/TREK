import { BOOK_COLOR_TOKENS, bookThemeColor, type BookColorToken, type BookTheme } from '@trek/shared';
import { Unlink } from 'lucide-react';
import '../../../styles/studio-theme.css';

/**
 * The book's theme colours under a colour's own swatches in the inspector.
 * Picking one sets the colour and links it, so the element follows the next
 * theme the book takes; the chain button unlinks it and keeps the colour. A
 * book without a theme shows nothing here.
 */
export function StudioThemeLink({
  theme,
  token,
  onLink,
  onUnlink,
  t,
}: {
  theme: BookTheme | undefined;
  /** The token the colour follows now, if any. */
  token: BookColorToken | undefined;
  onLink: (token: BookColorToken, hex: string) => void;
  onUnlink: () => void;
  t: (k: string) => string;
}) {
  if (!theme) return null;
  return (
    <div className="st-theme-link">
      <span className="st-theme-link-label">{t('studio.theme.linked')}</span>
      <div className="st-swatches">
        {BOOK_COLOR_TOKENS.map((key) => {
          const hex = bookThemeColor(theme, key);
          const name = t(`studio.theme.token.${key}`);
          return (
            <button
              type="button"
              key={key}
              className={`st-swatch ${token === key ? 'is-linked' : ''}`}
              style={{ background: hex }}
              title={name}
              aria-label={name}
              aria-pressed={token === key}
              onClick={() => onLink(key, hex)}
            />
          );
        })}
      </div>
      {token && (
        <button
          type="button"
          className="st-theme-unlink"
          onClick={onUnlink}
          title={t('studio.theme.unlink')}
          aria-label={t('studio.theme.unlink')}
        >
          <Unlink size={13} />
        </button>
      )}
    </div>
  );
}
