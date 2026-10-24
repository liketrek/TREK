import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { StationDialog } from './StationDialog';
import { stationMarkNote, stationRingClass } from './stationMarks';
import { StationPills, StationShield } from './stationParts';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

const cathedral: TourPlannerWaypoint = {
  id: 'p1',
  lat: 48.1,
  lng: 11.5,
  role: 'via',
  key: 'stop-cathedral',
  name: 'Cathedral',
  stayMinutes: 30,
  importance: 'must',
  protected: true,
  openingHours: 'Mo-Su 09:00-18:00',
};

function open(point: TourPlannerWaypoint, fallbackName?: string) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(<StationDialog point={point} fallbackName={fallbackName} onSave={onSave} onClose={onClose} />);
  return { onSave, onClose };
}

const stayField = () => screen.getByLabelText('Stay in minutes');
const nameField = () => screen.getByLabelText('Label');

describe('StationDialog (CW-02, CW-03, CW-10)', () => {
  it('starts from the station as it is: its name, stay, importance and protection', () => {
    open(cathedral);
    expect(screen.getByTestId('station-dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cathedral' })).toBeInTheDocument();
    expect(nameField()).toHaveValue('Cathedral');
    expect(stayField()).toHaveValue('30');
    expect(screen.getByRole('button', { name: 'Must see' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Protected' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('A change proposed later keeps it in the walk.')).toBeInTheDocument();
  });

  it('names a station without a name by the row it stands in, or as unnamed', () => {
    open({ id: 'p2', lat: 48.11, lng: 11.51, role: 'via' }, 'Stop 2');
    expect(screen.getByRole('heading', { name: 'Stop 2' })).toBeInTheDocument();
    expect(nameField()).toHaveAttribute('placeholder', 'Stop 2');
    expect(stayField()).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Regular' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Protected' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.change(nameField(), { target: { value: 'Fountain' } });
    expect(screen.getByRole('heading', { name: 'Fountain' })).toBeInTheDocument();
  });

  it('calls a station without a name and without a row name an unnamed stop', () => {
    open({ id: 'p3', lat: 48.12, lng: 11.52, role: 'end' });
    expect(screen.getByRole('heading', { name: 'Unnamed stop' })).toBeInTheDocument();
    expect(nameField()).toHaveAttribute('placeholder', 'What is here');
  });

  it('takes whole minutes up to a day only, and says so', () => {
    const { onSave } = open(cathedral);
    for (const typed of ['abc', '2000', '12.5', '-3']) {
      fireEvent.change(stayField(), { target: { value: typed } });
      expect(screen.getByText('Enter whole minutes, up to a day.')).toBeInTheDocument();
      expect(screen.getByTestId('station-save')).toBeDisabled();
    }
    fireEvent.submit(screen.getByTestId('station-dialog').closest('form') as HTMLFormElement);
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(stayField(), { target: { value: '1440' } });
    expect(screen.queryByText('Enter whole minutes, up to a day.')).not.toBeInTheDocument();
    expect(screen.getByText('Empty means not known yet; 0 for a point you only pass.')).toBeInTheDocument();
    expect(screen.getByTestId('station-save')).toBeEnabled();
    // A submit of the form saves too, and keeps the page where it is.
    const submitted = fireEvent.submit(screen.getByTestId('station-dialog').closest('form') as HTMLFormElement);
    expect(submitted).toBe(false);
    expect(onSave).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ key: 'stop-cathedral', stayMinutes: 1440 })
    );
  });

  it('saves the edited station with its key and opening hours, a stay left empty as not known', () => {
    const { onSave, onClose } = open(cathedral);
    fireEvent.change(nameField(), { target: { value: '  Old cathedral  ' } });
    fireEvent.change(stayField(), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Optional' }));
    expect(screen.getByText('Can be left out when time runs short.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Protected' }));
    fireEvent.click(screen.getByTestId('station-save'));
    expect(onSave).toHaveBeenCalledExactlyOnceWith({
      id: 'p1',
      lat: 48.1,
      lng: 11.5,
      role: 'via',
      key: 'stop-cathedral',
      openingHours: 'Mo-Su 09:00-18:00',
      name: 'Old cathedral',
      importance: 'optional',
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('saves 0 as a point passed through, and normal importance and a blank name as none', () => {
    const { onSave } = open(cathedral);
    fireEvent.change(nameField(), { target: { value: '   ' } });
    fireEvent.change(stayField(), { target: { value: ' 0 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Regular' }));
    expect(screen.getByText('Visited as the walk goes.')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('station-save'));
    expect(onSave).toHaveBeenCalledExactlyOnceWith({
      id: 'p1',
      lat: 48.1,
      lng: 11.5,
      role: 'via',
      key: 'stop-cathedral',
      openingHours: 'Mo-Su 09:00-18:00',
      stayMinutes: 0,
      protected: true,
    });
  });

  it('cancelling closes the dialog and saves nothing', () => {
    const { onSave, onClose } = open(cathedral);
    fireEvent.change(nameField(), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('StationPills (CW-02)', () => {
  const pills = (point: Partial<TourPlannerWaypoint>) =>
    render(<StationPills point={{ id: 'p', lat: 0, lng: 0, role: 'via', ...point }} />);

  it('says nothing of a stay nobody entered', () => {
    pills({ importance: 'must', protected: true });
    expect(screen.queryByTestId('station-pills')).not.toBeInTheDocument();
  });

  it('names a point passed through, and a stay entered as its time alone', () => {
    pills({ stayMinutes: 0 });
    expect(screen.getByTestId('station-pills')).toHaveTextContent('Passing through');
  });

  it('shows the stay and nothing of the importance or the protection, which are on the number', () => {
    pills({ stayMinutes: 45, importance: 'must', protected: true });
    const row = screen.getByTestId('station-pills');
    expect(row).toHaveTextContent('45');
    expect(row).not.toHaveTextContent('Must see');
    expect(row).not.toHaveTextContent('Protected');
  });
});

describe("a station's marks on its number (CW-03, CW-10)", () => {
  const t = (key: string) =>
    ({
      'tours.walk.importance.must': 'Must see',
      'tours.walk.importance.optional': 'Optional',
      'tours.walk.station.protected': 'Protected',
    })[key] ?? key;

  it('rings a must-see in full, an optional stop dashed, and a normal one not at all', () => {
    expect(stationRingClass('must')).toContain('outline-warning');
    expect(stationRingClass('optional')).toContain('outline-dashed');
    expect(stationRingClass(null)).toBe('');
    expect(stationRingClass(undefined)).toBe('');
  });

  it('names the importance and the protection for the label, and nothing for a plain station', () => {
    expect(stationMarkNote({ importance: 'must', protected: true }, t)).toBe('Must see, Protected');
    expect(stationMarkNote({ importance: 'optional' }, t)).toBe('Optional');
    expect(stationMarkNote({ protected: true }, t)).toBe('Protected');
    expect(stationMarkNote({}, t)).toBeNull();
  });

  it('draws a protection as a shield at the corner of the number', () => {
    const { container } = render(<StationShield />);
    expect(container.querySelector('[data-station-protected="true"]')).toBeInTheDocument();
  });
});
