const plTop = () => {
	let a = $.GetContextPanel(), last = a;
	while (a && a.IsValid && a.IsValid()) { last = a; a = a.GetParent(); }
	return last;
};
const plWalk = (root, fn) => {
	const stack = [root];
	let n = 0;
	while (stack.length && n < 8000) {
		const p = stack.pop();
		n++;
		if (!p || !p.IsValid || !p.IsValid()) continue;
		fn(p);
		const c = p.GetChildCount ? p.GetChildCount() : 0;
		for (let i = 0; i < c; i++) stack.push(p.GetChild(i));
	}
};
const plApply = v => {
	const on = !!(v && v.on);
	const stat = !v || v.statlocker !== false;
	const chaps = !v || v.deadchaps !== false;
	const root = plTop();
	if (!root) return;
	plWalk(root, p => {
		let type = '';
		try { type = String(p.paneltype || ''); } catch (e) { type = ''; }
		let score = false;
		try { score = !!(p.BHasClass && p.BHasClass('PlScoreboard')); } catch (e2) { score = false; }
		if (type !== 'CitadelProfilePage' && type !== 'CitadelProfileCard' && !score) return;
		p.SetHasClass('PlOff', !on);
		p.SetHasClass('PlNoStatlocker', !stat);
		p.SetHasClass('PlNoDeadchaps', !chaps);
	});
};
