// Types for open-request-schemas.mjs, so the spec imports it without a suppression.

export declare const BASELINE: string;
export declare const REQUEST_SCHEMA: RegExp;

export declare function openShapes(root: unknown): string[];
export declare function countOpenShapes(namespace: Record<string, unknown>): Record<string, number>;
export declare function readBaseline(path?: string): Record<string, number>;
export declare function compare(
  baseline: Record<string, number>,
  counts: Record<string, number>,
): { grown: [string, number][]; lowerable: [string, number][] };
export declare function lowerBaseline(
  baseline: Record<string, number>,
  counts: Record<string, number>,
): Record<string, number>;
export declare function report(
  baseline: Record<string, number>,
  counts: Record<string, number>,
  log?: Pick<Console, 'error'>,
): { grown: [string, number][]; lowerable: [string, number][] };
