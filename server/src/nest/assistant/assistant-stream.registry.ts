/**
 * The assistant turns running right now, one per user, as an injectable port.
 * A second window asking while one turn streams is refused (`busy`) instead of
 * running two turns over the same conversation; "continue here" stops the
 * running one (`abort`) and asks again. In memory today; a registry shared
 * between processes replaces InMemoryAssistantStreamRegistry in
 * AssistantModule.
 */
export abstract class AssistantStreamRegistry {
  /** Registers the turn's controller; false when the user already has one running. */
  abstract claim(userId: number, controller: AbortController): Promise<boolean>;
  /** Forgets the turn, if it is still the one registered. */
  abstract release(userId: number, controller: AbortController): Promise<void>;
  /** Stops the user's running turn; false when none was running. */
  abstract abort(userId: number): Promise<boolean>;
}

export class InMemoryAssistantStreamRegistry extends AssistantStreamRegistry {
  private readonly running = new Map<number, AbortController>();

  claim(userId: number, controller: AbortController): Promise<boolean> {
    const current = this.running.get(userId);
    if (current && !current.signal.aborted) return Promise.resolve(false);
    this.running.set(userId, controller);
    return Promise.resolve(true);
  }

  release(userId: number, controller: AbortController): Promise<void> {
    if (this.running.get(userId) === controller) this.running.delete(userId);
    return Promise.resolve();
  }

  abort(userId: number): Promise<boolean> {
    const current = this.running.get(userId);
    if (!current) return Promise.resolve(false);
    this.running.delete(userId);
    current.abort();
    return Promise.resolve(true);
  }
}
