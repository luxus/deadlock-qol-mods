#!/usr/bin/env python3
"""Valve Escape-menu player list layouts plus our style, script and optional probes.

The list file only loads the script. The entry file (optional hook variant) adds
hidden account-id labels; runtime code creates the badge.
"""
import sys
from pathlib import Path

STYLE = '\t\t<include src="s2r://panorama/styles/lobby_ranks.vcss_c" />\n'
SCRIPTS = '\t<scripts>\n\t\t<include src="s2r://panorama/scripts/lobby_ranks.vjs_c" />\n\t</scripts>\n'
BANNER = '<!-- Valve layout + Deadlock Lobby Ranks includes (tools/layout.py) -->\n'
PROBE = '\t\t\t<Label id="LrRowHero" class="LrProbe" text="{g:citadel_hero_name:hero_id}" hittest="false" />\n'


def patch_list(src: str) -> str:
    if src.startswith('<!--'):
        src = src[src.index('-->') + 3:].lstrip()
    src = src.replace('.vcss"', '.vcss_c"')
    styles_end = '\t</styles>\n'
    if styles_end not in src:
        raise SystemExit('styles block not found')
    if 'lobby_ranks.vcss_c' not in src:
        src = src.replace(styles_end, STYLE + styles_end, 1)
    if 'lobby_ranks.vjs_c' not in src:
        if '\t</scripts>\n' in src:
            src = src.replace(
                '\t</scripts>\n',
                '\t\t<include src="s2r://panorama/scripts/lobby_ranks.vjs_c" />\n\t</scripts>\n',
                1,
            )
        else:
            src = src.replace(styles_end, styles_end + SCRIPTS, 1)
    return BANNER + src


def patch_entry(src: str) -> str:
    if src.startswith('<!--'):
        src = src[src.index('-->') + 3:].lstrip()
    src = src.replace('.vcss"', '.vcss_c"')
    styles_end = '\t</styles>\n'
    if styles_end not in src:
        raise SystemExit('styles block not found in entry')
    if 'lobby_ranks.vcss_c' not in src:
        src = src.replace(styles_end, STYLE + styles_end, 1)
    hook = '<Panel id="MainContents" hittestchildren="false">'
    if hook not in src:
        raise SystemExit('MainContents hook not found')
    if 'id="LrRowHero"' not in src:
        src = src.replace(hook, hook + '\n' + PROBE, 1)
    return BANNER + src


def main():
    kind, src, dest = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    dest.parent.mkdir(parents=True, exist_ok=True)
    text = src.read_text(encoding='utf-8')
    if kind == 'list':
        dest.write_text(patch_list(text), encoding='utf-8')
    elif kind == 'entry':
        dest.write_text(patch_entry(text), encoding='utf-8')
    else:
        raise SystemExit('kind must be list or entry')


if __name__ == '__main__':
    main()
