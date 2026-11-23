# Rules

| Rule | What enforces it |
| --- | --- |
| A rebuilt pak matches `paks/SHA256SUMS` | `tools/ci.sh` |
| `addon_settings.js` exists only under `lib/addon-settings/1.2.5` | `tools/check-one-addon-settings.sh` |
| Two mods do not contain the same path. Two paks of one mod may, so each pak still works alone | `tools/check-overlap.py` |
| A mod README states the script `VERSION` and does not say `Not released` | `tools/check-readme.sh` |
| A pak source does not contain a credential | `tools/check-secrets.py` |
| An overridden Valve layout keeps native panel ids | `paks/lobby-ranks/test/native_ids.py`, `paks/zipline-boost/test/native_ids.py` |
| Lobby ranks does not add a child of `#Teams` | mutant `old-0.2.1-row-and-host-fallback` |
| Zipline Boost hides with `visible = false`. A `ZbHidden` class does not count | mutant `class-only-hide` |
| The zipline overlay loads `zipline_boost_overlay.xml`, because `hud.xml` does not supply its stylesheet | mutant `no-own-layout` |
| A click on the parked HUD++ tab, while our tab is up, runs HUD++ `showTab` | `tools/check-hudpp-tabs.sh` |
| `CanChangeHero` during the menu look leaves PLAY at 312. The check prints FINDING | `tools/check-play-pin.sh` |
