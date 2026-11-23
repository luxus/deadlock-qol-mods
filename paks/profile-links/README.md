# Deadlock Profile Links

2.0.0. Statlocker and DeadChaps links, plus a rank image, on the profile page, the profile card, and the post-game scoreboard.

Clean-room, MIT (LICENSE). Behaviour and measurements are `docs/cleanroom-spec/profile-links.md`.

## What it does

The VPK patches four Valve layouts from Deadlock ClientVersion 6864. The profile page and the profile card load `profile_links.js`. The scoreboard loads `profile_links_scoreboard.js`. `hud_match_start.xml` only loads the ADDONS registrar.

The profile page shows the site logos 24 px tall, 6 px apart, about two seconds after the account id settles. The card keeps the account-id row visible. Hover cards show the rank and not the text buttons. The scoreboard adds two 34 px round buttons after Copy Build and unpacks Valve's commend columns.

Logos are the sites' own images, scaled to 64×64 with Lanczos and compiled by `tools/vtex.py`.

A CompLock / ADDONS block **Profile Links** has a master toggle and a Statlocker and DeadChaps toggle, all on by default. The saved key is `deadlock_profile_links`.

## Build

```sh
sh tools/assemble.sh
node test/test.js
node test/files.js
sh tools/build.sh
```

`modlock` defaults to `/workspace/qol-extract/tools/modlock`. Override with `MODLOCK=…`. CI uses `tools/modlock` v0.1.77.
