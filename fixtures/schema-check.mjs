// version: 4 | created: 2026-10-05T20:28Z | project: credit-dashboard-sut | type: tool | language: en-GB
// Validates the persona and test-user fixtures against persona.schema.json, which references the
// OpenAPI contract's component schemas, then runs the rule cross-checks in API specification v8, section 9.1.
// Also validates the override samples in overrides/ against the contract's PersonaOverrides, applies each to
// its base persona and re-runs the checks, except the two persona conventions API spec v6 section 6.5 exempts.
// Run: npm ci && npm run check   (from this folder). Exit code 0 means every check passed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const here = path.dirname(fileURLToPath(import.meta.url));
const contract = YAML.parse(fs.readFileSync(path.join(here, '../DOCS/.architecture/openapi.yaml'), 'utf8'));
const personaSchema = JSON.parse(fs.readFileSync(path.join(here, 'persona.schema.json'), 'utf8'));
const SCHEMA_ID = personaSchema.$id;
const CONTRACT_ID = new URL('contract', SCHEMA_ID).href;

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema({ $id: CONTRACT_ID, components: contract.components });
ajv.addSchema(personaSchema);
const validatePersona = ajv.getSchema(SCHEMA_ID);
const validateUsers = ajv.getSchema(`${SCHEMA_ID}#/$defs/UsersFile`);
const validateOverrideSample = ajv.getSchema(`${SCHEMA_ID}#/$defs/OverrideSample`);
const contractSchema = (name) => ajv.getSchema(`${CONTRACT_ID}#/components/schemas/${name}`);

const failures = [];
let checks = 0;
const check = (ok, where, message) => { checks++; if (!ok) failures.push(`${where}: ${message}`); };

