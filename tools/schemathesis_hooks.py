# version: 1 | created: 2026-10-17T00:00Z | project: credit-dashboard-sut | type: tool | language: en-GB
"""Schemathesis hooks for tools/schemathesis-run.mjs (CDS-38 R2-A-13).

The contract names a preferred name with the pattern \\p{L}, which Python's regular expressions cannot read: Schemathesis's own
response check reports a letter such as "µ" as a violation. Switching that check off for the whole operation (as schemathesis.toml
did before) also stopped it seeing a leaked property or a wrong type in that response. This check takes its place for the one
operation: it validates the response against the contract's schema with the \\p{L} patterns removed, so everything else in the
schema (types, required members, `additionalProperties: false`) is still enforced. The pattern itself is checked by the service
tests, which use a validator that understands \\p{L}.
"""
import copy
import os

import jsonschema_rs
import schemathesis
import yaml

CONTRACT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'DOCS', '.architecture', 'openapi.yaml')
OPERATION = ('/me/profile/preferred-name', 'patch')


def _strip_unicode_class_patterns(node):
    if isinstance(node, dict):
        return {k: _strip_unicode_class_patterns(v) for k, v in node.items() if not (k == 'pattern' and isinstance(v, str) and '\\p{' in v)}
    if isinstance(node, list):
        return [_strip_unicode_class_patterns(v) for v in node]
    return node


with open(CONTRACT, encoding='utf-8') as handle:
    _DOCUMENT = yaml.safe_load(handle)
_COMPONENTS = _strip_unicode_class_patterns(copy.deepcopy(_DOCUMENT['components']))


@schemathesis.check
def preferred_name_conformance(ctx, response, case):
    """The preferred-name responses match the contract's schema, apart from the \\p{L} pattern."""
    if (case.operation.path, case.operation.method.lower()) != OPERATION:
        return
    declared = _DOCUMENT['paths'][OPERATION[0]][OPERATION[1]]['responses'].get(str(response.status_code))
    media = (declared or {}).get('content', {}).get('application/json')
    if media is None or 'application/json' not in response.headers.get('content-type', [''])[0]:
        return
    schema = _strip_unicode_class_patterns(media['schema'])
    validator = jsonschema_rs.Draft202012Validator({**schema, 'components': _COMPONENTS})
    errors = list(validator.iter_errors(response.json()))
    if errors:
        raise AssertionError(f'preferred-name {response.status_code} response does not match the contract: {errors[0].message}')
