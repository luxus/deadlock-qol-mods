const TRIES = 9;
const GAP_S = 0.15;
const attr = (p, key) => { if (!ok(p) || !p.GetAttributeString) return ''; try { return p.GetAttributeString(key, ''); } catch (e) { return ''; } };
const prop = (p, key) => { if (!ok(p)) return ''; try { const v = p[key]; return v == null ? '' : String(v); } catch (e) { return ''; } };
const labelText = p => { const t = textOf(p); return t || attr(p, 'text'); };
const ctx = $.GetContextPanel();

const rowId = row => {
	const name = ok(row) && row.FindChildTraverse ? row.FindChildTraverse('PlayerName') : null;
	const sources = [];
	['PlAccountId', 'PlAccountIdDirect', 'PlPlayerAccountId', 'PlPlayerAccountIdRoot'].forEach(id => {
		sources.push(labelText(ok(row) && row.FindChildTraverse ? row.FindChildTraverse(id) : null));
	});
	['accountid', 'account_id', 'player_account_id'].forEach(key => sources.push(attr(name, key)));
	['accountid', 'account_id', 'player_account_id'].forEach(key => sources.push(prop(name, key)));
	['account_id', 'accountid', 'player_account_id'].forEach(key => sources.push(attr(row, key)));
	['accountid', 'account_id', 'player_account_id'].forEach(key => sources.push(prop(row, key)));
	for (let i = 0; i < sources.length; i++) {
		const id = boardId(sources[i]);
		if (id) return id;
	}
	return '';
};

const state = { n: 0, timer: null };
// SPEC-OPEN O-P4: rows that appear after 1.2 s are not bound. Nine tries, then stop.
const pass = () => {
	state.timer = null;
	if (!ok(ctx) || !has(ctx, 'PlScoreboard')) return;
	const rows = ctx.FindChildrenWithClassTraverse ? (ctx.FindChildrenWithClassTraverse('Player') || []) : [];
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		if (has(row, 'TotalsRow')) continue;
		const stat = row.FindChildTraverse ? row.FindChildTraverse('PlStatlocker') : null;
		const chaps = row.FindChildTraverse ? row.FindChildTraverse('PlDeadchaps') : null;
		[[stat, statUrl], [chaps, chapsUrl]].forEach(pair => {
			const button = pair[0];
			if (!ok(button) || button.GetAttributeString('plBound', '') === '1') return;
			button.SetAttributeString('plBound', '1');
			button.SetPanelEvent('onactivate', () => {
				const id = rowId(row);
				if (!id) return;
				openUrl(pair[1](id));
			});
		});
	}
	state.n++;
	if (state.n < TRIES) state.timer = $.Schedule(GAP_S, pass);
};
if (ok(ctx)) pass();
$.PlBoard = { VERSION: VERSION, TRIES: TRIES, GAP_S: GAP_S, rowId: rowId };
