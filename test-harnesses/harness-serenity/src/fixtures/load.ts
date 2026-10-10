import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../fixtures/', import.meta.url));

export interface TestUser {
    username: string;
    password: string;
}

export function testUser(username: string): TestUser {
    const users = JSON.parse(readFileSync(`${root}users.json`, 'utf8')).users as TestUser[];
    const user = users.find((u) => u.username === username);
    if (!user) throw new Error(`fixtures/users.json has no test user '${username}'`);
    return user;
}
