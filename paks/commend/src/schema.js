// Settings schema shared by the post-game script and the HUD registrar.
const COMMEND_SCHEMA = defaults => ({
	id: 'deadlock_commend', title: '#Dc_Tab', prefix: 'Dc', strings: STRINGS,
	placement: 'addons', author: 'luxus', toggle: 'on',
	resetLabel: '#Dc_Reset',
	controls: [
		{ key: 'on', type: 'toggle', title: '#Dc_Commend', desc: '#Dc_Commend_Desc', default: defaults.on }
	]
});
