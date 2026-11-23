#!/bin/sh
# Assemble build/pak. Tests run this without modlock.
set -e
cd "$(dirname "$0")/.."
rm -rf build/pak
mkdir -p \
	build/pak/panorama/scripts \
	build/pak/panorama/styles/post_game \
	build/pak/panorama/layout/post_game
wrap() {
	out=$1
	shift
	{
		echo '// Deadlock Commend 2.0.0 - built from src/ by tools/build.sh. Written from scratch.'
		echo '(() => {'
		echo "'use strict';"
		cat "$@"
		echo '})();'
	} > "$out"
	node --check "$out"
}
{
	echo '// Deadlock Commend 2.0.0 - built from src/ by tools/build.sh. Written from scratch.'
	echo '(() => {'
	echo "'use strict';"
	sh ../../lib/addon-settings/vendor.sh print 1.2.3
	cat src/strings.js src/schema.js src/bag.js src/settings.js
	echo '})();'
} > build/pak/panorama/scripts/deadlock_commend_settings.js
node --check build/pak/panorama/scripts/deadlock_commend_settings.js
{
	echo '// Deadlock Commend 2.0.0 - built from src/ by tools/build.sh. Written from scratch.'
	echo '(() => {'
	echo "'use strict';"
	sh ../../lib/addon-settings/vendor.sh print 1.2.3
	cat src/strings.js src/schema.js src/bag.js src/register.js
	echo '})();'
} > build/pak/panorama/scripts/deadlock_commend_register.js
node --check build/pak/panorama/scripts/deadlock_commend_register.js
wrap build/pak/panorama/scripts/deadlock_commend.js src/bag.js src/main.js
cp src/deadlock_commend.css build/pak/panorama/styles/post_game/deadlock_commend.css
node tools/loc.js src/strings.js STRINGS build/pak deadlock_commend >/dev/null
python3 tools/layout.py page vanilla/post_game/citadel_db_page_post_game_new.xml \
	build/pak/panorama/layout/post_game/citadel_db_page_post_game_new.xml
python3 tools/layout.py mvp vanilla/post_game/citadel_db_post_game_progress_mvp.xml \
	build/pak/panorama/layout/post_game/citadel_db_post_game_progress_mvp.xml
python3 tools/layout.py hud vanilla/hud_join_team.xml \
	build/pak/panorama/layout/hud_join_team.xml
