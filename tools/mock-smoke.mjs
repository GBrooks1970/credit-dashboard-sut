// version: 2 | created: 2026-10-06T16:41Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Mock smoke run (CDS-14; API specification section 11, 'Mock parity').
// Starts the Prism mock from the contract with --errors, calls every operation with values taken from the
// contract, and requires: the operation's documented 2xx status, no contract violation reported by Prism, and a
// response body that validates against its schema (checked independently with Ajv). A call without a token must
// get 401. Prism is always stopped, including after a failure.
// Run from the repository root:  npm ci && npm run check:mock   (MOCK_PORT overrides the default port 4010)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { startPrism } from './lib/prism.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = path.join(root, 'DOCS', '.architecture', 'openapi.yaml');
const contract = YAML.parse(fs.readFileSync(contractPath, 'utf8'));
const port = Number(process.env.MOCK_PORT || 4010);
const base = `http://127.0.0.1:${port}`;
const METHODS = ['get', 'put', 'post', 'patch', 'delete'];

// Ajv holds the whole contract as one document, so every '#/components/...' reference resolves in place.
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(contract, 'contract');
const pointer = (...parts) => parts.map((p) => String(p).replace(/~/g, '~0').replace(/\//g, '~1')).join('/');

const deref = (node) => {
  if (!node || !node.$ref) return { node, at: null };
  const parts = node.$ref.replace(/^#\//, '').split('/');
  return { node: parts.reduce((n, k) => n[k], contract), at: parts };
};

// The value a request uses for a parameter: its example, else its schema example, first enum value or default.
function valueFor(param) {
  const s = deref(param.schema).node || {};
  for (const v of [param.example, s.example, s.enum && s.enum[0], s.default]) if (v !== undefined) return v;
  return undefined;
}

function buildOperations() {
  const ops = [];
  for (const [route, item] of Object.entries(contract.paths)) {
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      const params = [...(item.parameters || []), ...(op.parameters || [])].map((p) => deref(p).node);
      let url = route;
      const query = new URLSearchParams();
      const missing = [];
      for (const p of params) {
        const v = valueFor(p);
        if (p.in === 'path') {
          if (v === undefined) missing.push(p.name);
          else url = url.replace(`{${p.name}}`, encodeURIComponent(String(v)));
        } else if (p.in === 'query' && p.required) {
          if (v === undefined) missing.push(p.name);
          else query.set(p.name, String(v));
        }
      }
      const security = op.security ?? contract.security ?? [];
      const schemes = security.flatMap((req) => Object.keys(req));
      const json = op.requestBody?.content?.['application/json'];
      const body = json ? (json.example ?? Object.values(json.examples || {})[0]?.value) : undefined;
      const expected = Object.keys(op.responses).filter((s) => /^2\d\d$/.test(s)).sort()[0];
      const response = op.responses[expected];
      const { node: resolved, at } = deref(response);
      const mediaType = resolved?.content && Object.keys(resolved.content)[0];
      const schemaPointer = mediaType
        ? (at ? `contract#/${pointer(...at, 'content', mediaType, 'schema')}`
              : `contract#/${pointer('paths', route, method, 'responses', expected, 'content', mediaType, 'schema')}`)
        : null;
      ops.push({ id: op.operationId, method: method.toUpperCase(), route, url: url + (query.size ? `?${query}` : ''),
        schemes, body, needsBody: Boolean(op.requestBody?.required), expected: Number(expected), schemaPointer, missing });
    }
  }
  return ops;
}

const ops = buildOperations();
const { ready, stop } = startPrism({ contractPath, port });

const failures = [];
let passed = 0;
try {
  await ready;
  for (const op of ops) {
    const where = `${op.method} ${op.route} (${op.id})`;
    if (op.missing.length) { failures.push(`${where}: no contract value for ${op.missing.join(', ')}`); continue; }
    if (op.needsBody && op.body === undefined) { failures.push(`${where}: request body has no example`); continue; }
    const headers = {};
    if (op.schemes.includes('bearerAuth')) headers.Authorization = 'Bearer mock-smoke';
    if (op.schemes.includes('testControlKey')) headers['X-Test-Control-Key'] = 'mock-smoke';
    if (op.body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(base + op.url, { method: op.method, headers, body: op.body === undefined ? undefined : JSON.stringify(op.body) });
    const text = await res.text();
    const problems = [];
    if (res.status !== op.expected) problems.push(`status ${res.status}, expected ${op.expected}: ${text.slice(0, 200)}`);
    const violations = res.headers.get('sl-violations');
    if (violations) problems.push(`contract violations: ${violations.slice(0, 300)}`);
    if (op.schemaPointer && res.status === op.expected) {
      const validate = ajv.getSchema(op.schemaPointer);
      if (!validate) problems.push(`no schema at ${op.schemaPointer}`);
      else if (!validate(JSON.parse(text))) problems.push(`body invalid: ${ajv.errorsText(validate.errors)}`);
    }
    if (problems.length) failures.push(`${where}: ${problems.join('; ')}`);
    else passed++;
  }
  // Negative: a protected operation without a token is refused.
  const anon = await fetch(`${base}/me`);
  if (anon.status !== 401) failures.push(`GET /me without a token: status ${anon.status}, expected 401`);
} catch (err) {
  failures.push(String(err.message || err));
} finally {
  stop();
}

const anonFailed = failures.some((f) => f.startsWith('GET /me without'));
console.log(`mock smoke: ${ops.length} operations in the contract, ${passed} passed; 401 without a token: ${anonFailed ? 'FAIL' : 'pass'}`);
for (const f of failures) console.log(`  FAIL ${f}`);
process.exitCode = failures.length ? 1 : 0;
