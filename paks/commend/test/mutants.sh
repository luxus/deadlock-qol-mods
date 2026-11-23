#!/bin/sh
# Negative controls. A mutant that still passes is a hole in test/test.js.
cd "$(dirname "$0")/.."
B=build/pak/panorama/scripts/deadlock_commend.js
fail=0
run() {
	name=$1
	shift
	python3 -c "
import sys
s=open('$B').read()
args=sys.argv[1:]
for a,b in zip(args[::2], args[1::2]):
    assert a in s, 'mutant anchor missing: '+a
    s=s.replace(a,b,1)
open('/tmp/dc_mutant.js','w').write(s)
" "$@" || { echo "BROKEN $name"; fail=1; return; }
	if node test/test.js /tmp/dc_mutant.js >/tmp/dc_mutant.out 2>&1; then
		echo "SURVIVED $name"
		fail=1
	else
		echo "killed   $name"
	fi
}
run tick-every-frame "const TICK_S = 0.25;" "const TICK_S = 0.016;"
run all-does-not-stick "const show = can && !bag.all && screen === row.screen;" "const show = can && screen === row.screen;"
run second-click-repeats "if (marked(target)) return true;" "if (false && marked(target)) return true;"
run team-clicks-enemies "if (kind === 'team' && (!mine || !team || team !== mine)) continue;" "if (kind === 'team' && false) continue;"
if [ "$fail" != 0 ]; then
	echo "a mutant survived"
	exit 1
fi
