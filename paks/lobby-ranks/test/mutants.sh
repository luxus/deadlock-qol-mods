#!/bin/sh
# Negative controls: each mutant of the built script must make the stand-in suite fail.
cd "$(dirname "$0")/.."
B=build/pak/panorama/scripts/lobby_ranks.js
run() { name=$1; shift; python3 -c "
import sys; s=open('$B').read(); args=sys.argv[1:]
for a,b in zip(args[::2],args[1::2]):
    assert a in s, 'mutant anchor missing: '+a; s=s.replace(a,b,1)
open('/tmp/lr_mutant.js','w').write(s)" "$@" || { echo "BROKEN $name"; return; }
  if node test/test.js /tmp/lr_mutant.js >/tmp/lr_mutant.out 2>&1; then echo "SURVIVED $name"; else echo "killed   $name ($(grep -c FAIL /tmp/lr_mutant.out) fails)"; fi; }

run default-off "const RANKS_DEFAULT = true;" "const RANKS_DEFAULT = false;"
run tick-every-frame "const TICK_S = 1;" "const TICK_S = 0.016;"
run runs-when-off "const settingsChanged = () => { if (wanted()) { attach(); const s = st(); if (s.party) s.party.want = ''; kick(); } else stop(); };" "const settingsChanged = () => { attach(); kick(); };" "	if (!wanted()) { if (ok(s.list)) entries(s.list).forEach(hideRow); AddonSettings.pulse(); return; }" "	if (!wanted()) { if (ok(s.list)) entries(s.list).forEach(hideRow); AddonSettings.pulse(); s.timer = \$.Schedule(TICK_S, tick); return; }"
run write-every-tick "const show = (p, on) => { const v = on ? 'visible' : 'collapse'; if (!ok(p) || p.style.visibility === v) return; p.style.visibility = v; };" "const show = (p, on) => { if (ok(p)) p.style.visibility = on ? 'visible' : 'collapse'; };" "	if (badge.GetAttributeString('rankurl', '') !== url) {" "	if (true) {"
run no-dismiss "if (!s.probe) { dismissMenus();" "if (!s.probe) {"
run dismiss-every-probe "		s.probe = null;
		s.probed = true;" "		s.probe = null; dismissMenus();
		s.probed = true;"
run key-by-name "const rowKey = row => { const h = rowHero(row);" "const rowKey = row => { const h = '';"
run no-comma-ids "/(\\d)[,.'\\u2019\\u00a0 ](?=\\d{3}(?!\\d))/g" "/x^/g"
run no-url-fallback "			if (frag.indexOf(PARTY_PREFIX) === 0) { partyResult(s, pp, frag); return; }" ""
run no-cache "		if (s.roster && s.roster.sig === pr.sig && acc.id) { s.roster.ids[pr.key] = acc.id; s.roster.via[pr.key] = acc.via; }" ""
run party-every-tick "	if (pp.dead || pp.want === want) return;" "	if (pp.dead) return;"
run wrong-settings-id "	id: 'deadlock_lobby_ranks', title: '#Lr_Tab', prefix: 'Lr', strings: STRINGS," "	id: 'hudpp_settings', title: '#Lr_Tab', prefix: 'Lr', strings: STRINGS,"
run no-pulse "	if (wanted() && ok(s.list)) s.timer = \$.Schedule(TICK_S, tick);
	AddonSettings.pulse();" "	if (wanted() && ok(s.list)) s.timer = \$.Schedule(TICK_S, tick);"
run version-string "say(VERSION + ' loaded (' + AddonSettings.language() + ')');" "say('v0 loaded (' + AddonSettings.language() + ')');"
run steam64-broken "	const id = subDec(t, STEAM64_BASE);" "	const id = t;"
run mismatch-opens "	if (h && v && h !== v) return '';" "	if (false && h && v && h !== v) return '';"
run bridge-in-list "	const host = escapeMenu();" "	const host = ok(s.list) ? s.list : escapeMenu();"
run no-esc-gate "const mayProbe = () => escOpen() && !inHideout();" "const mayProbe = () => true;"
run old-0.2.1-row-and-host-fallback "	const teams = root.FindChildrenWithClassTraverse('Team') || [];" "	const teams = (root.FindChildrenWithClassTraverse('Team') || []).length ? root.FindChildrenWithClassTraverse('Team') : [root];" "		const holder = ok(teams[t]) ? teams[t].FindChildTraverse('TeamEntries') : null;" "		const holder = ok(teams[t]) ? (teams[t].FindChildTraverse('TeamEntries') || teams[t]) : null;" "			if (ok(e) && typ === ROW_TYPE) {" "			if (ok(e)) {" "const hostFor = row => { const main = ok(row) ? row.FindChildTraverse('MainContents') : null; return ok(main) ? main : null; };" "const hostFor = row => { const main = ok(row) ? row.FindChildTraverse('MainContents') : null; return ok(main) ? main : row; };"
