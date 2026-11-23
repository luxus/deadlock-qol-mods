#!/bin/sh
# Build build/deadlock-zipline-boost.vpk
set -e
cd "$(dirname "$0")/.."
MODLOCK=${MODLOCK:-/workspace/qol-extract/tools/modlock}
sh tools/assemble.sh
MODLOCK_NO_UPDATE_CHECK=1 "$MODLOCK" panorama compile build/pak -o build/deadlock-zipline-boost.vpk --addon deadlock-zipline-boost
node test/vpk_localize.js build/deadlock-zipline-boost.vpk
sha256sum build/deadlock-zipline-boost.vpk
ls -l build/deadlock-zipline-boost.vpk
