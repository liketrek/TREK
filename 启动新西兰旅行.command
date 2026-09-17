#!/bin/zsh
set -e
cd "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [[ ! -d node_modules ]]; then
  npm ci --ignore-scripts --no-audit --no-fund
fi
npm run dev:nz
