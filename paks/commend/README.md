# Deadlock Commend

2.0.0. Four buttons on the post-game screens: Team, Enemy, All, and Return.

Clean-room, MIT (LICENSE). Behaviour and measurements are `docs/cleanroom-spec/commend.md`.

## What it does

The VPK patches three Valve layouts from Deadlock ClientVersion 6864. `citadel_db_page_post_game_new.xml` and `citadel_db_post_game_progress_mvp.xml` gain the button row. `hud_join_team.xml` only loads the ADDONS registrar.

The row sits at the bottom left, 200 px in and 16 px up, and is 28 px tall. The button texts are English on every game language. All hides the rows until the next match id.

A CompLock / ADDONS block **Commend** has one toggle, on by default. The saved key is `deadlock_commend`.

## Build

```sh
sh tools/assemble.sh
node test/test.js
node test/files.js
sh tools/build.sh
```

`modlock` defaults to `/workspace/qol-extract/tools/modlock`. Override with `MODLOCK=…`. CI uses `tools/modlock` v0.1.77.
