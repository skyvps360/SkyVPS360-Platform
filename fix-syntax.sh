#!/bin/bash
# filepath: /workspaces/app-v2/fix-syntax.sh

echo "Fixing syntax error in server/index.ts..."

# Find the area around line 147 with the error
grep -A 5 -B 5 -n "}" server/index.ts | grep -E "^14[5-9]:"

# Make a backup of the original file
cp server/index.ts server/index.ts.bak

# Option 1: Use sed to fix the specific issue (adding proper function structure)
# This assumes the issue is an orphaned closing brace
sed -i '147s/}//' server/index.ts

# Option 2: Use grep to find duplicate importPath function and correctly remove it
grep -n "const importPath = " server/index.ts

echo "Attempt to fix complete. Please check server/index.ts and run:"
echo "npm run dev"