const VERSION = '2.0.0';
const CACHE_MS = 600000;
const FAIL_MS = 15000;
const PAGE_LOCK_MS = 2000;
const CARD_FAST_MS = 750;
const CARD_SLOW_MS = 1500;
const CARD_GIVEUP_MS = 5000;
const WATCH_MS = 8000;

const ok = p => !!(p && p.IsValid && p.IsValid());
const has = (p, c) => { try { return ok(p) && p.BHasClass && p.BHasClass(c); } catch (e) { return false; } };
const textOf = p => { if (!ok(p)) return ''; try { return String(p.text || ''); } catch (e) { return ''; } };
const nowMs = () => { try { if (typeof $.PlClock === 'function') return $.PlClock(); } catch (e) { /* tests */ } return Date.now(); };
const cancel = h => { if (h) { try { $.CancelScheduled(h); } catch (e) { /* ran */ } } return null; };
const ctx = $.GetContextPanel();

const openUrl = url => {
	// SPEC-OPEN O-P7: try the Panorama browser event, then the Steam overlay.
	try { $.DispatchEvent('ExternalBrowserGoToURL', url); return; } catch (e) { /* overlay next */ }
	try { if (typeof SteamOverlayAPI !== 'undefined' && SteamOverlayAPI.OpenURL) SteamOverlayAPI.OpenURL(url); } catch (e2) { /* nowhere to open */ }
};
const statUrl = id => id ? 'https://statlocker.gg/profile/' + encodeURIComponent(id) : '';
const chapsUrl = id => id ? 'https://www.deadchaps.gg/player/' + encodeURIComponent(id) + '/' : '';
const rankUrl = id => id ? 'https://api.deadlock-api.com/v1/players/' + encodeURIComponent(id) + '/rank/image?format=webp' : '';

const textsUnder = root => {
	const out = [];
	const stack = [root];
	let n = 0;
	while (stack.length && n < 400) {
		const p = stack.pop();
		n++;
		if (!ok(p)) continue;
		const t = textOf(p);
		if (t) out.push(t);
		const c = p.GetChildCount ? p.GetChildCount() : 0;
		for (let i = 0; i < c; i++) stack.push(p.GetChild(i));
	}
	return out;
};
const flagged = (p, classes, depth) => {
	const wantMenu = classes.indexOf('ContextMenuBody') >= 0;
	for (let n = 0, a = p; ok(a) && n < depth; a = a.GetParent(), n++) {
		if (wantMenu && (a.id === 'ContextMenuBody' || has(a, 'ContextMenuBody'))) return true;
		for (let i = 0; i < classes.length; i++) if (has(a, classes[i])) return true;
	}
	return false;
};
// SPEC-OPEN O-P3: isLocalPlayer is read with that spelling. Build 6864 does not set it in layout files.
const localPlayer = () => flagged(ctx, ['isLocalPlayer'], 6);
const inMenu = () => flagged(ctx, ['ContextMenuBody'], 12);

const setClass = (p, name, on) => { if (ok(p) && has(p, name) !== on) p.SetHasClass(name, on); };
const showRank = (box, mode) => {
	if (!ok(box)) return;
	setClass(box, 'PlIdle', mode === 'off');
	setClass(box, 'PlLoading', mode === 'loading');
	setClass(box, 'PlReady', mode === 'ready');
	setClass(box, 'PlMissing', mode === 'missing');
};
const showLink = (p, on) => {
	if (!ok(p)) return;
	setClass(p, 'PlPending', !on);
	if (p.enabled !== on) p.enabled = on;
	if (p.hittest !== on) p.hittest = on;
};

const requestRank = (box, id, gen, state) => {
	const bag = plBag();
	const failed = bag.fails[id];
	if (failed && nowMs() - failed < FAIL_MS) { showRank(box, 'missing'); state.failed = true; return; }
	let entry = bag.images[id];
	let url = entry && nowMs() - entry.at < CACHE_MS ? entry.url : '';
	if (!url) url = rankUrl(id);
	bag.images[id] = { url: url, at: nowMs() };
	const host = ok(box) && box.FindChild ? (box.FindChild('PlRankImage') || box) : box;
	let img = ok(host) && host.FindChild ? host.FindChild('PlRankShot') : null;
	if (ok(img) && img.GetAttributeString('rankurl', '') === url && img.GetAttributeString('ready', '') === '1') {
		showRank(box, 'ready');
		state.failed = false;
		return;
	}
	showRank(box, 'loading');
	if (ok(img)) { try { img.DeleteAsync(0); } catch (e) { /* replaced */ } img = null; }
	try { img = $.CreatePanel('Image', host, 'PlRankShot'); } catch (e2) { bag.fails[id] = nowMs(); showRank(box, 'missing'); state.failed = true; return; }
	if (img.SetScaling) img.SetScaling('stretch-to-fit-preserve-aspect');
	img.hittest = false;
	try { img.style.visibility = 'collapse'; } catch (e3) { /* no style */ }
	img.SetAttributeString('rankurl', url);
	img.SetAttributeString('ready', '');
	const token = gen;
	$.RegisterEventHandler('ImageLoaded', img, () => {
		if (token !== state.gen || state.id !== id || !ok(img)) return;
		img.SetAttributeString('ready', '1');
		try { img.style.visibility = 'visible'; } catch (e) { /* no style */ }
		showRank(box, 'ready');
		state.failed = false;
	});
	$.RegisterEventHandler('ImageFailedLoad', img, () => {
		if (token !== state.gen) return;
		bag.fails[id] = nowMs();
		state.failed = true;
		showRank(box, 'missing');
		try { img.DeleteAsync(0); } catch (e) { /* already gone */ }
	});
	try { img.SetImage(url); } catch (e4) { bag.fails[id] = nowMs(); showRank(box, 'missing'); state.failed = true; }
};

