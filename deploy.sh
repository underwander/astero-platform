#!/usr/bin/env bash

set -e

echo "[1/8] Entering project directory"
cd /var/www/astero-platform

echo "[2/8] Checking current Git branch"
current_branch="$(git branch --show-current)"
if [ "$current_branch" != "astero-main" ]; then
  echo "Error: current branch is '$current_branch'; expected 'astero-main'." >&2
  exit 1
fi

echo "[3/8] Saving current commit as the last known good commit"
git rev-parse HEAD > /var/www/astero-platform/.last-good-commit

echo "[4/8] Pulling changes from origin/astero-main"
git pull --ff-only origin astero-main

echo "[5/8] Installing dependencies"
npm ci

echo "[6/8] Building project"
npm run build

echo "[7/8] Restarting astero-platform"
pm2 restart astero-platform

echo "[8/8] Checking astero-platform status"
pm2 status astero-platform
