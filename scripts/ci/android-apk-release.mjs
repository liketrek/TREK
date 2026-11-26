#!/usr/bin/env node
// The Android app as an APK outside Google Play, for Obtainium and the like.
//
// native-release.yml uploads each Android build to Google Play, which signs it
// with the app signing key only Google holds. Google Play also builds a
// universal APK of that bundle, signed with the same key. This script fetches
// that APK, so the copy published in liketrek/trek-android carries the very
// signature of the Play install: a phone can move between the two without
// uninstalling, and Play Billing and push work in it wherever Google Play
// services do.
//
//   guard <features.controller.ts of the latest server release>
//     Whether this build may go out now. The app refuses a server older than
//     its MIN_NATIVE_API (client/src/native/serverAddress.ts), and a build can
//     be cut from dev before the server it needs is released. It may go out
//     once the latest server release answers a nativeApi at least that high
//     (its server/src/nest/health/features.controller.ts, which the workflow
//     writes out with git show). Prints publish=true or publish=false, for
//     $GITHUB_OUTPUT.
//
//   download <service account json> <package> <version code> <out.apk>
//     Asks the Play Developer API for the universal APK of that version code,
//     waiting a while for Google to generate it, and writes it to <out.apk>.
//
// No secret is printed: the service account file is read, not echoed.
import { createSign } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const APP_MIN_FILE = 'client/src/native/serverAddress.ts';
const SERVER_API_FILE = 'server/src/nest/health/features.controller.ts';
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
const REQUEST_TIMEOUT_MS = 30_000;
const APK_TIMEOUT_MS = 5 * 60_000;
const WAIT_STEPS_MS = [15_000, 30_000, 60_000, 120_000, 240_000];
const MAX_APK_BYTES = 400 * 1024 * 1024;

/** The app's MIN_NATIVE_API in the source of serverAddress.ts; throws when it cannot be read. */
export function appMinimumApi(source) {
  const found = /\bconst MIN_NATIVE_API = (\d+);/.exec(source);
  if (!found) throw new Error(`MIN_NATIVE_API not found in ${APP_MIN_FILE}`);
  return Number(found[1]);
}

/** The nativeApi the server answers in the source of features.controller.ts; throws when it cannot be read. */
export function serverApi(source) {
  const found = /\bnativeApi: (\d+),/.exec(source);
  if (!found) throw new Error(`nativeApi not found in ${SERVER_API_FILE}`);
  return Number(found[1]);
}

/** Whether a build that needs `appMinimum` may go out while the newest server release answers `released`. */
export function mayPublish(appMinimum, released) {
  return released >= appMinimum;
}

function guard(releasedFeatures) {
  const appMinimum = appMinimumApi(readFileSync(APP_MIN_FILE, 'utf8'));
  const released = serverApi(readFileSync(releasedFeatures, 'utf8'));
  const publish = mayPublish(appMinimum, released);
  console.error(`the app needs native API ${appMinimum}, the latest release answers ${released}: ${publish ? 'publish' : 'hold back'}`);
  console.log(`publish=${publish}`);
}

const b64url = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

async function accessToken(account) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: account.token_uri,
    iat: now,
    exp: now + 600,
  })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key).toString('base64url');
  const response = await fetch(account.token_uri, {
    method: 'POST',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = await response.json();
  if (!response.ok || typeof body.access_token !== 'string') {
    throw new Error(`Google refused the service account: HTTP ${response.status} ${body.error ?? ''}`);
  }
  return body.access_token;
}

/** The download id of the universal APK in a generatedApks.list answer, or null while Google has none yet. */
export function universalDownloadId(answer) {
  for (const generated of answer?.generatedApks ?? []) {
    const id = generated?.generatedUniversalApk?.downloadId;
    if (typeof id === 'string' && id.length > 0) return id;
  }
  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function download(accountFile, pkg, versionCode, out) {
  if (!/^[\w.]+$/.test(pkg) || !/^\d+$/.test(versionCode)) throw new Error('package or version code malformed');
  const token = await accessToken(JSON.parse(readFileSync(accountFile, 'utf8')));
  const headers = { authorization: `Bearer ${token}` };
  const base = `${API}/${pkg}/generatedApks/${versionCode}`;
  let id = null;
  for (let attempt = 0; id === null; attempt++) {
    const response = await fetch(base, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const body = await response.json();
    // 404 while Google has not processed the bundle yet; anything else is final.
    if (!response.ok && response.status !== 404) {
      throw new Error(`generatedApks.list: HTTP ${response.status} ${body.error?.message ?? ''}`);
    }
    id = response.ok ? universalDownloadId(body) : null;
    if (id === null) {
      if (attempt >= WAIT_STEPS_MS.length) throw new Error(`no universal APK for version code ${versionCode} yet`);
      console.error(`waiting for Google to build the universal APK of ${versionCode}`);
      await sleep(WAIT_STEPS_MS[attempt]);
    }
  }
  const response = await fetch(`${base}/downloads/${encodeURIComponent(id)}:download?alt=media`, {
    headers,
    signal: AbortSignal.timeout(APK_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`generatedApks.download: HTTP ${response.status}`);
  const apk = Buffer.from(await response.arrayBuffer());
  // An APK is a zip archive; anything else is an error page.
  if (apk.length > MAX_APK_BYTES || apk.subarray(0, 2).toString('latin1') !== 'PK') {
    throw new Error(`the download is not an APK (${apk.length} bytes)`);
  }
  writeFileSync(out, apk);
  console.error(`wrote ${out} (${apk.length} bytes)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === 'guard' && args.length === 1) guard(args[0]);
    else if (command === 'download' && args.length === 4) await download(...args);
    else throw new Error('usage: android-apk-release.mjs guard <features.controller.ts> | download <account.json> <package> <code> <out.apk>');
  } catch (err) {
    console.error(`::error::${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
