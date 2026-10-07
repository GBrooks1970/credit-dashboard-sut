// version: 1 | created: 2026-10-07T14:39Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Generates the service's contract artefacts from DOCS/.architecture/openapi.yaml (CDS-19, DR-050):
//   Contract/contract.json  the contract as JSON, embedded in the service for edge validation
//   Contract/Contract.g.cs  C# data types, by NSwag 14.7.1 (pinned in the service's .config/dotnet-tools.json)
// --check regenerates into a temporary folder and fails if either committed file differs (line endings ignored).
// Run from the repository root:  node tools/generate-service-contract.mjs [--check]   (needs the .NET 10 SDK)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractYaml = path.join(root, 'DOCS', '.architecture', 'openapi.yaml');
const serviceDir = path.join(root, 'demo-apps', 'demoapp001-dotnet-api');
const contractDir = path.join(serviceDir, 'CreditDashboard.Api', 'Contract');
const check = process.argv.includes('--check');

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: serviceDir, encoding: 'utf8' }); // dotnet is an executable: no shell needed
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed:\n${r.stdout}\n${r.stderr}`);
};

function generate(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const doc = YAML.parse(fs.readFileSync(contractYaml, 'utf8'));
  fs.writeFileSync(path.join(outDir, 'contract.json'), JSON.stringify(doc, null, 2) + '\n');
  run('dotnet', ['tool', 'restore']);
  run('dotnet', ['tool', 'run', 'nswag', 'openapi2csclient', `/input:${contractYaml}`,
    '/GenerateClientClasses:false', '/GenerateDtoTypes:true', '/JsonLibrary:SystemTextJson',
    '/Namespace:CreditDashboard.Api.Contract', `/output:${path.join(outDir, 'Contract.g.cs')}`]);
}

const normalise = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const files = ['contract.json', 'Contract.g.cs'];

if (check) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cds-contract-'));
  try {
    generate(tmp);
    const stale = files.filter((f) => !fs.existsSync(path.join(contractDir, f))
      || normalise(path.join(contractDir, f)) !== normalise(path.join(tmp, f)));
    if (stale.length) {
      console.log(`service contract drift: ${stale.join(', ')} not current; run \`node tools/generate-service-contract.mjs\``);
      process.exitCode = 1;
    } else {
      console.log(`service contract drift: contract.json and Contract.g.cs are current (${normalise(path.join(contractDir, 'Contract.g.cs')).split('\n').length} lines of C#)`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
} else {
  generate(contractDir);
  console.log(`generated ${files.map((f) => path.relative(root, path.join(contractDir, f))).join(', ')}`);
}
