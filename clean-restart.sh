#!/bin/bash
echo "Cleaning Vite cache..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
echo "Stopping any running Vite processes..."
pkill -f vite || true
echo "Starting development server..."
npm run dev
