#!/bin/sh
# Negative controls. A mutant that still passes is a hole in test/test.js.
cd "$(dirname "$0")/.."
P=build/pak/panorama/scripts/profile_links.js
B=build/pak/panorama/scripts/profile_links_scoreboard.js
fail=0
run() {
	name=$1
	file=$2
	shift 2
	python3 -c "
import sys
s=open('$file').read()
args=sys.argv[1:]
for a,b in zip(args[::2], args[1::2]):
    assert a in s, 'mutant anchor missing: '+a
    s=s.replace(a,b,1)
open('/tmp/pl_mutant.js','w').write(s)
" "$@" || { echo "BROKEN $name"; fail=1; return; }
	page=/tmp/pl_mutant.js
	board='$B'
	if [ "$file" = "$B" ]; then page='$P'; board=/tmp/pl_mutant.js; fi
	if node test/test.js "$page" "$board" >/tmp/pl_mutant.out 2>&1; then
		echo "SURVIVED $name"
		fail=1
	else
		echo "killed   $name"
	fi
}
run page-no-wait "$P" "const PAGE_LOCK_MS = 2000;" "const PAGE_LOCK_MS = 0;"
run card-buttons-on-hover "$P" "const show = on && inMenu();" "const show = on;"
run scoreboard-forever "$B" "const TRIES = 9;" "const TRIES = 100;"
if [ "$fail" != 0 ]; then
	echo "a mutant survived"
	exit 1
fi
