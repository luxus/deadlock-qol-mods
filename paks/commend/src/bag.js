// The switch is shared so the registrar and the post-game layout agree.
// Match id and All belong to one layout instance (SG-C4), not this bag.
const dcBag = () => {
	let root = null;
	try { if (typeof GameUI !== 'undefined' && GameUI.CustomUIConfig) root = GameUI.CustomUIConfig(); } catch (e) { root = null; }
	if (!root || typeof root !== 'object') {
		if (!$.DcStore) $.DcStore = {};
		root = $.DcStore;
	}
	const prev = root.DcCommend;
	if (!prev || prev.v !== '2.0.0' || 'match' in prev || 'all' in prev) root.DcCommend = { v: '2.0.0', on: !prev || prev.on !== false };
	return root.DcCommend;
};
