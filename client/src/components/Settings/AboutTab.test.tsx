import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import AboutTab from './AboutTab';

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
});

describe('AboutTab', () => {
  it('FE-COMP-ABOUT-001: renders without crashing', () => {
    render(<AboutTab appVersion="2.9.10" />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-ABOUT-002: displays the version badge', () => {
    render(<AboutTab appVersion="2.9.10" />);
    expect(screen.getByText('v2.9.10')).toBeInTheDocument();
  });

  it('FE-COMP-ABOUT-003: displays Ko-fi link with correct href', () => {
    render(<AboutTab appVersion="2.9.10" />);
    const link = screen.getByText('Ko-fi').closest('a');
    expect(link).toHaveAttribute('href', 'https://ko-fi.com/mauriceboe');
  });

  it('FE-COMP-ABOUT-004: displays Buy Me a Coffee link with correct href', () => {
    render(<AboutTab appVersion="2.9.10" />);
    const link = screen.getByText('Buy Me a Coffee').closest('a');
    expect(link).toHaveAttribute('href', 'https://buymeacoffee.com/mauriceboe');
  });

  it('FE-COMP-ABOUT-005: displays Discord link with correct href', () => {
    render(<AboutTab appVersion="2.9.10" />);
    const link = screen.getByText('Discord').closest('a');
    expect(link).toHaveAttribute('href', 'https://discord.gg/NhZBDSd4qW');
  });

  it('FE-COMP-ABOUT-006: displays bug report link', () => {
    render(<AboutTab appVersion="2.9.10" />);
    const link = document.querySelector('a[href*="issues/new"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/liketrek/TREK/issues/new?template=bug_report.yml');
  });

  it('FE-COMP-ABOUT-007: displays feature request link', () => {
    render(<AboutTab appVersion="2.9.10" />);
    const link = document.querySelector('a[href*="discussions/new"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('FE-COMP-ABOUT-008: displays wiki link', () => {
    render(<AboutTab appVersion="2.9.10" />);
    const link = document.querySelector('a[href*="wiki"]');
    expect(link).toBeInTheDocument();
  });

  it('FE-COMP-ABOUT-009: all external links have rel="noopener noreferrer"', () => {
    render(<AboutTab appVersion="2.9.10" />);
    const links = document.querySelectorAll('a');
    expect(links).toHaveLength(6);
    links.forEach((link) => {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('FE-COMP-ABOUT-010: all external links open in a new tab', () => {
    render(<AboutTab appVersion="2.9.10" />);
    const links = document.querySelectorAll('a');
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  it('FE-COMP-ABOUT-011: version prop change is reflected', () => {
    render(<AboutTab appVersion="1.0.0" />);
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.queryByText('v2.9.10')).toBeNull();
  });

  // The hover look lives in Tailwind classes driven by the tile's `--tile`
  // colour now, so the tests pin the colour each tile hands its classes.
  const tile = (link: HTMLAnchorElement) => ({
    color: link.style.getPropertyValue('--tile'),
    hovers: link.className.includes('hover:border-[color:var(--tile)]'),
  });

  it('FE-COMP-ABOUT-012: the Ko-fi tile carries its brand colour for the hover border', () => {
    render(<AboutTab appVersion="1.0.0" />);
    const link = screen.getByText('Ko-fi').closest('a') as HTMLAnchorElement;
    expect(link).toHaveAttribute('href', 'https://ko-fi.com/mauriceboe');
    expect(tile(link)).toEqual({ color: '#ff5e5b', hovers: true });
  });

  it('FE-COMP-ABOUT-013: the Buy Me a Coffee tile carries its brand colour for the hover border', () => {
    render(<AboutTab appVersion="1.0.0" />);
    const link = screen.getByText('Buy Me a Coffee').closest('a') as HTMLAnchorElement;
    expect(link).toHaveAttribute('href', 'https://buymeacoffee.com/mauriceboe');
    expect(tile(link)).toEqual({ color: '#ffdd00', hovers: true });
  });

  it('FE-COMP-ABOUT-014: the Discord tile carries its brand colour for the hover border', () => {
    render(<AboutTab appVersion="1.0.0" />);
    const link = screen.getByText('Discord').closest('a') as HTMLAnchorElement;
    expect(link).toHaveAttribute('href', 'https://discord.gg/NhZBDSd4qW');
    expect(tile(link)).toEqual({ color: '#5865F2', hovers: true });
  });

  it('FE-COMP-ABOUT-015: the bug report tile uses the danger token', () => {
    render(<AboutTab appVersion="1.0.0" />);
    const link = document.querySelector('a[href*="issues/new"]') as HTMLAnchorElement;
    expect(link).toHaveAttribute('target', '_blank');
    expect(tile(link)).toEqual({ color: 'var(--danger)', hovers: true });
  });

  it('FE-COMP-ABOUT-016: the feature request tile uses the warning token', () => {
    render(<AboutTab appVersion="1.0.0" />);
    const link = document.querySelector('a[href*="discussions/new"]') as HTMLAnchorElement;
    expect(link).toHaveAttribute('target', '_blank');
    expect(tile(link)).toEqual({ color: 'var(--warning)', hovers: true });
  });

  it('FE-COMP-ABOUT-017: the wiki tile uses the info token and no inline hover styles are left', () => {
    render(<AboutTab appVersion="1.0.0" />);
    const link = document.querySelector('a[href*="wiki"]') as HTMLAnchorElement;
    expect(tile(link)).toEqual({ color: 'var(--info)', hovers: true });
    fireEvent.mouseEnter(link);
    expect(link.style.borderColor).toBe('');
    expect(link.style.boxShadow).toBe('');
  });
});
