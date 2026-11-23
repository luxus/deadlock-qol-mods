const VERSION = '2.0.0';
const TICK_S = 0.25;
const SCREENS = ['MVP', 'Team1', 'Team2', 'Scoreboard'];
const KINDS = ['team', 'enemy', 'all', 'return'];
const LOCAL_CLASS = ['IsLocalPlayer', 'LocalPlayer', 'local_player', 'IsLocal', 'TotalsRow'];
const DONE_CLASS = ['CommendedPlayer', 'AlreadyCommended', 'CommendReturned', 'CantCommend', 'MVPCantCommend'];
const OWNER_CLASS = ['MVPHonorableMention', 'CanReturnCommend', 'Player', 'MVPDetails'];

const say = m => { try { $.Msg('Deadlock Commend: ' + m); } catch (e) { /* no console */ } };
const ok = p => !!(p && p.IsValid && p.IsValid());
const has = (p, c) => { try { return ok(p) && p.BHasClass && p.BHasClass(c); } catch (e) { return false; } };
const pid = p => { try { return ok(p) ? String(p.id || '') : ''; } catch (e) { return ''; } };
const cancel = h => { if (h) { try { $.CancelScheduled(h); } catch (e) { /* ran */ } } return null; };

const ctx = $.GetContextPanel();
const state = { timer: null, rows: [], bound: false, matchLabel: null, canPanel: null, sig: '' };

const top = () => {
	let a = ctx, last = ctx;
	while (ok(a)) { last = a; a = a.GetParent(); }
	return last;
};
// SG-C3: depth-first, the panel before its children, children in layout order, no visit cap.
const walk = (root, fn) => {
	const go = p => {
		if (!ok(p)) return;
		fn(p);
		const c = p.GetChildCount ? p.GetChildCount() : 0;
		for (let i = 0; i < c; i++) go(p.GetChild(i));
	};
	go(root);
};
const flagged = (p, classes, ids, depth) => {
	for (let n = 0, a = p; ok(a) && n < depth; a = a.GetParent(), n++) {
		if (ids && ids.indexOf(pid(a)) >= 0) return true;
		for (let i = 0; i < classes.length; i++) if (has(a, classes[i])) return true;
	}
	return false;
};
const ours = p => has(p, 'DcBtn') || has(p, 'DcRow') || pid(p).indexOf('Dc') === 0;
const plain = value => String(value == null ? '' : value).replace(/<[^>]*>/g, ' ').replace(/^\s+|\s+$/g, '').toLowerCase();
const firstText = p => {
	let hit = '';
	walk(p, node => {
		if (hit) return;
		let t = '';
		try { t = plain(node.text); } catch (e) { t = ''; }
		if (t) hit = t;
	});
	return hit;
};
const findDesc = (root, pred) => {
	let hit = null;
	walk(root, p => { if (!hit && pred(p)) hit = p; });
	return hit;
};
// The mask is only the fallback. An owner class further up, such as .MVPDetails, wins.
const ownerOf = target => {
	let mask = null;
	for (let n = 0, a = target; ok(a) && n < 64; a = a.GetParent(), n++) {
		for (let i = 0; i < OWNER_CLASS.length; i++) if (has(a, OWNER_CLASS[i])) return a;
		if (!mask && pid(a) === 'MVPHeroScenePanelMask') mask = a;
	}
	return mask || target;
};
// SG-C1: the name panel can sit any number of levels down, and its text can sit in a child label.
const ownerName = owner => {
	if (!ok(owner)) return '';
	const named = findDesc(owner, p => pid(p) === 'PlayerName')
		|| findDesc(owner, p => pid(p) === 'MVPPlayerName')
		|| findDesc(owner, p => has(p, 'PlayerName'));
	return ok(named) ? firstText(named) : '';
};
const teamOf = p => {
	for (let n = 0, a = p; ok(a) && n < 64; a = a.GetParent(), n++) {
		const id = pid(a);
		if (id === 'Team1' || id.indexOf('Team1') === 0) return 'Team1';
		if (id === 'Team2' || id.indexOf('Team2') === 0) return 'Team2';
		if (has(a, 'Team1') || has(a, 'team1')) return 'Team1';
		if (has(a, 'Team2') || has(a, 'team2')) return 'Team2';
	}
	return '';
};
const isLocal = p => flagged(p, LOCAL_CLASS, ['LocalPlayerIdentifier'], 50);

