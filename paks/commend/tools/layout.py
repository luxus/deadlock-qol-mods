#!/usr/bin/env python3
"""Insert the Commend row into Valve post-game layouts, and the registrar into hud_join_team."""
import sys
from pathlib import Path

BANNER = '<!-- Valve layout + Deadlock Commend (tools/layout.py) -->\n'
STYLE = '\t\t<include src="s2r://panorama/styles/post_game/deadlock_commend.vcss_c" />\n'
LOGIC = '\t\t<include src="s2r://panorama/scripts/deadlock_commend.vjs_c" />\n'
SETTINGS = '\t\t<include src="s2r://panorama/scripts/deadlock_commend_settings.vjs_c" />\n'
HUD = '\t<scripts>\n\t\t<include src="s2r://panorama/scripts/deadlock_commend_register.vjs_c" />\n\t</scripts>\n'

KINDS = (('Team', 'DcTeam'), ('Enemy', 'DcEnemy'), ('All', 'DcAll'), ('Return', 'DcReturn'))


def row(screen, tabs):
    pad = '\t' * tabs
    lines = [pad + '<Panel id="DcRow_%s" class="DcRow">' % screen]
    for text, cls in KINDS:
        lines.append(pad + '\t<Button id="%s_%s" class="DcBtn %s">' % (cls, screen, cls))
        lines.append(pad + '\t\t<Image class="DcIcon" src="s2r://panorama/images/icons/icon_thumbsup.vsvg" scaling="contain" />')
        lines.append(pad + '\t\t<Label class="DcText" text="%s" />' % text)
        lines.append(pad + '\t</Button>')
    lines.append(pad + '</Panel>')
    return '\n'.join(lines)


def strip_banner(src):
    if src.startswith('<!--'):
        src = src[src.index('-->') + 3:].lstrip('\n')
    return src


def compiled(src):
    return src.replace('.vcss"', '.vcss_c"').replace('.vts"', '.vts_c"')


def add_style(src):
    if 'deadlock_commend.vcss_c' in src:
        return src
    end = '\t</styles>\n'
    if end not in src:
        raise SystemExit('styles block not found')
    return src.replace(end, STYLE + end, 1)


def add_scripts(src, hud):
    if hud:
        if 'deadlock_commend_register.vjs_c' in src:
            return src
        end = '\t</styles>\n'
        if end not in src:
            raise SystemExit('styles block not found')
        return src.replace(end, end + HUD, 1)
    if 'deadlock_commend.vjs_c' in src:
        return src
    end = '\t</scripts>\n'
    if end not in src:
        raise SystemExit('scripts block not found')
    return src.replace(end, LOGIC + SETTINGS + end, 1)


def insert_after(src, anchor, block):
    at = src.find(anchor)
    if at < 0:
        raise SystemExit('anchor not found: ' + anchor.strip())
    if block.strip().split('\n', 1)[0] in src:
        return src
    nl = src.find('\n', at)
    return src[:nl + 1] + block + '\n' + src[nl + 1:]


def patch(name, src):
    src = strip_banner(src)
    if name != 'hud':
        src = add_style(src)
    src = compiled(add_scripts(src, name == 'hud'))
    if name == 'page':
        src = insert_after(src, '<CitadelPostGameTeam id="Team1" />', row('Team1', 6))
        src = insert_after(src, '<CitadelPostGameTeam id="Team2" />', row('Team2', 6))
        src = insert_after(src, '<CitadelPostGameScoreboardNew id="Scoreboard" acceptsfocus="true" />', row('Scoreboard', 6))
    elif name == 'mvp':
        src = insert_after(src, '<Panel id="HonorableMentions" />', row('MVP', 2))
    elif name != 'hud':
        raise SystemExit('kind must be page, mvp, or hud')
    return BANNER + src


def main():
    kind, src, dest = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(patch(kind, src.read_text(encoding='utf-8')), encoding='utf-8')


if __name__ == '__main__':
    main()
