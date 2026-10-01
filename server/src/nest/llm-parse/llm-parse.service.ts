import type { KiReservation } from '../booking-import/kitinerary.types';
import { createLlmClient } from './llm-client.factory';
import { LlmConfigResolver } from './llm-config.resolver';
import type { ResolvedLlmConfig } from './llm-config';
import { LlmLocalService } from './llm-local.service';
import { capImage, imageMimeType, renderPdfPages } from './image-input';
import { extractEnforced } from './router/ollama-format.client';
import {
  buildReceiptPrompt,
  RECEIPT_JSON_SCHEMA,
  RECEIPT_LIST_JSON_SCHEMA,
  RECEIPT_ROOT_KEY,
  RECEIPT_USER_TEXT,
  toReceiptRead,
} from './receipt-read';
import { buildSystemPrompt, KI_RESERVATION_JSON_SCHEMA } from './llm-prompt';
import type { LlmExtractionFile, LlmExtractionInput } from './llm-provider.interface';
import { isPdf, extractText } from './text-extract';
import { routeExtraction, routeImageExtraction, detectFlightNumbers, extractTotalPrice } from './router/extraction-router';
import { toIsoCurrency } from './currency-code';
import { Injectable } from '@nestjs/common';
import { kiReservationSchema, type ReceiptScanResult } from '@trek/shared';
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
 * (a photo as an image when the model reads one, a PDF natively for Anthropic,
 * extracted text otherwise) → call provider →
 * validate the response → return schema.org `KiReservation[]` for the shared
 * mapper. Never throws for content/provider reasons — degrades to `[]` + a
 * warning, mirroring the kitinerary extractor's tolerance.
 */
@Injectable()
export class LlmParseService {
  constructor(
    private readonly llmConfig: LlmConfigResolver,
    private readonly env: RuntimeEnvService,
    private readonly local: LlmLocalService,
  ) {}

  /** True when the addon is enabled AND a usable config resolves for this user. */
  isAvailable(userId: number): boolean {
    return this.llmConfig.resolve(userId) !== null;
  }

  /** Whether a photo this user uploads can be read: AI parsing is set up and its model takes images. */
  async readsImages(userId: number): Promise<boolean> {
    const config = this.llmConfig.resolve(userId);
    return config ? this.visionFor(config) : false;
  }

  /**
   * Read a photographed receipt for the Costs tab. Like parse(), it never throws
   * for content or provider reasons: a refusal comes back as a null receipt and
   * a warning naming the file.
   */
  async readReceipt(file: { buffer: Buffer; originalName: string }, userId: number): Promise<ReceiptScanResult> {
    const config = this.llmConfig.resolve(userId);
    if (!config) return { receipt: null, warnings: ['AI parsing is not configured'] };
    const imageType = imageMimeType(file.originalName);
    if (!imageType) return { receipt: null, warnings: [`${file.originalName}: not a photo`] };
    if (!(await this.visionFor(config))) {
      return { receipt: null, warnings: [`${file.originalName}: the configured model does not read images`] };
    }

    let image: LlmExtractionFile;
    try {
      image = await capImage(file.buffer, imageType);
    } catch (err) {
      // A photo too large to decode or to send, refused like one that cannot be read.
      return { receipt: null, warnings: [`${file.originalName}: ${err instanceof Error ? err.message : String(err)}`] };
    }
    const local = config.provider === 'local';
    const prompt = buildReceiptPrompt(new Date(), !local);
    let raw: unknown;
    try {
      if (local) {
        // Ollama's own chat API, as the booking router uses: `think: false` and
        // `num_ctx` exist there and not on /v1, and a hybrid model that is left
        // to reason spends the whole token budget on it and answers nothing.
        raw = await extractEnforced({
          baseUrl: config.baseUrl ?? 'http://localhost:11434/v1',
          model: config.model,
          apiKey: config.apiKey,
          system: prompt,
          user: RECEIPT_USER_TEXT,
          schema: RECEIPT_JSON_SCHEMA,
          images: [image.data.toString('base64')],
          numCtx: 16384,
          // A supermarket receipt is a long list of lines.
          numPredict: 2048,
        });
      } else {
        const list = await createLlmClient(config).extract({
          prompt,
          jsonSchema: RECEIPT_LIST_JSON_SCHEMA,
          rootKey: RECEIPT_ROOT_KEY,
          userText: RECEIPT_USER_TEXT,
          model: config.model,
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          file: image,
        });
        raw = list[0];
      }
    } catch (err) {
      console.error(`[llm-parse] Receipt read failed for "${file.originalName}" (provider=${config.provider}):`, err instanceof Error ? err.message : err);
      return { receipt: null, warnings: [`${file.originalName}: AI parsing failed — ${err instanceof Error ? err.message : String(err)}`] };
    }

    const receipt = toReceiptRead(raw);
    return receipt ? { receipt, warnings: [] } : { receipt: null, warnings: [`${file.originalName}: no receipt could be read`] };
  }

  private async visionFor(config: ResolvedLlmConfig): Promise<boolean> {
    if (config.vision !== 'auto') return config.vision === 'on';
    // Only a local Ollama can be asked. A cloud model is not assumed to read
    // images: an admin who knows it does says so.
    if (config.provider !== 'local') return false;
    const capabilities = await this.local.modelCapabilities(config.baseUrl, config.model, config.apiKey);
    return capabilities?.includes('vision') ?? false;
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

    const imageType = imageMimeType(file.originalName);
    if (imageType && !(await this.visionFor(config))) {
      return { kiItems: [], warnings: [`${file.originalName}: the configured model does not read images`] };
    }

    // A photo goes as an image to every provider. Native PDF only for Anthropic
    // (its document block reads text AND scans). OpenAI-compatible servers
    // (incl. Ollama/NuExtract) can't ingest PDFs/`file` parts, so every other
    // provider gets extracted text.
    try {
      if (imageType) {
        input.file = await capImage(file.buffer, imageType);
        console.debug(
          `[DEBUG] Photo (${input.file.data.length} bytes) sent to ${config.provider}: ${file.originalName}`,
        );
      } else if (config.provider === 'anthropic' && isPdf(file.originalName)) {
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
          // A scan has no text layer, but a model that reads images can read its pages.
          const pages = isPdf(file.originalName) && (await this.visionFor(config)) ? await renderPdfPages(file.buffer) : [];
          if (pages.length === 0) {
            return {
              kiItems: [],
              warnings: [`${file.originalName}: no readable text found (a scanned PDF needs a model that reads images)`],
            };
          }
          input.text = undefined;
          input.file = pages[0];
          input.pageImages = pages.slice(1);
          console.debug(`[DEBUG] Scanned PDF sent to ${config.provider} as ${pages.length} page image(s): ${file.originalName}`);
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
    if (config.provider === 'local' && (input.text || input.file)) {
      try {
        const ctx = {
          baseUrl: config.baseUrl ?? 'http://localhost:11434/v1',
          model: config.model,
          apiKey: config.apiKey,
        };
        const routed = input.file
          ? await routeImageExtraction([input.file, ...(input.pageImages ?? [])].map((f) => f.data), ctx)
          : await routeExtraction(input.text ?? '', ctx);
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
