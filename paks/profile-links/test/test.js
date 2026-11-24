'use strict';
const fs = require('fs');
const S = require('./panorama.js');
const { H, mk, advance, load, fire, resetCounts, C } = S;
const PAGE = fs.readFileSync(process.argv[2] || __dirname + '/../build/pak/panorama/scripts/profile_links.js', 'utf8');
const BOARD = fs.readFileSync(process.argv[3] || __dirname + '/../build/pak/panorama/scripts/profile_links_scoreboard.js', 'utf8');
let fails = 0, passes = 0;
const assert = (c, m) => { if (c) passes++; else { fails++; console.log('FAIL', m); } };
const pending = p => !!(p && p.BHasClass('PlPending'));

const bootPage = () => {
	H.clicks = [];
	H.root = mk('Panel', null, 'UI');
	H.root.cfg = {};
	const page = H.ctx = mk('CitadelProfilePage', H.root, 'CitadelProfilePage');
	const info = mk('Panel', page, 'ProfileInfo');
	const row = mk('Panel', info, 'PlNameRow', 'PlNameRow');
	mk('Button', row, 'PlStatlocker', 'PlLink PlStatlocker PlPending');
	mk('Button', row, 'PlDeadchaps', 'PlLink PlDeadchaps PlPending');
	mk('Label', row, 'SelfName', '', 'Kai');
	mk('Label', info, 'PlAccountId', 'PlProbe', '1234567');
	mk('Label', info, 'FriendID', 'FriendID', 'Friend code 1234567');
	const rank = mk('Panel', info, 'PlRank', 'PlRank PlRankPage PlLoading');
	const rankBox = mk('Panel', rank, '', 'PlRankBox');
	mk('Panel', rankBox, 'PlRankImage', 'PlImageBox');
	return page;
};

bootPage();
load(PAGE);
assert(S.errors().length === 0, 'page loads: ' + S.errors().join(' | '));
assert($.PlTest.VERSION === '2.0.3', 'version');
assert($.PlTest.pageId('1234567') === '1234567', 'plain account id');
assert($.PlTest.pageId('[U:1:2000001]') === '2000001', 'steam id 3');
assert($.PlTest.pageId('76561198000000000') === '39734272', 'steam64: ' + $.PlTest.pageId('76561198000000000'));
assert($.PlTest.pageId('{i:account_id}') === '' && $.PlTest.pageId('#Citadel_Profile_FriendID') === '' && $.PlTest.pageId('nan') === '', 'tokens and nan are not ids');
assert($.PlTest.pageId('99') === '', 'below the minimum');
assert($.PlTest.pageId('account id: 1,234,567') === '1234567', 'phrase with separators');
assert($.PlTest.pageId('AccountID: 1’234’567') === '1234567', 'a phrase keeps a curly apostrophe: ' + $.PlTest.pageId('AccountID: 1’234’567'));
assert($.PlTest.pageId('friend code 76 561 197 960 365 728') === '100000', 'seventeen digits after a phrase are a steam id: ' + $.PlTest.pageId('friend code 76 561 197 960 365 728'));
assert($.PlTest.pageId('Account-ID: 1.234.567') === '1234567' && $.PlTest.pageId('Freundescode: 1234567') === '1234567', 'German Account-ID and Freundescode labels');
assert($.PlTest.pageId('myaccount id 1234567') === '', 'a phrase is a whole word');
assert($.PlTest.agreeIds(['1111111', '2222222']) === '', 'two ids are a conflict');
assert($.PlTest.agreeIds(['1111111', 'not an id', '1111111']) === '1111111', 'one distinct id wins');
assert($.PlTest.boardId('id 3333333') === '3333333', 'scoreboard digits');
assert($.PlTest.boardId('0') === '' && $.PlTest.boardId('12') === '', 'bot and short ids do nothing');
assert($.PlTest.statUrl('1234567') === 'https://statlocker.gg/profile/1234567', 'statlocker url');
assert($.PlTest.chapsUrl('1234567') === 'https://www.deadchaps.gg/player/1234567/', 'deadchaps url');
assert($.PlTest.rankUrl('1234567').indexOf('/rank/image?format=webp') > 0, 'rank image url');

