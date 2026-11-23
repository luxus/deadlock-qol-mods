// Checks the assembled main and hook paks.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pak = path.join(root, 'build/pak');
const hook = path.join(root, 'build/pak-hook');
let fails = 0, passes = 0;
const assert = (c, m) => { if (c) { passes++; return; } fails++; console.error('FAIL ' + m); };

const js = fs.readFileSync(path.join(pak, 'panorama/scripts/lobby_ranks.js'), 'utf8');
assert(js.includes("const VERSION = '0.2.1';"), 'script version 0.2.1');
assert(js.includes("try { $.Msg('LR-diag script-entry');"), 'script-entry is present');
assert(js.includes("const RANKS_DEFAULT = true;"), 'ranks on by default');
assert(js.includes('https://api.deadlock-api.com/v1/players'), 'public rank API host');
assert(js.includes('/rank/image?format=webp'), 'rank image format=webp');
assert(!js.includes('friends_rank'), 'script does not mention friends_rank');
assert(!/HoppCX|Friends Rank|QoL Lite|deadlock-qol-mods/.test(js), 'script has no qol-mods markers');
assert(!/function\s+getAccountId|function\s+addRank/.test(js), 'no qol-style function names');

const css = fs.readFileSync(path.join(pak, 'panorama/styles/lobby_ranks.css'), 'utf8');
assert(css.includes('.LrBadge'), 'CSS: .LrBadge');
assert(css.includes('.LrProbe'), 'CSS: .LrProbe collapsed probes');
assert(!css.includes('.vtex'), 'CSS: no texture urls (API images at runtime)');

const list = fs.readFileSync(path.join(pak, 'panorama/layout/players_list.xml'), 'utf8');
assert(list.includes('s2r://panorama/scripts/lobby_ranks.vjs_c'), 'list: script include');
assert(list.includes('s2r://panorama/styles/lobby_ranks.vcss_c'), 'list: style include');
assert(list.includes('citadel_base_styles.vcss_c') && list.includes('players_list.vcss_c'), 'list: Valve styles rewritten to .vcss_c');
assert(!list.includes('.vcss"'), 'list: no uncompiled .vcss includes');
assert(list.includes('id="Teams"') && list.includes('id="TeamEntries"'), 'list: Teams / TeamEntries kept');
assert(!fs.existsSync(path.join(pak, 'panorama/layout/players_list_entry.xml')), 'main pak does not override players_list_entry.xml');

const entry = fs.readFileSync(path.join(hook, 'panorama/layout/players_list_entry.xml'), 'utf8');
assert(entry.includes('id="MainContents"'), 'hook: probes sit under MainContents');
assert(entry.includes('id="LrRowHero"') && entry.includes('text="{g:citadel_hero_name:hero_id}"'), 'hook: hidden hero label (row key)');
assert(entry.indexOf('id="LrRowHero"') > entry.indexOf('id="MainContents"'), 'hook: hero label inside MainContents');
assert(!/LrAccountId/.test(entry), 'hook: no empty account-id labels (proven empty, lea 09:27:40)');
assert(entry.includes('s2r://panorama/styles/lobby_ranks.vcss_c'), 'hook: style include');
assert(entry.includes('players_list_entry.vcss_c') && !entry.includes('.vcss"'), 'hook: Valve styles rewritten to .vcss_c');
assert(!fs.existsSync(path.join(hook, 'panorama/scripts/lobby_ranks.js')), 'hook pak has no script (main pak provides it)');
assert(!fs.existsSync(path.join(hook, 'panorama/layout/players_list.xml')), 'hook pak does not override players_list.xml');

const locEn = path.join(pak, 'resource/localization/deadlock_lobby_ranks/deadlock_lobby_ranks_english.txt');
const locDe = path.join(pak, 'resource/localization/deadlock_lobby_ranks/deadlock_lobby_ranks_german.txt');
assert(fs.existsSync(locEn) && fs.existsSync(locDe), 'english and german loc files');
assert(fs.readFileSync(locEn, 'utf8').includes('Lobby Ranks'), 'english tab title');
assert(fs.readFileSync(locDe, 'utf8').includes('Lobby-Ränge'), 'german tab title');

// Native-id gate: every overridden Valve layout keeps all vanilla ids/snippets (missing ids hard-crash the game).
{
	const r = require('child_process').spawnSync('python3', [__dirname + '/native_ids.py', __dirname + '/..'], { encoding: 'utf8' });
	if (r.status !== 0) process.stdout.write(r.stdout + r.stderr);
	assert(r.status === 0, 'native ids kept in every overridden layout: ' + String(r.stdout).trim().split('\n').pop());
}

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
