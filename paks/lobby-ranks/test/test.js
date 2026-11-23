// Stand-in tests for Deadlock Lobby Ranks: node test/test.js build/pak/panorama/scripts/lobby_ranks.js
'use strict';
const fs = require('fs');
const S = require('./panorama.js');
const { H, C, advance, buildWorld, storage, shown } = S;
const SRC = fs.readFileSync(process.argv[2] || __dirname + '/../build/pak/panorama/scripts/lobby_ranks.js', 'utf8');
let fails = 0, passes = 0;
const assert = (c, m) => { if (c) passes++; else { fails++; console.log('FAIL', m); } if (process.env.V) console.log(c ? 'ok  ' : 'FAIL', m); };

const byId = (id, root) => { const w = p => { for (const k of p.kids) { if (k.id === id) return k; const r = w(k); if (r) return r; } return null; }; return w(root || H.root); };
const click = id => { const p = byId(id); if (!p) throw new Error('missing ' + id); if (p.events.onactivate) p.events.onactivate(); };
const start = (opts = {}) => {
	for (const k in storage) delete storage[k];
	if (opts.store) storage.deadlock_lobby_ranks_settings = JSON.stringify(opts.store);
	buildWorld(opts);
	S.load(SRC);
	advance(opts.wait === undefined ? 0.05 : opts.wait);
};
const T = () => $.LrTest;
const badge = (row) => row && (row.FindChildTraverse('LrBadge'));

start();
assert(S.errors.length === 0, 'no errors at start: ' + S.errors.join(' | '));
assert(/const RANKS_DEFAULT = true;/.test(SRC), 'Lobby ranks on by default');
assert(S.info.some(m => /Deadlock Lobby Ranks: 0\.2\.1 loaded/.test(m)), 'console line 0.2.1 loaded: ' + S.info.join(' | '));
assert(T().TICK_S === 1, 'tick is 1 Hz, not a frame poll');
assert(!/0\.016/.test(SRC), 'no 0.016 s / ~60 Hz interval in the built script');
assert(T().rankUrl('1234567') === 'https://api.deadlock-api.com/v1/players/1234567/rank/image?format=webp', 'rank image url');
assert(T().rankUrl('nope') === '' && T().rankUrl('') === '', 'bad ids produce no url');

assert(T().parseAccount('1234567') === '1234567', 'plain account id');
assert(T().parseAccount('[U:1:2000001]') === '2000001', 'SteamID3');
assert(T().parseAccount('76561198000000000') === '39734272', 'Steam64 to account id: ' + T().parseAccount('76561198000000000'));
assert(T().parseAccount('99') === '', 'below minimum rejected');
assert(T().parseAccount('{i:account_id}') === '', 'unresolved binding rejected');
assert(T().parseAccount('#Citadel_Profile_FriendID') === '', 'loc token rejected');
assert(T().agree('1111111', '2222222') === '', 'hidden/visible mismatch yields no id');
assert(T().agree('1111111', '1111111') === '1111111', 'matching probes agree');

assert(H.entries.length === 3, 'default list has three entries');
advance(6);
assert(H.entries.every(r => badge(r) && shown(badge(r))), 'each entry has a visible badge (ids from the context-menu card)');
assert(badge(H.entries[0]).img.indexOf('39734272') >= 0, 'card UserName.accountid: badge url uses account id');
assert(badge(H.entries[1]).img.indexOf('2000001') >= 0, 'second row badge url');
assert(badge(H.entries[2]).img.indexOf('3000001') >= 0, 'comma-formatted AccountID label (no pak06 labels): ' + badge(H.entries[2]).img);
assert(H.entries.every(r => badge(r).GetParent().id === 'LrRight' && badge(r).GetParent().GetParent().id === 'MainContents'), 'badge sits in #MainContents > #LrRight');
assert(H.entries.every(r => badge(r).cls.has('LrBadge')), 'badge has LrBadge class');
assert(H.entries.every(r => badge(r).hittest === false), 'badge is not hit-tested');
assert(S.info.some(m => /LR-diag probe row=0:hero=haze try=1 card=found/.test(m)), 'rows keyed by hero: ' + S.info.filter(m => /probe row/.test(m)).join(' | '));
assert(H.clicks.filter(c => c.ev === 'DismissAllContextMenus').length === 1, 'context menu dismissed once after the last probe: ' + H.clicks.filter(c => c.ev === 'DismissAllContextMenus').length);
assert(H.cards.length === 0, 'no context menu left open');

