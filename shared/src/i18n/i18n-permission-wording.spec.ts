/**
 * The permission list has to describe what the install actually does.
 *
 * `geolocation:read` promised that the browser would ask before a plugin saw a
 * position. It does not: the host reads the position on TREK's own origin, so
 * whatever the reader already granted this site covers the plugin too, and the
 * prompt they were told to wait for never comes. A consent screen that oversells
 * the guard standing behind it is worse than one that says nothing.
 *
 * Scoped to `en/`, like the self-host guard next door: it is the source every
 * translation is made from, and a translation still carrying the older phrasing
 * is a translation lagging behind rather than a broken build.
 */
import admin from './en/admin';

import { describe, it, expect } from 'vitest';

describe('canonical permission wording', () => {
  it('I18N-PERM-001: the geolocation permission does not promise a browser prompt', () => {
    const copy = admin['admin.plugins.perm.geolocation:read'];

    expect(copy).toBeTruthy();
    expect(copy).not.toMatch(/browser will|ask first|still ask/i);
    // It has to say where the position does come from, or it explains nothing.
    expect(copy).toMatch(/permission/i);
  });
});
