#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to schema files
const sharedSchemaPath = path.resolve(__dirname, '../shared/schema.ts');
const clientSchemaPath = path.resolve(__dirname, '../client/src/types/schema.ts');

async function main() {
  try {
    console.log('Ensuring client schema is complete...');

    // Read the shared schema
    const sharedSchema = await fs.promises.readFile(sharedSchemaPath, 'utf8');

    // Read the client schema
    let clientSchema = await fs.promises.readFile(clientSchemaPath, 'utf8');

    // Extract all type definitions from the shared schema
    const typeRegex = /export\s+(?:type|interface|const|enum)\s+(\w+)/g;
    let match;
    const sharedTypes = [];

    while ((match = typeRegex.exec(sharedSchema)) !== null) {
      sharedTypes.push(match[1]);
    }

    console.log(`Found ${sharedTypes.length} type definitions in shared schema`);

    // Check if these types exist in the client schema
    const missingTypes = sharedTypes.filter(type => !clientSchema.includes(`export type ${type}`));

    if (missingTypes.length > 0) {
      console.log(`Found ${missingTypes.length} missing types in client schema:`);
      missingTypes.forEach(type => console.log(`- ${type}`));

      // Extract definitions of missing types from shared schema
      for (const type of missingTypes) {
        const typeDefRegex = new RegExp(`export\\s+(?:type|interface|const|enum)\\s+${type}[\\s\\S]*?;`, 'g');
        const typeDef = typeDefRegex.exec(sharedSchema);

        if (typeDef) {
          console.log(`Adding definition for ${type} to client schema`);
          clientSchema += `\n\n// Added by ensure-client-schema script\n${typeDef[0]}`;
        }
      }

      // Write updated client schema
      await fs.promises.writeFile(clientSchemaPath, clientSchema, 'utf8');
      console.log('Client schema updated with missing types');
    } else {
      console.log('Client schema is complete, no missing types');
    }

  } catch (error) {
    console.error('Error ensuring client schema completeness:', error);
    process.exit(1);
  }
}

main();
