#!/bin/sh
set -eu

cat <<EOCFG >/tmp/env-config.js
window.__APP_CONFIG__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:3000}",
  VITE_APP_NAME: "${VITE_APP_NAME:-Staff Platform}"
};
EOCFG

exec nginx -g 'daemon off;'
