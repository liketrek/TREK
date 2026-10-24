import '../../styles/studio-assistant.css';
import '../Assistant/assistant.css';

import { ImageIcon, MessageSquare } from 'lucide-react';
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useTranslation } from '../../i18n';
import { useAssistantStore } from '../../store/assistantStore';
import { FRAME_CLASS, useAssistantFrame } from '../Assistant/assistantFrame';
import AssistantFrameEdges from '../Assistant/AssistantFrameEdges';
import AssistantHeader from '../Assistant/AssistantHeader';
import AssistantSurfaceLazy from '../Assistant/AssistantSurfaceLazy';
import type { EntityTarget } from '../Assistant/cards/cardTypes';
import { providerLabel } from '../Assistant/providerCatalog';
import { useAssistantThread } from '../Assistant/useAssistantThread';
import { useToast } from '../shared/Toast';
import { sheetSizePx } from './pageSnapshot';
import { SpreadView } from './SpreadView';
import type { StudioAssistant, StudioRenderJob } from './useStudioAssistant';

/**
 * The assistant in TREK Studio (journey-studio.md 4.5): the same chat as the
 * planner's window, on the journey's conversations, in the same floating
 * window, moved by its head and resized from its edges, so it never takes
 * room from the page it talks about. Desktop only, like the Studio itself.
 *
 * Studio closes on Escape and edits the selection on Delete, copy and paste.
 * Inside the window every key belongs to the chat, so it stops here, and
 * Escape stops a running answer first. A key from the header's menu, which
 * sits in a portal, is not the chat's to act on.
 */

/** Where the Studio's window is kept between visits, apart from the planner's. */
const STUDIO_WINDOW_STORAGE = 'trek.studioAssistantWindow';
/** The Studio's own bar at the top, which the window's head never goes under. */
const STUDIO_BAR_PX = 56;
/** Narrower than this, the chat lays its cards out compact, as in the planner's window. */
const ROOMY_WIDTH = 480;

/**
 * Images of a page leave only once the user agreed, per connection. Until
 * then the Studio's assistant reads the pages as text. "Not now" hides the
 * notice for this visit; the next one asks again. A model that reads no
 * images (a custom server, OpenRouter, an OpenAI text-only model) is never
 * asked: its pages always go as text.
 */
function StudioImagesNotice() {
  const { t } = useTranslation();
  const toast = useToast();
  const effective = useAssistantStore((s) => s.status?.effective ?? null);
  const reads = useAssistantStore((s) => s.status?.studioImages === true);
  const acked = useAssistantStore((s) => s.status?.studioImagesAcked === true);
  const ackStudioImages = useAssistantStore((s) => s.ackStudioImages);
  const [later, setLater] = useState(false);

  if (!effective || !reads || acked || later) return null;
  const provider = providerLabel(effective.kind, effective.host);

  const allow = async () => {
    try {
      await ackStudioImages();
    } catch {
      toast.error(t('assistant.error.generic'));
    }
  };

  return (
    <div
      role="note"
      className="st-assistant-notice rounded-lg border border-edge-faint bg-surface-secondary px-3 py-2.5 text-caption text-content-secondary"
    >
      <div className="flex items-start gap-2.5">
        <ImageIcon size={14} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-content-muted" />
        <p className="m-0 min-w-0 flex-1">{t('journey.studio.assistant.notice', { provider })}</p>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setLater(true)}
          className="rounded-md px-2 py-1 text-caption text-content-muted hover:bg-surface-hover hover:text-content"
        >
          {t('journey.studio.assistant.noticeLater')}
        </button>
        <button
          type="button"
          onClick={() => void allow()}
          className="rounded-md px-2 py-1 text-caption font-medium text-accent-on hover:bg-surface-hover"
        >
          {t('journey.studio.assistant.noticeAllow')}
        </button>
      </div>
    </div>
  );
}

