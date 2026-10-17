import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';

const contractPath = fileURLToPath(new URL('../../../../DOCS/.architecture/openapi.yaml', import.meta.url));

type Json = Record<string, any>;

/** One HTTP response as the validator needs it: what came back, not what the caller made of it (B-01, B-09, B-12). */
export interface ResponseToCheck {
    status: number;
    /** The Content-Type header, or null when there is none. */
    contentType: string | null;
    /** Response headers, names in lower case. */
    headers: Record<string, string>;
    /** The parsed JSON body, or undefined when there is none or it is not JSON. */
    body: unknown;
    /** The body exactly as received. */
    text: string;
}

/** Fields a Problem must never carry: a stack trace is a defect, not an extension member (B-11). */
const FORBIDDEN_PROBLEM_FIELDS = ['stack', 'stackTrace', 'trace', 'exception'];

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
        // Strict mode (B-12): an unknown keyword or a mistyped schema is an error here, not a schema that silently allows anything.
        // The OpenAPI document is the root the schemas are reached through, so its own top-level keywords, and the one
        // OpenAPI annotation the schemas use ('example'), are declared; any other unknown keyword is an error.
        this.ajv = new Ajv2020({ strict: true, allowUnionTypes: true, allErrors: true });
        this.ajv.addVocabulary(['openapi', 'info', 'servers', 'security', 'tags', 'paths', 'components', 'example']);
        addFormats.default(this.ajv);
        this.ajv.addSchema(this.doc, 'contract', true);
        // Compile every documented response now, so a schema strict mode refuses fails when the contract is loaded and
        // not only when a scenario first reaches it.
        for (const key of Object.keys(this.doc.components['x-responses'])) {
            this.validators.set(key, this.ajv.compile({ $ref: `contract#/components/x-responses/${key}` }));
        }
    }

    /**
     * Where a response schema allows a property it does not list: every object schema reachable from a documented response that is
     * not `additionalProperties: false`, named by its component (`Problem`) or by the path inside the schema that holds it
     * (`Problem.errors[]`). A unit test pins the answer, so reopening one schema, as a refactor might, is a failure (R2-B-02).
     */
    openResponseSchemas(): string[] {
        const open = new Set<string>();
        const seen = new Set<string>();
        const walk = (schema: Json | undefined, where: string): void => {
            if (!schema || typeof schema !== 'object') return;
            if (typeof schema.$ref === 'string') {
                const name = String(schema.$ref).split('/').pop()!;
                if (seen.has(name)) return;
                seen.add(name);
                walk(this.doc.components.schemas[name], name);
                return;
            }
            for (const key of ['allOf', 'oneOf', 'anyOf']) {
                (schema[key] as Json[] | undefined)?.forEach((part, i) => walk(part, `${where}.${key}[${i}]`));
            }
            if (schema.type === 'array' || schema.items) walk(schema.items, `${where}[]`);
            if (schema.type === 'object' || schema.properties) {
                if (schema.additionalProperties !== false) open.add(where);
                for (const [name, child] of Object.entries<Json>(schema.properties ?? {})) walk(child, `${where}.${name}`);
                if (schema.additionalProperties && typeof schema.additionalProperties === 'object') walk(schema.additionalProperties, `${where}.*`);
            }
        };
        for (const [key, schema] of Object.entries<Json>(this.doc.components['x-responses'])) walk(schema, key);
        return [...open].sort();
    }

    operation(operationId: string): Operation {
        const op = this.operations.get(operationId);
        if (!op) throw new Error(`The contract has no operation '${operationId}'`);
        return op;
    }

    /**
     * Throws, naming the operation and the cause, if the response is not one the contract allows: an undocumented status,
     * a content type the response does not document, a documented header that is missing or wrong, a body that is not JSON
     * when it says it is, a Problem whose status disagrees or that carries a stack trace, or a body that does not match its
     * schema (a closed schema also refuses an extra property).
     */
    validate(operationId: string, response: ResponseToCheck): void {
        const { status, body, text } = response;
        const op = this.operation(operationId);
        const key = `${operationId}_${status}`;
        const responses = this.doc.paths[op.path][op.method.toLowerCase()].responses as Json;
        const documented = Object.keys(responses);
        if (!documented.includes(String(status))) {
            throw new Error(`${operationId}: status ${status} is not documented in the contract (documented: ${documented.join(', ')})`);
        }
        const resolved = this.resolveResponse(responses[String(status)]);
        const hasBody = text.length > 0;
        const mediaTypes = Object.keys(resolved?.content ?? {});
        if (mediaTypes.length === 0) {
            if (hasBody) throw new Error(`${operationId}: status ${status} documents no body, but one was returned`);
        } else {
            const actual = response.contentType?.split(';')[0]?.trim().toLowerCase() ?? null;
            if (!actual || !mediaTypes.includes(actual)) {
                throw new Error(`${operationId}: the ${status} response has content type '${actual ?? 'none'}', and the contract documents ${mediaTypes.map((m) => `'${m}'`).join(' or ')}`);
            }
            if (hasBody && body === undefined) {
                throw new Error(`${operationId}: the ${status} response says it is ${actual} but its body is not JSON: ${text.slice(0, 120)}`);
            }
        }
        this.checkHeaders(operationId, status, resolved, response.headers);
        if (response.contentType?.toLowerCase().startsWith('application/problem+json') && body && typeof body === 'object') {
            const problem = body as Json;
            if (problem.status !== status) {
                throw new Error(`${operationId}: the problem's status ${problem.status} does not agree with the HTTP status ${status}`);
            }
            const leaked = FORBIDDEN_PROBLEM_FIELDS.filter((name) => name in problem);
            if (leaked.length > 0) throw new Error(`${operationId}: the ${status} problem carries ${leaked.join(', ')}, which must never leave the service`);
        }
        if (!this.doc.components['x-responses'][key]) return;
        let validator = this.validators.get(key);
        if (!validator) {
            validator = this.ajv.compile({ $ref: `contract#/components/x-responses/${key}` });
            this.validators.set(key, validator);
        }
        if (!validator(body)) {
            const first = validator.errors![0]!;
            throw new Error(
                `${operationId}: the ${status} response does not match the contract at '${first.instancePath || '/'}': ${first.message} ` +
                    `(${validator.errors!.length} error${validator.errors!.length === 1 ? '' : 's'}); body: ${String(JSON.stringify(body)).slice(0, 300)}`,
            );
        }
    }

    /** A header the contract documents on a response must be present and match its schema, unless the contract says it is not required. */
    private checkHeaders(operationId: string, status: number, resolved: Json | undefined, actual: Record<string, string>): void {
        for (const [name, header] of Object.entries<Json>(resolved?.headers ?? {})) {
            const value = actual[name.toLowerCase()];
            if (value === undefined) {
                if (header.required === false) continue;
                throw new Error(`${operationId}: the ${status} response has no ${name} header, which the contract documents`);
            }
            const schema = header.schema as Json | undefined;
            if (!schema) continue;
            const typed = schema.type === 'integer' || schema.type === 'number' ? Number(value) : value;
            const wholeNumber = schema.type !== 'integer' || /^[0-9]+$/.test(value);
            if (!wholeNumber || !this.ajv.compile(schema)(typed)) {
                throw new Error(`${operationId}: the ${status} response's ${name} header '${value}' does not match the contract (${JSON.stringify(schema)})`);
            }
        }
    }

    private resolveResponse(response: Json): Json | undefined {
        if (!response?.$ref) return response;
        const name = String(response.$ref).split('/').pop()!;
        return this.doc.components.responses[name];
    }
}
