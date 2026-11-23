#!/bin/sh
set -eu
root="$(cd "$(dirname "$0")" && pwd)"
cmd=${1:-}
ver=${2:-}
libdir="$root/$ver"
lib="$libdir/addon_settings.js"
if [ "$cmd" != print ] && [ "$cmd" != pak ]; then
	echo "Use: sh lib/addon-settings/vendor.sh print 1.2.3" >&2
	echo "or:  sh lib/addon-settings/vendor.sh print 1.2.4" >&2
	echo "or:  sh lib/addon-settings/vendor.sh pak 1.2.3 <pak-dir>" >&2
	exit 1
fi
if [ ! -f "$lib" ]; then
	echo "No library at lib/addon-settings/$ver/addon_settings.js. Use 1.2.3 or 1.2.4." >&2
	exit 1
fi
build=$(sed -n 's/^const BUILD = \([0-9][0-9]*\);.*/\1/p' "$lib")
[ -n "$build" ] || { echo "no BUILD in $lib" >&2; exit 1; }
banner="// Addon Settings $(cat "$libdir/VERSION") (build $build), vendored unchanged from lib/addon-settings. MIT."
case "$cmd" in
print) echo "$banner"; cat "$lib" ;;
pak)
	dir=${3:?pak dir}
	mkdir -p "$dir/panorama/scripts/addon_settings"
	{ echo "$banner"; cat "$lib"; } > "$dir/panorama/scripts/addon_settings/addon_settings_b$build.js"
	echo "panorama/scripts/addon_settings/addon_settings_b$build.js"
	;;
esac
