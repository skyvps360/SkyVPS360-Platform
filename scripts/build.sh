#!/bin/bash
# Export environment variables for drizzle to use
export NODE_TLS_REJECT_UNAUTHORIZED=0
# Run migrations with force flag
npx drizzle-kit push --accept-data-loss
# Start the application
npm run dev
