try { $.Msg('LR-diag script-entry'); } catch (e0) { /* no console */ }
const VERSION = '0.2.1';
const DUO_DEFAULT = true;
const PARTY_URL = 'https://luxus.github.io/deadlock-mods/party/';
const PARTY_PREFIX = 'LRPARTY1 ';
const PARTY_TIMEOUT_S = 20;
const PROBE_DELAYS = [0.05, 0.15, 0.3, 0.6];
const PROBE_TRIES = 2;
const DISMISS_S = 0.5;
const PARTY_COLORS = 6;
const RANKS_DEFAULT = true;
const TICK_S = 1;
const API_BASE = 'https://api.deadlock-api.com/v1/players';
const BADGE_ID = 'LrBadge';

const cfg = { on: RANKS_DEFAULT, duo: DUO_DEFAULT };
const say = m => { try { $.Msg('Deadlock Lobby Ranks: ' + m); } catch (e) { /* no console */ } };
const ok = p => !!(p && p.IsValid && p.IsValid());
const diag = m => { try { $.Msg('LR-diag ' + m); } catch (e) { /* no console */ } };
const _diagSeen = {};
const diagChange = (key, val, m) => { if (_diagSeen[key] === val) return; _diagSeen[key] = val; diag(m); };
const panelId = p => {
	if (!ok(p)) return 'missing';
	let id = '', typ = '';
	try { id = String(p.id || ''); } catch (e) { /* */ }
	try { typ = String(p.paneltype || ''); } catch (e2) { /* */ }
	return (typ || 'Panel') + '#' + (id || '?');
};
const cancel = h => { if (h) { try { $.CancelScheduled(h); } catch (e) { /* ran */ } } return null; };
const show = (p, on) => { const v = on ? 'visible' : 'collapse'; if (!ok(p) || p.style.visibility === v) return; p.style.visibility = v; };
const guard = (name, fn) => { try { return fn(); } catch (e) { say(name + ' failed: ' + (e && e.message ? e.message : e)); return undefined; } };

const parseAccount = value => {
	const text = tidy(value);
	if (!text || /[{}]/.test(text) || text.charAt(0) === '#' || /^nan$/i.test(text)) return '';
	const exact = parseExactAccount(text);
	if (exact !== null) return exact;
	const found = [];
	scanSteamTokens(text, found);
	return found.length === 1 ? found[0] : '';
};
const agree = (hidden, visible) => {
	const h = parseAccount(hidden), v = parseAccount(visible);
	if (h && v && h !== v) return '';
	return h || v;
};
const rankUrl = id => { const a = parseAccount(id); return a ? API_BASE + '/' + encodeURIComponent(a) + '/rank/image?format=webp' : ''; };

const top = () => { let a = $.GetContextPanel(), last = a; while (ok(a)) { last = a; a = a.GetParent(); } return last; };
const st = () => {
	const r = top();
	if (!ok(r)) return { timer: null, list: null };
	if (!r.Lr) r.Lr = { timer: null, list: null, roster: null, probe: null, party: null, dismiss: null };
	return r.Lr;
};
const readText = p => { if (!ok(p)) return ''; try { return String(p.text || ''); } catch (e) { return ''; } };

// ---------- where we are: Esc menu open, not in the Hideout (same gate as the reference) ----------
const ancestor = test => { for (let p = $.GetContextPanel(), n = 0; ok(p) && n < 64; p = p.GetParent(), n++) { if (test(p)) return p; } return null; };
const typeOf = p => { try { return String(p.paneltype || ''); } catch (e) { return ''; } };
const escapeMenu = () => ancestor(p => typeOf(p) === 'CitadelHudEscapeMenu');
const hudRoot = () => ancestor(p => typeOf(p) === 'CitadelHud' && p.id === 'Hud');
const hasCls = (p, c) => { try { return ok(p) && p.BHasClass && p.BHasClass(c); } catch (e) { return false; } };
const escOpen = () => { const h = hudRoot(); return ok(h) && hasCls(h, 'ShowEscapeMenu'); };
const inHideout = () => { const h = hudRoot(); return hasCls(h, 'connectedToHideout') || hasCls(h, 'InHideout') || !!(ok(h) && h.BAscendantHasClass && h.BAscendantHasClass('connectedToHideout')); };
const mayProbe = () => escOpen() && !inHideout();

