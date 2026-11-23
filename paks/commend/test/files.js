'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pak = path.join(root, 'build/pak');
let fails = 0, passes = 0;
const assert = (c, m) => { if (c) { passes++; return; } fails++; console.error('FAIL ' + m); };
const read = rel => fs.readFileSync(path.join(pak, rel), 'utf8');

const js = read('panorama/scripts/deadlock_commend.js');
assert(js.includes("const VERSION = '2.0.0';"), 'script version 2.0.0');
assert(js.includes('const TICK_S = 0.25;'), 'visibility tick is 0.25 s');
assert(!/0\.016/.test(js), 'no per-frame schedule');
assert(!/qollite|QoL Lite|Umm\.|friends_rank|auto_commend/i.test(js), 'no borrowed commend markers');
assert(js.includes('CitadelPostGameCommendPlayer'), 'mask and return send the Valve event');
assert(!js.includes('ClientUI_FireOutput'), 'no mute-list poll');

const settings = read('panorama/scripts/deadlock_commend_settings.js');
assert(settings.includes("id: 'deadlock_commend'"), 'addon id deadlock_commend');
assert(settings.includes('Deadlock Commend: 2.0.0 loaded'), 'loaded log line');
assert(settings.includes('const BUILD = 9;'), 'addon settings 1.2.3 build 9');
const reg = read('panorama/scripts/deadlock_commend_register.js');
assert(reg.includes('DC-diag register hud'), 'hud registrar log');

const page = read('panorama/layout/post_game/citadel_db_page_post_game_new.xml');
assert(page.includes('id="DcRow_Team1"') && page.includes('id="DcRow_Team2"') && page.includes('id="DcRow_Scoreboard"'), 'three rows on the new post-game page');
assert(!page.includes('id="DcRow_MVP"'), 'graphs and the page root have no mvp row');
assert(page.includes('text="Team"') && page.includes('text="Enemy"') && page.includes('text="All"') && page.includes('text="Return"'), 'button texts are fixed English');
assert(page.includes('deadlock_commend.vjs_c') && page.includes('deadlock_commend_settings.vjs_c'), 'logic then settings');
assert(page.indexOf('deadlock_commend.vjs_c') < page.indexOf('deadlock_commend_settings.vjs_c'), 'settings include follows the logic include');
assert(page.includes('citadel_db_page_post_game_new.vts_c') && !page.includes('.vcss"') && !page.includes('.vts"'), 'Valve includes use compiled endings');
assert(page.includes('id="Team1"') && page.includes('id="Graphs"') && page.includes('id="PlayAgainButton"'), 'native ids kept');

const mvp = read('panorama/layout/post_game/citadel_db_post_game_progress_mvp.xml');
assert(mvp.includes('id="DcRow_MVP"') && !mvp.includes('id="DcRow_Team1"'), 'mvp layout has only the mvp row');
assert(mvp.includes('id="HonorableMentions"') && mvp.indexOf('id="HonorableMentions"') < mvp.indexOf('id="DcRow_MVP"'), 'mvp row follows honorable mentions');

const hud = read('panorama/layout/hud_join_team.xml');
assert(hud.includes('deadlock_commend_register.vjs_c') && !hud.includes('deadlock_commend.vjs_c'), 'hud layout loads only the registrar');
assert(hud.includes('id="TextureLayer"') || hud.includes('JoinTeamButton'), 'hud keeps Valve buttons');

const css = read('panorama/styles/post_game/deadlock_commend.css');
assert(css.includes('margin-left: 200px;') && css.includes('margin-bottom: 16px;') && css.includes('height: 28px;'), 'row placement');
assert(css.includes('pre-transform-scale2d: 1.08;') && css.includes('pre-transform-scale2d: 0.92;'), 'hover and press scale');
assert(css.includes('UI.CommendConfirmation'), 'press sound');
assert(css.includes('#8fdf8a') && css.includes('#e88989') && css.includes('#8ee0b0'), 'team, enemy, return colours');
assert(!css.includes('#e6c36a'), 'no unmuted colour');

const en = read('resource/localization/deadlock_commend/deadlock_commend_english.txt');
const de = read('resource/localization/deadlock_commend/deadlock_commend_german.txt');
assert(en.includes('Commend buttons') && de.includes('Commend-Tasten'), 'english and german settings copy');
assert(!de.includes('ß'), 'Swiss German spelling');
['brazilian', 'czech', 'french', 'indonesian', 'italian', 'japanese', 'koreana', 'latam', 'polish', 'russian', 'schinese', 'spanish', 'tchinese', 'thai', 'turkish', 'ukrainian'].forEach(lang => {
	assert(fs.existsSync(path.join(pak, 'resource/localization/deadlock_commend/deadlock_commend_' + lang + '.txt')), lang + ' loc file');
});

const r = require('child_process').spawnSync('python3', [__dirname + '/native_ids.py', root], { encoding: 'utf8' });
if (r.status !== 0) process.stdout.write(r.stdout + r.stderr);
assert(r.status === 0, 'native ids kept');

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
