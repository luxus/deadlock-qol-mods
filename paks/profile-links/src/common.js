// Shared panel helpers and external profile URLs (bundled into profile_links.js and profile_links_scoreboard.js).
const ok = p => !!(p && p.IsValid && p.IsValid());
const has = (p, c) => { try { return ok(p) && p.BHasClass && p.BHasClass(c); } catch (e) { return false; } };
const textOf = p => { if (!ok(p)) return ''; try { return String(p.text || ''); } catch (e) { return ''; } };
const openUrl = url => {
	// SPEC-OPEN O-P7: try the Panorama browser event, then the Steam overlay.
	try { $.DispatchEvent('ExternalBrowserGoToURL', url); return; } catch (e) { /* overlay next */ }
	try { if (typeof SteamOverlayAPI !== 'undefined' && SteamOverlayAPI.OpenURL) SteamOverlayAPI.OpenURL(url); } catch (e2) { /* nowhere to open */ }
};
const statUrl = id => id ? 'https://statlocker.gg/profile/' + encodeURIComponent(id) : '';
const chapsUrl = id => id ? 'https://www.deadchaps.gg/player/' + encodeURIComponent(id) + '/' : '';
