#!/usr/bin/env bash
# Collects the static web app (HTML/JS/CSS/assets) into dist/ for Netlify.
# The Expo project in mobile/ is a native-only WebView wrapper and is not part of the web build.
set -euo pipefail
rm -rf dist
mkdir -p dist
cp ./*.html ./*.js site.webmanifest dist/
cp -r assets styles .well-known dist/
echo "Static site copied to dist/"
