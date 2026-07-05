#!/usr/bin/env node
/**
 * trek-plugin validate [dir] (#plugins, M6). Runs the SAME manifest checks the
 * registry CI runs, plus a light README sanity check — so a local pass predicts
 * a CI pass. Returns a structured result; the CLI prints + exits non-zero on
 * failure.
 */
import fs from 'node:fs';
import path from 'node:path';
import { validateManifest, KNOWN_ADDONS } from '../manifest.js';
import { readJsonFile } from './json.js';

export interface ValidateReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePluginDir(dir: string): ValidateReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const manifestPath = path.join(dir, 'trek-plugin.json');
  if (!fs.existsSync(manifestPath)) return { ok: false, errors: ['no trek-plugin.json in ' + dir], warnings };

  let manifestId = '';
  try {
    const raw = readJsonFile<Record<string, unknown>>(manifestPath);
    const res = validateManifest(raw);
    errors.push(...res.errors);
    manifestId = res.manifest?.id ?? String(raw.id ?? '');
    // dir name should match the id
    if (manifestId && path.basename(path.resolve(dir)) !== manifestId) {
      warnings.push(`directory name should equal the plugin id "${manifestId}"`);
    }
    // A well-formed but unrecognised addon id is not an error (the plugin may target
    // a newer TREK), but it can never enable here — surface it as a warning.
    for (const a of res.manifest?.requiredAddons ?? []) {
      if (!KNOWN_ADDONS.includes(a)) warnings.push(`requiredAddons: "${a}" is not a known TREK addon on this SDK version`);
    }
  } catch (e) {
    errors.push('trek-plugin.json is not valid JSON: ' + (e instanceof Error ? e.message : e));
  }

  // README sanity
  const readmePath = path.join(dir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    errors.push('README.md is missing');
  } else {
    const md = fs.readFileSync(readmePath, 'utf8');
    if (!/!\[[^\]]*\]\([^)]+\)/.test(md)) warnings.push('README has no screenshot (registry requires at least one)');
    if (/\{\{[^}]*\}\}|REPLACE_ME|Describe (what|the)|One sentence:/i.test(md)) {
      warnings.push('README still contains template placeholders — fill it in before publishing');
    }
  }

  // Server entry present
  if (!fs.existsSync(path.join(dir, 'server', 'index.js'))) errors.push('server/index.js is missing (build your plugin first)');

  return { ok: errors.length === 0, errors, warnings };
}

if (process.argv[1] && process.argv[1].endsWith('validate.js')) {
  const dir = process.argv[2] || '.';
  const r = validatePluginDir(dir);
  for (const w of r.warnings) console.warn('warning: ' + w);
  if (r.ok) {
    console.log('✓ plugin is valid');
  } else {
    for (const e of r.errors) console.error('error: ' + e);
    process.exit(1);
  }
}
