import { writeToolOf } from '../assistant-tools.constants';
import type { UiStreamWriter } from '../ui-stream.writer';
import type { ToolArgs } from './card-types';
import { appliedCardOf } from './registry';
import type { AssistantChangePreview, AssistantMessagePart, TrekCard } from '@trek/shared';

/** Builds the card of an applied change of `tool`; null when the tool has none. */
type AppliedCardBuilder = (
  tool: string,
  input: { args: ToolArgs; result: unknown; preview: AssistantChangePreview | null },
) => TrekCard | null;

/**
 * The card of an applied change, streamed and kept beside its receipt under
 * the write's own id, so the client puts it in place of the preview card. Its
 * builder gets no trip card (the decisions run before the turn reads one): it
 * builds on the stored preview card and the tool's raw answer.
 */
export function receiptCard(
  w: Pick<UiStreamWriter, 'card'>,
  receipts: AssistantMessagePart[],
  call: { id: string; tool_name: string },
  args: ToolArgs,
  result: unknown,
  preview: AssistantChangePreview | null,
  build: AppliedCardBuilder = appliedCardOf,
): void {
  const card = build(writeToolOf(call.tool_name, args), { args, result, preview });
  if (!card) return;
  const data = { toolCallId: call.id, card };
  w.card(data);
  receipts.push({ type: 'data-trek-card', data });
}
