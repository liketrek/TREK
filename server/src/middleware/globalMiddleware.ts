import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { logDebug, logWarn, logError } from '../services/auditLog';
import { enforceGlobalMfaPolicy } from './mfaPolicy';

/**
 * The global request pipeline shared by the legacy Express app and the NestJS
 * instance. Both mount the *exact same* config so a request hitting a migrated
 * Nest route is protected identically to one hitting the legacy fallback
 * (helmet/CSP, CORS, HSTS, forced-HTTPS, the global MFA policy and request
 * logging). Keeping it in one place is what makes the strangler dispatch
 * behaviourally transparent — and is the prerequisite for retiring Express,
 * since the Nest instance must carry the whole shell on its own.
 *
 * `bodyParser` is opt-out: the Nest instance does its own body parsing, so it
 * passes `false` to avoid parsing the request twice.
 */
export function applyGlobalMiddleware(
  app: express.Application,
  opts: { bodyParser?: boolean } = {},
): void {
  const { bodyParser = true } = opts;

  // Trust first proxy (nginx/Docker) for correct req.ip
  if (process.env.NODE_ENV?.toLowerCase() === 'production' || process.env.TRUST_PROXY) {
    app.set('trust proxy', Number.parseInt(process.env.TRUST_PROXY) || 1);
  }

  // Compress responses (gzip via Accept-Encoding). The Atlas admin-0 country
  // GeoJSON is ~30 MB uncompressed, which stalls/aborts (~8s → net::ERR_FAILED)
  // behind reverse proxies and Cloudflare Tunnel (#1254); gzip brings it to ~4 MB.
  // SSE responses (the /mcp StreamableHTTP transport) must NOT be buffered, so
  // they are excluded explicitly.
  app.use(
    compression({
      filter: (req, res) => {
        const type = res.getHeader('Content-Type');
        if (typeof type === 'string' && type.includes('text/event-stream')) return false;
        return compression.filter(req, res);
      },
    }),
  );

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : null;

  let corsOrigin: cors.CorsOptions['origin'];
  if (allowedOrigins) {
    corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    };
  } else if (process.env.NODE_ENV?.toLowerCase() === 'production') {
    corsOrigin = false;
  } else {
    corsOrigin = true;
  }

  const shouldForceHttps = process.env.FORCE_HTTPS?.toLowerCase() === 'true';
  // HSTS is worth enabling any time we're serving production traffic,
  // not only when FORCE_HTTPS is set. Self-hosters behind Traefik /
  // Caddy / Cloudflare Tunnel typically leave FORCE_HTTPS unset (the
  // proxy handles the redirect for them), and the previous "HSTS off by
  // default" meant those instances never advertised HSTS at all.
  //
  // `includeSubDomains` stays OFF by default on purpose: an instance
  // running on an apex domain would otherwise force HTTPS on every
  // sibling subdomain the same operator may still be running over plain
  // HTTP. Operators who want the stricter policy opt in with
  // `HSTS_INCLUDE_SUBDOMAINS=true`.
  const hstsActive = shouldForceHttps || process.env.NODE_ENV === 'production';
  const hstsIncludeSubdomains = process.env.HSTS_INCLUDE_SUBDOMAINS === 'true';

  // RFC 8414 / RFC 9728 / RFC 7591: discovery docs and DCR are world-readable/writable.
  // /mcp needs open CORS so external MCP clients (ChatGPT, Claude.ai, Inspector) can call it
  // with Bearer tokens from any origin. /oauth/register and /oauth/authorize need it for
  // browser-based DCR/authorization preflights — the global cors({ origin: false }) would
  // answer OPTIONS without Access-Control-Allow-Origin before the SDK's own cors() runs.
  // All /.well-known/* paths get open CORS so clients probing openid-configuration or the
  // RFC 8414 path-suffixed AS metadata form don't get CORS-blocked (they get 404 JSON instead).
  app.use(
    (req: Request, _res: Response, next: NextFunction) => {
      if (
        req.path.startsWith('/.well-known/') ||
        req.path === '/oauth/register' ||
        req.path === '/oauth/authorize' ||
        req.path === '/oauth/userinfo' ||
        req.path === '/mcp'
      ) {
        cors({ origin: '*', credentials: false })(req, _res, next);
      } else {
        next();
      }
    },
  );
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'wasm-unsafe-eval'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: [
          "'self'", "ws:", "wss:",
          "https://nominatim.openstreetmap.org", "https://overpass-api.de",
          "https://places.googleapis.com", "https://api.openweathermap.org",
          "https://en.wikipedia.org", "https://commons.wikimedia.org",
          "https://*.basemaps.cartocdn.com", "https://*.tile.openstreetmap.org",
          "https://unpkg.com", "https://open-meteo.com", "https://api.open-meteo.com",
          "https://geocoding-api.open-meteo.com", "https://api.frankfurter.dev",
          "https://router.project-osrm.org/route/v1/", "https://routing.openstreetmap.de/",
          "https://api.mapbox.com", "https://*.tiles.mapbox.com", "https://events.mapbox.com"
        ],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        // 'self' so same-origin file previews can embed PDFs via <object>/<embed>
        // (Firefox/Chrome enforce object-src; 'none' broke inline PDF previews there).
        objectSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'self'"],
        // Restrict <form> submission targets (form-action has no default-src
        // fallback, so it must be set explicitly).
        formAction: ["'self'"],
        upgradeInsecureRequests: shouldForceHttps ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: hstsActive ? { maxAge: 31536000, includeSubDomains: hstsIncludeSubdomains } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  if (shouldForceHttps) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path === '/api/health') return next();
      if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
      res.redirect(301, 'https://' + req.headers.host + req.url);
    });
  }

  if (bodyParser) {
    app.use(express.json({ limit: '100kb' }));
    app.use(express.urlencoded({ extended: true }));
  }
  app.use(cookieParser());
  app.use(enforceGlobalMfaPolicy);

  // Request logging with sensitive field redaction
  const SENSITIVE_KEYS = new Set(['password', 'new_password', 'current_password', 'token', 'jwt', 'authorization', 'cookie', 'client_secret', 'mfa_token', 'code', 'smtp_pass']);
  const redact = (value: unknown): unknown => {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return (value as unknown[]).map(redact);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : redact(v);
    }
    return out;
  };

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api/health') return next();
    const startedAt = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - startedAt;
      if (res.statusCode >= 500) {
        logError(`${req.method} ${req.path} ${res.statusCode} ${ms}ms ip=${req.ip}`);
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        logDebug(`${req.method} ${req.path} ${res.statusCode} ${ms}ms ip=${req.ip}`);
      } else if (res.statusCode >= 400) {
        logWarn(`${req.method} ${req.path} ${res.statusCode} ${ms}ms ip=${req.ip}`);
      }
      const q = Object.keys(req.query).length ? ` query=${JSON.stringify(redact(req.query))}` : '';
      const b = req.body && Object.keys(req.body).length ? ` body=${JSON.stringify(redact(req.body))}` : '';
      logDebug(`${req.method} ${req.path} ${res.statusCode} ${ms}ms ip=${req.ip}${q}${b}`);
    });
    next();
  });
}
