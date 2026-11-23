'use strict';
const C = { sched: 0, styleWrites: 0 };
const resetCounts = () => { C.sched = 0; C.styleWrites = 0; };
let now = 0, seq = 0, jobs = [], handlers = [], info = [], errors = [];
const storage = {};
class P {
	constructor(type, parent, id) {
		this.paneltype = type; this.id = id || ''; this.cls = new Set(); this.kids = []; this.attrs = {}; this.parent = parent || null; this.valid = true; this.events = {}; this._text = ''; this.enabled = true; this.hittest = true;
		const self = this;
		this.style = new Proxy({}, { set(o, k, v) { C.styleWrites++; o[k] = v; return true; }, get(o, k) { return o[k]; } });
		if (parent) parent.kids.push(this);
		self.applied = this.style;
	}
	get text() { return this._text; }
	set text(v) { this._text = v; }
	IsValid() { return this.valid; }
	GetParent() { return this.parent; }
	AddClass(c) { this.cls.add(c); }
	RemoveClass(c) { this.cls.delete(c); }
	SetHasClass(c, on) { on ? this.cls.add(c) : this.cls.delete(c); }
	BHasClass(c) { return this.cls.has(c); }
	BAscendantHasClass(c) { for (let a = this; a; a = a.parent) if (a.cls.has(c)) return true; return false; }
	SetPanelEvent(e, f) { this.events[e] = f; }
	SetAttributeString(k, v) { this.attrs[k] = String(v); }
	GetAttributeString(k, d) { return k in this.attrs ? this.attrs[k] : d; }
	FindChild(id) { return this.kids.find(k => k.id === id) || null; }
	FindChildTraverse(id) { const w = p => { for (const k of p.kids) { if (k.id === id) return k; const r = w(k); if (r) return r; } return null; }; return w(this); }
	FindChildrenWithClassTraverse(c) { const out = []; const w = p => p.kids.forEach(k => { if (k.cls.has(c)) out.push(k); w(k); }); w(this); return out; }
	GetChildCount() { return this.kids.length; }
	GetChild(i) { return this.kids[i] || null; }
	MoveChildBefore(c, b) { const i = this.kids.indexOf(c); if (i >= 0) this.kids.splice(i, 1); const j = this.kids.indexOf(b); this.kids.splice(j >= 0 ? j : this.kids.length, 0, c); }
	DeleteAsync() { this.valid = false; if (this.parent) { const i = this.parent.kids.indexOf(this); if (i >= 0) this.parent.kids.splice(i, 1); } }
	SetURL(url) {
		const title = t => $.Schedule(0.05, () => handlers.filter(h => h.p === this && h.ev === 'HTMLTitle').forEach(h => h.f(this, t)));
		const hash = url.split('#')[1];
		if (!hash) { title('HUDPP_READY:1'); return; }
		const m = JSON.parse(decodeURIComponent(hash)); const r = { id: m.id };
		if (m.op === 'get') r.value = m.key in storage ? storage[m.key] : null;
		else if (m.op === 'set') { storage[m.key] = String(m.value); r.value = String(m.value); }
		title('HUDPP:' + JSON.stringify(r));
	}
}
const H = { root: null, ctx: null, clicks: [] };
global.GameUI = { CustomUIConfig: () => H.root.cfg };
global.$ = {
	GetContextPanel: () => H.ctx,
	Schedule: (t, f) => { C.sched++; const j = { due: now + Math.max(0, t), f, id: ++seq }; jobs.push(j); return j.id; },
	CancelScheduled: id => { jobs = jobs.filter(j => j.id !== id); },
	DispatchEvent(ev, p) {
		H.clicks.push({ ev: ev, id: p && p.id });
		if (ev === 'Activated' && p && p.valid && p.events && p.events.onactivate) p.events.onactivate();
		else if (p && p.events && p.events[ev]) p.events[ev]();
	},
	Msg: m => { (/^Deadlock Commend: \d|^DC-diag |^Addon Settings:/.test(m) ? info : errors).push(m); },
	Language: () => 'english',
	RegisterEventHandler(ev, p, f) { const id = ++seq; handlers.push({ ev, p, f, id }); return id; },
	CreatePanel: (t, parent, id) => new P(t, parent, id)
};
const advance = secs => {
	const end = now + secs;
	for (;;) {
		jobs.sort((a, b) => a.due - b.due || a.id - b.id);
		const j = jobs[0];
		if (!j || j.due > end) break;
		jobs.shift(); now = j.due;
		try { j.f(); } catch (e) { errors.push(String(e && e.stack || e).slice(0, 400)); }
	}
	now = end;
};
const mk = (t, parent, id, cls, text) => { const x = new P(t, parent, id); String(cls || '').split(' ').filter(Boolean).forEach(c => x.cls.add(c)); if (text != null) x._text = text; return x; };
const load = src => {
	info = []; errors = []; jobs = []; handlers = []; now = 0;
	const fn = new Function('AddonSettings', 'COMMEND_SCHEMA', 'STRINGS', src + '\n//# sourceURL=commend.js');
	fn(global.AddonSettings || { register() {}, language: () => 'english' }, global.COMMEND_SCHEMA, global.STRINGS);
};
const loadExtra = src => {
	const fn = new Function(src + '\n//# sourceURL=commend_extra.js');
	fn();
};
module.exports = { C, H, P, mk, advance, load, loadExtra, storage, resetCounts, info: () => info, errors: () => errors, now: () => now };
