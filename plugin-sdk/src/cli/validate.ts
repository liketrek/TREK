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
    // TREK renders its UI with lucide icons only. It STRIPS emojis from the declarative
    // text your hooks return (badges, columns, warnings, PDF sections, map/calendar/photo
    // labels) and from notifications, so emojis in that text simply vanish at render.
    // Emojis in the manifest name/description are the tell-tale sign — nudge the author
    // to use the `icon` field with a lucide name instead.
    const EMOJI_RE = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;
    if (EMOJI_RE.test(String(raw.name ?? '')) || EMOJI_RE.test(String(raw.description ?? ''))) {
      warnings.push('name/description contains emojis — TREK uses lucide icons and strips emojis from plugin-rendered text + notifications. Use the declarative `icon` field (a lucide name) instead of emojis in labels.');
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

  // Client UI: a raw <select> without the design kit falls back to the OS-drawn
  // dropdown, which can't match TREK. The kit auto-upgrades selects, so nudge the
  // author to inline it (or opt a field out on purpose).
  const clientHtml = path.join(dir, 'client', 'index.html');
  if (fs.existsSync(clientHtml)) {
    const html = fs.readFileSync(clientHtml, 'utf8');
    const rawSelect = /<select(?![^>]*\bdata-trek-native\b)(\s|>)/i.test(html);
    const usesKit = html.includes('<!-- trek:ui -->') || html.includes('data-trek-ui');
    if (rawSelect && !usesKit) {
      warnings.push('client/index.html has a <select> but does not inline the design kit — native dropdowns will not match TREK. Add the <!-- trek:ui --> marker so selects are auto-styled, or mark a field data-trek-native to opt out.');
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
