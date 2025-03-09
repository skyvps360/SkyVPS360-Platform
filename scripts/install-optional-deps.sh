#!/bin/bash
# Script to install optional dependencies required for the build process

echo "Installing optional dependencies..."

# Check if terser is installed
if ! npm list terser --depth=0 | grep -q terser; then
    echo "Installing terser for minification..."
    npm install --save-dev terser
else
    echo "✅ Terser already installed"
fi

echo "Optional dependencies check completed"
