# TREK Helm Chart

This is a minimal Helm chart for deploying the TREK app.

## Features
- Deploys the TREK container
- Exposes port 3000 via Service
- Optional persistent storage for `/app/data` and `/app/uploads`, plus extra volumes and mounts
- Configurable environment variables and secrets
- Optional generic Ingress support
- Optional Gateway API HTTPRoute support
- Configurable health checks (liveness/readiness probes) on `/api/health`

## Helm Repository

A hosted Helm repository is available:

```sh
helm repo add trek https://chart.liketrek.com
helm repo update
helm install trek trek/trek
```

> **Note:** `chart.liketrek.com` is a custom domain (CNAME) for the GitHub Pages site at `https://liketrek.github.io/TREK` — both URLs serve the same repository. The github.io URL keeps working (it redirects to `chart.liketrek.com`), but the custom domain is the canonical one to use.

## Usage

Or install directly from the local chart:

```sh
helm install trek ./charts/trek \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=yourdomain.com
```

See `values.yaml` for more options.

## Files
- `Chart.yaml` — chart metadata
- `values.yaml` — configuration values
- `templates/` — Kubernetes manifests

## Notes
- Ingress is off by default. Enable and configure hosts for your domain.
- PVCs use the cluster's default StorageClass. Set `persistence.data.storageClassName` and/or `persistence.uploads.storageClassName` to bind a specific class.
- To use your own PVCs, set `persistence.data.existingClaim` and/or `persistence.uploads.existingClaim`. The other values for that volume (size, storageClassName, annotations) are then ignored.
- With `persistence.enabled: false`, the data and uploads volumes use an `emptyDir` — storage is ephemeral and lost on pod restart. Intended for testing only.
- `JWT_SECRET` is managed entirely by the server — auto-generated into the data PVC on first start and rotatable via the admin panel (Settings → Danger Zone). No Helm configuration needed.
- `ENCRYPTION_KEY` encrypts stored secrets (API keys, MFA, SMTP, OIDC) at rest. Recommended: set via `secretEnv.ENCRYPTION_KEY` or `existingSecret`. If left empty, the server falls back automatically: existing installs use `data/.jwt_secret` (no action needed on upgrade); fresh installs auto-generate a key persisted to the data PVC.
- Liveness and readiness probes are configurable under `probes`. Overrides are merged over the defaults, so `--set probes.liveness.initialDelaySeconds=60` keeps the `httpGet` handler. When switching to `exec` or `tcpSocket`, clear `httpGet` in the same override. Set `probes.liveness: null` to remove a probe.
- If exposing TREK through an Ingress or HTTPRoute, set `env.ALLOWED_ORIGINS` and `env.APP_URL` to the public URL. The chart does not sync these automatically.
- Set `env.ALLOW_INTERNAL_NETWORK: "true"` if Immich or other integrated services are hosted on a private/RFC-1918 address (e.g. a pod on the same cluster or a NAS on your LAN). Loopback (`127.x`) and link-local/metadata addresses (`169.254.x`) remain blocked regardless.
- Set `env.ALLOW_LINK_LOCAL_IPS` to a single link-local address (e.g. `"169.254.1.2"`) only when a service TREK needs sits behind one, such as a host gateway. Cloud metadata addresses (`169.254.169.x`, `169.254.170.x`) cannot be listed.
- `FORCE_HTTPS` is optional. Set `env.FORCE_HTTPS: "true"` only when ingress (or another proxy) terminates TLS. It enables HTTPS redirects, HSTS, CSP `upgrade-insecure-requests`, and forces the session cookie `secure` flag. Requires `TRUST_PROXY` to be set.
- Set `env.TRUST_PROXY: "1"` (or the number of proxy hops) when running behind ingress or a load balancer. Required for `FORCE_HTTPS` to detect the forwarded protocol correctly. In production it defaults to `1` automatically.
- `COOKIE_SECURE` is auto-derived (on when `NODE_ENV=production` or `FORCE_HTTPS=true`). Set `env.COOKIE_SECURE: "false"` only during local testing without TLS. **Not recommended for production.**
- Web Push needs no chart settings: TREK generates its key pair on first start and keeps it in the database on the data PVC. To bring your own pair, set `env.VAPID_PUBLIC_KEY` and `secretEnv.VAPID_PRIVATE_KEY` together (and optionally `env.VAPID_SUBJECT`); changing the pair later means every device has to turn push on again.
- Set `env.OIDC_DISCOVERY_URL` to override the auto-constructed OIDC discovery endpoint. Required for providers (e.g. Authentik) that expose it at a non-standard path.
- `podSecurityContext` defaults to `fsGroup: 1000` with `fsGroupChangePolicy: OnRootMismatch`, and `securityContext` (the container's) is empty. The container then starts as root, hands any file under `/app/data` and `/app/uploads` that is not owned by `node` yet to `node`, and drops to `node`. To run as `node` from the start, for example under the `restricted` Pod Security Standard, set `podSecurityContext.runAsUser: 1000` and `runAsGroup: 1000`; the image then skips that step and the privilege drop. See the example in `values.yaml`.
- Use `extraVolumes` and `extraVolumeMounts` to add your own volumes to the pod. To give the booking import more KItinerary extractors, mount a ConfigMap at `/usr/local/share/kitinerary/extractors`, with one `.json` and one `.js` key for each extractor; see the example in `values.yaml`.