// ---------- rows ----------
const ROW_TYPE = 'CitadelPlayersListEntry';
// Rows are only CitadelPlayersListEntry children of a .Team's #TeamEntries. Never fall back to the
// list or #Teams: the game owns #Teams and crashes on any foreign child ("Unable to find child
// 'TeamControls'", lea console 22.11. 09:40:10).
const entries = root => {
	const out = [];
	if (!ok(root) || !root.FindChildrenWithClassTraverse) return out;
	const teams = root.FindChildrenWithClassTraverse('Team') || [];
	for (let t = 0; t < teams.length; t++) {
		const holder = ok(teams[t]) ? teams[t].FindChildTraverse('TeamEntries') : null;
		if (!ok(holder) || !holder.GetChildCount) continue;
		const n = holder.GetChildCount();
		for (let i = 0; i < n; i++) {
			const e = holder.GetChild(i);
			let typ = '';
			try { typ = String(e.paneltype || ''); } catch (x) { /* */ }
			if (ok(e) && typ === ROW_TYPE) { e._lrTeam = t; out.push(e); }
		}
	}
	return out;
};
const rowName = row => {
	const labels = row.FindChildrenWithClassTraverse ? row.FindChildrenWithClassTraverse('PlayerName') : [];
	const l = labels && labels.length ? labels[0] : null;
	return tidy(readText(l)) || panelId(row);
};
// Rows are keyed by hero (hidden {g:citadel_hero_name:hero_id} label from the entry hook, like the
// reference); the player name is only a fallback when that label is missing or empty.
const rowHero = row => { const l = ok(row) ? row.FindChildTraverse('LrRowHero') : null; const t = tidy(readText(l)).toLowerCase(); return t && t.charAt(0) !== '#' && !/[{}]/.test(t) ? t : ''; };
const rowKey = row => { const h = rowHero(row); return (row._lrTeam || 0) + ':' + (h ? 'hero=' + h : 'name=' + rowName(row)); };
const hostFor = row => { const main = ok(row) ? row.FindChildTraverse('MainContents') : null; return ok(main) ? main : null; };

