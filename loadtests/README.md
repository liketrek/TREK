# Load tests (k6)

Load tests written for [Grafana k6](https://k6.io). No npm install, k6 is a standalone binary.

## Install k6

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu) -> see https://k6.io/docs/get-started/installation/
sudo gpg -k && \
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && \
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list && \
sudo apt-get update && sudo apt-get install k6
```

### Windows (incl. ARM64)

```powershell
winget install k6 --source winget
# or
choco install k6
```

## Target

By default the scripts hit `http://localhost:3001`, the isolated seeded E2E backend. Boot it from the client workspace:

```bash
cd client && node e2e/server-launch.mjs
```

Point at a different instance with `BASE_URL`:

```bash
k6 run -e BASE_URL=http://localhost:3000 loadtests/smoke.js
```

Do not run these against the public demo or production.

## Scripts

| Script          | Type          | Target                  | Status          |
|-----------------|---------------|-------------------------|-----------------|
| `smoke.js`      | smoke (5 VUs) | `GET /api/_nest/health`              | implemented     |
| `trips-read.js` | ramp-up       | `GET /api/trips` + `/:id/bundle`     | implemented     |
| `auth-login.js` | spike         | `POST /api/auth/login`               | skeleton (TODO) |

`trips-read.js` and `auth-login.js` keep the load profile and thresholds.

Run from `loadtests/` so `results/` resolves:

```bash
cd loadtests
k6 run smoke.js
k6 run trips-read.js
k6 run auth-login.js
```

Each script writes `results/<name>.summary.json` via `handleSummary`. Add `--summary-export=results/<name>.export.json` for the flat summary too.

## Live visualization (Grafana + InfluxDB)

```bash
docker compose -f loadtests/docker-compose.yml up -d
k6 run --out influxdb=http://localhost:8086/k6 loadtests/trips-read.js
# Grafana: http://localhost:3030  -> dashboard "k6 Load Test"
docker compose -f loadtests/docker-compose.yml down
```

Grafana runs on :3030 (TREK uses :3000), anonymous admin, with the InfluxDB datasource and the `k6 Load Test` dashboard pre-provisioned.

## Notes

- `auth-login.js` has lenient thresholds on purpose. Under a spike the per-IP rate limiter sheds load with HTTP 429, and observing that is the point. Hard 5xx or connection failures should stay rare.
- `trips-read.js` logs in once in `setup()` and shares the `trek_session` cookie. The seeded admin starts with `must_change_password`. If the trip list requires a completed first login, create a normal user or complete the change first.
