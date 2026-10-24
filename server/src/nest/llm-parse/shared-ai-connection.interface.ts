import type { ResolvedLlmConfig } from './llm-config';

/**
 * The AI connection the assistant runs on, offered to AI parsing so an
 * instance sets up one provider for both. Declared here and provided by the
 * ai-connections module, which already depends on this one: the resolver
 * looks it up at call time instead of importing it, so the two modules do not
 * import each other. Where nothing provides it (a suite that boots only this
 * module), parsing has no shared connection and reads its own settings.
 */
export const SHARED_AI_CONNECTION = Symbol('SHARED_AI_CONNECTION');

/** A shared connection as parsing reads it; the vision setting stays parsing's own. */
export type SharedParsingConnection = Omit<ResolvedLlmConfig, 'vision'>;

export interface SharedAiConnectionPort {
  /** The connection a user's booking import may read with; null when there is none it can use. */
  forParsing(userId: number): Promise<SharedParsingConnection | null>;
}
