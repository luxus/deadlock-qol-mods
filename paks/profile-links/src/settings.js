try {
	plApply({ on: true, statlocker: true, deadchaps: true });
	AddonSettings.register(PL_SCHEMA, plApply);
	$.Msg('Deadlock Profile Links: ' + VERSION + ' loaded (' + AddonSettings.language() + ')');
} catch (e) {
	try { $.Msg('Deadlock Profile Links: settings ' + e); } catch (e2) { /* no console */ }
}
