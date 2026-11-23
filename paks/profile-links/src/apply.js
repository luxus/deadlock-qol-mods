// SG-P13: this layout sets the three classes on its own context panel only.
const plApply = v => {
	const panel = $.GetContextPanel();
	if (!panel || !panel.IsValid || !panel.IsValid()) return;
	const on = !!(v && v.on);
	const stat = !v || v.statlocker !== false;
	const chaps = !v || v.deadchaps !== false;
	panel.SetHasClass('PlOff', !on);
	panel.SetHasClass('PlNoStatlocker', !stat);
	panel.SetHasClass('PlNoDeadchaps', !chaps);
};
