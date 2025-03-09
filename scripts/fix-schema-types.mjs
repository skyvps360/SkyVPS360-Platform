#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to client schema file
const clientSchemaPath = path.resolve(__dirname, '../client/src/types/schema.ts');

async function main() {
  try {
    console.log('Fixing incomplete types in client schema...');

    // Read the client schema
    let content = await fs.promises.readFile(clientSchemaPath, 'utf8');

    // Fix incomplete type definitions
    content = fixIncompleteTypes(content);

    // Fix pgTable related functions if needed
    content = addPgTableMocks(content);

    // Write the fixed content back
    await fs.promises.writeFile(clientSchemaPath, content);

    console.log('✅ Fixed client schema file');
    console.log('🔍 Now run "npm run build" to verify the fix worked');

  } catch (error) {
    console.error('❌ Error fixing client schema:', error);
    process.exit(1);
  }
}

function fixIncompleteTypes(content) {
  // Fix specific issues with incomplete type definitions

  // 1. Fix specs type that's causing the build error
  content = content.replace(
    /specs: jsonb\("specs"\)\.\$type<\{\s*memory: number;\s*\n/,
    'specs: jsonb("specs").$type<{\n    memory: number;\n    vcpus: number;\n    disk: number;\n  }>(),\n'
  );

  // 2. Fix any other incomplete types (add more patterns as needed)
  content = content.replace(
    /\$type<([^>]*?)\n/g,
    '$type<$1>\n'
  );

  // 3. Fix missing closing brackets in object definitions
  let openBraces = 0;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openCount = (line.match(/{/g) || []).length;
    const closeCount = (line.match(/}/g) || []).length;
    openBraces += openCount - closeCount;

    // Check for unclosed objects at the end of a declaration
    if (openBraces > 0 && line.includes('Added by ensure-client-schema script')) {
      // Found an incomplete object before a comment line
      console.log(`Fixing incomplete object at line ${i}`);

      // Insert missing closing braces
      lines.splice(i, 0, '  ' + '}'.repeat(openBraces) + ',');
      openBraces = 0;
    }
  }

  return lines.join('\n');
}

function addPgTableMocks(content) {
  // Add mock function declarations if they don't exist
  const pgTableMock = `
// Mock types for pgTable and related functions that are only used on the server
// These allow us to keep the type definitions without importing server-only code
const pgTable = (name: string, schema: any) => schema;
const serial = (name: string) => ({ primaryKey: () => ({}) });
const integer = (name: string) => ({ notNull: () => ({ references: () => ({ onDelete: () => ({}) }) }), references: () => ({}) });
const text = (name: string) => ({ notNull: () => ({ unique: () => ({}) }), unique: () => ({}), default: () => ({}) });
const timestamp = (name: string) => ({ notNull: () => ({ defaultNow: () => ({}), default: () => ({}) }), defaultNow: () => ({}) });
const boolean = (name: string) => ({ notNull: () => ({ default: () => ({}) }) });
const varchar = (name: string, options: any) => ({ notNull: () => ({ default: () => ({}) }) });
const jsonb = (name: string) => ({ $type: () => ({}) });
const createInsertSchema = (table: any) => ({ pick: () => ({ extend: () => ({}) }) });
`;

  if (!content.includes('const pgTable = (name:')) {
    // Find where to insert the mocks - after imports but before types
    const imports = content.match(/import.*?;/gs);
    if (imports && imports.length) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;

      content = content.substring(0, lastImportIndex) +
        pgTableMock +
        content.substring(lastImportIndex);
    } else {
      // Just add to the top if no imports found
      content = pgTableMock + content;
    }
  }

  return content;
}

main();
