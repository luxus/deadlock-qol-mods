#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
fail=0
check_mod() {
	dir=$1
	src=$2
	readme=$dir/README.md
	[ -f "$readme" ] || return 0
	ver=$(sed -n "s/^const VERSION = '\\([^']*\\)';/\\1/p" "$src" | head -n 1)
	[ -n "$ver" ] || return 0
	if ! grep -q "$ver" "$readme"; then
		echo "$readme does not contain VERSION $ver from $src." >&2
		echo "Lobby-ranks PR #3 left paks/lobby-ranks/README.md saying 0.1.0 while src/main.js says 0.2.1. Write the script version." >&2
		fail=1
	fi
	if grep -q "Not released" "$readme"; then
		echo "$readme says Not released. Delete that sentence. The tree is the pak that runs on lea." >&2
		fail=1
	fi
}
check_mod paks/lobby-ranks paks/lobby-ranks/src/main.js
check_mod paks/zipline-boost paks/zipline-boost/src/main.js
check_mod paks/commend paks/commend/src/main.js
check_mod paks/profile-links paks/profile-links/src/page.js
if grep -q -e "tools/build.py" -e "make_vtex.py" README.md; then
	echo "README.md still names tools/build.py or make_vtex.py. Those files are gone. Document sh tools/ci.sh." >&2
	fail=1
fi
exit "$fail"
