// Shared Steam account-id parsing (bundled into lobby-ranks and profile-links).
const ACCOUNT_MIN = 100000;
const ACCOUNT_MAX = 4294967295;
const STEAM64_BASE = '76561197960265728';

const stripZeros = s => { s = String(s || '').replace(/^0+/, ''); return s || '0'; };
const cmpDec = (a, b) => {
	a = stripZeros(a); b = stripZeros(b);
	if (a.length !== b.length) return a.length > b.length ? 1 : -1;
	return a === b ? 0 : (a > b ? 1 : -1);
};
const subDec = (a, b) => {
	a = stripZeros(a); b = stripZeros(b);
	if (cmpDec(a, b) < 0) return '';
	let out = '', borrow = 0;
	for (let i = 0; i < a.length; i++) {
		const ai = a.length - 1 - i, bi = b.length - 1 - i;
		let d = Number(a.charAt(ai)) - borrow - (bi >= 0 ? Number(b.charAt(bi)) : 0);
		if (d < 0) { d += 10; borrow = 1; } else borrow = 0;
		out = String(d) + out;
	}
	return stripZeros(out);
};
const inRange = id => { if (!/^\d{1,10}$/.test(id)) return false; const n = Number(id); return isFinite(n) && n >= ACCOUNT_MIN && n <= ACCOUNT_MAX; };
const fromSteam64 = text => {
	const t = String(text || '');
	if (!/^\d{17}$/.test(t)) return '';
	const id = subDec(t, STEAM64_BASE);
	return inRange(id) ? id : '';
};
const tidy = value => String(value === undefined || value === null ? '' : value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
const pushUnique = (found, id) => { if (id && found.indexOf(id) < 0) found.push(id); };
const scanSteamTokens = (text, found) => {
	let m;
	const re3 = /\[U:1:(\d+)\]/gi;
	while ((m = re3.exec(text))) { const id = stripZeros(m[1]); pushUnique(found, inRange(id) ? id : ''); }
	const re64 = /(^|\D)(\d{17})(?!\d)/g;
	while ((m = re64.exec(text))) pushUnique(found, fromSteam64(m[2]));
};
const parseExactAccount = text => {
	const steam3 = /^\[U:1:(\d+)\]$/i.exec(text);
	if (steam3) { const id = stripZeros(steam3[1]); return inRange(id) ? id : ''; }
	if (/^\d{17}$/.test(text)) return fromSteam64(text);
	if (/^\d{1,10}$/.test(text)) { const id = stripZeros(text); return inRange(id) ? id : ''; }
	return null;
};
