/**
 * withPagePreview (ASTPVW-*): a Studio turn's tools with `preview_book_page`
 * beside them. The preview takes the session's own `edit_book_page` ops
 * schema, runs as a read through the turn's vision, refuses arguments it does
 * not take, and is capped per step and per turn.
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
});
