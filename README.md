# deadlock-qol-mods

Deadlock Panorama mods by luxus, and the source that builds them.

| Directory | Version | Release tag |
| --- | --- | --- |
| `paks/lobby-ranks` | 0.2.1 | `lobby-ranks-v0.2.1` |
| `paks/zipline-boost` | 0.1.0 | `zipline-boost-v0.1.0` |

```sh
curl -fsSL -o tools/modlock https://github.com/paralin/modlock/releases/download/v0.1.77/modlock-linux-amd64
chmod +x tools/modlock
sh tools/ci.sh
```

`paks/SHA256SUMS` is the sha of each pak from modlock v0.1.77. CI rebuilds every pak and fails when a sha differs. When two paks contain the same path, the lower pak number wins, so these paks do not share paths.

Settings come from `lib/addon-settings`. `1.2.3` (build 9) is embedded in lobby-ranks. `1.2.4` (build 10) is embedded in zipline-boost. The highest build hosts.

Each release carries the paks named in `paks/SHA256SUMS` with a `.sha256` file per pak. Install with [shiv](https://github.com/luxus/shiv) or Deadlock Mod Manager from the [luxus Deadlock Mods](https://luxus.github.io/deadlock-mods/) source.

MIT (LICENSE). Credits and third-party notices are in NOTICE.
