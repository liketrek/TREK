/**
 * Public surface of the llm-parse domain.
 *
 * Lenient JSON parsing is about model output, not booking extraction: any
 * domain that asks a model for JSON needs the same code-fence strip and JSON5
 * fallback. Exposed here so callers do not reach into `lenient-json.ts`.
 */
export { parseLenientJson } from './lenient-json';
