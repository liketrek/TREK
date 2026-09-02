// FE-COMP-POLLS-001 to FE-COMP-POLLS-015

vi.mock('../../api/websocket', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocketId: vi.fn(() => null),
  setRefetchCallback: vi.fn(),
  setPreReconnectHook: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
}));

import { render, screen, waitFor, fireEvent, act } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildTrip } from '../../../tests/helpers/factories';
import CollabPolls from './CollabPolls';
import { addListener } from '../../api/websocket';

const currentUser = buildUser({ id: 1, username: 'testuser' });

const buildPoll = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  question: 'Best destination?',
  options: [
    { id: 1, text: 'Paris', label: 'Paris', voters: [] },
    { id: 2, text: 'Rome', label: 'Rome', voters: [] },
  ],
  multiple_choice: false,
  is_closed: false,
  deadline: null,
  created_by: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});

const defaultProps = { tripId: 1, currentUser };

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  server.use(
    http.get('/api/trips/1/collab/polls', () =>
      HttpResponse.json({ polls: [] }),
    ),
  );
  seedStore(useAuthStore, { user: currentUser, isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1, user_id: 1 }) });
});

describe('CollabPolls', () => {
  it('FE-COMP-POLLS-001: renders empty state when no polls exist', async () => {
    render(<CollabPolls {...defaultProps} />);
    expect(await screen.findByText(/no polls yet|collab\.polls\.empty/i)).toBeInTheDocument();
  });

  it('FE-COMP-POLLS-002: shows loading spinner initially', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({ polls: [] });
      }),
    );
    render(<CollabPolls {...defaultProps} />);
    // The spinner is a div with animation style
    expect(
      document.querySelector('[style*="animation"]'),
    ).toBeInTheDocument();
  });

  it('FE-COMP-POLLS-003: renders poll question from API', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll()] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    expect(await screen.findByText('Best destination?')).toBeInTheDocument();
  });

  it('FE-COMP-POLLS-004: renders poll options', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll()] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Paris');
    expect(screen.getByText('Rome')).toBeInTheDocument();
  });

  it('FE-COMP-POLLS-005: New Poll button is visible when user can edit', async () => {
    render(<CollabPolls {...defaultProps} />);
    // Wait for loading to finish
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);
    expect(
      screen.getByRole('button', { name: /new/i }),
    ).toBeInTheDocument();
  });

  it('FE-COMP-POLLS-006: clicking New Poll button opens the create modal', async () => {
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);
    await user.click(screen.getByRole('button', { name: /new/i }));
    // Modal has a question placeholder input
    expect(await screen.findByPlaceholderText(/what should we do/i)).toBeInTheDocument();
  });

  it('FE-COMP-POLLS-007: create modal requires question and at least 2 options to enable submit', async () => {
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);
    await user.click(screen.getByRole('button', { name: /new/i }));

    // Find submit button - it's the form submit with the create label
    const submitBtn = screen.getByRole('button', { name: /create|collab\.polls\.create/i });
    expect(submitBtn).toBeDisabled();

    // Fill in question
    const questionInput = screen.getByPlaceholderText(/what should we do/i);
    await user.type(questionInput, 'Where to go?');

    // Still disabled — no options filled
    expect(submitBtn).toBeDisabled();

    // Fill in 2 options
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    await user.type(optionInputs[0], 'Beach');
    await user.type(optionInputs[1], 'Mountain');

    expect(submitBtn).toBeEnabled();
  });

  it('FE-COMP-POLLS-008: creating a poll calls POST API and adds it to the list', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ poll: buildPoll({ id: 99, question: 'Where to eat?' }) }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);

    await user.click(screen.getByRole('button', { name: /new/i }));
    await user.type(screen.getByPlaceholderText(/what should we do/i), 'Where to eat?');
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    await user.type(optionInputs[0], 'Italian');
    await user.type(optionInputs[1], 'Japanese');

    await user.click(screen.getByRole('button', { name: /create|collab\.polls\.create/i }));
    expect(await screen.findByText('Where to eat?')).toBeInTheDocument();
  });

  it('FE-COMP-POLLS-009: voting on an option calls POST vote API', async () => {
    let voteCalled = false;
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll()] }),
      ),
      http.post('/api/trips/1/collab/polls/1/vote', () => {
        voteCalled = true;
        return HttpResponse.json({
          poll: buildPoll({
            options: [
              { id: 1, text: 'Paris', label: 'Paris', voters: [{ user_id: 1, username: 'testuser', avatar_url: null }] },
              { id: 2, text: 'Rome', label: 'Rome', voters: [] },
            ],
          }),
        });
      }),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Paris');
    await user.click(screen.getByText('Paris'));
    await waitFor(() => expect(voteCalled).toBe(true));
  });

  it('FE-COMP-POLLS-010: closed poll shows "Closed" badge', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ is_closed: true })] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    expect(await screen.findByText(/closed/i)).toBeInTheDocument();
  });

  it('FE-COMP-POLLS-011: closed poll options are disabled (cannot vote)', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ is_closed: true })] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Paris');
    const parisBtn = screen.getByText('Paris').closest('button');
    expect(parisBtn).toBeDisabled();
  });

  it('FE-COMP-POLLS-012: delete button calls DELETE API and removes poll', async () => {
    let deleteCalled = false;
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ id: 5 })] }),
      ),
      http.delete('/api/trips/1/collab/polls/5', () => {
        deleteCalled = true;
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Best destination?');

    // Delete button has a title with "delete"
    const deleteBtn = screen.getByTitle(/delete/i);
    await user.click(deleteBtn);

    await waitFor(() => expect(deleteCalled).toBe(true));
    await waitFor(() =>
      expect(screen.queryByText('Best destination?')).not.toBeInTheDocument(),
    );
  });

  it('FE-COMP-POLLS-013: WebSocket collab:poll:created event adds poll', async () => {
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);

    // Get the WS listener that was registered
    const listener = (addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];
    listener({ tripId: 1, type: 'collab:poll:created', poll: buildPoll({ id: 77, question: 'Live poll?' }) });

    expect(await screen.findByText('Live poll?')).toBeInTheDocument();
  });

  it('FE-COMP-POLLS-014: WebSocket collab:poll:deleted event removes poll', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ id: 3 })] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Best destination?');

    const listener = (addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];
    listener({ tripId: 1, type: 'collab:poll:deleted', pollId: 3 });

    await waitFor(() =>
      expect(screen.queryByText('Best destination?')).not.toBeInTheDocument(),
    );
  });

  it('FE-COMP-POLLS-015: adding a third option in create modal', async () => {
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);
    await user.click(screen.getByRole('button', { name: /new/i }));

    // Initially 2 option inputs
    let optionInputs = screen.getAllByPlaceholderText(/option/i);
    expect(optionInputs).toHaveLength(2);

    // Click "Add option"
    await user.click(screen.getByText(/add option/i));

    optionInputs = screen.getAllByPlaceholderText(/option/i);
    expect(optionInputs).toHaveLength(3);
  });
});

