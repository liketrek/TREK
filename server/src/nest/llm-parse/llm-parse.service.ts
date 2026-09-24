import type { KiReservation } from '../booking-import/kitinerary.types';
import { createLlmClient } from './llm-client.factory';
import { LlmConfigResolver } from './llm-config.resolver';
import { buildSystemPrompt, KI_RESERVATION_JSON_SCHEMA } from './llm-prompt';
import type { LlmExtractionInput } from './llm-provider.interface';
import { isPdf, extractText } from './text-extract';
import { routeExtraction, detectFlightNumbers, extractTotalPrice } from './router/extraction-router';
import { toIsoCurrency } from './currency-code';
import { Injectable } from '@nestjs/common';
import { kiReservationSchema } from '@trek/shared';
import { RuntimeEnvService } from '../app-config/runtime-env.service';

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
  constructor(
    private readonly llmConfig: LlmConfigResolver,
    private readonly env: RuntimeEnvService,
  ) {}

  /** True when the addon is enabled AND a usable config resolves for this user. */
  isAvailable(userId: number): boolean {
    return this.llmConfig.resolve(userId) !== null;
  }

  async parse(file: { buffer: Buffer; originalName: string }, userId: number): Promise<LlmParseResult> {
    const config = this.llmConfig.resolve(userId);
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
        // Cap the text fed to the model. A flight itinerary lists its legs throughout a long
        // document, so it keeps a generous window; a single booking has the essentials up top,
        // so cap it tighter to keep CPU prompt-eval fast (a 11-page rental voucher was ~200s at
        // 16k, the booking data sits in the first ~2k). Cloud single-shot keeps the tight cap.
        const MAX_EXTRACT_CHARS =
          config.provider !== 'local' ? 4000 : detectFlightNumbers(input.text).length > 0 ? 16000 : 6000;
        if (input.text.length > MAX_EXTRACT_CHARS) input.text = input.text.slice(0, MAX_EXTRACT_CHARS);
        // The extracted text IS the booking: traveller name, address, booking
        // reference. On a centrally administered install that would land in the
        // operator's log, which is a processing nobody asked for and nobody needs.
        if (this.env.isManaged()) {
          console.debug(`[DEBUG] Extracted text from ${file.originalName} (${input.text.length} chars)`);
        } else {
          console.debug(`[DEBUG] Extracted text from ${file.originalName} (${input.text.length} chars):\n`, input.text);
        }
        if (!input.text.trim()) {
          return {
            kiItems: [],
            warnings: [`${file.originalName}: no readable text found (a scanned PDF needs a cloud/vision provider)`],
          };
        }
      }
    } catch (err) {
      console.error(`[llm-parse] Could not read "${file.originalName}":`, err instanceof Error ? err.message : err);
      return {
        kiItems: [],
        warnings: [`${file.originalName}: could not read file — ${err instanceof Error ? err.message : String(err)}`],
      };
    }

    // Local provider (Ollama): go through the layered extraction router — vendor
    // templates → decompose + grammar-enforced per-reservation extraction → validate
    // + repair. Far more reliable on small CPU models than the single-shot path below
    // (which stays for cloud providers, whose strong models handle one-shot well).
    if (config.provider === 'local' && input.text) {
      try {
        const routed = await routeExtraction(input.text, {
          baseUrl: config.baseUrl ?? 'http://localhost:11434/v1',
          model: config.model,
          apiKey: config.apiKey,
        });
        return { kiItems: routed.kiItems, warnings: [...warnings, ...routed.warnings] };
      } catch (err) {
        console.error(`[llm-parse] AI parsing failed for "${file.originalName}" (provider=${config.provider}):`, err instanceof Error ? err.message : err);
        return {
          kiItems: [],
          warnings: [`${file.originalName}: AI parsing failed — ${err instanceof Error ? err.message : String(err)}`],
        };
      }
    }

    let raw: Record<string, unknown>[];
    try {
      raw = await createLlmClient(config).extract(input);
      // Same reason: the model answers with the fields it read out of the document.
      // Parsed, not raw — this prints the nodes the client already read out of the
      // response, so its single quotes and bare keys are util.inspect's, not the
      // provider's, and a bug report that quotes them is quoting TREK (#2375).
      if (this.env.isManaged()) console.debug(`[DEBUG] LLM response: ${raw.length} item(s)`);
      else console.debug(`[DEBUG] Parsed LLM response (${raw.length} item(s)): `, raw);
    } catch (err) {
      console.error(`[llm-parse] AI parsing failed for "${file.originalName}" (provider=${config.provider}):`, err instanceof Error ? err.message : err);
      return {
        kiItems: [],
        warnings: [`${file.originalName}: AI parsing failed — ${err instanceof Error ? err.message : String(err)}`],
      };
    }

    const kiItems: KiReservation[] = [];
    // A model can list one stay twice, and did (#1638, #2477): two identical
    // nodes are one booking, not two hotels. Only exact copies, and only on this
    // path; the kitinerary extractor reports what the document holds.
    const seen = new Set<string>();
    for (const node of raw) {
      const result = kiReservationSchema.safeParse(node);
      if (!result.success) {
        warnings.push(`${file.originalName}: skipped an unrecognized AI result`);
        continue;
      }
      const normalized = normalizeCurrency(normalizeNode(result.data), input.text);
      const key = stableKey(normalized);
      if (seen.has(key)) continue;
      seen.add(key);
      kiItems.push(normalized as unknown as KiReservation);
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
  'dropoffLocation',
  'seat',
  'class',
  'platform',
  'price',
  'priceCurrency',
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

/**
 * The node with its `priceCurrency` as an ISO 4217 code, or without one.
 *
 * What the model wrote wins when it reads as a code. Otherwise, and only when
 * the node carries a price, the currency comes from the document's own total
 * (a Booking.com print shows `€ 89,35`). When neither yields a code the field
 * is dropped: an empty currency lets the cost form pick one, a made up one
 * (`EURials`, #2477) is saved and cannot be converted.
 */
function normalizeCurrency(node: Record<string, unknown>, documentText: string | undefined): Record<string, unknown> {
  const hasPrice = node.price != null && node.price !== '';
  if (node.priceCurrency == null && !hasPrice) return node;
  const code =
    toIsoCurrency(node.priceCurrency) ??
    (hasPrice && documentText ? toIsoCurrency(extractTotalPrice(documentText)?.currency) : undefined);
  const { priceCurrency: _dropped, ...rest } = node;
  return code ? { ...rest, priceCurrency: code } : rest;
}

/** JSON with every object's keys sorted, so two equal nodes give one string. */
function stableKey(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}
