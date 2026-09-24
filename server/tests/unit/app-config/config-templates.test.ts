/**
 * The shipped configuration templates (server/.env.example, docker-compose.yml,
 * the Helm values and ConfigMap) are the first place an operator looks for a
 * variable, and nothing else ties them to the code: a default raised in
 * derive.ts stays wrong in the template until somebody notices, and a switch
 * that only the wiki knows about is one the compose file never shows. These
 * tests pin the pieces that drifted once.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { OVERPASS_TIMEOUT_DEFAULT_MS } from '../../../src/nest/maps/maps.helpers';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..');

const envExample = fs.readFileSync(path.join(REPO_ROOT, 'server', '.env.example'), 'utf8');
const compose = fs.readFileSync(path.join(REPO_ROOT, 'docker-compose.yml'), 'utf8');
const helmValues = fs.readFileSync(path.join(REPO_ROOT, 'charts', 'trek', 'values.yaml'), 'utf8');
const helmConfigMap = fs.readFileSync(path.join(REPO_ROOT, 'charts', 'trek', 'templates', 'configmap.yaml'), 'utf8');
const helmSecret = fs.readFileSync(path.join(REPO_ROOT, 'charts', 'trek', 'templates', 'secret.yaml'), 'utf8');
const helmDeployment = fs.readFileSync(path.join(REPO_ROOT, 'charts', 'trek', 'templates', 'deployment.yaml'), 'utf8');

describe('OVERPASS_TIMEOUT_MS in the templates', () => {
  it('.env.example shows the code default as both the example value and the stated default', () => {
    const line = envExample.split(/\r?\n/).find((l) => l.includes('OVERPASS_TIMEOUT_MS='));
    expect(line).toBeDefined();
    expect(line).toContain(`OVERPASS_TIMEOUT_MS=${OVERPASS_TIMEOUT_DEFAULT_MS}`);
    expect(line).toContain(`(default: ${OVERPASS_TIMEOUT_DEFAULT_MS})`);
  });

  it('the Helm values show the code default as both the example value and the stated default', () => {
    expect(helmValues).toContain(`# OVERPASS_TIMEOUT_MS: "${OVERPASS_TIMEOUT_DEFAULT_MS}"`);
    expect(helmValues).toContain(`Defaults to ${OVERPASS_TIMEOUT_DEFAULT_MS}.`);
  });
});

describe('the Places and Amap switches in the templates', () => {
  // The index is asked by default and the only way to stop that is this
  // variable, so an operator has to be able to find it where they look.
  const documented = ['TREK_PLACES_ENABLED', 'TREK_PLACES_URL', 'AMAP_API_KEY', 'AMAP_API_SECRET', 'AMAP_API_BASE'];

  it('.env.example documents every one of them', () => {
    for (const name of documented) {
      expect(envExample).toContain(`# ${name}=`);
    }
  });

  it('docker-compose.yml documents every one of them', () => {
    for (const name of documented) {
      expect(compose).toContain(`#      - ${name}=`);
    }
  });

  it('the Helm ConfigMap passes through the non-secret ones the values file documents', () => {
    for (const name of ['TREK_PLACES_ENABLED', 'TREK_PLACES_URL', 'AMAP_API_BASE']) {
      expect(helmValues).toContain(`# ${name}:`);
      expect(helmConfigMap).toContain(`${name}: {{ .Values.env.${name} | quote }}`);
    }
  });

  it('the Helm ConfigMap emits TREK_PLACES_ENABLED on presence, since its one useful value is false', () => {
    // A guard of the `if .Values.env.X` shape drops a boolean false, and with
    // it the only setting anyone makes here.
    expect(helmConfigMap).not.toContain('{{- if .Values.env.TREK_PLACES_ENABLED }}');
    expect(helmConfigMap).toContain('{{- if not (kindIs "invalid" .Values.env.TREK_PLACES_ENABLED) }}');
  });

  it('the Helm chart carries the Amap credentials in the Secret, never in the ConfigMap', () => {
    // A ConfigMap is readable by anyone who can read the namespace; the key and
    // its signing secret belong next to the other credentials, in both the
    // plain and the generated branch of the Secret, and the pod reads them from
    // there like it reads the Unsplash key.
    for (const name of ['AMAP_API_KEY', 'AMAP_API_SECRET']) {
      expect(helmValues).toContain(`  ${name}: ""`);
      expect(helmSecret).toContain(`${name}: {{ .Values.secretEnv.${name} | b64enc | quote }}`);
      expect(helmSecret).toContain(`${name}: {{ .Values.secretEnv.${name} }}`);
      expect(helmDeployment).toContain(`- name: ${name}\n              valueFrom:\n                secretKeyRef:`);
      expect(helmDeployment).toContain(`key: ${name}\n                  optional: true`);
      expect(helmConfigMap).not.toContain(name);
    }
  });
});