advance(4); S.resetCounts(); advance(5);
assert(C.classWrites === 0 && C.textWrites === 0 && C.styleWrites === 0 && C.images === 0, '5 s, nothing changes: no writes (' + JSON.stringify(C) + ')');
assert(C.sched >= 4 && C.sched <= 6, 'timer at 1 Hz: ' + C.sched);

// a row whose hero changes is a new row: re-probed, badge follows
H.entries[1].FindChildTraverse('LrRowHero')._text = 'Abrams'; H.entries[1].cardId = '2222222';
advance(6);
assert(badge(H.entries[1]).img.indexOf('2222222') >= 0, 'hero change: re-probed, badge url follows');
assert(badge(H.entries[1]).GetAttributeString('account', '') === '2222222', 'hero change: stored on the badge');

// settings in the ADDONS window: header master + party row
click('AddonSettingsButton'); advance(0.2);
assert(!!byId('LrBlock') && byId('LrAuthor') && byId('LrAuthor')._text === 'by luxus', 'ADDONS lists Lobby Ranks with by luxus');
assert(!!byId('LrMaster') && !byId('LrRow_on'), 'on/off is the header master switch');
assert(!!byId('LrRow_duo'), 'settings has the party markers toggle');
click('LrMaster'); advance(1.1);
if (process.env.D) console.log(JSON.stringify(storage), H.entries.map(r => { const b = r.FindChildTraverse('LrRight'); return b && b.applied.visibility; }));
assert(H.entries.every(r => !shown(badge(r))), 'master off: badges hidden');
click('AddonSettingsButton'); advance(0.1);
S.resetCounts(); advance(5);
assert(C.sched <= 2, 'master off: no 1 Hz list timer (' + C.sched + ')');
assert(C.images === 0, 'master off: no image writes');

// profile-card resolution: rows without ids get one via the game's context-menu card
start({ partyReply: q => ({ ok: 1, g: [[4000001, 4000002]], c: 4 }), entries: [
	{ name: 'Kai', hook: false, card: '4000001' },
	{ name: 'Mate', hook: false, card: null, cardText: 'Friend ID: 4000002' },
	{ name: 'Solo', hook: false, card: '4000003', cardDelay: 0.2 }
], entries2: [{ name: 'Foe', hook: false, card: '4000004' }] });
// Mate: no UserName.accountid -> AccountID label path; card null means no card -> fix: make Mate's card carry text only
advance(6);
const cardRow = n => H.entries.concat(H.entries2).find(r => r.FindChildrenWithClassTraverse('PlayerName')[0]._text === n);
assert(badge(cardRow('Kai')) && badge(cardRow('Kai')).img.indexOf('4000001') >= 0, 'card: UserName.accountid gives the rank');
assert(badge(cardRow('Solo')) && badge(cardRow('Solo')).img.indexOf('4000003') >= 0, 'card that fills in late (0.2 s) still read');
assert(badge(cardRow('Foe')) && badge(cardRow('Foe')).img.indexOf('4000004') >= 0, 'second team row resolved');
assert(!cardRow('Mate').FindChildTraverse('LrBadge') || !shown(badge(cardRow('Mate'))), 'no card: no badge');
assert(S.info.some(m => /LR-diag probe row=0:name=Kai try=1 card=found via=UserName\.accountid text="4000001" id=4000001/.test(m)), 'probe text logged: ' + S.info.filter(m => /probe/.test(m)).join(' | '));
assert(S.info.some(m => /LR-diag probe row=0:name=Mate try=2 card=none/.test(m)), 'missing card retried once and logged');
assert(S.info.some(m => /sync entries=4 withAccount=3/.test(m)), 'sync line withAccount=3');
assert(H.cards.length === 0, 'menus dismissed after probing');
assert(H.clicks.some(c => c.ev === 'DismissAllContextMenus'), 'DismissAllContextMenus sent');
assert(H.partyUrls.length === 1 && /\?v=1&n=r[0-9a-z]+&a=4000001,4000003&b=4000004$/.test(H.partyUrls[0]), 'one party request with team lists: ' + H.partyUrls.join(','));
const stack = r => r.FindChildTraverse('LrParty');
assert(stack(cardRow('Kai')) && shown(stack(cardRow('Kai'))) && stack(cardRow('Kai')).cls.has('LrPartyC0'), 'party member gets a colored stack');
assert(stack(cardRow('Kai')).kids.filter(k => shown(k)).length === 2, 'one icon per party member');
assert(stack(cardRow('Kai')).GetParent().kids.indexOf(stack(cardRow('Kai'))) < stack(cardRow('Kai')).GetParent().kids.indexOf(badge(cardRow('Kai'))), 'stack left of the badge');
assert(badge(cardRow('Kai')).GetParent().id === 'LrRight' && badge(cardRow('Kai')).GetParent().GetParent().id === 'MainContents', 'badge in LrRight at the right of MainContents');
assert(!stack(cardRow('Solo')) || !shown(stack(cardRow('Solo'))), 'solo player: no stack');
assert(S.info.some(m => /party groups=1 members=2 profiles=4/.test(m)), 'party result logged');
// cache per match: no new probes or party calls while the roster is unchanged
{ const n = H.clicks.filter(c => c.ev === 'Activated').length; advance(10); assert(H.clicks.filter(c => c.ev === 'Activated').length === n && H.partyUrls.length === 1, 'roster cached: no re-probe, no re-request'); }
assert(S.errors.length === 0, 'no errors in card run: ' + S.errors.join(' | '));

