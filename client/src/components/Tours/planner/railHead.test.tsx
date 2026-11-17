import { describe, expect, it } from 'vitest';
import { render, screen } from '../../../../tests/helpers/render';
import { FloatingRailHeads, RAIL_HEAD, useRailHeadProps } from './railHead';

function Head() {
  return <div data-testid="head" {...useRailHeadProps()} />;
}

describe('rail heads', () => {
  it('FE-TOUR-RAILHEAD-001: a ruled, tinted strip on the desktop, a rounded card-like band in the touch tab', () => {
    const { unmount } = render(<Head />);
    expect(screen.getByTestId('head').className).toBe(RAIL_HEAD);
    expect(screen.getByTestId('head').getAttribute('style')).toContain('background');
    unmount();

    render(
      <FloatingRailHeads value>
        <Head />
      </FloatingRailHeads>
    );
    const head = screen.getByTestId('head');
    expect(head.className).toContain('rounded-2xl');
    expect(head.className).not.toContain('border-b');
    expect(head.getAttribute('style')).toBeNull();
  });

  it('FE-TOUR-RAILHEAD-002: a head of buttons only stands without a band in the touch tab, and keeps its strip on the desktop', () => {
    function Bare() {
      return <div data-testid="bare" {...useRailHeadProps({ bare: true })} />;
    }
    const { unmount } = render(<Bare />);
    expect(screen.getByTestId('bare').className).toBe(RAIL_HEAD);
    unmount();
    render(
      <FloatingRailHeads value>
        <Bare />
      </FloatingRailHeads>
    );
    const bare = screen.getByTestId('bare');
    expect(bare.className).not.toMatch(/border|rounded|bg-/);
    expect(bare.getAttribute('style')).toBeNull();
  });
});
