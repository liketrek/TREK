import { hasNativeFeature } from './capabilities';
import { reportNativeFailure } from './reportFailure';
import {
  TrekShell,
  type ClientCertificateImport,
  type ClientCertificateInfo,
  type ClientCertificateLabels,
} from './trekShell';

/**
 * The client certificate the app shows to a server behind mutual TLS (a proxy
 * such as Cloudflare, nginx, Caddy or Traefik that lets in only devices with
 * one). The address screen adds it when the server asks; the settings show,
 * replace and remove it. The binary keeps it (TrekClientIdentity on iOS and
 * Android) and shows it to the one host and port it was added for.
 */

export function clientCertificateSupported(): boolean {
  return hasNativeFeature('clientCertificate');
}

/** The stored certificate, or null when there is none or the binary cannot hold one. */
export async function storedClientCertificate(): Promise<ClientCertificateInfo | null> {
  if (!clientCertificateSupported()) return null;
  try {
    const { certificate } = await TrekShell.clientCertificate();
    return certificate ?? null;
  } catch (err) {
    reportNativeFailure(err);
    return null;
  }
}

/** Host and port a certificate for this server address is kept for; null for a plain http server. */
export function certificateTarget(serverUrl: string): { host: string; port: number } | null {
  let url: URL;
  try {
    url = new URL(serverUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !url.hostname) return null;
  return { host: url.hostname.toLowerCase(), port: url.port ? Number(url.port) : 443 };
}

/** Picks a certificate file for the server the app shows and keeps it in place of the stored one. */
export async function replaceClientCertificate(
  serverUrl: string,
  labels: ClientCertificateLabels
): Promise<ClientCertificateImport> {
  const target = certificateTarget(serverUrl);
  if (!target) return { result: 'failed', failure: 'format' };
  try {
    return await TrekShell.importClientCertificate({ ...target, labels });
  } catch (err) {
    reportNativeFailure(err);
    return { result: 'failed', failure: 'store' };
  }
}

export async function removeClientCertificate(): Promise<boolean> {
  try {
    await TrekShell.removeClientCertificate();
    return true;
  } catch (err) {
    reportNativeFailure(err);
    return false;
  }
}
