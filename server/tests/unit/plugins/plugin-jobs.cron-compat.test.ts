/**
 * Grammar-compat pin for the plugin job scheduler's node-cron → cron migration.
 *
 * A validation *tightening* would silently disable a published plugin's job
 * (an invalid cron is skipped, never scheduled — deliberately, so a bad
 * schedule can't take the host down). This runs the REAL `cron` validator
 * (unmocked) over the manifest shapes plugins realistically declare and pins
 * that everything node-cron accepted still schedules, and garbage still
 * doesn't.
 */
import { validateCronExpression } from 'cron';
import { describe, it, expect } from 'vitest';

const ACCEPTED = [
  '0 0 * * *', // nightly
  '*/5 * * * *', // step minutes
  '0 9 * * MON', // day-of-week name
  '0 9 * * sun', // lowercase name
  '0 9 * * 7', // 7-as-Sunday
  '0 0 1 JAN *', // month name
  '30 */2 * * 0-5', // range + step combined
  '1-5 * * * *', // minute range
  '*/30 * * * * *', // 6-field with seconds first
  '0 0 29 2 *', // leap-day
];

const REJECTED = [
  'not-a-cron',
  '',
  '* * *', // too few fields
  '61 * * * *', // minute out of range
  '0 24 * * *', // hour out of range
];

describe('plugin job cron grammar (real validator)', () => {
  it.each(ACCEPTED)('PJOB-COMPAT accepts %j', (expr) => {
    expect(validateCronExpression(expr).valid).toBe(true);
  });

  it.each(REJECTED)('PJOB-COMPAT rejects %j', (expr) => {
    expect(validateCronExpression(expr).valid).toBe(false);
  });
});
