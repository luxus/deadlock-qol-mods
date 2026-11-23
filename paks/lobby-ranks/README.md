# Deadlock Lobby Ranks

0.2.1. Rank badges on the Escape menu player list. pak10 and pak11 on lea were built from this tree.

Clean-room, MIT (LICENSE).

## What it does

The main VPK patches `players_list.xml` (current game, decompiled from lea `pak01_dir.vpk` after the 18 November 2026 update) so the list loads `lobby_ranks.js`. The script walks `#TeamEntries`, looks up each player's account id, and puts a 30 px `Image` (`LrBadge`) in `#MainContents`. The image URL is:

`https://api.deadlock-api.com/v1/players/{id}/rank/image?format=webp`

Account ids are read, in order, from hidden probe labels (only present if you also load the entry-hook VPK), then from panel attributes, then from `$.Localize` tokens. SteamID3 and Steam64 values are converted. Mismatched hidden/visible probes yield no id.

A CompLock / ADDONS tab **Lobby Ranks** has one toggle, on by default.

## Two VPKs

| File | What it contains |
|---|---|
| `build/deadlock-lobby-ranks.vpk` | List layout, script, CSS, loc. **Install this first.** |
| `build/deadlock-lobby-ranks-entry-hook.vpk` | Optional override of `players_list_entry.xml` with four hidden `{i:…account_id}` probes, plus CSS. No script. |

Vanilla list entries only bind `{s:player_name}`. If the main pack alone shows no badges, also install the hook pack (game closed). The hook is a Valve-layout override, so only use it if the first pack is not enough.

## Build

```sh
sh tools/assemble.sh
node test/test.js
node test/files.js
sh test/mutants.sh
sh tools/build.sh
```

`modlock` defaults to `/workspace/qol-extract/tools/modlock`. Override with `MODLOCK=…`.
