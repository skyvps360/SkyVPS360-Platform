#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to scan - use absolute paths
const SCAN_DIRS = [path.resolve(__dirname, '../client')];

// Pattern to look for
const IMPORT_PATTERN = /from\s+['"]@shared\/schema['"]/g;

// Check if a file has the import pattern
async function checkFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    if (IMPORT_PATTERN.test(content)) {
      console.log(`Found import in: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
  return false;
}

// Recursive scan of directories
async function scanDir(dir) {
  let matches = [];
  try {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.promises.stat(filePath);

      if (stats.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.')) {
        // Recursively scan subdirectories
        const subMatches = await scanDir(filePath);
        matches = matches.concat(subMatches);
      } else if ((file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))
        && !file.endsWith('.d.ts')) {
        // Check files
        const hasImport = await checkFile(filePath);
        if (hasImport) {
          matches.push(filePath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
  return matches;
}

// Main execution
async function main() {
  console.log('Scanning for @shared/schema imports...');
  let allMatches = [];

  for (const dir of SCAN_DIRS) {
    console.log(`Scanning directory: ${dir}`);
    const matches = await scanDir(dir);
    allMatches = allMatches.concat(matches);
  }

  console.log('\nSummary:');
  console.log(`Found ${allMatches.length} files with @shared/schema imports`);

  if (allMatches.length > 0) {
    console.log('\nFiles with @shared/schema imports:');
    allMatches.forEach(file => console.log(`- ${file}`));

    console.log('\nSuggested fix:');
    console.log('Replace: import { Type } from \'@shared/schema\';');
    console.log('With:    import { Type } from \'@/types/schema\';');
  } else {
    console.log('No problematic imports found!');
  }
}

main().catch(console.error);
