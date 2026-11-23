// Stand-in tests for Deadlock Zipline Boost: node test/test.js build/pak/panorama/scripts/zipline_boost.js
'use strict';
const fs = require('fs');
const S = require('./panorama.js');
const { H, C, advance, storage, shown, setHint, setIcon, setHideout } = S;
const SRC = fs.readFileSync(process.argv[2] || __dirname + '/../build/pak/panorama/scripts/zipline_boost.js', 'utf8');
let fails = 0, passes = 0;
const assert = (c, m) => { if (c) passes++; else { fails++; console.log('FAIL', m); } if (process.env.V) console.log(c ? 'ok  ' : 'FAIL', m); };

const byId = (id, root) => { const w = p => { for (const k of p.kids) { if (k.id === id) return k; const r = w(k); if (r) return r; } return null; }; return w(root || H.root); };
const click = id => { const p = byId(id); if (!p) throw new Error('missing ' + id); if (p.events.onactivate) p.events.onactivate(); };
const start = (opts = {}) => {
	for (const k in storage) delete storage[k];
	if (opts.store) storage.deadlock_zipline_boost_settings = JSON.stringify(opts.store);
	S.buildWorld(opts);
	S.load(SRC);
	advance(opts.wait === undefined ? 0.05 : opts.wait);
};
const T = () => $.ZbTest;
const root = () => byId('ZbRoot', H.gameplay);
const state = () => { const p = byId('ZbState', H.gameplay); return p ? p.text : ''; };
// Hidden means the panel itself is not visible. A ZbHidden class alone proves nothing: on lea 22.11.
// 09:53:46 the overlay had class=ZbHidden and still visible=true because the CSS never reached it.
const hiddenOv = () => !root() || root().visible === false;
const shownOv = () => !!root() && root().visible !== false && shown(root());

