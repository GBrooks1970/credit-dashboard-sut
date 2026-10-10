import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../fixtures/', import.meta.url));

export interface TestUser {
    username: string;
    password: string;
    email: string;
}

export function testUser(username: string): TestUser {
    const users = JSON.parse(readFileSync(`${root}users.json`, 'utf8')).users as TestUser[];
    const user = users.find((u) => u.username === username);
    if (!user) throw new Error(`fixtures/users.json has no test user '${username}'`);
    return user;
}

type Json = any;

const read = (relative: string): Json => JSON.parse(readFileSync(`${root}${relative}`, 'utf8'));

export const personaFile = (name: string): Json => read(`personas/${name}.json`);
export const overrideSample = (file: string): Json => read(`overrides/${file}`);

/** Every account in the persona's fixture, with the bureau it sits in. */
export function accountsOf(persona: string): Json[] {
    return personaFile(persona).bureaux.flatMap((b: Json) => (b.accounts ?? []).map((a: Json) => ({ ...a, bureauId: b.id })));
}

/** The one account that matches, or a loud failure naming the persona and what was sought (design section 6). */
export function theOne(persona: string, what: string, matches: (a: Json) => boolean): Json {
    const found = accountsOf(persona).filter(matches);
    if (found.length !== 1) {
        throw new Error(`The '${persona}' fixture holds ${found.length} accounts matching '${what}', expected exactly one`);
    }
    return found[0];
}

export function maybeOne(persona: string, what: string, matches: (a: Json) => boolean): Json | undefined {
    const found = accountsOf(persona).filter(matches);
    if (found.length > 1) throw new Error(`The '${persona}' fixture holds ${found.length} accounts matching '${what}'`);
    return found[0];
}
