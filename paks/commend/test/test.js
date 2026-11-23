'use strict';
const fs = require('fs');
const S = require('./panorama.js');
const { H, mk, advance, load, resetCounts, C } = S;
const SRC = fs.readFileSync(process.argv[2] || __dirname + '/../build/pak/panorama/scripts/deadlock_commend.js', 'utf8');
let fails = 0, passes = 0;
const assert = (c, m) => { if (c) passes++; else { fails++; console.log('FAIL', m); } };

const world = (screen) => {
	H.clicks = [];
	H.root = mk('Panel', null, 'UI');
	H.root.cfg = {};
	const post = H.ctx = mk('CitadelPostGameNew', H.root, 'CitadelPostGameNew', 'CanCommendPlayers SelectedScreen_' + screen);
	mk('Label', post, 'MatchID', '', 'match-a');
	const team1 = mk('Panel', post, 'Team1Screen', 'Team1');
	const own = mk('Panel', team1, 'Own', 'Player IsLocalPlayer PlayerActionContainer');
	mk('Label', own, 'PlayerName', 'PlayerName', 'Kai');
	const mate = mk('Panel', team1, 'Mate', 'Player');
	mk('Label', mate, 'PlayerName', 'PlayerName', 'Mate');
	mk('Button', mate, 'CommendPlayerButton');
	mk('Panel', team1, 'TeamReturn', 'CanReturnCommend');
	const team2 = mk('Panel', post, 'Team2Screen', 'Team2');
	const foe = mk('Panel', team2, 'Foe', 'Player');
	mk('Label', foe, 'PlayerName', 'PlayerName', 'Foe');
	mk('Button', foe, 'CommendPlayerButton');
	mk('Panel', team2, 'MVPHeroScenePanelMask');
	const row = mk('Panel', post, 'DcRow_' + screen, 'DcRow');
	['Team', 'Enemy', 'All', 'Return'].forEach(name => {
		const kind = name.toLowerCase();
		const id = 'Dc' + kind.charAt(0).toUpperCase() + kind.slice(1) + '_' + screen;
		mk('Button', row, id, 'DcBtn Dc' + name);
	});
	mk('Button', post, 'ReturnButton');
	return { post, mate, foe };
};

const shown = p => p && p.style.visibility !== 'collapse';
const click = kind => { const id = 'Dc' + kind.charAt(0).toUpperCase() + kind.slice(1) + '_Team1'; H.ctx.FindChildTraverse(id).events.onactivate(); };

world('Team1');
load(SRC);
advance(0);
assert(S.errors().length === 0, 'no errors: ' + S.errors().join(' | '));
assert($.DcTest.VERSION === '2.0.0', 'version');
assert($.DcTest.TICK_S === 0.25, 'tick is 0.25 s');
const row = H.ctx.FindChildTraverse('DcRow_Team1');
assert(shown(row), 'team screen shows its row');
assert(shown(row.FindChild('DcTeam_Team1')), 'team button visible when the switch is on');

click('team');
const activated = H.clicks.filter(c => c.ev === 'Activated').map(c => c.id);
assert(activated.indexOf('CommendPlayerButton') >= 0 && activated.filter(id => id === 'CommendPlayerButton').length === 1, 'team clicks the teammate once: ' + activated.join(','));
assert(activated.indexOf('TeamReturn') >= 0, 'team clicks a return-kind target on the same team: ' + activated.join(','));
assert(activated.indexOf('ReturnButton') < 0, 'a return target with no team is not a team click');
H.clicks = [];
click('team');
assert(H.clicks.length === 0, 'second team click sends nothing');

