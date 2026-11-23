// HUD registrar. hud_match_start.xml is loaded in the main menu and in a match,
// so the ADDONS block exists before a profile or a scoreboard does.
try {
	AddonSettings.register(PL_SCHEMA, () => {});
	$.Msg('Deadlock Profile Links: 2.0.0 register hud');
} catch (e) {
	try { $.Msg('Deadlock Profile Links: hud register error ' + e); } catch (e2) { /* no console */ }
}
