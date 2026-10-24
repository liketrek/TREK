/**
 * The assistant's two scopes, a trip and a journey, in their pure parts: which
 * repository methods a scope's threads and changes are reached through, which
 * tools a Studio conversation attaches and keeps, the book card and the
 * Studio's instructions, and the pieces that read through injected services
 * (the book context, the scope's session and turn) against fakes.
 */
import type { AssistantThreadsRepository } from '../../../../src/db/repositories/AssistantThreads.repository';
import type { AssistantToolCallsRepository } from '../../../../src/db/repositories/AssistantToolCalls.repository';
import {
  AssistantBookContext,
  bookTurnContext,
  emptyTripCard,
  renderBookCard,
  type BookCard,
} from '../../../../src/nest/assistant/assistant-book-context';
import type { AssistantBookGate } from '../../../../src/nest/assistant/assistant-book-gate';
import { homePrompt } from '../../../../src/nest/assistant/assistant-home';
import {
  AssistantScopes,
  findScopedCall,
  scopedThreads,
  tripScope,
} from '../../../../src/nest/assistant/assistant-scope';
import {
  isOfferedInJourney,
  isOfferedTool,
  JOURNEY_PINNED_ARG,
  keptInJourney,
} from '../../../../src/nest/assistant/assistant-tool-offer';
import type { AssistantToolsService } from '../../../../src/nest/assistant/assistant-tools.service';
import { readTripCard, tripCardFrom } from '../../../../src/nest/assistant/assistant-trip-scope';
import { studioPrompt, systemPrompt } from '../../../../src/nest/assistant/assistant.prompt';
import type { JourneyAiPhotosService } from '../../../../src/nest/journey/journey-ai-photos.service';
import type { JourneyBookEditService } from '../../../../src/nest/journey/journey-book-edit.service';
import type { JourneyDomainService } from '../../../../src/nest/journey/journey-domain.service';
import type { PhotoSignalsService } from '../../../../src/nest/photos/photo-signals.service';
import type { SettingsService } from '../../../../src/nest/settings/settings.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import type { BookOverview } from '@trek/shared';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(testDb);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const NOW = new Date('2026-07-03T09:00:00Z');

function threadRepo() {
  const row = { id: 1 };
  return {
    createThread: vi.fn(async () => 11),
    createJourneyThread: vi.fn(async () => 12),
    findOwned: vi.fn(async () => row),
    findOwnedOnJourney: vi.fn(async () => row),
    listRecent: vi.fn(async () => [row]),
    listRecentOnJourney: vi.fn(async () => [row]),
    deleteOwned: vi.fn(async () => true),
    deleteOwnedOnJourney: vi.fn(async () => true),
    createHomeThread: vi.fn(async () => 13),
    findOwnedAtHome: vi.fn(async () => row),
    listRecentAtHome: vi.fn(async () => [row]),
    deleteOwnedAtHome: vi.fn(async () => true),
  };
}

const BOOK: BookOverview = {
  exists: true,
  version: 7,
  title: 'Lisbon in spring',
  page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 10 },
  spreads: [
    {
      index: 0,
      id: 'sp-cover',
      role: 'cover',
      entryId: null,
      background: null,
      photoIds: [812],
      texts: ['Lisbon'],
      elements: 2,
      emptyFrames: 0,
      parked: 0,
    },
    {
      index: 1,
      id: 'sp-alfama',
      role: 'inner',
      entryId: 40,
      background: '#ffffff',
      photoIds: [813, 814],
      texts: [],
      elements: 2,
      emptyFrames: 1,
      parked: 0,
    },
  ],
  layouts: [{ id: 'lay-1', name: 'Three in a row', role: 'inner' }],
};

