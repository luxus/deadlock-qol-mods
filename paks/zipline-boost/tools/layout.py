#!/usr/bin/env python3
"""Add our script include to hud_movement_speed.xml, a CitadelHud child that is
loaded in every HUD session and not overridden by HUD++ (lea console 22.11. 09:27:07 shows
it loading). Valve content is left untouched; tests/native_ids.py checks the native ids.
No style include: the overlay hangs under #gameplay_hud, which this file's styles never reach;
zipline_boost_overlay.xml carries the stylesheet instead."""
import sys
from pathlib import Path

SCRIPTS = '\t<scripts>\n\t\t<include src="s2r://panorama/scripts/zipline_boost.vjs_c" />\n\t</scripts>\n'
BANNER = '<!-- Valve layout + Deadlock Zipline Boost script include (tools/layout.py) -->\n'


def patch(src: str) -> str:
    if src.startswith('<!--'):
        src = src[src.index('-->') + 3:].lstrip()
    src = src.replace('.vcss"', '.vcss_c"')
    styles_end = '\t</styles>\n'
    if styles_end not in src:
        raise SystemExit('styles block not found')
    if 'CitadelHudMovementSpeed' not in src or '{s:movement_speed}' not in src:
        raise SystemExit('movement speed root or native tokens missing')
    if '\t</scripts>\n' in src:
        src = src.replace('\t</scripts>\n', '\t\t<include src="s2r://panorama/scripts/zipline_boost.vjs_c" />\n\t</scripts>\n', 1)
    else:
        src = src.replace(styles_end, styles_end + SCRIPTS, 1)
    return BANNER + src


def main():
    src, dest = Path(sys.argv[1]), Path(sys.argv[2])
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(patch(src.read_text(encoding='utf-8')), encoding='utf-8')


if __name__ == '__main__':
    main()
