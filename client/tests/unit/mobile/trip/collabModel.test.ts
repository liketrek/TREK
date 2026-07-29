import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  NOTE_COLORS,
  OTHER_BUBBLE_RADIUS,
  OWN_BUBBLE_RADIUS,
  QUICK_REACTIONS,
  buildCategoryColorMap,
  formatChatClockTime,
  formatChatDateSeparator,
  formatPollCountdown,
  getCategoryColor,
  hasUserVoted,
  isEmojiOnlyText,
  isPollActive,
  isPollExpired,
  isSameSender,
  noteCategoriesList,
  parseUtcDate,
  pollMaxVoteCount,
  shouldShowChatDateSeparator,
  sortNotes,
  splitPolls,
  totalPollVotes,
  type ChatMessage,
  type CollabNoteData,
  type CollabPollData,
  type PollVoter,
} from '../../../../src/mobile/screens/trip/tabs/collabModel';

// FE-MOB-CLBM-001 to FE-MOB-CLBM-023

/** SQLite-style timestamp (UTC, no 'Z') for a given local wall-clock time, so
 *  assertions on getHours() hold in any test-runner timezone. */
function utcStampForLocal(y: number, monthIndex: number, d: number, h: number, min = 0): string {
  return new Date(y, monthIndex, d, h, min, 0, 0).toISOString().slice(0, -1);
}

function msg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 1,
    trip_id: 1,
    user_id: 1,
    text: 'hi',
    reply_to: null,
    username: 'ada',
    avatar: null,
    avatar_url: null,
    created_at: '2026-07-15T10:00:00',
    reactions: [],
    ...overrides,
  };
}

function note(overrides: Partial<CollabNoteData> = {}): CollabNoteData {
  return {
    id: 1,
    trip_id: 1,
    user_id: 1,
    title: 'Note',
    content: null,
    category: null,
    color: null,
    website: null,
    pinned: 0,
    username: 'ada',
    avatar: null,
    avatar_url: null,
    created_at: '2026-07-01T10:00:00.000Z',
    attachments: [],
    ...overrides,
  };
}

function voter(user_id: number): PollVoter {
  return { id: user_id * 10, user_id, username: `u${user_id}`, avatar: null, avatar_url: null };
}

