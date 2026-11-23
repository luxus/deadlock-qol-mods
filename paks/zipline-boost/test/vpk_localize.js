// Built-VPK check: once loaded and shown, the script compiled into the VPK asks the game for no more
// '#Zb_' tokens while it ticks (load-time lookups by the vendored Addon Settings register stay as they are).
// Every $.Localize miss is a console line (lea 22.11. 16:40-16:48: 189 '#Zb_Title' / '#Zb_Ready' misses,
// two per idle tick), and this pak's loc file is not loaded by the game ('#Zb_Tab' missed at register).
// Usage: node test/vpk_localize.js build/deadlock-zipline-boost.vpk
'use strict';
const { execFileSync } = require('child_process');
const S = require('./panorama.js');
const vpk = process.argv[2];
if (!vpk) { console.error('usage: vpk_localize.js <vpk>'); process.exit(2); }
const MODLOCK = process.env.MODLOCK || '/workspace/qol-extract/tools/modlock';
const src = execFileSync(MODLOCK, ['panorama', 'decompile', '--archive', vpk, 'panorama/scripts/zipline_boost.vjs_c'],
	{ encoding: 'utf8', env: Object.assign({}, process.env, { MODLOCK_NO_UPDATE_CHECK: '1' }) });
let fails = 0, passes = 0;
const assert = (c, m) => { if (c) passes++; else { fails++; console.log('FAIL', m); } };

const asked = {};
const real = $.Localize;
$.Localize = (s, panel) => { if (/^#Zb_/.test(String(s))) asked[s] = (asked[s] || 0) + 1; return real(s, panel); };
const run = (opts, secs, then) => {
	for (const k in asked) delete asked[k];
	S.buildWorld(opts); try { delete $.ZbLoaded; } catch (e) { /* */ } (0, eval)(src);
	S.advance(1);
	if (then) then();
	S.advance(1);
	const atLoad = Object.assign({}, asked);
	S.advance(secs);
	const state = S.H.gameplay.FindChildTraverse('ZbState');
	const grew = {};
	Object.keys(asked).forEach(k => { const d = asked[k] - (atLoad[k] || 0); if (d) grew[k] = d; });
	return { grew, text: state ? state._text : '' };
};
const once = (name, r) => {
	const many = Object.keys(r.grew).map(k => k + ' +' + r.grew[k]);
	assert(!many.length, name + ': no #Zb_ lookups while ticking: ' + (many.join(', ') || 'ok'));
	assert(S.errors.length === 0, name + ': no script errors: ' + S.errors.join(' | '));
};
const ready = run({ hint: { active: true } }, 60);
once('ready 60 s', ready);
assert(ready.text === 'Ready', 'ready text unchanged: ' + ready.text);
const active = run({ hint: { in_use: true } }, 10);
once('active 10 s', active);
assert(/^Active \d+s$/.test(active.text), 'active text unchanged: ' + active.text);
const cd = run({ hint: { cooling_down: true, label: '180' } }, 70);
once('cooldown 70 s', cd);
assert(/^Cooldown (\d:\d\d|\d+s)$/.test(cd.text), 'cooldown text unchanged: ' + cd.text);
console.log(vpk + ': ' + passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
