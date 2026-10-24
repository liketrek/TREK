/**
 * withPagePreview (ASTPVW-*): a Studio turn's tools with `preview_book_page`
 * beside them. The preview takes the session's own `edit_book_page` ops
 * schema, runs as a read through the turn's vision, refuses arguments it does
 * not take, and is capped per step and per turn, more while an editor's turn
 * designs the book.
 */
import type { AgentToolPort, AgentToolRun } from '../../../../src/nest/assistant/assistant-agent';
import { withPagePreview } from '../../../../src/nest/assistant/assistant-book-preview';
import type { TurnVision } from '../../../../src/nest/assistant/assistant-vision';
import { ASSISTANT_PAGE_IMAGE } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const OPS_SCHEMA = { type: 'array', items: { $ref: '#/$defs/op' } };
const EDIT = {
  name: 'edit_book_page',
  description: 'Edit a page',
  parameters: { type: 'object', properties: { spreadId: { type: 'string' }, ops: OPS_SCHEMA }, $defs: { op: {} } },
};

function setup(specs = [EDIT]) {
  const session: AgentToolPort = {
    specs: () => specs,
    kindOf: (name) => (name === 'edit_book_page' ? 'write' : 'read'),
    pinArgs: vi.fn((_name: string, args: Record<string, unknown>) => ({ args })),
    call: vi.fn(async (): Promise<AgentToolRun> => ({ ok: true, value: 'session' })),
  };
  const looked: AgentToolRun = { ok: true, value: { description: 'Page 2' } };
  const vision = {
    sendsImages: () => true,
    look: vi.fn(async () => looked),
    refused: vi.fn(),
    afterApply: vi.fn(async () => []),
  };
  return { session, vision, looked, tools: withPagePreview(session, vision as TurnVision) };
}

