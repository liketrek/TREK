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
      id: 'release-notes',
      display: 'modal' as const,
      severity: 'info' as const,
      titleKey: 't',
      bodyKey: 'b',
      dismissible: true,
      release: {
        version: '4.3.0',
        eyebrowKey: 'e',
        headlineKey: 'h',
        introKey: 'i',
        featuresLabelKey: 'fl',
        features: [
          { iconName: 'Database', titleKey: 'f1t', bodyKey: 'f1b' },
          { iconName: 'Route', visual: 'roadtrip', titleKey: 'f2t', bodyKey: 'f2b' },
          { iconName: 'FolderSync', visual: 'docsync', layout: 'wide', titleKey: 'f3t', bodyKey: 'f3b' },
        ],
        note: {
          eyebrowKey: 'ne',
          titleKey: 'nt',
          bodyKey: 'nb',
          promiseLabelKey: 'pl',
          promiseLeadKey: 'plead',
          promiseTextKey: 'pt',
          bodyAfterKey: 'nba',
          closingKey: 'nc',
        },
        supportLeadKey: 'slead',
        supportTextKey: 's',
      },
    };
    expect(systemNoticeDtoSchema.safeParse(base).success).toBe(true);

    const withExtras = {
      ...base,
      release: {
        ...base.release,
        featuresAsideKey: 'fa',
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
          version: '4.3.0',
          eyebrowKey: 'e',
          headlineKey: 'h',
          introKey: 'i',
          featuresLabelKey: 'fl',
          features: [],
          supportLeadKey: 'slead',
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