// party bridge timeout and duo off
start({ partyReply: null, entries: [{ name: 'A', card: '2000001' }, { name: 'B', card: '2000002' }] });
advance(25);
assert(S.info.some(m => /party timeout after 20s/.test(m)), 'bridge timeout logged');
start({ store: { on: true, duo: false }, entries: [{ name: 'A', card: '2000001' }, { name: 'B', card: '2000002' }] });
advance(8);
assert(H.partyUrls.length === 0, 'duo off: no bridge request');
assert(T().DUO_DEFAULT === true && T().PARTY_URL === 'https://luxus.github.io/deadlock-mods/party/', 'duo on by default, our bridge page');
assert(T().numberIn('Friend ID: 4000002') === '4000002', 'card label number parse');

assert(T().numberIn('Account ID: 64,826,869') === '64826869', 'comma-separated account id');
assert(T().numberIn("Account ID: 64.826.869") === '64826869' && T().numberIn('Account ID: 64 826 869') === '64826869', 'dot / space separated account id');
// party result via HTMLURLChanged (#fragment) when the title event does not arrive
{
	start({ partyReply: null, entries: [{ name: 'A', card: '2000001' }, { name: 'B', card: '2000002' }] });
	advance(8);
	const br = byId('LrPartyBridge');
	assert(br && br.visible === false, 'bridge panel is hidden');
	const url = H.partyUrls[0] || '';
	const n = new URLSearchParams(url.split('?')[1] || '').get('n');
	S.handlers.filter(h => h.p === br && h.ev === 'HTMLURLChanged').forEach(h => h.f(br, url + '#' + encodeURIComponent('LRPARTY1 ' + JSON.stringify({ n: n, ok: 1, g: [[2000001, 2000002]], c: 2 }))));
	advance(1.1);
	assert(S.info.some(m => /party groups=1 members=2/.test(m)), 'HTMLURLChanged fragment delivers the party result');
}

// stored off stays off
start({ store: { on: false }, wait: 0.2 });
assert(H.entries.every(r => !badge(r) || !shown(badge(r))), 'stored off: no badges');