const pageMain = () => {
	const rank = ctx.FindChildTraverse('PlRank');
	const stat = ctx.FindChildTraverse('PlStatlocker');
	const chaps = ctx.FindChildTraverse('PlDeadchaps');
	const probes = ['PlAccountId', 'PlAccountIdDirect', 'PlFriendCode'].map(id => ctx.FindChildTraverse(id));
	const friend = ctx.FindChildTraverse('FriendID') || ((ctx.FindChildrenWithClassTraverse && ctx.FindChildrenWithClassTraverse('FriendID')) || [])[0];
	const self = ctx.FindChildTraverse('SelfName');
	const user = ctx.FindChildTraverse('UserName');
	const nick = ctx.FindChildTraverse('UserNickname');
	const st = { phase: 'seek', prev: null, since: 0, timer: null, id: '', fp: '', inside: false, leave: null, gen: 0, holdAt: 0, watchEnd: 0, failed: false };

	const read = () => {
		const sources = probes.map(textOf);
		if (ok(friend)) sources.push(textOf(friend));
		if (ok(self)) textsUnder(self).forEach(t => sources.push(t));
		const id = agreeIds(sources);
		const name = textOf(self);
		const fp = id + '|' + textOf(user) + '|' + textOf(nick) + '|' + (localPlayer() ? '1' : '0');
		return { id: id, name: name, fp: fp };
	};
	const links = on => { showLink(stat, on); showLink(chaps, on); };
	const arm = sec => { st.timer = cancel(st.timer); if (ok(ctx)) st.timer = $.Schedule(sec, step); };
	const restart = () => {
		st.phase = 'seek';
		st.prev = null;
		st.since = 0;
		st.gen++;
		links(false);
		showRank(rank, 'loading');
		arm(0.05);
	};
	const settle = row => {
		st.phase = 'hold';
		st.id = row.id;
		st.fp = row.fp;
		st.holdAt = nowMs();
		st.watchEnd = st.holdAt + WATCH_MS;
		links(!!statUrl(row.id));
		requestRank(rank, row.id, st.gen, st);
		arm(0.2);
	};
	function step() {
		st.timer = null;
		if (!ok(ctx)) return;
		const row = read();
		const t = nowMs();
		if (st.phase === 'hold') {
			if (row.id !== st.id) { restart(); return; }
			if (t < st.watchEnd) arm(t - st.holdAt < 2500 ? 0.2 : 0.5);
			return;
		}
		if (row.id && st.prev && st.prev.id === row.id && st.prev.name === row.name) {
			if (!st.since) st.since = t;
			if (t - st.since >= PAGE_LOCK_MS) settle(row);
			else arm(0.5);
			return;
		}
		st.prev = row.id ? row : null;
		st.since = row.id ? t : 0;
		links(false);
		showRank(rank, 'loading');
		arm(0.5);
	}
	const press = which => {
		const row = read();
		if (st.phase !== 'hold' || !row.id || row.id !== st.id || row.fp !== st.fp) return;
		const url = which === 'chaps' ? chapsUrl(row.id) : statUrl(row.id);
		if (url) openUrl(url);
	};
	if (ok(stat)) stat.SetPanelEvent('onactivate', () => press('stat'));
	if (ok(chaps)) chaps.SetPanelEvent('onactivate', () => press('chaps'));
	// SPEC-OPEN O-P2: child crossings fire out then over. A 0.05 s gap treats that as one stay.
	ctx.SetPanelEvent('onmouseover', () => {
		st.leave = cancel(st.leave);
		if (st.inside) return;
		st.inside = true;
		restart();
	});
	ctx.SetPanelEvent('onmouseout', () => {
		st.leave = cancel(st.leave);
		st.leave = $.Schedule(0.05, () => { st.leave = null; st.inside = false; });
	});
	restart();
};

