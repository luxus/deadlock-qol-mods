// SG-P13: this layout sets the three classes on its own context panel only.
const plPanel = $.GetContextPanel();
const plApply = v => {
	if (!plPanel || !plPanel.IsValid || !plPanel.IsValid()) return;
	const on = !!(v && v.on);
	const stat = !v || v.statlocker !== false;
	const chaps = !v || v.deadchaps !== false;
	plPanel.SetHasClass('PlOff', !on);
	plPanel.SetHasClass('PlNoStatlocker', !stat);
	plPanel.SetHasClass('PlNoDeadchaps', !chaps);
};
