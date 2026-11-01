# Install: Helm

Deploy TREK on Kubernetes using the official Helm chart.

## Add the Chart Repository

```bash
helm repo add trek https://chart.liketrek.com
helm repo update
```

> **Note:** `chart.liketrek.com` is a custom domain (CNAME) for the GitHub Pages site at `https://liketrek.github.io/TREK` — both serve the same chart repository. Using the custom domain keeps your setup working even if the GitHub repository moves again.

> **⚠️ Repository moved:** The chart is no longer served at `https://mauriceboe.github.io/TREK` (the project moved from a personal repo to the `liketrek` organization). If you added the repo from the old URL, switch to the new one:
>
> ```bash
> helm repo remove trek
> helm repo add trek https://chart.liketrek.com
> helm repo update
> ```
>
> Existing releases keep working — only the repo URL changes; future `helm repo update` / `helm upgrade` runs require the new URL. (`https://liketrek.github.io/TREK` also works — it redirects to `chart.liketrek.com`.)

## Basic Install

```bash
helm install trek trek/trek
```

This deploys TREK with default values: a `ClusterIP` service on port 3000, 1 Gi PVCs for data and uploads, and no ingress.

## Encryption Key

`ENCRYPTION_KEY` encrypts stored secrets (API keys, MFA, SMTP, OIDC) at rest. There are three ways to handle it:

**Option 1 — Let the chart generate a random key (recommended for new installs):**

```bash
helm install trek trek/trek --set generateEncryptionKey=true
```

The chart generates a 32-character alphanumeric key at install time and preserves it across upgrades. Note that this differs from the 64-character hex key produced by `openssl rand -hex 32` — both formats are accepted by the server.

**Option 2 — Set an explicit key:**

```bash
helm install trek trek/trek \
  --set secretEnv.ENCRYPTION_KEY=$(openssl rand -hex 32)
```

**Option 3 — Use an existing Kubernetes Secret:**

```bash
kubectl create secret generic trek-secrets \
  --from-literal=ENCRYPTION_KEY=$(openssl rand -hex 32)

helm install trek trek/trek \
  --set existingSecret=trek-secrets
```

If `existingSecret` uses a different key name than `ENCRYPTION_KEY`, specify it with `--set existingSecretKey=MY_KEY_NAME`.

> **Note:** If both `generateEncryptionKey` and `existingSecret` are set, `existingSecret` takes precedence. Only one method should be active at a time.

