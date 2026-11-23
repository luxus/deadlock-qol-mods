// One schema for both registrations: the profile/post-game layouts (settings.js) and the HUD registrar (register.js).
const PL_SCHEMA = {
	author: 'luxus', toggle: 'on', placement: 'addons',
	id: 'deadlock_profile_links', title: '#Pl_Tab', prefix: 'Pl', strings: STRINGS,
	resetLabel: '#Pl_Reset',
	controls: [
		{ key: 'on', type: 'toggle', title: '#Pl_Enable', desc: '#Pl_EnableDesc', default: true },
		{ key: 'statlocker', type: 'toggle', section: '#Pl_Sites', title: '#Pl_Statlocker', desc: '#Pl_StatlockerDesc', default: true, needs: ['on'] },
		{ key: 'deadchaps', type: 'toggle', section: '#Pl_Sites', title: '#Pl_Deadchaps', desc: '#Pl_DeadchapsDesc', default: true, needs: ['on'] }
	]
};