// FE-W5CPL-001 to FE-W5CPL-028
// Covers the deadline maths, the voter chips, the error paths of every mutation
// and the WebSocket handler branches that the smoke tests above skip.

type AddToast = NonNullable<typeof window.__addToast>;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** A deadline `ms` in the future, with a small buffer so the clock can tick. */
const inFuture = (ms: number) => new Date(Date.now() + ms + 10_000).toISOString();

function servePolls(polls: unknown) {
  server.use(http.get('/api/trips/1/collab/polls', () => HttpResponse.json(polls)));
}

/** Grabs the WS handler CollabPolls registered on mount. */
function wsHandler(): (msg: Record<string, unknown>) => void {
  return (addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];
}

describe('CollabPolls details', () => {
  let addToast: ReturnType<typeof vi.fn<AddToast>>;

  beforeEach(() => {
    addToast = vi.fn<AddToast>(() => 0);
    window.__addToast = addToast;
  });

  afterEach(() => {
    delete window.__addToast;
  });

  it('FE-W5CPL-001: a deadline more than a day away is shown in days and hours', async () => {
    servePolls({ polls: [buildPoll({ deadline: inFuture(2 * DAY + 3 * HOUR) })] });
    render(<CollabPolls {...defaultProps} />);
    expect(await screen.findByText('2d 3h')).toBeInTheDocument();
  });

  it('FE-W5CPL-002: a deadline within the day is shown in hours and minutes', async () => {
    servePolls({ polls: [buildPoll({ deadline: inFuture(5 * HOUR + 30 * MINUTE) })] });
    render(<CollabPolls {...defaultProps} />);
    expect(await screen.findByText('5h 30m')).toBeInTheDocument();
  });

  it('FE-W5CPL-003: a deadline within the hour is shown in minutes', async () => {
    servePolls({ polls: [buildPoll({ deadline: inFuture(45 * MINUTE) })] });
    render(<CollabPolls {...defaultProps} />);
    expect(await screen.findByText('45m')).toBeInTheDocument();
  });

  it('FE-W5CPL-004: a passed deadline closes the poll and drops the countdown', async () => {
    servePolls({ polls: [buildPoll({ deadline: '2020-01-01T00:00:00.000Z' })] });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Best destination?');
    expect(screen.getByText(/closed/i)).toBeInTheDocument();
    expect(screen.getByText('Paris').closest('button')).toBeDisabled();
  });

  it('FE-W5CPL-005: a poll served as a bare array is rendered', async () => {
    servePolls([buildPoll({ question: 'Array shaped?' })]);
    render(<CollabPolls {...defaultProps} />);
    expect(await screen.findByText('Array shaped?')).toBeInTheDocument();
  });

  it('FE-W5CPL-006: options without a voters array count as zero votes', async () => {
    servePolls({ polls: [{ ...buildPoll(), options: [{ id: 1, text: 'Solo' }] }] });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Solo');
    expect(screen.getByText('0 votes')).toBeInTheDocument();
  });

  it('FE-W5CPL-007: a poll without an options array still renders its question', async () => {
    servePolls({ polls: [{ ...buildPoll(), options: undefined }] });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Best destination?');
    expect(screen.queryByText('Paris')).not.toBeInTheDocument();
  });

  it('FE-W5CPL-008: plain string options are rendered as their own label', async () => {
    servePolls({ polls: [{ ...buildPoll(), options: ['Yes', 'No'] }] });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Yes');
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('FE-W5CPL-009: a multiple-choice poll shows the multi badge and a single vote label', async () => {
    servePolls({
      polls: [buildPoll({
        multiple_choice: true,
        options: [
          { id: 1, text: 'Paris', voters: [{ user_id: 9, username: 'bob', avatar_url: null }] },
          { id: 2, text: 'Rome', voters: [] },
        ],
      })],
    });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Best destination?');
    expect(screen.getByText('Multiple choice')).toBeInTheDocument();
    expect(screen.getByText('1 vote')).toBeInTheDocument();
  });

  it('FE-W5CPL-010: once the user voted the results, avatars and tooltip appear', async () => {
    servePolls({
      polls: [buildPoll({
        options: [
          {
            id: 1, text: 'Paris',
            voters: [
              { user_id: 1, username: 'testuser', avatar_url: null },
              { user_id: 2, username: 'alice', avatar_url: '/uploads/avatars/alice.png' },
            ],
          },
          { id: 2, text: 'Rome', voters: [] },
        ],
      })],
    });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Paris');
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(document.querySelector('img[src="/uploads/avatars/alice.png"]')).toBeInTheDocument();

    const chip = screen.getByText('T');
    fireEvent.mouseEnter(chip);
    expect(await screen.findByText('testuser')).toBeInTheDocument();
    fireEvent.mouseLeave(chip);
    await waitFor(() => expect(screen.queryByText('testuser')).not.toBeInTheDocument());
  });

  it('FE-W5CPL-011: a voter without a username falls back to a question mark', async () => {
    servePolls({
      polls: [buildPoll({
        is_closed: true,
        options: [
          { id: 1, text: 'Paris', voters: [{ user_id: null, username: '', avatar_url: null }] },
          { id: 2, text: 'Rome', voters: [] },
        ],
      })],
    });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Paris');
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('FE-W5CPL-012: hovering an open option scales it, a closed one stays put', async () => {
    servePolls({ polls: [buildPoll({ id: 1 }), buildPoll({ id: 2, question: 'Done?', is_closed: true })] });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Done?');
    const [openOption, closedOption] = screen.getAllByText('Paris').map(el => el.closest('button')!);
    fireEvent.mouseEnter(openOption);
    expect(openOption.style.transform).toBe('scale(1.01)');
    fireEvent.mouseLeave(openOption);
    expect(openOption.style.transform).toBe('scale(1)');

    fireEvent.mouseEnter(closedOption);
    expect(closedOption.style.transform).toBe('');
  });

  it('FE-W5CPL-013: the closed section heading only appears next to active polls', async () => {
    servePolls({
      polls: [
        buildPoll({ id: 1, question: 'Still open?' }),
        buildPoll({ id: 2, question: 'Already done?', is_closed: true }),
      ],
    });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Still open?');
    expect(screen.getByText('Already done?')).toBeInTheDocument();
    // One "Closed" badge on the poll itself plus the section heading above it
    expect(screen.getAllByText('Closed')).toHaveLength(2);
  });

  it('FE-W5CPL-014: closing a poll marks it closed and leaves the other one open', async () => {
    let closeCalled = false;
    servePolls({ polls: [buildPoll({ id: 5 }), buildPoll({ id: 6, question: 'Stays open?' })] });
    server.use(
      http.put('/api/trips/1/collab/polls/5/close', () => {
        closeCalled = true;
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Stays open?');

    // Both action buttons highlight on hover
    const closeBtn = screen.getAllByTitle('Close')[0];
    fireEvent.mouseEnter(closeBtn);
    expect(closeBtn.style.color).toBe('var(--text-primary)');
    fireEvent.mouseLeave(closeBtn);
    expect(closeBtn.style.color).toBe('var(--text-faint)');
    const deleteBtn = screen.getAllByTitle('Delete')[0];
    fireEvent.mouseEnter(deleteBtn);
    expect(deleteBtn.style.color).toBe('rgb(239, 68, 68)');
    fireEvent.mouseLeave(deleteBtn);
    expect(deleteBtn.style.color).toBe('var(--text-faint)');

    await user.click(closeBtn);
    await waitFor(() => expect(closeCalled).toBe(true));
    await waitFor(() => expect(screen.getAllByText('Closed')).toHaveLength(2));
    expect(screen.getAllByTitle('Close')).toHaveLength(1);
  });

  it('FE-W5CPL-027: a failing poll request falls back to the empty state', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () => new HttpResponse(null, { status: 500 })),
    );
    render(<CollabPolls {...defaultProps} />);
    expect(await screen.findByText(/no polls yet|collab\.polls\.empty/i)).toBeInTheDocument();
  });

  it('FE-W5CPL-028: a payload without a polls key yields an empty list', async () => {
    servePolls({});
    render(<CollabPolls {...defaultProps} />);
    expect(await screen.findByText(/no polls yet|collab\.polls\.empty/i)).toBeInTheDocument();
  });

  it('FE-W5CPL-015: a failing close shows an error and leaves the poll open', async () => {
    servePolls({ polls: [buildPoll({ id: 5 })] });
    server.use(
      http.put('/api/trips/1/collab/polls/5/close', () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Best destination?');
    await user.click(screen.getByTitle(/close/i));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined));
    expect(screen.getByTitle(/close/i)).toBeInTheDocument();
  });

  it('FE-W5CPL-016: a failing delete shows an error and keeps the poll', async () => {
    servePolls({ polls: [buildPoll({ id: 6 })] });
    server.use(
      http.delete('/api/trips/1/collab/polls/6', () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Best destination?');
    await user.click(screen.getByTitle(/delete/i));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined));
    expect(screen.getByText('Best destination?')).toBeInTheDocument();
  });

  it('FE-W5CPL-017: a failing vote shows an error and leaves the tally alone', async () => {
    servePolls({ polls: [buildPoll({ id: 7 })] });
    server.use(
      http.post('/api/trips/1/collab/polls/7/vote', () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Paris');
    await user.click(screen.getByText('Paris'));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined));
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
  });

  it('FE-W5CPL-018: an unwrapped vote response only replaces the poll that was voted on', async () => {
    servePolls({ polls: [buildPoll({ id: 7 }), buildPoll({ id: 8, question: 'Untouched?' })] });
    server.use(
      http.post('/api/trips/1/collab/polls/7/vote', () =>
        HttpResponse.json(buildPoll({
          id: 7,
          question: 'Voted!',
          options: [
            { id: 1, text: 'Paris', voters: [{ user_id: 1, username: 'testuser', avatar_url: null }] },
            { id: 2, text: 'Rome', voters: [] },
          ],
        })),
      ),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Untouched?');
    await user.click(screen.getAllByText('Paris')[0]);
    await screen.findByText('Voted!');
    expect(screen.getByText('Untouched?')).toBeInTheDocument();
  });

  it('FE-W5CPL-019: a failing create shows an error and keeps the modal open', async () => {
    server.use(
      http.post('/api/trips/1/collab/polls', () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);
    await user.click(screen.getByRole('button', { name: /new/i }));
    await user.type(screen.getByPlaceholderText(/what should we do/i), 'Fails?');
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    await user.type(optionInputs[0], 'A');
    await user.type(optionInputs[1], 'B');
    await user.click(screen.getByRole('button', { name: /create|collab\.polls\.create/i }));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Error', 'error', undefined));
    expect(screen.getByPlaceholderText(/what should we do/i)).toBeInTheDocument();
  });

  it('FE-W5CPL-020: creating a poll that is already in the list does not duplicate it', async () => {
    servePolls({ polls: [buildPoll({ id: 12, question: 'Same poll' })] });
    server.use(
      http.post('/api/trips/1/collab/polls', () =>
        HttpResponse.json(buildPoll({ id: 12, question: 'Same poll' })),
      ),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Same poll');
    await user.click(screen.getByRole('button', { name: /new/i }));
    await user.type(screen.getByPlaceholderText(/what should we do/i), 'Same poll');
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    await user.type(optionInputs[0], 'A');
    await user.type(optionInputs[1], 'B');
    await user.click(screen.getByRole('button', { name: /create|collab\.polls\.create/i }));
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/what should we do/i)).not.toBeInTheDocument(),
    );
    expect(screen.getAllByText('Same poll')).toHaveLength(1);
  });

  it('FE-W5CPL-021: submitting the create form without enough options is a no-op', async () => {
    let postCalled = false;
    server.use(
      http.post('/api/trips/1/collab/polls', () => {
        postCalled = true;
        return HttpResponse.json({ poll: buildPoll() });
      }),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);
    await user.click(screen.getByRole('button', { name: /new/i }));
    await user.type(screen.getByPlaceholderText(/what should we do/i), 'Not enough');
    fireEvent.submit(screen.getByPlaceholderText(/what should we do/i).closest('form')!);
    await waitFor(() => expect(screen.getByPlaceholderText(/what should we do/i)).toBeInTheDocument());
    expect(postCalled).toBe(false);
  });

  it('FE-W5CPL-022: an extra option can be removed again', async () => {
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);
    await user.click(screen.getByRole('button', { name: /new/i }));
    await user.click(screen.getByText(/add option/i));
    expect(screen.getAllByPlaceholderText(/option/i)).toHaveLength(3);

    const thirdRow = screen.getAllByPlaceholderText(/option/i)[2].parentElement!;
    await user.click(thirdRow.querySelector('button')!);
    expect(screen.getAllByPlaceholderText(/option/i)).toHaveLength(2);
  });

  it('FE-W5CPL-023: the multi-choice toggle flips and is sent along on create', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/trips/1/collab/polls', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ poll: buildPoll({ id: 30, question: 'Multi?' }) });
      }),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);
    await user.click(screen.getByRole('button', { name: /new/i }));

    const toggle = screen.getByText(/multiple|multi/i).previousElementSibling as HTMLElement;
    expect(toggle.style.background).toBe('var(--border-primary)');
    await user.click(toggle);
    expect(toggle.style.background).toBe('rgb(0, 122, 255)');

    await user.type(screen.getByPlaceholderText(/what should we do/i), 'Multi?');
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    await user.type(optionInputs[0], 'A');
    await user.type(optionInputs[1], 'B');
    await user.click(screen.getByRole('button', { name: /create|collab\.polls\.create/i }));
    await screen.findByText('Multi?');
    expect(body).toMatchObject({ multiple_choice: true, options: ['A', 'B'] });
  });

  it('FE-W5CPL-024: WebSocket events without a type or a known id are ignored', async () => {
    servePolls({ polls: [buildPoll({ id: 40 })] });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Best destination?');
    const handler = wsHandler();
    await act(async () => {
      handler({});
      handler({ tripId: 1, type: 'collab:poll:deleted' });
      handler({ tripId: 1, type: 'collab:poll:created', poll: { id: 40, question: 'Best destination?' } });
    });
    expect(screen.getAllByText('Best destination?')).toHaveLength(1);
  });

  it('FE-W5CPL-025: WebSocket vote and close events update only the matching poll', async () => {
    servePolls({ polls: [buildPoll({ id: 41 }), buildPoll({ id: 42, question: 'Other poll' })] });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText('Other poll');
    const handler = wsHandler();

    await act(async () => {
      handler({ tripId: 1, type: 'collab:poll:voted', poll: buildPoll({ id: 41, question: 'Voted live' }) });
    });
    expect(await screen.findByText('Voted live')).toBeInTheDocument();
    expect(screen.getByText('Other poll')).toBeInTheDocument();

    await act(async () => {
      handler({ tripId: 1, type: 'collab:poll:closed', poll: { id: 41 } });
    });
    await waitFor(() => expect(screen.getAllByText('Closed')).toHaveLength(2));

    await act(async () => {
      handler({ tripId: 1, type: 'collab:poll:deleted', poll: { id: 42 } });
    });
    await waitFor(() => expect(screen.queryByText('Other poll')).not.toBeInTheDocument());
  });

  it('FE-W5CPL-027: a WebSocket event for another trip is ignored', async () => {
    servePolls({ polls: [] });
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab.polls.empty/i);
    const handler = wsHandler();
    await act(async () => {
      handler({ tripId: 2, type: 'collab:poll:created', poll: buildPoll({ id: 88, question: 'Other trip poll?' }) });
    });
    expect(screen.queryByText('Other trip poll?')).not.toBeInTheDocument();
  });

  it('FE-W5CPL-028: a slow load for the trip we left does not overwrite the new one', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', async () => {
        await delay(80);
        return HttpResponse.json({ polls: [buildPoll({ id: 1, question: 'Trip one poll?' })] });
      }),
      http.get('/api/trips/2/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ id: 2, question: 'Trip two poll?' })] }),
      ),
    );
    const { rerender } = render(<CollabPolls {...defaultProps} />);
    rerender(<CollabPolls tripId={2} currentUser={currentUser} />);

    await screen.findByText('Trip two poll?');
    await act(async () => { await delay(150); });
    expect(screen.queryByText('Trip one poll?')).not.toBeInTheDocument();
    expect(screen.getByText('Trip two poll?')).toBeInTheDocument();
  });

  it('FE-W5CPL-026: a poll with a live deadline starts the countdown ticker', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      servePolls({ polls: [buildPoll({ deadline: inFuture(90 * MINUTE) })] });
      const { unmount } = render(<CollabPolls {...defaultProps} />);
      await screen.findByText('1h 30m');
      await act(async () => { await vi.advanceTimersByTimeAsync(31_000); });
      expect(screen.getByText('1h 29m')).toBeInTheDocument();
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

// FE-COMP-POLLS-016 to FE-COMP-POLLS-022
// Markdown questions, sanitization and multiline input (#2177).

describe('CollabPolls markdown & multiline', () => {
  it('FE-COMP-POLLS-016: a markdown question renders headings and bold text', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ question: '## Day trip\n\n**Vote** carefully' })] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    const heading = await screen.findByText('Day trip');
    expect(heading.closest('h2')).not.toBeNull();
    expect(screen.getByText('Vote').closest('strong')).not.toBeNull();
  });

  it('FE-COMP-POLLS-017: a script/onerror injection attempt produces no live DOM nodes', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({
          polls: [buildPoll({ question: 'Safe title <script>alert("xss")</script> <img src=x onerror=alert(1)>' })],
        }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/Safe title/);
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img[src="x"]')).toBeNull();
    expect(document.querySelector('[onerror]')).toBeNull();
  });

  it('FE-COMP-POLLS-018: blank lines split the question into separate paragraphs', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ question: 'First paragraph\n\nSecond paragraph' })] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    const first = await screen.findByText('First paragraph');
    const second = screen.getByText('Second paragraph');
    expect(first.tagName).toBe('P');
    expect(second.tagName).toBe('P');
    expect(first).not.toBe(second);
  });

  it('FE-COMP-POLLS-019: a plain-text question renders identically, without formatting nodes', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ question: 'Best destination?' })] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    const question = await screen.findByText('Best destination?');
    expect(question.textContent).toBe('Best destination?');
    // The question sits in a paragraph now, but no formatting was invented
    expect(question.parentElement!.querySelector('strong, em, h1, h2, a')).toBeNull();
  });

  it('FE-COMP-POLLS-020: the question field is a textarea — Enter adds a line instead of submitting', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/trips/1/collab/polls', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ poll: buildPoll({ id: 60, question: 'Line one\nLine two' }) });
      }),
    );
    const user = userEvent.setup();
    render(<CollabPolls {...defaultProps} />);
    await screen.findByText(/no polls yet|collab\.polls\.empty/i);
    await user.click(screen.getByRole('button', { name: /new/i }));

    const questionField = screen.getByPlaceholderText(/what should we do/i);
    expect(questionField.tagName).toBe('TEXTAREA');
    await user.type(questionField, 'Line one{enter}Line two');
    // Enter stayed in the field — the form was not submitted without options
    expect(body).toBeNull();
    expect(questionField).toHaveValue('Line one\nLine two');

    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    expect(optionInputs[0].tagName).toBe('TEXTAREA');
    await user.type(optionInputs[0], 'A');
    await user.type(optionInputs[1], 'B');
    await user.click(screen.getByRole('button', { name: /create|collab\.polls\.create/i }));
    await waitFor(() => expect(body).toMatchObject({ question: 'Line one\nLine two' }));
  });

  it('FE-COMP-POLLS-021: a link in the question opens in a new tab with rel protection', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ question: 'Where? [Our hotel](https://example.com)' })] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    const link = await screen.findByRole('link', { name: 'Our hotel' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
  });

  it('FE-COMP-POLLS-022: a long multiline option wraps instead of being clipped', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({
          polls: [buildPoll({
            options: [
              { id: 1, text: 'Stay at the beach house\nwith the long unpronounceable name', voters: [] },
              { id: 2, text: 'Rome', voters: [] },
            ],
          })],
        }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    const label = (await screen.findByText(/Stay at the beach house/)).closest('span')!;
    expect(label.style.whiteSpace).toBe('pre-wrap');
    expect(label.style.overflowWrap).toBe('anywhere');
    expect(label.style.minWidth).toBe('0px');
  });

  it('FE-COMP-POLLS-023: a placeholder in angle brackets survives sanitizing', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ question: 'Treffpunkt <noch offen> oder Hotel?' })] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    // Questions written before markdown rendering existed must keep reading the
    // way they were typed, and they cannot be edited afterwards (#2177).
    expect(await screen.findByText('Treffpunkt <noch offen> oder Hotel?')).toBeInTheDocument();
  });

  it('FE-COMP-POLLS-024: a script tag is shown as text, never as an element', async () => {
    server.use(
      http.get('/api/trips/1/collab/polls', () =>
        HttpResponse.json({ polls: [buildPoll({ question: 'Plan <script>alert("xss")</script>' })] }),
      ),
    );
    render(<CollabPolls {...defaultProps} />);
    expect(await screen.findByText('Plan <script>alert("xss")</script>')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });
});