const stat = H.ctx.FindChildTraverse('PlStatlocker');
advance(0.2);
assert(pending(stat), 'logos stay hidden before the id settles');
assert(C.created === 0, 'no rank image before the id settles');
advance(2.2);
assert(!pending(stat) && !pending(H.ctx.FindChildTraverse('PlDeadchaps')), 'both logos show together after 2 s');
assert(C.created === 1 && C.images === 1, 'one rank image request: ' + C.created + '/' + C.images);
const pageShot = H.ctx.FindChildTraverse('PlRankShot');
assert(pageShot && pageShot.parent && pageShot.parent.id === 'PlRankImage' && pageShot.BHasClass('PlRankShot'), 'page rank image mounts inside PlRankImage with PlRankShot class');
bootPage();
H.ctx.FindChildTraverse('FriendID')._text = '9999999';
load(PAGE);
advance(2.4);
assert(!pending(H.ctx.FindChildTraverse('PlStatlocker')), 'the visible FriendID label is not an id source');
resetCounts();
advance(1);
assert(C.created === 0 && C.images === 0, 'a settled page does not request the image again');
const pageStat = () => H.ctx.FindChildTraverse('PlStatlocker');
H.ctx.events.onmouseover();
advance(1.5);
H.ctx.events.onmouseover();
advance(1.5);
assert(pending(pageStat()), 'a second mouseover restarts the two second wait');
advance(0.8);
assert(!pending(pageStat()), 'logos return about two seconds after the last mouseover');
pageStat().events.onactivate();
assert(H.clicks.some(c => c.ev === 'ExternalBrowserGoToURL' && c.id === 'https://statlocker.gg/profile/1234567'), 'statlocker click: ' + JSON.stringify(H.clicks));

const bootCard = (menu, local, status) => {
	H.clicks = [];
	H.root = mk('Panel', null, 'UI');
	H.root.cfg = H.root.cfg || {};
	const host = menu ? mk('Panel', H.root, 'ContextMenuBody', 'ContextMenuBody') : H.root;
	const card = H.ctx = mk('CitadelProfileCard', host, 'Card', local ? 'isLocalPlayer' : '');
	mk('Label', card, 'PlAccountId', 'PlProbe', '2222222');
	mk('Label', card, 'AccountID', 'AccountID', '2222222');
	mk('Label', card, 'UserName', '', 'Ada');
	mk('Label', card, 'UserNickname', '', '');
	mk('Label', card, 'UserRichPresence', '', status || '');
	const rank = mk('Panel', card, 'PlRank', 'PlRank PlRankCard PlIdle');
	const rankBox = mk('Panel', rank, '', 'PlRankBox');
	mk('Panel', rankBox, 'PlRankImage', 'PlImageBox');
	mk('Button', card, 'PlStatlocker', 'PlText PlLink PlStatlocker PlPending');
	mk('Button', card, 'PlDeadchaps', 'PlText PlLink PlDeadchaps PlPending');
	return card;
};

bootCard(false, false);
resetCounts();
load(PAGE);
advance(2);
assert(pending(H.ctx.FindChildTraverse('PlStatlocker')), 'hover card has no text buttons');
assert(C.images === 1, 'hover card still requests the rank: ' + C.images);

bootCard(true, true);
load(PAGE);
advance(0.1);
assert(pending(H.ctx.FindChildTraverse('PlStatlocker')), 'the card has not read at 0.1 s');
advance(0.4);
assert(pending(H.ctx.FindChildTraverse('PlStatlocker')), 'local card is not ready at 0.5 s');
advance(0.45);
assert(!pending(H.ctx.FindChildTraverse('PlStatlocker')), 'local card is ready before 1 s');
const shot = H.ctx.FindChildTraverse('PlRankShot');
assert(shot && shot.parent && shot.parent.id === 'PlRankImage' && shot.BHasClass('PlRankShot'), 'card rank image mounts inside PlRankImage with PlRankShot class');
const saved = H.ctx.FindChildTraverse('PlAccountId')._text;
H.ctx.FindChildTraverse('PlAccountId')._text = '8888888';
H.ctx.FindChildTraverse('AccountID')._text = '8888888';
fire('ImageLoaded', shot);
assert(!H.ctx.FindChildTraverse('PlRank').BHasClass('PlReady'), 'an image that loads for a different player stays hidden');
H.ctx.FindChildTraverse('PlAccountId')._text = saved;
H.ctx.FindChildTraverse('AccountID')._text = saved;
fire('ImageLoaded', shot);
assert(H.ctx.FindChildTraverse('PlRank').BHasClass('PlReady'), 'an image that still matches the player is shown');

