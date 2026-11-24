// Panorama stand-in: panels, a virtual clock, profile surfaces, HUD++ menu.
'use strict';

const C = { sched: 0, finds: 0, nodes: 0, childReads: 0, reads: 0, classWrites: 0, classChanges: 0, textWrites: 0, textChanges: 0, images: 0, styleWrites: 0, created: 0, dispatches: 0 };
const resetCounts = () => Object.keys(C).forEach(k => { C[k] = 0; });

let now = 0, seq = 0, jobs = [], handlers = [], errors = [], info = [];
const INFO = /^(LR-diag |Deadlock Lobby Ranks: v?\d[\w +.-]* loaded|Addon Settings: (build \d+ hosts|no Esc menu |Esc menu:|addon:|open:|body:))/;
const storage = {};
const net = { online: true, writes: [] };
const overlay = { urls: [] };

class P {
	constructor(type, parent, id) {
		this.type = type; this.paneltype = type; this.id = id || ''; this.cls = new Set(); this.kids = []; this.attrs = {}; this.parent = null; this.valid = true; this.events = {}; this._text = ''; this.applied = {}; this.hittest = true; this.enabled = true; this.img = '';
		const self = this;
		this.style = new Proxy({}, { set(o, k, v) { C.styleWrites++; o[k] = v; if (v !== null && v !== undefined) self.applied[k] = v; return true; } });
		if (parent) { parent.kids.push(this); this.parent = parent; }
	}
	get text() { C.reads++; return this._text; }
	set text(v) { C.textWrites++; if (this._text !== v) C.textChanges++; this._text = v; }
	IsValid() { C.reads++; return this.valid; }
	GetParent() { return this.parent; }
	AddClass(c) { this.SetHasClass(c, true); }
	RemoveClass(c) { this.SetHasClass(c, false); }
	SetHasClass(c, on) { C.classWrites++; if (this.cls.has(c) === !!on) return; C.classChanges++; on ? this.cls.add(c) : this.cls.delete(c); restyle(this); }
	BHasClass(c) { C.reads++; return this.cls.has(c); }
	SetPanelEvent(e, f) { this.events[e] = f; }
	SetAttributeString(k, v) { this.attrs[k] = v; }
	GetAttributeString(k, d) { return k in this.attrs ? this.attrs[k] : d; }
	FindChild(id) { C.childReads++; return this.kids.find(k => k.id === id) || null; }
	FindChildTraverse(id) { C.finds++; const walk = p => { for (const k of p.kids) { C.nodes++; if (k.id === id) return k; const r = walk(k); if (r) return r; } return null; }; return walk(this); }
	FindChildrenWithClassTraverse(c) { C.finds++; const out = []; const walk = p => p.kids.forEach(k => { C.nodes++; if (k.cls.has(c)) out.push(k); walk(k); }); walk(this); return out; }
	GetChildCount() { C.childReads++; return this.kids.length; }
	GetChild(i) { C.childReads++; return this.kids[i] || null; }
	MoveChildBefore(c, b) { this.kids.splice(this.kids.indexOf(c), 1); this.kids.splice(this.kids.indexOf(b), 0, c); }
	DeleteAsync() { this.valid = false; if (this.parent) this.parent.kids.splice(this.parent.kids.indexOf(this), 1); }
	Activate() { $.DispatchEvent('Activated', this); }
	SetImage(url) { C.images++; this.img = url; }
	SetURL(url) {
		if (url.indexOf('https://luxus.github.io/deadlock-mods/party/') === 0) {
			H.partyUrls.push(url);
			const q = new URLSearchParams(url.split('?')[1]);
			if (H.partyReply === null) return;
			const body = Object.assign({ n: q.get('n') }, H.partyReply ? H.partyReply(q) : { ok: 1, g: [] });
			$.Schedule(0.3, () => handlers.filter(h => h.p === this && h.ev === 'HTMLTitle').forEach(h => h.f(this, 'LRPARTY1 ' + JSON.stringify(body))));
			return;
		}
		const title = t => $.Schedule(0.05, () => handlers.filter(h => h.p === this && h.ev === 'HTMLTitle').forEach(h => h.f(this, t)));
		const hash = url.split('#')[1];
		if (!net.online) return;
		if (!hash) { title('HUDPP_READY:1'); return; }
		const m = JSON.parse(decodeURIComponent(hash)); const r = { id: m.id };
		if (m.op === 'get') r.value = m.key in storage ? storage[m.key] : null;
		else if (m.op === 'set') { storage[m.key] = String(m.value); r.value = String(m.value); net.writes.push(m.key); }
		title('HUDPP:' + JSON.stringify(r));
	}
}

