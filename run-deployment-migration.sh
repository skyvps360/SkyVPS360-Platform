#!/bin/bash
echo "Running deployments table migration..."
node -e "import('./migrations/add-deployments-table.js').then(m => m.runMigration()).then(() => console.log('Migration complete')).catch(e => console.error('Migration failed:', e))"
