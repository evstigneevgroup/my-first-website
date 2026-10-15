#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  echo "Устанавливаю зависимости..."
  npm install
fi
npm run dev
