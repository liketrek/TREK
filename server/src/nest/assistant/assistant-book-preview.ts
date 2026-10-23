import type { AiToolSpec } from '../ai-connections/ai-chat-client.interface';
import type { AgentToolPort, AgentToolRun } from './assistant-agent';
import { PREVIEW_BOOK_PAGE_TOOL } from './assistant-tools.constants';
import type { TurnVision } from './assistant-vision';
import { ASSISTANT_PAGE_IMAGE, previewBookPageRequestSchema } from '@trek/shared';

/**
 * `preview_book_page`, offered in every Studio turn beside the session's own
 * tools (journey-studio.md 4.3, step 2): a read that answers one page in words
 * with its findings, as it stands or as an `edit_book_page` with the given
 * ops would leave it, and for a model that reads images the page as the
 * Studio draws it (AssistantVision). Nothing is saved; the change itself is
 * proposed afterwards like any other.
 *
 * Its `ops` take exactly the schema `edit_book_page` takes in this session,
 * so a preview and the edit it checks are one shape. A session without that
 * tool (a viewer's) previews pages as they stand. Previews are capped per
 * step and per turn, since each can wait seconds for the Studio and costs a
 * model an image.
 */

const EDIT_TOOL = 'edit_book_page';

/** What a look answers, whoever looks. */
const SEES =
  'its elements, its findings (overlaps, words past their frame, empty frames, low resolution, content in the ' +
  'fold) and, when your model reads images, the page as the Studio draws it, with photos of other contributors ' +
  'left as empty frames.';

const CAPS =
  `At most ${ASSISTANT_PAGE_IMAGE.previewsPerStep} previews per step and ${ASSISTANT_PAGE_IMAGE.previewsPerTurn} ` +
  'per turn.';

/** For a session that may change the book: a proposed edit and a design draft can be looked at too. */
const EDITOR_DESCRIPTION =
  `Look at one page of the book before you change it or after: ${SEES} With ops (the same ops edit_book_page ` +
  'takes) you see the page as that edit would leave it, without saving anything. Preview a page once before you ' +
  'propose an edit of it, fix what the findings or the image show, then propose the edit. With designId (from ' +
  `design_book) you see the page of that design draft instead of the book. ${CAPS}`;

/** For a session without edit_book_page (a viewer's): the page as it stands, nothing it could not ask for. */
const READER_DESCRIPTION = `Look at one page of the book as it stands: ${SEES} ${CAPS}`;

/** The draft a preview may look at instead of the book, by design_book's design_id. */
const DESIGN_ID = { type: 'string', pattern: '^[\\w-]{1,40}$', description: 'A design draft, by its design_id.' };

const TOO_MANY =
  `Too many previews: at most ${ASSISTANT_PAGE_IMAGE.previewsPerStep} in one step and ` +
  `${ASSISTANT_PAGE_IMAGE.previewsPerTurn} in one turn. Propose the edit and let its card show the findings.`;

/** The preview's spec, its ops taken from the session's `edit_book_page` when it has that tool. */
function previewSpec(specs: readonly AiToolSpec[]): AiToolSpec {
  const edit = specs.find((spec) => spec.name === EDIT_TOOL);
  const properties = (edit?.parameters.properties ?? {}) as Record<string, unknown>;
  const ops = properties.ops;
  // Shared parts the ops point at, where the schema keeps them apart.
  const shared: Record<string, unknown> = {};
  for (const key of ['$defs', 'definitions']) if (edit?.parameters[key]) shared[key] = edit.parameters[key];
  return {
    name: PREVIEW_BOOK_PAGE_TOOL,
    description: ops ? EDITOR_DESCRIPTION : READER_DESCRIPTION,
    parameters: {
      type: 'object',
      properties: {
        spreadId: { type: 'string', pattern: '^[\\w-]{1,40}$', description: 'The page, by its id from get_book.' },
        // A design draft is an editor's: a session without the edit tool previews the book only.
        ...(ops ? { ops, designId: DESIGN_ID } : {}),
      },
      required: ['spreadId'],
      additionalProperties: false,
      ...(ops ? shared : {}),
    },
  };
}

/** The session's tools with the preview beside them, answered through the turn's vision. */
export function withPagePreview(tools: AgentToolPort, vision: TurnVision): AgentToolPort {
  let inStep = 0;
  let inTurn = 0;
  const preview = async (args: Record<string, unknown>): Promise<AgentToolRun> => {
    if (inStep >= ASSISTANT_PAGE_IMAGE.previewsPerStep || inTurn >= ASSISTANT_PAGE_IMAGE.previewsPerTurn) {
      return { ok: false, value: TOO_MANY };
    }
    const parsed = previewBookPageRequestSchema.safeParse(args);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const detail = issue ? [issue.path.join('.'), issue.message].join(' ') : '';
      return { ok: false, value: `Invalid arguments: ${detail}` };
    }
    inStep += 1;
    inTurn += 1;
    const { spreadId, ops, designId } = parsed.data;
    return designId ? vision.look(spreadId, ops, designId) : vision.look(spreadId, ops);
  };
  return {
    // The loop asks for the specs once at the start of every step: a new step may preview again.
    specs: () => {
      inStep = 0;
      const listed = tools.specs();
      return [...listed, previewSpec(listed)];
    },
    kindOf: (name) => (name === PREVIEW_BOOK_PAGE_TOOL ? 'read' : tools.kindOf(name)),
    pinArgs: (name, args) => {
      if (name !== PREVIEW_BOOK_PAGE_TOOL) return tools.pinArgs(name, args);
      // The journey is the conversation's; the preview takes no other argument for it.
      const { journeyId: _journeyId, ...rest } = args;
      return { args: rest };
    },
    call: (name, args) => (name === PREVIEW_BOOK_PAGE_TOOL ? preview(args) : tools.call(name, args)),
  };
}