function card(overrides: Partial<BookCard> = {}): BookCard {
  return {
    journeyId: 12,
    title: 'Portugal',
    subtitle: 'Two weeks by train',
    role: 'editor',
    book: BOOK,
    gallery: { photos: 120, withTime: 118, withGps: 90, own: 100 },
    entries: [{ id: 40, date: '2026-04-02', title: 'Alfama', place: 'Lisbon', photos: 3 }],
    focus: null,
    ...overrides,
  };
}

describe('a scope reaches its own threads and changes', () => {
  it('ASTSCP-001: a trip scope goes through the trip methods with its trip id', async () => {
    const repo = threadRepo();
    const threads = scopedThreads(repo as unknown as AssistantThreadsRepository, tripScope(5));
    expect(await threads.create(7, 'Kyoto', 'at')).toBe(11);
    await threads.find(3, 7);
    await threads.list(7, 20);
    expect(await threads.remove(3, 7)).toBe(true);
    expect(repo.createThread).toHaveBeenCalledWith(7, 5, 'Kyoto', 'at');
    expect(repo.findOwned).toHaveBeenCalledWith(3, 7, 5);
    expect(repo.listRecent).toHaveBeenCalledWith(7, 5, 20);
    expect(repo.deleteOwned).toHaveBeenCalledWith(3, 7, 5);
    expect(repo.createJourneyThread).not.toHaveBeenCalled();
  });

  it('ASTSCP-002: a journey scope goes through the journey methods with its journey id', async () => {
    const repo = threadRepo();
    const threads = scopedThreads(repo as unknown as AssistantThreadsRepository, { kind: 'journey', journeyId: 12 });
    expect(await threads.create(7, 'Book', 'at')).toBe(12);
    await threads.find(3, 7);
    await threads.list(7, 20);
    await threads.remove(3, 7);
    expect(repo.createJourneyThread).toHaveBeenCalledWith(7, 12, 'Book', 'at');
    expect(repo.findOwnedOnJourney).toHaveBeenCalledWith(3, 7, 12);
    expect(repo.listRecentOnJourney).toHaveBeenCalledWith(7, 12, 20);
    expect(repo.deleteOwnedOnJourney).toHaveBeenCalledWith(3, 7, 12);
    expect(repo.createThread).not.toHaveBeenCalled();
  });

  it('ASTSCP-003: a change is looked up in the scope it was proposed in', async () => {
    const repo = {
      findOwned: vi.fn(async () => null),
      findOwnedOnJourney: vi.fn(async () => null),
      findOwnedAtHome: vi.fn(async () => null),
    };
    const calls = repo as unknown as AssistantToolCallsRepository;
    await findScopedCall(calls, tripScope(5), 'tc-1', 7);
    await findScopedCall(calls, { kind: 'journey', journeyId: 12 }, 'tc-2', 7);
    await findScopedCall(calls, { kind: 'home' }, 'tc-3', 7);
    expect(repo.findOwned).toHaveBeenCalledWith('tc-1', 7, 5);
    expect(repo.findOwnedOnJourney).toHaveBeenCalledWith('tc-2', 7, 12);
    expect(repo.findOwnedAtHome).toHaveBeenCalledWith('tc-3', 7);
  });

  it('ASTSCP-004: the home scope goes through the home methods, with no trip and no journey', async () => {
    const repo = threadRepo();
    const threads = scopedThreads(repo as unknown as AssistantThreadsRepository, { kind: 'home' });
    expect(await threads.create(7, 'Next trip', 'at')).toBe(13);
    await threads.find(3, 7);
    await threads.list(7, 20);
    await threads.remove(3, 7);
    expect(repo.createHomeThread).toHaveBeenCalledWith(7, 'Next trip', 'at');
    expect(repo.findOwnedAtHome).toHaveBeenCalledWith(3, 7);
    expect(repo.listRecentAtHome).toHaveBeenCalledWith(7, 20);
    expect(repo.deleteOwnedAtHome).toHaveBeenCalledWith(3, 7);
    expect(repo.createThread).not.toHaveBeenCalled();
    expect(repo.createJourneyThread).not.toHaveBeenCalled();
  });
});

