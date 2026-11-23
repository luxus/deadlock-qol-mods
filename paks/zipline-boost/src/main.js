const VERSION = '0.1.0';
const BOOST_DEFAULT = true;
const TICK_IDLE_S = 1;
const TICK_ACTIVE_S = 0.2;
const ACTIVE_MS = 32000;
const COOLDOWN_MS = 360000;
const HINT_ID = 'citadel_ability_zipline_boost';
const HINT_PREFIX = 'citadel_ability_zipline_boost_';
const HINT_CLASS = 'citadel_ability_zipline_boost';
const BUFF_ID = 'status_citadel_ability_zipline_boost';
const ROOT_ID = 'ZbRoot';
const TITLE_ID = 'ZbTitle';
const STATE_ID = 'ZbState';
const ICON_ID = 'ZbIcon';
const TEXT_ID = 'ZbText';

const cfg = { on: BOOST_DEFAULT };
const say = m => { try { $.Msg('Deadlock Zipline Boost: ' + m); } catch (e) { /* no console */ } };
const ok = p => !!(p && p.IsValid && p.IsValid());
const diag = m => { try { $.Msg('ZB-diag ' + m); } catch (e) { /* no console */ } };
const _diagSeen = {};
const diagChange = (key, val, m) => { if (_diagSeen[key] === val) return; _diagSeen[key] = val; diag(m); };
const panelId = p => {
	if (!ok(p)) return 'missing';
	let id = '', typ = '';
	try { id = String(p.id || ''); } catch (e) { /* */ }
	try { typ = String(p.paneltype || ''); } catch (e2) { /* */ }
	return (typ || 'Panel') + '#' + (id || '?');
};
const visOf = p => {
	if (!ok(p)) return 'missing';
	const parts = [];
	try { if (p.style && p.style.visibility) parts.push('visibility=' + p.style.visibility); } catch (e) { /* */ }
	try { if (p.style && p.style.opacity !== undefined && p.style.opacity !== '' && p.style.opacity !== null) parts.push('opacity=' + p.style.opacity); } catch (e2) { /* */ }
	try { if (p.IsVisible) parts.push('IsVisible=' + p.IsVisible()); } catch (e3) { /* */ }
	try { if (p.visible !== undefined) parts.push('visible=' + p.visible); } catch (e4) { /* */ }
	try { if (p.BHasClass && p.BHasClass('ZbHidden')) parts.push('class=ZbHidden'); } catch (e5) { /* */ }
	return parts.join(',') || 'present';
};
const cancel = h => { if (h) { try { $.CancelScheduled(h); } catch (e) { /* ran */ } } return null; };
const guard = (name, fn) => { try { return fn(); } catch (e) { say(name + ' failed: ' + (e && e.message ? e.message : e)); return undefined; } };
// Every $.Localize miss is a console line, and the game does not load this pak's loc file ('#Zb_Tab'
// missed at register on lea 22.11. 16:40), so asking per tick logged two misses a second. Each token is
// looked up once per language; {n} are filled here.
const templates = {};
const template = token => {
	const lang = (AddonSettings.language && AddonSettings.language()) || 'english';
	const key = lang + ':' + token;
	if (!(key in templates)) {
		let t;
		try { if (typeof AddonSettings.localize === 'function') t = AddonSettings.localize('#' + token, STRINGS); } catch (e) { /* fall through */ }
		templates[key] = typeof t === 'string' ? t : ((STRINGS[lang] && STRINGS[lang][token]) || (STRINGS.english && STRINGS.english[token]) || token);
	}
	return templates[key];
};
const word = (token, args) => (args || []).reduce((t, a, i) => t.split('{' + i + '}').join(String(a)), template(token));
const clockMs = () => { try { if (typeof $.ZbClock === 'function') return $.ZbClock(); } catch (e) { /* tests only */ } return Date.now(); };

const hasClass = (p, name) => { try { return ok(p) && p.BHasClass && p.BHasClass(name); } catch (e) { return false; } };
const readText = p => { if (!ok(p)) return ''; try { return String(p.text || ''); } catch (e) { return ''; } };

