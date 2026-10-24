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
