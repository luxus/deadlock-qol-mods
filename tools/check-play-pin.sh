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
	echo "step() now calls syncPlay. PlayGap holds for that code, and this finding is stale." >&2
	echo "Point tools/check-play-pin.sh at PlayPinFix.cfg as the source config." >&2
	rm -f "$out"
	exit 1
fi
echo "FINDING PlayGap: CanChangeHero arrives, the next menu look leaves PLAY at 312."
echo "step() does not call syncPlay. openWindow still lifts, which is the ADDONS click, not the first Esc open."
echo "improved-quickbuy e17b680. Both libraries. This command exits 0 because the model still finds it."
rm -f "$out"
exit 0
