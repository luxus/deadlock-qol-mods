#!/usr/bin/env python3
"""Fail when two mods ship the same path. One mod may ship that path in each of its paks."""
import os, subprocess, sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HISTORICAL = "panorama/layout/post_game/citadel_db_page_post_game_new.vxml_c"

def report(owners):
    bad = {path: mods for path, mods in owners.items() if len(mods) > 1}
    for path in sorted(bad):
        print("%s is in %s." % (path, " and ".join(bad[path])), file=sys.stderr)
    if bad:
        print("The lower pak number wins and the other mod never loads. Give each file its own path.", file=sys.stderr)
        print("QoL Lite and commend-split both shipped %s (root README, before the split)." % HISTORICAL, file=sys.stderr)
        return 1
    return 0

def self_test():
    code = report({HISTORICAL: ["commend-split.vpk", "qol-lite.vpk"]})
    if code == 0:
        print("self-test did not fail on the shared post-game layout", file=sys.stderr)
        return 1
    print("self-test: shared post-game layout failed, as required")
    return 0

def live():
    modlock = os.environ.get("MODLOCK", os.path.join(ROOT, "tools", "modlock"))
    owners = defaultdict(list)
    vpks = []
    for name in sorted(os.listdir(os.path.join(ROOT, "paks"))):
        build = os.path.join(ROOT, "paks", name, "build")
        if not os.path.isdir(build):
            continue
        for fn in sorted(os.listdir(build)):
            if fn.endswith(".vpk"):
                vpks.append((name, os.path.join(build, fn)))
    if not vpks:
        print("no built paks. Run sh tools/ci.sh so the overlap check sees the vpks.", file=sys.stderr)
        return 1
    for mod, vpk in vpks:
        out = subprocess.check_output([modlock, "vpk", "list", vpk], text=True)
        for line in out.splitlines():
            parts = line.split()
            if not parts:
                continue
            if mod not in owners[parts[-1]]:
                owners[parts[-1]].append(mod)
    return report(owners)

if __name__ == "__main__":
    sys.exit(self_test() if "--self-test" in sys.argv else live())
