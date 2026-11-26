// FE-PLANNER-DAYDETAIL-DF-001 to FE-PLANNER-DAYDETAIL-DF-002
// The day panel's heading with "date first in day headings" on (#2921).
import userEvent from '@testing-library/user-event';
import { dayDetailProps as props, resetDayDetailPanel } from '../../../tests/helpers/dayDetailPanel';
import { render, screen } from '../../../tests/helpers/render';
import { seedStore } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import DayDetailPanel from './DayDetailPanel';

function settings(dayDateFirst: boolean) {
  seedStore(useSettingsStore, {
    settings: { time_format: '24h', temperature_unit: 'celsius', day_date_first: dayDateFirst },
  });
}

beforeEach(() => {
  resetDayDetailPanel();
});

describe('DayDetailPanel with the date first', () => {
  it('FE-PLANNER-DAYDETAIL-DF-001: the pencil sits with the name, and renaming keeps the date in view', async () => {
    settings(true);
    const user = userEvent.setup();
    const onUpdateDayTitle = vi.fn();
    render(<DayDetailPanel {...props} onUpdateDayTitle={onUpdateDayTitle} />);
    const pencil = screen.getByLabelText('Edit');
    expect(screen.getByText('Day in Paris').parentElement).toContainElement(pencil);
    expect(screen.getByText(/June 15/).parentElement).not.toContainElement(pencil);
    await user.click(pencil);
    const input = await screen.findByDisplayValue('Day in Paris');
    expect(screen.getByText(/June 15/)).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, 'Vegueta');
    await user.keyboard('{Enter}');
    expect(onUpdateDayTitle).toHaveBeenCalledWith(1, 'Vegueta');
  });

  it('FE-PLANNER-DAYDETAIL-DF-002: with the name first the pencil stays on the heading, as before', async () => {
    settings(false);
    const user = userEvent.setup();
    render(<DayDetailPanel {...props} onUpdateDayTitle={vi.fn()} />);
    const pencil = screen.getByLabelText('Edit');
    expect(screen.getByText('Day in Paris').parentElement).toContainElement(pencil);
    await user.click(pencil);
    expect(await screen.findByDisplayValue('Day in Paris')).toBeInTheDocument();
    expect(screen.getByText(/June 15/)).toBeInTheDocument();
  });
});