describe('the tools of a Studio conversation', () => {
  it('ASTSCP-010: attaches the book tools and the journey tools, the denied ones and every other controller left out', () => {
    expect(JOURNEY_PINNED_ARG).toBe('journeyId');
    expect(isOfferedInJourney('edit_book_page', 'JourneyBookMcp')).toBe(true);
    expect(isOfferedInJourney('suggest_book_photos', 'JourneyBookPhotosMcp')).toBe(true);
    expect(isOfferedInJourney('get_journey', 'JourneyMcp')).toBe(true);
    expect(isOfferedInJourney('get_journey_map_layers', 'JourneyMapMcp')).toBe(true);
    expect(isOfferedInJourney('restore_book_page', 'JourneyBookMcp')).toBe(false);
    expect(isOfferedInJourney('get_journey_share_link', 'JourneyMcp')).toBe(false);
    expect(isOfferedInJourney('remove_journey_contributor', 'JourneyMcp')).toBe(false);
    expect(isOfferedInJourney('list_places', 'PlacesMcp')).toBe(false);
    expect(isOfferedInJourney('get_book', undefined)).toBe(false);
  });

  it('ASTSCP-011: keeps what works on the journey: every read, design reads and book writes only for an editor', () => {
    expect(keptInJourney('JourneyMcp', 'read', true, false)).toBe(true);
    expect(keptInJourney(undefined, 'read', true, false)).toBe(true);
    expect(keptInJourney('JourneyBookDesignMcp', 'read', true, false)).toBe(false);
    expect(keptInJourney('JourneyBookDesignMcp', 'read', true, true)).toBe(true);
    expect(keptInJourney('JourneyBookMcp', 'write', true, true)).toBe(true);
    expect(keptInJourney('JourneyBookMcp', 'write', true, false)).toBe(false);
    expect(keptInJourney('JourneyMcp', 'write', true, true)).toBe(false);
    expect(keptInJourney('JourneyMcp', 'read', false, true)).toBe(false);
    expect(keptInJourney(undefined, 'write', true, true)).toBe(false);
  });

  it('ASTSCP-012: a trip conversation still goes without every book tool', () => {
    for (const name of ['get_book', 'edit_book_page', 'suggest_book_photos', 'restore_book_page']) {
      expect(isOfferedTool(name), name).toBe(false);
    }
  });
});

