#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
ROOT=$PWD
kind=$(python3 tools/formal/from_source.py hudpp)
bug=$ROOT/tools/formal/HudppTabBug.cfg
fix=$ROOT/tools/formal/HudppTab.cfg
spec=$ROOT/tools/formal/HudppTab.tla
out=$(mktemp)
if sh tools/formal/tlc.sh "$spec" "$bug" >"$out" 2>&1; then
	echo "HudppTabBug.cfg kept TabClickRuns. The invariant does not catch the 0e8c7ed bug." >&2
	rm -f "$out"
	exit 1
fi
echo "bug config: a Crosshair click while our tab is up leaves HUD++ showTab unrun"
if [ "$kind" = "FIX" ]; then
	if ! sh tools/formal/tlc.sh "$spec" "$fix" >"$out" 2>&1; then
		echo "hookHudppTabs still activates the other tab first, but TabClickRuns failed." >&2
		echo "The model and the function disagree. Read the TLC trace with /statechart." >&2
		cat "$out" >&2
		rm -f "$out"
		exit 1
	fi
	echo "source config: TabClickRuns holds"
	rm -f "$out"
	exit 0
fi
echo "hookHudppTabs no longer calls activateHudpp(other) before activateHudpp(b) when parked === id." >&2
echo "That is the Crosshair return bug (improved-quickbuy 0e8c7ed). Put that branch back in both copies." >&2
rm -f "$out"
exit 1
