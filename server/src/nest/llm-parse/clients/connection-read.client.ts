import { readEnv } from '../../../app-config';
import { parseLenientJson, toReservationList } from '../lenient-json';
import type {
  LlmExtractionClient,
  LlmExtractionInput,
  StructuredReader,
  StructuredReadImage,
} from '../llm-provider.interface';
import { UnreadableLlmResponse, USER_TEXT } from './openai-compatible.client';

/** The image types a structured read carries; anything else reaches the model as text or not at all. */
const IMAGE_TYPES: ReadonlySet<string> = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Extraction on a connection the AI connections module lends as a reader (a
 * ChatGPT plan). The document goes as text plus its images, the schema as the
 * one tool the model has to call; what it fills is the answer. A native PDF
 * never arrives here: llm-parse.service.ts sends it as text, or a scan as its
 * pages drawn as images. Bounded by LLM_TIMEOUT_MS like the other clients.
 */
export class ConnectionReadClient implements LlmExtractionClient {
  constructor(private readonly read: StructuredReader) {}

  async extract(input: LlmExtractionInput): Promise<Record<string, unknown>[]> {
    const rootKey = input.rootKey ?? 'reservations';
    const userText = input.userText ?? USER_TEXT;
    const answer = await this.read({
      system: input.prompt,
      text: input.text ? `${userText}\n\n${input.text}` : userText,
      images: imagesOf(input),
      shape: {
        name: `record_${rootKey}`,
        description: `Record the ${rootKey} found in the document, as an empty list when there are none.`,
        parameters: input.jsonSchema as Record<string, unknown>,
      },
      signal: AbortSignal.timeout(readEnv().integrations.llmTimeoutMs),
    });
    if ('filled' in answer) return toReservationList(answer.filled, rootKey);
    // A model that wrote the shape as text instead of calling the tool; prose is no answer.
    const written = parseLenientJson(answer.text);
    if (!written || typeof written !== 'object') {
      throw new UnreadableLlmResponse('The model answered without filling the requested shape');
    }
    return toReservationList(written, rootKey);
  }
}

/** The document's photo or scanned pages, in order, those of a type the read carries. */
function imagesOf(input: LlmExtractionInput): StructuredReadImage[] {
  const files = input.file ? [input.file, ...(input.pageImages ?? [])] : [];
  return files
    .filter((file) => IMAGE_TYPES.has(file.mimeType))
    .map((file) => ({
      mimeType: file.mimeType as StructuredReadImage['mimeType'],
      data: file.data.toString('base64'),
    }));
}
