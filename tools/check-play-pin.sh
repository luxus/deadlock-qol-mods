#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
ROOT=$PWD
kind=$(python3 tools/formal/from_source.py pin)
spec=$ROOT/tools/formal/PlayPin.tla
bug=$ROOT/tools/formal/PlayPin.cfg
fixed=$ROOT/tools/formal/PlayPinFix.cfg
out=$(mktemp)
if ! sh tools/formal/tlc.sh "$spec" "$fixed" >"$out" 2>&1; then
	echo "PlayPinFix.cfg broke PlayGap. The property is not the e17b680 menu look." >&2
	cat "$out" >&2
	rm -f "$out"
	exit 1
fi
if sh tools/formal/tlc.sh "$spec" "$bug" >"$out" 2>&1; then
	echo "PlayPin.cfg kept PlayGap. The model no longer replays the 312 px pin." >&2
	rm -f "$out"
	exit 1
fi
if [ "$kind" = "LIFTS" ]; then
	echo "source config: PlayGap holds (step() calls syncPlay)"
	rm -f "$out"
	exit 0
fi
echo "step() no longer calls syncPlay(). CanChangeHero during the menu look leaves PLAY at 312." >&2
echo "Restore syncPlay() in lib/addon-settings/1.2.6/addon_settings.js (improved-quickbuy e17b680)." >&2
rm -f "$out"
exit 1
