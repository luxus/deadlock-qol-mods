// SPEC-OPEN O-P5: hidden {i:…} bindings are read first. Visible FriendID and AccountID text are the fallback.
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
const fromSteam64 = text => { if (!/^\d{17}$/.test(text)) return ''; const id = subDec(text, STEAM64_BASE); return inRange(id) ? id : ''; };
const tidy = value => String(value == null ? '' : value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
const push = (found, id) => { if (id && found.indexOf(id) < 0) found.push(id); };

// One profile or card source. Empty, a token, or more than one candidate is no id.
const pageId = value => {
	const text = tidy(value);
	if (!text || /[{}]/.test(text) || text.charAt(0) === '#' || /^nan$/i.test(text)) return '';
	const whole3 = /^\[U:1:(\d+)\]$/i.exec(text);
	if (whole3) { const id = stripZeros(whole3[1]); return inRange(id) ? id : ''; }
	if (/^\d{17}$/.test(text)) return fromSteam64(text);
	if (/^\d{1,10}$/.test(text)) { const id = stripZeros(text); return inRange(id) ? id : ''; }
	const found = [];
	let m;
	const re3 = /\[U:1:(\d+)\]/gi;
	while ((m = re3.exec(text))) { const id = stripZeros(m[1]); push(found, inRange(id) ? id : ''); }
	const re64 = /(^|\D)(\d{17})(?!\d)/g;
	while ((m = re64.exec(text))) push(found, fromSteam64(m[2]));
	if (/account id|friend code/i.test(text)) {
		const phrase = /(?:account id|friend code)\s*[:#-]?\s*([0-9\s.,'_-]*)$/i.exec(text);
		if (phrase && /^[0-9\s.,'_-]*$/.test(phrase[1])) {
			const digits = stripZeros(phrase[1].replace(/\D/g, ''));
			push(found, inRange(digits) ? digits : '');
		}
		const reShort = /(^|\D)(\d{6,10})(?!\d)/g;
		while ((m = reShort.exec(text))) { const id = stripZeros(m[2]); push(found, inRange(id) ? id : ''); }
	}
	return found.length === 1 ? found[0] : '';
};

// Several sources. One distinct id wins. Two different ids are a conflict.
const agreeIds = list => {
	const ids = [];
	(list || []).forEach(v => push(ids, pageId(v)));
	return ids.length === 1 ? ids[0] : '';
};

// Scoreboard source. First valid 6 to 10 digit run wins. The caller walks sources in order.
const boardId = value => {
	const text = tidy(value).replace(/\D/g, '');
	if (!/^\d{6,10}$/.test(text)) return '';
	const id = stripZeros(text);
	return inRange(id) ? id : '';
};
