import { logError } from '../audit/audit-log.logger';
import type { KiReservation } from '../booking-import/kitinerary.types';
import { capImage, renderPdfPages } from './image-input';
import { createLlmClient } from './llm-client.factory';
import type { ResolvedLlmConfig } from './llm-config';
import { LlmConfigResolver } from './llm-config.resolver';
import { failureOutcome, foundOutcome } from './llm-outcome';
import { LlmParseService } from './llm-parse.service';
import type { LlmExtractionFile } from './llm-provider.interface';
import {
  buildMailPrompt,
  MAIL_READ_JSON_SCHEMA,
  MAIL_READ_ROOT_KEY,
  MAIL_READ_USER_TEXT,
  mailReadText,
  readMailAnswer,
} from './mail-read';
import type {
  MailReadAttachment,
  MailReadBooking,
  MailReading,
  MailReadInput,
  WalkedMail,
} from './mail-read.types';
import { walkMail } from './mime-walker';
import { normalizeCurrency, normalizeNode } from './reservation-normalize';
import { routeExtraction, routeImageExtraction } from './router/extraction-router';
import { extractText } from './text-extract';
import { CLOUD_TEXT_WINDOW, fitTextWindow, LOCAL_TEXT_WINDOW } from './text-window';
import { Injectable } from '@nestjs/common';
import type { LlmParseOutcome } from '@trek/shared';

/** A PDF whose text layer is shorter than this is a scan: its pages go as images instead. */
const SCAN_TEXT_CHARS = 200;
/** Page images and photos one mail sends at most. */
const MAX_MAIL_IMAGES = 4;
/** Attachments whose content goes to the model. */
const MAX_READ_ATTACHMENTS = 3;
/** How much of the machine-readable hints goes along. */
const HINTS_CHARS = 4000;
/** Less readable text than this, next to images, means the booking can only come from the images. */
const IMAGE_ONLY_TEXT_CHARS = 50;

/**
 * Reads a forwarded booking mail with the AI, in one request per mail: one
 * mail is one document of the allowance, whatever it carries.
 *
 * What goes out is the mail's subject, date, readable body and the text of
 * at most three attachments (a scan's first pages as images instead), each
 * inside a data tag the prompt names as untrusted, plus the trips the person
 * may add bookings to, by a reference made up for this call. Sender,
 * recipients and forwarding headers stay home: the walker already left them
 * out of the body. Nothing of the mail reaches the log.
 */
@Injectable()
export class MailReadService {
  constructor(
    private readonly llmConfig: LlmConfigResolver,
    private readonly llmParse: LlmParseService,
  ) {}

  /** A forwarded mail taken apart (mime-walker.ts); null for bytes that are no mail. */
  walk(raw: Buffer): WalkedMail | null {
    return walkMail(raw);
  }

  /** Whether a mail could be read by AI for this person right now. */
  async isAvailable(userId: number): Promise<boolean> {
    return this.llmParse.isAvailable(userId);
  }

  /** The bookings of one mail and the trip each would go to, or how the reading ended without any. */
  async read(input: MailReadInput, userId: number, today: string): Promise<MailReading> {
    const texts = await attachmentTexts(input.attachments.slice(0, MAX_READ_ATTACHMENTS));
    const documentText = [input.subject ?? '', input.body, ...texts.map((part) => part.text)].join('\n');
    const nothing = (outcome: LlmParseOutcome): MailReading => ({
      outcome,
      bookings: [],
      documentText,
      imageOnly: false,
    });

    const config = await this.llmConfig.resolve(userId);
    if (!config) return nothing('ai_disabled');
    try {
      const images = (await this.llmParse.readsImages(userId)) ? await mailImages(input.attachments, texts) : [];
      const readable = [input.body, ...texts.map((part) => part.text)].join('').trim().length;
      if (readable === 0 && images.length === 0) return nothing('no_text');
      const imageOnly = readable < IMAGE_ONLY_TEXT_CHARS && images.length > 0;
      const text = fitTextWindow(mailReadText(input, [...texts, hintsPart(input.hints)]), windowFor(config)).text;

      if (config.provider === 'local') {
        return { ...(await readLocally(config, imageOnly ? null : text, images)), documentText, imageOnly };
      }
      const bookings = await this.readInCloud(config, input, text, images, today);
      return { outcome: foundOutcome(bookings), bookings, documentText, imageOnly };
    } catch (err) {
      // The provider and the error only: the mail's content stays out of the log.
      const reason = err instanceof Error ? err.message : String(err);
      logError(`[llm-parse] Mail read failed (provider=${config.provider}): ${reason}`);
      return nothing(failureOutcome(err));
    }
  }

