import { systemNoticeDtoSchema } from './system-notice.schema';

import { describe, it, expect } from 'vitest';

describe('systemNoticeDtoSchema', () => {
  it('accepts a minimal notice (required fields only)', () => {
    const parsed = systemNoticeDtoSchema.parse({
      id: 'welcome',
      display: 'modal',
      severity: 'info',
      titleKey: 'notice.welcome.title',
      bodyKey: 'notice.welcome.body',
      dismissible: true,
    });
    expect(parsed.id).toBe('welcome');
  });

  it('accepts a rich notice with media, highlights and a nav CTA', () => {
    expect(
      systemNoticeDtoSchema.safeParse({
        id: 'release',
        display: 'banner',
        severity: 'warn',
        titleKey: 't',
        bodyKey: 'b',
        dismissible: false,
        bodyParams: { version: '3.1' },
        icon: 'sparkles',
        media: { src: '/img.png', altKey: 'alt', placement: 'hero' },
        highlights: [{ labelKey: 'h1', iconName: 'check' }],
        cta: { kind: 'nav', labelKey: 'open', href: '/whats-new' },
      }).success,
    ).toBe(true);
  });

  it('accepts an action CTA with the discriminated-union shape', () => {
    expect(
      systemNoticeDtoSchema.safeParse({
        id: 'x',
        display: 'toast',
        severity: 'critical',
        titleKey: 't',
        bodyKey: 'b',
        dismissible: true,
        cta: {
          kind: 'action',
          labelKey: 'do',
          actionId: 'reload',
          dismissOnAction: true,
        },
      }).success,
    ).toBe(true);
  });

  it('accepts a release notice and keeps its optional pieces optional', () => {
    const base = {
      id: 'release-4-0-0',
      display: 'modal' as const,
      severity: 'info' as const,
      titleKey: 't',
      bodyKey: 'b',
      dismissible: true,
      release: {
        version: '4.0.0',
        eyebrowKey: 'e',
        tagKey: 'tag',
        headlineKey: 'h',
        introKey: 'i',
        features: [
          { iconName: 'Smartphone', titleKey: 'f1t', bodyKey: 'f1b' },
          { iconName: 'BookOpen', titleKey: 'f2t', bodyKey: 'f2b', badgeKey: 'beta' },
        ],
        note: {
          eyebrowKey: 'ne',
          titleKey: 'nt',
          bodyKey: 'nb',
          promiseLabelKey: 'pl',
          promiseTextKey: 'pt',
          bodyAfterKey: 'nba',
          closingKey: 'nc',
          signatureKey: 'ns',
        },
        supportTextKey: 's',
      },
    };
    expect(systemNoticeDtoSchema.safeParse(base).success).toBe(true);

    const withExtras = {
      ...base,
      release: {
        ...base.release,
        stats: [{ value: '~150', labelKey: 'bugs' }],
        notes: { labelKey: 'notes', href: 'https://example.test' },
        footnoteKey: 'fn',
      },
    };
    expect(systemNoticeDtoSchema.safeParse(withExtras).success).toBe(true);
  });

  it('rejects a release block missing the maintainer note', () => {
    expect(
      systemNoticeDtoSchema.safeParse({
        id: 'release-x',
        display: 'modal',
        severity: 'info',
        titleKey: 't',
        bodyKey: 'b',
        dismissible: true,
        release: {
          version: '4.0.0',
          eyebrowKey: 'e',
          tagKey: 'tag',
          headlineKey: 'h',
          introKey: 'i',
          features: [],
          supportTextKey: 's',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects an unknown display value and a malformed CTA', () => {
    expect(
      systemNoticeDtoSchema.safeParse({
        id: 'x',
        display: 'popup',
        severity: 'info',
        titleKey: 't',
        bodyKey: 'b',
        dismissible: true,
      }).success,
    ).toBe(false);
    expect(
      systemNoticeDtoSchema.safeParse({
        id: 'x',
        display: 'modal',
        severity: 'info',
        titleKey: 't',
        bodyKey: 'b',
        dismissible: true,
        cta: { kind: 'nav', labelKey: 'open' },
      }).success,
    ).toBe(false);
  });
});
