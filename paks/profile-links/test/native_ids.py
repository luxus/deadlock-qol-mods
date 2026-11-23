#!/usr/bin/env python3
"""Gate: every Valve layout we override keeps every native panel id and snippet name of the
vanilla file, and keeps the vanilla element order/types for those ids. A missing native id
crashes the game ("FATAL ERROR: Unable to find child ..."). Usage: native_ids.py <repo>"""
import re, sys
from pathlib import Path
repo = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
ID = re.compile(r'<(\w+)\b[^>]*?\bid="([^"]+)"')
SNIP = re.compile(r'<snippet\s+name="([^"]+)"')
def strip(s): return re.sub(r'<!--.*?-->', '', s, flags=re.S)
fails = checked = 0
for lay in sorted(repo.glob('build/pak*/panorama/layout/**/*.xml')):
    name = lay.name
    van = next((v for v in [repo / 'vanilla' / name, repo / 'vanilla' / (name + '.reference'), *repo.glob('vanilla/**/' + name)] if v.exists()), None)
    if van is None:
        print('FAIL no vanilla source for', lay.relative_to(repo)); fails += 1; continue
    v, b = strip(van.read_text()), strip(lay.read_text())
    vids, bids = ID.findall(v), ID.findall(b)
    bset = {}
    for t, i in bids: bset.setdefault(i, []).append(t)
    for t, i in vids:
        checked += 1
        if i not in bset: print('FAIL', lay.relative_to(repo), 'drops native id', i, '(' + t + ')'); fails += 1
        elif t not in bset[i]: print('FAIL', lay.relative_to(repo), 'native id', i, 'changed type', t, '->', bset[i]); fails += 1
    for sn in SNIP.findall(v):
        checked += 1
        if sn not in SNIP.findall(b): print('FAIL', lay.relative_to(repo), 'drops snippet', sn); fails += 1
    # root element type must stay
    rv = re.search(r'</(?:styles|scripts|snippets)>\s*<(\w+)', v); rb = re.search(r'<(Citadel\w+|Panel)\b(?![^>]*id=)', b)
print(f'native ids: {checked} checked, {fails} failed')
sys.exit(1 if fails else 0)