// SPEC-OPEN O-C1: SelectedScreen_* is read on this layout and its ancestors.
const screenNow = () => {
	for (let n = 0, a = ctx; ok(a) && n < 12; a = a.GetParent(), n++) {
		for (let i = 0; i < SCREENS.length; i++) if (has(a, 'SelectedScreen_' + SCREENS[i])) return SCREENS[i];
	}
	return '';
};
// SPEC-OPEN O-C2: ReturnButton and CanReturnCommend are checked even though Build 6864 layouts omit them.
const kindOf = p => {
	if (!ok(p) || ours(p)) return '';
	const id = pid(p);
	if (id === 'CommendPlayerButton' || id === 'MVPCommendButton' || has(p, 'CommendButton')) return 'button';
	if (id === 'HeroScenePanelMask' || id === 'MVPHeroScenePanelMask') return 'mask';
	if (id === 'ReturnButton' || has(p, 'CanReturnCommend')) return 'return';
	return '';
};
const canNow = () => {
	if (ok(state.canPanel) && has(state.canPanel, 'CanCommendPlayers')) return true;
	for (let n = 0, a = ctx; ok(a) && n < 12; a = a.GetParent(), n++) {
		if (has(a, 'CanCommendPlayers')) { state.canPanel = a; return true; }
		try { if (a.BAscendantHasClass && a.BAscendantHasClass('CanCommendPlayers')) { state.canPanel = a; return true; } } catch (e) { /* no method */ }
	}
	let found = null;
	walk(ctx, p => { if (!found && has(p, 'CanCommendPlayers')) found = p; });
	state.canPanel = found;
	return !!found;
};
const matchText = () => {
	if (!ok(state.matchLabel)) {
		let label = null;
		walk(top(), p => { if (!label && pid(p) === 'MatchID') label = p; });
		state.matchLabel = label;
	}
	if (!ok(state.matchLabel)) return '';
	try { return tidy(state.matchLabel.text); } catch (e) { return ''; }
};
const paint = (p, on) => {
	if (!ok(p)) return;
	const vis = on ? 'visible' : 'collapse';
	const op = on ? '1' : '0';
	if (p.style.visibility !== vis) p.style.visibility = vis;
	if (String(p.style.opacity) !== op) p.style.opacity = op;
	if (p.enabled !== on) p.enabled = on;
	if (p.hittest !== on) p.hittest = on;
};
const buttonId = (kind, screen) => 'Dc' + kind.charAt(0).toUpperCase() + kind.slice(1) + '_' + screen;
const bind = () => {
	if (state.bound || !ok(ctx)) return;
	const rows = [];
	for (let i = 0; i < SCREENS.length; i++) {
		const screen = SCREENS[i];
		const panel = ctx.FindChildTraverse ? ctx.FindChildTraverse('DcRow_' + screen) : null;
		if (!ok(panel)) continue;
		const buttons = {};
		for (let k = 0; k < KINDS.length; k++) {
			const kind = KINDS[k];
			const b = panel.FindChild(buttonId(kind, screen));
			if (!ok(b)) continue;
			b.SetPanelEvent('onactivate', () => act(kind));
			buttons[kind] = b;
		}
		rows.push({ screen: screen, panel: panel, buttons: buttons });
	}
	if (!rows.length) return;
	state.rows = rows;
	state.bound = true;
};
const ownTeam = root => {
	let team = '';
	walk(root, p => {
		if (team) return;
		if (has(p, 'PlayerActionContainer') && isLocal(p)) team = teamOf(p);
	});
	if (team) return team;
	walk(root, p => {
		if (team) return;
		if (has(p, 'LocalPlayer') || has(p, 'Local') || has(p, 'IsLocalPlayer') || has(p, 'local_player')) team = teamOf(p);
	});
	return team;
};
const marked = p => { try { return ok(p) && p.GetAttributeString('dcHit', '') === '1'; } catch (e) { return false; } };
const mark = (p, on) => { try { if (ok(p)) p.SetAttributeString('dcHit', on ? '1' : ''); } catch (e) { /* no attrs */ } };
const clearMarks = () => { walk(top(), p => { if (marked(p)) mark(p, false); }); };
const excluded = (target, owner, kind) => {
	if (isLocal(target) || isLocal(owner)) return true;
	if (kind === 'return') return false;
	if (marked(target)) return true;
	if (flagged(target, DONE_CLASS, [], 40) || flagged(owner, DONE_CLASS, [], 40)) return true;
	if (kindOf(target) === 'mask' && (flagged(target, ['MVPAlreadyCommended'], [], 40) || flagged(owner, ['MVPAlreadyCommended'], [], 40))) return true;
	return false;
};
// SPEC-OPEN O-C3: masks and returns get the event trio plus CitadelPostGameCommendPlayer.
const fire = (p, kind) => {
	try { $.DispatchEvent('Activated', p, 'mouse'); } catch (e) { /* missing */ }
	try { $.DispatchEvent('MouseActivate', p, 'mouse'); } catch (e2) { /* missing */ }
	try { $.DispatchEvent('onactivate', p); } catch (e3) { /* missing */ }
	if (kind === 'mask' || kind === 'return') {
		try { $.DispatchEvent('CitadelPostGameCommendPlayer', p); } catch (e4) { /* missing */ }
	}
};
const act = kind => {
	if (!canNow()) return;
	const root = top();
	const mine = ownTeam(root);
	const order = { button: 0, mask: 1, return: 2 };
	const targets = [];
	walk(root, p => {
		const k = kindOf(p);
		if (k) targets.push({ p: p, i: targets.length });
	});
	targets.sort((a, b) => order[kindOf(a.p)] - order[kindOf(b.p)] || a.i - b.i);
	const seen = {};
	let hits = 0;
	for (let i = 0; i < targets.length; i++) {
		const target = targets[i].p;
		const k = kindOf(target);
		if (kind !== 'all' && kind !== 'return' && k === 'return') continue;
		if (kind === 'return' && k !== 'return') continue;
		if (kind !== 'return' && k === 'return') continue;
		const owner = ownerOf(target);
		if (excluded(target, owner, kind)) continue;
		const team = teamOf(owner) || teamOf(target);
		if (kind === 'team' && (!mine || !team || team !== mine)) continue;
		if (kind === 'enemy' && (!mine || !team || team === mine)) continue;
		const name = ownerName(owner);
		if (kind !== 'return' && name) {
			if (seen[name]) continue;
			seen[name] = true;
		}
		fire(target, k);
		hits++;
		if (kind === 'return') mark(target, false);
		else mark(target, true);
	}
	// SPEC-OPEN O-C4: no per-match cap. Every target that passes the filters is clicked.
	if (kind === 'all') {
		const bag = dcBag();
		bag.all = true;
		try { ctx.AddClass('DcAllDone'); } catch (e) { /* no class api */ }
		apply(true);
	}
	return hits;
};
const apply = force => {
	if (!ok(ctx)) return;
	bind();
	const bag = dcBag();
	const id = matchText();
	if (id && id !== bag.match) {
		bag.match = id;
		bag.all = false;
		try { ctx.RemoveClass('DcAllDone'); } catch (e) { /* no class api */ }
		clearMarks();
		state.sig = '';
	}
	if (has(ctx, 'DcAllDone')) bag.all = true;
	const screen = screenNow();
	const can = canNow();
	const on = !!bag.on;
	const sig = (bag.match || '') + '|' + screen + '|' + (can ? '1' : '0') + '|' + (bag.all ? '1' : '0') + '|' + (on ? '1' : '0') + '|' + state.rows.length;
	if (!force && sig === state.sig) return;
	state.sig = sig;
	for (let i = 0; i < state.rows.length; i++) {
		const row = state.rows[i];
		const show = can && !bag.all && screen === row.screen;
		paint(row.panel, show);
		for (let k = 0; k < KINDS.length; k++) paint(row.buttons[KINDS[k]], show && on);
	}
};
const arm = () => {
	state.timer = cancel(state.timer);
	if (!ok(ctx)) return;
	state.timer = $.Schedule(TICK_S, () => {
		state.timer = null;
		if (!ok(ctx)) return;
		try { apply(false); } catch (e) { say('tick ' + (e && e.message ? e.message : e)); }
		arm();
	});
};
$.DcApply = () => { if (ok(ctx)) apply(true); };
if (ok(ctx)) {
	try { apply(true); } catch (e) { say('load ' + (e && e.message ? e.message : e)); }
	arm();
}
$.DcTest = { VERSION: VERSION, TICK_S: TICK_S, act: act, apply: apply, kindOf: kindOf, teamOf: teamOf, ownerOf: ownerOf, ownerName: ownerName, firstText: firstText };
