import { describe, expect, it } from 'vitest';
import { interpolate, isRtl, translator, trekLanguage } from '../../src/lib/i18n';

describe('trekLanguage', () => {
  it('APPS-I18N-001: maps a host tag to the TREK code that holds it', () => {
    expect(trekLanguage('de-DE')).toBe('de');
    expect(trekLanguage('pt-BR')).toBe('br');
    expect(trekLanguage('el')).toBe('gr');
    expect(trekLanguage('zh-TW')).toBe('zh-TW');
    expect(trekLanguage('zh-Hant')).toBe('zh-TW');
    expect(trekLanguage('zh-CN')).toBe('zh');
  });

  it('APPS-I18N-002: falls back to English for no locale or one TREK lacks', () => {
    expect(trekLanguage(undefined)).toBe('en');
    expect(trekLanguage('xx-YY')).toBe('en');
  });
});

describe('translator', () => {
  it('APPS-I18N-003: reads the language, then English, then the key', () => {
    expect(translator('de')('mcpApps.openInTrek')).toBe('In TREK öffnen');
    expect(translator('nope')('mcpApps.openInTrek')).toBe('Open in TREK');
    expect(translator('de')('mcpApps.unknown')).toBe('mcpApps.unknown');
  });

  it('APPS-I18N-004: knows the right-to-left languages', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('he')).toBe(true);
    expect(isRtl('en')).toBe(false);
  });
});

describe('interpolate', () => {
  it('APPS-I18N-004: fills the named placeholders and leaves unknown ones alone', () => {
    expect(interpolate('Day {day} of {trip}', { day: 3 })).toBe('Day 3 of {trip}');
    expect(interpolate('No placeholders', undefined)).toBe('No placeholders');
    expect(translator('en')('mcpApps.dayPlan.day', { day: 2 })).not.toContain('{day}');
  });

  it('APPS-I18N-005: writes a value holding $& or $1 as it is', () => {
    expect(interpolate('Add {id}', { id: 'a$&b$1' })).toBe('Add a$&b$1');
  });
});
