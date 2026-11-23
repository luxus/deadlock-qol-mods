#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
found=0
for p in $(find . -path './.git' -prune -o -path '*/build/*' -prune -o -name addon_settings.js -print); do
	case "$p" in
	./lib/addon-settings/1.2.5/addon_settings.js) ;;
	*)
		echo "Delete $p." >&2
		found=1
		;;
	esac
done
if [ "$found" = 1 ]; then
	echo "addon_settings.js lives only in lib/addon-settings/1.2.5." >&2
	echo "Assemble with: sh lib/addon-settings/vendor.sh print 1.2.5" >&2
	echo "A per-mod copy is how lobby-ranks PR #3 rebuilt pak10 to e2e181e48f229ea1f36a5407a7c65b241c86e83147b7049cd1c706868871e451 instead of d7a25e02d727d67e0768f7a34fa6c21a3506700a24e97bdf1a07d38e4c0de3b7, and how zipline-boost (52aa3d9) shipped BUILD 10 beside three BUILD 9 copies." >&2
	exit 1
fi
