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
});