bootCard(true, true);
H.ctx.FindChildTraverse('PlAccountId')._text = '';
H.ctx.FindChildTraverse('AccountID')._text = '';
H.ctx.FindChildTraverse('UserName')._text = '';
load(PAGE);
advance(5.2);
assert(pending(H.ctx.FindChildTraverse('PlStatlocker')), 'the card gives up when no identity settles in 5 s');
H.ctx.FindChildTraverse('PlAccountId')._text = '3333333';
H.ctx.FindChildTraverse('AccountID')._text = '3333333';
H.ctx.FindChildTraverse('UserName')._text = 'Bea';
advance(1.2);
assert(!pending(H.ctx.FindChildTraverse('PlStatlocker')), 'a later player on the same card still gets a fresh wait');

bootCard(true, true);
load(PAGE);
advance(0.4);
H.ctx.AddClass('Loading');
advance(0.2);
H.ctx.RemoveClass('Loading');
advance(0.5);
assert(pending(H.ctx.FindChildTraverse('PlStatlocker')), 'a loading gap restarts the stability wait');
advance(0.5);
assert(!pending(H.ctx.FindChildTraverse('PlStatlocker')), 'the wait completes after the restarted gap');

bootCard(true, false, '');
load(PAGE);
advance(2);
H.ctx.AddClass('Loading');
advance(0.2);
H.ctx.RemoveClass('Loading');
advance(1.8);
assert(!pending(H.ctx.FindChildTraverse('PlStatlocker')), 'a load that is already on at the start of a run still counts as fresh');

bootCard(true, true);
const userPanel = H.ctx.FindChildTraverse('UserName');
userPanel._text = '';
mk('Label', userPanel, 'InnerName', '', 'Ada');
load(PAGE);
advance(1.2);
assert(!pending(H.ctx.FindChildTraverse('PlStatlocker')), 'the card name is the child text of UserName');

bootCard(true, false, '');
load(PAGE);
advance(0.9);
assert(pending(H.ctx.FindChildTraverse('PlDeadchaps')), 'a quiet card waits past 0.75 s');
advance(0.8);
assert(!pending(H.ctx.FindChildTraverse('PlDeadchaps')), 'a quiet card is ready after 1.5 s');

const bootBoard = () => {
	H.clicks = [];
	H.root = mk('Panel', null, 'UI');
	H.root.cfg = {};
	const board = H.ctx = mk('CitadelPostGameScoreboardNew', H.root, 'CitadelPostGameScoreboardNew', 'PlScoreboard');
	const row = mk('Panel', board, 'P1', 'Player');
	mk('Label', row, 'PlAccountId', 'PlProbe', '4444444');
	mk('Label', row, 'PlayerName', '', 'Kai');
	mk('Button', row, 'PlStatlocker', 'PlLink PlStatlocker');
	mk('Button', row, 'PlDeadchaps', 'PlLink PlDeadchaps');
	const bot = mk('Panel', board, 'Bot', 'Player');
	mk('Label', bot, 'PlAccountId', 'PlProbe', '0');
	mk('Button', bot, 'PlStatlocker', 'PlLink PlStatlocker');
	const total = mk('Panel', board, 'Sum', 'Player TotalsRow');
	mk('Button', total, 'PlStatlocker', 'PlLink PlStatlocker');
	return board;
};
bootBoard();
load(BOARD);
assert($.PlBoard.TRIES === 9 && $.PlBoard.GAP_S === 0.15, 'scoreboard retries are bounded');
const rowButton = H.ctx.FindChildTraverse('P1').FindChildTraverse('PlStatlocker');
assert(rowButton.GetAttributeString('plBound', '') === '1', 'player button is bound');
assert(H.ctx.FindChildTraverse('Sum').FindChildTraverse('PlStatlocker').GetAttributeString('plBound', '') !== '1', 'totals row is not bound');
H.ctx.FindChildTraverse('P1').accountid = '1111111';
assert($.PlBoard.rowId(H.ctx.FindChildTraverse('P1')) === '4444444', 'a hidden label beats a js property');
const propRow = mk('Panel', H.ctx, 'P2', 'Player');
propRow.accountid = '5555555';
mk('Label', propRow, 'PlAccountId', 'PlProbe', '');
assert($.PlBoard.rowId(propRow) === '5555555', 'a row js property supplies the id: ' + $.PlBoard.rowId(propRow));
const textRow = mk('Panel', H.ctx, 'P3', 'Player');
const textLabel = mk('Label', textRow, 'PlAccountId', 'PlProbe', '');
textLabel.SetAttributeString('text', '6666666');
assert($.PlBoard.rowId(textRow) === '6666666', 'a text attribute supplies the id when the label text is empty');
rowButton.events.onactivate();
assert(H.clicks.some(c => c.id === 'https://statlocker.gg/profile/4444444'), 'scoreboard opens that row');
H.clicks = [];
H.ctx.FindChildTraverse('Bot').FindChildTraverse('PlStatlocker').events.onactivate();
assert(H.clicks.length === 0, 'bot click does nothing');
resetCounts();
advance(2);
assert(C.sched <= 10, 'scoreboard stops scheduling after 1.2 s: ' + C.sched);

