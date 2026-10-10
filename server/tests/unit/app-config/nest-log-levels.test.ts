import { nestLogLevels } from '../../../src/app-config/nest-log-levels';

import { describe, expect, it } from 'vitest';

describe('nestLogLevels', () => {
  it('NESTLOG-001: error keeps only fatal and error, so a test boot prints no route map', () => {
    expect(nestLogLevels('error')).toEqual(['fatal', 'error']);
  });

  it('NESTLOG-002: warn adds warn', () => {
    expect(nestLogLevels('warn')).toEqual(['fatal', 'error', 'warn']);
  });

  it('NESTLOG-003: info adds log but not debug or verbose', () => {
    expect(nestLogLevels('info')).toEqual(['fatal', 'error', 'warn', 'log']);
  });

  it('NESTLOG-004: debug keeps everything', () => {
    expect(nestLogLevels('debug')).toEqual(['fatal', 'error', 'warn', 'log', 'debug', 'verbose']);
  });

  it('NESTLOG-005: unset and unknown values fall back to info, like index.ts', () => {
    expect(nestLogLevels(undefined)).toEqual(nestLogLevels('info'));
    expect(nestLogLevels('chatty')).toEqual(nestLogLevels('info'));
  });

  it('NESTLOG-006: the value is matched case-insensitively', () => {
    expect(nestLogLevels('ERROR')).toEqual(['fatal', 'error']);
  });
});
