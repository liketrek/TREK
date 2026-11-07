import { isNativeApp } from '../native/platform';

/** Where the project takes donations. */
const DONATION_HOSTS = ['ko-fi.com', 'buymeacoffee.com'];

/** Whether `href` points at one of the project's donation pages. */
export function isDonationLink(href: string | undefined): boolean {
  if (!href) return false;
  let host: string;
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return false;
  }
  return DONATION_HOSTS.some((d) => host === d || host.endsWith(`.${d}`));
}

/**
 * Whether the donation links may show. Not inside the iOS and Android apps:
 * the store rules on payments (Apple 3.1.1, Google Play's Payments policy)
 * allow no link to an outside payment page there. A browser keeps them.
 */
export function donationsShown(): boolean {
  return !isNativeApp();
}

/** `links` without the donation pages inside the native apps, unchanged anywhere else. */
export function withoutDonationsInApp<T extends { href: string }>(links: T[]): T[] {
  return donationsShown() ? links : links.filter((link) => !isDonationLink(link.href));
}

/** A notice button: a link or a navigation carries an href, an action does not. */
type NoticeButton = { kind: string; href?: string } | null | undefined;

/** Whether a system notice asks for a donation through one of its buttons. */
export function noticeAsksForDonation(notice: { cta?: NoticeButton; secondaryCta?: NoticeButton }): boolean {
  return isDonationLink(notice.cta?.href) || isDonationLink(notice.secondaryCta?.href);
}
