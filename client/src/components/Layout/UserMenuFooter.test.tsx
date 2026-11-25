// FE-MENUFOOT-001 to FE-MENUFOOT-004
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { isNativeApp } from '../../native/platform';
import UserMenuFooter from './UserMenuFooter';

vi.mock('../../native/platform', () => ({ isNativeApp: vi.fn(() => false) }));

function titles(): string[] {
  return [...document.querySelectorAll('a[title]')].map((a) => a.getAttribute('title') ?? '');
}

describe('UserMenuFooter', () => {
  it('FE-MENUFOOT-001: shows the version and the three support links beside Discord', () => {
    render(<UserMenuFooter appVersion="5.2.1" dark={false} managed={false} />);
    expect(screen.getByText('v5.2.1')).toBeInTheDocument();
    expect(document.querySelector('img[src="/text-dark.svg"]')).not.toBeNull();
    expect(titles()).toEqual(['Patreon', 'Ko-fi', 'Buy Me a Coffee', 'Discord']);
    expect(screen.getByTitle('Ko-fi')).toHaveAttribute('href', 'https://ko-fi.com/mauriceboe');
    expect(screen.getByTitle('Buy Me a Coffee')).toHaveAttribute('href', 'https://buymeacoffee.com/mauriceboe');
    expect(screen.getByTitle('Patreon')).toHaveAttribute('href', 'https://www.patreon.com/cw/mauriceboe');
  });

  it('FE-MENUFOOT-002: a managed install keeps only Discord', () => {
    render(<UserMenuFooter appVersion="5.2.1" dark managed />);
    expect(titles()).toEqual(['Discord']);
    expect(document.querySelector('img[src="/text-light.svg"]')).not.toBeNull();
  });

  it('FE-MENUFOOT-003: the native app shows no donation link', () => {
    vi.mocked(isNativeApp).mockReturnValueOnce(true);
    render(<UserMenuFooter appVersion="5.2.1" dark={false} managed={false} />);
    expect(titles()).toEqual(['Discord']);
  });

  it('FE-MENUFOOT-004: hovering a link washes it in its brand colour and leaving clears it', () => {
    render(<UserMenuFooter appVersion="5.2.1" dark={false} managed={false} />);
    const kofi = screen.getByTitle('Ko-fi');
    fireEvent.mouseEnter(kofi);
    expect(kofi.style.background).toBe('rgba(255, 94, 91, 0.15)');
    fireEvent.mouseLeave(kofi);
    expect(kofi.style.background).toBe('');
  });
});
