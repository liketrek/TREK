import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import FoldSummary from './FoldSummary';

describe('FoldSummary', () => {
  it('heads the fold with a turning chevron and its own label', () => {
    const { container } = render(
      <details className="group">
        <FoldSummary>
          <span>More</span>
        </FoldSummary>
        <p>inside</p>
      </details>
    );
    const summary = container.querySelector('summary') as HTMLElement;
    expect(summary).toContainElement(screen.getByText('More'));
    const chevron = summary.querySelector('svg') as SVGElement;
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
    expect(chevron.getAttribute('class')).toContain('group-open:rotate-90');
    expect(summary.firstElementChild).toBe(chevron);
  });

  it('opens and closes the fold it heads', () => {
    const { container } = render(
      <details className="group">
        <FoldSummary>More</FoldSummary>
        <p>inside</p>
      </details>
    );
    const details = container.querySelector('details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    fireEvent.click(container.querySelector('summary') as HTMLElement);
    expect(details.open).toBe(true);
  });
});
