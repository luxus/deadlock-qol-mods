// HUD registrar. hud_join_team.xml is part of the always-loaded HUD, so the
// ADDONS block exists in the main menu. No commend targets here.
const publish = v => {
	dcBag().on = !!(v && v.on);
};
try {
	AddonSettings.register(COMMEND_SCHEMA({ on: true }), publish);
	$.Msg('DC-diag register hud');
} catch (e) {
	try { $.Msg('Deadlock Commend: hud register error ' + e); } catch (e2) { /* no console */ }
}