describe('the book card', () => {
  it('ASTSCP-020: lists the journey, the role, the book page by page and the entries', () => {
    const text = renderBookCard(card());
    expect(text).toContain('Journey: Portugal');
    expect(text).toContain('Subtitle: Two weeks by train');
    expect(text).toContain('Your role: editor (you may change the book)');
    expect(text).toContain('Book: "Lisbon in spring", version 7');
    expect(text).toContain('Page: 210 x 210 mm (square-210), bleed 3 mm, safe margin 10 mm');
    expect(text).toContain('0 | sp-cover | cover |  | 812 | "Lisbon"');
    expect(text).toContain('1 | sp-alfama | inner | 40 | 813, 814 | ');
    expect(text).toContain('Saved layouts: Three in a row (lay-1, inner)');
    expect(text).toContain('Gallery: 120 photos (videos left out), 118 with the time taken, 90 with a GPS position.');
    // Which photos a page image may show, said as the rule: a text turn learns it too.
    expect(text).toContain('100 of them are yours; a page image shows only those');
    const gallery = { photos: 120, withTime: 118, withGps: 90 };
    expect(renderBookCard(card({ gallery: { ...gallery, own: 120 } }))).toContain('All of them are yours');
    expect(renderBookCard(card({ gallery: { ...gallery, own: 0 } }))).toContain('None of them are yours');
    expect(text).toContain('40 | 2026-04-02 | Alfama | Lisbon | 3');
    expect(text).not.toContain('The user is looking at');
    expect(text).not.toMatch(/[\u2013\u2014]/);
  });

  it('ASTSCP-026: keeps every row on one line whatever the user typed, and says when the gallery is empty', () => {
    const book = { ...BOOK, spreads: BOOK.spreads.map((spread) => ({ ...spread, texts: ['Lisbon\nin\tspring'] })) };
    const entries = [{ id: 40, date: '2026-04-02', title: 'Alfama\nat night', place: ' Lisbon\r\n', photos: 3 }];
    const gallery = { photos: 0, withTime: 0, withGps: 0, own: 0 };
    const text = renderBookCard(card({ book, entries, title: 'Portugal\n2026', gallery }));
    expect(text).toContain('Journey: Portugal 2026');
    expect(text).toContain('0 | sp-cover | cover |  | 812 | "Lisbon in spring"');
    expect(text).toContain('40 | 2026-04-02 | Alfama at night | Lisbon | 3');
    expect(text).toContain('Gallery: no photos yet.');
  });

  it('ASTSCP-021: starts with the page on screen and what is selected on it, and only for a page of the book', () => {
    const focused = renderBookCard(card({ focus: { spreadId: 'sp-alfama', elementIds: ['p-1', 'p-2'] } }));
    expect(focused.split('\n')[0]).toBe(
      'The user is looking at page sp-alfama (index 1, inner); words like "this page" or "here" mean it.',
    );
    expect(focused).toContain('Selected on it ("this photo", "these" mean them): p-1, p-2.');
    expect(renderBookCard(card({ focus: { spreadId: 'sp-gone' } }))).not.toContain('The user is looking at');
  });

  it('ASTSCP-022: says when there is no book and no entry yet, and what a viewer may not do', () => {
    const empty = { ...BOOK, exists: false, version: null, spreads: [], layouts: [] };
    const text = renderBookCard(card({ book: empty, entries: [], role: 'viewer', subtitle: null }));
    // A viewer's turn is not offered create_book, so its card does not name it.
    expect(text).toContain('Book: none yet.');
    expect(text).not.toContain('create_book');
    expect(text).toContain('(no entries yet)');
    expect(text).toContain('propose no changes');
    expect(text).not.toContain('Subtitle:');
    const editor = renderBookCard(card({ book: empty, entries: [], role: 'editor' }));
    expect(editor).toContain('Book: none yet (create_book lays down a blank one).');
  });

  it('ASTSCP-023: counts what it does not list', () => {
    const entries = Array.from({ length: 205 }, (_, i) => ({
      id: i + 1,
      date: '2026-04-02',
      title: null,
      place: null,
      photos: 0,
    }));
    expect(renderBookCard(card({ entries }))).toContain('and 5 more');
  });

  it('ASTSCP-024: comes with the date in the user zone, inside its own tags', () => {
    const context = bookTurnContext(card(), 'Europe/Lisbon', NOW);
    expect(context.split('\n')[0]).toBe('Today is 2026-07-03 (time zone Europe/Lisbon).');
    expect(context).toContain('<book_card>\nJourney: Portugal');
    expect(context.endsWith('</book_card>')).toBe(true);
  });

  it('ASTSCP-025: hands the agent an empty trip card', () => {
    const empty = emptyTripCard(7);
    expect(empty).toMatchObject({ viewerId: 7, title: '', days: [] });
    expect(empty.places.size).toBe(0);
  });
});

