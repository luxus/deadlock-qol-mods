---
name: verify-addon-settings
description: "Check the Addon Settings HUD++ tab hook and the PLAY pin against their TLA+ models. Use when editing lib/addon-settings, hookHudppTabs, liftPins, step, or watch."
---

# Verify Addon Settings

Two models cover `lib/addon-settings/1.2.3/addon_settings.js` and `lib/addon-settings/1.2.4/addon_settings.js`. TLC 1.7.4 checks event order. Nothing here runs on the Panorama source itself. A pass covers the model, not the game.

Read every TLC result with `/statechart`. After a change that did not recheck these models, use `/maintain-formal-verification-skill`.

## When a change touches this

A change touches the tab model if it edits `hookHudppTabs` or the hide path in `showTab`. A change touches the pin model if it edits `step`, `watch`, `liftPins`, `pinBase`, or `openWindow`.

## Run

Java is Temurin 21. The jar is TLC 1.7.4 from `https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar`. `tools/formal/tlc.sh` downloads it to `/tmp/tla2tools.jar` when `TLA2TOOLS` is unset.

```sh
sh tools/check-hudpp-tabs.sh
sh tools/check-play-pin.sh
```

`tools/ci.sh` runs both.

## Tab click

Property. A click on a HUD++ tab while our tab is showing makes HUD++ `showTab` run. It does not return at the first line.

Harm. The click back to the tab that was already current does nothing, and our tab stays up. improved-quickbuy `0e8c7ed`.

`hookHudppTabs` is the fixed code. `parked === id` calls `activateHudpp(other)` before `activateHudpp(b)`. `tools/formal/from_source.py` reads that order from both copies. `HudppTabBug.cfg` sets `Fix` false and must violate `TabClickRuns`. The source config must hold.

If you delete that branch and the check exits 1 naming `0e8c7ed`, the check saw the bug. If both copies still have that order and `TabClickRuns` fails, the model is wrong. Do not edit the invariant until you have replayed the trace against `hookHudppTabs`.

Bounds. Tabs are `hud`, `mm`, and `xh`. One hosted tab. `Fix` is a boolean. The model leaves out dress, the menu look, and the no-HUD++ window.

## PLAY pin

Property. After `.CanChangeHero` appears, the next menu look sets PLAY's margin to 382.

Harm. On the first Esc open, PLAY sits on SWAP HERO. improved-quickbuy `e17b680`. Lea on 22.11 showed the class absent at 11:36:13 and present at 11:37:16.

This property does not hold in these libraries. `step` returns 0 once `M.built` and does not call `syncPlay`. `liftPins` still runs from `openWindow`, which is an ADDONS click, not that look. `PlayPin.cfg` is that code and must violate `PlayGap`. `PlayPinFix.cfg` is the menu look calling `syncPlay`, and `PlayGap` must hold there. The check prints `FINDING` and exits 0 while the libraries still match `PlayPin.cfg`. Exit 0 does not mean the margin is right. If `step` starts calling `syncPlay`, the check exits 1 because the finding is stale. Point it at `PlayPinFix.cfg` as the source config only after you confirm `step` matches that model. Do not weaken `PlayGap`, and do not edit the libraries just to quiet the line.

Bounds. Margins are 312 and 382. The look either writes the margin or it does not. The model leaves out the no-HUD++ host, where `step` returns 0 before a look would run.

## Coverage

Confirmed at `5f3c6105ee11884c4e6625de092e23f919b5ded3`. Move that commit forward only after you confirm the models still describe the functions at the new commit.

| Check | Functions |
| --- | --- |
| `tools/check-hudpp-tabs.sh` | `hookHudppTabs`, `showTab` |
| `tools/check-play-pin.sh` | `step`, `watch`, `liftPins`, `pinBase`, `openWindow` |