const restyle = p => { Object.keys(p.style).forEach(k => { const v = p.style[k]; if (v === null || v === undefined) delete p.applied[k]; }); p.kids.forEach(restyle); };

global.$ = {
	GetContextPanel: () => H.ctx,
	CreatePanel: (t, parent, id) => { C.created++; const x = new P(t, parent, id); if (t === 'Slider') { new P('Panel', x, 'SliderTrack'); new P('Button', x, 'SliderThumb'); let v = 0; Object.defineProperty(x, 'value', { get: () => v, set: n => { v = Math.max(0, Math.min(1, Number(n))); handlers.filter(h => h.p === x && h.ev === 'SliderValueChanged').forEach(h => h.f(x)); } }); } return x; },
	Schedule: (t, f) => { C.sched++; const j = { due: now + Math.max(0, t), f, id: ++seq }; jobs.push(j); return j.id; },
	CancelScheduled: id => { jobs = jobs.filter(j => j.id !== id); },
	DispatchEvent(ev, p, extra) {
		C.dispatches++;
		H.clicks.push({ ev: ev, id: p && p.id, p: p, extra: extra });
		if (ev === 'Activated') {
			for (let cur = p; cur && cur.valid; cur = cur.parent) {
				if (cur.events && cur.events.onactivate) { cur.events.onactivate(); break; }
			}
		}
		if (ev === 'Activated' && p && p.id === 'MainContents' && p.parent && p.parent.cardId !== undefined) H.openCard(p.parent);
		if (ev === 'DismissAllContextMenus') H.closeCards();
		if (ev === 'ExternalBrowserGoToURL') overlay.urls.push(p);
	},
	Localize: (s, panel) => {
		if (panel && panel.vars && Object.prototype.hasOwnProperty.call(panel.vars, s)) return panel.vars[s];
		return s;
	}, Msg: m => { (INFO.test(m) ? info : errors).push('msg: ' + m); },
	Language: () => 'english',
	RegisterForUnhandledEvent: (ev, f) => handlers.push({ ev, p: null, f }),
	RegisterEventHandler: (ev, p, f) => { const id = ++seq; handlers.push({ ev, p, f, id }); return id; },
	UnregisterEventHandler: (ev, p, id) => { handlers = handlers.filter(h => h.id !== id); },
};
global.SteamOverlayAPI = { OpenURL: url => { overlay.urls.push(url); } };

const advance = secs => {
	const end = now + secs;
	for (;;) {
		jobs.sort((a, b) => a.due - b.due || a.id - b.id);
		const j = jobs[0];
		if (!j || j.due > end) break;
		jobs.shift(); now = j.due;
		try { j.f(); } catch (e) { errors.push(String(e && e.stack || e).slice(0, 300)); }
	}
	now = end;
};

const mk = (t, parent, id, cls, text) => { const x = new P(t, parent, id); (cls || '').split(' ').filter(Boolean).forEach(c => x.cls.add(c)); if (text !== undefined) x._text = text; return x; };
const filler = (parent, n, tag) => { for (let i = 0; i < n; i++) { const a = mk('Panel', parent, tag + i); mk('Label', a, ''); } };

const probes = parent => {
	mk('Label', parent, 'LrAccountId', 'LrProbe', '');
	mk('Label', parent, 'LrAccountIdDirect', 'LrProbe', '');
	mk('Label', parent, 'LrAccountIdPlayer', 'LrProbe', '');
	mk('Label', parent, 'LrAccountIdPlayerRoot', 'LrProbe', '');
};
const setAccount = (root, hidden, direct, player, playerRoot) => {
	const h = root.FindChildTraverse('LrAccountId'), d = root.FindChildTraverse('LrAccountIdDirect');
	const p = root.FindChildTraverse('LrAccountIdPlayer'), r = root.FindChildTraverse('LrAccountIdPlayerRoot');
	if (h) h._text = hidden == null ? '' : String(hidden);
	if (d) d._text = direct == null ? '' : String(direct);
	if (p && player !== undefined) p._text = player == null ? '' : String(player);
	if (r && playerRoot !== undefined) r._text = playerRoot == null ? '' : String(playerRoot);
};

