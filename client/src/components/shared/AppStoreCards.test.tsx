// FE-APPSTORE-001 to FE-APPSTORE-003
import { describe, expect, it } from 'vitest';
import { render } from '../../../tests/helpers/render';
import AppStoreCards from './AppStoreCards';

describe('AppStoreCards', () => {
  it('FE-APPSTORE-001: links both stores in a new tab, each with its QR code', () => {
    render(<AppStoreCards />);
    const cards = [...document.querySelectorAll<HTMLAnchorElement>('a.asc-card')];
    expect(cards.map((a) => a.href)).toEqual([
      'https://apps.apple.com/app/id6831237775',
      'https://play.google.com/store/apps/details?id=com.liketrek.trek',
    ]);
    for (const a of cards) {
      expect(a).toHaveAttribute('target', '_blank');
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      expect(a.querySelector('.asc-qr path')?.getAttribute('d')).toMatch(/^M0 0\.5h7/);
    }
  });

  it('FE-APPSTORE-002: names each store and translates the lines around it', () => {
    render(<AppStoreCards />);
    const [ios, android] = document.querySelectorAll('a.asc-card');
    expect(ios).toHaveTextContent('Download on the');
    expect(ios).toHaveTextContent('App Store');
    expect(ios).toHaveTextContent('iPhone and iPad');
    expect(android).toHaveTextContent('Get it on');
    expect(android).toHaveTextContent('Google Play');
    expect(android).toHaveTextContent('Phone and tablet');
  });

  it('FE-APPSTORE-003: the dark tone marks the row, the theme tone does not', () => {
    const { unmount } = render(<AppStoreCards tone="dark" className="x" />);
    expect(document.querySelector('.asc-row')).toHaveClass('asc-dark', 'x');
    unmount();
    render(<AppStoreCards />);
    expect(document.querySelector('.asc-row')).not.toHaveClass('asc-dark');
  });
});
