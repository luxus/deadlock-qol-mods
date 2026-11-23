// Settings glue. The master switch is published on the shared bag and applied
// to this layout's buttons. SPEC-OPEN O-C6: no ClientUI_FireOutput mute poll.
const publish = v => {
	const bag = dcBag();
	bag.on = !!(v && v.on);
	try { if (typeof $.DcApply === 'function') $.DcApply(); } catch (e) { /* layout has no rows */ }
};
try {
	AddonSettings.register(COMMEND_SCHEMA({ on: true }), publish);
	$.Msg('Deadlock Commend: 2.0.0 loaded (' + AddonSettings.language() + ')');
} catch (e) {
	try { $.Msg('Deadlock Commend: settings ' + e); } catch (e2) { /* no console */ }
}
