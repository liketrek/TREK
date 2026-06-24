import type { KiReservation } from '../booking-import/kitinerary.types';
import { createLlmClient } from './llm-client.factory';
import { resolveLlmConfig } from './llm-config.resolver';
import { buildSystemPrompt, KI_RESERVATION_JSON_SCHEMA } from './llm-prompt';
import type { LlmExtractionInput } from './llm-provider.interface';
import { isPdf, extractText } from './text-extract';
import { Injectable } from '@nestjs/common';
import { kiReservationSchema } from '@trek/shared';

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
};

export interface LlmParseResult {
  kiItems: KiReservation[];
  warnings: string[];
}

/**
 * Orchestrates the LLM fallback: resolve config → pick client → build input
 * (native bytes vs extracted text by the `multimodal` flag) → call provider →
 * validate the response → return schema.org `KiReservation[]` for the shared
 * mapper. Never throws for content/provider reasons — degrades to `[]` + a
 * warning, mirroring the kitinerary extractor's tolerance.
 */
@Injectable()
export class LlmParseService {
  /** True when the addon is enabled AND a usable config resolves for this user. */
  isAvailable(userId: number): boolean {
    return resolveLlmConfig(userId) !== null;
  }

  async parse(file: { buffer: Buffer; originalName: string }, userId: number): Promise<LlmParseResult> {
    const config = resolveLlmConfig(userId);
    if (!config) return { kiItems: [], warnings: ['AI parsing is not configured'] };

    const warnings: string[] = [];
    const input: LlmExtractionInput = {
      prompt: buildSystemPrompt(),
      jsonSchema: KI_RESERVATION_JSON_SCHEMA,
      model: config.model,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
    };

    // Native PDF only for Anthropic (its document block reads text AND scans).
    // OpenAI-compatible servers (incl. Ollama/NuExtract) can't ingest PDFs/`file`
    // parts, so every other provider gets extracted text.
    try {
      if (config.provider === 'anthropic' && isPdf(file.originalName)) {
        input.file = { mimeType: MIME_BY_EXT['.pdf'], data: file.buffer };
        console.debug(
          `[DEBUG] Extracted (native PDF, ${file.buffer.length} bytes) sent to ${config.provider}: ${file.originalName}`,
        );
      } else {
        input.text = await extractText(file.buffer, file.originalName);
        // Booking details sit at the top of a confirmation; multi-page T&C tails
        // (rental/insurance docs run 30k+ chars) otherwise overflow the model's
        // context window — truncating the *relevant* head — and balloon CPU
        // inference time. Cap the text so only the useful head reaches the LLM.
        const MAX_EXTRACT_CHARS = 8000;
        if (input.text.length > MAX_EXTRACT_CHARS) input.text = input.text.slice(0, MAX_EXTRACT_CHARS);
        console.debug(`[DEBUG] Extracted text from ${file.originalName} (${input.text.length} chars):\n`, input.text);
        if (!input.text.trim()) {
          return {
            kiItems: [],
            warnings: [`${file.originalName}: no readable text found (a scanned PDF needs a cloud/vision provider)`],
          };
        }
      }
    } catch (err) {
      return {
        kiItems: [],
        warnings: [`${file.originalName}: could not read file — ${err instanceof Error ? err.message : String(err)}`],
      };
    }

    let raw: Record<string, unknown>[];
    try {
      raw = await createLlmClient(config).extract(input);
      console.debug('[DEBUG] Raw LLM Response: ', raw);
    } catch (err) {
      return {
        kiItems: [],
        warnings: [`${file.originalName}: AI parsing failed — ${err instanceof Error ? err.message : String(err)}`],
      };
    }

    const kiItems: KiReservation[] = [];
    for (const node of raw) {
      const result = kiReservationSchema.safeParse(node);
      if (result.success) kiItems.push(normalizeNode(result.data) as unknown as KiReservation);
      else warnings.push(`${file.originalName}: skipped an unrecognized AI result`);
    }

    return { kiItems, warnings };
  }
}

/** Root-level keys in the schema.org reservation shape; everything else is trip-specific. */
const ROOT_KEYS = new Set([
  '@type',
  'reservationNumber',
  'checkinTime',
  'checkoutTime',
  'pickupTime',
  'dropoffTime',
  'startTime',
  'endTime',
  'pickupLocation',
  'reservationFor',
]);

/**
 * Small models often flatten the type-specific fields (flightNumber, airline,
 * departureAirport, …) onto the reservation root instead of nesting them under
 * `reservationFor`, which is where the kitinerary mapper reads them. When
 * `reservationFor` is missing/empty, fold the non-root keys into it so the
 * existing mappers work unchanged.
 */
function normalizeNode(node: Record<string, unknown>): Record<string, unknown> {
  const rf = node.reservationFor;
  if (rf && typeof rf === 'object' && Object.keys(rf as object).length > 0) return node;

  const out: Record<string, unknown> = {};
  const reservationFor: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (ROOT_KEYS.has(k)) out[k] = v;
    else reservationFor[k] = v;
  }
  // Nothing to fold (no flattened type fields) — leave the node as-is.
  if (Object.keys(reservationFor).length === 0) return node;
  out.reservationFor = reservationFor;
  return out;
}
