#!/bin/bash
# Build script for DigitalOcean App Platform

# Build the app
npm run build

# Skip database migration in build process
# We'll handle migrations separately in the app
