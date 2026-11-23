// Panorama stand-in: panels, a virtual clock, profile surfaces, HUD++ menu.
'use strict';
const fs = require('fs');
const path = require('path');
const LAYOUT_DIR = path.join(__dirname, '..', 'build', 'pak', 'panorama', 'layout');
const lay = { fail: false, loads: [] };

const C = { sched: 0, finds: 0, nodes: 0, childReads: 0, reads: 0, classWrites: 0, classChanges: 0, textWrites: 0, textChanges: 0, images: 0, styleWrites: 0, created: 0, dispatches: 0 };
const resetCounts = () => Object.keys(C).forEach(k => { C[k] = 0; });

let now = 0, seq = 0, jobs = [], handlers = [], errors = [], info = [];
const INFO = /^(ZB-diag |Deadlock Zipline Boost: v?\d[\w +.-]* loaded|Addon Settings: (build \d+ hosts|no Esc menu |Esc menu:|addon:|open:|body:))/;
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
	// Panorama BLoadLayout: the layout's root element becomes this panel, its children are created
	// under it, and the layout's own <styles> apply to that subtree. Returns false when the file is missing.
	BLoadLayout(url) {
		lay.loads.push({ p: this, url });
		const m = /^file:\/\/\{resources\}\/layout\/(.+\.xml)$/.exec(String(url));
		const file = m && path.join(LAYOUT_DIR, m[1]);
		if (lay.fail || !file || !fs.existsSync(file)) return false;
		const body = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<styles>[\s\S]*?<\/styles>/, '').replace(/<scripts>[\s\S]*?<\/scripts>/, '');
		const attr = (a, k) => { const r = new RegExp('\\b' + k + '="([^"]*)"').exec(a); return r ? r[1] : ''; };
		const stack = [];
		const tag = /<(\/?)(\w+)([^>]*?)(\/?)>/g;
		let t;
		while ((t = tag.exec(body))) {
			const [, close, type, a, self] = t;
			if (type === 'root') continue;
			if (close) { stack.pop(); continue; }
			let x;
			if (!stack.length) { x = this; this.layoutFile = m[1]; }
			else { x = new P(type, stack[stack.length - 1], attr(a, 'id')); C.created++; }
			attr(a, 'class').split(' ').filter(Boolean).forEach(c => x.cls.add(c));
			if (/\bhittest="false"/.test(a)) x.hittest = false;
			if (!self) stack.push(x);
		}
		return true;
	}
	SetURL(url) {
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
		if (ev === 'Activated' && p && p.valid && p.events.onactivate) p.events.onactivate();
		if (ev === 'ExternalBrowserGoToURL') overlay.urls.push(p);
	},
	Localize: (s, panel) => {
		if (panel && panel.vars && Object.prototype.hasOwnProperty.call(panel.vars, s)) return panel.vars[s];
		return s;
	}, Msg: m => { (INFO.test(m) ? info : errors).push('msg: ' + m); },
	Language: () => 'english',
	ZbClock: () => Math.round(now * 1000),
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

const H = { root: null, ctx: null, esc: null, menu: null, tab: 'hud', tabs: {}, hudBody: null, mmBody: null, xhBody: null, foot: null, menuButton: null, page: null, card: null, board: null, clicks: [], model: 'new' };

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

const setHint = (hint, opts = {}) => {
	if (!hint) return hint;
	['active', 'in_use', 'on_cooldown', 'cooling_down', 'off_cooldown'].forEach(c => hint.SetHasClass(c, !!(opts[c] || (opts.classes && opts.classes.includes(c)))));
	if (opts.label !== undefined) {
		const lab = hint.FindChildTraverse('context_label');
		if (lab) lab._text = String(opts.label);
	}
	return hint;
};
const setIcon = (icon, opts = {}) => {
	if (!icon) return icon;
	['cooling_down', 'off_cooldown', 'gDetailView'].forEach(c => icon.SetHasClass(c, !!(opts[c] || (opts.classes && opts.classes.includes(c)))));
	if (opts.cooldown !== undefined) {
		const t = icon.FindChildTraverse('cooldown_timer');
		if (t) t._text = String(opts.cooldown);
	}
	return icon;
};
const setHideout = (on, cls) => { if (H.root) H.root.SetHasClass(cls || 'connectedToHideout', !!on); };

const buildWorld = (opts = {}) => {
	jobs = []; handlers = []; errors = []; info = []; H.clicks = []; overlay.urls = [];
	lay.fail = !!opts.layoutFails; lay.loads = [];
	now = 0; seq = 0;
	H.model = opts.model || 'new';
	const root = H.root = new P('CitadelHud', null, 'Hud');
	addEscape(root);
	const gp = H.gameplay = mk('Panel', root, 'gameplay_hud', 'gameplay_hud');
	const alive = H.alive = mk('Panel', gp, 'gameplay_hud_alive');
	const cross = mk('Panel', alive, 'crosshair');
	const hints = H.hints = mk('Panel', cross, 'button_hints_container');
	const hint = H.hint = mk('Panel', hints, opts.hintId || 'citadel_ability_zipline_boost', 'citadel_ability_zipline_boost');
	mk('Label', hint, 'context_label', 'action_label', '');
	mk('Label', hint, '', 'cooldownNotice', '');
	mk('Label', hint, '', 'activeNotice', '');
	H.effects = mk('Panel', alive, 'StatusEffects');
	if (opts.buff) mk('Panel', H.effects, 'status_citadel_ability_zipline_boost', 'status_citadel_ability_zipline_boost');
	H.icon = new P('CitadelZiplineBoostIcon', gp, 'ZiplineBoostIcon');
	mk('Label', H.icon, 'cooldown_timer', 'cooldown_timer', opts.iconCooldown || '');
	H.move = new P('CitadelHudMovementSpeed', root, '');
	H.hideout = mk('Panel', root, 'CitadelHudHideout');
	H.hideout.style.visibility = 'collapse';
	H.hideout.visible = false;
	if (opts.hint) setHint(H.hint, opts.hint);
	if (opts.icon) setIcon(H.icon, opts.icon);
	if (opts.hideout) setHideout(true, opts.hideout === true ? 'connectedToHideout' : opts.hideout);
	if (opts.oldHideoutPanel) { H.hideout.style.visibility = 'visible'; H.hideout.visible = true; }
	if (opts.noHint && H.hint) { H.hint.valid = false; H.hints.kids = H.hints.kids.filter(k => k !== H.hint); H.hint = null; }
	H.ctx = opts.ctx === 'icon' ? H.icon : (opts.ctx === 'hud' ? root : H.move);
	return H;
};

const load = src => { try { delete $.ZbLoaded; } catch (e) {} (0, eval)(src); };
module.exports = { lay, C, resetCounts, advance, P, H, mk, buildWorld, shown, press, load, storage, net, overlay, setHint, setIcon, setHideout, setAccount, get handlers() { return handlers; }, get errors() { return errors; }, get info() { return info; }, get jobs() { return jobs; }, get now() { return now; } };
