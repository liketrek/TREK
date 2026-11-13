import type { AiConnectionRow } from '../../db/repositories/AiConnections.repository';
import type {
  StructuredReadAnswer,
  StructuredReader,
  StructuredReadRequest,
} from '../llm-parse/llm-provider.interface';
import { AiChatClientService } from './ai-chat-client.service';
import { ChatgptAuthService } from './chatgpt-auth.service';
import { Injectable } from '@nestjs/common';

/**
 * Lends a ChatGPT plan to AI parsing. Parsing's own clients call an endpoint
 * with a key; a plan signs in instead, and only the Responses client here
 * holds its token. So parsing gets a reader: one document per call, the shape
 * to fill offered as the single tool the model has to call. The token is read
 * per call, refreshed when it is about to expire or refused; a sign-in that
 * cannot be renewed is marked by ChatgptAuthService and the next resolve lends
 * nothing.
 */
@Injectable()
export class ChatgptParsingReader {
  constructor(
    private readonly chatgpt: ChatgptAuthService,
    private readonly clients: AiChatClientService,
  ) {}

  /** The reader for one ChatGPT connection, with the model it is saved with. */
  readerFor(row: AiConnectionRow, model: string): StructuredReader {
    return (request) => this.read(row, model, request);
  }

  /**
   * @txIndependent writes nothing itself: a token refresh is stored by ChatgptAuthService under its own
   * lock, complete on its own, with the model call (network I/O) after it.
   */
  private async read(
    row: AiConnectionRow,
    model: string,
    request: StructuredReadRequest,
  ): Promise<StructuredReadAnswer> {
    const client = this.clients.chatgptPlan(row.id, model, await this.chatgpt.accessToken(row));
    let filled: Record<string, unknown> | null = null;
    let text = '';
    const turn = client.stream(
      {
        system: request.system,
        messages: [{ role: 'user', text: request.text, images: request.images }],
        tools: [request.shape],
        toolChoice: 'required',
      },
      request.signal,
    );
    for await (const event of turn) {
      // The one tool offered is the shape; its first call is the answer.
      if (event.type === 'tool-call' && filled === null) filled = event.call.args;
      else if (event.type === 'text-delta') text += event.delta;
    }
    return filled ? { filled } : { text };
  }
}
