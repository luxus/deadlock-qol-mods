#!/usr/bin/env python3
"""Fail when pak source matches a credential pattern."""
import os, re, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAT = re.compile(
    r"(ghp_|gho_|github_pat_|xox[bp]-|sk-[A-Za-z0-9]{16}|AKIA[0-9A-Z]{16}|-----BEGIN|Bearer\s+[A-Za-z0-9._-]{12}|(api[_-]?key|secret|password|passwd)\s*[:=]\s*[\"'][^\"']{6,})",
    re.I,
)

def scan(root):
    hits = []
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in ("build", ".git")]
        for fn in fns:
            if fn.endswith((".vpk", ".vtex_c", ".vxml_c", ".vjs_c", ".vcss_c")):
                continue
            path = os.path.join(dp, fn)
            try:
                lines = open(path, encoding="utf-8", errors="replace")
            except OSError:
                continue
            with lines:
                for i, line in enumerate(lines, 1):
                    if PAT.search(line):
                        hits.append("%s:%d" % (path, i))
    return hits

def self_test():
    with tempfile.TemporaryDirectory() as d:
        path = os.path.join(d, "leak.txt")
        with open(path, "w", encoding="utf-8") as f:
            f.write('token = "ghp_abcdefghijklmnopqrst"\n')
        hits = scan(d)
        if not hits:
            print("self-test did not flag a ghp_ token", file=sys.stderr)
            return 1
    print("self-test: ghp_ token flagged, as required")
    return 0

def live():
    hits = scan(os.path.join(ROOT, "paks"))
    for hit in hits:
        print("possible secret:", hit, file=sys.stderr)
    if hits:
        print("Remove the credential. tools/check-secrets.py is the scan that used to live in tools/build.py.", file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(self_test() if "--self-test" in sys.argv else live())
