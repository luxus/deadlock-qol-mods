#!/bin/sh
# Build build/deadlock-profile-links.vpk
set -e
cd "$(dirname "$0")/.."
MODLOCK=${MODLOCK:-/workspace/qol-extract/tools/modlock}
sh tools/assemble.sh
MODLOCK_NO_UPDATE_CHECK=1 "$MODLOCK" panorama compile build/pak -o build/deadlock-profile-links.vpk --addon deadlock-profile-links
sha256sum build/deadlock-profile-links.vpk
ls -l build/deadlock-profile-links.vpk
