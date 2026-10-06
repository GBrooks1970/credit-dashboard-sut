// version: 1 | created: 2026-10-06T16:33Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Generates src/generated/schema.d.ts from the contract with openapi-typescript (CDS-15, DR-043).
//   node scripts/generate.mjs           write the file
//   node scripts/generate.mjs --check   fail if the committed file differs from a fresh generation
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = path.resolve(pkg, '..', '..', 'DOCS', '.architecture', 'openapi.yaml');
const target = path.join(pkg, 'src', 'generated', 'schema.d.ts');

const header = [
  '// Generated from DOCS/.architecture/openapi.yaml by openapi-typescript (packages/api-client/scripts/generate.mjs).',
  '// Do not edit: change the contract and run `npm run generate` in packages/api-client.',
  '',
].join('\n');
const fresh = header + astToString(await openapiTS(pathToFileURL(contract)));

if (process.argv.includes('--check')) {
  const committed = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : null;
  if (committed !== fresh) {
    console.log('client drift: src/generated/schema.d.ts is not current; run `npm run generate` in packages/api-client');
    process.exit(1);
  }
  console.log(`client drift: generated types are current (${fresh.split('\n').length} lines)`);
} else {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, fresh, { encoding: 'utf8' });
  console.log(`generated ${path.relative(pkg, target)} (${fresh.split('\n').length} lines)`);
}
