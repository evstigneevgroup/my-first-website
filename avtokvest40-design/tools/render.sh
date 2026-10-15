#!/usr/bin/env bash
# Render every SVG to PNG at native size using macOS CoreGraphics (sips).
set -e
cd "$(dirname "$0")/.."
mkdir -p exports
for f in brand/*.svg brand/*/*.svg vk/*.svg vk/*/*.svg carriers/*.svg; do
  [ -e "$f" ] || continue
  out="exports/$(basename "${f%.svg}").png"
  if sips -s format png "$f" --out "$out" >/dev/null 2>&1; then
    printf 'ok   %-40s ' "$out"
    sips -g pixelWidth -g pixelHeight "$out" 2>/dev/null | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print w"x"h}'
  else
    echo "FAIL $f"
  fi
done
