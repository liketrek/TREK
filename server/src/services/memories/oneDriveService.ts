/**
 * oneDriveService.ts
 * OneDrive/Microsoft Photos integration for Trek Memories
 * Uses Microsoft Graph API with OAuth 2.0
 */
import { Response } from 'express';
import { db } from '../../db/database';
import { encrypt_api_key, decrypt_api_key } from '../apiKeyCrypto';
import { addTripPhotos } from './unifiedService';
import { Selection, pipeAsset } from './helpersService';


const ONEDRIVE_PROVIDER = 'onedrive';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const AUTH_BASE = 'https://login.microsoftonline.com/common/oauth2/v2.0';

// ── Config from env ──────────────────────────────────────────────────────────
export function getOAuthConfig() {
  return {
    clientId:     process.env.ONEDRIVE_CLIENT_ID     || '',
    clientSecret: process.env.ONEDRIVE_CLIENT_SECRET || '',
    redirectUri:  process.env.ONEDRIVE_REDIRECT_URI  || `${process.env.APP_URL || ''}/api/memories/onedrive/callback`,
  };
}

// ── OAuth URL ────────────────────────────────────────────────────────────────
export function getAuthUrl(userId: number): string {
  const { clientId, redirectUri } = getOAuthConfig();
  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');
  const scopes = 'offline_access Files.Read Files.Read.All User.Read';
  return `${AUTH_BASE}/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&prompt=consent`;
}

// ── Token exchange ───────────────────────────────────────────────────────────
export async function exchangeCode(code: string, userId: number): Promise<{ success: boolean; error?: string }> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  try {
    const r = await fetch(`${AUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        code,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });
    const data = await r.json() as any;
    if (!data.access_token) return { success: false, error: data.error_description || 'Token exchange failed' };

    const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
    db.prepare(`
      UPDATE users SET
        onedrive_access_token  = ?,
        onedrive_refresh_token = ?,
        onedrive_token_expiry  = ?
      WHERE id = ?
    `).run(
      encrypt_api_key(data.access_token),
      encrypt_api_key(data.refresh_token),
      expiresAt,
      userId,
    );
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Token refresh ────────────────────────────────────────────────────────────
async function refreshToken(userId: number): Promise<string | null> {
  const user = db.prepare('SELECT onedrive_refresh_token FROM users WHERE id = ?').get(userId) as any;
  if (!user?.onedrive_refresh_token) return null;
  const refreshTk = decrypt_api_key(user.onedrive_refresh_token);
  if (!refreshTk) return null;

  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  try {
    const r = await fetch(`${AUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: refreshTk,
        redirect_uri:  redirectUri,
        grant_type:    'refresh_token',
      }),
    });
    const data = await r.json() as any;
    if (!data.access_token) return null;

    const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
    db.prepare(`
      UPDATE users SET
        onedrive_access_token = ?,
        onedrive_token_expiry = ?
        ${data.refresh_token ? ', onedrive_refresh_token = ?' : ''}
      WHERE id = ?
    `).run(
      encrypt_api_key(data.access_token),
      expiresAt,
      ...(data.refresh_token ? [encrypt_api_key(data.refresh_token)] : []),
      userId,
    );
    return data.access_token;
  } catch {
    return null;
  }
}

// ── Get valid access token ───────────────────────────────────────────────────
async function getAccessToken(userId: number): Promise<string | null> {
  const user = db.prepare('SELECT onedrive_access_token, onedrive_token_expiry FROM users WHERE id = ?').get(userId) as any;
  if (!user?.onedrive_access_token) return null;

  const expiry = user.onedrive_token_expiry || 0;
  if (Math.floor(Date.now() / 1000) < expiry - 60) {
    return decrypt_api_key(user.onedrive_access_token);
  }
  return refreshToken(userId);
}

