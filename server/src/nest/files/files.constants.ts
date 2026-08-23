import path from 'path';

/**
 * File-domain constants and pure helpers, split out of FilesService because
 * they are consumed at module-load time (multer interceptor configs in the
 * files/collab/journey controllers and the plugin host factory) where no DI
 * container exists yet. Everything here is DB-free and side-effect-free at
 * import; the one request-time DB read those configs need lives in
 * files.bridge.ts.
 */

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const DEFAULT_ALLOWED_EXTENSIONS = 'jpg,jpeg,png,gif,webp,heic,pdf,doc,docx,xls,xlsx,txt,csv,pkpass,pkpasses,md,markdown';

// Video support (#823). Gallery/media uploads accept these in addition to images,
// independent of the admin doc-types allowlist. Videos are stored as-is and
// streamed with HTTP Range; the cap is higher than images because phone clips are
// large.
export const VIDEO_EXTENSIONS = ['mp4', 'm4v', 'webm', 'mov'];
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

export function isVideoMime(mime: string | undefined | null): boolean {
  return !!mime && mime.startsWith('video/');
}

export function isVideoExtension(ext: string): boolean {
  return VIDEO_EXTENSIONS.includes(ext.toLowerCase().replace(/^\./, ''));
}
// Single authoritative blocklist for every file-upload surface (main
// file manager + collab attachments). When the admin setting
// `allowed_file_types` is `*`, this list is still enforced so the
// wildcard doesn't silently admit executables/scripts.
export const BLOCKED_EXTENSIONS = [
  // Server-rendered / scripted content that could XSS a viewer. Downloads are
  // served inline with an extension-derived Content-Type, so every spelling a
  // browser renders as a document has to be listed, not just the common ones.
  '.svg', '.svgz', '.html', '.htm', '.shtml', '.shtm', '.xml', '.xhtml', '.xht',
  // Scripts
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.php', '.py', '.rb', '.pl',
  // Executables
  '.exe', '.bat', '.sh', '.cmd', '.msi', '.dll', '.com', '.vbs', '.ps1', '.app',
];
// One directory level deeper than the legacy src/services/fileService.ts, so
// the extra '..' keeps the same absolute <server>/uploads/files under both the
// src (vitest) and dist (runtime) layouts.
export const filesDir = path.join(__dirname, '../../../uploads/files');