function poll(overrides: Partial<CollabPollData> = {}): CollabPollData {
  return {
    id: 1,
    trip_id: 1,
    user_id: 1,
    question: 'Where to?',
    options: [],
    multiple_choice: false,
    is_closed: false,
    deadline: null,
    username: 'ada',
    avatar: null,
    avatar_url: null,
    created_at: '2026-07-01T10:00:00.000Z',
    ...overrides,
  };
}

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(',')}` : key;

afterEach(() => {
  vi.useRealTimers();
});

describe('collabModel — constants', () => {
  it('FE-MOB-CLBM-001: exposes the quick reaction set, bubble radii and note palette', () => {
    expect(QUICK_REACTIONS).toHaveLength(8);
    expect(QUICK_REACTIONS).toContain('❤️');
    expect(new Set(QUICK_REACTIONS).size).toBe(QUICK_REACTIONS.length);
    expect(OWN_BUBBLE_RADIUS).toBe('16px 16px 4px 16px');
    expect(OTHER_BUBBLE_RADIUS).toBe('4px 16px 16px 16px');
    expect(NOTE_COLORS).toHaveLength(6);
  });
});

describe('collabModel — chat', () => {
  it('FE-MOB-CLBM-002: parseUtcDate reads a suffix-less SQLite timestamp as UTC', () => {
    expect(parseUtcDate('2026-07-15T10:30:00').getTime()).toBe(Date.UTC(2026, 6, 15, 10, 30, 0));
    expect(parseUtcDate('2026-07-15T10:30:00Z').getTime()).toBe(Date.UTC(2026, 6, 15, 10, 30, 0));
  });

  it('FE-MOB-CLBM-003: isEmojiOnlyText accepts up to three emoji and nothing else', () => {
    expect(isEmojiOnlyText('👍')).toBe(true);
    expect(isEmojiOnlyText(' ❤️ ')).toBe(true);
    expect(isEmojiOnlyText('🔥🎉👏')).toBe(true);
    expect(isEmojiOnlyText('👨‍👩‍👧')).toBe(true);
  });

  it('FE-MOB-CLBM-004: isEmojiOnlyText rejects text and long emoji runs', () => {
    expect(isEmojiOnlyText('nice 👍')).toBe(false);
    expect(isEmojiOnlyText('🔥🎉👏😮')).toBe(false);
    expect(isEmojiOnlyText('')).toBe(false);
  });

  it('FE-MOB-CLBM-005: formatChatClockTime renders zero-padded 24h time', () => {
    expect(formatChatClockTime(utcStampForLocal(2026, 6, 15, 9, 5), false)).toBe('09:05');
    expect(formatChatClockTime(utcStampForLocal(2026, 6, 15, 23, 59), false)).toBe('23:59');
  });

  it('FE-MOB-CLBM-006: formatChatClockTime maps midnight and noon correctly in 12h mode', () => {
    expect(formatChatClockTime(utcStampForLocal(2026, 6, 15, 0, 5), true)).toBe('12:05 AM');
    expect(formatChatClockTime(utcStampForLocal(2026, 6, 15, 12, 0), true)).toBe('12:00 PM');
    expect(formatChatClockTime(utcStampForLocal(2026, 6, 15, 15, 30), true)).toBe('3:30 PM');
    expect(formatChatClockTime(utcStampForLocal(2026, 6, 15, 7, 30), true)).toBe('7:30 AM');
  });

  it('FE-MOB-CLBM-007: formatChatDateSeparator labels today and yesterday', () => {
    const now = new Date();
    expect(formatChatDateSeparator(now.toISOString(), t, 'en-US')).toBe('collab.chat.today');
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(formatChatDateSeparator(yesterday.toISOString(), t, 'en-US')).toBe('collab.chat.yesterday');
  });

  it('FE-MOB-CLBM-008: formatChatDateSeparator falls back to a localized date', () => {
    expect(formatChatDateSeparator(utcStampForLocal(2020, 2, 5, 12), t, 'en-US')).toBe('Mar 5, 2020');
  });

  it('FE-MOB-CLBM-009: shouldShowChatDateSeparator triggers on the first message and on day changes', () => {
    const a = msg({ created_at: utcStampForLocal(2026, 6, 15, 20) });
    const b = msg({ id: 2, created_at: utcStampForLocal(2026, 6, 15, 22) });
    const c = msg({ id: 3, created_at: utcStampForLocal(2026, 6, 16, 9) });

    expect(shouldShowChatDateSeparator(a, undefined)).toBe(true);
    expect(shouldShowChatDateSeparator(b, a)).toBe(false);
    expect(shouldShowChatDateSeparator(c, b)).toBe(true);
  });

  it('FE-MOB-CLBM-010: isSameSender compares user ids loosely and needs both messages', () => {
    const a = msg({ user_id: 7 });
    const b = msg({ id: 2, user_id: 7 });
    const other = msg({ id: 3, user_id: 8 });

    expect(isSameSender(a, b)).toBe(true);
    expect(isSameSender(a, other)).toBe(false);
    expect(isSameSender(a, undefined)).toBe(false);
    expect(isSameSender(undefined, b)).toBe(false);
    expect(isSameSender(a, { ...b, user_id: '7' } as unknown as ChatMessage)).toBe(true);
  });
});

describe('collabModel — notes', () => {
  it('FE-MOB-CLBM-011: buildCategoryColorMap keeps the first colour seen per category', () => {
    const notes = [
      note({ id: 1, category: 'Ideas', color: '#ef4444' }),
      note({ id: 2, category: 'Ideas', color: '#10b981' }),
      note({ id: 3, category: 'Food', color: null }),
      note({ id: 4, category: null, color: '#3b82f6' }),
    ];
    expect(buildCategoryColorMap(notes)).toEqual({ Ideas: '#ef4444' });
  });

  it('FE-MOB-CLBM-012: getCategoryColor round-robins fresh categories onto the palette', () => {
    expect(getCategoryColor(null, {})).toBe(NOTE_COLORS[0]);
    expect(getCategoryColor(undefined, {})).toBe(NOTE_COLORS[0]);
    expect(getCategoryColor('Ideas', { Ideas: '#123456' })).toBe('#123456');
    expect(getCategoryColor('New', { A: 'x', B: 'y' })).toBe(NOTE_COLORS[2]);
    // wraps around once every palette slot is taken
    const full = Object.fromEntries(NOTE_COLORS.map((c, i) => [`c${i}`, c]));
    expect(getCategoryColor('New', full)).toBe(NOTE_COLORS[0]);
  });

  it('FE-MOB-CLBM-013: noteCategoriesList returns distinct categories in first-appearance order', () => {
    const notes = [
      note({ id: 1, category: 'Ideas' }),
      note({ id: 2, category: null }),
      note({ id: 3, category: 'Food' }),
      note({ id: 4, category: 'Ideas' }),
    ];
    expect(noteCategoriesList(notes)).toEqual(['Ideas', 'Food']);
    expect(noteCategoriesList([])).toEqual([]);
  });

  it('FE-MOB-CLBM-014: sortNotes puts pinned notes first, then most recently touched', () => {
    const old = note({ id: 1, created_at: '2026-07-01T10:00:00.000Z' });
    const fresh = note({ id: 2, created_at: '2026-07-05T10:00:00.000Z' });
    const edited = note({ id: 3, created_at: '2026-06-01T10:00:00.000Z', updated_at: '2026-07-09T10:00:00.000Z' });
    const pinned = note({ id: 4, created_at: '2026-01-01T10:00:00.000Z', pinned: 1 });

    expect(sortNotes([old, fresh, edited, pinned], null).map(n => n.id)).toEqual([4, 3, 2, 1]);
    // pinned wins no matter which side of the comparison it lands on
    expect(sortNotes([pinned, fresh], null).map(n => n.id)).toEqual([4, 2]);
  });

  it('FE-MOB-CLBM-015: sortNotes filters by the active category and leaves the input untouched', () => {
    const input = [
      note({ id: 1, category: 'Food', created_at: '2026-07-01T10:00:00.000Z' }),
      note({ id: 2, category: 'Ideas', created_at: '2026-07-02T10:00:00.000Z' }),
      note({ id: 3, category: 'Food', created_at: '2026-07-03T10:00:00.000Z', pinned: true }),
    ];
    const snapshot = input.map(n => n.id);

    expect(sortNotes(input, 'Food').map(n => n.id)).toEqual([3, 1]);
    expect(sortNotes(input, 'Nope')).toEqual([]);
    expect(input.map(n => n.id)).toEqual(snapshot);
  });
});

describe('collabModel — polls', () => {
  const optA = { text: 'Rome', label: 'A', voters: [voter(1), voter(2)] };
  const optB = { text: 'Oslo', label: 'B', voters: [voter(3)] };

  it('FE-MOB-CLBM-016: totalPollVotes and pollMaxVoteCount count across options', () => {
    const p = poll({ options: [optA, optB] });
    expect(totalPollVotes(p)).toBe(3);
    expect(pollMaxVoteCount(p)).toBe(2);
    expect(totalPollVotes(poll())).toBe(0);
    expect(pollMaxVoteCount(poll())).toBe(0);
  });

  it('FE-MOB-CLBM-017: vote counters tolerate missing option/voter arrays', () => {
    const broken = poll({
      options: [{ text: 'Rome', label: 'A' }] as unknown as CollabPollData['options'],
    });
    expect(totalPollVotes(broken)).toBe(0);
    expect(pollMaxVoteCount(broken)).toBe(0);
    expect(hasUserVoted(broken, 1)).toBe(false);

    const noOptions = { ...poll(), options: undefined } as unknown as CollabPollData;
    expect(totalPollVotes(noOptions)).toBe(0);
    expect(pollMaxVoteCount(noOptions)).toBe(0);
    expect(hasUserVoted(noOptions, 1)).toBe(false);
  });

  it('FE-MOB-CLBM-018: hasUserVoted matches ids across string/number storage', () => {
    const p = poll({ options: [optA, optB] });
    expect(hasUserVoted(p, 2)).toBe(true);
    expect(hasUserVoted(p, 9)).toBe(false);
    expect(hasUserVoted(p, '3' as unknown as number)).toBe(true);
  });

  it('FE-MOB-CLBM-019: isPollExpired only fires on a deadline in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));

    expect(isPollExpired(null)).toBe(false);
    expect(isPollExpired('2026-07-15T11:59:00Z')).toBe(true);
    expect(isPollExpired('2026-07-15T12:00:00Z')).toBe(true);
    expect(isPollExpired('2026-07-15T12:01:00Z')).toBe(false);
  });

  it('FE-MOB-CLBM-020: isPollActive requires an open poll with an unexpired deadline', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));

    expect(isPollActive(poll())).toBe(true);
    expect(isPollActive(poll({ is_closed: true }))).toBe(false);
    expect(isPollActive(poll({ deadline: '2026-07-14T12:00:00Z' }))).toBe(false);
    expect(isPollActive(poll({ deadline: '2026-07-16T12:00:00Z' }))).toBe(true);
  });

  it('FE-MOB-CLBM-021: splitPolls separates active from closed/expired', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));

    const open = poll({ id: 1 });
    const closed = poll({ id: 2, is_closed: true });
    const expired = poll({ id: 3, deadline: '2026-07-01T12:00:00Z' });

    const { active, closed: done } = splitPolls([open, closed, expired]);
    expect(active.map(p => p.id)).toEqual([1]);
    expect(done.map(p => p.id)).toEqual([2, 3]);
    expect(splitPolls([])).toEqual({ active: [], closed: [] });
  });

  it('FE-MOB-CLBM-022: formatPollCountdown picks the days/hours/minutes tier', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));

    expect(formatPollCountdown(null, t)).toBeNull();
    expect(formatPollCountdown('2026-07-15T11:00:00Z', t)).toBeNull();
    expect(formatPollCountdown('2026-07-17T16:00:00Z', t)).toBe('collab.polls.countdownDaysHours:d=2,h=4');
    expect(formatPollCountdown('2026-07-15T15:45:00Z', t)).toBe('collab.polls.countdownHoursMinutes:h=3,m=45');
    expect(formatPollCountdown('2026-07-15T12:12:00Z', t)).toBe('collab.polls.countdownMinutes:m=12');
  });
});
