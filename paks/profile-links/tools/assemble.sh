#!/bin/sh
# Assemble build/pak. Tests run this without modlock.
set -e
cd "$(dirname "$0")/.."
rm -rf build/pak
mkdir -p \
	build/pak/panorama/scripts \
	build/pak/panorama/styles \
	build/pak/panorama/layout/post_game \
	build/pak/panorama/images/profile_links
VER=$(sed -n "s/^const VERSION = '\\([^']*\\)';/\\1/p" src/page.js | head -n 1)
bundle() {
	out=$1
	inject_ver=$2
	shift 2
	{
		echo "// Deadlock Profile Links $VER - built from src/ by tools/build.sh. Written from scratch."
		echo '(() => {'
		echo "'use strict';"
		if [ "$inject_ver" = 1 ]; then echo "const VERSION = '$VER';"; fi
		cat "$@"
		echo '})();'
	} > "$out"
	node --check "$out"
}
bundle build/pak/panorama/scripts/profile_links.js 0 ../../lib/steam-id.js src/id.js src/common.js src/bag.js src/page.js
bundle build/pak/panorama/scripts/profile_links_scoreboard.js 1 ../../lib/steam-id.js src/id.js src/common.js src/board.js
{
	echo "// Deadlock Profile Links $VER - built from src/ by tools/build.sh. Written from scratch."
	echo '(() => {'
	echo "'use strict';"
	echo "const VERSION = '$VER';"
	sh ../../lib/addon-settings/vendor.sh print 1.2.6
	cat src/strings.js src/schema.js src/apply.js src/settings.js
	echo '})();'
} > build/pak/panorama/scripts/profile_links_settings.js
node --check build/pak/panorama/scripts/profile_links_settings.js
{
	echo "// Deadlock Profile Links $VER - built from src/ by tools/build.sh. Written from scratch."
	echo '(() => {'
	echo "'use strict';"
	echo "const VERSION = '$VER';"
	sh ../../lib/addon-settings/vendor.sh print 1.2.6
	cat src/strings.js src/schema.js src/register.js
	echo '})();'
} > build/pak/panorama/scripts/profile_links_register.js
node --check build/pak/panorama/scripts/profile_links_register.js
cp src/profile_links.css build/pak/panorama/styles/profile_links.css
cp src/scoreboard.css build/pak/panorama/styles/profile_links_scoreboard.css
node ../../tools/loc.js src/strings.js STRINGS build/pak deadlock_profile_links >/dev/null
python3 tools/layout.py page vanilla/citadel_db_page_profile.xml \
	build/pak/panorama/layout/citadel_db_page_profile.xml
python3 tools/layout.py card vanilla/profile_card.xml \
	build/pak/panorama/layout/profile_card.xml
python3 tools/layout.py board vanilla/post_game/citadel_db_post_game_scoreboard_new.xml \
	build/pak/panorama/layout/post_game/citadel_db_post_game_scoreboard_new.xml
python3 tools/layout.py hud vanilla/hud_match_start.xml \
	build/pak/panorama/layout/hud_match_start.xml
python3 tools/vtex.py src/images/statlocker.png build/pak/panorama/images/profile_links/statlocker_png.vtex_c
python3 tools/vtex.py src/images/deadchaps.png build/pak/panorama/images/profile_links/deadchaps_png.vtex_c
