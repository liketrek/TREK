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
