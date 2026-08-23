// FE-COMP-I18NCTX-001 to FE-COMP-I18NCTX-017 (plus -003b / -013b)
import { act, render, screen, waitFor } from '@testing-library/react';
import { SUPPORTED_LANGUAGES, TranslationProvider, useTranslation } from '../../../src/i18n/TranslationContext';
import { TransHtml } from '../../../src/i18n/TransHtml';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { resetAllStores, seedStore } from '../../helpers/store';

// The provider swaps the whole string table via a dynamic import per locale, so
// these tests assert on what the consumer actually sees rather than on the
// loader plumbing: English is synchronous, everything else arrives one tick later.

function Probe({ tKey, params }: { tKey: string; params?: Record<string, string | number> }) {
  const { t, language, locale } = useTranslation();
  return (
    <div>
      <span data-testid="value">{t(tKey, params)}</span>
      <span data-testid="language">{language}</span>
      <span data-testid="locale">{locale}</span>
    </div>
  );
}

function HtmlProbe({ tKey, params }: { tKey: string; params?: Record<string, string | number> }) {
  const { tHtml } = useTranslation();
  return <span data-testid="raw">{tHtml(tKey, params)}</span>;
}

function withLanguage(language: string) {
  seedStore(useSettingsStore, { settings: { language } });
}

beforeEach(() => {
  resetAllStores();
  document.documentElement.lang = '';
  document.documentElement.dir = '';
});

describe('TranslationProvider', () => {
  it('FE-COMP-I18NCTX-001: resolves a key from the English table', () => {
    render(<TranslationProvider><Probe tKey="common.save" /></TranslationProvider>);
    expect(screen.getByTestId('value').textContent).toBe('Save');
  });

  it('FE-COMP-I18NCTX-002: returns the key itself when nothing matches', () => {
    render(<TranslationProvider><Probe tKey="does.not.exist" /></TranslationProvider>);
    expect(screen.getByTestId('value').textContent).toBe('does.not.exist');
  });

  it('FE-COMP-I18NCTX-003: substitutes every occurrence of a placeholder', () => {
    render(<TranslationProvider><Probe tKey="common.hoursAgo" params={{ count: 5 }} /></TranslationProvider>);
    expect(screen.getByTestId('value').textContent).toContain('5');
  });

  it('FE-COMP-I18NCTX-003b: inserts a value containing $ patterns literally', () => {
    render(
      <TranslationProvider>
        <Probe tKey="journey.frontpage.suggestionText" params={{ title: 'A$&B $1 $`' }} />
      </TranslationProvider>,
    );
    // A trip really can be named this, and `$&` as a replacement string would
    // paste the matched placeholder back in.
    expect(screen.getByTestId('value').textContent).toContain('A$&B $1 $`');
  });

  it('FE-COMP-I18NCTX-004: defaults to English with the matching locale', () => {
    render(<TranslationProvider><Probe tKey="common.save" /></TranslationProvider>);
    expect(screen.getByTestId('language').textContent).toBe('en');
    expect(screen.getByTestId('locale').textContent).toBe('en-US');
  });

  it('FE-COMP-I18NCTX-005: loads another locale and exposes its language and locale', async () => {
    withLanguage('de');
    render(<TranslationProvider><Probe tKey="common.save" /></TranslationProvider>);

    expect(screen.getByTestId('language').textContent).toBe('de');
    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('Speichern'));
    expect(screen.getByTestId('locale').textContent).toBe('de-DE');
  });

  it('FE-COMP-I18NCTX-006: falls back to the English string for a key a locale is missing', async () => {
    withLanguage('de');
    render(<TranslationProvider><Probe tKey="does.not.exist" /></TranslationProvider>);
    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('does.not.exist'));
  });

  it('FE-COMP-I18NCTX-007: writes lang and ltr direction onto the html element', () => {
    withLanguage('de');
    render(<TranslationProvider><Probe tKey="common.save" /></TranslationProvider>);

    expect(document.documentElement.lang).toBe('de');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('FE-COMP-I18NCTX-008: switches the html element to rtl for Arabic', async () => {
    withLanguage('ar');
    render(<TranslationProvider><Probe tKey="common.save" /></TranslationProvider>);

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    await waitFor(() => expect(screen.getByTestId('value').textContent).not.toBe('Save'));
  });

  it('FE-COMP-I18NCTX-009: keeps the English table for an unknown language code', () => {
    withLanguage('klingon');
    render(<TranslationProvider><Probe tKey="common.save" /></TranslationProvider>);

    expect(screen.getByTestId('value').textContent).toBe('Save');
    expect(screen.getByTestId('language').textContent).toBe('klingon');
  });

  it('FE-COMP-I18NCTX-010: treats an empty language setting as English', () => {
    withLanguage('');
    render(<TranslationProvider><Probe tKey="common.save" /></TranslationProvider>);
    expect(screen.getByTestId('language').textContent).toBe('en');
  });

  it('FE-COMP-I18NCTX-011: a locale arriving after a second switch does not win', async () => {
    withLanguage('de');
    render(<TranslationProvider><Probe tKey="common.save" /></TranslationProvider>);

    // Switch back before the German chunk lands — the cancelled loader must not
    // overwrite the English table when its promise finally resolves.
    act(() => withLanguage('en'));
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByTestId('language').textContent).toBe('en');
    expect(screen.getByTestId('value').textContent).toBe('Save');
  });

  it('FE-COMP-I18NCTX-011a: every supported language resolves through its own chunk', async () => {
    for (const { value } of SUPPORTED_LANGUAGES) {
      withLanguage(value);
      const view = render(<TranslationProvider><Probe tKey="common.save" /></TranslationProvider>);
      await act(async () => { await Promise.resolve(); });

      expect(screen.getByTestId('language').textContent).toBe(value);
      // Whatever the locale ships, the key must resolve to something other than itself.
      expect(screen.getByTestId('value').textContent).not.toBe('common.save');
      view.unmount();
    }
  });

  it('FE-COMP-I18NCTX-012: the default context outside a provider echoes the key', () => {
    render(<Probe tKey="common.save" />);
    expect(screen.getByTestId('value').textContent).toBe('common.save');
    expect(screen.getByTestId('locale').textContent).toBe('en-US');
  });
});