describe('withPagePreview', () => {
  it('ASTPVW-001: offers the preview after the session tools, its ops as the session edit_book_page takes them', () => {
    const { tools } = setup();
    const specs = tools.specs();
    expect(specs.map((spec) => spec.name)).toEqual(['edit_book_page', 'preview_book_page']);
    expect(specs[1]?.parameters).toMatchObject({
      properties: { spreadId: { type: 'string' }, ops: OPS_SCHEMA },
      required: ['spreadId'],
      additionalProperties: false,
      $defs: { op: {} },
    });
    // A viewer has no edit tool: the preview shows pages as they stand.
    const viewer = setup([]).tools.specs()[0];
    expect(viewer?.parameters.properties).toEqual({ spreadId: expect.objectContaining({ type: 'string' }) });
    expect(viewer?.parameters).not.toHaveProperty('$defs');
  });

  it('ASTPVW-006: a session without edit_book_page is told of no ops, design drafts or edit tools', () => {
    const viewer = setup([]).tools.specs()[0];
    expect(viewer?.description).toContain('as it stands');
    expect(viewer?.description).not.toMatch(/edit_book_page|design_book|designId|ops/);
    const editor = setup().tools.specs()[1];
    expect(editor?.description).toContain('edit_book_page');
    expect(editor?.description).toContain('designId');
    for (const spec of [viewer, editor]) {
      expect(spec?.description).toContain(`At most ${ASSISTANT_PAGE_IMAGE.previewsPerStep} previews per step`);
      expect(spec?.description).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it('ASTPVW-002: the preview is a read through the vision; every other tool stays the session one', async () => {
    const { tools, session, vision, looked } = setup();
    expect(tools.kindOf('preview_book_page')).toBe('read');
    expect(tools.kindOf('edit_book_page')).toBe('write');
    const pinned = tools.pinArgs('preview_book_page', { spreadId: 'sp-2', journeyId: 12 });
    expect(pinned).toEqual({ args: { spreadId: 'sp-2' } });
    expect(session.pinArgs).not.toHaveBeenCalled();
    tools.pinArgs('edit_book_page', { spreadId: 'sp-2' });
    expect(session.pinArgs).toHaveBeenCalledWith('edit_book_page', { spreadId: 'sp-2' });

    const ops = [{ op: 'background', color: '#112233' }];
    expect(await tools.call('preview_book_page', { spreadId: 'sp-2', ops })).toBe(looked);
    expect(vision.look).toHaveBeenCalledWith('sp-2', ops);
    expect(await tools.call('get_book', {})).toEqual({ ok: true, value: 'session' });
    expect(session.call).toHaveBeenCalledWith('get_book', {});
  });

  it('ASTPVW-003: arguments the preview does not take are refused without a look', async () => {
    const { tools, vision } = setup();
    const refused = await tools.call('preview_book_page', { spreadId: '../x' });
    expect(refused).toMatchObject({ ok: false, value: expect.stringContaining('Invalid arguments: spreadId') });
    expect((await tools.call('preview_book_page', { spreadId: 'sp-2', ops: [] })).ok).toBe(false);
    expect(vision.look).not.toHaveBeenCalled();
  });

  it('ASTPVW-004: previews are capped per step, which the next step resets, and per turn', async () => {
    const { tools, vision } = setup();
    expect(ASSISTANT_PAGE_IMAGE).toMatchObject({ previewsPerStep: 3, previewsPerTurn: 8 });
    const preview = () => tools.call('preview_book_page', { spreadId: 'sp-2' });
    /** `count` previews one after another, as the loop runs a step's calls; whether each was answered. */
    const previews = (count: number) =>
      Array.from({ length: count }).reduce<Promise<boolean[]>>(
        async (done) => [...(await done), (await preview()).ok],
        Promise.resolve([]),
      );
    tools.specs();
    expect(await previews(4)).toEqual([true, true, true, false]);
    expect(await preview()).toMatchObject({ ok: false, value: expect.stringContaining('Too many previews') });
    tools.specs();
    expect(await previews(3)).toEqual([true, true, true]);
    tools.specs();
    expect(await previews(3)).toEqual([true, true, false]);
    expect(vision.look).toHaveBeenCalledTimes(8);
  });

  it('ASTPVW-005: a session that edits may preview a page of a design draft by its designId; a viewer is not offered it', async () => {
    const { tools, vision, looked } = setup();
    expect(tools.specs()[1]?.parameters.properties).toHaveProperty('designId');
    expect(setup([]).tools.specs()[0]?.parameters.properties).not.toHaveProperty('designId');

    expect(await tools.call('preview_book_page', { spreadId: 'sp-2', designId: 'd-1' })).toBe(looked);
    expect(vision.look).toHaveBeenCalledWith('sp-2', undefined, 'd-1');
    const refused = await tools.call('preview_book_page', { spreadId: 'sp-2', designId: '../d' });
    expect(refused).toMatchObject({ ok: false, value: expect.stringContaining('designId') });
  });

  it('ASTPVW-007: a turn that designs the book may look at sixteen pages, still three a step', async () => {
    const { tools, vision, session } = setup();
    expect(ASSISTANT_PAGE_IMAGE).toMatchObject({ previewsPerDesignTurn: 16, perRequest: 3 });
    const preview = () => tools.call('preview_book_page', { spreadId: 'sp-2' });
    /** One step of `count` previews, one after another as the loop runs them; whether each was answered. */
    const step = (count: number) => {
      tools.specs();
      return Array.from({ length: count }).reduce<Promise<boolean[]>>(
        async (done) => [...(await done), (await preview()).ok],
        Promise.resolve([]),
      );
    };
    // Eight in a turn before any design is in play, as before.
    const before = [...(await step(3)), ...(await step(3)), ...(await step(3))];
    expect(before).toEqual([true, true, true, true, true, true, true, true, false]);
    // design_book goes to the session, and from then on the turn may look at sixteen.
    await tools.call('design_book', { directives: {} });
    expect(session.call).toHaveBeenCalledWith('design_book', { directives: {} });
    const more = [...(await step(4)), ...(await step(3)), ...(await step(3))];
    expect(more).toEqual([true, true, true, false, true, true, true, true, true, false]);
    expect(vision.look).toHaveBeenCalledTimes(16);
    expect((await preview()).value).toEqual(expect.stringContaining('16 while a book design is in play'));
  });

  it('ASTPVW-008: looking at a design draft or revising one puts the design in play too', async () => {
    /** `count` previews, each in a step of its own. */
    const looks = (tools: AgentToolPort, count: number, args: Record<string, unknown>) =>
      Array.from({ length: count }).reduce<Promise<void>>(async (done) => {
        await done;
        tools.specs();
        await tools.call('preview_book_page', args);
      }, Promise.resolve());
    const drafted = setup();
    await looks(drafted.tools, 12, { spreadId: 'sp-2', designId: 'd-1' });
    expect(drafted.vision.look).toHaveBeenCalledTimes(12);
    const revised = setup();
    // The loop asks for the specs at the start of the step that revises.
    revised.tools.specs();
    await revised.tools.call('revise_book_design', { designId: 'd-1', spreadId: 'sp-2', ops: [] });
    await looks(revised.tools, 10, { spreadId: 'sp-2' });
    expect(revised.vision.look).toHaveBeenCalledTimes(10);
    const editor = setup().tools.specs()[1];
    expect(editor?.description).toContain('16 in a turn that designs the book');
  });

  it('ASTPVW-009: only an editor whose design run or draft look came back puts the design in play', async () => {
    /** `count` previews, each in a step of its own; how many the vision was asked for. */
    const looks = async (made: ReturnType<typeof setup>, count: number, args: Record<string, unknown>) => {
      await Array.from({ length: count }).reduce<Promise<void>>(async (done) => {
        await done;
        made.tools.specs();
        await made.tools.call('preview_book_page', args);
      }, Promise.resolve());
      return made.vision.look.mock.calls.length;
    };
    // A viewer is offered no designId; passing one anyway keeps the plain budget.
    const viewer = setup([]);
    expect(await looks(viewer, 10, { spreadId: 'sp-2', designId: 'd-1' })).toBe(8);
    expect((await viewer.tools.call('preview_book_page', { spreadId: 'sp-2' })).value).not.toContain('design');
    // A design_book that failed puts nothing in play.
    const failed = setup();
    failed.tools.specs();
    vi.mocked(failed.session.call).mockResolvedValueOnce({ ok: false, value: 'Invalid directives' });
    expect((await failed.tools.call('design_book', { directives: {} })).ok).toBe(false);
    expect(await looks(failed, 10, { spreadId: 'sp-2' })).toBe(8);
    // Nor does a draft the look could not find.
    const missing = setup();
    missing.vision.look.mockResolvedValue({ ok: false, value: 'No such design' });
    expect(await looks(missing, 10, { spreadId: 'sp-2', designId: 'd-9' })).toBe(8);
  });
});
