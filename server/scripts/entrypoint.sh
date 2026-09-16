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

# Best effort: a read-only host filesystem or a locked-down bind mount must keep
# booting, exactly as it did before.
chown -R node:node /app/data /app/uploads 2>/dev/null || true

# cd into server/ so tsconfig-paths/register finds tsconfig.json and
# ../node_modules resolves correctly.
cd /app/server
exec gosu node node --require tsconfig-paths/register dist/index.js
