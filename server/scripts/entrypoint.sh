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

# Hand the mounted data dirs to node. A blanket `chown -R` on every start
# rewrote, and even a search for strays still read, every inode of the volume,
# which on a large or network-backed one (NFS, CephFS, Longhorn) kept the
# container busy for minutes before Node printed its first line (#2918). So only
# the dir and what sits directly in it are looked at: a volume that is not
# node's yet (a fresh one, or one whose top level was copied in as root) shows
# there, and is handed over once. Files copied in as root further down, into a
# subdirectory node already owns, do not show and are left alone; the
# Troubleshooting page of the wiki has the one-off chown for that.
#
# Only the owning user has to be node, because that is what Node runs as and
# what gosu leaves it with. The group is left to whoever set it: a Kubernetes
# fsGroup other than 1000 gives every file its own gid, and taking that back
# here would make the kubelet's OnRootMismatch walk the volume again on the
# next start, and this script after it, every time. Only a root group (a fresh
# volume under plain docker) is handed to node as well.
#
# A volume that refuses chown altogether (NFS with root_squash) is said once
# per start instead of being walked file by file; such a pod belongs under
# runAsUser 1000, see the Helm page of the wiki. Best effort either way: a
# read-only host filesystem or a locked-down bind mount must keep booting.
for dir in /app/data /app/uploads; do
  [ -d "$dir" ] || continue
  if [ -n "$(find "$dir" -maxdepth 1 \( ! -user node -o -group 0 \) -print -quit 2>/dev/null)" ]; then
    if chown node "$dir" 2>/dev/null; then
      echo "Correcting ownership of $dir for the node user..."
      chown -R -h node "$dir" 2>/dev/null || true
      find "$dir" -group 0 -exec chgrp -h node {} + 2>/dev/null || true
    else
      echo "WARNING: $dir cannot be handed to the node user (chown refused); run the container as uid 1000 instead."
    fi
  fi
done

exec gosu node node --require tsconfig-paths/register dist/index.js
