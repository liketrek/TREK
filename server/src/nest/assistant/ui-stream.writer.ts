import type { SseStream } from '../common/sse-stream';
import {
  UI_STREAM_DONE,
  type AssistantActivity,
  type AssistantApplied,
  type AssistantCard,
  type AssistantChangePreview,
  type AssistantErrorCode,
  type AssistantFollowUps,
  type AssistantPageRender,
  type AssistantPageView,
  type AssistantPlaces,
  type AssistantWeather,
  type UiStreamChunk,
} from '@trek/shared';

type FinishReason = Extract<UiStreamChunk, { type: 'finish' }>['finishReason'];

/**
 * Writes an assistant turn as UI message stream chunks (`uiStreamChunkSchema`
 * in @trek/shared), one `data:` event each, closed by `data: [DONE]`.
 *
 * It keeps the bookkeeping the format asks for: a text run is opened with
 * `text-start` before its first delta and closed with `text-end` before
 * anything else is written, under its own id. Writes after `close()` (or after
 * the client went away) are dropped by the stream underneath.
 */
export class UiStreamWriter {
  private textId: string | null = null;
  private textRuns = 0;
  private closed = false;

  constructor(private readonly stream: SseStream) {}

  start(messageId: string): void {
    this.send({ type: 'start', messageId });
  }

  thread(threadId: number, title: string): void {
    this.send({ type: 'data-trek-thread', data: { threadId, title } });
  }

  startStep(): void {
    this.send({ type: 'start-step' });
  }

  finishStep(): void {
    this.endText();
    this.send({ type: 'finish-step' });
  }

  text(delta: string): void {
    if (!delta) return;
    if (this.textId === null) {
      this.textId = `txt-${this.textRuns++}`;
      this.send({ type: 'text-start', id: this.textId });
    }
    this.send({ type: 'text-delta', id: this.textId, delta });
  }

  /** A tool call with its arguments, as the user sees it. */
  toolInput(toolCallId: string, toolName: string, input: Record<string, unknown>): void {
    this.endText();
    this.send({ type: 'tool-input-start', toolCallId, toolName });
    this.send({ type: 'tool-input-available', toolCallId, toolName, input });
  }

  toolOutput(toolCallId: string, output: unknown): void {
    this.send({ type: 'tool-output-available', toolCallId, output });
  }

  toolError(toolCallId: string, errorText: string): void {
    this.send({ type: 'tool-output-error', toolCallId, errorText });
  }

  toolDenied(toolCallId: string): void {
    this.send({ type: 'tool-output-denied', toolCallId });
  }

  /** A held change: the call waits for the user, under its own id. */
  approvalRequest(toolCallId: string): void {
    this.send({ type: 'tool-approval-request', approvalId: toolCallId, toolCallId });
  }

  change(preview: AssistantChangePreview): void {
    this.send({ type: 'data-trek-change', data: preview });
  }

  applied(applied: AssistantApplied): void {
    this.send({ type: 'data-trek-applied', data: applied });
  }

  /** The places a search step found, as cards. */
  places(places: AssistantPlaces): void {
    this.send({ type: 'data-trek-places', data: places });
  }

  /** The weather a step looked up, one entry per date. */
  weather(weather: AssistantWeather): void {
    this.send({ type: 'data-trek-weather', data: weather });
  }

  /** What the model offers to ask next, at the end of an answer. */
  followUps(followUps: AssistantFollowUps): void {
    this.send({ type: 'data-trek-follow-ups', data: followUps });
  }

  /** The card of one tool call: a read's beside the answer, an applied write's beside its receipt. */
  card(data: AssistantCard): void {
    this.send({ type: 'data-trek-card', data });
  }

  /** Where a step that is about to run looks; only streamed, the message never keeps it. */
  activity(activity: AssistantActivity): void {
    this.endText();
    this.send({ type: 'data-trek-activity', data: activity, transient: true });
  }

  /** A Studio page the turn asks the Studio tab to draw and upload; only streamed, the message never keeps it. */
  renderRequest(request: AssistantPageRender): void {
    this.endText();
    this.send({ type: 'data-trek-render-request', data: request, transient: true });
  }

  /** A Studio page the turn looked at: what it was and its description, never the image. */
  pageView(view: AssistantPageView): void {
    this.send({ type: 'data-trek-page-view', data: view });
  }

  quota(used: number, limit: number): void {
    this.send({ type: 'data-trek-quota', data: { used, limit } });
  }

  finish(finishReason?: FinishReason): void {
    this.endText();
    this.send(finishReason ? { type: 'finish', finishReason } : { type: 'finish' });
  }

  error(code: AssistantErrorCode): void {
    this.endText();
    this.send({ type: 'error', errorText: code });
  }

  abort(): void {
    this.endText();
    this.send({ type: 'abort' });
  }

  /** Ends the stream with the done marker; anything written after this is dropped. */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.stream.send(UI_STREAM_DONE);
    this.stream.end();
  }

  private endText(): void {
    if (this.textId === null) return;
    this.send({ type: 'text-end', id: this.textId });
    this.textId = null;
  }

  private send(chunk: UiStreamChunk): void {
    if (!this.closed) this.stream.send(JSON.stringify(chunk));
  }
}
