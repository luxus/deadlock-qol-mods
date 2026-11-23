#!/bin/sh
# Negative controls: each mutant of the built script must make the stand-in suite fail.
cd "$(dirname "$0")/.."
B=build/pak/panorama/scripts/zipline_boost.js
run() { name=$1; shift; python3 -c "
import sys; s=open('$B').read(); args=sys.argv[1:]
for a,b in zip(args[::2],args[1::2]):
    assert a in s, 'mutant anchor missing: '+a; s=s.replace(a,b,1)
open('/tmp/zb_mutant.js','w').write(s)" "$@" || { echo "BROKEN $name"; return; }
  if node test/test.js /tmp/zb_mutant.js >/tmp/zb_mutant.out 2>&1; then echo "SURVIVED $name"; else echo "killed   $name ($(grep -c FAIL /tmp/zb_mutant.out) fails)"; fi; }

run default-off "const BOOST_DEFAULT = true;" "const BOOST_DEFAULT = false;"
run idle-every-frame "const TICK_IDLE_S = 1;" "const TICK_IDLE_S = 0.016;"
run short-active "const ACTIVE_MS = 32000;" "const ACTIVE_MS = 5000;"
run short-cooldown "const COOLDOWN_MS = 360000;" "const COOLDOWN_MS = 60000;"
run version-string "say(VERSION + ' loaded (' + AddonSettings.language() + ')');" "say('v0 loaded (' + AddonSettings.language() + ')');"
run runs-when-off "const settingsChanged = () => { if (wanted()) kick(); else stop(); };" "const settingsChanged = () => { kick(); };" "	if (!wanted()) { setOverlay(s, { kind: 'hidden', seconds: -1, host: s.host }); AddonSettings.pulse(); return; }" "	if (!wanted()) { setOverlay(s, { kind: 'hidden', seconds: -1, host: s.host }); AddonSettings.pulse(); s.timer = \$.Schedule(TICK_IDLE_S, tick); return; }"
run ready-is-active "	const inUse = ok(buff) || hasClass(hint, 'in_use');" "	const inUse = ok(buff) || hasClass(hint, 'in_use') || hasClass(hint, 'active');"
run ignore-label "		if (parsed > 0 && parsed <= COOLDOWN_MS / 1000 + 5) s.cooldownEnd = now + parsed * 1000;" "		if (false) s.cooldownEnd = now + parsed * 1000;"
run no-hideout "	if (hidden) { s.wasActive = false;" "	if (false) { s.wasActive = false;"
run hidden-without-hint "	return { kind: 'ready', seconds: -1, host: gp };
};" "	return { kind: ok(hint) ? 'ready' : 'hidden', seconds: -1, host: gp };
};"
run search-whole-hud "const hintsHolder = alive => byId(byId(alive, 'crosshair'), 'button_hints_container');" "const hintsHolder = alive => top();"
run old-hideout-panel "const inHideout = (hud, rootPanel) => hasClass(hud, 'connectedToHideout')" "const inHideout = (hud, rootPanel) => (ok(byId(hud, 'CitadelHudHideout')) && byId(hud, 'CitadelHudHideout').visible !== false) || hasClass(hud, 'connectedToHideout')"
run class-only-hide "			s.root.visible = false;" ""
run no-own-layout "	s.inline = !(loadLayout(root) &&" "	s.inline = !(false &&"
run inline-over-layout "	if (s.inline) {
		kidsOf(root)" "	if (true) {
		kidsOf(root)"
run fallback-no-column "	text: { flowChildren: 'down', " "	text: { "
run fallback-top-left "	root: { horizontalAlign: 'center', verticalAlign: 'bottom', " "	root: { "
run relookup-per-tick "	if (!(key in templates)) {" "	if (true) {"