// ---------- profile card (the game's player context menu) ----------
const CARD_TYPE = 'CitadelProfileCard';
const findCards = () => {
	const out = [];
	const r = top();
	if (!ok(r)) return out;
	const queue = [r];
	let head = 0;
	while (head < queue.length && head < 8000) {
		const p = queue[head++];
		let t = '';
		try { t = String(p.paneltype || ''); } catch (e) { /* */ }
		if (t === CARD_TYPE) { out.push(p); continue; }
		const n = p.GetChildCount ? p.GetChildCount() : 0;
		for (let i = 0; i < n; i++) { const k = p.GetChild(i); if (ok(k)) queue.push(k); }
	}
	return out;
};
const numberIn = text => { const m = /(^|\D)(\d{5,10})(?!\d)/.exec(tidy(text).replace(/(\d)[,.'\u2019\u00a0 ](?=\d{3}(?!\d))/g, '$1')); if (!m) return ''; const id = stripZeros(m[2]); return inRange(id) ? id : ''; };
const cardAccount = card => {
	if (!ok(card)) return { id: '', via: 'none', text: '' };
	const pl = ['PlAccountId', 'PlAccountIdDirect'];
	for (let i = 0; i < pl.length; i++) { const t = readText(card.FindChildTraverse(pl[i])); const id = parseAccount(t); if (id) return { id: id, via: pl[i], text: t }; }
	const user = card.FindChildTraverse('UserName');
	if (ok(user)) {
		let v = '';
		try { v = parseAccount(user.accountid); } catch (e) { /* */ }
		if (!v) v = parseAccount(user.GetAttributeString('accountid', ''));
		if (v) return { id: v, via: 'UserName.accountid', text: v };
	}
	const keys = ['accountid', 'account_id'];
	for (let i = 0; i < keys.length; i++) { const v = parseAccount(card.GetAttributeString(keys[i], '')); if (v) return { id: v, via: 'attr:' + keys[i], text: v }; }
	const box = card.FindChildTraverse('AccountID');
	let text = '';
	if (ok(box)) {
		const ls = box.FindChildrenWithClassTraverse ? box.FindChildrenWithClassTraverse('AccountID') : [];
		text = readText(ls && ls.length ? ls[0] : box);
		const id = numberIn(text);
		if (id) return { id: id, via: 'AccountID label', text: text };
	}
	try { const t = $.Localize('{i:r:account_id}', card); const id = parseAccount(t); if (id) return { id: id, via: 'localize', text: t }; } catch (e) { /* */ }
	return { id: '', via: 'none', text: text };
};
const dismissMenus = () => {
	try { if (typeof DismissAllContextMenus === 'function') DismissAllContextMenus(); else $.DispatchEvent('DismissAllContextMenus'); } catch (e) { /* */ }
	try { if (typeof DropInputFocus === 'function') DropInputFocus(); else $.DispatchEvent('DropInputFocus'); } catch (e) { /* */ }
};
const snapshot = () => findCards().map(c => ({ c: c, id: cardAccount(c).id }));
const freshCard = before => {
	const cards = findCards();
	let hit = null, count = 0;
	cards.forEach(c => {
		const prev = before.find(b => b.c === c);
		const a = cardAccount(c);
		if (a.id && (!prev || prev.id !== a.id)) { hit = { card: c, acc: a }; count++; }
	});
	if (count === 1) return hit;
	return count > 1 ? { many: count } : null;
};

// ---------- roster: cached per match (same set of rows) ----------
const roster = (s, rows) => {
	const sig = rows.map(rowKey).sort().join('|');
	if (!s.roster || s.roster.sig !== sig) {
		const keep = s.roster ? s.roster.ids : {};
		s.roster = { sig: sig, ids: {}, tries: {}, via: {} };
		rows.forEach(r => { const k = rowKey(r); if (keep[k]) s.roster.ids[k] = keep[k]; });
		diag('roster rows=' + rows.length + ' cached=' + Object.keys(s.roster.ids).length);
	}
	return s.roster;
};
const probeNext = s => {
	if (s.probe || !wanted() || !ok(s.list) || !visible(s.list)) return;
	if (!mayProbe()) { diagChange('gate', (escOpen() ? 'esc' : 'noesc') + (inHideout() ? ':hideout' : ''), 'probe gate esc=' + escOpen() + ' hideout=' + inHideout()); return; }
	const rows = entries(s.list);
	const R = roster(s, rows);
	const row = rows.find(r => !R.ids[rowKey(r)] && (R.tries[rowKey(r)] || 0) < PROBE_TRIES);
	if (!row) {
		if (s.probed) { s.probed = false; s.dismiss = cancel(s.dismiss); s.dismiss = $.Schedule(DISMISS_S, () => { s.dismiss = null; if (!s.probe) { dismissMenus(); diag('probes finished, menu dismissed'); } }); }
		return;
	}
	const key = rowKey(row);
	R.tries[key] = (R.tries[key] || 0) + 1;
	const pr = s.probe = { key: key, step: 0, before: snapshot(), sig: R.sig, timer: null };
	const done = (acc, card) => {
		s.probe = null;
		s.probed = true;
		if (!ok(row) || rowKey(row) !== pr.key) { acc = { id: '', via: 'hero changed', text: '' }; card = 'stale'; }
		if (s.roster && s.roster.sig === pr.sig && acc.id) { s.roster.ids[pr.key] = acc.id; s.roster.via[pr.key] = acc.via; }
		diag('probe row=' + pr.key + ' try=' + R.tries[pr.key] + ' card=' + card + ' via=' + acc.via + ' text="' + String(acc.text || '').slice(0, 60) + '" id=' + (acc.id || 'none'));
		guard('sync', () => syncList(s));
		$.Schedule(0.1, () => guard('probe', () => probeNext(s)));
	};
	const check = () => {
		pr.timer = null;
		if (s.probe !== pr) return;
		const got = freshCard(pr.before);
		if (got && got.acc) { done(got.acc, 'found'); return; }
		if (got && got.many) { done({ id: '', via: 'ambiguous', text: got.many + ' cards' }, 'many'); return; }
		pr.step++;
		if (pr.step < PROBE_DELAYS.length) { pr.timer = $.Schedule(PROBE_DELAYS[pr.step] - PROBE_DELAYS[pr.step - 1], check); return; }
		const cards = findCards();
		done(cards.length ? cardAccount(cards[cards.length - 1]) : { id: '', via: 'none', text: '' }, cards.length ? 'noid' : 'none');
	};
	const target = hostFor(row);
	if (!ok(target)) { done({ id: '', via: 'no MainContents', text: '' }, 'none'); return; }
	try { $.DispatchEvent('Activated', target, 'mouse'); } catch (e) { diag('probe activate failed ' + (e && e.message ? e.message : e)); }
	pr.timer = $.Schedule(PROBE_DELAYS[0], check);
};

// ---------- party bridge: hidden HTML panel, result arrives in the page title ----------
const partyPanel = s => {
	if (s.party && (s.party.dead || ok(s.party.panel))) return s.party;
	const host = escapeMenu();
	if (!ok(host)) { diag('party bridge skipped (no CitadelHudEscapeMenu ancestor)'); s.party = { panel: null, dead: true }; return s.party; }
	let panel = null;
	try { panel = $.CreatePanel('CitadelHTMLPanel', host, 'LrPartyBridge'); } catch (e) { panel = null; }
	if (!ok(panel) || typeof panel.SetURL !== 'function') { diag('party bridge unavailable (no HTML panel)'); s.party = { panel: null, dead: true }; return s.party; }
	panel.AddClass('LrPartyBridge');
	panel.hittest = false;
	try { panel.visible = false; } catch (e) { /* */ }
	const pp = s.party = { panel: panel, want: '', nonce: '', seq: 0, groups: null, timer: null };
	$.RegisterEventHandler('HTMLTitle', panel, function () {
		for (let i = 0; i < arguments.length; i++) { const a = arguments[i]; if (typeof a === 'string' && a.indexOf(PARTY_PREFIX) === 0) { partyResult(s, pp, a); return; } }
	});
	$.RegisterEventHandler('HTMLURLChanged', panel, function () {
		for (let i = 0; i < arguments.length; i++) {
			const a = arguments[i];
			if (typeof a !== 'string' || a.indexOf(PARTY_URL) !== 0 || a.indexOf('#') < 0) continue;
			let frag = '';
			try { frag = decodeURIComponent(a.slice(a.indexOf('#') + 1)); } catch (e) { return; }
			if (frag.indexOf(PARTY_PREFIX) === 0) { partyResult(s, pp, frag); return; }
		}
	});
	return pp;
};
const partyResult = (s, pp, title) => {
	let r = null;
	try { r = JSON.parse(title.slice(PARTY_PREFIX.length)); } catch (e) { diag('party bad title ' + title.slice(0, 80)); return; }
	if (!r || r.n !== pp.nonce) return;
	pp.timer = cancel(pp.timer);
	if (!r.ok) { diag('party error ' + String(r.e || '?')); pp.groups = {}; return; }
	const map = {};
	(Array.isArray(r.g) ? r.g : []).forEach((g, gi) => (Array.isArray(g) ? g : []).forEach(id => { map[String(id)] = { color: gi % PARTY_COLORS, size: g.length }; }));
	pp.groups = map;
	diag('party groups=' + (Array.isArray(r.g) ? r.g.length : 0) + ' members=' + Object.keys(map).length + ' profiles=' + (r.c || 0));
	guard('sync', () => syncList(s));
};
const partyRequest = (s, rows) => {
	if (!cfg.duo || !s.roster || !settingsSeen) return;
	if (rows.some(r => !s.roster.ids[rowKey(r)] && (s.roster.tries[rowKey(r)] || 0) < PROBE_TRIES)) return; // wait until probing settles
	const teams = [[], []];
	rows.forEach(r => { const id = s.roster.ids[rowKey(r)]; if (id) teams[r._lrTeam ? 1 : 0].push(id); });
	if (teams[0].length + teams[1].length < 2) return;
	const want = teams[0].slice().sort().join(',') + '|' + teams[1].slice().sort().join(',');
	const pp = partyPanel(s);
	if (pp.dead || pp.want === want) return;
	pp.want = want; pp.groups = null; pp.seq++;
	pp.nonce = 'r' + pp.seq.toString(36) + Math.floor(Math.random() * 1e9).toString(36);
	const url = PARTY_URL + '?v=1&n=' + pp.nonce + '&a=' + teams[0].join(',') + '&b=' + teams[1].join(',');
	diag('party request ' + url);
	try { pp.panel.SetURL(url); } catch (e) { diag('party SetURL failed ' + (e && e.message ? e.message : e)); return; }
	pp.timer = cancel(pp.timer);
	pp.timer = $.Schedule(PARTY_TIMEOUT_S, () => { pp.timer = null; if (!pp.groups) { diag('party timeout after ' + PARTY_TIMEOUT_S + 's'); pp.groups = {}; } });
};

// ---------- drawing: [party stack][rank] at the right edge of the row ----------
const rightBox = host => {
	let box = host.FindChild('LrRight');
	if (!ok(box)) { box = $.CreatePanel('Panel', host, 'LrRight'); box.AddClass('LrRight'); box.hittest = false; }
	return box;
};
const drawParty = (box, id, s) => {
	const g = id && cfg.duo && s.party && s.party.groups ? s.party.groups[id] : null;
	let stack = box.FindChild('LrParty');
	if (!g) { if (ok(stack)) show(stack, false); return; }
	if (!ok(stack)) {
		stack = $.CreatePanel('Panel', box, 'LrParty'); stack.AddClass('LrParty'); stack.hittest = false;
		const badge = box.FindChild(BADGE_ID);
		if (ok(badge) && box.MoveChildBefore) box.MoveChildBefore(stack, badge);
	}
	const sig = g.color + ':' + g.size;
	if (stack.GetAttributeString('party', '') !== sig) {
		stack.SetAttributeString('party', sig);
		for (let c = 0; c < PARTY_COLORS; c++) stack.SetHasClass('LrPartyC' + c, c === g.color);
		const n = Math.max(2, Math.min(6, g.size));
		for (let i = 0; i < 6; i++) {
			let icon = stack.FindChild('LrPartyIcon' + i);
			if (i < n && !ok(icon)) { icon = $.CreatePanel('Image', stack, 'LrPartyIcon' + i); icon.AddClass('LrPartyIcon'); icon.hittest = false; if (icon.SetImage) icon.SetImage('s2r://panorama/images/icons/icon_player.vsvg'); }
			if (ok(icon)) show(icon, i < n);
		}
	}
	show(stack, true);
};
const ensureBadge = (row, id, s) => {
	const host = hostFor(row);
	if (!ok(host)) return;
	const box = rightBox(host);
	let badge = box.FindChild(BADGE_ID);
	const url = id ? rankUrl(id) : '';
	if (!url) { if (ok(badge)) show(badge, false); drawParty(box, '', s); return; }
	if (!ok(badge)) {
		badge = $.CreatePanel('Image', box, BADGE_ID);
		badge.AddClass('LrBadge');
		badge.hittest = false;
		if (badge.SetScaling) badge.SetScaling('stretch-to-fit-preserve-aspect');
		try { $.RegisterEventHandler('ImageFailedLoad', badge, () => { show(badge, false); diag('image failed src=' + badge.GetAttributeString('rankurl', '')); }); } catch (e) { /* */ }
	}
	if (badge.GetAttributeString('rankurl', '') !== url) {
		badge.SetAttributeString('account', id);
		badge.SetAttributeString('rankurl', url);
		try { badge.SetImage(url); diag('image set src=' + url + ' row=' + rowKey(row)); } catch (e2) { diag('image set failed ' + (e2 && e2.message ? e2.message : e2)); show(badge, false); return; }
	}
	show(badge, true);
	drawParty(box, id, s);
};
const hideRow = row => { if (!ok(row)) return; const box = row.FindChildTraverse('LrRight'); if (ok(box)) show(box, false); };
const showRow = row => { const box = row.FindChildTraverse('LrRight'); if (ok(box)) show(box, true); };

const rowAccount = (s, row) => {
	return s.roster ? (s.roster.ids[rowKey(row)] || '') : '';
};
const syncList = s => {
	const list = s.list;
	if (!ok(list) || !wanted()) return;
	const rows = entries(list);
	const R = roster(s, rows);
	let withId = 0;
	rows.forEach(row => {
		const id = rowAccount(s, row);
		if (id) { withId++; R.ids[rowKey(row)] = id; }
		showRow(row);
		ensureBadge(row, id, s);
	});
	const g = s.party && s.party.groups ? Object.keys(s.party.groups).length : -1;
	diagChange('sync', rows.length + ':' + withId + ':' + g, 'sync entries=' + rows.length + ' withAccount=' + withId + ' partyMembers=' + (g < 0 ? 'pending' : g));
	partyRequest(s, rows);
};

const visible = p => {
	try {
		if (p.IsVisible && !p.IsVisible()) return false;
		if (p.visible === false) return false;
	} catch (e) { /* assume shown */ }
	return true;
};

const wanted = () => !!cfg.on;
const tick = () => {
	const s = st();
	s.timer = null;
	if (!wanted()) { if (ok(s.list)) entries(s.list).forEach(hideRow); AddonSettings.pulse(); return; }
	guard('sync', () => {
		if (!ok(s.list)) return;
		if (!visible(s.list)) { diagChange('tick', 'hidden', 'list not visible'); return; }
		diagChange('tick', 'shown', 'list visible');
		syncList(s);
		probeNext(s);
	});
	if (wanted() && ok(s.list)) s.timer = $.Schedule(TICK_S, tick);
	AddonSettings.pulse();
};
const kick = () => { const s = st(); s.timer = cancel(s.timer); tick(); };
const stop = () => {
	const s = st();
	s.timer = cancel(s.timer);
	s.dismiss = cancel(s.dismiss);
	if (s.probe) { s.probe.timer = cancel(s.probe.timer); s.probe = null; }
	s.probed = false;
	if (s.party) s.party.timer = cancel(s.party.timer);
	if (ok(s.list)) entries(s.list).forEach(hideRow);
};
const attach = () => {
	const ctx = $.GetContextPanel();
	if (!ok(ctx)) { diag('attach ctx missing'); return; }
	st().list = ctx;
	diag('attach list=' + panelId(ctx));
};
const settingsChanged = () => { if (wanted()) { attach(); const s = st(); if (s.party && cfg.duo && !s.party.groups) s.party.want = ''; kick(); } else stop(); };

const SCHEMA = {
	id: 'deadlock_lobby_ranks', title: '#Lr_Tab', prefix: 'Lr', strings: STRINGS,
	placement: 'addons', author: 'luxus', toggle: 'on',
	resetLabel: '#Lr_Reset',
	controls: [
		{ key: 'on', type: 'toggle', title: '#Lr_Enable', desc: '#Lr_EnableDesc', default: RANKS_DEFAULT },
		{ key: 'duo', type: 'toggle', section: '#Lr_Section', title: '#Lr_Duo', desc: '#Lr_DuoDesc', default: DUO_DEFAULT, needs: ['on'] }
	]
};

let settingsSeen = false;
$.Schedule(3, () => { settingsSeen = true; }); // stored settings arrive within ~1 s; nothing stored = defaults
AddonSettings.register(SCHEMA, values => { settingsSeen = true; Object.assign(cfg, values); settingsChanged(); });
AddonSettings.ride(() => !!st().timer);
attach();
if (wanted()) kick();
say(VERSION + ' loaded (' + AddonSettings.language() + ')');

$.LrTest = { parseAccount, agree, fromSteam64, rankUrl, numberIn, cardAccount, VERSION, TICK_S, RANKS_DEFAULT, DUO_DEFAULT, ACCOUNT_MIN, PARTY_URL };
