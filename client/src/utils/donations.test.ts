import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isNativeApp } from '../native/platform';
import { donationsShown, isDonationLink, noticeAsksForDonation, withoutDonationsInApp } from './donations';

vi.mock('../native/platform', () => ({ isNativeApp: vi.fn() }));

const links = [{ href: 'https://ko-fi.com/mauriceboe' }, { href: 'https://discord.gg/x' }];

beforeEach(() => {
  vi.mocked(isNativeApp).mockReturnValue(false);
});

describe('isDonationLink', () => {
  it('knows the donation pages, their subdomains too', () => {
    expect(isDonationLink('https://ko-fi.com/mauriceboe')).toBe(true);
    expect(isDonationLink('https://www.BuyMeACoffee.com/mauriceboe')).toBe(true);
  });

  it('is false for anything else, a missing href or one that is no URL', () => {
    expect(isDonationLink('https://github.com/liketrek/TREK')).toBe(false);
    expect(isDonationLink('https://notko-fi.com/x')).toBe(false);
    expect(isDonationLink(undefined)).toBe(false);
    expect(isDonationLink('not a url')).toBe(false);
  });
});

describe('in a browser', () => {
  it('keeps every link and every notice', () => {
    expect(donationsShown()).toBe(true);
    expect(withoutDonationsInApp(links)).toEqual(links);
  });
});

describe('in the native app', () => {
  it('drops the donation links', () => {
    vi.mocked(isNativeApp).mockReturnValue(true);
    expect(donationsShown()).toBe(false);
    expect(withoutDonationsInApp(links)).toEqual([{ href: 'https://discord.gg/x' }]);
  });
});

describe('noticeAsksForDonation', () => {
  it('looks at both buttons', () => {
    expect(noticeAsksForDonation({ cta: { kind: 'link', href: 'https://ko-fi.com/x' } })).toBe(true);
    expect(noticeAsksForDonation({ secondaryCta: { kind: 'link', href: 'https://buymeacoffee.com/x' } })).toBe(true);
    expect(noticeAsksForDonation({ cta: { kind: 'nav', href: '/settings' }, secondaryCta: null })).toBe(false);
    expect(noticeAsksForDonation({ cta: { kind: 'action' } })).toBe(false);
    expect(noticeAsksForDonation({})).toBe(false);
  });
});
