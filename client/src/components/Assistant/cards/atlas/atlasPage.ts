import type { EntityTarget } from '../cardTypes';

/**
 * Where every atlas card leads: the Atlas page. A file of its own, so the
 * pure look names it without pulling the card model (continents, icons) into
 * the chat's main chunk.
 */
export const ATLAS_PAGE: EntityTarget = { kind: 'page', path: '/atlas' };
