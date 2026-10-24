import type { AiChatMessage, AiImage } from '../ai-chat-client.interface';

type ToolMessage = Extract<AiChatMessage, { role: 'tool' }>;

/** An image as the data URL the OpenAI-style APIs read: base64 in the request, never a link to TREK. */
export function imageDataUrl(image: AiImage): string {
  return `data:${image.mimeType};base64,${image.data}`;
}

/** The line an image of a tool result is introduced with, where it has to travel in a user message. */
export function toolImageCaption(message: ToolMessage): string {
  return `The image the call ${message.name} (${message.toolCallId}) produced:`;
}

/**
 * The tool results with images whose run ends at `index`: an API that takes
 * no image inside a tool result (Chat Completions, Responses) gets them in
 * one user message after the last result of the step, since the results must
 * follow the assistant's calls directly. Empty while the run goes on, or when
 * nothing in it carried an image.
 */
export function toolImagesEndingAt(messages: readonly AiChatMessage[], index: number): ToolMessage[] {
  if (messages[index]?.role !== 'tool' || messages[index + 1]?.role === 'tool') return [];
  let start = index;
  while (start > 0 && messages[start - 1]?.role === 'tool') start--;
  return messages
    .slice(start, index + 1)
    .filter((message): message is ToolMessage => message.role === 'tool' && (message.images?.length ?? 0) > 0);
}