const cardMain = () => {
	const rank = ctx.FindChildTraverse('PlRank');
	const stat = ctx.FindChildTraverse('PlStatlocker');
	const chaps = ctx.FindChildTraverse('PlDeadchaps');
	const probe = ctx.FindChildTraverse('PlAccountId');
	const account = (ctx.FindChildrenWithClassTraverse && (ctx.FindChildrenWithClassTraverse('AccountID') || [])[0]) || null;
	const user = ctx.FindChildTraverse('UserName');
	const nick = ctx.FindChildTraverse('UserNickname');
	const rich = ctx.FindChildTraverse('UserRichPresence');
	const st = { phase: 'seek', prev: null, since: 0, started: nowMs(), watchAt: 0, seenLoad: false, confirmed: '', id: '', timer: null, gen: 0, seeking: true, failed: false };

	const read = () => {
		const id = agreeIds([textOf(probe), textOf(account)]);
		const name = textOf(user);
		const status = textOf(rich);
		const local = localPlayer();
		const loading = has(ctx, 'Loading');
		const fp = id + '|' + name + '|' + textOf(nick) + '|' + (local ? '1' : '0');
		return { id: id, name: name, status: status, local: local, loading: loading, fp: fp };
	};
	const links = on => {
		const show = on && inMenu();
		showLink(stat, show);
		showLink(chaps, show);
	};
	const arm = sec => { st.timer = cancel(st.timer); if (ok(ctx)) st.timer = $.Schedule(sec, step); };
	const hide = () => { showRank(rank, 'off'); links(false); };
	const seek = () => {
		st.phase = 'seek';
		st.seeking = true;
		st.prev = null;
		st.since = 0;
		st.started = nowMs();
		st.gen++;
		hide();
		arm(0.1);
	};
	const settle = row => {
		st.phase = 'hold';
		st.seeking = false;
		st.id = row.id;
		st.confirmed = row.fp;
		st.watchAt = nowMs();
		links(!!statUrl(row.id));
		requestRank(rank, row.id, st.gen, st);
		arm(0.016);
	};
	function step() {
		st.timer = null;
		if (!ok(ctx)) return;
		const row = read();
		const t = nowMs();
		if (row.loading) st.seenLoad = true;
		if (st.phase === 'hold') {
			if (row.loading || row.id !== st.id || row.fp !== st.confirmed) { seek(); return; }
			arm(t - st.watchAt < WATCH_MS ? 0.016 : 0.1);
			return;
		}
		if (st.phase === 'giveup') {
			if (row.loading || (row.id && row.fp !== st.confirmed)) { seek(); return; }
			arm(t - st.watchAt < WATCH_MS ? 0.016 : 0.1);
			return;
		}
		const fresh = row.local || (st.seenLoad && !row.loading) || row.fp !== st.confirmed;
		const same = st.prev && st.prev.fp === row.fp && st.prev.status === row.status && st.prev.id === row.id && st.prev.name === row.name && st.prev.local === row.local;
		const wait = row.local || row.status ? CARD_FAST_MS : CARD_SLOW_MS;
		if (!row.loading && row.id && row.name && fresh && same && st.since && t - st.since >= wait) { settle(row); return; }
		if (!same) { st.prev = row; st.since = t; }
		if (t - st.started >= CARD_GIVEUP_MS) { st.phase = 'giveup'; st.seeking = false; st.watchAt = t; hide(); }
		arm(0.1);
	}
	const press = which => {
		if (!inMenu() || st.phase !== 'hold') return;
		const row = read();
		if (!row.id || row.id !== st.id || row.fp !== st.confirmed || row.loading) return;
		const url = which === 'chaps' ? chapsUrl(row.id) : statUrl(row.id);
		if (url) openUrl(url);
	};
	if (ok(stat)) stat.SetPanelEvent('onactivate', () => press('stat'));
	if (ok(chaps)) chaps.SetPanelEvent('onactivate', () => press('chaps'));
	ctx.SetPanelEvent('onmouseover', () => {
		if (st.seeking) return;
		const row = read();
		if (st.phase === 'hold' && row.fp === st.confirmed) {
			if (st.failed) showRank(rank, 'missing');
			return;
		}
		seek();
	});
	hide();
	arm(0.01);
};

let type = '';
try { type = String(ctx.paneltype || ''); } catch (e) { type = ''; }
if (type === 'CitadelProfileCard') cardMain();
else pageMain();

$.PlTest = { VERSION: VERSION, pageId: pageId, agreeIds: agreeIds, boardId: boardId, statUrl: statUrl, chapsUrl: chapsUrl, rankUrl: rankUrl, CACHE_MS: CACHE_MS, FAIL_MS: FAIL_MS };
