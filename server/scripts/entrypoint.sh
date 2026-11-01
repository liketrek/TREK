#!/bin/sh
# Container start-up: check the image layout, correct ownership of the mounted
# data dirs while still root, then drop to the node user.
#
# This has to stay a file rather than an inline `sh -c` string in CMD. Container
# management UIs render Config.Cmd back into a text field and re-split it with a
# quote-aware tokenizer when you edit a container in place; a command carrying
# embedded quotes comes back mangled and the container dies with a shell syntax
# error before Node starts. A CMD of one bare token survives that round-trip.
set -e

# If the app code is missing, a volume was almost certainly mounted over /app
# (it hides the image's node_modules + dist). Fail with actionable guidance
# instead of a cryptic "Cannot find module 'tsconfig-paths/register'".
if [ ! -f /app/server/dist/index.js ] || [ ! -d /app/node_modules/tsconfig-paths ]; then
  echo 'FATAL: TREK application files are missing from the image.'
  echo 'A volume is likely mounted over /app, which hides the app code.'
  echo 'Mount ONLY your data and uploads dirs: -v ./data:/app/data -v ./uploads:/app/uploads'
  echo 'Do NOT mount a volume at /app. See https://github.com/liketrek/TREK/wiki/Troubleshooting'
  exit 1
fi

# cd into server/ so tsconfig-paths/register finds tsconfig.json and
# ../node_modules resolves correctly.
cd /app/server

# Already started as a non-root user (Kubernetes runAsUser, docker --user): there
# is nothing to chown and no privilege to drop, and gosu would only fail to switch
# users. Run Node as whoever we are; the volumes are that user's to provide.
if [ "$(id -u)" != "0" ]; then
  exec node --require tsconfig-paths/register dist/index.js
fi

# Hand the mounted data dirs to node, touching only what is not node's yet. A
# blanket `chown -R` rewrote every inode on every start, which on a large or
# network-backed volume (NFS, CephFS, Longhorn) kept the container busy for
# minutes before Node printed its first line (#2918). Best effort: a read-only
# host filesystem or a locked-down bind mount must keep booting.
for dir in /app/data /app/uploads; do
  [ -d "$dir" ] || continue
  if [ -n "$(find "$dir" \( ! -user node -o ! -group node \) -print -quit 2>/dev/null)" ]; then
    echo "Correcting ownership of $dir for the node user..."
    find "$dir" \( ! -user node -o ! -group node \) -exec chown -h node:node {} + 2>/dev/null || true
  fi
done

exec gosu node node --require tsconfig-paths/register dist/index.js