const H = { partyUrls: [], partyReply: undefined, cards: [], root: null, ctx: null, esc: null, menu: null, tab: 'hud', tabs: {}, hudBody: null, mmBody: null, xhBody: null, foot: null, menuButton: null, page: null, card: null, board: null, clicks: [], model: 'new' };

const addEscape = root => {
	const esc = H.esc = mk('Panel', root, 'EscapeMenu');
	mk('Panel', esc, 'EscapeBackground');
	const sub = mk('Panel', mk('Panel', mk('Panel', esc, 'LeftStripe'), 'Menu'), 'SubOptions');
	filler(sub, 6, 'Opt');
	H.menuButton = mk('Button', mk('Panel', sub, '', 'HudppMenuRow'), 'HudppMenuButton', 'nav_menu_item minor');
	H.menuButton.events.onactivate = () => press(H.menuButton, () => (H.menu && H.menu.BHasClass('HudppOpen')) ? H.closeMenu() : H.openMenu());
	H.menu = null; H.tab = 'hud';
};

H.refresh = () => {
	const names = H.model === 'old' ? ['hud', 'xh'] : ['hud', 'mm', 'xh'];
	names.forEach(t => { if (H.menu) H.menu.SetHasClass('HudppTab_' + t, t === H.tab); if (H.tabs[t]) H.tabs[t].SetHasClass('HudppSelected', t === H.tab); });
};
H.openMenu = () => {
	H.esc.cls.add('ShowEscapeMenu');
	if (!H.menu) {
		const m = H.menu = mk('Panel', H.esc, 'HudppPanel', '');
		const bar = mk('Panel', m, '', 'HudppTabs');
		H.tabs = {};
		const list = H.model === 'old' ? [['hud', 'HUD'], ['xh', 'Crosshair']] : [['hud', 'HUD'], ['mm', 'Minimap'], ['xh', 'Crosshair']];
		list.forEach(([k, l]) => {
			const b = mk('Button', bar, '', 'HudppTab'); mk('Label', b, '', 'HudppTabLabel', l);
			b.events.onactivate = () => press(b, () => { if (H.tab === k) return; H.tab = k; H.refresh(); });
			H.tabs[k] = b;
		});
		H.hudBody = mk('Panel', m, '', 'HudppBody HudppBodyHud'); filler(H.hudBody, 8, 'HudRow');
		if (H.model !== 'old') { H.mmBody = mk('Panel', m, '', 'HudppBody HudppBodyMm'); filler(H.mmBody, 8, 'MmRow'); } else H.mmBody = null;
		H.xhBody = mk('Panel', m, '', 'HudppBody HudppBodyXh'); filler(H.xhBody, 8, 'XhRow');
		const foot = H.foot = mk('Panel', m, '', 'HudppFoot'); mk('Label', mk('Panel', foot, '', 'HudppFootMain'), '', 'HudppStatus');
	}
	H.menu.AddClass('HudppOpen'); H.refresh();
};
H.closeMenu = () => { if (H.menu) H.menu.RemoveClass('HudppOpen'); H.esc.cls.delete('ShowEscapeMenu'); };

const shown = p => {
	for (let q = p; q; q = q.parent) {
		const v = q.applied.visibility;
		if (v === 'collapse') return false;
		if (v === 'visible') continue;
		const up = c => { for (let a = q.parent; a; a = a.parent) if (a.cls.has(c)) return true; return false; };
		if (H.model === 'old') {
			if ((q.cls.has('HudppBodyXh') && up('HudppTab_hud')) || (q.cls.has('HudppBodyHud') && up('HudppTab_xh'))) return false;
		} else {
			if (q.cls.has('HudppBodyHud') && !up('HudppTab_hud')) return false;
			if (q.cls.has('HudppBodyMm') && !up('HudppTab_mm')) return false;
			if (q.cls.has('HudppBodyXh') && !up('HudppTab_xh')) return false;
			if (q.cls.has('HudppBody') && !q.cls.has('HudppBodyHud') && !q.cls.has('HudppBodyMm') && !q.cls.has('HudppBodyXh') && !q.cls.has('AddonSettingsPart')) return false;
		}
	}
	return true;
};