// ── Graph API helper ─────────────────────────────────────────────────────────
async function graphGet(userId: number, path: string): Promise<{ data?: any; error?: string; status?: number }> {
  const token = await getAccessToken(userId);
  if (!token) return { error: 'Not connected to OneDrive', status: 401 };
  const r = await fetch(`${GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({})) as any;
    return { error: e?.error?.message || r.statusText, status: r.status };
  }
  return { data: await r.json() };
}

// ── Connection status ────────────────────────────────────────────────────────
export function getConnectionSettings(userId: number) {
  const user = db.prepare('SELECT onedrive_access_token FROM users WHERE id = ?').get(userId) as any;
  return {
    connected: !!(user?.onedrive_access_token),
    authUrl: getAuthUrl(userId),
  };
}

export async function getConnectionStatus(userId: number) {
  const token = await getAccessToken(userId);
  if (!token) return { connected: false };
  const result = await graphGet(userId, '/me');
  if (result.error) return { connected: false };
  return {
    connected: true,
    user: {
      name:  result.data?.displayName,
      email: result.data?.mail || result.data?.userPrincipalName,
    },
  };
}

export function disconnect(userId: number): void {
  db.prepare(`
    UPDATE users SET
      onedrive_access_token  = NULL,
      onedrive_refresh_token = NULL,
      onedrive_token_expiry  = NULL
    WHERE id = ?
  `).run(userId);
}

// ── List albums (OneDrive folders with photos) ────────────────────────────────
export async function listAlbums(userId: number) {
  // Use /me/drive/special/photos/children to list photo folders
  const result = await graphGet(userId, '/me/drive/special/photos/children?$select=id,name,folder,photo,lastModifiedDateTime&$top=100');
  if (result.error) return { error: result.error, status: result.status };

  const folders = (result.data?.value || []).filter((i: any) => i.folder);
  return {
    albums: folders.map((f: any) => ({
      id:    f.id,
      name:  f.name,
      count: f.folder?.childCount || 0,
    })),
  };
}

// ── Get photos in a folder/album ─────────────────────────────────────────────
export async function getAlbumPhotos(userId: number, albumId: string) {
  const result = await graphGet(userId, `/me/drive/items/${albumId}/children?$select=id,name,photo,image,thumbnails,createdDateTime,lastModifiedDateTime&$top=200&$expand=thumbnails`);
  if (result.error) return { error: result.error, status: result.status };

  const photos = (result.data?.value || []).filter((i: any) => i.photo || i.image);
  return {
    assets: photos.map((p: any) => ({
      id:          p.id,
      name:        p.name,
      takenAt:     p.photo?.takenDateTime || p.createdDateTime,
      thumbnail:   p.thumbnails?.[0]?.large?.url || p.thumbnails?.[0]?.medium?.url || p.thumbnails?.[0]?.small?.url,
      width:       p.image?.width,
      height:      p.image?.height,
    })),
  };
}

// ── Browse timeline (recent photos) ─────────────────────────────────────────
export async function browseTimeline(userId: number) {
  const result = await graphGet(userId, '/me/drive/special/photos/children?$select=id,name,photo,image,thumbnails,createdDateTime&$top=100&$expand=thumbnails&$orderby=lastModifiedDateTime+desc');
  if (result.error) return { error: result.error, status: result.status };

  const photos = (result.data?.value || []).filter((i: any) => i.photo || i.image);
  return {
    assets: photos.map((p: any) => ({
      id:        p.id,
      name:      p.name,
      takenAt:   p.photo?.takenDateTime || p.createdDateTime,
      thumbnail: p.thumbnails?.[0]?.large?.url || p.thumbnails?.[0]?.medium?.url || p.thumbnails?.[0]?.small?.url,
    })),
  };
}

// ── Search photos by date range ──────────────────────────────────────────────
export async function searchPhotos(userId: number, from?: string, to?: string, page = 1, size = 50) {
  const from_ = from ? new Date(from).toISOString() : undefined;
  const to_   = to   ? new Date(to).toISOString()   : undefined;
  const collected: any[] = [];

  // Años relevantes para el filtro
  const fromYear = from ? new Date(from).getFullYear() : null;
  const toYear   = to   ? new Date(to).getFullYear()   : null;
  const fromMonth = from ? String(new Date(from).getMonth() + 1).padStart(2, '0') : null;
  const toMonth   = to   ? String(new Date(to).getMonth() + 1).padStart(2, '0')   : null;

  // Obtener subcarpetas de /Fotos
  const foldersRes = await graphGet(userId, `/me/drive/root:/Fotos:/children?$select=id,name,folder&$top=100`);
  if (foldersRes.error) return { assets: [], hasMore: false };

  const allFolderIds: string[] = [];

  for (const f of foldersRes.data?.value || []) {
    if (!f.folder) continue;
    allFolderIds.push(f.id);

    // Subcarpetas de segundo nivel (ej: Camera Roll/2026)
    const subRes = await graphGet(userId, `/me/drive/items/${f.id}/children?$select=id,name,folder&$top=100`);
    if (subRes.error) continue;

    for (const sub of subRes.data?.value || []) {
      if (!sub.folder) continue;

      // Filtrar por año si hay filtro de fechas
      const subYear = parseInt(sub.name);
      if (fromYear && toYear && !isNaN(subYear)) {
        if (subYear < fromYear || subYear > toYear) continue;
      }
      allFolderIds.push(sub.id);

      // Subcarpetas de tercer nivel (ej: Camera Roll/2026/04)
      const subSubRes = await graphGet(userId, `/me/drive/items/${sub.id}/children?$select=id,name,folder&$top=100`);
      if (subSubRes.error) continue;

      for (const subsub of subSubRes.data?.value || []) {
        if (!subsub.folder) continue;

        // Filtrar por mes si hay filtro de fechas del mismo año
        const subMonth = subsub.name.padStart(2, '0');
        if (fromYear && toYear && fromYear === toYear && fromMonth && toMonth) {
          if (subMonth < fromMonth || subMonth > toMonth) continue;
        }
        allFolderIds.push(subsub.id);
      }
    }
  }

  // Buscar fotos en cada carpeta
  for (const folderId of allFolderIds) {
    let url: string | null = `/me/drive/items/${folderId}/children?$select=id,name,photo,image,file,thumbnails,createdDateTime&$top=200&$expand=thumbnails`;
    while (url) {
      const result = await graphGet(userId, url);
      if (result.error) break;
      const items = (result.data?.value || []).filter((i: any) =>
        i.photo || i.image || i.file?.mimeType?.startsWith('image/')
      );
      for (const p of items) {
        const taken = p.photo?.takenDateTime || p.createdDateTime;
        if (from_ && taken < from_) continue;
        if (to_   && taken > to_)   continue;
        collected.push(p);
      }
      const next = result.data?.['@odata.nextLink'];
      if (!next) break;
      try { const u = new URL(next); url = u.pathname.replace('/v1.0', '') + u.search; }
      catch { break; }
    }
  }

  collected.sort((a, b) => {
    const ta = a.photo?.takenDateTime || a.createdDateTime;
    const tb = b.photo?.takenDateTime || b.createdDateTime;
    return tb.localeCompare(ta);
  });

  const start = (page - 1) * size;
  return {
    assets: collected.slice(start, start + size).map((p: any) => ({
      id:        p.id,
      name:      p.name,
      takenAt:   p.photo?.takenDateTime || p.createdDateTime,
      thumbnail: p.thumbnails?.[0]?.large?.url || p.thumbnails?.[0]?.medium?.url || p.thumbnails?.[0]?.small?.url,
    })),
    hasMore: collected.length > start + size,
  };
}

// ── Stream/proxy a OneDrive photo ────────────────────────────────────────────
export async function streamOneDriveAsset(
  res: Response,
  userId: number,
  assetId: string,
  size: 'thumbnail' | 'original' = 'thumbnail',
): Promise<void> {
  const token = await getAccessToken(userId);
  if (!token) { res.status(401).json({ error: 'Not connected' }); return; }

  try {
    let url: string;
    if (size === 'thumbnail') {
      const meta = await graphGet(userId, `/me/drive/items/${assetId}/thumbnails`);
      if (meta.error || !meta.data?.value?.length) {
        res.status(404).json({ error: 'Thumbnail not found' }); return;
      }
      url = meta.data.value[0]?.large?.url || meta.data.value[0]?.medium?.url || meta.data.value[0]?.small?.url;
      if (!url) { res.status(404).json({ error: 'Thumbnail URL not found' }); return; }
      // Thumbnails from Graph are pre-signed URLs, no auth needed
      const r = await fetch(url);
      if (!r.ok) { res.status(r.status).end(); return; }
      res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      const buf = await r.arrayBuffer();
      res.end(Buffer.from(buf));
    } else {
      // Use large thumbnail from Graph (already JPEG, no HEIC issues)
      const meta = await graphGet(userId, `/me/drive/items/${assetId}/thumbnails/0`);
      if (meta.error || !meta.data) { res.status(404).json({ error: 'Not found' }); return; }
      const url = meta.data.large?.url || meta.data.medium?.url || meta.data.small?.url;
      if (!url) { res.status(404).json({ error: 'Thumbnail URL not found' }); return; }
      const r = await fetch(url);
      if (!r.ok) { res.status(r.status).end(); return; }
      res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      const buf = await r.arrayBuffer();
      res.end(Buffer.from(buf));
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// ── Sync album photos to a trip ──────────────────────────────────────────────
export async function syncAlbumAssets(
  userId: number,
  tripId: string,
  albumId: string,
  shared: boolean,
  socketId: string | undefined,
): Promise<{ success: boolean; added?: number; error?: string }> {
  const result = await getAlbumPhotos(userId, albumId);
  if ('error' in result && result.error) return { success: false, error: result.error };

  const assets = (result as any).assets || [];
  if (!assets.length) return { success: true, added: 0 };

  const selections: Selection[] = assets.map((a: any) => ({
    assetId:  a.id,
    provider: ONEDRIVE_PROVIDER,
  }));

  const addResult = await addTripPhotos(tripId, userId, shared, selections, socketId);
  if ('error' in addResult) return { success: false, error: addResult.error.message };
  return { success: true, added: addResult.data.added };
}

export function isValidAssetId(id: string): boolean {
  return /^[a-zA-Z0-9_!%-]+$/.test(id) && id.length <= 200;
}
