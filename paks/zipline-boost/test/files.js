// Checks the assembled pak.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pak = path.join(root, 'build/pak');
let fails = 0, passes = 0;
const assert = (c, m) => { if (c) { passes++; return; } fails++; console.error('FAIL ' + m); };

const js = fs.readFileSync(path.join(pak, 'panorama/scripts/zipline_boost.js'), 'utf8');
assert(js.includes("const VERSION = '0.1.0';"), 'script version 0.1.0');
assert(js.includes('const ACTIVE_MS = 32000;') && js.includes('const COOLDOWN_MS = 360000;'), '32 s / 360 s fallbacks');
assert(js.includes("const HINT_ID = 'citadel_ability_zipline_boost';"), 'hint id');
assert(js.includes("const BUFF_ID = 'status_citadel_ability_zipline_boost';"), 'buff id');
assert(js.includes('{s:cooldown_sec}'), 'reads native cooldown_sec');
assert(!/HoppCX|Friends Rank|QoL Lite|QOL Lock|QOLLOCK|qollock|ql_zipboost|QOLZipBoost/.test(js), 'script has no qol-lock markers');

const css = fs.readFileSync(path.join(pak, 'panorama/styles/zipline_boost.css'), 'utf8');
assert(css.includes('.ZbOverlay') && css.includes('#ZbState'), 'CSS: ZbOverlay / ZbState');
{
	const rule = sel => { const m = new RegExp(sel.replace(/[.#]/g, '\\$&') + '\\s*\\{([^}]*)\\}').exec(css); return m ? m[1] : ''; };
	const root = rule('.ZbOverlay'), text = rule('#ZbText');
	assert(/vertical-align:\s*bottom/.test(root) && /horizontal-align:\s*center/.test(root) && /margin-bottom:\s*20px/.test(root) && /margin-left:\s*-520px/.test(root), 'CSS: overlay sits bottom centre-left like the reference');
	assert(/flow-children:\s*right/.test(root) && /flow-children:\s*down/.test(text), 'CSS: icon + text row, title above state');
	assert(!/visibility:\s*collapse/.test(root), 'CSS: overlay is not collapsed by default (JS visible decides)');
	assert(!/font-family/.test(css), 'CSS: no font-family override, the game font applies');
}
const ov = fs.readFileSync(path.join(pak, 'panorama/layout/zipline_boost_overlay.xml'), 'utf8');
assert(ov.includes('<include src="s2r://panorama/styles/zipline_boost.vcss_c" />'), 'overlay layout: includes our stylesheet');
assert(['ZbIcon', 'ZbText', 'ZbTitle', 'ZbState'].every(id => ov.includes('id="' + id + '"')) && ov.includes('class="ZbOverlay"'), 'overlay layout: ids and class the CSS targets');
assert((css.match(/#Zb\w+/g) || []).every(id => ov.includes('id="' + id.slice(1) + '"')), 'every CSS id exists in the overlay layout');
assert(js.includes("const LAYOUT_URL = 'file://{resources}/layout/zipline_boost_overlay.xml';"), 'script loads panorama/layout/zipline_boost_overlay.xml');
assert(!css.includes('QOLZipBoost'), 'CSS: no qol-lock ids');

assert(!fs.existsSync(path.join(pak, 'panorama/layout/citadel_hud_zipline_boost_icon.xml')), 'no CitadelZiplineBoostIcon override (it never loaded: no layout diag in lea console 09:27)');
assert(js.includes("try { $.Msg('ZB-diag script-entry');"), 'script-entry is present');
assert(!fs.existsSync(path.join(pak, 'panorama/layout/hud.xml')), 'pak does not override hud.xml');
assert(!fs.existsSync(path.join(pak, 'panorama/layout/citadel_hud_ability_button_hint.xml')),
	'pak does not override the shared button-hint layout');
assert(js.includes("placement: 'addons'") && js.includes("author: 'luxus'"), 'schema placement addons and author luxus');

const ms = fs.readFileSync(path.join(pak, 'panorama/layout/hud_movement_speed.xml'), 'utf8');
assert(ms.includes('s2r://panorama/scripts/zipline_boost.vjs_c'), 'movement speed: script include');
assert(!ms.includes('zipline_boost.vcss'), 'movement speed: no style include (its styles never reach #gameplay_hud)');
assert(ms.includes('CitadelHudMovementSpeed') && ms.includes('{s:movement_speed}'), 'movement speed: Valve panel and tokens kept');
assert(!ms.includes('.vcss"'), 'movement speed: no uncompiled .vcss includes');

const locEn = path.join(pak, 'resource/localization/deadlock_zipline_boost/deadlock_zipline_boost_english.txt');
const locDe = path.join(pak, 'resource/localization/deadlock_zipline_boost/deadlock_zipline_boost_german.txt');
assert(fs.existsSync(locEn) && fs.existsSync(locDe), 'english and german loc files');
assert(fs.readFileSync(locEn, 'utf8').includes('Zipline Boost'), 'english tab title');
assert(fs.readFileSync(locDe, 'utf8').includes('Zipline-Boost'), 'german tab title');

assert(!/\bhittest\s*:/.test(fs.readFileSync(path.join(pak, 'panorama/styles/zipline_boost.css'), 'utf8')), 'no hittest property in CSS (Panorama: Invalid property name)');
// Native-id gate: every overridden Valve layout keeps all vanilla ids/snippets (missing ids hard-crash the game).
{
	const r = require('child_process').spawnSync('python3', [__dirname + '/native_ids.py', __dirname + '/..'], { encoding: 'utf8' });
	if (r.status !== 0) process.stdout.write(r.stdout + r.stderr);
	assert(r.status === 0, 'native ids kept in every overridden layout: ' + String(r.stdout).trim().split('\n').pop());
}

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
