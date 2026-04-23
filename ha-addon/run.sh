#!/bin/sh
# Home Assistant add-on entrypoint shim for TREK.
#
# 1. Re-point TREK's data and uploads onto the HA persistent /data volume.
# 2. Read /data/options.json (written by Supervisor before the container
#    starts) and translate each option into the matching TREK env var.
# 3. Set Ingress-specific runtime flags (CSP, trust proxy).
# 4. Hand off to TREK's original command.
set -eu

# ── 1) Data paths → /data/trek/* (survives addon upgrade/uninstall toggle) ──
mkdir -p /data/trek/data /data/trek/uploads
if [ -d /app/data ] && [ ! -L /app/data ]; then rm -rf /app/data; fi
if [ -d /app/uploads ] && [ ! -L /app/uploads ]; then rm -rf /app/uploads; fi
ln -sfn /data/trek/data /app/data
ln -sfn /data/trek/uploads /app/uploads
chown -R node:node /data/trek 2>/dev/null || true

# ── 2) /data/options.json → env ────────────────────────────────────────────
OPTS=/data/options.json
if [ -f "$OPTS" ]; then
  # node is already in the image; avoids pulling jq.
  opt() {
    node -e "const o=require('$OPTS');const v=o['$1'];if(v!==undefined&&v!==null)process.stdout.write(String(v));" 2>/dev/null
  }

  LOG_LEVEL_VAL=$(opt log_level); [ -n "$LOG_LEVEL_VAL" ] && export LOG_LEVEL="$LOG_LEVEL_VAL"
  TZ_VAL=$(opt tz); [ -n "$TZ_VAL" ] && export TZ="$TZ_VAL"
  APP_URL_VAL=$(opt app_url); [ -n "$APP_URL_VAL" ] && export APP_URL="$APP_URL_VAL"
  DL_VAL=$(opt default_language); [ -n "$DL_VAL" ] && export DEFAULT_LANGUAGE="$DL_VAL"
  ADMIN_EMAIL_VAL=$(opt admin_email); [ -n "$ADMIN_EMAIL_VAL" ] && export ADMIN_EMAIL="$ADMIN_EMAIL_VAL"
  ADMIN_PASSWORD_VAL=$(opt admin_password); [ -n "$ADMIN_PASSWORD_VAL" ] && export ADMIN_PASSWORD="$ADMIN_PASSWORD_VAL"
  [ "$(opt demo_mode)" = "true" ] && export DEMO_MODE=true
  # HA SSO — default on; addon shim only exports the disable flag.
  [ "$(opt ha_sso)" = "false" ] && export HA_SSO_ENABLED=false
fi

# ── 3) Ingress-specific flags ──────────────────────────────────────────────
export NODE_ENV=production
export PORT=3000
export TRUST_PROXY=1
# Allow HA's iframe to embed TREK (per-user HA origin is unpredictable).
export CSP_FRAME_ANCESTORS='*'
# HA terminates TLS; these must stay off so internal HTTP works and no
# redirect loops kick in.
unset FORCE_HTTPS
unset COOKIE_SECURE

# ── 4) Hand off to TREK (mirrors upstream Dockerfile CMD) ──────────────────
cd /app
exec su-exec node node --import tsx src/index.ts