// Regression: boardId handles Steam3 and Steam64 cleanly without prepending "1" from [U:1:...]
assert($.PlTest.boardId('[U:1:1234567]') === '1234567', 'boardId parses Steam3 cleanly: ' + $.PlTest.boardId('[U:1:1234567]'));
assert($.PlTest.boardId('76561198000000000') === '39734272', 'boardId converts Steam64: ' + $.PlTest.boardId('76561198000000000'));

// Regression: profile page does not settle or open links while Loading class is active
{
	bootPage();
	H.ctx.AddClass('Loading');
	load(PAGE);
	advance(3);
	assert(pending(H.ctx.FindChildTraverse('PlStatlocker')), 'profile page does not settle while Loading');
	H.ctx.RemoveClass('Loading');
	advance(2.6);
	assert(!pending(H.ctx.FindChildTraverse('PlStatlocker')), 'profile page settles after Loading clears');
	H.clicks = [];
	H.ctx.AddClass('Loading');
	H.ctx.FindChildTraverse('PlStatlocker').events.onactivate();
	assert(H.clicks.length === 0, 'profile page blocks clicks while Loading is active');
}

// Multi-layout AddonSettings integration: HUD registrar + profile page + profile card share id deadlock_profile_links.
// Stored settings must apply to every layout on load, and live toggles must update all open layouts simultaneously.
{
	const REG = fs.readFileSync(__dirname + '/../build/pak/panorama/scripts/profile_links_register.js', 'utf8');
	const SET = fs.readFileSync(__dirname + '/../build/pak/panorama/scripts/profile_links_settings.js', 'utf8');
	for (const k in S.storage) delete S.storage[k];
	S.storage.deadlock_profile_links_settings = JSON.stringify({ on: true, statlocker: false, deadchaps: true });
	H.root = mk('Panel', null, 'UI');
	H.root.cfg = {};
	const esc = mk('Panel', H.root, 'EscapeMenu');
	mk('Panel', mk('Panel', mk('Panel', esc, 'LeftStripe'), 'Menu'), 'SubOptions');
	const hud = mk('Panel', H.root, 'HudMatchStart');
	H.ctx = hud;
	load(REG);
	advance(1.2);
	const page = mk('CitadelProfilePage', H.root, 'CitadelProfilePage');
	H.ctx = page;
	S.loadExtra(SET);
	advance(0.2);
	assert(!page.BHasClass('PlOff') && page.BHasClass('PlNoStatlocker') && !page.BHasClass('PlNoDeadchaps'), 'profile page receives stored statlocker=false on load');
	const card = mk('CitadelProfileCard', H.root, 'Card');
	H.ctx = card;
	S.loadExtra(SET);
	advance(0.2);
	assert(!card.BHasClass('PlOff') && card.BHasClass('PlNoStatlocker') && !card.BHasClass('PlNoDeadchaps'), 'profile card receives stored statlocker=false on load');
	// Open ADDONS and toggle master OFF -> BOTH open page and card update live
	const addonsBtn = esc.FindChildTraverse('AddonSettingsButton');
	assert(!!addonsBtn, 'ADDONS button present');
	addonsBtn.events.onactivate();
	advance(0.2);
	const master = esc.FindChildTraverse('PlMaster');
	assert(!!master, 'Profile Links master toggle present');
	master.events.onactivate();
	advance(0.2);
	assert(page.BHasClass('PlOff') && card.BHasClass('PlOff'), 'toggling master OFF updates both open profile page and profile card live');
	// Destroy card, toggle master back ON -> page updates and dead card subscriber is pruned
	const clientPanel = esc.FindChildTraverse('AddonSettingsClient_deadlock_profile_links');
	const subsBefore = clientPanel.GetChildCount();
	card.DeleteAsync();
	master.events.onactivate();
	advance(0.2);
	assert(!page.BHasClass('PlOff') && page.BHasClass('PlNoStatlocker'), 'toggling master back ON updates surviving profile page');
	assert(clientPanel.GetChildCount() === subsBefore - 1, 'destroyed layout subscriber panel is cleaned up');
}

