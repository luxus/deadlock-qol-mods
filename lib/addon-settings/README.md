# Addon Settings

`1.2.3` (build 9) is the copy embedded in lobby-ranks. `1.2.4` (build 10) is the copy embedded in zipline-boost. The highest `BUILD` among the installed paks hosts.

```sh
sh lib/addon-settings/vendor.sh print 1.2.3
sh lib/addon-settings/vendor.sh print 1.2.4
```

`tools/check-one-addon-settings.sh` fails if another `addon_settings.js` is committed.