> **GitOps:** `generateEncryptionKey` reads the existing secret from the cluster to keep the key across upgrades. Under `helm template`, ArgoCD or Flux the chart cannot do that and renders a new key on every sync. TREK then refuses to start rather than lose every stored secret (see [Encryption-Key-Rotation](Encryption-Key-Rotation#key-resolution-order)). Use `existingSecret` in those setups.

> **Note:** If `ENCRYPTION_KEY` is left empty, the server resolves it automatically: existing installs fall back to `data/.jwt_secret` (encrypted data stays readable after upgrade); fresh installs auto-generate a key persisted to the data PVC.

> **Note:** `JWT_SECRET` is managed entirely by the server — auto-generated on first start and persisted to the data PVC. It can be rotated via the admin panel (Settings → Danger Zone → Rotate JWT Secret). No Helm configuration is needed or supported for it.

## Admin Account

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are set via `secretEnv`. They are only used on first boot when no users exist yet. **Both must be set together** — if either is missing, the server ignores both values and instead creates the admin account with email `admin@trek.local` and a random password, which is printed to the server log.

```bash
helm install trek trek/trek \
  --set secretEnv.ADMIN_EMAIL=admin@example.com \
  --set secretEnv.ADMIN_PASSWORD=<your-secure-password>
```

> **Note:** When `OIDC_ONLY=true` is configured together with `OIDC_ISSUER` and `OIDC_CLIENT_ID`, no local admin account is created on first boot. Instead, the first user to log in via SSO automatically becomes admin.

## Key `values.yaml` Settings

### Image

```yaml
image:
  repository: mauriceboe/trek
  # tag: latest        # defaults to the chart's appVersion
  pullPolicy: IfNotPresent

# Optional: pull secrets for private registries
imagePullSecrets: []
  # - name: my-registry-secret
```

### Service

```yaml
service:
  type: ClusterIP   # change to LoadBalancer or NodePort to expose externally
  port: 3000
```

### Plain Environment Variables (`env`)

```yaml
env:
  NODE_ENV: production
  PORT: 3000
  # TZ: "Europe/Berlin"          # timezone for logs, reminders, cron jobs
  # LOG_LEVEL: "info"            # "info" = concise, "debug" = verbose
  # TREK_WIKI_DIR: "/app/wiki"   # where /help reads its docs from; leave unset (the image ships them)
  # DEFAULT_LANGUAGE: "en"      # fallback language on the login page
  # MCP_MAX_SESSION_PER_USER: "20"  # max concurrent MCP sessions per user
  # GOOGLE_LIST_DATA_BASE: ""    # base URL of a list-data service for pasted list URLs
  # ALLOWED_ORIGINS: "https://trek.example.com"
  # APP_URL: "https://trek.example.com"
  # FORCE_HTTPS: "false"         # enable HTTPS redirect + HSTS; set TRUST_PROXY for correct client IPs
  # HSTS_INCLUDE_SUBDOMAINS: "false"  # add includeSubDomains to the HSTS header
  # SESSION_DURATION: "24h"      # session length without "Remember me"
  # SESSION_DURATION_REMEMBER: "30d"  # session length with "Remember me", and every SSO session with OIDC_ONLY
  # TRUST_PROXY: "1"             # proxy hops for X-Forwarded-For/Proto; defaults to 1 in production
  # COOKIE_SECURE: "true"        # auto-derived; set "false" only for local HTTP testing
  # ALLOW_INTERNAL_NETWORK: "false"  # set "true" if Immich or other services are on a private network
  # ALLOW_LINK_LOCAL_IPS: ""     # single link-local addresses TREK may reach, e.g. "169.254.1.2"
  # HTTP_PROXY: ""               # outbound proxy for HTTP requests
  # HTTPS_PROXY: ""              # outbound proxy for HTTPS requests
  # NO_PROXY: "localhost,127.0.0.1"  # hosts that bypass the proxy
  # DEMO_MODE: "false"           # enable demo mode (hourly data resets)
  # MCP_RATE_LIMIT: "300"        # max MCP requests per user per minute
  # NOMINATIM_URL: ""            # your own Nominatim for every geocoding call
  # OVERPASS_URL: ""             # your own Overpass endpoint(s), comma-separated
  # OVERPASS_TIMEOUT_MS: "25000" # per-endpoint Overpass timeout
  # TREK_PLACES_ENABLED: "false" # stop asking the TREK Places API
  # TREK_PLACES_URL: ""          # a copy of the TREK Places API you run yourself
  # AMAP_API_BASE: ""            # send the Amap calls through a proxy or gateway
  # OIDC_ISSUER: "https://auth.example.com"
  # OIDC_CLIENT_ID: "trek"
  # OIDC_DISPLAY_NAME: "SSO"
  # OIDC_ONLY: "false"           # force SSO-only mode; disables password login
  # OIDC_ADMIN_CLAIM: ""         # OIDC claim used to identify admin users
  # OIDC_ADMIN_VALUE: ""         # value of that claim that grants admin role
  # OIDC_USERNAME_CLAIM: ""      # claim a new account's username comes from, e.g. preferred_username
  # OIDC_SCOPE: "openid email profile groups"
  # OIDC_DISCOVERY_URL: ""       # override for providers with non-standard discovery paths (e.g. Authentik)
  # VAPID_PUBLIC_KEY: ""         # Web Push: public half of your own key pair; leave unset to use the generated one
  # VAPID_SUBJECT: "mailto:admin@example.com"  # Web Push contact; defaults to APP_URL when it is https
```

> **Note:** The chart only passes on the keys its ConfigMap declares. `FILE_UPLOAD_LIMIT_MB` and `RESTORE_FROM_BACKUP` are not among them, so a value under `env:` is dropped and the default stays. Put such a variable in `extraEnv` (see below) instead. See [Environment-Variables](Environment-Variables#default_language--supported-codes) for the language codes.

### Sensitive Variables (`secretEnv`)

These are stored in a Kubernetes Secret and injected as environment variables:

```yaml
secretEnv:
  ENCRYPTION_KEY: ""        # recommended: openssl rand -hex 32
  ADMIN_EMAIL: ""           # initial admin email (first boot only)
  ADMIN_PASSWORD: ""        # initial admin password (first boot only)
  OIDC_CLIENT_SECRET: ""    # set if using OIDC
  UNSPLASH_ACCESS_KEY: ""   # optional; free key from unsplash.com/developers
  PLACES_API_KEY: ""        # optional; Google Maps API key, wins over the one in Admin > Settings
  AMAP_API_KEY: ""          # optional; Amap Web 服务 key for place search in mainland China
  AMAP_API_SECRET: ""       # optional; the signing secret of that key, only when signing is on
  VAPID_PRIVATE_KEY: ""     # optional; Web Push private half, only together with env.VAPID_PUBLIC_KEY
  SMTP_PASS: ""             # optional; password of your SMTP account
```

Alternatively, use `generateEncryptionKey: true` to let the chart generate and manage the encryption key, or point `existingSecret` / `existingSecretKey` at an existing Kubernetes Secret. A Secret you bring yourself can carry any of the keys above by the same names, `SMTP_PASS` included.

Every value the chart writes into its Secret is quoted, so a password such as `12345` or a value like `true` reaches the container as the text you typed.

> **Note:** Web Push needs none of the `VAPID_*` values. TREK generates its key pair on first start and keeps it in the database on the data PVC, so it survives upgrades and restores. Set `env.VAPID_PUBLIC_KEY` and `secretEnv.VAPID_PRIVATE_KEY` together only to bring a pair of your own; changing the pair later means every device has to subscribe again. See [Environment-Variables](Environment-Variables#web-push).

> **Note:** Without `UNSPLASH_ACCESS_KEY` the server queries Unsplash's unauthenticated endpoint, which many datacenter and VPS IP ranges — including a lot of Kubernetes clusters — are blocked or rate-limited on. Trip-cover and place-image search then fail with **"Unsplash search unavailable"**. A free Access Key switches the server to Unsplash's authenticated API (`api.unsplash.com`), which is not subject to that block. The key can also be set in **Admin → Settings → API Keys**; this value takes priority over that one. See [Environment-Variables](Environment-Variables#image-search-unsplash).

### Persistent Storage

The data PVC holds the database, the plugins you install and the automatic `pre-migrate-<schema>-<time>.db` copy TREK writes before an upgrade migrates the database, so the previous image can run on that copy again. See [Updating](Updating).

```yaml
persistence:
  enabled: true
  data:
    size: 1Gi     # SQLite database, logs, secrets
  uploads:
    size: 1Gi     # uploaded files — increase if you expect large media uploads
```

### Security Context

```yaml
podSecurityContext:
  fsGroup: 1000
  fsGroupChangePolicy: OnRootMismatch
securityContext: {}
```

With these defaults the container starts as root, gives every file under `/app/data` and `/app/uploads` that does not belong to the `node` user (uid 1000) to `node`, and then drops to `node`. Files that already belong to `node` are left alone, so a large uploads volume does not slow down the start. If ownership has to be corrected, the log says `Correcting ownership of /app/uploads for the node user...` before TREK's own start-up lines.

To run TREK as `node` from the first process on, for example in a namespace that enforces the `restricted` Pod Security Standard, set the user in the pod security context. The image notices it is not root and starts Node directly, with no ownership step and no privilege drop:

```yaml
podSecurityContext:
  fsGroup: 1000
  fsGroupChangePolicy: OnRootMismatch
  runAsUser: 1000
  runAsGroup: 1000
  runAsNonRoot: true
  seccompProfile:
    type: RuntimeDefault
securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop: [ALL]
```

The volumes then have to be writable by uid 1000 or gid 1000. `fsGroup` takes care of that on storage that supports it; on NFS and other volumes the kubelet does not relabel, give the export to uid 1000 yourself. You no longer need to override the container command for this.

### Resource Limits

```yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Health Probes

Startup, liveness and readiness probes are configurable under `probes`:

- **startup** hits `/api/health` and gives a first boot, a long migration or a restore at boot up to ten minutes (`failureThreshold: 60` × `periodSeconds: 10`) before liveness takes over.
- **liveness** hits `/api/health`, which only says the process answers. A long restore does not fail it.
- **readiness** hits `/api/health/ready`, which also asks the database. While the database does not answer, the pod stops getting traffic without being restarted. It also answers 503 as soon as the pod starts shutting down, so traffic moves away for the whole drain.

```bash
helm install trek trek/trek   --set probes.startup.failureThreshold=120   --set probes.readiness.periodSeconds=20
```

Overrides are merged over the defaults, so setting one key keeps the rest. To switch a probe to `exec` or `tcpSocket`, clear the shipped handler in the same override (`--set probes.liveness.httpGet=null`), otherwise Kubernetes rejects the pod with "may not specify more than 1 handler type". Set `probes.startup=null` to drop a probe entirely.

`env.PORT` can be changed: the container port is named `http`, and the Service and every probe point at that name, so they follow it.

### Further environment variables

The `env` block lists the common settings. Anything else goes in `extraEnv` (plain values) or `extraEnvFrom` (whole ConfigMaps or Secrets):

```yaml
extraEnv:
  - name: SESSION_DURATION
    value: 7d
extraEnvFrom:
  - secretRef:
      name: trek-smtp
```

### Further volumes

`extraVolumes` adds volumes to the pod, and `extraVolumeMounts` mounts them in the TREK container, next to `/app/data` and `/app/uploads`. Both go into the Deployment as written, and the chart does not create the objects they name. For example, to give the booking import your own KItinerary extractors from a ConfigMap (one `.json` and one `.js` key for each extractor, see [Reservations-and-Bookings](Reservations-and-Bookings#your-own-extractors)):

```yaml
extraVolumes:
  - name: kitinerary-extractors
    configMap:
      name: trek-kitinerary-extractors
extraVolumeMounts:
  - name: kitinerary-extractors
    mountPath: /usr/local/share/kitinerary/extractors
    readOnly: true
```

### Ingress

```yaml
ingress:
  enabled: true
  className: "nginx"   # your ingress class
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "86400"  # required for WebSockets
    nginx.ingress.kubernetes.io/proxy-body-size: "500m"       # required for backup restore
  hosts:
    - host: trek.example.com
      paths:
        - /
  tls:
    - secretName: trek-tls
      hosts:
        - trek.example.com
```

> **Important:** TREK uses WebSockets on `/ws`. Your ingress controller must support WebSocket upgrades. Set `proxy-read-timeout` to at least `86400` and `proxy-body-size` to at least `500m` for backup restores and video uploads.

> **Note:** Keep `env.ALLOWED_ORIGINS` in sync with `ingress.hosts` — the chart does not synchronize these automatically.

> **Note:** When using ingress with TLS termination, set `env.FORCE_HTTPS: "true"` and `env.TRUST_PROXY: "1"` to enable HTTPS redirects, HSTS, and secure cookies.

### HTTPRoute

HTTPRoute support is off by default. To attach TREK to an existing Gateway, enable it in your values file:

```yaml
httpRoute:
  enabled: true
  annotations: {}
  parentRefs:
    - name: gateway
      namespace: gateway-system
      sectionName: https
  hostnames:
    - trek.example.com
  paths:
    - /
  timeouts:
    request: "0s"
    backendRequest: "0s"
```

The cluster needs the Gateway API `HTTPRoute` v1 CRD and a compatible controller. The chart creates only an HTTPRoute to TREK's existing Service on `service.port`; your operator must provide the Gateway and GatewayClass, configure its listener and TLS certificate, and allow routes from the chart's namespace. When enabled, `parentRefs` and `paths` must be non-empty. Paths are string prefixes. Ingress and HTTPRoute may be enabled together.

Timeout fields are Standard Channel in Gateway API v1.2, though controller support varies. If omitted, the controller's timeout defaults apply. `0s` disables that request timeout; controller idle and buffering limits can still affect `/ws` and streamed assistant responses. Set `env.ALLOWED_ORIGINS` and `env.APP_URL` to the public URL. If the Gateway terminates TLS, also set `env.FORCE_HTTPS: "true"` and `env.TRUST_PROXY: "1"`.

## Upgrade

The Deployment uses the `Recreate` update strategy (`updateStrategy: Recreate`): the old pod stops before the new one starts. TREK is a single-writer SQLite application, and during a rolling update the new pod would migrate the database while the old one still writes to it. A ReadWriteMany volume does not make that safe, so leave the strategy as it is and keep one replica.

The in-app Help pages come from the image (`/app/wiki`), so they match the version you upgrade to.

```bash
helm repo update
helm upgrade trek trek/trek
```

## Full Values Reference

See the [`charts/README.md`](https://github.com/liketrek/TREK/blob/main/charts/README.md) for all available values.

## Next Steps

- [Environment-Variables](Environment-Variables) — full variable reference
- [Reverse-Proxy](Reverse-Proxy) — proxy configuration for non-Kubernetes deployments
