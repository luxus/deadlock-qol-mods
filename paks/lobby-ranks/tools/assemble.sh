#!/bin/sh
# Assemble build/pak (main) and build/pak-hook (optional entry probes). No modlock needed for tests.
set -e
cd "$(dirname "$0")/.."
rm -rf build/pak build/pak-hook
mkdir -p \
	build/pak/panorama/scripts \
	build/pak/panorama/styles \
	build/pak/panorama/layout \
	build/pak-hook/panorama/styles \
	build/pak-hook/panorama/layout
VER=$(sed -n "s/^const VERSION = '\\([^']*\\)';/\\1/p" src/main.js | head -n 1)
{
	echo "// Deadlock Lobby Ranks $VER - built from src/ by tools/build.sh. Written from scratch."
	echo '(() => {'
	echo "'use strict';"
	sh ../../lib/addon-settings/vendor.sh print 1.2.6
	cat ../../lib/steam-id.js src/strings.js src/main.js
	echo '})();'
} > build/pak/panorama/scripts/lobby_ranks.js
cp src/lobby_ranks.css build/pak/panorama/styles/lobby_ranks.css
cp src/lobby_ranks.css build/pak-hook/panorama/styles/lobby_ranks.css
node ../../tools/loc.js src/strings.js STRINGS build/pak deadlock_lobby_ranks >/dev/null
python3 tools/layout.py list vanilla/players_list.xml \
	build/pak/panorama/layout/players_list.xml
python3 tools/layout.py entry vanilla/players_list_entry.xml \
	build/pak-hook/panorama/layout/players_list_entry.xml
node --check build/pak/panorama/scripts/lobby_ranks.js
