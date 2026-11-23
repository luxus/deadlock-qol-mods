#!/usr/bin/env python3
"""Fail unless docs/cleanroom-spec/TRACE.md names every C1-C29 and P1-P38 item and each cited line exists."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / 'docs/cleanroom-spec/TRACE.md').read_text(encoding='utf-8')
missing = []
for prefix, count in (('C', 29), ('P', 38)):
    for n in range(1, count + 1):
        key = '%s%d' % (prefix, n)
        if not re.search(r'(?<![A-Za-z0-9])%s(?![0-9])' % key, text):
            missing.append(key + ' is not in TRACE.md')
for path, line in re.findall(r'`([^`\s]+):(\d+)`', text):
    file = ROOT / path
    if not file.is_file():
        missing.append('missing ' + path)
        continue
    total = len(file.read_text(encoding='utf-8').splitlines())
    if not 1 <= int(line) <= total:
        missing.append('%s:%s is outside the file (%s lines)' % (path, line, total))
if missing:
    print('\n'.join(missing), file=sys.stderr)
    sys.exit(1)
print('TRACE.md covers C1-C29 and P1-P38')
