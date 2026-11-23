#!/usr/bin/env python3
"""Read hookHudppTabs and step() out of both Addon Settings copies."""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LIBS = [
    "lib/addon-settings/1.2.3/addon_settings.js",
    "lib/addon-settings/1.2.4/addon_settings.js",
]

def body(src, name):
    key = "const " + name + " = "
    i = src.find(key)
    if i < 0:
        sys.exit("missing %s" % name)
    j = src.find("{", i)
    depth = 0
    for k in range(j, len(src)):
        if src[k] == "{":
            depth += 1
        elif src[k] == "}":
            depth -= 1
            if depth == 0:
                return src[j:k + 1]
    sys.exit("unclosed %s" % name)

def hudpp(src):
    b = body(src, "hookHudppTabs")
    parked = b.find("parked === id")
    other = b.find("activateHudpp(other)")
    own = b.find("activateHudpp(b)")
    return parked >= 0 and other > parked and own > other

def look_lifts(src):
    return "syncPlay(" in body(src, "step")

def main():
    which = sys.argv[1]
    texts = [(p, open(os.path.join(ROOT, p), encoding="utf-8").read()) for p in LIBS]
    if which == "hudpp":
        bad = [p for p, t in texts if not hudpp(t)]
        if bad:
            print("BUG")
            for p in bad:
                print(p, file=sys.stderr)
        else:
            print("FIX")
        return
    if which == "pin":
        fixed = [p for p, t in texts if look_lifts(t)]
        if fixed:
            print("LIFTS")
            for p in fixed:
                print(p, file=sys.stderr)
        else:
            print("STALE")
        return
    sys.exit("use hudpp or pin")

if __name__ == "__main__":
    main()
