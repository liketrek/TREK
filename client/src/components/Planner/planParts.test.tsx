// FE-PLANNER-PLANPARTS-001 to FE-PLANNER-PLANPARTS-012
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { Pencil, Trash2 } from 'lucide-react';
import { BarButton, MoreButton, PANEL_BAR, SoftPill, TimePill, WhiteBadge, tintOf } from './planParts';

describe('BarButton', () => {
  it('FE-PLANNER-PLANPARTS-001: is a button named by its label that runs its action', async () => {
    const onClick = vi.fn();
    render(<BarButton label="Undo" onClick={onClick}><span>icon</span></BarButton>);
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-PLANPARTS-002: carries its pressed, expanded and popup states', () => {
    render(
      <BarButton label="Filter" onClick={vi.fn()} active ariaPressed ariaExpanded={false} ariaHaspopup="menu" className="extra">
        <span>icon</span>
      </BarButton>,
    );
    const button = screen.getByRole('button', { name: 'Filter' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button.className).toContain('extra');
  });

  it('FE-PLANNER-PLANPARTS-003: a disabled one does nothing', async () => {
    const onClick = vi.fn();
    render(<BarButton label="Optimize" onClick={onClick} disabled placement="top"><span>icon</span></BarButton>);
    const button = screen.getByRole('button', { name: 'Optimize' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLANPARTS-004: shows its label as a tooltip on hover', async () => {
    render(<BarButton label="Export" onClick={vi.fn()}><span>icon</span></BarButton>);
    await userEvent.hover(screen.getByRole('button', { name: 'Export' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Export');
  });
});

describe('MoreButton', () => {
  it('FE-PLANNER-PLANPARTS-005: opens the row\'s actions as a menu and runs the picked one', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <MoreButton label="More actions" items={[
        { label: 'Edit', icon: Pencil, onClick: onEdit },
        false,
        null,
        { divider: true },
        { label: 'Delete', icon: Trash2, onClick: onDelete, danger: true },
      ]} />,
    );
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    fireEvent.click(trigger);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  });

  it('FE-PLANNER-PLANPARTS-006: nothing but dividers or hidden entries renders nothing', () => {
    const { container } = render(<MoreButton label="More" items={[{ divider: true }, false, undefined]} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
  });

  it('FE-PLANNER-PLANPARTS-007: stays visible when asked to, and takes a custom size', () => {
    render(<MoreButton label="More" alwaysVisible size={32} className="own" items={[{ label: 'Rename', onClick: vi.fn() }]} />);
    const trigger = screen.getByRole('button', { name: 'More' });
    expect(trigger.className).toContain('opacity-100');
    expect(trigger.className).toContain('own');
    expect(trigger.style.width).toBe('32px');
    expect(trigger.style.height).toBe('32px');
  });

  it('FE-PLANNER-PLANPARTS-008: stays quiet at rest until its row is hovered', () => {
    render(<MoreButton label="More" items={[{ label: 'Rename', onClick: vi.fn() }]} />);
    expect(screen.getByRole('button', { name: 'More' }).className).toContain('opacity-0');
  });
});

describe('badges and pills', () => {
  it('FE-PLANNER-PLANPARTS-009: WhiteBadge and TimePill show their content with an optional icon', () => {
    render(
      <>
        <WhiteBadge icon={<span data-testid="badge-icon" />} className="mine">Check-in</WhiteBadge>
        <TimePill className="time">10:00</TimePill>
      </>,
    );
    expect(screen.getByText('Check-in').className).toContain('mine');
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
    const time = screen.getByText('10:00');
    expect(time.className).toContain('time');
    expect(time.querySelector('svg')).not.toBeNull();
  });

  it('FE-PLANNER-PLANPARTS-010: SoftPill colours its words by tone and can set them in capitals', () => {
    render(
      <>
        <SoftPill>Plain</SoftPill>
        <SoftPill tone="success">Confirmed</SoftPill>
        <SoftPill tone="warning">Pending</SoftPill>
        <SoftPill tone="danger">Cancelled</SoftPill>
        <SoftPill tone="info">Info</SoftPill>
        <SoftPill tone="accent" caps icon={<span data-testid="pill-icon" />} className="x">Start</SoftPill>
      </>,
    );
    expect(screen.getByText('Plain').className).toContain('text-content-secondary');
    expect(screen.getByText('Confirmed').className).toContain('text-success');
    expect(screen.getByText('Pending').className).toContain('text-warning');
    expect(screen.getByText('Cancelled').className).toContain('text-danger');
    expect(screen.getByText('Info').className).toContain('text-info');
    const start = screen.getByText('Start');
    expect(start.className).toContain('bg-accent');
    expect(start.className).toContain('uppercase');
    expect(start.className).toContain('x');
    expect(screen.getByTestId('pill-icon')).toBeInTheDocument();
    expect(screen.getByText('Plain').className).not.toContain('uppercase');
  });

  it('FE-PLANNER-PLANPARTS-011: tintOf mixes a colour into transparency', () => {
    expect(tintOf('#ff0000')).toBe('color-mix(in srgb, #ff0000 11%, transparent)');
    expect(tintOf('var(--accent)', 20)).toBe('color-mix(in srgb, var(--accent) 20%, transparent)');
  });

  it('FE-PLANNER-PLANPARTS-012: the panel bar is a band with a hairline under it', () => {
    expect(PANEL_BAR).toContain('border-b');
  });
});
