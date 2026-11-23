'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pak = path.join(root, 'build/pak');
let fails = 0, passes = 0;
const assert = (c, m) => { if (c) { passes++; return; } fails++; console.error('FAIL ' + m); };
const read = rel => fs.readFileSync(path.join(pak, rel), 'utf8');

const page = read('panorama/scripts/profile_links.js');
assert(page.includes("const VERSION = '2.0.0';"), 'version 2.0.0');
assert(page.includes('const PAGE_LOCK_MS = 2000;'), 'profile page waits 2 s');
assert(page.includes('https://www.deadchaps.gg/player/'), 'deadchaps url keeps the trailing slash');
assert(page.includes('format=webp'), 'rank image is webp');
assert(!/qollite|QoL Lite|friends_rank|Umm\./i.test(page), 'page script has no borrowed markers');
const board = read('panorama/scripts/profile_links_scoreboard.js');
assert(board.includes('const TRIES = 9;') && board.includes('const GAP_S = 0.15;'), 'scoreboard gives rows 1.2 s');
assert(!/0\.016/.test(board), 'scoreboard is not a frame loop');
const settings = read('panorama/scripts/profile_links_settings.js');
assert(settings.includes("id: 'deadlock_profile_links'"), 'addon id');
assert(settings.includes("key: 'statlocker'") && settings.includes("key: 'deadchaps'"), 'site toggles');
assert(settings.includes('needs: [\'on\']') || settings.includes('needs: ["on"]'), 'site toggles need the master switch');
assert(settings.includes('const BUILD = 12;'), 'addon settings build 12');
assert(settings.includes("const VERSION = '2.0.0';") && settings.includes("'Deadlock Profile Links: ' + VERSION + ' loaded"), 'loaded log line');
assert(read('panorama/scripts/profile_links_register.js').includes("'Deadlock Profile Links: ' + VERSION + ' register hud'"), 'hud log line');
assert(read('panorama/scripts/profile_links_register.js').includes('AddonSettings.register(PL_SCHEMA, () => {})'), 'hud registrar callback does nothing');
assert(!read('panorama/scripts/profile_links_settings.js').includes('plWalk'), 'settings does not walk the ui tree');

const profile = read('panorama/layout/citadel_db_page_profile.xml');
assert(profile.includes('id="PlNameRow"') && profile.includes('id="SelfName"'), 'name row keeps SelfName');
assert(profile.includes("UIShowTextTooltip( &apos;View Statlocker Profile&apos; )"), 'page tooltip is a single-quoted literal');
assert(profile.includes('margin-right') || profile.includes('PlStatlocker'), 'logo buttons exist');
assert(profile.indexOf('profile_links.vjs_c') < profile.indexOf('profile_links_settings.vjs_c'), 'settings load last');
assert(profile.includes('profile_links.vcss_c') && !profile.includes('.vcss"'), 'compiled style include');
assert(profile.includes('id="ForumButton"') && profile.includes('id="MatchHistoryList"'), 'native profile ids kept');

const card = read('panorama/layout/profile_card.xml');
assert(card.includes('text="View Statlocker Profile"') && card.includes('text="View DeadChaps Profile"'), 'card button text is fixed English');
assert(card.indexOf('id="CardMain"') < card.indexOf('View Statlocker Profile') && card.indexOf('View DeadChaps Profile') < card.indexOf('id="PartyInfo"'), 'buttons sit between the card body and party info');
assert(card.includes('id="AccountID"') && card.includes('{i:r:account_id}'), 'account row keeps the hidden id');

const score = read('panorama/layout/post_game/citadel_db_post_game_scoreboard_new.xml');
assert(!score.includes('CommendContainer'), 'commend wrapper is unpacked');
assert(score.includes('id="commendIcon"') && score.includes('id="CommendPlayerButton"') && score.includes('id="LocalPlayerIdentifier"'), 'commend children stay, with an empty icon');
assert(score.indexOf('CopyBuildButton') < score.indexOf('class="PlSlot"'), 'link slot follows copy build');
assert(score.includes("UIShowTextTooltip( &apos;View DeadChaps Profile&apos; )"), 'scoreboard tooltip is a single-quoted literal');
assert(score.slice(score.indexOf('CopyBuildButton'), score.indexOf('class="PlSlot"')).includes('</Panel>'), 'link slot is after .PlayerRow, not inside it');
assert(score.includes('class="PlScoreboard"'), 'scoreboard root is marked');
assert(score.includes('id="SoulsValue"') && score.includes('id="ItemsContainer"'), 'stat columns stay');

const hud = read('panorama/layout/hud_match_start.xml');
assert(hud.includes('profile_links_register.vjs_c') && !hud.includes('profile_links.vjs_c'), 'match start loads only the registrar');

const css = read('panorama/styles/profile_links.css');
assert(css.includes('width: 420px;') && css.includes('margin-right: 6px;') && css.includes('brightness: 1.15;'), 'name row measurements');
assert(css.includes('min-height: 54px;') && css.includes('background-color: #050708e8;') && css.includes('font-size: 13px;'), 'account row stays visible and styled');
assert(css.includes('.PlRankCard .PlRankBox') && css.includes('width: 48px;') && css.includes('height: 44px;'), 'card rank box fills the 48 by 44 area');
assert(css.includes('pre-transform-rotate2d: 360deg;') && !css.includes('rotateZ'), 'spinner keyframes use pre-transform-rotate2d');
assert(css.includes('#69e799') && css.includes('#f0b35a') && css.includes('brightness: 0.72;'), 'card button colours');
assert(!/\bhittest\s*:/.test(css), 'profile_links.css has no invalid CSS hittest property');
const scss = read('panorama/styles/profile_links_scoreboard.css');
assert(scss.includes('width: 34px;') && scss.includes('pre-transform-scale2d: 1.12;') && scss.includes('TotalsRow'), 'scoreboard slot measurements');
assert(!/\bhittest\s*:/.test(scss), 'scoreboard.css has no invalid CSS hittest property');

assert(fs.statSync(path.join(pak, 'panorama/images/profile_links/statlocker_png.vtex_c')).size > 16000, 'statlocker texture compiled');
assert(fs.statSync(path.join(pak, 'panorama/images/profile_links/deadchaps_png.vtex_c')).size > 16000, 'deadchaps texture compiled');
const en = read('resource/localization/deadlock_profile_links/deadlock_profile_links_english.txt');
const de = read('resource/localization/deadlock_profile_links/deadlock_profile_links_german.txt');
assert(en.includes('Profile Links') && de.includes('Profil-Links') && de.includes('Seiten'), 'english and german settings copy');
assert(!fs.existsSync(path.join(pak, 'resource/localization/deadlock_profile_links/deadlock_profile_links_french.txt')), 'no extra languages');

const r = require('child_process').spawnSync('python3', [__dirname + '/native_ids.py', root], { encoding: 'utf8' });
if (r.status !== 0) process.stdout.write(r.stdout + r.stderr);
assert(r.status === 0, 'native ids kept');

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
