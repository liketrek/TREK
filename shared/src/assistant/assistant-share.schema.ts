import { z } from 'zod';

/**
 * POST /api/trips/:tripId/assistant/threads/:threadId/messages/:messageId/share:
 * posts the text of an assistant answer to the trip's chat, marked as shared
 * from the assistant. The text is what the user saw in the preview; the
 * server checks that the answer is theirs and in this trip, not the words.
 * It answers with the chat message (`collabMessageResponseSchema`).
 */
export const assistantShareRequestSchema = z
  .object({
    text: z.string().trim().min(1).max(5000),
  })
  .strict();
export type AssistantShareRequest = z.infer<typeof assistantShareRequestSchema>;
