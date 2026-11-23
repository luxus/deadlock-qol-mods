#!/bin/sh
# Build build/deadlock-lobby-ranks.vpk and the optional entry-hook VPK.
set -e
cd "$(dirname "$0")/.."
MODLOCK=${MODLOCK:-/workspace/qol-extract/tools/modlock}
sh tools/assemble.sh
MODLOCK_NO_UPDATE_CHECK=1 "$MODLOCK" panorama compile build/pak -o build/deadlock-lobby-ranks.vpk --addon deadlock-lobby-ranks
MODLOCK_NO_UPDATE_CHECK=1 "$MODLOCK" panorama compile build/pak-hook -o build/deadlock-lobby-ranks-entry-hook.vpk --addon deadlock-lobby-ranks-entry-hook
sha256sum build/deadlock-lobby-ranks.vpk build/deadlock-lobby-ranks-entry-hook.vpk
ls -l build/deadlock-lobby-ranks.vpk build/deadlock-lobby-ranks-entry-hook.vpk