  private async readInCloud(
    config: ResolvedLlmConfig,
    input: MailReadInput,
    text: string,
    images: LlmExtractionFile[],
    today: string,
  ): Promise<MailReadBooking[]> {
    const raw = await createLlmClient(config).extract({
      prompt: buildMailPrompt(input.trips, today),
      jsonSchema: MAIL_READ_JSON_SCHEMA,
      rootKey: MAIL_READ_ROOT_KEY,
      userText: MAIL_READ_USER_TEXT,
      model: config.model,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      text,
      file: images[0],
      pageImages: images.slice(1),
    });
    return readMailAnswer(
      raw,
      input.trips,
      (node) => normalizeCurrency(normalizeNode(node), text) as unknown as KiReservation,
    );
  }
}

/**
 * A local model reads through the layered router, which is far steadier on a
 * small model than one free-form request, and assigns no trip: the server
 * picks it from the dates alone. A mail with only images (`text` null) goes
 * through the router's image path.
 */
async function readLocally(
  config: ResolvedLlmConfig,
  text: string | null,
  images: LlmExtractionFile[],
): Promise<{ outcome: LlmParseOutcome; bookings: MailReadBooking[] }> {
  const ctx = { baseUrl: config.baseUrl ?? 'http://localhost:11434/v1', model: config.model, apiKey: config.apiKey };
  const routed =
    text === null
      ? await routeImageExtraction(
          images.map((image) => image.data),
          ctx,
        )
      : await routeExtraction(text, ctx);
  if (routed.kiItems.length === 0) return { outcome: routed.outcome, bookings: [] };
  const booking: MailReadBooking = {
    kind: 'new_booking',
    reservations: routed.kiItems,
    tripRef: null,
    tripConfidence: null,
    uncertainFields: [],
    suggestedNewTrip: null,
  };
  return { outcome: 'ok', bookings: [booking] };
}

function windowFor(config: ResolvedLlmConfig): number {
  return config.provider === 'local' ? LOCAL_TEXT_WINDOW : CLOUD_TEXT_WINDOW;
}

/** The text an attachment carries: a PDF's text layer, a calendar file as it is; a pass or a photo has none. */
async function attachmentTexts(attachments: readonly MailReadAttachment[]) {
  const texts: Array<{ fileName: string; text: string; attachment: MailReadAttachment }> = [];
  for (const attachment of attachments) {
    let text = '';
    try {
      if (attachment.kind === 'pdf') text = await extractText(attachment.data, attachment.fileName);
      else if (attachment.kind === 'ics') text = attachment.data.toString('utf8');
    } catch {
      // An attachment that cannot be read adds nothing; the others still go.
    }
    texts.push({ fileName: attachment.fileName, text, attachment });
  }
  return texts;
}

/** The images that go along: the first pages of a scanned PDF, and the photos, at most four per mail. */
async function mailImages(
  attachments: readonly MailReadAttachment[],
  texts: ReadonlyArray<{ text: string; attachment: MailReadAttachment }>,
): Promise<LlmExtractionFile[]> {
  const images: LlmExtractionFile[] = [];
  for (const attachment of attachments) {
    if (images.length >= MAX_MAIL_IMAGES) break;
    try {
      if (attachment.kind === 'pdf') {
        const layer = texts.find((part) => part.attachment === attachment)?.text ?? '';
        if (layer.trim().length < SCAN_TEXT_CHARS) images.push(...(await renderPdfPages(attachment.data)));
      } else if (attachment.mimeType.startsWith('image/')) {
        images.push(await capImage(attachment.data, attachment.mimeType));
      }
    } catch {
      // A page or photo that cannot be rendered is left out, like an unreadable attachment.
    }
  }
  return images.slice(0, MAX_MAIL_IMAGES);
}

/** The machine-readable hints as one more data part, cut to a size that never crowds out the mail. */
function hintsPart(hints: readonly unknown[]): { fileName: string; text: string } {
  if (hints.length === 0) return { fileName: 'machine-readable data', text: '' };
  return { fileName: 'machine-readable data', text: JSON.stringify(hints).slice(0, HINTS_CHARS) };
}
