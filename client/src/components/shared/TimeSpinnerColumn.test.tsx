import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { TimeSpinnerColumn } from './TimeSpinnerColumn';
import { spinnerButtonStyle } from './timeSpinnerStyle';

describe('TimeSpinnerColumn', () => {
  function renderColumn(props: Partial<Parameters<typeof TimeSpinnerColumn>[0]> = {}) {
    const onUp = vi.fn();
    const onDown = vi.fn();
    render(
      <TimeSpinnerColumn onUp={onUp} onDown={onDown} valueStyle={{ width: 44 }} {...props}>
        07
      </TimeSpinnerColumn>
    );
    const [up, down] = screen.getAllByRole('button');
    return { onUp, onDown, up, down };
  }

  it('FE-COMP-TIMESPINNER-001: shows the value between an up and a down button', () => {
    const { up, down } = renderColumn();
    expect(screen.getByText('07')).toBeInTheDocument();
    expect(up.compareDocumentPosition(screen.getByText('07')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(down.compareDocumentPosition(screen.getByText('07')) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('FE-COMP-TIMESPINNER-002: the up button steps up and the down button steps down', () => {
    const { onUp, onDown, up, down } = renderColumn();
    fireEvent.click(up);
    expect(onUp).toHaveBeenCalledTimes(1);
    expect(onDown).not.toHaveBeenCalled();
    fireEvent.click(down);
    expect(onDown).toHaveBeenCalledTimes(1);
    expect(onUp).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-TIMESPINNER-003: the buttons are plain buttons that do not submit a form', () => {
    const { up, down } = renderColumn();
    expect(up).toHaveAttribute('type', 'button');
    expect(down).toHaveAttribute('type', 'button');
  });

  it('FE-COMP-TIMESPINNER-004: a hovered button lights up and dims again when the pointer leaves', () => {
    const { up } = renderColumn();
    expect(up.style.color).toBe(spinnerButtonStyle.color);
    fireEvent.mouseEnter(up);
    expect(up.style.color).toBe('var(--text-primary)');
    fireEvent.mouseLeave(up);
    expect(up.style.color).toBe('var(--text-faint)');
  });

  it('FE-COMP-TIMESPINNER-005: the value box takes its size from valueStyle over the shared box style', () => {
    renderColumn({ valueStyle: { width: 36, height: 50 } });
    const box = screen.getByText('07');
    expect(box.style.width).toBe('36px');
    expect(box.style.height).toBe('50px');
    expect(box.style.fontWeight).toBe('700');
  });

  it('FE-COMP-TIMESPINNER-006: the column style adds to the column layout', () => {
    renderColumn({ style: { marginInlineStart: 4 } });
    const column = screen.getByText('07').parentElement as HTMLElement;
    expect(column.style.marginInlineStart).toBe('4px');
    expect(column.style.flexDirection).toBe('column');
  });
});
