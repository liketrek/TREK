import { logWarn } from '../audit/audit-log.logger';
import { withRequestContext } from '../database/request-context';
import { JourneyBookEditService, type BookTrialBase } from '../journey/journey-book-edit.service';
import type { AssistantToolSession, ToolRun } from './assistant-tools.service';
import {
  BOOK_TRIAL_READ,
  BOOK_TRIAL_TOOLS,
  tryBookChange,
  type BookTrial,
  type BookTrialInput,
} from './cards/book/book-trial';
import type { ToolArgs } from './cards/card-types';
import { readKey, recordOf } from './cards/card-values';
import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { compareCodeUnits, type BookFinding } from '@trek/shared';

/**
 * The check a Studio turn runs on every book write the model proposes, before
 * the user sees it (journey-studio.md 4.3). The call is tried on the stored
 * book with the shared engine, as the tool would run it: what the engine
 * refuses (an unknown or locked element, a photo outside the gallery, a
 * protected page) goes back to the model as the call's error at once, and a
 * change that would leave new severe faults on a page (overlapping photos,
 * words past their frame, an empty frame, content in the fold) goes back once
 * a turn per tool and page, with the findings. The same proposal made again is held
 * like any other, its card showing the findings. Every model gets this check,
 * whether it can see a page image or not.
 *
 * The change card reads the same trial through the turn's reader, so one call
 * is tried once.
 */

/** What a turn's cards read through: the session's own reads. */
type TurnReads = Pick<AssistantToolSession, 'read' | 'hintOf'>;

/** A turn's check of held book writes, and the reads its cards make. */
export interface BookTurnGate {
  /** Why a held call goes back to the model instead of to the user; null when it is held as it is. */
  refusalOf(tool: string, args: ToolArgs): Promise<string | null>;
  /** The session's reads, with the trial of a book write answered beside them. */
  reader: TurnReads;
}

/** A trip conversation's gate: it sends nothing back, and its cards read the session alone. */
export function openGate(session: TurnReads): BookTurnGate {
  return { refusalOf: () => Promise.resolve(null), reader: session };
}

/** Findings the bounce names at most; the rest are counted. */
const BOUNCE_FINDINGS = 6;

const BOUNCE_HEAD =
  'Not proposed yet: this change would leave faults on the page that it did not have before. ' +
  'Fix them and make the call again. The same call made again is shown to the user, with these findings on its card.';

/** The words a change with new faults goes back with: what is wrong, one finding a line. */
export function bounceText(findings: readonly BookFinding[]): string {
  const lines = findings.slice(0, BOUNCE_FINDINGS).map((finding) => `- ${finding.code}: ${finding.message}`);
  const more = findings.length - BOUNCE_FINDINGS;
  if (more > 0) lines.push(`- and ${more} more`);
  return [BOUNCE_HEAD, ...lines].join('\n');
}

/**
 * What a bounce is counted by: the tool and the pages it works on (its page,
 * the page new ones follow, the pages it deletes), else the tool alone, as
 * for the cover and a new book. Each goes back once a turn.
 */
function pageOf(tool: string, args: ToolArgs): string {
  const page = args.spreadId ?? args.afterSpreadId;
  if (typeof page === 'string') return `${tool}:${page}`;
  const ids = Array.isArray(args.spreadIds) ? args.spreadIds.filter((id): id is string => typeof id === 'string') : [];
  return ids.length > 0 ? `${tool}:${[...ids].sort(compareCodeUnits).join(',')}` : tool;
}

function reason(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Makes each turn's gate over the journey's book, read with the user's rights. */
@Injectable()
export class AssistantBookGate {
  constructor(
    private readonly books: JourneyBookEditService,
    private readonly orm: MikroORM,
  ) {}

  /**
   * The gate of one Studio turn. The book is read once, when the first call
   * is tried (the turn's writes are held, so it stays as read), and each call
   * with its arguments is tried once, whether the gate or a card asks first.
   */
  forTurn(userId: number, journeyId: number, session: TurnReads): BookTurnGate {
    let base: Promise<BookTrialInput | null> | null = null;
    const trials = new Map<string, Promise<BookTrial | null>>();
    const bounced = new Set<string>();
    const trial = (tool: string, args: ToolArgs): Promise<BookTrial | null> => {
      const key = readKey(tool, args);
      const kept = trials.get(key);
      if (kept !== undefined) return kept;
      base ??= this.baseOf(userId, journeyId);
      const tried = base.then((input) => (input ? this.tried(tool, args, input) : null));
      trials.set(key, tried);
      return tried;
    };
    const refusalOf = async (tool: string, args: ToolArgs): Promise<string | null> => {
      if (!BOOK_TRIAL_TOOLS.includes(tool)) return null;
      const tried = await trial(tool, args);
      if (!tried) return null;
      if (tried.ok === false) return tried.refusal;
      const page = pageOf(tool, args);
      if (tried.fresh.length === 0 || bounced.has(page)) return null;
      bounced.add(page);
      return bounceText(tried.fresh);
    };
    const read = async (name: string, args: ToolArgs = {}): Promise<ToolRun> => {
      if (name !== BOOK_TRIAL_READ) return session.read(name, args);
      const tool = typeof args.tool === 'string' ? args.tool : '';
      const tried = await trial(tool, recordOf(args.args));
      return tried ? { ok: true, value: tried } : { ok: false, value: 'No trial of this call.' };
    };
    return { refusalOf, reader: { read, hintOf: (name) => session.hintOf(name) } };
  }

  /** The book a turn's calls are tried on; null, and a log line, when it cannot be read. */
  private async baseOf(userId: number, journeyId: number): Promise<BookTrialInput | null> {
    try {
      const base: BookTrialBase = await withRequestContext(this.orm, () => this.books.trialBase(journeyId, userId));
      return { journeyId, ...base };
    } catch (err) {
      logWarn(`[assistant] the book of journey ${journeyId} could not be read for a trial: ${reason(err)}`);
      return null;
    }
  }

  /** One call tried; a fault in the engine is logged and tries nothing, so the call is held as it is. */
  private tried(tool: string, args: ToolArgs, input: BookTrialInput): BookTrial | null {
    try {
      return tryBookChange(tool, args, input);
    } catch (err) {
      logWarn(`[assistant] the trial of ${tool} failed: ${reason(err)}`);
      return null;
    }
  }
}
