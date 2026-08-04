// FE-MOB-SETUI-001 to FE-MOB-SETUI-019
import { describe, it, expect, vi } from 'vitest';
import { Globe } from 'lucide-react';
import { render, screen, fireEvent } from '../../../helpers/render';
import {
  MSetCard,
  MSetEyebrow,
  MSetSelectRow,
  MSetSegments,
  MSetOnOff,
  MSetRow,
  MSetInput,
  MSetTextarea,
  MSetButton,
  MSetHint,
} from '../../../../src/mobile/screens/settings/MSettingsUi';

describe('MSetCard', () => {
  it('FE-MOB-SETUI-001: renders the title row with a 16px icon and the children below', () => {
    const { container } = render(
      <MSetCard title="Language & region" icon={Globe}>
        <p>card body</p>
      </MSetCard>,
    );

    expect(screen.getByText('Language & region')).toBeInTheDocument();
    expect(screen.getByText('card body')).toBeInTheDocument();
    const icon = container.querySelector('svg');
    expect(icon).toHaveAttribute('width', '16');
  });

  it('FE-MOB-SETUI-002: renders the trailing badge slot and keeps the extra class on the section', () => {
    const { container } = render(
      <MSetCard title="Addons" icon={Globe} badge={<span>3</span>} className="mt-3">
        <p>body</p>
      </MSetCard>,
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(container.querySelector('section')).toHaveClass('mt-3');
  });
});

describe('MSetEyebrow', () => {
  it('FE-MOB-SETUI-003: renders its label and merges the caller class', () => {
    const { container } = render(<MSetEyebrow className="mb-1">Currency</MSetEyebrow>);

    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('mb-1');
  });
});

describe('MSetSelectRow', () => {
  it('FE-MOB-SETUI-004: shows label plus trailing value and reports the tap', () => {
    const onClick = vi.fn();
    render(<MSetSelectRow label="Language" trailing={<span>English</span>} onClick={onClick} />);

    const row = screen.getByRole('button', { name: /Language/ });
    expect(row).toHaveTextContent('English');
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SETUI-005: is a plain type=button so it never submits a surrounding form', () => {
    render(<MSetSelectRow label="Timezone" />);

    const row = screen.getByRole('button', { name: 'Timezone' });
    expect(row).toHaveAttribute('type', 'button');
    fireEvent.click(row);
    expect(row).toBeInTheDocument();
  });
});

describe('MSetSegments', () => {
  const options = [
    { value: 'celsius', label: '°C' },
    { value: 'fahrenheit', label: '°F' },
  ];

  it('FE-MOB-SETUI-006: marks only the current value as pressed', () => {
    render(<MSetSegments options={options} value="fahrenheit" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-MOB-SETUI-007: reports the tapped option value', () => {
    const onChange = vi.fn();
    render(<MSetSegments options={options} value="fahrenheit" onChange={onChange} className="mt-2" />);

    fireEvent.click(screen.getByRole('button', { name: '°C' }));
    expect(onChange).toHaveBeenCalledWith('celsius');
  });
});

describe('MSetOnOff', () => {
  it('FE-MOB-SETUI-008: exposes both segments under the group label with the current state pressed', () => {
    render(<MSetOnOff on onChange={vi.fn()} onLabel="On" offLabel="Off" ariaLabel="Show traffic" />);

    const group = screen.getByRole('group', { name: 'Show traffic' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'On' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-MOB-SETUI-009: reports true from the On segment and false from the Off segment', () => {
    const onChange = vi.fn();
    render(<MSetOnOff on={false} onChange={onChange} onLabel="On" offLabel="Off" />);

    fireEvent.click(screen.getByRole('button', { name: 'On' }));
    expect(onChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Off' }));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});

describe('MSetRow', () => {
  it('FE-MOB-SETUI-010: renders label, sub line and the trailing control', () => {
    render(<MSetRow label="Distance" sub="Kilometres or miles" trailing={<button type="button">km</button>} />);

    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Kilometres or miles')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'km' })).toBeInTheDocument();
  });

  it('FE-MOB-SETUI-011: only rows after the first carry the divider', () => {
    const { container: first } = render(<MSetRow label="First" first />);
    expect(first.firstElementChild).not.toHaveClass('border-t');

    const { container: second } = render(<MSetRow label="Second" />);
    expect(second.firstElementChild).toHaveClass('border-t');
    // Without a sub prop the row stays a single line of text.
    expect(second.textContent).toBe('Second');
  });
});

describe('MSetInput / MSetTextarea', () => {
  it('FE-MOB-SETUI-012: forwards type, placeholder and change events', () => {
    const onChange = vi.fn();
    render(<MSetInput type="email" placeholder="Email" value="a@b.c" onChange={onChange} />);

    const input = screen.getByPlaceholderText('Email') as HTMLInputElement;
    expect(input.type).toBe('email');
    expect(input.value).toBe('a@b.c');

    fireEvent.change(input, { target: { value: 'x@y.z' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SETUI-013: mono switches the face and the mono flag never leaks into the DOM', () => {
    render(<MSetInput mono readOnly value="ABC123" className="mt-2" aria-label="Secret" />);

    const input = screen.getByLabelText('Secret');
    expect(input).toHaveClass('font-mono', 'mt-2');
    expect(input).not.toHaveAttribute('mono');
  });

  it('FE-MOB-SETUI-014: the textarea forwards rows, value and change events', () => {
    const onChange = vi.fn();
    render(<MSetTextarea rows={4} value="notes" onChange={onChange} aria-label="Notes" className="mt-2" />);

    const area = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    expect(area.rows).toBe(4);
    expect(area.value).toBe('notes');
    expect(area).toHaveClass('mt-2');

    fireEvent.change(area, { target: { value: 'more' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('MSetButton', () => {
  it('FE-MOB-SETUI-015: the primary variant is the accent-filled pill', () => {
    render(<MSetButton onClick={vi.fn()}>Save</MSetButton>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('bg-m-act', 'text-m-actfg');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('FE-MOB-SETUI-016: the danger variant uses the danger ink, ghost stays neutral', () => {
    render(
      <>
        <MSetButton variant="danger">Delete</MSetButton>
        <MSetButton variant="ghost">Cancel</MSetButton>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('text-[color:var(--m-st-danger)]');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('text-m-ink');
  });

  it('FE-MOB-SETUI-017: a click reaches onClick', () => {
    const onClick = vi.fn();
    render(<MSetButton onClick={onClick} className="mt-3">Update</MSetButton>);

    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-SETUI-018: a disabled button swallows the click', () => {
    const onClick = vi.fn();
    render(<MSetButton onClick={onClick} disabled>Update</MSetButton>);

    const button = screen.getByRole('button', { name: 'Update' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('MSetHint', () => {
  it('FE-MOB-SETUI-019: renders the hint text with the caller class', () => {
    const { container } = render(<MSetHint className="mb-2">Stored encrypted.</MSetHint>);

    expect(screen.getByText('Stored encrypted.')).toBeInTheDocument();
    expect(container.querySelector('p')).toHaveClass('mb-2');
  });
});
