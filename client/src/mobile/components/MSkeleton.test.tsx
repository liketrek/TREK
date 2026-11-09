import { describe, expect, it } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import MSkeleton from './MSkeleton';

describe('MSkeleton', () => {
  it('FE-MOB-SKELETON-001: is announced once as loading, its shapes hidden from a screen reader', () => {
    render(<MSkeleton variant="rows" count={3} />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-label')).toBeTruthy();
    const shapes = status.firstElementChild as HTMLElement;
    expect(shapes.getAttribute('aria-hidden')).toBe('true');
    expect(shapes.children).toHaveLength(3);
  });

  it('FE-MOB-SKELETON-002: rows inside a card drop their own frame', () => {
    render(<MSkeleton variant="rows" count={2} framed={false} />);
    const first = screen.getByRole('status').firstElementChild?.firstElementChild as HTMLElement;
    expect(first.className).not.toContain('rounded-[14px]');
    expect(first.className).toContain('border-b');
  });

  it('FE-MOB-SKELETON-003: does not pulse with reduced motion', () => {
    render(<MSkeleton variant="cards" count={1} />);
    expect(screen.getByRole('status').className).toContain('motion-reduce:animate-none');
  });
});
