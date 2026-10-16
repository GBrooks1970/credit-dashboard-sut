import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Contract, type ResponseToCheck } from './validate.js';

// The validator is what every @api step passes through, so it is tested on its own (CDS-38 F2; findings B-01, B-09 to B-12, B-21).
// Each case is a response the contract forbids, and each must be refused with a message that names the operation and the cause.

const contract = new Contract();
const PROBLEM = 'application/problem+json';

function response(status: number, body: unknown, over: Partial<ResponseToCheck> = {}): ResponseToCheck {
    return {
        status,
        contentType: body === undefined ? null : 'application/json',
        headers: {},
        body,
        text: body === undefined ? '' : JSON.stringify(body),
        ...over,
    };
}

const problem = (status: number, extra: Record<string, unknown> = {}) => ({ type: '/problems/not-found', title: 'Not found', status, ...extra });
const problemResponse = (status: number, body: Record<string, unknown>, over: Partial<ResponseToCheck> = {}) =>
    response(status, body, { contentType: PROBLEM, ...over });

describe('the contract validator', () => {
    it('accepts a Problem with the documented content type and a status that agrees', () => {
        contract.validate('getAccount', problemResponse(404, problem(404)));
    });

    it('refuses a Problem sent as text/plain (B-01)', () => {
        assert.throws(
            () => contract.validate('getAccount', problemResponse(404, problem(404), { contentType: 'text/plain' })),
            /getAccount: .*content type 'text\/plain'.*application\/problem\+json/,
        );
    });

    it('refuses a body with no content type at all (B-01)', () => {
        assert.throws(() => contract.validate('getAccount', problemResponse(404, problem(404), { contentType: null })), /content type/);
    });

    it('ignores a charset parameter on the content type', () => {
        contract.validate('getAccount', problemResponse(404, problem(404), { contentType: 'application/problem+json; charset=utf-8' }));
    });

    it('refuses a Problem whose status disagrees with the HTTP status (B-11)', () => {
        assert.throws(() => contract.validate('getAccount', problemResponse(404, problem(500))), /status 500 .* 404/);
    });

    it('refuses a Problem that carries a stack trace (B-11)', () => {
        assert.throws(() => contract.validate('getAccount', problemResponse(404, problem(404, { stack: 'at Foo.Bar()' }))), /stack/);
        assert.throws(() => contract.validate('getAccount', problemResponse(404, problem(404, { trace: 'x' }))), /trace/);
    });

    it('refuses an extra property on a closed response, as a leaked account number would be (B-10)', () => {
        const account = { id: 'acc_1', type: 'creditcard', provider: 'Lender X', maskedNumber: '*4821', balance: { amountMinor: 1, currency: 'GBP' }, includedInTotals: true, status: 'normal', fullNumber: '4111111111111111' };
        assert.throws(() => contract.validate('listAccounts', response(200, [account])), /additional properties/);
    });

    it('refuses a 429 with no Retry-After, a zero one and a non-integer one (B-09)', () => {
        const body = problem(429, { type: '/problems/rate-limited' });
        assert.throws(() => contract.validate('resendEmailVerification', problemResponse(429, body)), /Retry-After/);
        assert.throws(() => contract.validate('resendEmailVerification', problemResponse(429, body, { headers: { 'retry-after': '0' } })), /Retry-After/);
        assert.throws(() => contract.validate('resendEmailVerification', problemResponse(429, body, { headers: { 'retry-after': 'soon' } })), /Retry-After/);
        contract.validate('resendEmailVerification', problemResponse(429, body, { headers: { 'retry-after': '37' } }));
    });

    it('names the operation and the cause when a body is missing, and does not throw a TypeError (B-21)', () => {
        assert.throws(() => contract.validate('getAccount', response(200, undefined, { contentType: 'application/json' })), (error: Error) => {
            assert.ok(!(error instanceof TypeError), `a TypeError was thrown: ${error.message}`);
            assert.match(error.message, /getAccount: .*200/);
            return true;
        });
    });

    it('refuses a JSON content type whose body is not JSON', () => {
        assert.throws(() => contract.validate('getAccount', problemResponse(404, {}, { text: 'Not found', body: undefined })), /not JSON|does not match/);
    });
});
