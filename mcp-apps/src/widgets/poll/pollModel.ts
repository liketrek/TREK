import { votedPollOutputSchema, type ListCollabPollsOutput } from '@trek/shared/mcp-apps';

export type Poll = ListCollabPollsOutput['polls'][number];

/** What an option reads: its text, else its label, else nothing (both are free-form on the wire). */
export function optionText(option: { text: unknown; label: unknown }): string {
  const value = option.text ?? option.label;
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

/** Each option's share of the votes cast on the poll, 0 when nobody voted. */
export function voteShares(poll: Poll): number[] {
  const counts = poll.options.map((option) => option.voters.length);
  const total = counts.reduce((sum, count) => sum + count, 0);
  return counts.map((count) => (total > 0 ? count / total : 0));
}

/** The open polls first, newest first within each group. */
export function orderPolls(polls: Poll[]): Poll[] {
  return [...polls].sort((a, b) => Number(a.is_closed) - Number(b.is_closed) || b.id - a.id);
}

/** The poll vote_collab_poll answered with, read from its text; null when the answer is not one. */
export function votedPoll(text: string | undefined): Poll | null {
  if (!text) return null;
  try {
    const parsed = votedPollOutputSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data.poll : null;
  } catch {
    return null;
  }
}
