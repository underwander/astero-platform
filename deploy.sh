#!/usr/bin/env bash

set -e

echo "[1/7] Entering project directory"
cd /var/www/astero-platform

echo "[2/7] Checking current Git branch"
current_branch="$(git branch --show-current)"
if [ "$current_branch" != "astero-main" ]; then
  echo "Error: current branch is '$current_branch'; expected 'astero-main'." >&2
  exit 1
fi

echo "[3/7] Pulling changes from origin/astero-main"
git pull --ff-only origin astero-main

echo "[4/7] Installing dependencies"
npm install

echo "[5/7] Building project"
npm run build

echo "[6/7] Restarting astero-platform"
pm2 restart astero-platform

echo "[7/7] Checking astero-platform status"
pm2 status astero-platform
