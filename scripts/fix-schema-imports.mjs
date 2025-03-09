#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to scan - use absolute paths
const SCAN_DIRS = [path.resolve(__dirname, '../client')];

// Pattern to look for imports from @shared/schema
const IMPORT_PATTERN = /from\s+['"]@shared\/schema['"]/g;
const IMPORT_REGEX = /import\s+{([^}]+)}\s+from\s+['"]@shared\/schema['"]/g;

// Process a file to fix imports
async function processFile(filePath) {
  try {
    let content = await fs.promises.readFile(filePath, 'utf8');

    // Check if file has the import pattern
    if (IMPORT_PATTERN.test(content)) {
      console.log(`Processing: ${filePath}`);

      // Replace the imports
      content = content.replace(IMPORT_REGEX, (match, importNames) => {
        // For volume-manager.tsx and similar components, we need to handle insertVolumeSchema specially
        if (importNames.includes('insertVolumeSchema') &&
          (filePath.includes('volume-manager') || filePath.includes('volume'))) {

          // Keep the original import but mark it for manual replacement
          console.log(`⚠️  Special handling needed in ${path.basename(filePath)} for insertVolumeSchema`);

          // Create a commented reminder at the top of the file
          const reminder = `
// TODO: Replace the schema import below with local definition:
// import { insertVolumeSchema } from "@shared/schema";
// with:
// const insertVolumeSchema = z.object({
//   name: z.string().min(3, "Volume name must be at least 3 characters"),
//   size: z.number().min(10, "Minimum volume size is 10GB"),
// });
`;

          // Add reminder at the top of the file
          if (!content.includes("TODO: Replace the schema import")) {
            const lines = content.split('\n');
            const importLine = lines.findIndex(line =>
              line.includes('@shared/schema') && line.includes('insertVolumeSchema')
            );

            if (importLine >= 0) {
              lines.splice(importLine, 0, reminder);
              content = lines.join('\n');

              // For volume-manager specifically, add a complete replacement
              if (filePath.includes('volume-manager')) {
                // Find the end of imports
                const lastImportIndex = findLastImportIndex(lines);
                if (lastImportIndex >= 0) {
                  const schemaDefinition = `
// Define the insertVolumeSchema locally
import * as z from 'zod';
const insertVolumeSchema = z.object({
  name: z.string().min(3, "Volume name must be at least 3 characters"),
  size: z.number().min(10, "Minimum volume size is 10GB"),
});`;
                  lines.splice(lastImportIndex + 1, 0, schemaDefinition);
                  content = lines.join('\n');
                }
              }
            }
          }

          // Preserve the original import but commented out
          return `// Original: ${match}\nimport {${importNames.replace('insertVolumeSchema', '').replace(/,,/g, ',').replace(/,\s*$/, '')}} from "@/types/schema"`;
        }

        // Standard import conversion
        return `import {${importNames}} from "@/types/schema"`;
      });

      // Write back the file
      await fs.promises.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}:`, error.message);
  }
  return false;
}

// Helper to find the last import statement in file
function findLastImportIndex(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].match(/^import /)) {
      return i;
    }
  }
  return 0; // Default to beginning if no imports found
}

// Recursive scan of directories
async function scanAndFix(dir) {
  let fixedCount = 0;
  try {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.')) {
        // Recursively scan subdirectories
        const subFixedCount = await scanAndFix(filePath);
        fixedCount += subFixedCount;
      } else if ((file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))
        && !file.endsWith('.d.ts')) {
        // Process files
        const fixed = await processFile(filePath);
        if (fixed) fixedCount++;
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
  return fixedCount;
}

// Main execution
async function main() {
  console.log('🔍 Scanning for @shared/schema imports to fix...');
  let totalFixedCount = 0;

  for (const dir of SCAN_DIRS) {
    console.log(`Scanning directory: ${dir}`);
    const fixedCount = await scanAndFix(dir);
    totalFixedCount += fixedCount;
  }

  console.log('\n📊 Summary:');
  console.log(`Fixed ${totalFixedCount} files with @shared/schema imports`);

  if (totalFixedCount > 0) {
    console.log('\n✅ Import paths have been updated to use @/types/schema');

    // Essential follow-up steps
    console.log('\n🔄 Next steps:');
    console.log('1. Run "npm run ensure-client-schema" to update client schema types');
    console.log('2. Check files with "TODO" comments for manual schema fixes');
    console.log('3. Run "npm run build" to verify the fix');
  } else {
    console.log('\n✅ No problematic imports found!');
  }
}

main().catch(console.error);