describe('the Studio instructions', () => {
  it('ASTSCP-030: answer in the user language and teach the book; the trip prompt only points to the Studio', () => {
    const prompt = studioPrompt('German', true);
    expect(prompt).toContain('in German');
    expect(prompt).not.toContain('{language}');
    expect(prompt).toContain('get_book');
    expect(prompt).toContain('describe_book_page');
    expect(prompt).toContain('suggest_book_photos');
    expect(prompt).toContain('preview_book_page');
    // A design draft names photo ids too: the plan's rows and the photos it left out.
    expect(prompt).toContain(
      'a design draft (design_book, get_book_design, revise_book_design) or suggest_book_photos',
    );
    expect(prompt).not.toMatch(/[\u2013\u2014]/);
    expect(prompt).not.toContain('{photoSources}');
    // A viewer is offered none of the design's tools, so its prompt names none of them.
    const viewer = studioPrompt('German', false);
    expect(viewer).toContain('in German');
    expect(viewer).toContain('Photo ids come only from the book or suggest_book_photos.');
    for (const tool of ['design_book', 'get_book_design', 'revise_book_design', 'apply_book_design']) {
      expect(viewer, tool).not.toContain(tool);
    }
    expect(prompt.startsWith(viewer)).toBe(false);
    expect(systemPrompt('German')).toContain('You are the trip assistant inside TREK');
    expect(systemPrompt('German')).not.toContain('TREK Studio');
    expect(systemPrompt('German')).toContain('tell the user to open Studio from the journey');
  });
});

describe('the book context', () => {
  interface EntryRow {
    id: number;
    entry_date: string;
    title: string;
    type: string;
    dismissed: boolean;
    photos: object[];
  }
  const ALFAMA: EntryRow = {
    id: 40,
    entry_date: '2026-04-02',
    title: 'Alfama',
    type: 'entry',
    dismissed: false,
    photos: [{}, {}],
  };

  function journeysFake(role: 'owner' | 'editor' | 'viewer' | 'none', entries: EntryRow[]) {
    const journey = { id: 12, user_id: role === 'owner' ? 7 : 99, title: 'Portugal', subtitle: null };
    return {
      canAccessJourney: vi.fn(async () => (role === 'none' ? null : journey)),
      isOwner: vi.fn(async () => role === 'owner'),
      canEdit: vi.fn(async () => role === 'owner' || role === 'editor'),
      listEntries: vi.fn(async () => entries.map((entry) => ({ ...entry, location_name: null }))),
    };
  }

  function contextWith(role: 'owner' | 'editor' | 'viewer' | 'none', entries: EntryRow[] = [ALFAMA]) {
    const journeys = journeysFake(role, entries);
    const books = { overview: vi.fn(async () => BOOK) };
    const photos = {
      galleryFacts: vi.fn(async () => [
        { photo_id: 1, taken_at: '2026-04-02 10:00:00', lat: 38.71, lng: -9.13 },
        { photo_id: 2, taken_at: '2026-04-02 11:00:00', lat: null, lng: null },
        { photo_id: 3, taken_at: null, lat: 38.7, lng: null },
      ]),
    };
    // The user's own: photo 1 of the gallery, and 99, a video of theirs the facts leave out.
    const aiPhotos = { ownPhotoIds: vi.fn(async () => new Set([1, 99])) };
    const context = new AssistantBookContext(
      journeys as unknown as JourneyDomainService,
      books as unknown as JourneyBookEditService,
      photos as unknown as PhotoSignalsService,
      aiPhotos as unknown as JourneyAiPhotosService,
    );
    return { journeys, books, photos, aiPhotos, context };
  }

  it('ASTSCP-040: reads the card with the user rights: the book, the journey, the role, the gallery, the entries', async () => {
    const { books, journeys, photos, aiPhotos, context } = contextWith('owner');
    const read = await context.cardOf(7, 12, { spreadId: 'sp-cover' });
    expect(books.overview).toHaveBeenCalledWith(12, 7);
    expect(photos.galleryFacts).toHaveBeenCalledWith(12);
    expect(aiPhotos.ownPhotoIds).toHaveBeenCalledWith(12, 7);
    expect(read).toMatchObject({ journeyId: 12, title: 'Portugal', subtitle: null, role: 'owner', book: BOOK });
    expect(read.gallery).toEqual({ photos: 3, withTime: 2, withGps: 1, own: 1 });
    expect(read.entries).toEqual([{ id: 40, date: '2026-04-02', title: 'Alfama', place: null, photos: 2 }]);
    expect(read.focus).toEqual({ spreadId: 'sp-cover' });
    // The owner is read off the journey row, not asked for again.
    expect(journeys.isOwner).not.toHaveBeenCalled();
    expect(journeys.canEdit).not.toHaveBeenCalled();
    expect((await contextWith('editor').context.cardOf(7, 12, null)).role).toBe('editor');
    expect((await contextWith('viewer').context.cardOf(7, 12, null)).role).toBe('viewer');
  });

  it('ASTSCP-042: lists no entry waved away, and the suggestions only while nothing is written', async () => {
    const suggestion = { ...ALFAMA, id: 41, type: 'skeleton' };
    const dismissed = { ...ALFAMA, id: 42, dismissed: true };
    const written = await contextWith('editor', [ALFAMA, suggestion, dismissed]).context.cardOf(7, 12, null);
    expect(written.entries.map((entry) => entry.id)).toEqual([40]);
    const onlyPlanned = [suggestion, { ...dismissed, type: 'skeleton' }];
    const planned = await contextWith('editor', onlyPlanned).context.cardOf(7, 12, null);
    expect(planned.entries.map((entry) => entry.id)).toEqual([41]);
  });

  it('ASTSCP-041: tells who may open the journey and who may change its book', async () => {
    expect(await contextWith('viewer').context.canOpen(7, 12)).toBe(true);
    expect(await contextWith('none').context.canOpen(7, 12)).toBe(false);
    expect(await contextWith('viewer').context.canEdit(7, 12)).toBe(false);
    expect(await contextWith('editor').context.canEdit(7, 12)).toBe(true);
  });
});

