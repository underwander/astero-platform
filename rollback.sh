#!/usr/bin/env bash

set -e

echo "[1/8] Entering project directory"
cd /var/www/astero-platform

echo "[2/8] Checking for the last known good commit"
if [ ! -f .last-good-commit ]; then
  echo "Error: .last-good-commit does not exist." >&2
  exit 1
fi

echo "[3/8] Reading the last known good commit"
last_good_commit="$(cat .last-good-commit)"
if ! git cat-file -e "${last_good_commit}^{commit}"; then
  echo "Error: commit '$last_good_commit' does not exist." >&2
  exit 1
fi

echo "[4/8] Resetting to commit $last_good_commit"
git reset --hard "$last_good_commit"

echo "[5/8] Installing dependencies"
npm ci

echo "[6/8] Building project"
npm run build

echo "[7/8] Restarting astero-platform"
pm2 restart astero-platform

echo "[8/8] Checking astero-platform status"
pm2 status astero-platform
