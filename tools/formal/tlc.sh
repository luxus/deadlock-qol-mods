#!/bin/sh
set -eu
JAR=${TLA2TOOLS:-/tmp/tla2tools.jar}
if [ ! -f "$JAR" ]; then
	echo "tla2tools.jar is missing at $JAR." >&2
	echo "Install TLC 1.7.4: curl -fsSL -o /tmp/tla2tools.jar https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar" >&2
	exit 1
fi
if ! command -v java >/dev/null 2>&1; then
	echo "java is missing. Install Temurin 21. TLC 1.7.4 runs on it." >&2
	exit 1
fi
spec=$1
cfg=$2
meta=$(mktemp -d)
set +e
java -XX:+UseParallelGC -cp "$JAR" tlc2.TLC -workers 1 -metadir "$meta" -config "$cfg" "$spec"
status=$?
set -e
rm -rf "$meta"
exit "$status"
