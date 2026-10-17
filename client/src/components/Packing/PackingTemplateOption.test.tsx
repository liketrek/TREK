import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { PackingTemplateOption } from './PackingTemplateOption';

const t = (key: string, params?: Record<string, string | number | null>) =>
  key === 'admin.packingTemplates.items' ? `items(${params?.count})` : key;

describe('PackingTemplateOption', () => {
  it('shows the template name over its item count', () => {
    render(<PackingTemplateOption name="Beach" itemCount={12} onClick={vi.fn()} t={t} />);
    expect(screen.getByText('Beach')).toBeInTheDocument();
    expect(screen.getByText('12 items(12)')).toBeInTheDocument();
  });

  it('applies the template on click', () => {
    const onClick = vi.fn();
    render(<PackingTemplateOption name="Beach" itemCount={3} onClick={onClick} t={t} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('tints the row while hovered and clears it on leave', () => {
    render(<PackingTemplateOption name="Beach" itemCount={3} onClick={vi.fn()} t={t} />);
    const row = screen.getByRole('button');
    fireEvent.mouseEnter(row);
    expect(row.style.background).toBe('var(--bg-tertiary)');
    fireEvent.mouseLeave(row);
    expect(row.style.background).toBe('transparent');
  });

  it('fades the hover only when asked', () => {
    const { unmount } = render(<PackingTemplateOption name="A" itemCount={1} onClick={vi.fn()} t={t} />);
    expect(screen.getByRole('button').style.transition).toBe('');
    unmount();
    render(<PackingTemplateOption name="A" itemCount={1} onClick={vi.fn()} t={t} fade />);
    expect(screen.getByRole('button').style.transition).toBe('background 0.1s');
  });
});
