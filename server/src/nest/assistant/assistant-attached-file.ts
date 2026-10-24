import type { AssistantErrorCode } from '@trek/shared';

/**
 * A file the user attaches in the trip chat is read by the server itself,
 * not by the model: a booking file into bookings, a route file into tracks
 * (P7). Each kind of file has its reader; AssistantService.attach runs it the
 * same way for every kind: the read step as a call of its own, then one held
 * change per thing the file holds, decided like any other change.
 */

/** One change a file proposes: the server's write it is held as, and its arguments. */
export interface FileProposal {
  toolName: string;
  /** What the change runs with, kept on the held call only. */
  args: Record<string, unknown>;
  /**
   * What the message shows of the call where that is less than it runs with
   * (a GPX text stays on the held call, out of the thread and the history).
   */
  shownArgs?: Record<string, unknown>;
}

/** What reading a file found: the read step's answer, and the changes it proposes. */
export interface FileRead {
  found: Record<string, unknown>;
  proposals: FileProposal[];
}

export interface AttachedFileReader {
  /** The name the read step goes by in the thread. */
  readonly readTool: string;
  /** The error a file that holds nothing to propose ends the answer with. */
  readonly emptyCode: AssistantErrorCode;
  /** Refuses a file nobody here can read, before a turn begins. */
  ensureReadable(userId: number, file: Express.Multer.File): Promise<void>;
  /** What the file holds, at most a step's worth. Persists nothing. */
  propose(userId: number, tripId: number, file: Express.Multer.File): Promise<FileRead>;
}
