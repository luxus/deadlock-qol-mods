// Rank image cache shared by the profile page and the profile card.
// A new mod version drops the previous cache.
const plBag = () => {
	let root = null;
	try { if (typeof GameUI !== 'undefined' && GameUI.CustomUIConfig) root = GameUI.CustomUIConfig(); } catch (e) { root = null; }
	if (!root || typeof root !== 'object') {
		if (!$.PlStore) $.PlStore = {};
		root = $.PlStore;
	}
	if (!root.PlLinks || root.PlLinks.v !== '2.0.0') root.PlLinks = { v: '2.0.0', images: {}, fails: {} };
	return root.PlLinks;
};