describe('a scope opens its session and writes its turn', () => {
  const session = {
    read: vi.fn(async (name: string) =>
      name === 'get_trip_summary'
        ? { ok: true, value: { trip: { title: 'Kyoto' }, days: [] } }
        : { ok: true, value: { places: [{ id: 3, name: 'Kinkaku-ji' }] } },
    ),
    close: vi.fn(async () => undefined),
  };

  function scopesWith(canWrite: boolean) {
    const tools = {
      open: vi.fn(async () => session),
      openJourney: vi.fn(async () => session),
      openHome: vi.fn(async () => session),
    };
    const books = {
      canEdit: vi.fn(async () => canWrite),
      cardOf: vi.fn(async () => card({ role: canWrite ? 'editor' : 'viewer' })),
    };
    const settings = { getUserSettings: vi.fn(async () => ({ temperature_unit: 'celsius' })) };
    const studioGate = { refusalOf: vi.fn(async () => 'faults'), reader: session };
    const gate = { forTurn: vi.fn(() => studioGate) };
    const scopes = new AssistantScopes(
      tools as unknown as AssistantToolsService,
      books as unknown as AssistantBookContext,
      gate as unknown as AssistantBookGate,
      settings as unknown as SettingsService,
      t.orm,
    );
    return { tools, books, settings, scopes, gate, studioGate };
  }

  const turn = { userId: 7, locale: 'en', timeZone: 'UTC', focus: null, mentions: [], now: NOW };

  it('ASTSCP-050: a trip turn opens the trip session and reads the trip card, the units and the trip prompt', async () => {
    const { tools, scopes } = scopesWith(true);
    const opened = await scopes.open(7, tripScope(5));
    expect(tools.open).toHaveBeenCalledWith(7, 5, undefined);
    const read = await scopes.turnOf(opened, tripScope(5), turn);
    expect(read.card).toMatchObject({ tripId: 5, title: 'Kyoto' });
    expect(read.system).toBe(systemPrompt('English'));
    expect(read.context).toContain('temperatures in °C');
    expect(read.context).toContain('<trip_card>');
    // A trip's held calls pass as they are, and its cards read the session itself.
    expect(read.gate.reader).toBe(opened);
    expect(await read.gate.refusalOf('edit_book_page', { spreadId: 'sp-1', ops: [] })).toBeNull();
  });

  it('ASTSCP-051: a journey turn opens the Studio session with the user right to write, and reads the book card', async () => {
    session.read.mockClear();
    const editor = scopesWith(true);
    const opened = await editor.scopes.open(7, { kind: 'journey', journeyId: 12 });
    expect(editor.tools.openJourney).toHaveBeenCalledWith(7, 12, true, undefined);
    const targets = new Set(['restore_book_page']);
    const read = await editor.scopes.turnOf(opened, { kind: 'journey', journeyId: 12 }, turn);
    expect(editor.books.cardOf).toHaveBeenCalledWith(7, 12, null);
    expect(read.system).toBe(studioPrompt('English', true));
    expect(read.context).toContain('<book_card>');
    expect(read.card.tripId).toBe(0);
    expect(session.read).not.toHaveBeenCalled();
    // The Studio's book writes pass the book check of this turn.
    expect(editor.gate.forTurn).toHaveBeenCalledWith(7, 12, opened);
    expect(read.gate).toBe(editor.studioGate);

    const viewer = scopesWith(false);
    const viewing = await viewer.scopes.open(7, { kind: 'journey', journeyId: 12 }, targets);
    expect(viewer.tools.openJourney).toHaveBeenCalledWith(7, 12, false, targets);
    // A viewer's turn reads the instructions without the designer's rules.
    const viewed = await viewer.scopes.turnOf(viewing, { kind: 'journey', journeyId: 12 }, turn);
    expect(viewed.system).toBe(studioPrompt('English', false));
  });

  it('ASTSCP-053: a home turn opens the home session, reads the user trips through it and the home prompt', async () => {
    const { tools, scopes, books } = scopesWith(true);
    const targets = new Set(['delete_collection']);
    await scopes.open(7, { kind: 'home' }, targets);
    expect(tools.openHome).toHaveBeenCalledWith(7, targets);
    const homeSession = {
      ...session,
      read: vi.fn(async () => ({
        ok: true,
        value: { trips: [{ id: 5, title: 'Kyoto', start_date: '2026-08-01', end_date: '2026-08-09' }] },
      })),
    };
    const read = await scopes.turnOf(homeSession as never, { kind: 'home' }, turn);
    expect(homeSession.read).toHaveBeenCalledWith('list_trips', {});
    expect(read.system).toBe(homePrompt('English'));
    expect(read.context).toContain('<home_card>');
    expect(read.context).toContain('5 | Kyoto | next, 2026-08-01 to 2026-08-09');
    expect(read.context).toContain('temperatures in °C');
    expect(read.card.tripId).toBe(0);
    expect(books.cardOf).not.toHaveBeenCalled();
    // The home chat's held calls pass as a trip's do.
    expect(await read.gate.refusalOf('mark_country_visited', { country_code: 'JP' })).toBeNull();
  });

  it('ASTSCP-052: the trip card is read through the session, or on a session of its own two reads', async () => {
    session.read.mockClear();
    const fromSession = await tripCardFrom(session, 5, 7, { dayId: 2 });
    expect(fromSession).toMatchObject({ tripId: 5, viewerId: 7, focus: { dayId: 2 } });
    expect(fromSession.places.get(3)?.name).toBe('Kinkaku-ji');
    const tools = { open: vi.fn(async () => session) };
    session.close.mockClear();
    await readTripCard(tools as unknown as AssistantToolsService, 7, 5);
    expect(tools.open).toHaveBeenCalledWith(7, 5, new Set(['get_trip_summary', 'list_places']));
    expect(session.close).toHaveBeenCalledTimes(1);
  });
});