assert((SRC.match(/AddonSettings\.pulse\(\);/g) || []).length >= 2, 'both tick paths pulse');
assert(/const BUILD = 11;/.test(SRC), 'vendored lib');
assert(!/hud_escape_menu/.test(fs.readFileSync(__dirname + '/../src/main.js', 'utf8')) && !fs.existsSync(__dirname + '/../build/pak/panorama/layout/hud_escape_menu.xml'), 'never touches hud_escape_menu');

// ---- crash regression (lea console 22.11. 09:40:10: FATAL "Unable to find child 'TeamControls'
// in layout file players_list.xml"). At load the list has #Teams but no .Team snippets yet; the
// script must never add a child to #Teams or to the CitadelPlayersList, and never activate #Teams.
{
	start({ entries: [] });
	const teams = byId('Teams');
	teams.kids.slice().forEach(k => k.DeleteAsync ? k.DeleteAsync() : null);
	teams.kids = [];
	const listKids0 = H.list.kids.map(k => k.id).join(',');
	advance(6);
	assert(teams.kids.length === 0, 'crash shape: nothing created inside #Teams (' + teams.kids.map(k => k.id).join(',') + ')');
	assert(H.list.kids.map(k => k.id).join(',') === listKids0, 'crash shape: no foreign child in CitadelPlayersList');
	assert(!H.clicks.some(c => c.ev === 'Activated' && c.p && (c.p.id === 'Teams' || c.p.type === 'CitadelPlayersList')), 'crash shape: #Teams / list never activated');
}
{
	start({ partyReply: q => ({ ok: 1, g: [[4000001, 4000002]], c: 2 }), entries: [
		{ name: 'Kai', hook: false, card: '4000001' }, { name: 'Mate', hook: false, card: '4000002' }] });
	advance(8);
	const native = p => { const w = q => { for (const k of q.kids) { if (/^Lr/.test(k.id) && (k.parent.id === 'Teams' || k.parent.type === 'CitadelPlayersList' || k.parent.cls.has('Team') || k.parent.id === 'TeamEntries')) return k; const r = w(k); if (r) return r; } return null; }; return w(p); };
	assert(!native(H.list), 'full flow: no Lr panel under #Teams, .Team, #TeamEntries or the list');
	const bridge = byId('LrPartyBridge');
	assert(bridge && bridge.parent && bridge.parent.type === 'CitadelHudEscapeMenu', 'party bridge lives on the Esc menu root, not in the players list');
	// toggling duo off and on again reuses the cached party groups without another bridge request
	click('AddonSettingsButton'); advance(0.2);
	click('LrRow_duo'); advance(0.2);
	click('LrRow_duo'); advance(2);
	assert(H.partyUrls.length === 1, 'duo toggle reuses cached party groups: ' + H.partyUrls.length);
}
{
	start({ escClosed: true, entries: [{ name: 'Kai', hook: false, card: '4000001' }] });
	advance(6);
	assert(!H.clicks.some(c => c.ev === 'Activated' && c.id === 'MainContents'), 'Esc menu closed: no row is activated (no context menus during play)');
}
{
	start({ hideout: true, entries: [{ name: 'Kai', hook: false, card: '4000001' }] });
	advance(6);
	assert(!H.clicks.some(c => c.ev === 'Activated' && c.id === 'MainContents'), 'Hideout: no row is activated (same as the reference)');
}
// stopping while a probe is in flight cancels probe and dismiss timers
{
	start({ wait: 0.02, entries: [{ name: 'Slow', hook: false, card: '4000009', cardDelay: 0.3 }] });
	click('AddonSettingsButton'); advance(0.02);
	click('LrMaster');
	H.clicks = [];
	advance(2);
	assert(!H.clicks.some(c => c.ev === 'DismissAllContextMenus'), 'stop cancels in-flight probe and does not dismiss menus later');
}
// row hero changing while a probe is waiting discards the stale card id
{
	start({ wait: 0.02, entries: [{ name: 'Swap', hero: 'Haze', card: '5000001', cardDelay: 0.25 }] });
	H.entries[0].FindChildTraverse('LrRowHero')._text = 'Abrams';
	advance(0.4);
	assert(S.info.some(m => /card=stale via=hero changed/.test(m)), 'async hero change discards stale probe result');
}

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