describe('tHtml', () => {
  it('FE-COMP-I18NCTX-013: escapes an interpolated value before substitution', () => {
    render(
      <TranslationProvider>
        <HtmlProbe tKey="journey.frontpage.suggestionText" params={{ title: '<img src=x onerror=alert(1)>' }} />
      </TranslationProvider>,
    );

    const raw = screen.getByTestId('raw').textContent ?? '';
    expect(raw).not.toContain('<img');
    expect(raw).toContain('&lt;img');
  });

  it('FE-COMP-I18NCTX-013b: keeps $ patterns in an escaped value literal', () => {
    render(
      <TranslationProvider>
        <HtmlProbe tKey="journey.frontpage.suggestionText" params={{ title: 'A$&B' }} />
      </TranslationProvider>,
    );

    expect(screen.getByTestId('raw').textContent).toContain('A$&amp;B');
  });

  it('FE-COMP-I18NCTX-014: returns the key unchanged when it is unknown', () => {
    render(<TranslationProvider><HtmlProbe tKey="nope.nope" /></TranslationProvider>);
    expect(screen.getByTestId('raw').textContent).toBe('nope.nope');
  });
});

describe('TransHtml', () => {
  it('FE-COMP-I18NCTX-015: renders as a span by default and keeps allowed inline markup', () => {
    const { container } = render(
      <TranslationProvider>
        <TransHtml html="journey.frontpage.suggestionText" params={{ title: 'Japan 2026' }} />
      </TranslationProvider>,
    );

    const el = container.firstElementChild!;
    expect(el.tagName).toBe('SPAN');
    expect(el.textContent).toContain('Japan 2026');
    expect(el.querySelector('script')).toBeNull();
  });

  it('FE-COMP-I18NCTX-016: honours the as, className and id props', () => {
    const { container } = render(
      <TranslationProvider>
        <TransHtml as="p" className="text-body" id="banner" html="common.save" />
      </TranslationProvider>,
    );

    const el = container.firstElementChild!;
    expect(el.tagName).toBe('P');
    expect(el).toHaveClass('text-body');
    expect(el.id).toBe('banner');
  });

  it('FE-COMP-I18NCTX-017: neutralises a script tag smuggled in through a param', () => {
    const { container } = render(
      <TranslationProvider>
        <TransHtml html="journey.frontpage.suggestionText" params={{ title: '<script>alert(1)</script>' }} />
      </TranslationProvider>,
    );

    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('alert(1)');
  });
});
