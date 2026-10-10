import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';

const contractPath = fileURLToPath(new URL('../../../../DOCS/.architecture/openapi.yaml', import.meta.url));

type Json = Record<string, any>;

export interface Operation {
    operationId: string;
    method: string;
    path: string;
    needsUser: boolean;
    needsControlKey: boolean;
}

/**
 * Reads the contract and validates responses against it (DR-042). The harness reads the contract on its own, so a
 * contract and a service that drift apart fail here and not only in the service's own tests.
 */
export class Contract {
    private readonly doc: Json;
    private readonly ajv: Ajv2020;
    private readonly operations = new Map<string, Operation>();
    private readonly validators = new Map<string, ReturnType<Ajv2020['compile']>>();

    constructor() {
        this.doc = parse(readFileSync(contractPath, 'utf8')) as Json;
        const globalSecurity = (this.doc.security ?? []) as Json[];
        this.doc.components['x-responses'] = {};
        for (const [path, item] of Object.entries<Json>(this.doc.paths)) {
            for (const [method, op] of Object.entries<Json>(item)) {
                if (!op?.operationId) continue;
                const security = (op.security ?? globalSecurity) as Json[];
                const schemes = security.flatMap((entry) => Object.keys(entry));
                this.operations.set(op.operationId, {
                    operationId: op.operationId,
                    method: method.toUpperCase(),
                    path,
                    needsUser: schemes.includes('bearerAuth'),
                    needsControlKey: schemes.includes('testControlKey'),
                });
                for (const [status, response] of Object.entries<Json>(op.responses ?? {})) {
                    const resolved = this.resolveResponse(response);
                    const content = resolved?.content ? Object.values<Json>(resolved.content)[0] : undefined;
                    if (content?.schema) this.doc.components['x-responses'][`${op.operationId}_${status}`] = content.schema;
                }
            }
        }
        this.ajv = new Ajv2020({ strict: false, allErrors: true });
        addFormats.default(this.ajv);
        this.ajv.addSchema(this.doc, 'contract', true);
    }

    operation(operationId: string): Operation {
        const op = this.operations.get(operationId);
        if (!op) throw new Error(`The contract has no operation '${operationId}'`);
        return op;
    }

    /** Throws, naming the operation, status and first failing path, if the body does not match the contract. */
    validate(operationId: string, status: number, body: unknown, hasBody: boolean): void {
        const op = this.operation(operationId);
        const key = `${operationId}_${status}`;
        const documented = Object.keys(this.doc.paths[op.path][op.method.toLowerCase()].responses);
        if (!documented.includes(String(status))) {
            throw new Error(`${operationId}: status ${status} is not documented in the contract (documented: ${documented.join(', ')})`);
        }
        if (!this.doc.components['x-responses'][key]) {
            if (hasBody) throw new Error(`${operationId}: status ${status} documents no body, but one was returned`);
            return;
        }
        let validator = this.validators.get(key);
        if (!validator) {
            validator = this.ajv.compile({ $ref: `contract#/components/x-responses/${key}` });
            this.validators.set(key, validator);
        }
        if (!validator(body)) {
            const first = validator.errors![0]!;
            throw new Error(
                `${operationId}: the ${status} response does not match the contract at '${first.instancePath || '/'}': ${first.message} ` +
                    `(${validator.errors!.length} error${validator.errors!.length === 1 ? '' : 's'}); body: ${JSON.stringify(body).slice(0, 300)}`,
            );
        }
    }

    private resolveResponse(response: Json): Json | undefined {
        if (!response?.$ref) return response;
        const name = String(response.$ref).split('/').pop()!;
        return this.doc.components.responses[name];
    }
}