const press = (b, xml) => { const hs = handlers.filter(h => h.p === b && h.ev === 'Activated'); if (hs.length) { hs.forEach(h => h.f(b)); return; } xml(); };

H.openCard = entry => {
	H.closeCards();
	if (entry.cardId === null) return;
	const layer = H.root.FindChild('ContextMenuLayer') || mk('Panel', H.root, 'ContextMenuLayer');
	const card = mk('CitadelProfileCard', mk('Panel', layer, 'ContextMenu'), '');
	H.cards.push(card.parent);
	const delay = entry.cardDelay || 0;
	const fill = () => {
		const acc = mk('Panel', card, 'AccountID');
		mk('Label', acc, '', 'AccountID', entry.cardText !== undefined ? entry.cardText : '');
		const user = mk('CitadelUserName', card, 'UserName');
		if (entry.cardId) user.accountid = Number(entry.cardId);
	};
	if (delay) $.Schedule(delay, fill); else fill();
};
H.closeCards = () => { H.cards.forEach(c => c.DeleteAsync()); H.cards = []; };

const playerEntry = (parent, row) => {
	const entry = mk('CitadelPlayersListEntry', parent, '', 'CitadelPlayersListEntry');
	const main = mk('Panel', entry, 'MainContents');
	mk('Panel', main, 'HeroBadge', 'CitadelHeroBadge');
	mk('Label', main, 'LrRowHero', 'LrProbe', row && row.hero !== undefined ? row.hero : '');
	const details = mk('Panel', main, '', 'Details');
	mk('Label', details, '', 'PlayerName', row && row.name ? row.name : '');
	if (row && row.attr) {
		Object.keys(row.attr).forEach(k => entry.SetAttributeString(k, row.attr[k]));
	}
	if (row && row.vars) entry.vars = Object.assign({}, row.vars);
	if (row && 'card' in row) { entry.cardId = row.card; entry.cardText = row.cardText; entry.cardDelay = row.cardDelay; }
	return entry;
};

const buildWorld = (opts = {}) => {
	jobs = []; handlers = []; errors = []; info = []; H.clicks = []; overlay.urls = [];
	now = 0; seq = 0;
	H.model = opts.model || 'new';
	const root = H.root = new P('CitadelHud', null, 'Hud');
	if (!opts.escClosed) root.cls.add('ShowEscapeMenu');
	if (opts.hideout) root.cls.add('connectedToHideout');
	addEscape(root);
	const dash = mk('CitadelHudEscapeMenu', root, 'Dashboard');
	const list = H.list = mk('CitadelPlayersList', dash, 'PlayersList');
	const teams = mk('Panel', list, 'Teams');
	const t1 = mk('Panel', teams, 'Team1', 'Team');
	mk('Panel', t1, '', 'TeamHeader');
	const entries = mk('Panel', t1, 'TeamEntries');
	const t2 = mk('Panel', teams, 'Team2', 'Team');
	mk('Panel', t2, '', 'TeamHeader');
	const entries2 = mk('Panel', t2, 'TeamEntries');
	H.partyUrls = []; H.partyReply = opts.partyReply; H.cards = [];
	H.entries2 = (opts.entries2 || []).map(r => playerEntry(entries2, r));
	H.entries = (opts.entries || [
		{ name: 'Kai', hero: 'Haze', card: '39734272' },
		{ name: 'Ally', hero: 'Infernus', card: '2000001' },
		{ name: 'Foe', hero: 'Seven', card: '', cardText: 'Account ID: 3,000,001' }
	]).map(r => playerEntry(entries, r));
	H.ctx = list;
	return H;
};

const load = src => { (0, eval)(src); };
module.exports = { C, resetCounts, advance, P, H, mk, buildWorld, shown, press, load, storage, net, overlay, setAccount, get handlers() { return handlers; }, get errors() { return errors; }, get info() { return info; }, get jobs() { return jobs; }, get now() { return now; } };
