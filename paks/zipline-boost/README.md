# Deadlock Zipline Boost

0.1.0. An always-visible Ready / Active / Cooldown timer for the zipline speed boost. pak08 on lea was built from this tree.

The timer logic is our own (MIT). The overlay's look and placement are adapted from the Zip Boost overlay in QOLLOCK (`ql_feat_zip_boost.css`, Apache-2.0, see NOTICE): icon plus a column with title above state, bottom centre-left above the HUD. dacooderr's QoL Lite does not list this feature; the reference is QOL Lock.

## What it reads

The game already has a native `CitadelZiplineBoostIcon` with `{s:cooldown_sec}`, and a button hint with classes `active`, `in_use`, `on_cooldown` / `cooling_down` plus `#context_label`. The boost ability id is `citadel_ability_zipline_boost`; the buff id is `status_citadel_ability_zipline_boost`.

- **Active:** the hint has `in_use`, or the buff is present under `#StatusEffects`. Remaining time prefers a parsed native number when it looks like the 32 s window; otherwise a local 32 s clock starts on the rising edge (wiki / current values: 32 s duration, 360 s cooldown).
- **Cooldown:** hint `on_cooldown` or `cooling_down`, or the icon `cooling_down`. Remaining time prefers `#context_label` / `.cooldown_timer` / `{s:cooldown_sec}`; otherwise the local 360 s end time.
- **Ready:** neither Active nor Cooldown. Shown even before the hint panel spawns, as the reference does. A visible ready hint (class `active`) is never treated as Active.

The script is included from Valve's `hud_movement_speed.xml` (lea `pak01_dir.vpk`, 18 November 2026). The overlay hangs under `#gameplay_hud`, which belongs to `hud.xml`, so it loads its own layout `zipline_boost_overlay.xml` with `BLoadLayout`; that layout's `<styles>` carry `zipline_boost.css` to the overlay. If the load fails, the same panels are built with inline styles, and the console says `ZB-diag overlay layout=loaded` or `layout=inline`. The VPK does **not** override `hud.xml`, so it sits next to HUD++. Hidden (panel `visible = false`, not only a CSS class) while the HUD has `connectedToHideout` or `InHideout`.

A CompLock / ADDONS tab **Zipline Boost** has one toggle, on by default. Settings are `lib/addon-settings/1.2.4`.

## Build

```sh
sh tools/assemble.sh
node test/test.js
node test/files.js
sh test/mutants.sh
sh tools/build.sh   # also runs test/vpk_localize.js on the built VPK
```