start({ hint: { active: true } });
assert(S.errors.length === 0, 'no errors at start: ' + S.errors.join(' | '));
assert(/const BOOST_DEFAULT = true;/.test(SRC), 'timer on by default');
assert(S.info.some(m => /Deadlock Zipline Boost: 0\.1\.0 loaded \(/.test(m)), 'console line 0.1.0 loaded: ' + S.info.join(' | '));
assert(T().TICK_IDLE_S === 1, 'idle tick is 1 s');
assert(T().TICK_ACTIVE_S === 0.2, 'countdown tick is 0.2 s');
assert(T().ACTIVE_MS === 32000 && T().COOLDOWN_MS === 360000, 'fallback windows are 32 s / 360 s');
assert(!/0\.016/.test(SRC), 'no 0.016 s / ~60 Hz interval in the built script');

assert(T().parseSeconds('180') === 180, 'plain seconds');
assert(T().parseSeconds('3:05') === 185, 'm:ss');
assert(T().parseSeconds('12s') === 12, 'Ns suffix');
assert(T().parseSeconds('<span class="Countdown">9</span>') === 9, 'Countdown html');
assert(T().parseSeconds('{s:cooldown_sec}') === -1, 'unresolved dialog var rejected');
assert(T().parseSeconds('#Citadel_ZiplineBoost_Cooldown') === -1, 'loc token rejected');
assert(T().formatClock(180) === '3:00', 'format 180 as 3:00');
assert(T().formatClock(59) === '59s', 'format under a minute as Ns: ' + T().formatClock(59));

assert(shownOv(), 'ready: overlay shown');
assert(state() === 'Ready', 'ready: label is Ready, not Active: ' + state());
assert(root().cls.has('ZbReady') && !root().cls.has('ZbActive'), 'ready: ZbReady class only');

// The overlay brings its own layout and stylesheet (HUD++'s hudtext_keep pattern), so placement and
// the title-over-state column do not depend on whichever layout file loaded the script.
start({ hint: { active: true } });
{
	const r = root(), text = byId('ZbText', r), title = byId('ZbTitle', r), st = byId('ZbState', r), icon = byId('ZbIcon', r);
	assert(S.lay.loads.some(l => l.p === r && l.url === 'file://{resources}/layout/zipline_boost_overlay.xml') && r.layoutFile === 'zipline_boost_overlay.xml', 'overlay loads its own layout file');
	assert(r.cls.has('ZbOverlay'), 'overlay root carries the class its stylesheet targets');
	assert(r.parent === H.gameplay, 'overlay parent is gameplay_hud');
	assert(icon && icon.parent === r && text && text.parent === r && title && title.parent === text && st && st.parent === text, 'icon + text column, title above state');
	assert(!Object.keys(r.applied).some(k => /align|margin|flow/i.test(k)), 'layout path: placement comes from the stylesheet: ' + JSON.stringify(r.applied));
	assert(S.info.some(m => /ZB-diag overlay layout=loaded/.test(m)), 'diag: layout=loaded');
}
start({ hint: { active: true }, layoutFails: true });
{
	const r = root(), text = byId('ZbText', r);
	assert(shownOv() && state() === 'Ready', 'layout load fails: overlay still shown: ' + state());
	assert(r.applied.verticalAlign === 'bottom' && r.applied.horizontalAlign === 'center' && r.applied.flowChildren === 'right', 'fallback: inline bottom placement, row flow: ' + JSON.stringify(r.applied));
	assert(text && text.parent === r && text.applied.flowChildren === 'down' && byId('ZbTitle', text) && byId('ZbState', text), 'fallback: title above state in a down column');
	assert(S.info.some(m => /ZB-diag overlay layout=inline/.test(m)), 'diag: layout=inline');
}

// No per-tick $.Localize: each miss is a console line (lea 22.11. 16:46-16:48: 189 misses, two a second).
{
	start({ hint: { active: true } });
	let asked = 0; const real = $.Localize;
	$.Localize = (t, p) => { if (/^#Zb_/.test(String(t))) asked++; return real(t, p); };
	advance(30);
	$.Localize = real;
	assert(asked === 0 && state() === 'Ready', 'ready for 30 s: no #Zb_ lookups (' + asked + '), text Ready');
}

// visible ready hint is never treated as the active boost
setHint(H.hint, { active: true, in_use: false });
advance(1);
assert(state() === 'Ready', 'hint.active still Ready after a tick');

start({ hint: { in_use: true } });
assert(state() === 'Active 32s', 'in_use: local 32 s clock: ' + state());
assert(root().cls.has('ZbActive'), 'in_use: ZbActive class');
advance(1);
assert(state() === 'Active 31s', 'in_use: clock follows stand-in time: ' + state());

start({ buff: true });
assert(state() === 'Active 32s', 'StatusEffects buff is Active without in_use: ' + state());

start({ hint: { cooling_down: true, label: '180' } });
assert(state() === 'Cooldown 3:00', 'cooldown prefers context_label 180: ' + state());
assert(root().cls.has('ZbCooldown'), 'cooldown class');

start({ hint: { on_cooldown: true, label: '59s' } });
assert(state() === 'Cooldown 59s', 'cooldown Ns from label: ' + state());

start({ hint: {}, icon: { cooling_down: true, cooldown: '241' } });
assert(state() === 'Ready', 'the boost icon is not a source (reference reads the hint + buff only): ' + state());

// hint outside button_hints_container is ignored (reference scope: alive > crosshair > button_hints_container)
start({ noHint: true });
{ const stray = S.mk('Panel', H.gameplay, 'citadel_ability_zipline_boost_', 'citadel_ability_zipline_boost'); stray.SetHasClass('on_cooldown', true); }
advance(1);
assert(state() === 'Ready', 'stray hint outside the hints container ignored: ' + state());
start({ hintId: 'citadel_ability_zipline_boost_', hint: { on_cooldown: true, label: '90' } });
assert(state() === 'Cooldown 1:30', 'hint id with trailing _ found: ' + state());

// local 360 s fallback when cooling down with no native number
start({ hint: { cooling_down: true } });
assert(state() === 'Cooldown 6:00', 'cooldown fallback 360 s: ' + state());
advance(1);
assert(state() === 'Cooldown 5:59', 'cooldown fallback follows the clock: ' + state());

start({ noHint: true });
assert(shownOv() && state() === 'Ready', 'no hint yet: Ready shown (always-visible, like the reference): ' + state());

start({ hint: { active: true }, hideout: true });
assert(hiddenOv(), 'hideout: overlay hidden');
setHideout(false); advance(1);
assert(shownOv() && state() === 'Ready', 'leaving hideout shows Ready');
// lea console 22.11.: 09:53:34 overlay created with hideout=false and no hint, 09:53:46 hint found and
// hideout=true. The overlay that already exists must really go away, not just gain a class.
start({ noHint: true });
assert(shownOv(), 'launch replay: overlay created before the hideout class arrives');
setHideout(true); advance(1);
assert(hiddenOv(), 'launch replay: overlay hidden once connectedToHideout is set');
start({ hint: { active: true }, hideout: 'InHideout' });
assert(hiddenOv(), 'InHideout class: overlay hidden');
start({ hint: { active: true }, oldHideoutPanel: true });
assert(shownOv(), 'a visible #CitadelHudHideout panel alone is not the hideout signal');

// settings
start({ hint: { active: true } });
click('AddonSettingsButton'); advance(0.2);
assert(!!byId('ZbBlock') && byId('ZbAuthor') && byId('ZbAuthor')._text === 'by luxus', 'ADDONS lists Zipline Boost with by luxus');
assert(!!byId('ZbMaster'), 'Zipline Boost has the master switch on its header');
click('ZbMaster'); advance(1.1);
assert(hiddenOv(), 'toggle off: overlay hidden');
click('AddonSettingsButton'); advance(0.1);
S.resetCounts(); advance(5);
assert(C.sched <= 2, 'toggle off: no countdown timer (' + C.sched + ')');

start({ store: { on: false }, wait: 0.2, hint: { active: true } });
assert(hiddenOv(), 'stored off: overlay hidden');

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
