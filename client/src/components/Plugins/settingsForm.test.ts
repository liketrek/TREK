/**
 * The one set of rules the three plugin-settings forms (admin instance form, desktop user
 * tab, mobile user screen) share: how a form is seeded from stored values + manifest
 * defaults, which required fields block Save, and what a save patch carries.
 */
import { describe, expect, it } from 'vitest';
import type { PluginUserSettingField } from '../../api/client';
import { findMissingRequired, SECRET_MASK, seedSettingsValues, settingsPatch } from './settingsForm';

const f = (over: Partial<PluginUserSettingField> & { key: string }): PluginUserSettingField =>
  ({ label: over.key, input_type: 'text', required: false, secret: false, ...over }) as PluginUserSettingField;

describe('seedSettingsValues', () => {
  it('seeds a declared default when nothing is stored, and a stored value wins', () => {
    const fields = [
      f({ key: 'url', default: 'https://d.example' }),
      f({ key: 'retries', input_type: 'number', default: 3 }),
    ];
    expect(seedSettingsValues(fields, {})).toEqual({ url: 'https://d.example', retries: '3' });
    expect(seedSettingsValues(fields, { url: 'https://mine.example' })).toEqual({
      url: 'https://mine.example',
      retries: '3',
    });
  });
  it('coerces a checkbox to a boolean (default or stored) and everything else to a string', () => {
    const fields = [
      f({ key: 'on', input_type: 'checkbox', default: true }),
      f({ key: 'off', input_type: 'checkbox' }),
      f({ key: 'n' }),
    ];
    expect(seedSettingsValues(fields, {})).toEqual({ on: true, off: false, n: '' });
    expect(seedSettingsValues(fields, { on: false, n: 5 })).toEqual({ on: false, off: false, n: '5' });
  });
});

describe('findMissingRequired', () => {
  it('names the first required non-checkbox field that is blank (whitespace counts as blank)', () => {
    const fields = [f({ key: 'a', required: true }), f({ key: 'b', label: 'Bee', required: true })];
    expect(findMissingRequired(fields, { a: 'x', b: '   ' })?.key).toBe('b');
    expect(findMissingRequired(fields, { a: 'x', b: 'y' })).toBeUndefined();
  });
  it('exempts a required checkbox and treats an untouched secret (the mask) as filled', () => {
    const fields = [
      f({ key: 'consent', input_type: 'checkbox', required: true }),
      f({ key: 'tok', secret: true, required: true }),
    ];
    expect(findMissingRequired(fields, { consent: false, tok: SECRET_MASK })).toBeUndefined();
    expect(findMissingRequired(fields, { consent: false, tok: '' })?.key).toBe('tok');
  });
});

describe('settingsPatch', () => {
  it('sends every field except an untouched secret still showing the mask', () => {
    const fields = [f({ key: 'tok', secret: true }), f({ key: 'url' }), f({ key: 'on', input_type: 'checkbox' })];
    expect(settingsPatch(fields, { tok: SECRET_MASK, url: 'u', on: true })).toEqual({ url: 'u', on: true });
    expect(settingsPatch(fields, { tok: 'new', url: 'u', on: false })).toEqual({ tok: 'new', url: 'u', on: false });
  });
});
