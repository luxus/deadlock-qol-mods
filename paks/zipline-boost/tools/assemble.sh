#!/bin/sh
# Assemble build/pak. No modlock needed for tests.
set -e
cd "$(dirname "$0")/.."
rm -rf build/pak
mkdir -p \
	build/pak/panorama/scripts \
	build/pak/panorama/styles \
	build/pak/panorama/layout
{
	echo '// Deadlock Zipline Boost 0.1.0 - built from src/ by tools/build.sh. Written from scratch.'
	echo '(() => {'
	echo "'use strict';"
	echo "try { \$.Msg('ZB-diag script-entry'); } catch (e) {}"
	echo "if (\$.ZbLoaded) { try { \$.Msg('ZB-diag script-entry already-loaded'); } catch (e) {} return; }"
	echo "\$.ZbLoaded = true;"
	sh ../../lib/addon-settings/vendor.sh print 1.2.4
	cat src/strings.js src/main.js
	echo '})();'
} > build/pak/panorama/scripts/zipline_boost.js
cp src/zipline_boost.css build/pak/panorama/styles/zipline_boost.css
cp src/zipline_boost_overlay.xml build/pak/panorama/layout/zipline_boost_overlay.xml
node tools/loc.js src/strings.js STRINGS build/pak deadlock_zipline_boost >/dev/null
python3 tools/layout.py vanilla/hud_movement_speed.xml \
	build/pak/panorama/layout/hud_movement_speed.xml
node --check build/pak/panorama/scripts/zipline_boost.js
