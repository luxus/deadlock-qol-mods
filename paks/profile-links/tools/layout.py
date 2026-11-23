#!/usr/bin/env python3
"""Insert Profile Links into the Valve profile, card, scoreboard and match-start layouts."""
import sys
from pathlib import Path

BANNER = '<!-- Valve layout + Deadlock Profile Links (tools/layout.py) -->\n'
PAGE_STYLE = '\t\t<include src="s2r://panorama/styles/profile_links.vcss_c" />\n'
BOARD_STYLE = '\t\t<include src="s2r://panorama/styles/profile_links_scoreboard.vcss_c" />\n'
PAGE_JS = (
	'\t<scripts>\n'
	'\t\t<include src="s2r://panorama/scripts/profile_links.vjs_c" />\n'
	'\t\t<include src="s2r://panorama/scripts/profile_links_settings.vjs_c" />\n'
	'\t</scripts>\n'
)
BOARD_JS = (
	'\t<scripts>\n'
	'\t\t<include src="s2r://panorama/scripts/profile_links_scoreboard.vjs_c" />\n'
	'\t\t<include src="s2r://panorama/scripts/profile_links_settings.vjs_c" />\n'
	'\t</scripts>\n'
)
HUD_JS = '\t<scripts>\n\t\t<include src="s2r://panorama/scripts/profile_links_register.vjs_c" />\n\t</scripts>\n'

LOGO = (
	'<Image class="PlLogo" src="s2r://panorama/images/profile_links/%s_png.vtex" scaling="contain" hittest="false" />'
)
PROBES = (
	'<Label id="PlAccountId" class="PlProbe" text="{i:r:account_id}" />'
	'<Label id="PlAccountIdDirect" class="PlProbe" text="{i:account_id}" />'
	'<Label id="PlFriendCode" class="PlProbe" text="{i:friend_code}" />'
)


def strip_banner(src):
	if src.startswith('<!--'):
		src = src[src.index('-->') + 3:].lstrip('\n')
	return src


def compiled(src):
	return src.replace('.vcss"', '.vcss_c"').replace('.vts"', '.vts_c"')


def once(src, old, new, label):
	if old not in src:
		raise SystemExit('anchor missing: ' + label)
	return src.replace(old, new, 1)


def style_and_script(src, style, script):
	end = '\t</styles>\n'
	if end not in src:
		raise SystemExit('styles block not found')
	if style.strip() not in src:
		src = src.replace(end, style + end, 1)
	if script.strip().split('\n')[1] not in src:
		src = src.replace(end, end + script, 1)
	return src


def rank_block(kind):
	spin = '24' if kind == 'page' else '20'
	return (
		'<Panel id="PlRank" class="PlRank PlRank%s PlLoading">' % ('Page' if kind == 'page' else 'Card')
		+ '<Panel class="PlRankBox">'
		+ '<Panel class="PlPlaceholder"><Panel class="PlPlaceholderSlot">'
		+ '<Image class="PlPlaceholderImage" src="s2r://panorama/images/ranked/badges/rank00_lg_psd.vtex" scaling="stretch-to-fit-preserve-aspect" />'
		+ '</Panel></Panel>'
		+ '<Image class="PlSpinner" src="s2r://panorama/images/control_icons/spinner_png.vtex" scaling="contain" />'
		+ '<Panel id="PlRankImage" class="PlImageBox" />'
		+ '</Panel></Panel>'
	).replace('24px', spin)


def logo_button(site, tip, extra):
	return (
		'<Button id="Pl%s" class="PlLink Pl%s %s PlPending" onmouseover="UIShowTextTooltip( &apos;%s&apos; )" onmouseout="UIHideTextTooltip()">'
		% (site, site, extra, tip)
		+ LOGO % site.lower()
		+ '</Button>'
	)


def patch_page(src):
	src = style_and_script(compiled(strip_banner(src)), PAGE_STYLE, PAGE_JS)
	src = once(
		src,
		'<CitadelUserName id="SelfName" />',
		'<Panel id="PlNameRow" class="PlNameRow">'
		+ logo_button('Statlocker', 'View Statlocker Profile', '')
		+ logo_button('Deadchaps', 'View DeadChaps Profile', '')
		+ '<CitadelUserName id="SelfName" hittest="false" />'
		+ '</Panel>',
		'self',
	)
	src = once(
		src,
		'<Label class="defaultText" text="#Citadel_JoinForum_ViewInfo" />\n\t\t\t\t\t\t\t\t</Button>\n\t\t\t\t\t\t\t</Panel>',
		'<Label class="defaultText" text="#Citadel_JoinForum_ViewInfo" />\n\t\t\t\t\t\t\t\t</Button>\n'
		+ '\t\t\t\t\t\t\t\t' + PROBES + '\n'
		+ '\t\t\t\t\t\t\t\t' + rank_block('page') + '\n'
		+ '\t\t\t\t\t\t\t</Panel>',
		'forum',
	)
	return BANNER + src