const parseSeconds = value => {
	const text = String(value === undefined || value === null ? '' : value);
	if (!text) return -1;
	const clean = text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
	if (!clean || /[{}#]/.test(clean)) return -1;
	let m = /Countdown[^>]*>\s*(\d+(?:\.\d+)?)/i.exec(text);
	if (m) { const n = Number(m[1]); return isFinite(n) && n >= 0 ? n : -1; }
	m = /\b(\d{1,2}):(\d{2})\b/.exec(clean);
	if (m) { const n = Number(m[1]) * 60 + Number(m[2]); return isFinite(n) && n >= 0 ? n : -1; }
	m = /\b(\d+(?:\.\d+)?)\s*s\b/i.exec(clean);
	if (m) { const n = Number(m[1]); return isFinite(n) && n >= 0 ? n : -1; }
	m = /^(\d+(?:\.\d+)?)$/.exec(clean);
	if (m) { const n = Number(m[1]); return isFinite(n) && n >= 0 && n <= COOLDOWN_MS / 1000 + 5 ? n : -1; }
	m = /\b(?:cooldown|cd|abklingzeit|wait|ready\s+in)[^0-9]*(\d{1,4})\b/i.exec(clean);
	if (m) { const n = Number(m[1]); return isFinite(n) && n >= 0 && n <= COOLDOWN_MS / 1000 + 5 ? n : -1; }
	return -1;
};
const formatClock = secs => {
	const n = Math.max(0, Math.ceil(Number(secs) || 0));
	if (n >= 60) {
		const m = Math.floor(n / 60), s = n % 60;
		return String(m) + ':' + (s < 10 ? '0' : '') + String(s);
	}
	return word('Zb_CooldownSec', [String(n)]);
};

const top = () => { let a = $.GetContextPanel(), last = a; while (ok(a)) { last = a; a = a.GetParent(); } return last; };
const st = () => {
	const r = top();
	if (!ok(r)) return { timer: null, host: null, root: null, title: null, state: null, wasActive: false, activeEnd: 0, cooldownEnd: 0 };
	if (!r.Zb) r.Zb = { timer: null, host: null, root: null, title: null, state: null, wasActive: false, activeEnd: 0, cooldownEnd: 0 };
	return r.Zb;
};

// Hook points (facts from the game's HUD tree): the boost hint lives in
// gameplay_hud > gameplay_hud_alive > crosshair > button_hints_container with id
// citadel_ability_zipline_boost_ (or without the trailing _) and class citadel_ability_zipline_boost;
// the buff is status_citadel_ability_zipline_boost under gameplay_hud_alive > StatusEffects.
const kidsOf = p => { const out = []; try { const n = p.GetChildCount ? p.GetChildCount() : 0; for (let i = 0; i < n; i++) { const c = p.GetChild(i); if (ok(c)) out.push(c); } } catch (e) { /* */ } return out; };
const byId = (scope, id) => { if (!ok(scope)) return null; try { const p = scope.FindChildTraverse(id); return ok(p) ? p : null; } catch (e) { return null; } };
const hintsHolder = alive => byId(byId(alive, 'crosshair'), 'button_hints_container');
const findHint = hints => {
	if (!ok(hints)) return null;
	const ids = [HINT_PREFIX, HINT_ID];
	for (let i = 0; i < ids.length; i++) { const p = byId(hints, ids[i]); if (p) return p; }
	const queue = kidsOf(hints);
	for (let head = 0; head < queue.length && head < 400; head++) {
		const p = queue[head];
		if (hasClass(p, HINT_CLASS)) return p;
		kidsOf(p).forEach(k => queue.push(k));
	}
	return null;
};
const findBuff = alive => byId(byId(alive, 'StatusEffects'), BUFF_ID);
const findHud = () => {
	for (let p = $.GetContextPanel(), n = 0; ok(p) && n < 64; p = p.GetParent(), n++) {
		let t = ''; try { t = String(p.paneltype || ''); } catch (e) { /* */ }
		if (t === 'CitadelHud' || p.id === 'Hud') return p;
	}
	const r = top();
	return byId(r, 'Hud') || r;
};
const inHideout = (hud, rootPanel) => hasClass(hud, 'connectedToHideout') || hasClass(hud, 'InHideout') || hasClass(rootPanel, 'connectedToHideout') || hasClass(rootPanel, 'InHideout');

const secondsFrom = (panel, ids) => {
	if (!ok(panel)) return -1;
	for (let i = 0; i < ids.length; i++) {
		const n = parseSeconds(readText(panel.FindChildTraverse(ids[i])));
		if (n >= 0) return n;
	}
	if (typeof $.Localize === 'function') {
		try {
			const n = parseSeconds($.Localize('{s:cooldown_sec}', panel));
			if (n >= 0) return n;
		} catch (e) { /* no dialog var */ }
	}
	return parseSeconds(readText(panel));
};

const hintSeconds = hint => {
	if (!ok(hint)) return -1;
	const fromLabel = secondsFrom(hint, ['context_label', 'cooldown_timer']);
	if (fromLabel >= 0) return fromLabel;
	const notice = hint.FindChildrenWithClassTraverse
		? (hint.FindChildrenWithClassTraverse('cooldownNotice') || [])
		: [];
	for (let i = 0; i < notice.length; i++) {
		const n = parseSeconds(readText(notice[i]));
		if (n >= 0) return n;
	}
	return -1;
};

const readState = (s, now) => {
	const root = top();
	const hud = findHud();
	const gp = byId(hud, 'gameplay_hud') || byId(root, 'gameplay_hud');
	const alive = byId(gp, 'gameplay_hud_alive');
	const hints = hintsHolder(alive);
	const hint = findHint(hints);
	const buff = findBuff(alive);
	const hidden = inHideout(hud, root);
	diagChange('hud', panelId(hud) + ':' + panelId(gp), 'lookup hud=' + panelId(hud) + ' gameplay_hud=' + (ok(gp) ? 'found' : 'not found'));
	diagChange('hints', panelId(hints), 'lookup button_hints_container=' + (ok(hints) ? 'found' : 'not found'));
	diagChange('hint', panelId(hint), 'lookup hint citadel_ability_zipline_boost=' + (ok(hint) ? 'found ' + panelId(hint) : 'not found'));
	diagChange('buff', panelId(buff), 'lookup buff status_citadel_ability_zipline_boost=' + (ok(buff) ? 'found' : 'not found'));
	diagChange('hideout', String(hidden), 'hideout=' + hidden);
	if (!ok(gp)) { s.wasActive = false; s.activeEnd = 0; s.cooldownEnd = 0; return { kind: 'hidden', seconds: -1, host: gp }; }
	if (hidden) { s.wasActive = false; s.activeEnd = 0; s.cooldownEnd = 0; return { kind: 'hidden', seconds: -1, host: gp }; }
	const buttonReady = hasClass(hint, 'active');
	const inUse = ok(buff) || hasClass(hint, 'in_use');
	const buttonCooldown = hasClass(hint, 'on_cooldown') || hasClass(hint, 'cooling_down');
	if (buttonReady && !buttonCooldown && !inUse) s.cooldownEnd = 0;
	if (inUse && !s.wasActive) { s.activeEnd = now + ACTIVE_MS; s.cooldownEnd = now + COOLDOWN_MS; }
	s.wasActive = inUse;
	if (buttonCooldown) {
		const parsed = hintSeconds(hint);
		if (parsed > 0 && parsed <= COOLDOWN_MS / 1000 + 5) s.cooldownEnd = now + parsed * 1000;
		else if (!s.cooldownEnd || s.cooldownEnd <= now) s.cooldownEnd = now + COOLDOWN_MS;
	}
	const kind = inUse ? 'active' : (s.cooldownEnd > now || buttonCooldown) ? 'cooldown' : 'ready';
	diagChange('classes', [buttonReady, inUse, buttonCooldown, kind].join(':'), 'classes hint-active=' + buttonReady + ' in_use/buff=' + inUse + ' cooldown=' + buttonCooldown + ' kind=' + kind);
	if (kind === 'active') return { kind: 'active', seconds: Math.max(0, (s.activeEnd - now) / 1000), host: gp };
	if (kind === 'cooldown') return { kind: 'cooldown', seconds: s.cooldownEnd > now ? (s.cooldownEnd - now) / 1000 : -1, host: gp };
	return { kind: 'ready', seconds: -1, host: gp };
};

// The overlay hangs under #gameplay_hud, which belongs to hud.xml, so a stylesheet included by the
// layout that loads this script never reaches it (lea 22.11. 09:53-09:56: title and state drawn on top
// of each other at the top left, and class ZbHidden did not hide it). The overlay therefore loads its
// own layout, whose <styles> apply to its subtree (HUD++ hudtext_keep uses the same BLoadLayout call).
// If that load fails, the same tree is built here with inline styles.
const LAYOUT_URL = 'file://{resources}/layout/zipline_boost_overlay.xml';
const ICON_URL = 's2r://panorama/images/upgrades/mods_utility/zipline_mastery_psd.vtex';
const SHADOW = '0px 0px 3px 1.5 #000000';
const INLINE = {
	root: { horizontalAlign: 'center', verticalAlign: 'bottom', marginBottom: '20px', marginLeft: '-520px', flowChildren: 'right', padding: '6px 12px 6px 8px', backgroundColor: '#00000073', borderRadius: '6px' },
	icon: { width: '24px', height: '24px', verticalAlign: 'center', marginRight: '8px', backgroundImage: 'url("' + ICON_URL + '")', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', washColor: '#e8e8e8' },
	text: { flowChildren: 'down', verticalAlign: 'center', minWidth: '70px' },
	title: { fontSize: '14px', fontWeight: 'semi-bold', color: '#e8e8e8', textOverflow: 'shrink', textShadow: SHADOW },
	state: { fontSize: '12px', fontWeight: 'bold', color: '#8ff19b', textOverflow: 'shrink', textShadow: SHADOW }
};
const STATE_COLOR = { ready: '#8ff19b', active: '#a3d8ff', cooldown: '#fc6a6a' };
const paint = (p, style) => { Object.keys(style).forEach(k => { try { p.style[k] = style[k]; } catch (e) { diag('style ' + k + ' failed'); } }); };
const child = (parent, type, id, style) => { const p = $.CreatePanel(type, parent, id); p.hittest = false; paint(p, style); return p; };
const loadLayout = root => { try { return !!(root.BLoadLayout && root.BLoadLayout(LAYOUT_URL, false, false)); } catch (e) { return false; } };

const ensureOverlay = host => {
	const s = st();
	if (!ok(host)) return null;
	if (ok(s.root) && s.root.GetParent && s.root.GetParent() === host) return s.root;
	if (ok(s.root)) { try { s.root.DeleteAsync(0); } catch (e) { /* gone */ } s.root = null; s.title = null; s.state = null; }
	const root = $.CreatePanel('Panel', host, ROOT_ID);
	root.hittest = false;
	s.inline = !(loadLayout(root) && ok(root.FindChildTraverse(TITLE_ID)) && ok(root.FindChildTraverse(STATE_ID)));
	root.AddClass('ZbOverlay');
	if (s.inline) {
		kidsOf(root).forEach(k => { try { k.DeleteAsync(0); } catch (e) { /* gone */ } });
		paint(root, INLINE.root);
		child(root, 'Panel', ICON_ID, INLINE.icon);
		const text = child(root, 'Panel', TEXT_ID, INLINE.text);
		s.title = child(text, 'Label', TITLE_ID, INLINE.title);
		s.state = child(text, 'Label', STATE_ID, INLINE.state);
	} else {
		s.title = root.FindChildTraverse(TITLE_ID);
		s.state = root.FindChildTraverse(STATE_ID);
	}
	s.root = root;
	s.host = host;
	diag('created overlay ' + panelId(root) + ' parent=' + panelId(host) + ' vis=' + visOf(root));
	diag('overlay layout=' + (s.inline ? 'inline' : 'loaded'));
	return root;
};
const setOverlay = (s, model) => {
	const show = cfg.on && model.kind !== 'hidden' && ok(model.host);
	if (!show) {
		if (ok(s.root)) {
			s.root.visible = false;
			s.root.SetHasClass('ZbHidden', true);
			s.root.SetHasClass('ZbReady', false);
			s.root.SetHasClass('ZbActive', false);
			s.root.SetHasClass('ZbCooldown', false);
		}
		diagChange('overlay', 'hide:' + model.kind + ':' + cfg.on + ':' + panelId(model.host) + ':' + visOf(s.root), 'overlay hidden kind=' + model.kind + ' on=' + cfg.on + ' host=' + panelId(model.host) + ' vis=' + visOf(s.root));
		return;
	}
	const root = ensureOverlay(model.host);
	if (!ok(root)) { diag('overlay not created host=' + panelId(model.host)); return; }
	root.visible = true;
	root.SetHasClass('ZbHidden', false);
	root.SetHasClass('ZbReady', model.kind === 'ready');
	root.SetHasClass('ZbActive', model.kind === 'active');
	root.SetHasClass('ZbCooldown', model.kind === 'cooldown');
	const title = ok(s.title) ? s.title : (s.title = root.FindChild(TITLE_ID) || root.FindChildTraverse(TITLE_ID));
	const state = ok(s.state) ? s.state : (s.state = root.FindChild(STATE_ID) || root.FindChildTraverse(STATE_ID));
	const titleText = word('Zb_Title');
	if (ok(title) && title.text !== titleText) title.text = titleText;
	let body = '';
	if (model.kind === 'ready') body = word('Zb_Ready');
	else if (model.kind === 'active') body = word('Zb_Active', [String(Math.max(0, Math.ceil(model.seconds)))]);
	else body = model.seconds >= 0 ? word('Zb_Cooldown', [formatClock(model.seconds)]) : word('Zb_Cooldown', ['']).replace(/\s+$/, '');
	if (ok(state) && state.text !== body) state.text = body;
	if (s.inline && ok(state) && state.style.color !== STATE_COLOR[model.kind]) state.style.color = STATE_COLOR[model.kind];
	diagChange('overlay', 'show:' + model.kind + ':' + body + ':' + visOf(root), 'overlay shown kind=' + model.kind + ' seconds=' + model.seconds + ' text=' + body + ' vis=' + visOf(root) + ' root=' + panelId(root) + ' host=' + panelId(model.host));
};

const wanted = () => !!cfg.on;
const tick = () => {
	const s = st();
	s.timer = null;
	if (!wanted()) { setOverlay(s, { kind: 'hidden', seconds: -1, host: s.host }); AddonSettings.pulse(); return; }
	const model = guard('sync', () => readState(s, clockMs())) || { kind: 'hidden', seconds: -1, host: s.host };
	setOverlay(s, model);
	if (wanted()) s.timer = $.Schedule(model.kind === 'active' || model.kind === 'cooldown' ? TICK_ACTIVE_S : TICK_IDLE_S, tick);
	AddonSettings.pulse();
};
const kick = () => { const s = st(); s.timer = cancel(s.timer); tick(); };
const stop = () => { const s = st(); s.timer = cancel(s.timer); setOverlay(s, { kind: 'hidden', seconds: -1, host: s.host }); };
const settingsChanged = () => { if (wanted()) kick(); else stop(); };

const SCHEMA = {
	id: 'deadlock_zipline_boost', title: '#Zb_Tab', prefix: 'Zb', strings: STRINGS,
	placement: 'addons', author: 'luxus', toggle: 'on',
	resetLabel: '#Zb_Reset',
	controls: [
		{ key: 'on', type: 'toggle', title: '#Zb_Enable', desc: '#Zb_EnableDesc', default: BOOST_DEFAULT }
	]
};

AddonSettings.register(SCHEMA, values => { Object.assign(cfg, values); settingsChanged(); });
AddonSettings.ride(() => !!st().timer);
if (wanted()) kick();
say(VERSION + ' loaded (' + AddonSettings.language() + ')');

$.ZbTest = { parseSeconds, formatClock, VERSION, TICK_IDLE_S, TICK_ACTIVE_S, ACTIVE_MS, COOLDOWN_MS, BOOST_DEFAULT, HINT_ID, BUFF_ID };
