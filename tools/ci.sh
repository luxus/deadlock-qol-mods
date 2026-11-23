#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
ROOT=$PWD
MODLOCK=${MODLOCK:-$ROOT/tools/modlock}

if [ ! -x "$MODLOCK" ]; then
	echo "modlock is missing at $MODLOCK." >&2
	echo "Install v0.1.77: curl -fsSL -o tools/modlock https://github.com/paralin/modlock/releases/download/v0.1.77/modlock-linux-amd64 && chmod +x tools/modlock" >&2
	exit 1
fi
ver=$("$MODLOCK" --version 2>/dev/null | awk '{print $NF}')
if [ "$ver" != "v0.1.77" ]; then
	echo "modlock is $ver. Install v0.1.77 from https://github.com/paralin/modlock/releases/download/v0.1.77/modlock-linux-amd64" >&2
	echo "A different modlock changes the pak sha. paks/SHA256SUMS was recorded with v0.1.77." >&2
	exit 1
fi
export MODLOCK
sh tools/check-one-addon-settings.sh
echo "== hudpp tabs =="
sh tools/check-hudpp-tabs.sh
echo "== play pin =="
sh tools/check-play-pin.sh

for dir in paks/*/; do
	name=${dir#paks/}
	name=${name%/}
	if [ ! -f "$dir/tools/build.sh" ]; then
		echo "$name has no tools/build.sh." >&2
		echo "Add paks/$name/tools/build.sh. sh tools/ci.sh is the build." >&2
		exit 1
	fi
	echo "== build $name =="
	(cd "$dir" && sh tools/build.sh)
	if [ -f "$dir/test/test.js" ]; then
		echo "== test $name =="
		(cd "$dir" && node test/test.js && node test/files.js && python3 test/native_ids.py . && sh test/mutants.sh)
	else
		echo "== test $name: no test/test.js =="
	fi
done

echo "== readme =="
sh tools/check-readme.sh
echo "== overlap =="
python3 tools/check-overlap.py --self-test
python3 tools/check-overlap.py
echo "== secrets =="
python3 tools/check-secrets.py --self-test
python3 tools/check-secrets.py

echo "== pak sha =="
if ! sha256sum -c paks/SHA256SUMS; then
	echo "Built pak sha does not match paks/SHA256SUMS." >&2
	echo "The source and the recorded pak diverged. Lobby-ranks PR #3 rebuilt with addon-settings 1.2.4 build 10 to e2e181e48f229ea1f36a5407a7c65b241c86e83147b7049cd1c706868871e451 instead of d7a25e02d727d67e0768f7a34fa6c21a3506700a24e97bdf1a07d38e4c0de3b7." >&2
	echo "Put the source back, or, when the pak change is intentional, rebuild with modlock v0.1.77 and replace the line in paks/SHA256SUMS. Record the old and new sha in the PR." >&2
	exit 1
fi
echo OK