def patch_card(src):
	src = style_and_script(compiled(strip_banner(src)), PAGE_STYLE, PAGE_JS)
	src = once(
		src,
		'<Label class="AccountID" text="#Citadel_ProfileCard_AccountID" />',
		'<Label class="AccountID" text="#Citadel_ProfileCard_AccountID" />'
		'<Label id="PlAccountId" class="PlProbe" text="{i:r:account_id}" />'
		+ rank_block('card'),
		'account',
	)
	buttons = (
		'<Button id="PlStatlocker" class="PlText PlLink PlStatlocker PlPending"><Label text="View Statlocker Profile" /></Button>'
		'<Button id="PlDeadchaps" class="PlText PlLink PlDeadchaps PlPending"><Label text="View DeadChaps Profile" /></Button>'
	)
	src = once(src, '<Panel id="PartyInfo">', buttons + '<Panel id="PartyInfo">', 'party')
	return BANNER + src


def patch_board(src):
	src = style_and_script(compiled(strip_banner(src)), BOARD_STYLE, BOARD_JS)
	src = src.replace(
		'<CitadelPostGameScoreboardNew hittest="false">',
		'<CitadelPostGameScoreboardNew class="PlScoreboard" hittest="false">',
		1,
	)
	old = (
		'\t\t\t\t<Panel class="CommendContainer">\n'
		'\t\t\t\t\t<Button id="CommendPlayerButton" class="CommendColumn" onmouseover="UIShowTextTooltip( #Citadel_MatchDetails_CommendTooltip ); CitadelPostGameCommendHover( true );" onmouseout="UIHideTextTooltip();  CitadelPostGameCommendHover( false );" />\n'
		'\t\t\t\t\t<Panel class="GotCommendedIcon CommendColumn" />\n'
		'\t\t\t\t\t<Panel id="LocalPlayerIdentifier" class="CommendColumn" />\n'
		'\t\t\t\t</Panel>'
	)
	new = (
		'\t\t\t\t<Button id="CommendPlayerButton" class="CommendColumn" onmouseover="UIShowTextTooltip( #Citadel_MatchDetails_CommendTooltip ); CitadelPostGameCommendHover( true );" onmouseout="UIHideTextTooltip();  CitadelPostGameCommendHover( false );">\n'
		'\t\t\t\t\t<Panel id="commendIcon" />\n'
		'\t\t\t\t</Button>\n'
		'\t\t\t\t<Panel class="GotCommendedIcon CommendColumn" />\n'
		'\t\t\t\t<Panel id="LocalPlayerIdentifier" class="CommendColumn" />'
	)
	# SPEC-OPEN O-P1: the three commend columns sit side by side. Valve's wrapper and its animation are gone.
	src = once(src, old, new, 'commend')
	src = once(
		src,
		'<Panel class="PlayerInfoContainer">',
		'<Panel class="PlayerInfoContainer">'
		'<Label id="PlAccountId" class="PlProbe" text="{i:r:account_id}" />'
		'<Label id="PlAccountIdDirect" class="PlProbe" text="{i:account_id}" />'
		'<Label id="PlPlayerAccountId" class="PlProbe" text="{i:player_account_id}" />'
		'<Label id="PlPlayerAccountIdRoot" class="PlProbe" text="{i:r:player_account_id}" />',
		'probes',
	)
	slot = (
		'\t\t\t\t<Panel class="PlSlot">'
		'<Button id="PlStatlocker" class="PlLink PlStatlocker" onmouseover="UIShowTextTooltip( &apos;View Statlocker Profile&apos; )" onmouseout="UIHideTextTooltip()">'
		+ (LOGO % 'statlocker') + '</Button>'
		'<Button id="PlDeadchaps" class="PlLink PlDeadchaps" onmouseover="UIShowTextTooltip( &apos;View DeadChaps Profile&apos; )" onmouseout="UIHideTextTooltip()">'
		+ (LOGO % 'deadchaps') + '</Button>'
		'</Panel>\n'
	)
	src = once(
		src,
		'<Button class="CopyBuildButton" id="CopyBuildButton" onmouseover="UIShowTextTooltip( #Citadel_HeroBuilds_CopyPostGameBuild )" onmouseout="UIHideTextTooltip()" />\n\t\t\t\t</Panel>\n\t\t\t</Panel>',
		'<Button class="CopyBuildButton" id="CopyBuildButton" onmouseover="UIShowTextTooltip( #Citadel_HeroBuilds_CopyPostGameBuild )" onmouseout="UIHideTextTooltip()" />\n\t\t\t\t</Panel>\n'
		+ slot
		+ '\t\t\t</Panel>',
		'slot',
	)
	return BANNER + src


def patch_hud(src):
	src = style_and_script(compiled(strip_banner(src)), '', HUD_JS)
	return BANNER + src


def main():
	kind, src, dest = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
	text = src.read_text(encoding='utf-8')
	out = {'page': patch_page, 'card': patch_card, 'board': patch_board, 'hud': patch_hud}[kind](text)
	dest.parent.mkdir(parents=True, exist_ok=True)
	dest.write_text(out, encoding='utf-8')


if __name__ == '__main__':
	main()
