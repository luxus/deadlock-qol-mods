// Shared across the HUD registrar and every post-game layout. A layout reload
// keeps the match id and the All flag here; the class on the root is the copy
// the spec also requires.
const dcBag = () => {
	let root = null;
	try { if (typeof GameUI !== 'undefined' && GameUI.CustomUIConfig) root = GameUI.CustomUIConfig(); } catch (e) { root = null; }
	if (!root || typeof root !== 'object') {
		if (!$.DcStore) $.DcStore = {};
		root = $.DcStore;
	}
	if (!root.DcCommend || root.DcCommend.v !== '2.0.0') root.DcCommend = { v: '2.0.0', on: true, match: '', all: false };
	return root.DcCommend;
};
