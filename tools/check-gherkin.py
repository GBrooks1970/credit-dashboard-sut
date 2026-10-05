# version: 1 | created: 2026-10-05T20:41Z | project: credit-dashboard-sut | type: tool | language: en-GB
"""Parse every feature file in features-shared/ and report rule coverage.

Fails when a file does not parse, or when a business rule BR-01 to BR-15 has no tagged scenario.
Run from the repository root:  python tools/check-gherkin.py
Needs: pip install gherkin-official==29.0.0
"""
import pathlib
import re
import sys

from gherkin.parser import Parser

root = pathlib.Path(__file__).resolve().parent.parent
files = sorted((root / "features-shared").rglob("*.feature"))
scenarios, br, pr, failures = 0, set(), set(), []
for path in files:
    text = path.read_text(encoding="utf-8")
    try:
        doc = Parser().parse(text)
    except Exception as exc:  # report every unparsable file, not only the first
        failures.append(f"{path.relative_to(root)}: {exc}")
        continue
    scenarios += sum(1 for child in doc["feature"]["children"] if "scenario" in child)
    br |= set(re.findall(r"@BR-\d\d", text))
    pr |= set(re.findall(r"@PR-\d\d", text))
missing = sorted(f"@BR-{n:02d}" for n in range(1, 16) if f"@BR-{n:02d}" not in br)
if missing:
    failures.append(f"business rules with no tagged scenario: {', '.join(missing)}")
print(f"{len(files)} feature files, {scenarios} scenarios; BR tags {len(br)} of 15; PR tags {len(pr)} of 11")
for failure in failures:
    print(f"  FAIL {failure}")
sys.exit(1 if failures else 0)