// Takeover + Activated bubbling regression (1.2.6 build 13):
// - Takeover must not unset style.marginBottom = null (Panorama alias property) or abort host cleanup
// - Existing legacy <=1.2.4 client (onactivate on client panel, no Sub children) still receives values
// - Existing 1.2.5 client (no onactivate on client panel, empty Sub child) and new client must not bubble into scan recursion
{
	const REG = fs.readFileSync(__dirname + '/../build/pak/panorama/scripts/profile_links_register.js', 'utf8');
	for (const k in S.storage) delete S.storage[k];
	S.storage.deadlock_profile_links_settings = JSON.stringify({ on: true, statlocker: true, deadchaps: true });
	H.root = mk('Panel', null, 'UI');
	H.root.cfg = {};
	const esc = mk('Panel', H.root, 'EscapeMenu');
	mk('Panel', mk('Panel', mk('Panel', esc, 'LeftStripe'), 'Menu'), 'SubOptions');
	const changehero = mk('Button', esc, 'changehero');
	changehero.SetAttributeString('AddonSettingsLift', '1');
	const lifts = [];
	const origSetAttr = changehero.SetAttributeString.bind(changehero);
	changehero.SetAttributeString = (k, v) => { if (k === 'AddonSettingsLift') lifts.push(v); origSetAttr(k, v); };
	let mb = '312px';
	Object.defineProperty(changehero.style, 'marginBottom', {
		get: () => mb,
		set: v => {
			if (v === null || v === undefined) throw new Error("Cannot set a property alias to undefined, only a base property, we don't support unset of alias alone");
			mb = v;
		},
		configurable: true,
	});
	const host = mk('Panel', esc, 'AddonSettingsHost', 'AddonSettingsHost');
	host.SetAttributeString('build', '11');
	host.SetAttributeString('token', '11.old');
	const staleHead = mk('Panel', host, 'OldHead', 'HudppHead');
	const legacy = mk('Panel', host, 'AddonSettingsClient_legacy_mod', 'AddonSettingsClient');
	legacy.SetAttributeString('schema', JSON.stringify({ id: 'legacy_mod', title: 'Legacy Mod', controls: [{ key: 'on', type: 'toggle', default: true }] }));
	let legacyValues = '';
	legacy.SetPanelEvent('onactivate', () => { legacyValues = legacy.GetAttributeString('values', ''); });
	const old125 = mk('Panel', host, 'AddonSettingsClient_old_125', 'AddonSettingsClient');
	old125.SetAttributeString('schema', JSON.stringify({ id: 'old_125', title: 'Old 125', controls: [{ key: 'on', type: 'toggle', default: true }] }));
	const old125Sub = mk('Panel', old125, '', 'AddonSettingsSub');
	old125Sub.SetAttributeString('values', '');
	let old125SubValues = '', old125SubRings = 0;
	old125Sub.SetPanelEvent('onactivate', () => { old125SubRings++; old125SubValues = old125Sub.GetAttributeString('values', ''); });
	H.ctx = mk('Panel', H.root, 'HudMatchStart');
	load(REG);
	advance(1.2);
	assert(!staleHead.IsValid(), 'takeover completes past restorePins and removes old host chrome');
	assert(lifts[0] === '', 'restorePins clears lift attribute without throwing on alias: ' + JSON.stringify(lifts));
	assert(legacyValues.includes('"on":true'), 'legacy <=1.2.4 client receives pushed values via ring(p)');
	assert(old125SubValues.includes('"on":true'), '1.2.5-shaped client receives pushed values on Sub without scan recursion');
	const ringsBefore = old125SubRings;
	const deadSub = mk('Panel', old125, '', 'AddonSettingsSub');
	deadSub.SetAttributeString('dead', '1');
	deadSub.SetAttributeString('values', '');
	$.DispatchEvent('Activated', old125);
	assert(old125SubRings === ringsBefore, 'dead empty Sub child does not trigger re-push on scan');
	old125.SetAttributeString('set', JSON.stringify({ on: false }));
	$.DispatchEvent('Activated', old125);
	assert(!deadSub.IsValid() && old125SubValues.includes('"on":false'), 'push prunes dead Sub child and updates live Sub without scan recursion');
	const ownClient = esc.FindChildTraverse('AddonSettingsClient_deadlock_profile_links');
	assert(!!(ownClient && ownClient.events && typeof ownClient.events.onactivate === 'function'), 'newly planted client panel sets onactivate to absorb bubbling');
	assert(S.errors().length === 0, 'takeover + bubbling regression produces zero script errors');
	assert(!S.info().some(m => /^Addon Settings: (?:take over|scan):/.test(m)), 'no take over or scan error logs: ' + S.info().filter(m => /take over|scan/.test(m)).join(' | '));
}

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