/** One page a turn asked for, drawn as the editor draws it and handed on once it is in the DOM. */
function StageSheet({
  job,
  onDrawn,
}: {
  job: StudioRenderJob;
  onDrawn: (job: StudioRenderJob, sheet: HTMLElement) => Promise<void>;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  // A job goes up once, even when the effect runs again (development's double run, a new callback).
  const sent = useRef<StudioRenderJob | null>(null);
  const size = sheetSizePx(job.spread, job.page);

  useEffect(() => {
    if (!sheet.current || sent.current === job) return;
    sent.current = job;
    void onDrawn(job, sheet.current);
  }, [job, onDrawn]);

  return (
    // A page is laid out in millimetres from its top left whatever the reading direction.
    <div ref={sheet} dir="ltr" style={{ position: 'relative', width: size.width, height: size.height }}>
      <SpreadView spread={job.spread} page={job.page} folios={job.folios} print hiddenPhotoIds={job.hidden} />
    </div>
  );
}

/**
 * The pages being drawn for a turn, where nobody sees them. Off screen rather
 * than hidden, as StudioExport does it: a hidden subtree lays nothing out,
 * and the page is measured in millimetres by the CSS that draws it.
 */
export function StudioPageStage({ assistant }: { assistant: StudioAssistant }) {
  if (assistant.jobs.length === 0) return null;
  return (
    <div
      aria-hidden="true"
      className="st-assistant-stage"
      style={{ position: 'fixed', insetInlineStart: '-20000mm', top: 0, pointerEvents: 'none' }}
    >
      {assistant.jobs.map((job) => (
        <StageSheet key={job.request.requestId} job={job} onDrawn={assistant.drawn} />
      ))}
    </div>
  );
}

export default function StudioAssistantPanel({
  assistant,
  title,
  bookVersion,
}: {
  assistant: StudioAssistant;
  title: string;
  /** The stored book's version the open book stands on, for the book's cards in the chat. */
  bookVersion?: number | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const thread = useAssistantThread(assistant.chatKey);
  const { isRunning, stop } = thread;
  const frame = useAssistantFrame(STUDIO_WINDOW_STORAGE, STUDIO_BAR_PX);

  // A card points at a page of this book (`?page=`) or somewhere else in the app.
  const onOpen = useCallback(
    (target: EntityTarget) => {
      if (target.kind === 'page') void navigate(target.path);
    },
    [navigate]
  );

  // Every key pressed in the window is the chat's: the editor's own keys
  // (Delete, Backspace, copy, paste, undo, Escape) listen on the window and
  // would otherwise act on the page's selection from a focused chat button.
  // Keys from a portal (the header's menu) bubble here through React too;
  // they stop here as well, but they are not the chat's to act on.
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const inside = e.currentTarget.contains(e.target as Node);
    e.stopPropagation();
    if (!inside) return;
    frame.onKeyDown(e);
    if (e.key === 'Escape' && isRunning && !e.defaultPrevented) stop();
  };

  return (
    <aside
      className={`st-assistant ${FRAME_CLASS} flex ${frame.active ? 'select-none' : 'trek-assistant-settle'}`}
      aria-label={t('journey.studio.assistant.panel')}
      onKeyDown={onKeyDown}
      style={{ insetInlineStart: frame.rect.x, top: frame.rect.y, width: frame.rect.width, height: frame.rect.height }}
    >
      <AssistantFrameEdges frame={frame} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
        <AssistantHeader
          tripId={assistant.chatKey}
          thread={thread}
          tripTitle={title}
          dragProps={frame.handleProps}
          onClose={assistant.toggle}
        />
        <StudioImagesNotice />
        <AssistantSurfaceLazy
          tripId={assistant.chatKey}
          tripTitle={title}
          variant="window"
          density={frame.rect.width < ROOMY_WIDTH ? 'compact' : 'roomy'}
          onOpen={onOpen}
          bookVersion={bookVersion}
        />
      </div>
    </aside>
  );
}

/** The Studio bar's switch for the window; only where the assistant can run for this user. */
export function StudioAssistantToggle({ assistant }: { assistant: StudioAssistant }) {
  const { t } = useTranslation();
  if (!assistant.available) return null;
  return (
    <button
      type="button"
      className={`st-tool is-icon st-head-solo st-assistant-toggle ${assistant.open ? 'is-on' : ''}`}
      onClick={assistant.toggle}
      aria-pressed={assistant.open}
      aria-label={t('journey.studio.assistant.toggle')}
      title={t('journey.studio.assistant.toggleHint')}
    >
      <MessageSquare size={15} />
    </button>
  );
}

/** The chat window over the Studio, while it is open, named after the journey. */
export function StudioAssistantColumn({
  assistant,
  title,
  bookVersion,
}: {
  assistant: StudioAssistant;
  title?: string;
  bookVersion?: number | null;
}) {
  const { t } = useTranslation();
  if (!assistant.open) return null;
  return <StudioAssistantPanel assistant={assistant} title={title || t('journey.title')} bookVersion={bookVersion} />;
}