world('Team1');
load(SRC);
advance(0);
click('enemy');
const enemyIds = H.clicks.filter(c => c.ev === 'Activated').map(c => c.id);
assert(enemyIds.indexOf('CommendPlayerButton') >= 0, 'enemy clicks a foe button');
assert(H.clicks.filter(c => c.ev === 'CitadelPostGameCommendPlayer').some(c => c.id === 'MVPHeroScenePanelMask'), 'enemy also fires the mask event');
const foeBtn = H.ctx.FindChildTraverse('Team2Screen').FindChildTraverse('CommendPlayerButton');
assert(foeBtn.GetAttributeString('dcHit', '') === '1', 'clicked foe is marked');

const details = mk('Panel', H.ctx.FindChildTraverse('Team2Screen'), 'Det', 'MVPDetails');
mk('Label', details, 'MVPPlayerName', '', 'Foe');
const mvpMask = mk('Panel', details, 'MVPHeroScenePanelMask');
assert($.DcTest.ownerOf(mvpMask).id === 'Det', 'MVP mask owner is .MVPDetails, not the mask');
const owner = mk('Panel', H.root, 'Owner', 'Player');
const mid = mk('Panel', owner, 'Mid');
const named = mk('Panel', mid, 'PlayerName');
mk('Label', named, 'Leaf', '', '  Nested  Name  ');
assert($.DcTest.ownerName(owner) === 'nested  name', 'name is the nested label, inner spaces kept: ' + $.DcTest.ownerName(owner));
const ordered = mk('Panel', H.root, 'Ordered');
mk('Label', ordered, 'A', '', 'First');
mk('Label', ordered, 'B', '', 'Second');
assert($.DcTest.firstText(ordered) === 'first', 'search visits child 0 before later siblings: ' + $.DcTest.firstText(ordered));

world('Team1');
load(SRC);
advance(0);
click('all');
assert(H.ctx.BHasClass('DcAllDone'), 'all sets DcAllDone');
assert(!shown(H.ctx.FindChildTraverse('DcRow_Team1')), 'all hides the row immediately');
H.ctx.RemoveClass('SelectedScreen_Team1');
H.ctx.AddClass('SelectedScreen_Team2');
$.DcApply();
assert(!shown(H.ctx.FindChildTraverse('DcRow_Team1')), 'all keeps the row hidden on the next screen');

world('Team1');
load(SRC);
advance(0);
H.clicks = [];
click('return');
assert(H.clicks.some(c => c.id === 'ReturnButton' && c.ev === 'CitadelPostGameCommendPlayer'), 'return fires CitadelPostGameCommendPlayer');
assert(shown(H.ctx.FindChildTraverse('DcRow_Team1')), 'return leaves the row up');

const bag = H.root.cfg.DcCommend;
bag.on = false;
$.DcApply();
assert(!shown(H.ctx.FindChildTraverse('DcRow_Team1').FindChild('DcTeam_Team1')), 'switch off hides the buttons');
bag.on = true;
$.DcApply();
assert(shown(H.ctx.FindChildTraverse('DcRow_Team1').FindChild('DcAll_Team1')), 'switch on shows the buttons again');

H.ctx.RemoveClass('CanCommendPlayers');
$.DcApply();
assert(!shown(H.ctx.FindChildTraverse('DcRow_Team1')), 'no CanCommendPlayers hides the row');
H.ctx.AddClass('CanCommendPlayers');
H.ctx.FindChildTraverse('MatchID')._text = 'match-b';
$.DcApply();
assert(!H.ctx.BHasClass('DcAllDone'), 'a new match id clears all-done');
assert(shown(H.ctx.FindChildTraverse('DcRow_Team1')), 'a new match shows the row again');

resetCounts();
advance(1);
assert(C.styleWrites === 0, 'a quiet second does not restyle: ' + C.styleWrites);
assert(C.sched >= 3 && C.sched <= 5, 'timer stays at 0.25 s: ' + C.sched);

H.ctx.RemoveClass('SelectedScreen_Team1');
H.ctx.AddClass('SelectedScreen_Graphs');
$.DcApply();
assert(!shown(H.ctx.FindChildTraverse('DcRow_Team1')), 'graphs shows no row');

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
