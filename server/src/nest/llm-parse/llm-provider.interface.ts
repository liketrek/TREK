/** A single binary file (a PDF, or a photo) sent natively to a provider that reads it. */
export interface LlmExtractionFile {
  mimeType: string;
  data: Buffer;
}

/** Everything a provider client needs to extract reservations from one document. */
export interface LlmExtractionInput {
  /** System instructions enumerating the schema.org shape (see llm-prompt.ts). */
  prompt: string;
  /** JSON Schema describing `{ reservations: KiReservation[] }`. */
  jsonSchema: object;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  /** Pre-extracted text (text-like files, or text-only-model mode). */
  text?: string;
  /** Native binary: a PDF for Anthropic, a photo for a model that reads images. */
  file?: LlmExtractionFile;
  /** The following pages of a scanned PDF, as images after `file`, which holds the first. */
  pageImages?: LlmExtractionFile[];
  /**
   * The key the answer's array sits under, `jsonSchema` being `{ [rootKey]: [...] }`.
   * Defaults to `reservations`; the receipt read asks for `receipts`.
   */
  rootKey?: string;
  /** The user-turn instruction. Defaults to the booking import's. */
  userText?: string;
}

/**
 * A provider client turns one document into raw schema.org reservation objects.
 * It returns the parsed `reservations` array (best-effort: `[]` on a malformed or
 * empty response, never throwing for content reasons). The caller validates and
 * maps via the shared kitinerary mapper.
 */
export interface LlmExtractionClient {
  extract(input: LlmExtractionInput): Promise<Record<string, unknown>[]>;
}

/** An image a structured read sends, base64 without line breaks. */
export interface StructuredReadImage {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  data: string;
}

/**
 * One document read into a given shape on a connection the extraction clients
 * do not call themselves: the instructions, the document as text and images,
 * and the shape the model is made to fill, as a tool it has to call.
 */
export interface StructuredReadRequest {
  system: string;
  text: string;
  images: StructuredReadImage[];
  shape: { name: string; description: string; parameters: Record<string, unknown> };
  signal: AbortSignal;
}

/** What the model gave back: the shape it filled, or, when it called no tool, the text it wrote. */
export type StructuredReadAnswer = { filled: Record<string, unknown> } | { text: string };

/**
 * Reads one document on a ChatGPT plan, which signs in instead of holding a
 * key: the AI connections module owns its token and its client and lends this
 * function (see shared-ai-connection.interface.ts). A provider failure is thrown.
 */
export type StructuredReader = (request: StructuredReadRequest) => Promise<StructuredReadAnswer>;
