// The switch is shared so the registrar and the post-game layout agree.
// Match id and All belong to one layout instance (SG-C4), not this bag.
const dcBag = () => {
	let root = null;
	try { if (typeof GameUI !== 'undefined' && GameUI.CustomUIConfig) root = GameUI.CustomUIConfig(); } catch (e) { root = null; }
	if (!root || typeof root !== 'object') {
		if (!$.DcStore) $.DcStore = {};
		root = $.DcStore;
	}
	if (!root.DcCommend || root.DcCommend.v !== '2.0.0' || 'match' in root.DcCommend || 'all' in root.DcCommend) root.DcCommend = { v: '2.0.0', on: root.DcCommend && root.DcCommend.on !== false };
	return root.DcCommend;
};