// Rule helpers, written independently of the generator so the two can disagree.
const roundHalfUpPercent = (balance, limit) => Math.floor((200 * balance + limit) / (2 * limit)); // BR-03
const maskOf = (source) => '*' + source.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-4).padStart(4, '0'); // BR-09
const monthOf = (iso) => iso.slice(0, 7);
const addMonths = (month, n) => {
  const [y, m] = month.split('-').map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
};
// BR-13 (DR-012): close date plus six calendar years; 29 February falls back to 28 February.
const sixYearsAfter = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const leap = (n) => (n % 4 === 0 && n % 100 !== 0) || n % 400 === 0;
  const day = m === 2 && d === 29 && !leap(y + 6) ? 28 : d;
  return `${y + 6}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Rule checks for one persona document. personaOnly switches on the two conventions that apply to
// persona fixtures but not to overrides (API spec v6 section 6.5): changes stored newest first (BR-11)
// and closed accounts inside the six-year window (BR-13). ownerOf maps account ID to its owning file.
function checkPersonaRules(p, where, { personaOnly, ownerOf }) {
  const asAtDate = p.asAt.slice(0, 10);
  const asAtMonth = monthOf(p.asAt);
  const asAtYear = Number(p.asAt.slice(0, 4));
  let accountCount = 0;
  for (const b of p.bureaux) {
    const bw = `${where} ${b.id}`;
    check(b.nextRefreshDate >= asAtDate, bw, 'BR-08: nextRefreshDate is before asAt');
    const months = b.scoreHistory.map((h) => h.month);
    const expected = Array.from({ length: 12 }, (_, i) => addMonths(asAtMonth, i - 11));
    check(JSON.stringify(months) === JSON.stringify(expected), bw, `BR-02: history months ${months[0]}..${months.at(-1)} are not the 12 months ending ${asAtMonth}`);
    if (personaOnly) {
      const changeDates = b.changes.map((c) => c.date);
      check(changeDates.every((d, i) => i === 0 || changeDates[i - 1] >= d), bw, 'BR-11: changes are not newest first');
    }
    for (const list of ['changes', 'searches', 'accounts']) {
      check(new Set(b[list].map((x) => x.id)).size === b[list].length, bw, `${list} IDs are not unique`);
    }
    for (const a of b.accounts) {
      accountCount++;
      const aw = `${bw} ${a.id}`;
      const owner = ownerOf(a.id);
      check(owner === undefined, aw, `BR-15: account ID also used in ${owner}`);
      const bal = a.balance.amountMinor;
      const lim = a.limit ? a.limit.amountMinor : null;
      const raw = lim ? roundHalfUpPercent(bal, lim) : null;
      const shown = raw === null ? null : Math.max(raw, 0);
      check(a.utilisation === shown, aw, `BR-03/BR-06: utilisation ${a.utilisation}, expected ${shown}`);
      check(a.utilisationRaw === undefined || a.utilisationRaw === raw, aw, `BR-06: utilisationRaw ${a.utilisationRaw}, expected ${raw}`);
      if (a.type === 'loan' && lim === null) check(a.includedInTotals === false, aw, 'BR-05: loan without a limit is included in totals');
      if (a.sourceMask !== undefined) check(a.maskedNumber === maskOf(a.sourceMask), aw, `BR-09: mask of '${a.sourceMask}' is ${maskOf(a.sourceMask)}, stored ${a.maskedNumber}`);
      for (const m of a.missedMonths) {
        const y = Number(m.slice(0, 4));
        check(y >= asAtYear - 6 && m <= asAtMonth, aw, `BR-12: missed month ${m} is outside the seven-year window`);
        check(m >= monthOf(a.openedDate), aw, `BR-12: missed month ${m} is before the account opened`);
      }
      if (a.closed) {
        check(bal === 0, aw, 'BR-13: closed account balance is not 0');
        check(a.status === 'closed' && a.closedDate, aw, 'BR-13: closed account needs status closed and a close date');
        if (personaOnly) check(asAtDate < sixYearsAfter(a.closedDate), aw, 'BR-13: closed more than six years before asAt, so it would not be listed');
      }
      const histMonths = a.balanceHistory.map((h) => h.month);
      check(histMonths.every((m, i) => i === 0 || histMonths[i - 1] < m), aw, 'balance history is not oldest first');
    }
  }
  return accountCount;
}

// Users
const usersFile = JSON.parse(fs.readFileSync(path.join(here, 'users.json'), 'utf8'));
check(validateUsers(usersFile), 'users.json', ajv.errorsText(validateUsers.errors));
const users = usersFile.users;
check(new Set(users.map((u) => u.username)).size === users.length, 'users.json', 'usernames are not unique');
check(new Set(users.map((u) => u.id)).size === users.length, 'users.json', 'user IDs are not unique');

// Personas
const personaNames = contract.components.schemas.Persona.enum;
const dir = path.join(here, 'personas');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
check(JSON.stringify(files) === JSON.stringify(personaNames.map((p) => `${p}.json`).sort()),
  'personas/', `expected one file per Persona value (${personaNames.join(', ')}), found ${files.join(', ')}`);

const allAccountIds = new Map();
const personas = new Map();
const summary = [];
for (const file of files) {
  const where = `personas/${file}`;
  const p = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  if (!validatePersona(p)) { check(false, where, ajv.errorsText(validatePersona.errors)); continue; }
  check(file === `${p.persona}.json`, where, `file name does not match persona '${p.persona}'`);
  personas.set(p.persona, p);
  const accountCount = checkPersonaRules(p, where, {
    personaOnly: true,
    ownerOf: (id) => { const o = allAccountIds.get(id); allAccountIds.set(id, o ?? file); return o; },
  });

  // Compose with every user, exactly as the API would serve it (section 9.1)
  for (const u of users) {
    const uw = `${where} + ${u.username}`;
    const composed = {
      // greetingName (DR-036): the preferred name when set, otherwise the first word of the legal name.
      User: { id: u.id, displayName: u.displayName, greetingName: p.profile.preferredName ?? u.legalName.split(' ')[0], defaultBureauId: p.bureaux[0].id },
      Profile: {
        legalName: u.legalName, dateOfBirth: u.dateOfBirth, memberSince: p.profile.memberSince,
        preferredName: p.profile.preferredName, email: { address: u.email, status: p.profile.emailStatus },
        mobile: p.profile.mobile, address: p.profile.address, employment: p.profile.employment, finances: p.profile.finances,
      },
      PersonalDetails: { name: u.legalName, ...p.bureaux[0].personalDetails },
    };
    for (const [name, value] of Object.entries(composed)) {
      const v = contractSchema(name);
      check(v(value), uw, `composed ${name} invalid: ${ajv.errorsText(v.errors)}`);
    }
  }
  if (p.profile.mobile) {
    const n = Number(p.profile.mobile.lastDigits);
    check(n >= 0 && n <= 999, where, 'DR-010: mobile is outside 07700 900000 to 07700 900999');
  }
  summary.push(`${p.persona.padEnd(10)} bureaux ${p.bureaux.length}  accounts ${String(accountCount).padStart(2)}  latency ${p.behaviour.latencyMs}  fail ${p.behaviour.failReportEndpoints}`);
}

// Override samples (API spec v6 section 6.5): validate, apply to the base persona, re-check.
const overrideDir = path.join(here, 'overrides');
const overrideFiles = fs.existsSync(overrideDir) ? fs.readdirSync(overrideDir).filter((f) => f.endsWith('.json')).sort() : [];
for (const file of overrideFiles) {
  const where = `overrides/${file}`;
  const sample = JSON.parse(fs.readFileSync(path.join(overrideDir, file), 'utf8'));
  if (!validateOverrideSample(sample)) { check(false, where, ajv.errorsText(validateOverrideSample.errors)); continue; }
  const base = personas.get(sample.base);
  if (!base) { check(false, where, `base persona '${sample.base}' not loaded`); continue; }
  const merged = structuredClone(base);
  let known = true;
  for (const o of sample.overrides.bureaux) {
    const b = merged.bureaux.find((x) => x.id === o.id);
    check(b !== undefined, where, `unknown bureau '${o.id}' in ${sample.base}`);
    if (!b) { known = false; continue; }
    for (const list of ['accounts', 'changes', 'searches']) if (o[list]) b[list] = o[list];
  }
  if (!known) continue;
  check(validatePersona(merged), where, `merged persona invalid: ${ajv.errorsText(validatePersona.errors)}`);
  // An override may reuse its base persona's own account IDs, never another persona's (BR-15).
  const accountCount = checkPersonaRules(merged, where, {
    personaOnly: false,
    ownerOf: (id) => { const o = allAccountIds.get(id); return o && o !== `${sample.base}.json` ? o : undefined; },
  });
  summary.push(`override  ${file.replace('.json', '').padEnd(24)} on ${sample.base.padEnd(10)} accounts ${String(accountCount).padStart(2)}`);
}

console.log(summary.join('\n'));
console.log(`\n${files.length} personas, ${users.length} users, ${overrideFiles.length} override samples, ${checks} checks, ${failures.length} failures`);
if (failures.length) { console.log(failures.map((f) => `  FAIL ${f}`).join('\n')); process.exit(1); }
